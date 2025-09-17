from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.v1 import deps
from app.crud.crud_order import crud_order
from app.models.user import User
from app.schemas.order import (
    Order,
    OrderCreate,
    OrderUpdate,
    OrderWithDetails,
    OrderSummary,
    OrderStatus
)
from app.core.security import check_permissions

router = APIRouter()


@router.post("/", response_model=Order, status_code=status.HTTP_201_CREATED)
def create_order(
    *,
    db: Session = Depends(deps.get_db),
    order_in: OrderCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Order:
    """
    Criar um novo pedido.
    
    Permissões: vendedor, gestor
    """
    # Verificar permissões
    if not check_permissions(current_user.role, ["vendedor", "gestor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para criar pedidos"
        )
    
    # Verificar se o usuário pode criar pedidos para esta empresa
    if current_user.company_id != order_in.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode criar pedidos para outra empresa"
        )
    
    # Se for vendedor, só pode criar pedidos para si mesmo
    if current_user.role == "vendedor" and current_user.id != order_in.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendedor só pode criar pedidos para si mesmo"
        )
    
    try:
        order = crud_order.create_order(db=db, obj_in=order_in)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


@router.get("/", response_model=List[OrderSummary])
def list_orders(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[OrderStatus] = Query(None),
    client_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None)
) -> List[OrderSummary]:
    """
    Listar pedidos com filtros.
    
    Permissões: vendedor, gestor
    """
    # Verificar permissões
    if not check_permissions(current_user.role, ["vendedor", "gestor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para listar pedidos"
        )
    
    # Se for vendedor, só pode ver seus próprios pedidos
    if current_user.role == "vendedor":
        user_id = current_user.id
    
    # Aplicar filtros
    if status_filter:
        orders = crud_order.get_orders_by_status(
            db=db, status=status_filter, skip=skip, limit=limit
        )
    elif client_id:
        orders = crud_order.get_orders_by_client(
            db=db, client_id=client_id, skip=skip, limit=limit
        )
    elif user_id:
        orders = crud_order.get_orders_by_user(
            db=db, user_id=user_id, skip=skip, limit=limit
        )
    else:
        orders = crud_order.get_orders_by_company(
            db=db, company_id=current_user.company_id, skip=skip, limit=limit
        )
    
    # Converter para OrderSummary
    order_summaries = []
    for order in orders:
        order_summary = OrderSummary(
            id=order.id,
            status=order.status,
            total_amount=order.total_amount,
            client_name=order.client.name if order.client else None,
            user_name=order.user.name if order.user else None,
            created_at=order.created_at,
            items_count=len(order.items)
        )
        order_summaries.append(order_summary)
    
    return order_summaries


@router.get("/{order_id}", response_model=OrderWithDetails)
def get_order(
    *,
    db: Session = Depends(deps.get_db),
    order_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> OrderWithDetails:
    """
    Buscar um pedido específico com detalhes.
    
    Permissões: vendedor, gestor
    """
    # Verificar permissões
    if not check_permissions(current_user.role, ["vendedor", "gestor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para visualizar pedidos"
        )
    
    order = crud_order.get_order_with_details(db=db, order_id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )
    
    # Verificar se o usuário pode ver este pedido
    if current_user.role == "vendedor" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode visualizar pedidos de outros vendedores"
        )
    
    if order.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode visualizar pedidos de outra empresa"
        )
    
    return order


@router.put("/{order_id}", response_model=Order)
def update_order(
    *,
    db: Session = Depends(deps.get_db),
    order_id: int,
    order_in: OrderUpdate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Order:
    """
    Atualizar um pedido.
    
    Permissões: vendedor, gestor
    """
    # Verificar permissões
    if not check_permissions(current_user.role, ["vendedor", "gestor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para atualizar pedidos"
        )
    
    order = crud_order.get(db=db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )
    
    # Verificar se o usuário pode atualizar este pedido
    if current_user.role == "vendedor" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode atualizar pedidos de outros vendedores"
        )
    
    if order.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode atualizar pedidos de outra empresa"
        )
    
    order = crud_order.update(db=db, db_obj=order, obj_in=order_in)
    return order


@router.patch("/{order_id}/status", response_model=Order)
def update_order_status(
    *,
    db: Session = Depends(deps.get_db),
    order_id: int,
    status: OrderStatus,
    current_user: User = Depends(deps.get_current_active_user)
) -> Order:
    """
    Atualizar apenas o status de um pedido.
    
    Permissões: vendedor, gestor
    """
    # Verificar permissões
    if not check_permissions(current_user.role, ["vendedor", "gestor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para atualizar status de pedidos"
        )
    
    order = crud_order.get(db=db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )
    
    # Verificar se o usuário pode atualizar este pedido
    if current_user.role == "vendedor" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode atualizar pedidos de outros vendedores"
        )
    
    if order.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode atualizar pedidos de outra empresa"
        )
    
    order = crud_order.update_order_status(db=db, order_id=order_id, status=status)
    return order


@router.delete("/{order_id}/cancel", response_model=Order)
def cancel_order(
    *,
    db: Session = Depends(deps.get_db),
    order_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> Order:
    """
    Cancelar um pedido (reverte estoque se necessário).
    
    Permissões: vendedor, gestor
    """
    # Verificar permissões
    if not check_permissions(current_user.role, ["vendedor", "gestor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para cancelar pedidos"
        )
    
    order = crud_order.get(db=db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )
    
    # Verificar se o usuário pode cancelar este pedido
    if current_user.role == "vendedor" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode cancelar pedidos de outros vendedores"
        )
    
    if order.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode cancelar pedidos de outra empresa"
        )
    
    if order.status == OrderStatus.CANCELADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pedido já está cancelado"
        )
    
    try:
        order = crud_order.cancel_order(db=db, order_id=order_id)
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao cancelar pedido: {str(e)}"
        )


@router.post("/{order_id}/convert-to-sale", response_model=Order)
def convert_quote_to_sale(
    *,
    db: Session = Depends(deps.get_db),
    order_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> Order:
    """
    Converter um orçamento em venda.
    
    Permissões: vendedor, gestor
    """
    # Verificar permissões
    if not check_permissions(current_user.role, ["vendedor", "gestor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para converter orçamentos em vendas"
        )
    
    # Buscar o orçamento para verificar permissões
    order = crud_order.get(db=db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orçamento não encontrado"
        )
    
    # Verificar se o usuário pode acessar este orçamento
    if current_user.company_id != order.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não pode acessar orçamentos de outra empresa"
        )
    
    # Se for vendedor, só pode converter seus próprios orçamentos
    if current_user.role == "vendedor" and current_user.id != order.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendedor só pode converter seus próprios orçamentos"
        )
    
    # Verificar se o orçamento pode ser convertido
    if order.status not in [OrderStatus.ORCAMENTO_NOVO, OrderStatus.ORCAMENTO_ENVIADO]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Orçamento não pode ser convertido. Status atual: {order.status}"
        )
    
    try:
        converted_order = crud_order.convert_quote_to_sale(db=db, order_id=order_id)
        return converted_order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao converter orçamento em venda: {str(e)}"
        )


@router.get("/{order_id}/pdf")
def generate_order_pdf(
    *,
    db: Session = Depends(deps.get_db),
    order_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> StreamingResponse:
    """
    Gerar PDF do orçamento.
    
    Permissões: vendedor, gestor
    """
    from app.services.pdf_service import generate_quote_pdf
    
    # Verificar permissões
    if not check_permissions(current_user.role, ["vendedor", "gestor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para gerar PDFs"
        )
    
    # Buscar o pedido com todos os dados relacionados
    order = crud_order.get_order_with_details(db=db, order_id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )
    
    # Verificar se o usuário tem acesso a este pedido
    if current_user.company_id != order.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem acesso a este pedido"
        )
    
    # Se for vendedor, só pode acessar seus próprios pedidos
    if current_user.role == "vendedor" and current_user.id != order.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendedor só pode acessar seus próprios pedidos"
        )
    
    try:
        # Preparar dados para o PDF
        order_data = {
            "id": order.id,
            "items": [
                {
                    "product": {
                        "name": item.product.name if item.product else "Produto",
                        "description": item.product.description if item.product else ""
                    },
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price)
                }
                for item in order.items
            ]
        }
        
        company_data = {
            "name": order.company.name,
            "cnpj": order.company.cnpj,
            "address": order.company.address,
            "phone": order.company.phone
        }
        
        client_data = {
            "name": order.client.name if order.client else "Cliente",
            "contact": order.client.email if order.client else ""
        }
        
        # Gerar PDF
        pdf_buffer = generate_quote_pdf(order_data, company_data, client_data)
        
        # Retornar como StreamingResponse
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=orcamento_{order_id}.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar PDF: {str(e)}"
        )