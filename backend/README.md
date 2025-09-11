# DL Auto Peças - Backend API

Backend da aplicação DL Auto Peças desenvolvido com FastAPI, PostgreSQL e integração com API do Mercado Livre.

## Tecnologias

- **FastAPI**: Framework web moderno e rápido para Python
- **PostgreSQL**: Banco de dados relacional
- **SQLAlchemy**: ORM para Python
- **Alembic**: Migrations de banco de dados
- **Pydantic**: Validação de dados
- **JWT**: Autenticação e autorização

## Estrutura do Projeto

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # Rotas da API
│   ├── models/              # Modelos do banco de dados
│   ├── schemas/             # Schemas Pydantic
│   ├── services/            # Lógica de negócio
│   └── main.py             # Aplicação principal
├── requirements.txt         # Dependências Python
├── Dockerfile              # Container Docker
└── README.md               # Este arquivo
```

## Configuração do Ambiente

### Pré-requisitos
- Python 3.11+
- PostgreSQL 13+
- Docker (opcional)

### Instalação Local

1. Criar ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Instalar dependências:
```bash
pip install -r requirements.txt
```

3. Configurar variáveis de ambiente:
```bash
cp .env.example .env
# Editar .env com suas configurações
```

4. Executar migrations:
```bash
alembic upgrade head
```

5. Iniciar servidor:
```bash
uvicorn app.main:app --reload
```

### Docker

```bash
docker build -t dl-backend .
docker run -p 8000:8000 dl-backend
```

## API Endpoints

- **GET /**: Status da API
- **GET /health**: Health check
- **POST /api/auth/login**: Login de usuário
- **GET /api/products**: Listar produtos
- **GET /api/users**: Listar usuários

## Documentação

Após iniciar o servidor, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Perfis de Usuário

- **Gestor**: Acesso completo ao sistema
- **Vendedor**: Gestão de vendas e clientes
- **Anúncios**: Gestão de produtos e integração ML

## Integração Mercado Livre

O sistema integra com a API do Mercado Livre para:
- Sincronização de produtos
- Gestão de anúncios
- Controle de estoque
- Processamento de pedidos