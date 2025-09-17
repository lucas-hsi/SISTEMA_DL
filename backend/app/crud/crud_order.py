from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, desc
from decimal import Decimal

from app.crud.base import CRUDBase
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderUpdate, OrderStatus
from app.schemas.order_item import OrderItemCreate


class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
    
    def create_order(self, db: Session, *, obj_in: OrderCreate) -> Order:
        """
        Cria um novo orçamento sem alterar o estoque.
        
        Esta função:
        1. Cria o orçamento com status ORCAMENTO_NOVO
        2. Cria os itens do orçamento
        3. Calcula o valor total
        
        O estoque só será alterado quando o orçamento for convertido em venda.
        """
        try:
            # Calcular o valor total do orçamento
            total_amount = self._calculate_total_amount(db, obj_in.items)
            
            # Criar o orçamento principal
            db_order = Order(
                status=OrderStatus.ORCAMENTO_NOVO,  # Sempre inicia como orçamento novo
                total_amount=total_amount,
                client_id=obj_in.client_id,
                user_id=obj_in.user_id,
                company_id=obj_in.company_id
            )
            db.add(db_order)
            db.flush()  # Para obter o ID do orçamento
            
            # Criar os itens do orçamento (sem alterar estoque)
            for item_data in obj_in.items:
                db_item = OrderItem(
                    quantity=item_data.quantity,
                    sale_price=item_data.sale_price,
                    order_id=db_order.id,
                    product_id=item_data.product_id
                )
                db.add(db_item)
            
            # Commit da transação
            db.commit()
            db.refresh(db_order)
            
            return db_order
            
        except SQLAlchemyError as e:
            # Rollback em caso de erro
            db.rollback()
            raise Exception(f"Erro ao criar orçamento: {str(e)}")
        except Exception as e:
            db.rollback()
            raise e
    
    def _validate_stock_availability(self, db: Session, items: List[OrderItemCreate]) -> None:
        """
        Valida se há estoque suficiente para todos os itens do pedido.
        """
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise ValueError(f"Produto com ID {item.product_id} não encontrado")
            
            if product.stock_quantity < item.quantity:
                raise ValueError(
                    f"Estoque insuficiente para o produto {product.name}. "
                    f"Disponível: {product.stock_quantity}, Solicitado: {item.quantity}"
                )
    
    def _calculate_total_amount(self, db: Session, items: List[OrderItemCreate]) -> Decimal:
        """
        Calcula o valor total do pedido baseado nos itens.
        """
        total = Decimal('0.00')
        for item in items:
            total += item.sale_price * item.quantity
        return total
    
    def _update_product_stock(self, db: Session, product_id: int, quantity: int) -> None:
        """
        Atualiza o estoque do produto subtraindo a quantidade vendida.
        """
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError(f"Produto com ID {product_id} não encontrado")
        
        product.stock_quantity -= quantity
        db.add(product)
    
    def get_orders_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
        """
        Busca pedidos por vendedor.
        """
        return (
            db.query(Order)
            .filter(Order.user_id == user_id)
            .options(joinedload(Order.items))
            .order_by(desc(Order.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_orders_by_client(self, db: Session, *, client_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
        """
        Busca pedidos por cliente.
        """
        return (
            db.query(Order)
            .filter(Order.client_id == client_id)
            .options(joinedload(Order.items))
            .order_by(desc(Order.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_orders_by_status(self, db: Session, *, status: OrderStatus, skip: int = 0, limit: int = 100) -> List[Order]:
        """
        Busca pedidos por status.
        """
        return (
            db.query(Order)
            .filter(Order.status == status)
            .options(joinedload(Order.items))
            .order_by(desc(Order.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_orders_by_company(self, db: Session, *, company_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
        """
        Busca pedidos por empresa.
        """
        return (
            db.query(Order)
            .filter(Order.company_id == company_id)
            .options(joinedload(Order.items))
            .order_by(desc(Order.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def update_order_status(self, db: Session, *, order_id: int, status: OrderStatus) -> Optional[Order]:
        """
        Atualiza apenas o status do pedido.
        """
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if db_order:
            db_order.status = status
            db.add(db_order)
            db.commit()
            db.refresh(db_order)
        return db_order
    
    def get_order_with_details(self, db: Session, *, order_id: int) -> Optional[Order]:
        """
        Busca um pedido com todos os detalhes (itens, cliente, vendedor, etc.).
        """
        return (
            db.query(Order)
            .filter(Order.id == order_id)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.client),
                joinedload(Order.user),
                joinedload(Order.company)
            )
            .first()
        )
    
    def cancel_order(self, db: Session, *, order_id: int) -> Optional[Order]:
        """
        Cancela um pedido e reverte o estoque (se necessário).
        """
        try:
            db_order = db.query(Order).filter(Order.id == order_id).first()
            if not db_order:
                return None
            
            # Se o pedido estava como "Vendido", reverter o estoque
            if db_order.status == OrderStatus.VENDIDO:
                for item in db_order.items:
                    product = db.query(Product).filter(Product.id == item.product_id).first()
                    if product:
                        product.stock_quantity += item.quantity
                        db.add(product)
            
            # Atualizar status para cancelado
            db_order.status = OrderStatus.CANCELADO
            db.add(db_order)
            
            db.commit()
            db.refresh(db_order)
            
            return db_order
            
        except SQLAlchemyError as e:
            db.rollback()
            raise Exception(f"Erro ao cancelar pedido: {str(e)}")
    
    def convert_quote_to_sale(self, db: Session, *, order_id: int) -> Optional[Order]:
        """
        Converte um orçamento em venda, alterando o status e fazendo a baixa no estoque.
        
        Esta função:
        1. Encontra o orçamento pelo order_id
        2. Valida se o orçamento pode ser convertido
        3. Muda o status para VENDIDO
        4. Executa a baixa de estoque para cada item
        5. Salva as alterações
        """
        try:
            # Buscar o orçamento com seus itens
            db_order = db.query(Order).options(
                joinedload(Order.items)
            ).filter(Order.id == order_id).first()
            
            if not db_order:
                raise Exception(f"Orçamento com ID {order_id} não encontrado")
            
            # Validar se o orçamento pode ser convertido
            if db_order.status not in [OrderStatus.ORCAMENTO_NOVO, OrderStatus.ORCAMENTO_ENVIADO]:
                raise Exception(f"Orçamento não pode ser convertido. Status atual: {db_order.status}")
            
            # Validar estoque antes de converter
            items_for_validation = []
            for item in db_order.items:
                items_for_validation.append(type('obj', (object,), {
                    'product_id': item.product_id,
                    'quantity': item.quantity
                })())
            
            self._validate_stock_availability(db, items_for_validation)
            
            # Fazer baixa no estoque para cada item
            for item in db_order.items:
                self._update_product_stock(db, item.product_id, item.quantity)
            
            # Atualizar status para vendido
            db_order.status = OrderStatus.VENDIDO
            db.add(db_order)
            
            db.commit()
            db.refresh(db_order)
            
            return db_order
            
        except SQLAlchemyError as e:
            db.rollback()
            raise Exception(f"Erro ao converter orçamento em venda: {str(e)}")
        except Exception as e:
            db.rollback()
            raise e


# Instância do CRUD
crud_order = CRUDOrder(Order)