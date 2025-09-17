#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para popular a tabela products com dados realistas de auto peças
Baseado na auditoria do banco de dados realizada
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.product import Product
from app.models.company import Company
from app.db.session import SessionLocal
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dados realistas de auto peças
REALISTIC_PRODUCTS = [
    {
        "name": "Pastilha de Freio Dianteira Bosch",
        "description": "Pastilha de freio dianteira original Bosch para veículos populares. Excelente qualidade e durabilidade.",
        "sku": "BOSCH-PF-001",
        "part_number": "BB1234",
        "brand": "Bosch",
        "cost_price": 45.50,
        "sale_price": 89.90,
        "stock_quantity": 25,
        "weight": 0.850,
        "height": 15.5,
        "width": 12.0,
        "length": 8.5
    },
    {
        "name": "Filtro de Óleo Mann W712/75",
        "description": "Filtro de óleo Mann original para motores 1.0, 1.4 e 1.6. Compatível com diversos modelos.",
        "sku": "MANN-FO-712",
        "part_number": "W712/75",
        "brand": "Mann",
        "cost_price": 12.80,
        "sale_price": 24.90,
        "stock_quantity": 50,
        "weight": 0.320,
        "height": 8.5,
        "width": 8.5,
        "length": 12.0
    },
    {
        "name": "Amortecedor Dianteiro Monroe",
        "description": "Amortecedor dianteiro Monroe para Gol, Palio, Uno. Tecnologia OESpectrum para máximo conforto.",
        "sku": "MONROE-AD-G4",
        "part_number": "G8229",
        "brand": "Monroe",
        "cost_price": 85.00,
        "sale_price": 165.90,
        "stock_quantity": 12,
        "weight": 2.450,
        "height": 35.0,
        "width": 8.0,
        "length": 8.0
    },
    {
        "name": "Vela de Ignição NGK BPR6ES",
        "description": "Vela de ignição NGK padrão para motores 1.0 e 1.4. Eletrodo de cobre para melhor condutividade.",
        "sku": "NGK-VI-BPR6",
        "part_number": "BPR6ES",
        "brand": "NGK",
        "cost_price": 8.50,
        "sale_price": 16.90,
        "stock_quantity": 100,
        "weight": 0.045,
        "height": 9.5,
        "width": 1.4,
        "length": 1.4
    },
    {
        "name": "Correia Dentada Gates 5M875",
        "description": "Correia dentada Gates para motores 1.0 16V. Resistente e durável, ideal para alta performance.",
        "sku": "GATES-CD-5M875",
        "part_number": "5M875",
        "brand": "Gates",
        "cost_price": 35.20,
        "sale_price": 68.90,
        "stock_quantity": 18,
        "weight": 0.180,
        "height": 2.5,
        "width": 87.5,
        "length": 2.0
    },
    {
        "name": "Disco de Freio Ventilado Fremax",
        "description": "Disco de freio ventilado dianteiro Fremax. Excelente dissipação de calor e frenagem segura.",
        "sku": "FREMAX-DF-VT",
        "part_number": "BD5423",
        "brand": "Fremax",
        "cost_price": 65.80,
        "sale_price": 128.90,
        "stock_quantity": 8,
        "weight": 4.200,
        "height": 25.0,
        "width": 25.0,
        "length": 3.2
    },
    {
        "name": "Filtro de Ar Tecfil ARS1234",
        "description": "Filtro de ar Tecfil para motores 1.0, 1.4 e 1.6. Filtragem eficiente e proteção do motor.",
        "sku": "TECFIL-FA-1234",
        "part_number": "ARS1234",
        "brand": "Tecfil",
        "cost_price": 18.90,
        "sale_price": 36.90,
        "stock_quantity": 35,
        "weight": 0.250,
        "height": 5.0,
        "width": 20.0,
        "length": 25.0
    },
    {
        "name": "Bomba de Combustível Bosch",
        "description": "Bomba de combustível elétrica Bosch para tanque. Alta pressão e vazão adequada.",
        "sku": "BOSCH-BC-ELE",
        "part_number": "F000TE1456",
        "brand": "Bosch",
        "cost_price": 125.00,
        "sale_price": 245.90,
        "stock_quantity": 6,
        "weight": 0.850,
        "height": 15.0,
        "width": 8.0,
        "length": 8.0
    },
    {
        "name": "Radiador Visconde Alumínio",
        "description": "Radiador de alumínio Visconde para Gol G4/G5. Excelente troca térmica e resistência.",
        "sku": "VISCONDE-RAD-AL",
        "part_number": "RA2845",
        "brand": "Visconde",
        "cost_price": 180.00,
        "sale_price": 350.90,
        "stock_quantity": 4,
        "weight": 3.200,
        "height": 45.0,
        "width": 35.0,
        "length": 5.5
    },
    {
        "name": "Kit Embreagem Sachs",
        "description": "Kit completo de embreagem Sachs: disco, platô e rolamento. Para motores 1.0 e 1.4.",
        "sku": "SACHS-KE-COMP",
        "part_number": "6234000123",
        "brand": "Sachs",
        "cost_price": 220.00,
        "sale_price": 425.90,
        "stock_quantity": 3,
        "weight": 8.500,
        "height": 25.0,
        "width": 25.0,
        "length": 15.0
    }
]

def populate_products():
    """
    Popula a tabela products com dados realistas de auto peças
    """
    try:
        # Conectar ao banco
        db = SessionLocal()
        
        logger.info("🔄 Iniciando população da tabela products...")
        
        # Verificar se já existem produtos
        existing_count = db.query(Product).count()
        if existing_count > 0:
            logger.warning(f"⚠️  Já existem {existing_count} produtos na tabela. Abortando para evitar duplicatas.")
            return
        
        # Buscar uma empresa para associar os produtos
        company = db.query(Company).first()
        if not company:
            logger.error("❌ Nenhuma empresa encontrada. É necessário ter pelo menos uma empresa cadastrada.")
            return
        
        logger.info(f"📋 Associando produtos à empresa: {company.name} (ID: {company.id})")
        
        # Criar produtos
        products_created = 0
        for product_data in REALISTIC_PRODUCTS:
            try:
                # Verificar se SKU já existe
                existing_product = db.query(Product).filter(Product.sku == product_data['sku']).first()
                if existing_product:
                    logger.warning(f"⚠️  Produto com SKU {product_data['sku']} já existe. Pulando...")
                    continue
                
                # Criar produto
                product = Product(
                    name=product_data['name'],
                    description=product_data['description'],
                    sku=product_data['sku'],
                    part_number=product_data['part_number'],
                    brand=product_data['brand'],
                    cost_price=product_data['cost_price'],
                    sale_price=product_data['sale_price'],
                    stock_quantity=product_data['stock_quantity'],
                    weight=product_data['weight'],
                    height=product_data['height'],
                    width=product_data['width'],
                    length=product_data['length'],
                    company_id=company.id
                )
                
                db.add(product)
                products_created += 1
                logger.info(f"✅ Produto criado: {product_data['name']} (SKU: {product_data['sku']})")
                
            except Exception as e:
                logger.error(f"❌ Erro ao criar produto {product_data['name']}: {str(e)}")
                continue
        
        # Commit das alterações
        db.commit()
        logger.info(f"🎉 População concluída! {products_created} produtos criados com sucesso.")
        
        # Verificar resultado final
        final_count = db.query(Product).count()
        logger.info(f"📊 Total de produtos na tabela: {final_count}")
        
    except Exception as e:
        logger.error(f"❌ Erro durante a população: {str(e)}")
        if 'db' in locals():
            db.rollback()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 POPULAÇÃO DE PRODUTOS - AUTO PEÇAS REALISTAS")
    print("="*60)
    populate_products()
    print("="*60)
    print("✅ PROCESSO FINALIZADO")
    print("="*60 + "\n")