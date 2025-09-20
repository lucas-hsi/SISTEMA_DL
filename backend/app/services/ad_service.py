import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from decimal import Decimal

from app.crud import crud_ad
from app.crud.crud_product import get_product_by_id
from app.models.ad import Ad
from app.models.product import Product
from app.schemas.ad import (
    AdCreate, AdUpdate, AdResponse, AdGenerateRequest, 
    AdGenerateResponse, AdListResponse, AdStatus, MarketplaceType
)
from app.services.ad_generation_service import ad_generation_service

# Configurar logging
logger = logging.getLogger(__name__)


class AdService:
    """Serviço principal para gerenciamento de anúncios"""
    
    def get_ad(self, db: Session, ad_id: int, user_id: int, company_id: int) -> Optional[AdResponse]:
        """Busca um anúncio por ID com validação de permissão"""
        ad = crud_ad.get_ad_by_id(db, ad_id=ad_id)
        
        if not ad:
            return None
            
        # Verificar se o usuário tem permissão para ver este anúncio
        if ad.company_id != company_id:
            return None
            
        return AdResponse.model_validate(ad)
    
    def get_ads_list(self, db: Session, company_id: int, user_id: int, 
                    skip: int = 0, limit: int = 100, 
                    status: Optional[AdStatus] = None,
                    marketplace: Optional[MarketplaceType] = None,
                    product_id: Optional[int] = None) -> AdListResponse:
        """Lista anúncios com filtros e paginação"""
        
        # Aplicar filtros baseados nos parâmetros
        if status:
            ads = crud_ad.get_ads_by_status(db, company_id=company_id, status=status, skip=skip, limit=limit)
            total = crud_ad.count_ads_by_status(db, company_id=company_id, status=status)
        elif marketplace:
            ads = crud_ad.get_ads_by_marketplace(db, company_id=company_id, marketplace=marketplace, skip=skip, limit=limit)
            total = crud_ad.count_ads_by_company(db, company_id=company_id)  # Aproximação
        elif product_id:
            ads = crud_ad.get_ads_by_product(db, product_id=product_id)
            ads = ads[skip:skip+limit]  # Paginação manual
            total = len(crud_ad.get_ads_by_product(db, product_id=product_id))
        else:
            ads = crud_ad.get_ads_by_company(db, company_id=company_id, skip=skip, limit=limit)
            total = crud_ad.count_ads_by_company(db, company_id=company_id)
        
        # Converter para response schema
        ad_responses = [AdResponse.model_validate(ad) for ad in ads]
        
        # Calcular paginação
        total_pages = (total + limit - 1) // limit if limit > 0 else 1
        page = (skip // limit) + 1 if limit > 0 else 1
        
        return AdListResponse(
            ads=ad_responses,
            total=total,
            page=page,
            per_page=limit,
            total_pages=total_pages
        )
    
    def create_ad(self, db: Session, ad_create: AdCreate, user_id: int, company_id: int) -> Optional[AdResponse]:
        """Cria um novo anúncio"""
        try:
            # Verificar se o produto existe e pertence à empresa
            product = get_product_by_id(db, product_id=ad_create.product_id)
            if not product or product.company_id != company_id:
                logger.error(f"Produto {ad_create.product_id} não encontrado ou não pertence à empresa {company_id}")
                return None
            
            # Verificar se já existe anúncio ativo para este produto no mesmo marketplace
            existing_ads = crud_ad.get_ads_by_product(db, product_id=ad_create.product_id)
            for existing_ad in existing_ads:
                if (existing_ad.marketplace == ad_create.marketplace and 
                    existing_ad.status == AdStatus.ACTIVE):
                    logger.warning(f"Já existe anúncio ativo para produto {ad_create.product_id} no {ad_create.marketplace}")
                    # Pode escolher retornar erro ou pausar o anúncio existente
                    break
            
            # Criar o anúncio
            ad = crud_ad.create_ad(db, obj_in=ad_create, user_id=user_id, company_id=company_id)
            
            logger.info(f"Anúncio criado: ID {ad.id} para produto {ad.product_id}")
            return AdResponse.model_validate(ad)
            
        except Exception as e:
            logger.error(f"Erro ao criar anúncio: {e}")
            return None
    
    def update_ad(self, db: Session, ad_id: int, ad_update: AdUpdate, 
                 user_id: int, company_id: int) -> Optional[AdResponse]:
        """Atualiza um anúncio existente"""
        try:
            # Buscar o anúncio
            ad = crud_ad.get_ad_by_id(db, ad_id=ad_id)
            if not ad or ad.company_id != company_id:
                return None
            
            # Atualizar
            updated_ad = crud_ad.update_ad(db, db_obj=ad, obj_in=ad_update)
            
            logger.info(f"Anúncio {ad_id} atualizado")
            return AdResponse.model_validate(updated_ad)
            
        except Exception as e:
            logger.error(f"Erro ao atualizar anúncio {ad_id}: {e}")
            return None
    
    def delete_ad(self, db: Session, ad_id: int, user_id: int, company_id: int) -> bool:
        """Remove um anúncio"""
        try:
            # Verificar permissões
            ad = crud_ad.get_ad_by_id(db, ad_id=ad_id)
            if not ad or ad.company_id != company_id:
                return False
            
            # Deletar
            success = crud_ad.delete_ad(db, ad_id=ad_id)
            
            if success:
                logger.info(f"Anúncio {ad_id} removido")
            
            return success
            
        except Exception as e:
            logger.error(f"Erro ao remover anúncio {ad_id}: {e}")
            return False
    
    async def generate_ad(self, db: Session, request: AdGenerateRequest, 
                         user_id: int, company_id: int) -> Optional[AdGenerateResponse]:
        """Gera um anúncio usando IA"""
        try:
            # Verificar se o produto existe e pertence à empresa
            product = get_product_by_id(db, product_id=request.product_id)
            if not product or product.company_id != company_id:
                logger.error(f"Produto {request.product_id} não encontrado ou não pertence à empresa {company_id}")
                return None
            
            # Gerar anúncio com IA
            generated_ad = await ad_generation_service.generate_ad(product, request)
            
            if generated_ad:
                logger.info(f"Anúncio gerado para produto {request.product_id} no {request.marketplace}")
            
            return generated_ad
            
        except ValueError as e:
            # Propagar erros de validação/autenticação da OpenAI
            logger.error(f"Erro de validação ao gerar anúncio: {e}")
            raise e
        except Exception as e:
            logger.error(f"Erro ao gerar anúncio: {e}")
            return None
    
    async def generate_and_create_ad(self, db: Session, request: AdGenerateRequest, 
                                   user_id: int, company_id: int) -> Optional[AdResponse]:
        """Gera um anúncio com IA e o salva no banco"""
        try:
            # Gerar o anúncio
            generated_ad = await self.generate_ad(db, request, user_id, company_id)
            if not generated_ad:
                return None
            
            # Criar o schema de criação
            ad_create = AdCreate(
                title=generated_ad.title,
                description=generated_ad.description,
                price=generated_ad.suggested_price or Decimal("0.00"),
                marketplace=request.marketplace,
                product_id=request.product_id,
                status=AdStatus.DRAFT
            )
            
            # Salvar no banco
            created_ad = self.create_ad(db, ad_create, user_id, company_id)
            
            if created_ad:
                logger.info(f"Anúncio gerado e salvo: ID {created_ad.id}")
            
            return created_ad
            
        except ValueError as e:
            # Propagar erros de validação/autenticação da OpenAI
            logger.error(f"Erro de validação ao gerar e criar anúncio: {e}")
            raise e
        except Exception as e:
            logger.error(f"Erro ao gerar e criar anúncio: {e}")
            return None
    
    def update_ad_status(self, db: Session, ad_id: int, status: AdStatus, 
                        user_id: int, company_id: int) -> Optional[AdResponse]:
        """Atualiza o status de um anúncio"""
        try:
            # Verificar permissões
            ad = crud_ad.get_ad_by_id(db, ad_id=ad_id)
            if not ad or ad.company_id != company_id:
                return None
            
            # Atualizar status
            updated_ad = crud_ad.update_ad_status(db, ad_id=ad_id, status=status)
            
            if updated_ad:
                logger.info(f"Status do anúncio {ad_id} atualizado para {status}")
                return AdResponse.model_validate(updated_ad)
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao atualizar status do anúncio {ad_id}: {e}")
            return None
    
    def bulk_update_status(self, db: Session, ad_ids: List[int], status: AdStatus, 
                          user_id: int, company_id: int) -> int:
        """Atualiza o status de múltiplos anúncios"""
        try:
            # Verificar se todos os anúncios pertencem à empresa
            valid_ad_ids = []
            for ad_id in ad_ids:
                ad = crud_ad.get_ad_by_id(db, ad_id=ad_id)
                if ad and ad.company_id == company_id:
                    valid_ad_ids.append(ad_id)
            
            if not valid_ad_ids:
                return 0
            
            # Atualizar em lote
            updated_count = crud_ad.bulk_update_ads_status(db, ad_ids=valid_ad_ids, status=status)
            
            logger.info(f"{updated_count} anúncios atualizados para status {status}")
            return updated_count
            
        except Exception as e:
            logger.error(f"Erro ao atualizar status em lote: {e}")
            return 0
    
    def search_ads(self, db: Session, query: str, company_id: int, 
                  skip: int = 0, limit: int = 100) -> AdListResponse:
        """Busca anúncios por texto"""
        try:
            ads = crud_ad.search_ads(db, company_id=company_id, query=query, skip=skip, limit=limit)
            
            # Para o total, fazemos uma busca sem paginação e contamos
            all_results = crud_ad.search_ads(db, company_id=company_id, query=query, skip=0, limit=1000)
            total = len(all_results)
            
            ad_responses = [AdResponse.model_validate(ad) for ad in ads]
            
            total_pages = (total + limit - 1) // limit if limit > 0 else 1
            page = (skip // limit) + 1 if limit > 0 else 1
            
            return AdListResponse(
                ads=ad_responses,
                total=total,
                page=page,
                per_page=limit,
                total_pages=total_pages
            )
            
        except Exception as e:
            logger.error(f"Erro ao buscar anúncios: {e}")
            return AdListResponse(ads=[], total=0, page=1, per_page=limit, total_pages=0)
    
    def get_user_ads_stats(self, db: Session, user_id: int, company_id: int) -> Dict[str, Any]:
        """Retorna estatísticas dos anúncios do usuário"""
        try:
            total_ads = crud_ad.count_ads_by_user(db, user_id=user_id)
            active_ads = crud_ad.count_ads_by_status(db, company_id=company_id, status=AdStatus.ACTIVE)
            draft_ads = crud_ad.count_ads_by_status(db, company_id=company_id, status=AdStatus.DRAFT)
            paused_ads = crud_ad.count_ads_by_status(db, company_id=company_id, status=AdStatus.PAUSED)
            
            return {
                "total_ads": total_ads,
                "active_ads": active_ads,
                "draft_ads": draft_ads,
                "paused_ads": paused_ads,
                "user_id": user_id,
                "company_id": company_id
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas: {e}")
            return {}


# Instância global do serviço
ad_service = AdService()