from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Define o caminho absoluto para o diretório raiz do projeto 'backend'
# Isso garante que sempre encontraremos os arquivos no lugar certo.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # Variáveis que serão lidas diretamente do arquivo .env
    DB_ENGINE: str
    DB_FILENAME: str
    
    # Variáveis de autenticação
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 horas
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 dias

    # Variáveis da API de Frete (Frenet)
    FRENET_API_TOKEN: str
    SELLER_CEP: str
    
    # Variável da API OpenAI
    OPENAI_API_KEY: str

    # Variável que será construída pela nossa lógica
    DATABASE_URL: str | None = None

    # Usamos o __init__ para construir a DATABASE_URL dinamicamente
    def __init__(self, **values):
        super().__init__(**values)
        if self.DB_ENGINE == "sqlite":
            # Constrói o caminho absoluto: /caminho/completo/para/o/projeto/backend/database.db
            db_path = BASE_DIR / self.DB_FILENAME
            self.DATABASE_URL = f"sqlite:///{db_path}"
        # No futuro, poderíamos adicionar lógica para outros bancos aqui
        # elif self.DB_ENGINE == "postgresql":
        #     ...

    # Configuração para ler o arquivo .env localizado na raiz do 'backend'
    model_config = SettingsConfigDict(env_file=str(BASE_DIR / '.env'))

# Instancia única das nossas configurações
settings = Settings()
