#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AUDITORIA COMPLETA DO BANCO DE DADOS - DL AUTO PEÇAS
Script para mapear estrutura completa do banco SQLite
"""

import sqlite3
import os
import sys

def audit_database():
    """Executa auditoria completa do banco de dados"""
    
    db_path = 'database.db'
    
    if not os.path.exists(db_path):
        print(f"❌ ERRO: Banco de dados não encontrado em {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("\n" + "="*60)
        print("🔍 AUDITORIA FASE 1: MAPEAMENTO COMPLETO DO BANCO")
        print("="*60)
        
        # 1. LISTAR TODAS AS TABELAS
        print("\n📋 1. TABELAS EXISTENTES:")
        print("-" * 30)
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("⚠️  NENHUMA TABELA ENCONTRADA!")
            conn.close()
            return
        
        table_names = [table[0] for table in tables]
        for i, table_name in enumerate(table_names, 1):
            print(f"{i:2d}. {table_name}")
        
        print(f"\n📊 TOTAL: {len(table_names)} tabelas encontradas")
        
        # 2. ESTRUTURA DETALHADA DE CADA TABELA
        print("\n" + "="*60)
        print("🔍 AUDITORIA FASE 1: ESTRUTURA DAS TABELAS")
        print("="*60)
        
        for table_name in table_names:
            print(f"\n📋 TABELA: {table_name.upper()}")
            print("-" * 50)
            
            # Schema da tabela
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            if columns:
                print("CAMPOS:")
                for col in columns:
                    cid, name, data_type, not_null, default_value, pk = col
                    nullable = "NOT NULL" if not_null else "NULL"
                    primary = "PRIMARY KEY" if pk else ""
                    default = f"DEFAULT {default_value}" if default_value else ""
                    
                    print(f"  • {name:<20} {data_type:<15} {nullable:<10} {primary} {default}")
            
            # Foreign Keys
            cursor.execute(f"PRAGMA foreign_key_list({table_name});")
            fks = cursor.fetchall()
            
            if fks:
                print("\nFOREIGN KEYS:")
                for fk in fks:
                    id_fk, seq, table_ref, from_col, to_col, on_update, on_delete, match = fk
                    print(f"  • {from_col} → {table_ref}.{to_col}")
            
            # Índices
            cursor.execute(f"PRAGMA index_list({table_name});")
            indexes = cursor.fetchall()
            
            if indexes:
                print("\nÍNDICES:")
                for idx in indexes:
                    seq, name, unique, origin, partial = idx
                    unique_str = "UNIQUE" if unique else "INDEX"
                    print(f"  • {name} ({unique_str})")
        
        # 3. ANÁLISE DE DADOS EXISTENTES
        print("\n" + "="*60)
        print("🔍 AUDITORIA FASE 2: ANÁLISE DE DADOS EXISTENTES")
        print("="*60)
        
        total_records = 0
        
        for table_name in table_names:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            total_records += count
            
            status = "✅ COM DADOS" if count > 0 else "⚠️  VAZIA"
            print(f"{table_name:<25} {count:>6} registros {status}")
            
            # Se tem dados, mostrar amostra
            if count > 0 and count <= 5:
                print(f"   📋 Amostra completa:")
                cursor.execute(f"SELECT * FROM {table_name};")
                rows = cursor.fetchall()
                for i, row in enumerate(rows, 1):
                    print(f"      {i}. {row}")
            elif count > 5:
                print(f"   📋 Primeiros 3 registros:")
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
                rows = cursor.fetchall()
                for i, row in enumerate(rows, 1):
                    print(f"      {i}. {row}")
        
        print(f"\n📊 TOTAL GERAL: {total_records} registros em {len(table_names)} tabelas")
        
        # 4. RELATÓRIO DE INTEGRIDADE
        print("\n" + "="*60)
        print("🔍 AUDITORIA FASE 3: RELATÓRIO DE INTEGRIDADE")
        print("="*60)
        
        # Verificar tabelas essenciais esperadas
        expected_tables = ['companies', 'users', 'products', 'clients', 'orders', 'order_items']
        missing_tables = []
        existing_essential = []
        
        for table in expected_tables:
            if table in table_names:
                existing_essential.append(table)
            else:
                missing_tables.append(table)
        
        print("\n📋 TABELAS ESSENCIAIS:")
        for table in existing_essential:
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            count = cursor.fetchone()[0]
            print(f"  ✅ {table:<20} ({count} registros)")
        
        if missing_tables:
            print("\n⚠️  TABELAS ESSENCIAIS AUSENTES:")
            for table in missing_tables:
                print(f"  ❌ {table}")
        
        # 5. RECOMENDAÇÕES
        print("\n" + "="*60)
        print("📋 RECOMENDAÇÕES PARA POPULAÇÃO")
        print("="*60)
        
        if total_records == 0:
            print("\n🚨 BANCO COMPLETAMENTE VAZIO")
            print("   Necessário popular com dados mínimos essenciais")
        elif total_records < 10:
            print("\n⚠️  BANCO COM POUCOS DADOS")
            print("   Recomendado adicionar mais dados de teste")
        else:
            print("\n✅ BANCO COM DADOS SUFICIENTES")
            print("   Verificar qualidade dos dados existentes")
        
        print("\n📋 PRÓXIMOS PASSOS:")
        print("1. Validar estrutura das tabelas essenciais")
        print("2. Verificar relacionamentos (Foreign Keys)")
        print("3. Analisar qualidade dos dados existentes")
        print("4. Definir estratégia de população com dados REALISTAS")
        print("5. NUNCA popular sem aprovação prévia")
        
        conn.close()
        
        print("\n" + "="*60)
        print("✅ AUDITORIA CONCLUÍDA COM SUCESSO")
        print("="*60)
        
    except Exception as e:
        print(f"❌ ERRO durante auditoria: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    audit_database()