import redis.asyncio as redis
from arq import create_pool
from arq.connections import RedisSettings
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Configurações do Redis para ARQ
redis_settings = RedisSettings(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    database=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
)

# Pool global de conexões Redis para ARQ
_redis_pool = None
_redis_available = None

async def init_redis_pool():
    """Inicializa o pool de conexões Redis para ARQ"""
    global _redis_pool, _redis_available
    
    if not settings.REDIS_ENABLED:
        logger.info("Redis desabilitado na configuração")
        _redis_available = False
        return
    
    try:
        _redis_pool = await create_pool(redis_settings)
        _redis_available = True
        logger.info("✅ Redis pool inicializado com sucesso")
    except Exception as e:
        logger.warning(f"⚠️ Redis não disponível: {e}")
        logger.info("Sistema continuará funcionando sem Redis")
        _redis_available = False
        _redis_pool = None

def is_redis_available() -> bool:
    """Verifica se o Redis está disponível"""
    global _redis_available
    return _redis_available is True

async def get_redis_pool():
    """Retorna o pool de conexões Redis para ARQ."""
    global _redis_pool
    if not is_redis_available():
        return None
    if _redis_pool is None:
        _redis_pool = await create_pool(redis_settings)
    return _redis_pool

async def close_redis_pool():
    """Fecha o pool de conexões Redis"""
    global _redis_pool
    if _redis_pool:
        _redis_pool.close()
        await _redis_pool.wait_closed()
        _redis_pool = None
        logger.info("✅ Redis pool fechado com sucesso")

# Conexão Redis padrão para uso geral
async def get_redis_connection():
    """Cria e retorna uma conexão Redis padrão."""
    return await redis.from_url(
        f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
        password=settings.REDIS_PASSWORD,
        encoding="utf-8",
        decode_responses=True
    )