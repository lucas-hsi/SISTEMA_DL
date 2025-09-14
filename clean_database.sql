-- Script para limpar o banco de dados e reiniciar as migrações
-- Execute como administrador do PostgreSQL

-- Conectar ao banco dl_sistema
\c dl_sistema;

-- Dropar todas as tabelas se existirem
DROP TABLE IF EXISTS alembic_version CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS company CASCADE;

-- Recriar a estrutura limpa (será feito pelo Alembic)
-- A tabela alembic_version será recriada automaticamente
