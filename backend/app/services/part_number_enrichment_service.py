import logging
from datetime import datetime
from typing import Tuple
from sqlalchemy.orm import Session
from app.models.compatibility import Compatibility
from app.models.competitor_price import CompetitorPrice
from app.models.product import Product
from app.schemas.part_number_enrichment import (
    PartNumberEnrichRequest,
    PartNumberEnrichResponse,
    OpenAIResponse,
    CompatibilityData,
    CompetitorPriceData
)
from app.services.openai_service import openai_service

# Configurar logging
logger = logging.getLogger(__name__)


class PartNumberEnrichmentService:
    """Serviço para enriquecimento de part numbers"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_product_exists(self, product_id: int) -> bool:
        """Valida se o produto existe no banco de dados"""
        product = self.db.query(Product).filter(Product.id == product_id).first()
        return product is not None
    
    def clear_existing_data(self, product_id: int) -> None:
        """Remove dados existentes de compatibilidade e preços para o produto"""
        try:
            # Remove compatibilidades existentes
            self.db.query(Compatibility).filter(
                Compatibility.product_id == product_id
            ).delete()
            
            # Remove preços de concorrentes existentes
            self.db.query(CompetitorPrice).filter(
                CompetitorPrice.product_id == product_id
            ).delete()
            
            self.db.commit()
            logger.info(f"Dados existentes removidos para produto {product_id}")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao limpar dados existentes: {e}")
            raise
    
    def save_compatibilities(self, product_id: int, compatibilities: list[CompatibilityData]) -> int:
        """Salva dados de compatibilidade no banco"""
        saved_count = 0
        
        try:
            for comp_data in compatibilities:
                compatibility = Compatibility(
                    product_id=product_id,
                    vehicle_model=comp_data.vehicle_model,
                    year_start=comp_data.year_start,
                    year_end=comp_data.year_end,
                    notes=comp_data.notes
                )
                
                self.db.add(compatibility)
                saved_count += 1
            
            self.db.commit()
            logger.info(f"Salvos {saved_count} registros de compatibilidade para produto {product_id}")
            return saved_count
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao salvar compatibilidades: {e}")
            raise
    
    def save_competitor_prices(self, product_id: int, prices: list[CompetitorPriceData]) -> int:
        """Salva dados de preços de concorrentes no banco"""
        saved_count = 0
        
        try:
            for price_data in prices:
                competitor_price = CompetitorPrice(
                    product_id=product_id,
                    marketplace=price_data.marketplace,
                    seller_name=price_data.seller_name,
                    price=price_data.price,
                    last_checked=datetime.now()
                )
                
                self.db.add(competitor_price)
                saved_count += 1
            
            self.db.commit()
            logger.info(f"Salvos {saved_count} registros de preços para produto {product_id}")
            return saved_count
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao salvar preços de concorrentes: {e}")
            raise
    
    async def enrich_part_number(
        self, 
        request: PartNumberEnrichRequest
    ) -> PartNumberEnrichResponse:
        """Executa o enriquecimento completo de um part number"""
        start_time = datetime.now()
        
        try:
            # 1. Validar se o produto existe
            if not self.validate_product_exists(request.product_id):
                return PartNumberEnrichResponse(
                    success=False,
                    message=f"Produto com ID {request.product_id} não encontrado",
                    product_id=request.product_id,
                    part_number=request.part_number
                )
            
            # 2. Chamar a API da OpenAI
            logger.info(f"Iniciando enriquecimento para part number: {request.part_number}")
            openai_response = await openai_service.enrich_part_number(request.part_number)
            
            if not openai_response:
                return PartNumberEnrichResponse(
                    success=False,
                    message="Erro ao processar part number com a IA",
                    product_id=request.product_id,
                    part_number=request.part_number
                )
            
            # 3. Limpar dados existentes
            self.clear_existing_data(request.product_id)
            
            # 4. Salvar novos dados
            compatibilities_count = self.save_compatibilities(
                request.product_id, 
                openai_response.compatibilities
            )
            
            prices_count = self.save_competitor_prices(
                request.product_id, 
                openai_response.competitor_prices
            )
            
            # 5. Calcular tempo de processamento
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # 6. Retornar resposta de sucesso
            return PartNumberEnrichResponse(
                success=True,
                message="Part number enriquecido com sucesso",
                product_id=request.product_id,
                part_number=request.part_number,
                compatibilities_added=compatibilities_count,
                competitor_prices_added=prices_count,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Erro no enriquecimento de part number: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return PartNumberEnrichResponse(
                success=False,
                message=f"Erro interno: {str(e)}",
                product_id=request.product_id,
                part_number=request.part_number,
                processing_time=processing_time
            )


def get_enrichment_service(db: Session) -> PartNumberEnrichmentService:
    """Factory function para criar instância do serviço"""
    return PartNumberEnrichmentService(db)