#!/usr/bin/env python3
"""
Provedor singleton para cliente OpenAI
Garante uma única instância do cliente em toda a aplicação
"""

import os
import sys
import logging
from typing import Optional, Dict, Any
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenAIClientProvider:
    """Provedor singleton para cliente OpenAI com bootstrap rigoroso"""
    
    _instance: Optional['OpenAIClientProvider'] = None
    _client: Optional[OpenAI] = None
    _api_key: Optional[str] = None
    _bootstrap_completed: bool = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self._initialize_client()
    
    def _trim_api_key(self, raw_key: str) -> str:
        """Trim explícito da chave API removendo espaços, aspas e caracteres invisíveis"""
        if not raw_key:
            return ""
        
        # Trim rigoroso: espaços, tabs, quebras de linha, aspas simples e duplas
        cleaned = raw_key.strip().strip('"').strip("'").strip('\t\n\r ')
        return cleaned
    
    def _validate_api_key_format(self, api_key: str) -> tuple[bool, str]:
        """Validação rigorosa do formato da chave API"""
        if not api_key:
            return False, "Chave API não fornecida ou vazia"
        
        # Verificar comprimento mínimo e máximo
        if len(api_key) < 20:
            return False, f"Chave muito curta (comprimento: {len(api_key)}, mínimo: 20)"
        
        if len(api_key) > 200:
            return False, f"Chave muito longa (comprimento: {len(api_key)}, máximo: 200)"
        
        # Verificar prefixos válidos
        if not (api_key.startswith('sk-') or api_key.startswith('sk-proj-')):
            return False, f"Prefixo inválido. Esperado: sk- ou sk-proj-, encontrado: {api_key[:10]}..."
        
        # Validação específica para chaves de projeto
        if api_key.startswith('sk-proj-') and len(api_key) < 50:
            return False, f"Chave de projeto muito curta (comprimento: {len(api_key)}, mínimo: 50)"
        
        return True, "Formato da chave válido"
    
    def _get_masked_key(self, api_key: str) -> str:
        """Mascara a chave API para logs seguros com prefixo/sufixo"""
        if not api_key or len(api_key) < 12:
            return "***"
        return f"{api_key[:8]}...{api_key[-6:]}"
    
    def _get_key_type(self, api_key: str) -> str:
        """Determina o tipo da chave API"""
        if api_key.startswith('sk-proj-'):
            return "Project Key (sk-proj)"
        elif api_key.startswith('sk-'):
            return "Legacy Key (sk)"
        else:
            return "Unknown"
    
    def bootstrap_validation(self) -> bool:
        """Bootstrap flexível que permite inicialização sem OpenAI configurado"""
        if self._bootstrap_completed:
            return True
        
        try:
            # Obter chave do ambiente
            raw_key = os.getenv("OPENAI_API_KEY", "")
            
            # Log da chave bruta (mascarada) para diagnóstico
            logger.info(f"🔍 Bootstrap OpenAI - Chave bruta detectada: {len(raw_key)} caracteres")
            
            # Trim explícito
            clean_key = self._trim_api_key(raw_key)
            
            # Log do resultado do trim
            if len(clean_key) != len(raw_key):
                logger.warning(f"⚠️  Trim aplicado: {len(raw_key)} -> {len(clean_key)} caracteres")
            
            # Validação rigorosa
            is_valid, message = self._validate_api_key_format(clean_key)
            
            if not is_valid:
                logger.warning(f"⚠️ OpenAI não configurado: {message}")
                logger.warning(f"   Chave mascarada: {self._get_masked_key(clean_key)}")
                logger.warning(f"   Comprimento: {len(clean_key)} caracteres")
                logger.warning("")
                logger.warning("🔧 Servidor iniciando em modo DEGRADADO - OpenAI indisponível")
                logger.warning("")
                logger.warning("📋 Para configurar OpenAI no PowerShell:")
                logger.warning("   1. $env:OPENAI_API_KEY = 'sua-chave-aqui'")
                logger.warning("   2. Verifique se a chave é válida (sk- ou sk-proj-)")
                logger.warning("   3. Reinicie o backend")
                logger.warning("")
                # NÃO ABORTAR - permitir inicialização
                self._bootstrap_completed = True
                return False  # Indica que OpenAI não está disponível
            
            # Log de sucesso com detalhes
            key_type = self._get_key_type(clean_key)
            masked_key = self._get_masked_key(clean_key)
            
            logger.info(f"✅ Bootstrap OpenAI concluído com sucesso")
            logger.info(f"   Tipo: {key_type}")
            logger.info(f"   Chave: {masked_key}")
            logger.info(f"   Comprimento: {len(clean_key)} caracteres")
            
            self._bootstrap_completed = True
            return True
            
        except Exception as e:
            logger.warning(f"⚠️ Erro no bootstrap OpenAI: {e}")
            logger.warning("🔧 Servidor iniciando em modo DEGRADADO - OpenAI indisponível")
            self._bootstrap_completed = True
            return False  # Indica que OpenAI não está disponível
    
    def _initialize_client(self):
        """Inicializa o cliente OpenAI após bootstrap"""
        # Garantir que bootstrap foi executado
        if not self._bootstrap_completed:
            self.bootstrap_validation()
        
        try:
            # Obter chave limpa
            raw_key = os.getenv("OPENAI_API_KEY", "")
            self._api_key = self._trim_api_key(raw_key)
            
            # Criar cliente
            self._client = OpenAI(
                api_key=self._api_key,
                # Não definir organization/project manualmente para chaves sk-proj
                # A chave sk-proj já contém essas informações
            )
            
            # Log de sucesso
            masked = self._get_masked_key(self._api_key)
            key_type = self._get_key_type(self._api_key)
            logger.info(f"🔧 Cliente OpenAI inicializado: {masked} ({key_type})")
            
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar OpenAI Client: {e}")
            self._client = None
            self._api_key = None
            raise
    
    def get_client(self) -> OpenAI:
        """Retorna o cliente OpenAI"""
        if self._client is None:
            raise RuntimeError("OpenAI Client não foi inicializado corretamente")
        return self._client
    
    def get_api_key(self) -> str:
        """Retorna a chave API limpa"""
        if self._api_key is None:
            raise RuntimeError("OpenAI API Key não foi carregada corretamente")
        return self._api_key
    
    def get_masked_key(self) -> str:
        """Retorna chave mascarada para logs"""
        if self._api_key is None:
            return "Not loaded"
        return self._get_masked_key(self._api_key)
    
    def validate_connection_with_models(self) -> bool:
        """Valida conexão fazendo chamada real ao endpoint de modelos"""
        try:
            client = self.get_client()
            models = client.models.list()
            
            if models and models.data:
                logger.info(f"✅ Conexão OpenAI validada: {len(models.data)} modelos disponíveis")
                return True
            else:
                logger.error("❌ Resposta vazia do endpoint de modelos")
                return False
                
        except Exception as e:
            error_str = str(e).lower()
            if "401" in error_str or "unauthorized" in error_str:
                logger.error(f"❌ OpenAI 401: Chave inválida ou projeto incorreto - {e}")
            elif "429" in error_str:
                logger.error(f"❌ OpenAI 429: Limite de taxa excedido - {e}")
            elif "quota" in error_str or "billing" in error_str:
                logger.error(f"❌ OpenAI: Cota excedida ou problema de cobrança - {e}")
            else:
                logger.error(f"❌ OpenAI conexão falhou: {e}")
            return False
    
    def validate_connection(self) -> bool:
        """Valida conexão com OpenAI usando models.list"""
        return self.validate_connection_with_models()
    
    def reset(self):
        """Reseta o cliente (útil para testes)"""
        self._client = None
        self._api_key = None
        self._bootstrap_completed = False
        self._initialize_client()

# Instância singleton global
openai_provider = OpenAIClientProvider()

def bootstrap_openai() -> bool:
    """Executa bootstrap rigoroso da OpenAI"""
    return openai_provider.bootstrap_validation()

def get_openai_client() -> OpenAI:
    """Função helper para obter o cliente OpenAI"""
    return openai_provider.get_client()

def validate_openai_connection() -> bool:
    """Função helper para validar conexão OpenAI com endpoint real"""
    return openai_provider.validate_connection_with_models()

def get_openai_key_info() -> Dict[str, Any]:
    """Retorna informações sobre a chave OpenAI configurada"""
    try:
        raw_key = os.getenv("OPENAI_API_KEY", "")
        clean_key = openai_provider._trim_api_key(raw_key)
        
        if not clean_key:
            return {
                "configured": False,
                "masked_key": "Not configured",
                "type": "None",
                "error": "OPENAI_API_KEY não definida"
            }
        
        is_valid, message = openai_provider._validate_api_key_format(clean_key)
        if not is_valid:
            return {
                "configured": False,
                "masked_key": openai_provider._get_masked_key(clean_key),
                "type": "Invalid",
                "error": message
            }
        
        key_type = openai_provider._get_key_type(clean_key)
        
        return {
            "configured": True,
            "masked_key": openai_provider._get_masked_key(clean_key),
            "type": key_type,
            "length": len(clean_key),
            "valid": True
        }
        
    except Exception as e:
        return {
            "configured": False,
            "masked_key": "Error",
            "type": "Error",
            "valid": False,
            "error": str(e)
        }