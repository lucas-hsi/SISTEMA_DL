import httpx
import json
from typing import List, Dict, Any, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.product import Product
from app.models.order_item import OrderItem
from app.models.integration import Integration
from app.crud.crud_product import get_product_by_id


class FrenetService:
    """Serviço para integração com a API da Frenet"""
    
    def __init__(self, db: Session):
        self.db = db
        self.api_url = "https://api.frenet.com.br"
        self.api_token = settings.FRENET_API_TOKEN
        self.seller_cep = settings.SELLER_CEP
    
    async def get_shipping_quote(
        self,
        recipient_cep: str,
        order_items: List[Dict[str, Any]],
        company_id: int
    ) -> Dict[str, Any]:
        """
        Calcula o frete usando a API da Frenet
        
        Args:
            recipient_cep: CEP de destino
            order_items: Lista de itens do pedido com product_id e quantity
            company_id: ID da empresa
            
        Returns:
            Dict com as opções de frete disponíveis
        """
        try:
            # Buscar produtos no banco para obter dados de peso e dimensões
            shipment_items = []
            
            for item in order_items:
                product = get_product_by_id(db=self.db, product_id=item["product_id"])
                if not product:
                    raise ValueError(f"Produto {item['product_id']} não encontrado")
                
                # Validar se o produto tem dados de peso e dimensões
                if not all([product.weight, product.height, product.width, product.length]):
                    raise ValueError(f"Produto {product.name} não possui dados completos de peso e dimensões")
                
                # Adicionar item ao array de envio
                shipment_items.append({
                    "Weight": float(product.weight),
                    "Length": float(product.length),
                    "Height": float(product.height),
                    "Width": float(product.width),
                    "Diameter": 0,  # Não usado para produtos retangulares
                    "SKU": product.sku,
                    "Category": "",  # Categoria opcional
                    "Quantity": item["quantity"]
                })
            
            # Construir payload da requisição
            payload = {
                "SellerCEP": self.seller_cep,
                "RecipientCEP": recipient_cep,
                "ShipmentInvoiceValue": sum(
                    float(item["quantity"]) * float(crud_product.get(db=self.db, id=item["product_id"]).sale_price)
                    for item in order_items
                ),
                "ShipmentItemArray": shipment_items,
                "RecipientCountry": "BR",
                "SellerCountry": "BR"
            }
            
            # Headers da requisição
            headers = {
                "Content-Type": "application/json",
                "token": self.api_token
            }
            
            # Fazer requisição para a API da Frenet
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/shipping/quote",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "data": result,
                        "shipping_options": self._format_shipping_options(result)
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Erro na API Frenet: {response.status_code} - {response.text}",
                        "shipping_options": []
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro interno: {str(e)}",
                "shipping_options": []
            }
    
    def _format_shipping_options(self, frenet_response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Formata a resposta da Frenet para um formato padronizado
        
        Args:
            frenet_response: Resposta da API da Frenet
            
        Returns:
            Lista de opções de frete formatadas
        """
        options = []
        
        if "ShippingSevicesArray" in frenet_response:
            for service in frenet_response["ShippingSevicesArray"]:
                if service.get("Error") == "":
                    options.append({
                        "service_name": service.get("ServiceDescription", "Não informado"),
                        "service_code": service.get("ServiceCode", ""),
                        "carrier": service.get("Carrier", "Não informado"),
                        "price": float(service.get("ShippingPrice", 0)),
                        "delivery_time": int(service.get("DeliveryTime", 0)),
                        "original_delivery_time": int(service.get("OriginalDeliveryTime", 0))
                    })
        
        return options
    
    async def validate_cep(self, cep: str) -> bool:
        """
        Valida se um CEP é válido
        
        Args:
            cep: CEP a ser validado
            
        Returns:
            True se válido, False caso contrário
        """
        # Remove caracteres não numéricos
        clean_cep = ''.join(filter(str.isdigit, cep))
        
        # Verifica se tem 8 dígitos
        if len(clean_cep) != 8:
            return False
        
        # Verifica se não é um CEP inválido conhecido
        invalid_ceps = ['00000000', '11111111', '22222222', '33333333', 
                       '44444444', '55555555', '66666666', '77777777', 
                       '88888888', '99999999']
        
        return clean_cep not in invalid_ceps


def get_frenet_service(db: Session) -> FrenetService:
    """Factory function para criar instância do FrenetService"""
    return FrenetService(db)