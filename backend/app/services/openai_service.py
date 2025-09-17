import json
import logging
from typing import Optional
from openai import OpenAI
from app.core.config import settings
from app.schemas.part_number_enrichment import OpenAIResponse, CompatibilityData, CompetitorPriceData

# Configurar logging
logger = logging.getLogger(__name__)


class OpenAIService:
    """Serviço para integração com a API da OpenAI"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def create_part_number_prompt(self, part_number: str) -> str:
        """Cria o prompt detalhado para a IA analisar o part number"""
        prompt = f"""
Você é um especialista em catálogos de autopeças com vasto conhecimento sobre compatibilidade de veículos e preços de mercado.

Sua tarefa é analisar o part number "{part_number}" e fornecer informações estruturadas sobre:

1. COMPATIBILIDADE DE VEÍCULOS:
   - Liste modelos de veículos compatíveis com esta peça
   - Para cada modelo, forneça o ano de início e fim da compatibilidade
   - Inclua observações relevantes quando necessário

2. PREÇOS DE CONCORRENTES:
   - Pesquise preços de 3 vendedores diferentes no Mercado Livre
   - Para cada preço, forneça: marketplace, nome do vendedor e valor
   - Use preços realistas baseados no mercado brasileiro atual

IMPORTANTE: Sua resposta deve ser OBRIGATORIAMENTE em formato JSON válido, seguindo exatamente esta estrutura:

{{
  "compatibilities": [
    {{
      "vehicle_model": "Nome do Modelo",
      "year_start": 2010,
      "year_end": 2020,
      "notes": "Observações opcionais"
    }}
  ],
  "competitor_prices": [
    {{
      "marketplace": "Mercado Livre",
      "seller_name": "Nome do Vendedor",
      "price": 150.99
    }}
  ]
}}

Não inclua texto adicional, apenas o JSON válido.
"""
        return prompt
    
    async def enrich_part_number(self, part_number: str) -> Optional[OpenAIResponse]:
        """Enriquece um part number usando a API da OpenAI"""
        try:
            prompt = self.create_part_number_prompt(part_number)
            
            logger.info(f"Enviando requisição para OpenAI para part number: {part_number}")
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em autopeças. Sempre responda em JSON válido."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Baixa temperatura para respostas mais consistentes
                max_tokens=1500,
                response_format={"type": "json_object"}  # Força resposta em JSON
            )
            
            # Extrair o conteúdo da resposta
            content = response.choices[0].message.content
            logger.info(f"Resposta recebida da OpenAI: {content[:200]}...")  # Log parcial
            
            # Parse do JSON
            try:
                data = json.loads(content)
                
                # Validar e converter para nossos schemas
                compatibilities = [
                    CompatibilityData(**comp) for comp in data.get("compatibilities", [])
                ]
                
                competitor_prices = [
                    CompetitorPriceData(**price) for price in data.get("competitor_prices", [])
                ]
                
                return OpenAIResponse(
                    compatibilities=compatibilities,
                    competitor_prices=competitor_prices
                )
                
            except json.JSONDecodeError as e:
                logger.error(f"Erro ao fazer parse do JSON da OpenAI: {e}")
                logger.error(f"Conteúdo recebido: {content}")
                return None
            
            except Exception as e:
                logger.error(f"Erro ao validar dados da OpenAI: {e}")
                return None
                
        except Exception as e:
            logger.error(f"Erro na chamada para OpenAI: {e}")
            return None
    
    def validate_api_key(self) -> bool:
        """Valida se a API key da OpenAI está configurada e funcionando"""
        try:
            # Teste simples para validar a API key
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            return True
        except Exception as e:
            logger.error(f"API key da OpenAI inválida ou erro de conexão: {e}")
            return False


# Instância singleton do serviço
openai_service = OpenAIService()