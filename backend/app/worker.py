import asyncio
import logging
from arq import Worker
from arq.connections import RedisSettings
from app.core.redis import redis_settings
from app.core.config import settings
from app.services.integration_service import import_initial_products

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Funções de tarefa que o ARQ pode executar
class WorkerFunctions:
    """Classe que contém todas as funções de tarefa do ARQ."""
    
    @staticmethod
    async def import_initial_products(ctx, integration_id: int):
        """Tarefa para importar produtos iniciais do Mercado Livre."""
        logger.info(f"Iniciando importação de produtos para integration_id: {integration_id}")
        try:
            from app.services.integration_service import import_initial_products as import_func
            result = await import_func(ctx, integration_id)
            logger.info(f"Importação concluída para integration_id: {integration_id}")
            return result
        except Exception as e:
            logger.error(f"Erro na importação para integration_id {integration_id}: {str(e)}")
            raise

# Configuração do worker
async def startup(ctx):
    """Função executada na inicialização do worker."""
    logger.info("Worker ARQ iniciado")

async def shutdown(ctx):
    """Função executada no encerramento do worker."""
    logger.info("Worker ARQ encerrado")

# Configuração das funções disponíveis para o ARQ
WORKER_FUNCTIONS = [
    WorkerFunctions.import_initial_products,
]

# Configuração do worker ARQ
class WorkerSettings:
    functions = WORKER_FUNCTIONS
    redis_settings = redis_settings
    on_startup = startup
    on_shutdown = shutdown
    max_jobs = 10
    job_timeout = 300  # 5 minutos
    keep_result = 3600  # 1 hora

def create_worker() -> Worker:
    """Cria e retorna uma instância do worker ARQ."""
    if not settings.REDIS_ENABLED:
        logger.warning("Redis desabilitado - Worker não será iniciado")
        return None
    return Worker(
        WorkerSettings,
        redis_settings=redis_settings,
    )

async def run_worker():
    """Executa o worker ARQ."""
    if not settings.REDIS_ENABLED:
        logger.info("Redis desabilitado - Worker não executado")
        return
    worker = create_worker()
    if worker:
        await worker.main()

if __name__ == "__main__":
    if settings.REDIS_ENABLED:
        logger.info("Iniciando worker ARQ...")
        worker = create_worker()
        if worker:
            asyncio.run(worker.main())
    else:
        logger.info("Redis desabilitado - Worker não será iniciado")
        print("⚠️ Worker ARQ não iniciado (Redis desabilitado)")