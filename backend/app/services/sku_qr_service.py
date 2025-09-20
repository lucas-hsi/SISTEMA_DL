import os
import uuid
import qrcode
import logging
from typing import Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.product import Product
from app.models.ad import Ad

# Configurar logging
logger = logging.getLogger(__name__)


class SKUQRService:
    """Serviço para geração de SKU e QR codes"""
    
    def __init__(self):
        self.qr_dir = os.path.join(settings.UPLOAD_DIR, "qr_codes")
        os.makedirs(self.qr_dir, exist_ok=True)
    
    def generate_sku(self, company_id: int, part_number: str, product_id: Optional[int] = None) -> str:
        """
        Gera um SKU único baseado no part number e company_id
        
        Args:
            company_id: ID da empresa
            part_number: Número da peça
            product_id: ID do produto (opcional)
            
        Returns:
            str: SKU gerado
        """
        try:
            # Limpar part number (remover caracteres especiais)
            clean_pn = ''.join(c.upper() for c in part_number if c.isalnum())
            
            # Formato: COMP{company_id}-{clean_part_number}-{timestamp_suffix}
            timestamp_suffix = datetime.now().strftime("%m%d%H%M")
            
            if len(clean_pn) > 20:
                clean_pn = clean_pn[:20]
            
            sku = f"COMP{company_id:03d}-{clean_pn}-{timestamp_suffix}"
            
            # Garantir que o SKU não exceda 50 caracteres
            if len(sku) > 50:
                sku = sku[:50]
            
            logger.info(f"SKU gerado: {sku} para part_number: {part_number}")
            return sku
            
        except Exception as e:
            logger.error(f"Erro ao gerar SKU: {e}")
            # Fallback para UUID
            fallback_sku = f"COMP{company_id:03d}-{str(uuid.uuid4())[:8].upper()}"
            return fallback_sku
    
    def generate_qr_code(self, sku: str, product_data: dict, ad_data: Optional[dict] = None) -> str:
        """
        Gera QR code com informações do produto e anúncio
        
        Args:
            sku: SKU do produto
            product_data: Dados do produto
            ad_data: Dados do anúncio (opcional)
            
        Returns:
            str: Caminho do arquivo QR code gerado
        """
        try:
            # Preparar dados para o QR code
            qr_data = {
                "sku": sku,
                "product_name": product_data.get("name", ""),
                "part_number": product_data.get("part_number", ""),
                "brand": product_data.get("brand", ""),
                "price": str(product_data.get("sale_price", "0.00")),
                "company_id": product_data.get("company_id", "")
            }
            
            if ad_data:
                qr_data.update({
                    "ad_title": ad_data.get("title", ""),
                    "marketplace": ad_data.get("marketplace", ""),
                    "ad_id": ad_data.get("id", "")
                })
            
            # Converter para string JSON compacta
            import json
            qr_content = json.dumps(qr_data, separators=(',', ':'), ensure_ascii=False)
            
            # Gerar QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_content)
            qr.make(fit=True)
            
            # Criar imagem
            qr_image = qr.make_image(fill_color="black", back_color="white")
            
            # Salvar arquivo
            filename = f"qr_{sku}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            qr_path = os.path.join(self.qr_dir, filename)
            qr_image.save(qr_path)
            
            logger.info(f"QR code gerado: {qr_path}")
            return qr_path
            
        except Exception as e:
            logger.error(f"Erro ao gerar QR code: {e}")
            raise
    
    def generate_sku_and_qr(self, db: Session, company_id: int, part_number: str, 
                           product_id: int, ad_id: Optional[int] = None) -> Tuple[str, str]:
        """
        Gera SKU e QR code para um produto/anúncio
        
        Args:
            db: Sessão do banco de dados
            company_id: ID da empresa
            part_number: Número da peça
            product_id: ID do produto
            ad_id: ID do anúncio (opcional)
            
        Returns:
            Tuple[str, str]: (sku_gerado, caminho_qr_code)
        """
        try:
            # Buscar dados do produto
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise ValueError(f"Produto não encontrado: {product_id}")
            
            # Gerar SKU
            sku = self.generate_sku(company_id, part_number, product_id)
            
            # Preparar dados do produto
            product_data = {
                "name": product.name,
                "part_number": product.part_number,
                "brand": product.brand,
                "sale_price": product.sale_price,
                "company_id": product.company_id
            }
            
            # Buscar dados do anúncio se fornecido
            ad_data = None
            if ad_id:
                ad = db.query(Ad).filter(Ad.id == ad_id).first()
                if ad:
                    ad_data = {
                        "id": ad.id,
                        "title": ad.title,
                        "marketplace": ad.marketplace
                    }
            
            # Gerar QR code
            qr_path = self.generate_qr_code(sku, product_data, ad_data)
            
            return sku, qr_path
            
        except Exception as e:
            logger.error(f"Erro ao gerar SKU e QR: {e}")
            raise
    
    def validate_sku_uniqueness(self, db: Session, sku: str, company_id: int) -> bool:
        """
        Valida se o SKU é único na empresa
        
        Args:
            db: Sessão do banco de dados
            sku: SKU a ser validado
            company_id: ID da empresa
            
        Returns:
            bool: True se o SKU é único, False caso contrário
        """
        try:
            # Verificar na tabela de produtos
            existing_product = db.query(Product).filter(
                Product.sku == sku,
                Product.company_id == company_id
            ).first()
            
            if existing_product:
                return False
            
            # Verificar na tabela de anúncios
            existing_ad = db.query(Ad).filter(
                Ad.sku_generated == sku,
                Ad.company_id == company_id
            ).first()
            
            return existing_ad is None
            
        except Exception as e:
            logger.error(f"Erro ao validar unicidade do SKU: {e}")
            return False
    
    def cleanup_old_qr_codes(self, days_old: int = 30) -> int:
        """
        Remove QR codes antigos
        
        Args:
            days_old: Idade em dias para considerar QR codes antigos
            
        Returns:
            int: Número de arquivos removidos
        """
        import time
        
        removed_count = 0
        cutoff_time = time.time() - (days_old * 24 * 60 * 60)
        
        try:
            for filename in os.listdir(self.qr_dir):
                if filename.startswith('qr_'):
                    file_path = os.path.join(self.qr_dir, filename)
                    if os.path.isfile(file_path) and os.path.getmtime(file_path) < cutoff_time:
                        os.remove(file_path)
                        removed_count += 1
                        
            logger.info(f"Removidos {removed_count} QR codes antigos")
            return removed_count
            
        except Exception as e:
            logger.error(f"Erro ao limpar QR codes antigos: {e}")
            return 0


# Instância singleton do serviço
sku_qr_service = SKUQRService()