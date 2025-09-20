import httpx
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.ad import Ad, AdStatus
from app.models.integration_model import Integration
from app.services.integration_service import ensure_valid_token
from app.core.config import settings

logger = logging.getLogger(__name__)


class MercadoLivrePublishService:
    """Serviço para publicação de anúncios no Mercado Livre"""
    
    def __init__(self, db: Session):
        self.db = db
        self.base_url = "https://api.mercadolibre.com"
    
    async def publish_ad(self, ad: Ad, integration: Integration) -> Dict[str, Any]:
        """
        Publica um anúncio no Mercado Livre
        
        Args:
            ad: Anúncio a ser publicado
            integration: Integração com credenciais do ML
            
        Returns:
            Dict com resultado da publicação
        """
        try:
            logger.info(f"Iniciando publicação do anúncio {ad.id} no Mercado Livre")
            
            # Garantir token válido
            if not await ensure_valid_token(integration, self.db):
                raise Exception("Falha ao renovar token do Mercado Livre")
            
            # Preparar dados do anúncio
            item_data = self._prepare_item_data(ad)
            
            # Publicar no ML
            result = await self._create_item(item_data, integration.credentials["access_token"], ad)
            
            if result.get("id"):
                # Sucesso - atualizar anúncio
                ad.status = AdStatus.ACTIVE
                ad.external_id = result["id"]
                ad.marketplace = "mercado_livre"
                
                self.db.commit()
                
                logger.info(f"Anúncio {ad.id} publicado com sucesso no ML. ID: {result['id']}")
                
                return {
                    "success": True,
                    "external_id": result["id"],
                    "permalink": result.get("permalink"),
                    "message": "Anúncio publicado com sucesso"
                }
            else:
                raise Exception(f"Resposta inválida do ML: {result}")
                
        except Exception as e:
            logger.error(f"Erro ao publicar anúncio {ad.id} no ML: {str(e)}")
            
            # Marcar como falha
            ad.status = AdStatus.PUBLISH_FAILED
            self.db.commit()
            
            # Lançar HTTPException em vez de retornar success: false
            if "Token" in str(e) or "401" in str(e):
                raise HTTPException(
                    status_code=401,
                    detail=f"Token do Mercado Livre inválido: {str(e)}"
                )
            elif "API" in str(e) or "HTTP" in str(e):
                raise HTTPException(
                    status_code=502,
                    detail=f"Erro na API do Mercado Livre: {str(e)}"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Erro interno na publicação: {str(e)}"
                )
    
    def _prepare_item_data(self, ad: Ad) -> Dict[str, Any]:
        """
        Prepara os dados do anúncio para o formato do Mercado Livre
        
        Args:
            ad: Anúncio a ser convertido
            
        Returns:
            Dict com dados formatados para o ML
        """
        # Extrair dados da IA se disponível
        ai_output = ad.ai_output or {}
        
        # Categoria padrão para auto peças
        category_id = "MLB1747"  # Peças e Acessórios para Veículos
        
        # Preparar descrição
        description = ad.description or ""
        if ai_output.get("marketplace_tips", {}).get("mercado_livre"):
            description += "\n\n" + ai_output["marketplace_tips"]["mercado_livre"]
        
        item_data = {
            "title": ad.title[:60],  # ML tem limite de 60 caracteres
            "category_id": category_id,
            "price": float(ad.price) if ad.price else 1.0,
            "currency_id": "BRL",
            "available_quantity": 1,
            "buying_mode": "buy_it_now",
            "listing_type_id": "bronze",
            "condition": "new",
            "description": description,
            "pictures": self._prepare_pictures(ad),
            "attributes": self._prepare_attributes(ad)
        }
        
        return item_data
    
    def _prepare_pictures(self, ad: Ad) -> list:
        """
        Prepara as imagens do produto para o ML
        
        Args:
            ad: Anúncio com produto relacionado
            
        Returns:
            Lista de URLs de imagens
        """
        pictures = []
        
        if ad.product and ad.product.images:
            for image in ad.product.images[:10]:  # ML permite até 10 imagens
                if image.image_url:
                    pictures.append({"source": image.image_url})
        
        return pictures
    
    def _prepare_attributes(self, ad: Ad) -> list:
        """
        Prepara os atributos do produto para o ML
        
        Args:
            ad: Anúncio com produto relacionado
            
        Returns:
            Lista de atributos formatados
        """
        attributes = []
        
        if ad.product:
            # Part Number
            if ad.product.part_number:
                attributes.append({
                    "id": "PART_NUMBER",
                    "value_name": ad.product.part_number
                })
            
            # Marca
            if ad.product.brand:
                attributes.append({
                    "id": "BRAND",
                    "value_name": ad.product.brand
                })
        
        return attributes
    
    async def _create_item(self, item_data: Dict[str, Any], access_token: str, ad: Ad) -> Dict[str, Any]:
        """
        Cria um item no Mercado Livre via API
        
        Args:
            item_data: Dados do item
            access_token: Token de acesso
            ad: Anúncio sendo publicado (para logging)
            
        Returns:
            Resposta da API do ML
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/items",
                json=item_data,
                headers=headers
            )
            
            if response.status_code == 201:
                return response.json()
            else:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get("message", error_detail)
                except:
                    pass
                
                logger.error(f"[ML_API_ERROR] Erro na API do Mercado Livre para anúncio {ad.id}: HTTP {response.status_code}", extra={
                    "error_type": "ml_api_error",
                    "ad_id": ad.id,
                    "part_number": ad.title,
                    "status_code": response.status_code,
                    "error_message": error_detail
                })
                raise Exception(f"Erro HTTP {response.status_code}: {error_detail}")


def get_mercadolivre_publish_service(db: Session) -> MercadoLivrePublishService:
    """Factory function para o serviço de publicação"""
    return MercadoLivrePublishService(db)