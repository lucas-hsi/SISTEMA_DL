#!/usr/bin/env python3
"""
Script para verificar as tabelas criadas no banco de dados SQLite.
Execute este script do diretório backend: python check_tables.py
"""

import sys
import os

# Adiciona o diretório app ao path para permitir imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Muda para o diretório app para usar o banco de dados correto
os.chdir(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.company import Company
from app.models.user import User

def check_database_tables():
    """Verifica as tabelas criadas no banco de dados."""
    db = SessionLocal()
    try:
        # Lista todas as tabelas
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = result.fetchall()
        
        print("=== TABELAS CRIADAS NO BANCO ===")
        for table in tables:
            print(f"- {table[0]}")
        
        print("\n=== VERIFICANDO ESTRUTURA DAS TABELAS ===")
        
        # Verifica estrutura da tabela company
        try:
            result = db.execute(text("PRAGMA table_info(company)"))
            company_columns = result.fetchall()
            print("\nTabela 'company':")
            for col in company_columns:
                print(f"  - {col[1]} ({col[2]})")
        except Exception as e:
            print(f"Erro ao verificar tabela company: {e}")
        
        # Verifica estrutura da tabela user
        try:
            result = db.execute(text("PRAGMA table_info(user)"))
            user_columns = result.fetchall()
            print("\nTabela 'user':")
            for col in user_columns:
                print(f"  - {col[1]} ({col[2]})")
        except Exception as e:
            print(f"Erro ao verificar tabela user: {e}")
            
        print("\n=== CONTAGEM DE REGISTROS ===")
        
        # Conta registros em cada tabela
        try:
            result = db.execute(text("SELECT COUNT(*) FROM company"))
            company_count = result.fetchone()[0]
            print(f"Empresas: {company_count}")
        except Exception as e:
            print(f"Erro ao contar empresas: {e}")
            
        try:
            result = db.execute(text("SELECT COUNT(*) FROM user"))
            user_count = result.fetchone()[0]
            print(f"Usuários: {user_count}")
        except Exception as e:
            print(f"Erro ao contar usuários: {e}")
            
    except Exception as e:
        print(f"Erro geral: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_database_tables()