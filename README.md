# DL Auto Peças - Sistema de Gestão

Sistema completo de gestão para auto peças com integração ao Mercado Livre, desenvolvido com arquitetura moderna e escalável.

## 🏗️ Arquitetura

### Arquitetura Híbrida
- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI + PostgreSQL (lógica crítica e autenticação)
- **Integração**: API Mercado Livre para sincronização de produtos
- **Containerização**: Docker + Docker Compose

### Tecnologias Principais

#### Backend
- **FastAPI**: Framework web moderno para Python
- **PostgreSQL**: Banco de dados relacional
- **SQLAlchemy**: ORM para Python
- **JWT**: Autenticação e autorização
- **Alembic**: Migrations de banco

#### Frontend
- **React 18**: Biblioteca para UI
- **TypeScript**: Tipagem estática
- **Vite**: Build tool moderna
- **TanStack Query**: Gerenciamento de estado servidor
- **Tailwind CSS**: Framework CSS utilitário

## 🚀 Início Rápido

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Python 3.11+ (para desenvolvimento local)

### Executar com Docker

```bash
# Clonar repositório
git clone <repository-url>
cd DL_SISTEMA

# Iniciar todos os serviços
docker-compose up
```

### Acessar Aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

## 📁 Estrutura do Projeto

```
DL_SISTEMA/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/routes/      # Rotas da API
│   │   ├── models/          # Modelos do banco
│   │   ├── schemas/         # Schemas Pydantic
│   │   ├── services/        # Lógica de negócio
│   │   └── main.py          # App principal
│   ├── requirements.txt     # Dependências Python
│   ├── Dockerfile          # Container backend
│   └── README.md           # Docs backend
├── frontend/               # App React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── features/       # Features específicas
│   │   └── services/       # Serviços de API
│   ├── package.json        # Dependências Node
│   ├── Dockerfile         # Container frontend
│   └── README.md          # Docs frontend
├── docs/                  # Documentação do projeto
├── docker-compose.yml     # Orquestração containers
├── .gitignore            # Arquivos ignorados
└── README.md             # Este arquivo
```

## 👥 Perfis de Usuário

### 🔧 Gestor
- Acesso completo ao sistema
- Gestão de usuários e permissões
- Relatórios e analytics
- Configurações do sistema

### 💼 Vendedor
- Gestão de vendas e pedidos
- Consulta de produtos e estoque
- Atendimento ao cliente
- Relatórios de vendas

### 📢 Anúncios
- Gestão de produtos e catálogo
- Integração com Mercado Livre
- Controle de estoque
- Gestão de anúncios e preços

## 🔗 Integração Mercado Livre

### Funcionalidades
- ✅ Sincronização automática de produtos
- ✅ Gestão de anúncios
- ✅ Controle de estoque em tempo real
- ✅ Processamento de pedidos
- ✅ Atualização de preços
- ✅ Gestão de categorias

### Configuração
1. Obter credenciais da API do Mercado Livre
2. Configurar variáveis de ambiente
3. Executar sincronização inicial
4. Configurar webhooks (opcional)

## 🛠️ Desenvolvimento

### Backend Local
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Local
```bash
cd frontend
npm install
npm run dev
```

### Banco de Dados
```bash
# Executar migrations
alembic upgrade head

# Criar nova migration
alembic revision --autogenerate -m "description"
```

## 🎨 Design System

### Layout
- **Sidebar Flutuante**: Navegação lateral moderna
- **Design Premium**: Interface limpa e profissional
- **Responsivo**: Adaptado para desktop, tablet e mobile
- **UX/UI Consistente**: Padrões visuais unificados

### Cores
- **Primary**: Azul (#3B82F6)
- **Secondary**: Cinza (#6B7280)
- **Success**: Verde (#10B981)
- **Warning**: Amarelo (#F59E0B)
- **Error**: Vermelho (#EF4444)

## 📊 Funcionalidades

### ✅ Implementadas
- [x] Autenticação multi-perfil
- [x] CRUD de produtos
- [x] Gestão de usuários
- [x] Layout responsivo
- [x] Integração API base

### 🚧 Em Desenvolvimento
- [ ] Sincronização Mercado Livre
- [ ] Dashboard analytics
- [ ] Relatórios avançados
- [ ] Notificações em tempo real
- [ ] Sistema de backup

### 📋 Próximos Passos
1. **Configurar CI/CD Pipeline**
   - GitHub Actions
   - Testes automatizados
   - Deploy automático

2. **Implementar Funcionalidades Core**
   - Sistema de vendas
   - Controle de estoque
   - Relatórios financeiros

3. **Integração Mercado Livre**
   - Autenticação OAuth
   - Sincronização de produtos
   - Webhooks para atualizações

4. **Melhorias de Performance**
   - Cache Redis
   - Otimização de queries
   - CDN para assets

5. **Segurança e Monitoramento**
   - Logs centralizados
   - Monitoramento de performance
   - Backup automatizado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema:
- 📧 Email: suporte@dlautopecas.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Site: https://dlautopecas.com

---

**DL Auto Peças** - Sistema de Gestão Moderno e Eficiente 🚗⚙️