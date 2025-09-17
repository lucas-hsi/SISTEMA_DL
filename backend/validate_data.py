#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para validar a qualidade dos dados existentes no banco de dados
Verifica integridade, consistência e relacionamentos entre tabelas
"""

import sqlite3
import sys
from datetime import datetime
from app.db.session import SessionLocal
from app.models.company import Company
from app.models.product import Product
from app.models.user import User
from app.models.integration import Integration

def validate_database():
    """Executa validação completa dos dados do banco"""
    print("=" * 60)
    print("VALIDAÇÃO DE QUALIDADE DOS DADOS - DL AUTO PEÇAS")
    print("=" * 60)
    print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print()
    
    db = SessionLocal()
    
    try:
        # 1. Validar Companies
        print("1. VALIDANDO COMPANIES:")
        companies = db.query(Company).all()
        print(f"   Total de empresas: {len(companies)}")
        
        for company in companies:
            print(f"   - ID: {company.id}, Nome: {company.name}")
            print(f"     CNPJ: {company.cnpj}, Ativo: {company.is_active}")
            
            # Verificar produtos associados
            products_count = db.query(Product).filter(Product.company_id == company.id).count()
            print(f"     Produtos associados: {products_count}")
            
            # Verificar usuários associados
            users_count = db.query(User).filter(User.company_id == company.id).count()
            print(f"     Usuários associados: {users_count}")
            
            # Verificar integrações associadas
            integrations_count = db.query(Integration).filter(Integration.company_id == company.id).count()
            print(f"     Integrações associadas: {integrations_count}")
            print()
        
        # 2. Validar Products
        print("2. VALIDANDO PRODUCTS:")
        products = db.query(Product).all()
        print(f"   Total de produtos: {len(products)}")
        
        # Verificar produtos sem empresa
        orphan_products = db.query(Product).filter(Product.company_id.is_(None)).count()
        print(f"   Produtos órfãos (sem empresa): {orphan_products}")
        
        # Verificar produtos com preços inválidos
        invalid_price_products = db.query(Product).filter(
            (Product.sale_price <= 0) | (Product.cost_price <= 0)
        ).count()
        print(f"   Produtos com preços inválidos: {invalid_price_products}")
        
        # Mostrar alguns produtos de exemplo
        print("   Exemplos de produtos:")
        for product in products[:5]:
            print(f"   - SKU: {product.sku}, Nome: {product.name}")
            print(f"     Preço Venda: R$ {product.sale_price:.2f}, Custo: R$ {product.cost_price:.2f}")
            print(f"     Empresa ID: {product.company_id}")
            print()
        
        # 3. Validar Users
        print("3. VALIDANDO USERS:")
        users = db.query(User).all()
        print(f"   Total de usuários: {len(users)}")
        
        # Verificar usuários por tipo
        for user_type in ['gestor', 'vendedor', 'anuncios']:
            count = db.query(User).filter(User.user_type == user_type).count()
            print(f"   Usuários tipo '{user_type}': {count}")
        
        # Verificar usuários ativos
        active_users = db.query(User).filter(User.is_active == True).count()
        print(f"   Usuários ativos: {active_users}")
        
        # Verificar usuários órfãos
        orphan_users = db.query(User).filter(User.company_id.is_(None)).count()
        print(f"   Usuários órfãos (sem empresa): {orphan_users}")
        print()
        
        # 4. Validar Integrations
        print("4. VALIDANDO INTEGRATIONS:")
        integrations = db.query(Integration).all()
        print(f"   Total de integrações: {len(integrations)}")
        
        # Verificar integrações ativas
        active_integrations = db.query(Integration).filter(Integration.is_active == True).count()
        print(f"   Integrações ativas: {active_integrations}")
        
        # Verificar integrações órfãs
        orphan_integrations = db.query(Integration).filter(Integration.company_id.is_(None)).count()
        print(f"   Integrações órfãs (sem empresa): {orphan_integrations}")
        print()
        
        # 5. Verificar integridade referencial
        print("5. VERIFICANDO INTEGRIDADE REFERENCIAL:")
        
        # Produtos com company_id inválido
        invalid_product_refs = db.execute(
            "SELECT COUNT(*) FROM products p LEFT JOIN companies c ON p.company_id = c.id WHERE p.company_id IS NOT NULL AND c.id IS NULL"
        ).scalar()
        print(f"   Produtos com company_id inválido: {invalid_product_refs}")
        
        # Usuários com company_id inválido
        invalid_user_refs = db.execute(
            "SELECT COUNT(*) FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.company_id IS NOT NULL AND c.id IS NULL"
        ).scalar()
        print(f"   Usuários com company_id inválido: {invalid_user_refs}")
        
        # Integrações com company_id inválido
        invalid_integration_refs = db.execute(
            "SELECT COUNT(*) FROM integrations i LEFT JOIN companies c ON i.company_id = c.id WHERE i.company_id IS NOT NULL AND c.id IS NULL"
        ).scalar()
        print(f"   Integrações com company_id inválido: {invalid_integration_refs}")
        print()
        
        # 6. Resumo da validação
        print("6. RESUMO DA VALIDAÇÃO:")
        total_issues = orphan_products + invalid_price_products + orphan_users + orphan_integrations + invalid_product_refs + invalid_user_refs + invalid_integration_refs
        
        if total_issues == 0:
            print("   ✅ BANCO DE DADOS VÁLIDO - Nenhum problema encontrado!")
        else:
            print(f"   ⚠️  PROBLEMAS ENCONTRADOS: {total_issues}")
            print("   Recomenda-se corrigir os problemas antes de usar em produção.")
        
        print()
        print("=" * 60)
        print("VALIDAÇÃO CONCLUÍDA")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Erro durante validação: {str(e)}")
        return False
    
    finally:
        db.close()
    
    return total_issues == 0

if __name__ == "__main__":
    success = validate_database()
    sys.exit(0 if success else 1)