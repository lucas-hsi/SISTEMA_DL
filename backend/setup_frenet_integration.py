#!/usr/bin/env python3
"""
Script para configurar a integração com a API da Frenet
Implementa lógica idempotente (procurar ou criar)
"""

import sys
import os
import json
from sqlalchemy.orm import Session

# Adicionar o diretório do app ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar dependências
from app.db.session import SessionLocal
from app.models.integration import Integration
from app.core.config import settings


def setup_frenet_integration():
    """
    Configura a integração com a Frenet de forma idempotente
    Procura por uma integração existente antes de criar uma nova
    """
    db = SessionLocal()
    
    try:
        # Procurar por integração Frenet existente para company_id=1
        existing_integration = db.query(Integration).filter(
            Integration.company_id == 1,
            Integration.service_type == "shipping",
            Integration.name == "Frenet"
        ).first()
        
        # Preparar credenciais em formato JSON
        credentials_data = {
            "api_token": settings.FRENET_API_TOKEN,
            "seller_cep": settings.SELLER_CEP,
            "api_url": "https://api.frenet.com.br"
        }
        credentials_json = json.dumps(credentials_data)
        
        if existing_integration:
            # Atualizar integração existente
            existing_integration.credentials = credentials_json
            existing_integration.is_active = True
            
            db.commit()
            print("✅ Integração Frenet atualizada com sucesso.")
            
        else:
            # Criar nova integração
            frenet_integration = Integration(
                name="Frenet",
                service_type="shipping",
                credentials=credentials_json,
                is_active=True,
                company_id=1
            )
            
            db.add(frenet_integration)
            db.commit()
            print("✅ Integração Frenet criada com sucesso.")
        
    except Exception as e:
        print(f"❌ Erro ao configurar integração Frenet: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def check_frenet_config():
    """
    Verifica se as configurações da Frenet estão corretas
    """
    print("🔍 Verificando configurações da Frenet...")
    
    if not settings.FRENET_API_TOKEN:
        print("❌ FRENET_API_TOKEN não configurado no .env")
        return False
    
    if not settings.SELLER_CEP:
        print("❌ SELLER_CEP não configurado no .env")
        return False
    
    print(f"✅ FRENET_API_TOKEN: {settings.FRENET_API_TOKEN[:10]}...")
    print(f"✅ SELLER_CEP: {settings.SELLER_CEP}")
    
    return True


if __name__ == "__main__":
    print("🚀 Configurando integração com a API da Frenet...\n")
    
    # Verificar configurações
    if not check_frenet_config():
        print("\n❌ Configurações inválidas. Verifique o arquivo .env")
        sys.exit(1)
    
    # Configurar integração
    setup_frenet_integration()
    print("\n🎉 Script executado com sucesso!")