import os
import io
import base64
import logging
import uuid
from typing import List, Optional, Tuple
from PIL import Image
import requests
from rembg import remove
from app.core.config import settings

# Configurar logging
logger = logging.getLogger(__name__)


class ImageProcessingService:
    """Serviço para processamento de imagens com remoção de fundo"""
    
    def __init__(self):
        self.upload_dir = os.path.join(settings.UPLOAD_DIR, "processed_images")
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def process_image_background(self, image_input: str, save_original: bool = True) -> Tuple[str, Optional[str]]:
        """
        Remove o fundo de uma imagem e salva com fundo branco
        
        Args:
            image_input: URL da imagem ou string base64
            save_original: Se deve salvar a imagem original também
            
        Returns:
            Tuple[str, Optional[str]]: (caminho_imagem_processada, caminho_imagem_original)
        """
        try:
            # Carregar imagem
            image = self._load_image(image_input)
            if not image:
                raise ValueError("Não foi possível carregar a imagem")
            
            # Gerar nomes únicos para os arquivos
            unique_id = str(uuid.uuid4())
            processed_filename = f"processed_{unique_id}.png"
            original_filename = f"original_{unique_id}.png" if save_original else None
            
            # Salvar imagem original se solicitado
            original_path = None
            if save_original:
                original_path = os.path.join(self.upload_dir, original_filename)
                image.save(original_path, "PNG")
            
            # Converter para bytes para processamento
            img_bytes = io.BytesIO()
            image.save(img_bytes, format='PNG')
            img_bytes = img_bytes.getvalue()
            
            # Remover fundo usando rembg
            output_bytes = remove(img_bytes)
            
            # Criar imagem com fundo branco
            processed_image = Image.open(io.BytesIO(output_bytes))
            
            # Criar fundo branco
            white_bg = Image.new('RGB', processed_image.size, (255, 255, 255))
            
            # Colar a imagem sem fundo sobre o fundo branco
            if processed_image.mode == 'RGBA':
                white_bg.paste(processed_image, mask=processed_image.split()[-1])
            else:
                white_bg.paste(processed_image)
            
            # Salvar imagem processada
            processed_path = os.path.join(self.upload_dir, processed_filename)
            white_bg.save(processed_path, "PNG", quality=95)
            
            logger.info(f"Imagem processada com sucesso: {processed_path}")
            return processed_path, original_path
            
        except Exception as e:
            logger.error(f"Erro ao processar imagem: {e}")
            raise
    
    def process_multiple_images(self, images: List[str], max_images: int = 6) -> List[str]:
        """
        Processa múltiplas imagens removendo o fundo
        
        Args:
            images: Lista de URLs ou strings base64 das imagens
            max_images: Número máximo de imagens a processar
            
        Returns:
            List[str]: Lista de caminhos das imagens processadas
        """
        processed_images = []
        
        for i, image_input in enumerate(images[:max_images]):
            try:
                processed_path, _ = self.process_image_background(image_input, save_original=False)
                processed_images.append(processed_path)
                logger.info(f"Imagem {i+1}/{len(images)} processada: {processed_path}")
            except Exception as e:
                logger.error(f"Erro ao processar imagem {i+1}: {e}")
                continue
        
        return processed_images
    
    def _load_image(self, image_input: str) -> Optional[Image.Image]:
        """
        Carrega uma imagem a partir de URL ou base64
        
        Args:
            image_input: URL da imagem ou string base64
            
        Returns:
            Image.Image: Objeto PIL Image ou None se falhar
        """
        try:
            # Verificar se é base64
            if image_input.startswith('data:image/'):
                # Extrair dados base64
                header, data = image_input.split(',', 1)
                image_data = base64.b64decode(data)
                return Image.open(io.BytesIO(image_data))
            
            elif image_input.startswith(('http://', 'https://')):
                # Baixar imagem da URL
                response = requests.get(image_input, timeout=30)
                response.raise_for_status()
                return Image.open(io.BytesIO(response.content))
            
            elif os.path.isfile(image_input):
                # Carregar arquivo local
                return Image.open(image_input)
            
            else:
                logger.error(f"Formato de imagem não suportado: {image_input[:100]}...")
                return None
                
        except Exception as e:
            logger.error(f"Erro ao carregar imagem: {e}")
            return None
    
    def optimize_image_for_marketplace(self, image_path: str, marketplace: str = "mercado_livre") -> str:
        """
        Otimiza imagem para um marketplace específico
        
        Args:
            image_path: Caminho da imagem
            marketplace: Nome do marketplace
            
        Returns:
            str: Caminho da imagem otimizada
        """
        try:
            image = Image.open(image_path)
            
            # Configurações por marketplace
            marketplace_configs = {
                "mercado_livre": {"size": (1200, 1200), "quality": 90},
                "shopee": {"size": (1024, 1024), "quality": 85},
                "amazon": {"size": (2000, 2000), "quality": 95},
                "default": {"size": (1200, 1200), "quality": 90}
            }
            
            config = marketplace_configs.get(marketplace, marketplace_configs["default"])
            
            # Redimensionar mantendo proporção
            image.thumbnail(config["size"], Image.Resampling.LANCZOS)
            
            # Criar nova imagem com fundo branco no tamanho desejado
            new_image = Image.new('RGB', config["size"], (255, 255, 255))
            
            # Centralizar a imagem
            x = (config["size"][0] - image.size[0]) // 2
            y = (config["size"][1] - image.size[1]) // 2
            
            if image.mode == 'RGBA':
                new_image.paste(image, (x, y), mask=image.split()[-1])
            else:
                new_image.paste(image, (x, y))
            
            # Salvar imagem otimizada
            optimized_filename = f"optimized_{marketplace}_{os.path.basename(image_path)}"
            optimized_path = os.path.join(self.upload_dir, optimized_filename)
            new_image.save(optimized_path, "JPEG", quality=config["quality"], optimize=True)
            
            return optimized_path
            
        except Exception as e:
            logger.error(f"Erro ao otimizar imagem: {e}")
            return image_path  # Retorna o original em caso de erro
    
    def cleanup_old_images(self, days_old: int = 7) -> int:
        """
        Remove imagens antigas do diretório de upload
        
        Args:
            days_old: Idade em dias para considerar imagens antigas
            
        Returns:
            int: Número de arquivos removidos
        """
        import time
        
        removed_count = 0
        cutoff_time = time.time() - (days_old * 24 * 60 * 60)
        
        try:
            for filename in os.listdir(self.upload_dir):
                file_path = os.path.join(self.upload_dir, filename)
                if os.path.isfile(file_path) and os.path.getmtime(file_path) < cutoff_time:
                    os.remove(file_path)
                    removed_count += 1
                    
            logger.info(f"Removidas {removed_count} imagens antigas")
            return removed_count
            
        except Exception as e:
            logger.error(f"Erro ao limpar imagens antigas: {e}")
            return 0


# Instância singleton do serviço
image_processing_service = ImageProcessingService()