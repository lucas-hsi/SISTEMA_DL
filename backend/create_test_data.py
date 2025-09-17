import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base_class import Base
from app.core.config import settings
from werkzeug.security import generate_password_hash

# Importar modelos diretamente
from app.models.company import Company
from app.models.user import User
from app.models.client import Client
from app.models.product import Product

def create_test_data():
    print("🚀 Criando dados de teste...")
    
    try:
        # Criar engine e sessão
        engine = create_engine("sqlite:///./database.db")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Criar empresa
        company = Company(name="DL Auto Peças - Teste")
        db.add(company)
        db.commit()
        db.refresh(company)
        print(f"✅ Empresa criada: {company.name} (ID: {company.id})")
        
        # Criar usuários de teste
        users_data = [
            {
                "full_name": "João Vendedor",
                "email": f"vendedor{company.id}@dlautopecas.com",
                "role": "vendedor",
                "sales_goal": 50000.00,
                "discount_limit": 10.00
            },
            {
                "full_name": "Maria Gestora",
                "email": f"gestor{company.id}@dlautopecas.com",
                "role": "gestor",
                "sales_goal": None,
                "discount_limit": 25.00
            },
            {
                "full_name": "Carlos Anúncios",
                "email": f"anuncios{company.id}@dlautopecas.com",
                "role": "anuncios",
                "sales_goal": None,
                "discount_limit": 5.00
            }
        ]
        
        for user_data in users_data:
            # Verificar se usuário já existe
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"⚠️ Usuário já existe: {existing_user.full_name} (ID: {existing_user.id})")
                continue
                
            hashed_password = generate_password_hash("123456")
            user = User(
                full_name=user_data["full_name"],
                email=user_data["email"],
                hashed_password=hashed_password,
                role=user_data["role"],
                is_active=True,
                company_id=company.id,
                sales_goal=user_data["sales_goal"],
                discount_limit=user_data["discount_limit"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Usuário criado: {user.full_name} (ID: {user.id})")
        
        # Criar clientes
        clients_data = [
            {
                "name": "Auto Peças Silva",
                "client_type": "Cliente Final",
                "lead_status": "Quente",
                "lead_origin": "Balcão",
                "contact_person": "Carlos Silva",
                "email": "contato@autopecassilva.com",
                "phone": "(11) 98765-4321",
                "address": "Rua das Peças, 123, São Paulo - SP, 01234-567",
                "document": "12.345.678/0001-90",
                "notes": "Cliente frequente, sempre pontual nos pagamentos"
            },
            {
                "name": "Oficina do João",
                "client_type": "Mecânico",
                "lead_status": "Neutro",
                "lead_origin": "WhatsApp",
                "contact_person": "João Santos",
                "email": "joao@oficina.com",
                "phone": "(11) 91234-5678",
                "address": "Av. Principal, 456, São Paulo - SP, 04567-890",
                "document": "98.765.432/0001-10",
                "notes": "Oficina especializada em carros populares"
            },
            {
                "name": "Mecânica Central",
                "client_type": "Latoeiro",
                "lead_status": "Frio",
                "lead_origin": "Indicação",
                "contact_person": "Maria Central",
                "email": "central@mecanica.com",
                "phone": "(11) 95555-1234",
                "address": "Rua Central, 789, São Paulo - SP, 07890-123",
                "document": "11.222.333/0001-44",
                "notes": "Especializada em funilaria e pintura"
            }
        ]
        
        for client_data in clients_data:
            client = Client(
                name=client_data["name"],
                client_type=client_data["client_type"],
                lead_status=client_data["lead_status"],
                lead_origin=client_data["lead_origin"],
                contact_person=client_data["contact_person"],
                email=client_data["email"],
                phone=client_data["phone"],
                address=client_data["address"],
                document=client_data["document"],
                notes=client_data["notes"],
                company_id=company.id
            )
            db.add(client)
            db.commit()
            db.refresh(client)
            print(f"✅ Cliente criado: {client.name} (ID: {client.id})")
        
        # Criar produtos
        products_data = [
            {
                "name": "Filtro de Óleo Mann W712/75",
                "description": "Filtro de óleo para motores 1.0, 1.4 e 1.6",
                "sku": "FIL-W712-001",
                "sale_price": 25.90,
                "cost_price": 18.50,
                "stock_quantity": 50,
                "brand": "Mann",
                "part_number": "W712/75"
            },
            {
                "name": "Pastilha de Freio Dianteira Bosch",
                "description": "Pastilha de freio dianteira para veículos populares",
                "sku": "FRE-BB1234-002",
                "sale_price": 89.90,
                "cost_price": 65.00,
                "stock_quantity": 30,
                "brand": "Bosch",
                "part_number": "BB1234"
            },
            {
                "name": "Amortecedor Traseiro Monroe",
                "description": "Amortecedor traseiro para Gol, Palio, Uno",
                "sku": "SUS-G7890-003",
                "sale_price": 156.50,
                "cost_price": 115.00,
                "stock_quantity": 20,
                "brand": "Monroe",
                "part_number": "G7890"
            },
            {
                "name": "Vela de Ignição NGK",
                "description": "Vela de ignição iridium para motores flex",
                "sku": "MOT-ILFR6A11-004",
                "sale_price": 45.00,
                "cost_price": 32.00,
                "stock_quantity": 100,
                "brand": "NGK",
                "part_number": "ILFR6A11"
            },
            {
                "name": "Correia Dentada Gates",
                "description": "Correia dentada para motores 1.0 e 1.4",
                "sku": "MOT-5524XS-005",
                "sale_price": 78.90,
                "cost_price": 55.00,
                "stock_quantity": 25,
                "brand": "Gates",
                "part_number": "5524XS"
            }
        ]
        
        for product_data in products_data:
            product = Product(
                name=product_data["name"],
                description=product_data["description"],
                sku=product_data["sku"],
                sale_price=product_data["sale_price"],
                cost_price=product_data["cost_price"],
                stock_quantity=product_data["stock_quantity"],
                brand=product_data["brand"],
                part_number=product_data["part_number"],
                company_id=company.id
            )
            db.add(product)
            db.commit()
            db.refresh(product)
            print(f"✅ Produto criado: {product.name} (ID: {product.id})")
        
        db.close()
        print("\n🎉 Dados de teste criados com sucesso!")
        print("\n📋 Resumo:")
        print(f"   • 1 Empresa: DL Auto Peças - Teste")
        print(f"   • 1 Usuário: vendedor@dlautopecas.com (senha: 123456)")
        print(f"   • {len(clients_data)} Clientes")
        print(f"   • {len(products_data)} Produtos")
        print("\n🚀 Agora você pode testar o sistema de vendas!")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados de teste: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_data()