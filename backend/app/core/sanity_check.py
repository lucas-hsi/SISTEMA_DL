import os
import sys
import logging
from typing import Optional

# Configurar logging
logger = logging.getLogger(__name__)

def validate_openai_key_format(api_key: str) -> tuple[bool, str]:
    """
    Valida o formato da chave OpenAI.
    
    Args:
        api_key: A chave da API OpenAI
        
    Returns:
        tuple: (is_valid, message)
    """
    if not api_key:
        return False, "Chave OpenAI não fornecida"
    
    # Remover espaços e aspas
    clean_key = api_key.strip().strip('"').strip("'")
    
    # Verificar comprimento mínimo
    if len(clean_key) < 20:
        return False, f"Chave muito curta (comprimento: {len(clean_key)}, mínimo: 20)"
    
    # Verificar comprimento máximo
    if len(clean_key) > 200:
        return False, f"Chave muito longa (comprimento: {len(clean_key)}, máximo: 200)"
    
    # Verificar prefixos válidos
    valid_prefixes = ['sk-', 'sk-proj-']
    if not any(clean_key.startswith(prefix) for prefix in valid_prefixes):
        return False, f"Prefixo inválido. Esperado: {valid_prefixes}, encontrado: {clean_key[:10]}..."
    
    # Verificar se é uma chave de projeto (sk-proj)
    if clean_key.startswith('sk-proj-'):
        # Chaves de projeto têm formato específico
        if len(clean_key) < 50:
            return False, f"Chave de projeto muito curta (comprimento: {len(clean_key)}, mínimo: 50)"
    
    return True, "Formato da chave válido"

def clean_openai_key(api_key: str) -> str:
    """
    Limpa a chave OpenAI removendo espaços e aspas.
    
    Args:
        api_key: A chave da API OpenAI
        
    Returns:
        str: Chave limpa
    """
    if not api_key:
        return ""
    
    return api_key.strip().strip('"').strip("'")

def mask_openai_key(api_key: str) -> str:
    """
    Mascara a chave OpenAI para logs seguros.
    
    Args:
        api_key: A chave da API OpenAI
        
    Returns:
        str: Chave mascarada
    """
    if not api_key or len(api_key) < 12:
        return "***"
    
    return f"{api_key[:7]}...{api_key[-4:]}"

def sanity_check_openai() -> bool:
    """
    Executa verificação de sanidade da configuração OpenAI.
    
    Returns:
        bool: True se a configuração está válida
    """
    try:
        # Obter chave do ambiente
        raw_key = os.getenv("OPENAI_API_KEY", "")
        
        if not raw_key:
            logger.error("❌ SANITY CHECK FAILED: OPENAI_API_KEY não definida")
            logger.error("   Solução: Defina OPENAI_API_KEY no arquivo .env")
            return False
        
        # Limpar chave
        clean_key = clean_openai_key(raw_key)
        
        # Validar formato
        is_valid, message = validate_openai_key_format(clean_key)
        
        if not is_valid:
            logger.error(f"❌ SANITY CHECK FAILED: {message}")
            logger.error(f"   Chave mascarada: {mask_openai_key(clean_key)}")
            logger.error("   Solução: Verifique se a chave OpenAI está correta no .env")
            return False
        
        # Log de sucesso
        masked_key = mask_openai_key(clean_key)
        key_type = "Project Key" if clean_key.startswith('sk-proj-') else "Legacy Key"
        
        logger.info(f"✅ SANITY CHECK PASSED: OpenAI configurada")
        logger.info(f"   Tipo: {key_type}")
        logger.info(f"   Chave: {masked_key}")
        logger.info(f"   Comprimento: {len(clean_key)} caracteres")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ SANITY CHECK ERROR: {e}")
        return False

def fail_startup_if_invalid() -> None:
    """
    Falha o startup se a configuração OpenAI for inválida.
    """
    if not sanity_check_openai():
        logger.critical("🚨 STARTUP ABORTADO: Configuração OpenAI inválida")
        logger.critical("   Para corrigir:")
        logger.critical("   1. Verifique OPENAI_API_KEY no arquivo .env")
        logger.critical("   2. Certifique-se de que a chave é válida (sk- ou sk-proj-)")
        logger.critical("   3. Reinicie o backend após a correção")
        sys.exit(1)

if __name__ == "__main__":
    # Teste standalone
    logging.basicConfig(level=logging.INFO)
    sanity_check_openai()