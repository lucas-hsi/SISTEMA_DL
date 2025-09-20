import json
import logging
from typing import Optional, List
from decimal import Decimal
from app.core.config import settings
from app.core.openai_client import get_openai_client, validate_openai_connection
from app.schemas.ad import AdGenerateRequest, AdGenerateResponse, MarketplaceType
from app.models.product import Product
from app.services.openai_service import OpenAIService

# Configurar logging
logger = logging.getLogger(__name__)


class AdGenerationService(OpenAIService):
    """Serviço para geração de anúncios usando IA"""
    
    def __init__(self):
        # Usar o provedor singleton diretamente
        self.client = get_openai_client()
    
    def create_ad_generation_prompt(self, product: Product, request: AdGenerateRequest) -> str:
        """Cria o prompt para geração de anúncio"""
        
        marketplace_guidelines = {
            MarketplaceType.MERCADO_LIVRE: {
                "title_max": 60,
                "description_max": 2000,
                "style": "direto e persuasivo, focando em benefícios e especificações técnicas",
                "keywords": "use palavras-chave relevantes para SEO do Mercado Livre"
            },
            MarketplaceType.SHOPEE: {
                "title_max": 120,
                "description_max": 3000,
                "style": "mais casual e promocional, com emojis moderados",
                "keywords": "foque em promoções e benefícios de compra"
            },
            MarketplaceType.AMAZON: {
                "title_max": 150,
                "description_max": 2000,
                "style": "profissional e técnico, com bullet points",
                "keywords": "otimize para algoritmo de busca da Amazon"
            },
            MarketplaceType.MAGAZINE_LUIZA: {
                "title_max": 100,
                "description_max": 1500,
                "style": "equilibrado entre técnico e promocional",
                "keywords": "destaque compatibilidade e qualidade"
            },
            MarketplaceType.AMERICANAS: {
                "title_max": 80,
                "description_max": 1800,
                "style": "promocional com foco em economia",
                "keywords": "enfatize custo-benefício e entrega"
            }
        }
        
        guidelines = marketplace_guidelines.get(request.marketplace, marketplace_guidelines[MarketplaceType.MERCADO_LIVRE])
        
        prompt = f"""
Você é um especialista em marketing digital e vendas de autopeças no Brasil.

Sua tarefa é criar um anúncio otimizado para {request.marketplace.value} para o seguinte produto:

INFORMAÇÕES DO PRODUTO:
- Nome: {product.name}
- Descrição: {product.description or 'Não informada'}
- SKU: {product.sku}
- Part Number: {product.part_number or 'Não informado'}
- Marca: {product.brand or 'Não informada'}
- Preço de Venda: R$ {product.sale_price}
- Peso: {product.weight or 'Não informado'} kg
- Dimensões: {product.length or 'N/A'} x {product.width or 'N/A'} x {product.height or 'N/A'} cm

PARÂMETROS DO ANÚNCIO:
- Marketplace: {request.marketplace.value}
- Público-alvo: {request.target_audience or 'Proprietários de veículos e oficinas mecânicas'}
- Características destacadas: {', '.join(request.key_features) if request.key_features else 'Qualidade, durabilidade e compatibilidade'}
- Tom: {request.tone}
- Incluir especificações técnicas: {'Sim' if request.include_technical_specs else 'Não'}
- Limite título: {request.max_title_length} caracteres
- Limite descrição: {request.max_description_length} caracteres

DIRETRIZES DO MARKETPLACE:
- Estilo: {guidelines['style']}
- SEO: {guidelines['keywords']}
- Limite título recomendado: {guidelines['title_max']} caracteres
- Limite descrição recomendado: {guidelines['description_max']} caracteres

INSTRUÇÕES:
1. Crie um título atrativo e otimizado para SEO
2. Desenvolva uma descrição persuasiva que destaque benefícios
3. Sugira um preço competitivo baseado no preço atual
4. Liste palavras-chave relevantes para o produto
5. Forneça dicas específicas para o marketplace

IMPORTANTE: Sua resposta deve ser OBRIGATORIAMENTE em formato JSON válido, seguindo exatamente esta estrutura:

{{
  "title": "Título do anúncio (máximo {request.max_title_length} caracteres)",
  "description": "Descrição completa do anúncio (máximo {request.max_description_length} caracteres)",
  "suggested_price": 199.99,
  "keywords": ["palavra1", "palavra2", "palavra3"],
  "marketplace_tips": "Dicas específicas para otimizar no {request.marketplace.value}"
}}

Responda APENAS com o JSON, sem texto adicional.
"""
        
        return prompt
    
    async def generate_ad(self, product: Product, request: AdGenerateRequest) -> Optional[AdGenerateResponse]:
        """Gera um anúncio usando IA"""
        try:
            prompt = self.create_ad_generation_prompt(product, request)
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em marketing digital e vendas de autopeças. Sempre responda em JSON válido."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            content = response.choices[0].message.content.strip()
            logger.info(f"Resposta da OpenAI para geração de anúncio: {content}")
            
            # Parse da resposta JSON
            try:
                data = json.loads(content)
                
                # Validar e converter os dados
                suggested_price = None
                if "suggested_price" in data and data["suggested_price"]:
                    suggested_price = Decimal(str(data["suggested_price"]))
                
                return AdGenerateResponse(
                    title=data.get("title", ""),
                    description=data.get("description", ""),
                    suggested_price=suggested_price,
                    keywords=data.get("keywords", []),
                    marketplace_tips=data.get("marketplace_tips")
                )
                
            except json.JSONDecodeError as e:
                logger.error(f"Erro ao fazer parse do JSON da OpenAI: {e}")
                logger.error(f"Conteúdo recebido: {content}")
                return None
                
        except Exception as e:
            # Tratamento específico para erro de autenticação (401)
            error_message = str(e).lower()
            if "401" in error_message or "unauthorized" in error_message or "authentication" in error_message:
                logger.error(f"🚨 OpenAI authentication failed (401): Chave API inválida ou projeto incorreto - {e}")
                logger.error(f"🔑 Chave atual mascarada: {self.client.api_key[:8]}...{self.client.api_key[-6:] if len(self.client.api_key) > 14 else '***'}")
                raise ValueError("Erro de autenticação OpenAI: Chave inválida ou projeto incorreto. Para chaves sk-proj, verifique se o projeto está ativo. Instruções: 1) Verifique OPENAI_API_KEY no .env, 2) Confirme créditos suficientes, 3) Reinicie o backend.")
            elif "429" in error_message or "rate limit" in error_message:
                logger.error(f"🚨 OpenAI rate limit exceeded (429): {e}")
                raise ValueError("Limite de uso da OpenAI excedido. Tente novamente em alguns minutos ou entre em contato com o administrador.")
            elif "quota" in error_message or "billing" in error_message:
                logger.error(f"🚨 OpenAI quota exceeded: {e}")
                raise ValueError("Cota da OpenAI excedida. Verifique o plano de billing ou entre em contato com o administrador.")
            else:
                logger.error(f"🚨 Erro inesperado na OpenAI: {e}")
                return None
    
    async def generate_multiple_ads(self, product: Product, marketplaces: List[MarketplaceType], 
                                  base_request: AdGenerateRequest) -> dict:
        """Gera anúncios para múltiplos marketplaces"""
        results = {}
        
        for marketplace in marketplaces:
            request = AdGenerateRequest(
                product_id=base_request.product_id,
                marketplace=marketplace,
                target_audience=base_request.target_audience,
                key_features=base_request.key_features,
                tone=base_request.tone,
                include_technical_specs=base_request.include_technical_specs,
                max_title_length=base_request.max_title_length,
                max_description_length=base_request.max_description_length
            )
            
            ad_response = await self.generate_ad(product, request)
            results[marketplace.value] = ad_response
        
        return results
    
    async def optimize_existing_ad(self, current_title: str, current_description: str, 
                                 product: Product, marketplace: MarketplaceType) -> Optional[AdGenerateResponse]:
        """Otimiza um anúncio existente"""
        try:
            prompt = f"""
Você é um especialista em otimização de anúncios para marketplaces.

Otimize o seguinte anúncio para {marketplace.value}:

ANÚNCIO ATUAL:
Título: {current_title}
Descrição: {current_description}

INFORMAÇÕES DO PRODUTO:
- Nome: {product.name}
- SKU: {product.sku}
- Part Number: {product.part_number or 'Não informado'}
- Marca: {product.brand or 'Não informada'}
- Preço: R$ {product.sale_price}

MELHORIAS NECESSÁRIAS:
1. Otimize o título para SEO
2. Melhore a descrição para ser mais persuasiva
3. Adicione palavras-chave relevantes
4. Sugira melhorias específicas

Responda em JSON válido:
{{
  "title": "Título otimizado",
  "description": "Descrição otimizada",
  "suggested_price": null,
  "keywords": ["palavra1", "palavra2"],
  "marketplace_tips": "Sugestões de melhoria"
}}
"""
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Você é um especialista em otimização de anúncios. Sempre responda em JSON válido."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.5
            )
            
            content = response.choices[0].message.content.strip()
            data = json.loads(content)
            
            return AdGenerateResponse(
                title=data.get("title", current_title),
                description=data.get("description", current_description),
                suggested_price=None,
                keywords=data.get("keywords", []),
                marketplace_tips=data.get("marketplace_tips")
            )
            
        except Exception as e:
            # Tratamento específico para erro de autenticação (401)
            error_message = str(e).lower()
            if "401" in error_message or "unauthorized" in error_message or "authentication" in error_message:
                logger.error(f"🚨 OpenAI authentication failed (401): Chave API inválida ou expirada - {e}")
                logger.error(f"🔑 Chave atual mascarada: {self.client.api_key[:8]}...{self.client.api_key[-6:] if len(self.client.api_key) > 14 else '***'}")
                raise ValueError("Erro de autenticação OpenAI: Verifique se a chave API está configurada corretamente e é válida. Entre em contato com o administrador do sistema.")
            elif "429" in error_message or "rate limit" in error_message:
                logger.error(f"🚨 OpenAI rate limit exceeded (429): {e}")
                raise ValueError("Limite de uso da OpenAI excedido. Tente novamente em alguns minutos ou entre em contato com o administrador.")
            elif "quota" in error_message or "billing" in error_message:
                logger.error(f"🚨 OpenAI quota exceeded: {e}")
                raise ValueError("Cota de uso da OpenAI excedida. Entre em contato com o administrador para verificar o plano de pagamento.")
            else:
                logger.error(f"🚨 Erro inesperado na OpenAI: {e}")
                return None


# Instância global do serviço
ad_generation_service = AdGenerationService()