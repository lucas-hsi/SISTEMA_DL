import logging
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.ad import Ad
from app.models.compatibility import Compatibility
from app.models.competitor_price import CompetitorPrice
from app.schemas.ad import QuickGenerateRequest, QuickGenerateResponse, MarketplaceType
from app.core.config import settings
from app.services.openai_service import openai_service
from app.services.image_processing_service import image_processing_service
from app.services.sku_qr_service import sku_qr_service
from app.services.part_number_enrichment_service import get_enrichment_service

# Configurar logging
logger = logging.getLogger(__name__)


class QuickAdService:
    """Serviço para geração rápida de anúncios com IA e processamento de imagens"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def quick_generate_ad(self, request: QuickGenerateRequest, 
                               user_id: int, company_id: int) -> QuickGenerateResponse:
        """
        Gera anúncio rapidamente com PN + fotos usando IA
        
        Args:
            request: Dados da requisição
            user_id: ID do usuário
            company_id: ID da empresa
            
        Returns:
            QuickGenerateResponse: Resposta com dados do anúncio gerado
        """
        start_time = datetime.now()
        
        # Log estruturado de início
        logger.info("[QUICK_GENERATE_START] Iniciando geração rápida", extra={
            "path": "business",
            "part_number": request.part_number,
            "user_id": user_id,
            "company_id": company_id,
            "has_custom_prompt": bool(request.custom_prompt),
            "process_background": request.process_background,
            "images_count": len(request.images)
        })
        
        try:
            # 1. Verificar/criar produto com idempotência
            logger.info("[QUICK_GENERATE_STEP] Verificando/criando produto", extra={
                "path": "business",
                "step": "product_upsert",
                "part_number": request.part_number
            })
            
            product = await self._upsert_product_by_part_number(
                request.part_number, company_id
            )
            
            # 2. Gerar conteúdo do anúncio com IA PRIMEIRO (antes de qualquer persistência)
            logger.info("[QUICK_GENERATE_STEP] Gerando conteúdo com IA", extra={
                "path": "provider",
                "step": "ai_generation",
                "part_number": request.part_number
            })
            
            # Usar marketplace padrão para geração
            default_marketplace = MarketplaceType.MERCADO_LIVRE
            ai_prompt, ai_output = await self._generate_ad_content_with_ai(
                product, default_marketplace, request.custom_prompt
            )
            
            # 3. Processar imagens se solicitado (só após IA validada)
            logger.info("[QUICK_GENERATE_STEP] Processando imagens", extra={
                "path": "business",
                "step": "image_processing",
                "process_background": request.process_background,
                "images_count": len(request.images)
            })
            
            processed_images = []
            if request.process_background:
                processed_images = image_processing_service.process_multiple_images(
                    request.images, max_images=6
                )
            else:
                processed_images = request.images[:6]
            
            # 4. Salvar imagens do produto
            await self._save_product_images(product.id, processed_images)
            
            # 5. Criar anúncio
            logger.info("[QUICK_GENERATE_STEP] Criando anúncio", extra={
                "path": "business",
                "step": "ad_creation",
                "product_id": product.id
            })
            
            ad = await self._create_ad_from_ai_output(
                product, ai_output, ai_prompt, default_marketplace, user_id, company_id
            )
            
            # 6. Gerar SKU e QR code
            logger.info("[QUICK_GENERATE_STEP] Gerando SKU e QR code", extra={
                "path": "business",
                "step": "sku_qr_generation",
                "ad_id": ad.id
            })
            
            sku, qr_path = sku_qr_service.generate_sku_and_qr(
                self.db, company_id, request.part_number, product.id, ad.id
            )
            
            # 7. Atualizar anúncio com SKU e QR
            ad.sku_generated = sku
            ad.qr_code_path = qr_path
            
            # 8. Validar resultado
            validation_flags = self._validate_ad_quality(ad, product)
            ad.validation_flags = validation_flags
            
            # 9. Commit final após todas as operações serem bem-sucedidas
            self.db.commit()
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Log estruturado de sucesso
            logger.info("[QUICK_GENERATE_SUCCESS] Anúncio gerado com sucesso", extra={
                "path": "business",
                "status": "success",
                "part_number": request.part_number,
                "ad_id": ad.id,
                "product_id": product.id,
                "sku": sku,
                "processing_time": processing_time,
                "marketplace": default_marketplace.value
            })
            
            return QuickGenerateResponse(
                success=True,
                ad_id=ad.id,
                product_id=product.id,
                sku_generated=sku,
                qr_code_path=qr_path,
                title=ad.title,
                description=ad.description,
                processed_images=processed_images,
                validation_flags=validation_flags,
                message="Anúncio gerado com sucesso",
                processing_time=processing_time
            )
            
        except ValueError as e:
            # Erros específicos da OpenAI ou validação de negócio
            self.db.rollback()
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Log estruturado de erro de provedor
            logger.error("[QUICK_GENERATE_ERROR] Erro de provedor/validação", extra={
                "path": "provider",
                "status": "error",
                "error_type": "provider_error",
                "part_number": request.part_number,
                "marketplace": default_marketplace.value,
                "error_message": str(e),
                "processing_time": processing_time
            })
            
            # Re-raise para que a rota trate adequadamente
            raise e
            
        except Exception as e:
            self.db.rollback()
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Log estruturado de erro inesperado
            logger.error("[QUICK_GENERATE_ERROR] Erro inesperado", extra={
                "path": "business",
                "status": "error",
                "error_type": "unexpected_error",
                "part_number": request.part_number,
                "marketplace": default_marketplace.value,
                "error_message": str(e),
                "processing_time": processing_time
            })
            
            # Re-raise para que a rota trate adequadamente
            raise e
    
    async def _upsert_product_by_part_number(self, part_number: str, company_id: int) -> Product:
        """
        Cria ou atualiza produto baseado no part_number (idempotência)
        
        Args:
            part_number: Número da peça
            company_id: ID da empresa
            
        Returns:
            Product: Produto criado ou existente
        """
        try:
            # Buscar produto existente
            existing_product = self.db.query(Product).filter(
                and_(
                    Product.part_number == part_number,
                    Product.company_id == company_id
                )
            ).first()
            
            if existing_product:
                logger.info(f"Produto existente encontrado: {existing_product.id}")
                return existing_product
            
            # Enriquecer dados com IA
            enrichment_service = get_enrichment_service(self.db)
            
            # Gerar dados básicos do produto com IA
            product_data = await self._generate_product_data_with_ai(part_number)
            
            # Criar novo produto
            product = Product(
                name=product_data.get("name", f"Peça {part_number}"),
                description=product_data.get("description", ""),
                sku=sku_qr_service.generate_sku(company_id, part_number),
                part_number=part_number,
                brand=product_data.get("brand", ""),
                sale_price=Decimal(str(product_data.get("price", "0.00"))),
                stock_quantity=1,  # Estoque inicial
                company_id=company_id
            )
            
            self.db.add(product)
            self.db.flush()  # Para obter o ID
            
            # Enriquecer com compatibilidades e preços
            await self._enrich_product_with_ai(product.id, part_number)
            
            logger.info(f"Novo produto preparado: {product.id}")
            
            return product
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao fazer upsert do produto: {e}")
            raise
    
    async def _generate_product_data_with_ai(self, part_number: str) -> Dict[str, Any]:
        """
        Gera dados básicos do produto usando IA
        
        Args:
            part_number: Número da peça
            
        Returns:
            Dict[str, Any]: Dados do produto gerados pela IA
        """
        try:
            prompt = f"""
            Você é um especialista em autopeças. Analise o part number "{part_number}" e forneça:
            
            1. Nome comercial da peça
            2. Descrição técnica básica
            3. Marca provável
            4. Preço estimado no mercado brasileiro (em reais)
            
            Responda em JSON válido:
            {{
                "name": "Nome da peça",
                "description": "Descrição técnica",
                "brand": "Marca",
                "price": 150.00
            }}
            """
            
            response = openai_service.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Você é um especialista em autopeças. Sempre responda em JSON válido."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            import json
            content = response.choices[0].message.content.strip()
            
            # Tentar extrair JSON do conteúdo
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].strip()
            
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Erro ao gerar dados do produto com IA: {e}")
            # Fallback com dados básicos
            return {
                "name": f"Peça {part_number}",
                "description": f"Autopeça com part number {part_number}",
                "brand": "Genérica",
                "price": 100.00
            }
    
    async def _enrich_product_with_ai(self, product_id: int, part_number: str):
        """
        Enriquece produto com compatibilidades e preços usando IA
        
        Args:
            product_id: ID do produto
            part_number: Número da peça
        """
        try:
            enrichment_service = get_enrichment_service(self.db)
            
            # Usar o serviço existente de enriquecimento
            from app.schemas.part_number_enrichment import PartNumberEnrichRequest
            
            request = PartNumberEnrichRequest(
                product_id=product_id,
                part_number=part_number
            )
            
            result = enrichment_service.enrich_part_number(request)
            
            if result.success:
                logger.info(f"Produto {product_id} enriquecido: {result.compatibilities_added} compatibilidades, {result.competitor_prices_added} preços")
            else:
                logger.warning(f"Falha no enriquecimento do produto {product_id}: {result.message}")
                
        except Exception as e:
            logger.error(f"Erro ao enriquecer produto com IA: {e}")
            # Não falhar o processo principal por erro no enriquecimento
    
    async def _save_product_images(self, product_id: int, image_paths: List[str]):
        """
        Salva imagens do produto
        
        Args:
            product_id: ID do produto
            image_paths: Lista de caminhos das imagens
        """
        try:
            # Remover imagens existentes
            self.db.query(ProductImage).filter(
                ProductImage.product_id == product_id
            ).delete()
            
            # Adicionar novas imagens
            for i, image_path in enumerate(image_paths):
                product_image = ProductImage(
                    url=image_path,
                    order=i,
                    product_id=product_id
                )
                self.db.add(product_image)
            
            self.db.flush()
            logger.info(f"Salvas {len(image_paths)} imagens para produto {product_id}")
            
        except Exception as e:
            logger.error(f"Erro ao salvar imagens do produto: {e}")
            raise
    
    async def _generate_ad_content_with_ai(self, product: Product, marketplace: MarketplaceType, 
                                         custom_prompt: Optional[str] = None) -> Tuple[str, Dict[str, Any]]:
        """
        Gera conteúdo do anúncio usando IA
        
        Args:
            product: Produto
            marketplace: Marketplace de destino
            custom_prompt: Prompt customizado (opcional)
            
        Returns:
            Tuple[str, Dict[str, Any]]: (prompt_usado, output_da_ia)
        """
        try:
            # Usar o serviço existente de geração de anúncios
            from app.services.ad_generation_service import AdGenerationService
            from app.schemas.ad import AdGenerateRequest
            
            ad_service = AdGenerationService()
            
            request = AdGenerateRequest(
                product_id=product.id,
                marketplace=marketplace,
                custom_instructions=custom_prompt
            )
            
            result = await ad_service.generate_ad(product, request)
            
            if result:
                prompt = f"Geração de anúncio para {product.part_number} no {marketplace.value}"
                if custom_prompt:
                    prompt += f" - Instruções: {custom_prompt}"
                
                output = {
                    "title": result.title,
                    "description": result.description,
                    "suggested_price": float(result.suggested_price) if result.suggested_price else None,
                    "keywords": result.keywords,
                    "marketplace_tips": result.marketplace_tips
                }
                
                return prompt, output
            else:
                raise ValueError("Falha na geração de conteúdo com IA")
                
        except ValueError as e:
            # Erros específicos da OpenAI - propagar para tratamento adequado
            logger.error(f"[AI_GENERATION_FAILED] Falha na geração de conteúdo com IA para part_number={product.part_number}, marketplace={marketplace.value}: {e}", extra={
                "error_type": "ai_generation_failed",
                "part_number": product.part_number,
                "marketplace": marketplace.value,
                "error_message": str(e)
            })
            raise e
            
        except Exception as e:
            logger.error(f"[AI_UNEXPECTED_ERROR] Erro inesperado na geração de conteúdo para part_number={product.part_number}: {e}", extra={
                "error_type": "ai_unexpected_error",
                "part_number": product.part_number,
                "error_message": str(e)
            })
            # Para outros erros, também propagar para evitar falsos positivos
            raise ValueError(f"Falha na geração de conteúdo com IA: {str(e)}")
    
    async def _create_ad_from_ai_output(self, product: Product, ai_output: Dict[str, Any], 
                                      ai_prompt: str, marketplace: MarketplaceType, 
                                      user_id: int, company_id: int) -> Ad:
        """
        Cria anúncio baseado no output da IA
        
        Args:
            product: Produto
            ai_output: Output da IA
            ai_prompt: Prompt usado
            marketplace: Marketplace
            user_id: ID do usuário
            company_id: ID da empresa
            
        Returns:
            Ad: Anúncio criado
        """
        try:
            ad = Ad(
                title=ai_output.get("title", product.name),
                description=ai_output.get("description", product.description),
                price=Decimal(str(ai_output.get("suggested_price", product.sale_price))),
                status="DRAFT",  # Status inicial após criação
                marketplace=marketplace.value,
                product_id=product.id,
                user_id=user_id,
                company_id=company_id,
                ai_prompt=ai_prompt,
                ai_output=ai_output
            )
            
            self.db.add(ad)
            self.db.flush()  # Para obter o ID
            
            logger.info(f"Anúncio criado: {ad.id}")
            return ad
            
        except Exception as e:
            logger.error(f"Erro ao criar anúncio: {e}")
            raise
    
    def _validate_ad_quality(self, ad: Ad, product: Product) -> Dict[str, Any]:
        """
        Valida qualidade do anúncio gerado
        
        Args:
            ad: Anúncio
            product: Produto
            
        Returns:
            Dict[str, Any]: Flags de validação
        """
        flags = {
            "title_length_ok": len(ad.title) >= 10 and len(ad.title) <= 255,
            "description_exists": bool(ad.description and len(ad.description) > 20),
            "price_valid": ad.price and ad.price > 0,
            "has_images": len(product.images) > 0,
            "has_part_number": bool(product.part_number),
            "sku_generated": bool(ad.sku_generated),
            "qr_code_generated": bool(ad.qr_code_path),
            "ai_generated": bool(ad.ai_output)
        }
        
        flags["overall_quality"] = sum(flags.values()) / len(flags)
        
        return flags


def get_quick_ad_service(db: Session) -> QuickAdService:
    """Factory function para criar instância do serviço"""
    return QuickAdService(db)