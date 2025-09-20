import httpx
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.integration_model import Integration
from app.models.product import Product
from app.models.product_image import ProductImage
from app.db.session import SessionLocal
from app.core.config import settings
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


def create_or_update_integration(
    db: Session, 
    company_id: int, 
    service_type: str, 
    credentials_data: Dict[str, Any]
) -> Integration:
    """
    Cria ou atualiza uma integração no banco de dados.
    
    Args:
        db: Sessão do banco de dados
        company_id: ID da empresa
        service_type: Tipo do serviço (ex: "MERCADO_LIVRE")
        credentials_data: Dados das credenciais em formato dict
    
    Returns:
        Integration: Instância da integração salva no banco
    """
    # Busca por integração existente
    existing_integration = db.query(Integration).filter(
        and_(
            Integration.company_id == company_id,
            Integration.service_type == service_type
        )
    ).first()
    
    if existing_integration:
        # Atualiza integração existente
        existing_integration.credentials = credentials_data
        existing_integration.is_active = True
        integration = existing_integration
    else:
        # Cria nova integração
        integration = Integration(
            name=f"Integração {service_type}",
            service_type=service_type,
            credentials=credentials_data,
            is_active=True,
            company_id=company_id
        )
        db.add(integration)
    
    # Commit da transação
    db.commit()
    db.refresh(integration)
    
    return integration


def get_integration_by_company_and_service(
    db: Session, 
    company_id: int, 
    service_type: str
) -> Integration:
    """
    Busca uma integração específica por empresa e tipo de serviço.
    
    Args:
        db: Sessão do banco de dados
        company_id: ID da empresa
        service_type: Tipo do serviço
    
    Returns:
        Integration: Instância da integração ou None se não encontrada
    """
    return db.query(Integration).filter(
        and_(
            Integration.company_id == company_id,
            Integration.service_type == service_type,
            Integration.is_active == True
        )
    ).first()


def get_active_integrations_by_company(db: Session, company_id: int) -> list[Integration]:
    """
    Busca todas as integrações ativas de uma empresa.
    
    Args:
        db: Sessão do banco de dados
        company_id: ID da empresa
    
    Returns:
        list[Integration]: Lista de integrações ativas
    """
    return db.query(Integration).filter(
        and_(
            Integration.company_id == company_id,
            Integration.is_active == True
        )
    ).all()


async def refresh_mercadolivre_token(integration: Integration, db: Session) -> bool:
    """
    Renova o access_token do Mercado Livre usando o refresh_token.
    
    Args:
        integration: Instância da integração
        db: Sessão do banco de dados
    
    Returns:
        bool: True se a renovação foi bem-sucedida, False caso contrário
    """
    try:
        credentials = integration.credentials
        refresh_token = credentials.get('refresh_token')
        
        if not refresh_token:
            logger.error(f"Refresh token não encontrado para integration_id: {integration.id}")
            return False
        
        # Dados para renovação do token
        token_data = {
            'grant_type': 'refresh_token',
            'client_id': settings.MELI_APP_ID,
        'client_secret': settings.MELI_CLIENT_SECRET,
            'refresh_token': refresh_token
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.mercadolibre.com/oauth/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code == 200:
                token_response = response.json()
                
                # Atualiza as credenciais com o novo token
                credentials.update({
                    'access_token': token_response['access_token'],
                    'refresh_token': token_response.get('refresh_token', refresh_token),
                    'expires_in': token_response.get('expires_in', 21600),
                    'token_updated_at': datetime.utcnow().isoformat()
                })
                
                integration.credentials = credentials
                db.commit()
                db.refresh(integration)
                
                logger.info(f"Token renovado com sucesso para integration_id: {integration.id}")
                return True
            else:
                logger.error(f"Erro ao renovar token para integration_id {integration.id}: {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Exceção ao renovar token para integration_id {integration.id}: {str(e)}")
        return False


async def ensure_valid_token(integration: Integration, db: Session) -> bool:
    """
    Garante que o access_token está válido, renovando se necessário.
    
    Args:
        integration: Instância da integração
        db: Sessão do banco de dados
    
    Returns:
        bool: True se o token está válido, False caso contrário
    """
    credentials = integration.credentials
    
    # Verifica se há informações de expiração
    token_updated_at = credentials.get('token_updated_at')
    expires_in = credentials.get('expires_in', 21600)  # 6 horas por padrão
    
    if token_updated_at:
        updated_time = datetime.fromisoformat(token_updated_at)
        expiry_time = updated_time + timedelta(seconds=expires_in - 300)  # 5 min de margem
        
        if datetime.utcnow() >= expiry_time:
            logger.info(f"Token expirado para integration_id: {integration.id}, renovando...")
            return await refresh_mercadolivre_token(integration, db)
    
    return True


def map_mercadolivre_to_product(ml_item: Dict[str, Any], company_id: int) -> Product:
    """
    Converte um item do Mercado Livre para o modelo Product do SQLAlchemy.
    
    Args:
        ml_item: Dados do item do Mercado Livre
        company_id: ID da empresa
    
    Returns:
        Product: Instância do produto mapeado
    """
    # Extrai informações básicas
    name = ml_item.get('title', 'Produto sem título')
    description = ml_item.get('description', '')
    sku = f"ML_{ml_item.get('id', '')}"
    sale_price = float(ml_item.get('price', 0))
    stock_quantity = ml_item.get('available_quantity', 0)
    
    # Extrai atributos específicos
    attributes = ml_item.get('attributes', [])
    brand = None
    part_number = None
    weight = None
    
    for attr in attributes:
        attr_id = attr.get('id', '')
        attr_value = attr.get('value_name', '')
        
        if attr_id == 'BRAND':
            brand = attr_value
        elif attr_id == 'MPN':
            part_number = attr_value
        elif attr_id == 'WEIGHT':
            try:
                weight = float(attr_value.replace('kg', '').replace('g', '').strip())
                if 'g' in attr_value and 'kg' not in attr_value:
                    weight = weight / 1000  # Converte gramas para kg
            except (ValueError, AttributeError):
                pass
    
    # Cria o produto
    product = Product(
        name=name[:255],  # Limita o tamanho do nome
        description=description,
        sku=sku,
        part_number=part_number,
        brand=brand,
        sale_price=sale_price,
        stock_quantity=stock_quantity,
        weight=weight,
        company_id=company_id
    )
    
    return product


async def import_initial_products(ctx, integration_id: int) -> Dict[str, Any]:
    """
    Tarefa principal para importar produtos iniciais do Mercado Livre.
    
    Args:
        ctx: Contexto do ARQ
        integration_id: ID da integração
    
    Returns:
        Dict: Resultado da importação
    """
    db = SessionLocal()
    try:
        logger.info(f"Iniciando importação de produtos para integration_id: {integration_id}")
        
        # Busca a integração
        integration = db.query(Integration).filter(
            Integration.id == integration_id,
            Integration.is_active == True
        ).first()
        
        if not integration:
            raise ValueError(f"Integração {integration_id} não encontrada ou inativa")
        
        # --- INÍCIO DO NOVO BLOCO DE DEPURAÇÃO ---
        print("\n--- DEBUG AVANÇADO ---")
        print(f"1. Credenciais cruas do DB: {integration.credentials}")
        
        # Garante que o token está válido
        if not await ensure_valid_token(integration, db):
            raise ValueError(f"Não foi possível obter token válido para integration_id: {integration_id}")
        
        access_token = integration.credentials.get('access_token')
        print(f"2. Access Token a ser usado: {access_token}")
        headers = {'Authorization': f'Bearer {access_token}'}
        print(f"3. Cabeçalho final da requisição: {headers}")
        print("--- FIM DO DEBUG AVANÇADO ---\n")
        # --- FIM DO NOVO BLOCO DE DEPURAÇÃO ---
        
        # URL de busca
        search_url = 'https://api.mercadolibre.com/users/me/items/search'
        # ADICIONE ESTA LINHA:
        print(f"--- DEBUG: URL de busca que será usada: {search_url} ---")
        
        async with httpx.AsyncClient() as client:
            # Busca a lista de anúncios do usuário
            logger.info(f"Buscando lista de anúncios para integration_id: {integration_id}")
            items_response = await client.get(
                search_url,
                headers=headers,
                params={'limit': 100, 'offset': 0}
            )
            
            if items_response.status_code != 200:
                raise ValueError(f"Erro ao buscar anúncios: {items_response.text}")
            
            items_data = items_response.json()
            item_ids = items_data.get('results', [])
            
            if not item_ids:
                logger.info(f"Nenhum anúncio encontrado para integration_id: {integration_id}")
                return {'status': 'success', 'imported_count': 0, 'message': 'Nenhum anúncio encontrado'}
            
            # Busca detalhes dos primeiros 100 anúncios
            logger.info(f"Buscando detalhes de {len(item_ids)} anúncios")
            ids_param = ','.join(item_ids[:100])
            details_response = await client.get(
                f'https://api.mercadolibre.com/items?ids={ids_param}',
                headers=headers
            )
            
            if details_response.status_code != 200:
                raise ValueError(f"Erro ao buscar detalhes dos anúncios: {details_response.text}")
            
            details_data = details_response.json()
            
            # Processa e salva os produtos
            imported_count = 0
            skipped_count = 0
            
            for item_detail in details_data:
                if item_detail.get('code') == 200:  # Item válido
                    item_body = item_detail.get('body', {})
                    sku = f"ML_{item_body.get('id', '')}"
                    
                    # Verifica se o produto já existe
                    existing_product = db.query(Product).filter(
                        and_(
                            Product.sku == sku,
                            Product.company_id == integration.company_id
                        )
                    ).first()
                    
                    if existing_product:
                        skipped_count += 1
                        continue
                    
                    # Mapeia e salva o produto
                    try:
                        product = map_mercadolivre_to_product(item_body, integration.company_id)
                        db.add(product)
                        db.flush()  # Para obter o ID do produto
                        
                        # Adiciona imagens se disponíveis
                        pictures = item_body.get('pictures', [])
                        for idx, picture in enumerate(pictures[:5]):  # Máximo 5 imagens
                            image = ProductImage(
                                url=picture.get('url', ''),
                                order=idx,
                                product_id=product.id
                            )
                            db.add(image)
                        
                        imported_count += 1
                        
                    except Exception as e:
                        logger.error(f"Erro ao processar produto {sku}: {str(e)}")
                        continue
            
            # Commit das alterações
            db.commit()
            
            result = {
                'status': 'success',
                'imported_count': imported_count,
                'skipped_count': skipped_count,
                'total_processed': len(details_data),
                'message': f'Importação concluída: {imported_count} produtos importados, {skipped_count} ignorados'
            }
            
            logger.info(f"Importação concluída para integration_id: {integration_id} - {result['message']}")
            return result
            
    except Exception as e:
        db.rollback()
        logger.error(f"Erro na importação para integration_id {integration_id}: {str(e)}")
        raise
    finally:
        db.close()


class IntegrationService:
    """
    Classe de serviço para gerenciar integrações e importação de produtos.
    """
    
    @staticmethod
    async def import_products(integration_id: int) -> Dict[str, Any]:
        """
        Importa produtos de uma integração específica.
        
        Args:
            integration_id: ID da integração
            
        Returns:
            Dict[str, Any]: Resultado da importação
        """
        return await import_initial_products(None, integration_id)
    
    @staticmethod
    def create_integration(
        company_id: int, 
        service_type: str, 
        credentials_data: Dict[str, Any]
    ) -> Integration:
        """
        Cria ou atualiza uma integração.
        
        Args:
            company_id: ID da empresa
            service_type: Tipo do serviço
            credentials_data: Dados das credenciais
            
        Returns:
            Integration: Instância da integração
        """
        db = SessionLocal()
        try:
            return create_or_update_integration(db, company_id, service_type, credentials_data)
        finally:
            db.close()
    
    @staticmethod
    def get_integration(company_id: int, service_type: str) -> Optional[Integration]:
        """
        Busca uma integração por empresa e tipo de serviço.
        
        Args:
            company_id: ID da empresa
            service_type: Tipo do serviço
            
        Returns:
            Optional[Integration]: Integração encontrada ou None
        """
        db = SessionLocal()
        try:
            return get_integration_by_company_and_service(db, company_id, service_type)
        finally:
            db.close()
    
    @staticmethod
    def get_active_integrations(company_id: int) -> List[Integration]:
        """
        Busca todas as integrações ativas de uma empresa.
        
        Args:
            company_id: ID da empresa
            
        Returns:
            List[Integration]: Lista de integrações ativas
        """
        db = SessionLocal()
        try:
            return get_active_integrations_by_company(db, company_id)
        finally:
            db.close()