-- Comandos SQL para configurar o banco de dados
-- Execute estes comandos como administrador do PostgreSQL

-- Criar usuário
CREATE USER dl_user WITH PASSWORD 'SUA_SENHA_SECRETA_AQUI';

-- Criar banco de dados
CREATE DATABASE dl_sistema OWNER dl_user;

-- Dar privilégios ao usuário
GRANT ALL PRIVILEGES ON DATABASE dl_sistema TO dl_user;

-- Conectar ao banco dl_sistema e dar privilégios no schema public
\c dl_sistema;
GRANT ALL ON SCHEMA public TO dl_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dl_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dl_user;
