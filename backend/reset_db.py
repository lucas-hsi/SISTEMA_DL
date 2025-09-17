#!/usr/bin/env python3
import os
import subprocess

DB_FILE = "database.db"
ALEMBIC_VERSIONS_DIR = os.path.join("alembic", "versions")

print("🧹 Limpando o ambiente de banco de dados local...")

# 1. Apaga o arquivo do banco de dados se ele existir
if os.path.exists(DB_FILE):
    os.remove(DB_FILE)
    print(f"✅ Arquivo '{DB_FILE}' removido.")

# 2. Apaga o histórico de versões do alembic
# (Isso é opcional, mas garante um estado totalmente limpo se as migrações estiverem com problemas)
# CUIDADO: Não fazer isso em produção.
# for f in os.listdir(ALEMBIC_VERSIONS_DIR):
#    if f.endswith('.py'):
#        os.remove(os.path.join(ALEMBIC_VERSIONS_DIR, f))
# print("✅ Arquivos de versão do Alembic removidos.")

print("\n🚀 Executando migrações do zero...")

# 3. Executa o alembic upgrade head
subprocess.run(["alembic", "upgrade", "head"])

print("\n✨ Ambiente de banco de dados local recriado com sucesso!")