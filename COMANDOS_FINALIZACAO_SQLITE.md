# 🚀 Lista de Comandos para Finalizar Configuração SQLite

Execute os seguintes comandos **em ordem** no seu terminal para finalizar a configuração do desenvolvimento local com SQLite:

## 📋 **Comandos de Finalização**

### 1. Navegar para o diretório do backend
```bash
cd backend
```
**Explicação:** Move para a pasta onde estão os arquivos do backend.

### 2. Instalar/atualizar as dependências
```bash
pip install -r requirements.txt
```
**Explicação:** Instala todas as bibliotecas necessárias do arquivo requirements.txt (sem o psycopg2-binary).

### 3. Navegar para a pasta da aplicação
```bash
cd app
```
**Explicação:** Move para a pasta onde estão os arquivos do Alembic e main.py.

### 4. Gerar nova migração para SQLite
```bash
alembic revision --autogenerate -m "Create user and company tables for SQLite"
```
**Explicação:** Cria uma nova migração compatível com SQLite baseada nos modelos User e Company.

### 5. Aplicar a migração
```bash
alembic upgrade head
```
**Explicação:** Executa a migração, criando as tabelas no banco SQLite (arquivo database.db será criado automaticamente).

### 6. Iniciar o servidor FastAPI
```bash
python main.py
```
**Explicação:** Inicia o servidor de desenvolvimento na porta 8000.

## 🎯 **Após Executar os Comandos**

- ✅ O servidor estará rodando em: `http://localhost:8000`
- ✅ Documentação da API estará em: `http://localhost:8000/docs`
- ✅ O arquivo `backend/database.db` será criado automaticamente
- ✅ Sistema 100% funcional sem dependências externas

## 🔍 **Para Verificar se Funcionou**

1. Acesse `http://localhost:8000/docs`
2. Teste o endpoint `GET /` (deve retornar mensagem de boas-vindas)
3. Crie uma empresa usando `POST /api/v1/companies/`
4. Crie um usuário usando `POST /api/v1/users/`
5. Faça login usando `POST /api/v1/login`

## 🎉 **Sistema Pronto!**
Seu sistema DL_SISTEMA estará 100% funcional para desenvolvimento local!
