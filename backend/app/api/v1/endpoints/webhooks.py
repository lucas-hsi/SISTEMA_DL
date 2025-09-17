from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.v1 import deps
from app.crud import crud_product
from app.models.user import User

router = APIRouter()


class WebhookItem(BaseModel):
    """Item sold in the webhook notification"""
    sku: str
    quantity_sold: int


class OrderProcessedWebhook(BaseModel):
    """Webhook payload for order processed notification"""
    order_id: str
    marketplace: str
    items: List[WebhookItem]
    timestamp: str


@router.post("/order_processed")
def process_order_webhook(
    webhook_data: OrderProcessedWebhook,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    """
    Webhook endpoint to process order notifications from marketplaces.
    Updates stock quantities based on sold items.
    """
    # TODO: Implementar verificação de assinatura (HMAC) para validar a origem do webhook
    
    processed_items = []
    errors = []
    
    for item in webhook_data.items:
        try:
            # Find product by SKU in the user's company
            product = crud_product.get_product_by_sku(
                db=db, 
                sku=item.sku, 
                company_id=current_user.company_id
            )
            
            if not product:
                errors.append({
                    "sku": item.sku,
                    "error": "Product not found"
                })
                continue
            
            # Check if there's enough stock
            if product.stock_quantity < item.quantity_sold:
                errors.append({
                    "sku": item.sku,
                    "error": f"Insufficient stock. Available: {product.stock_quantity}, Requested: {item.quantity_sold}"
                })
                continue
            
            # Update stock (subtract sold quantity)
            updated_product = crud_product.update_product_stock(
                db=db,
                product=product,
                quantity_change=-item.quantity_sold
            )
            
            processed_items.append({
                "sku": item.sku,
                "quantity_sold": item.quantity_sold,
                "new_stock": updated_product.stock_quantity,
                "product_name": updated_product.name
            })
            
        except Exception as e:
            errors.append({
                "sku": item.sku,
                "error": str(e)
            })
    
    return {
        "order_id": webhook_data.order_id,
        "marketplace": webhook_data.marketplace,
        "processed_items": processed_items,
        "errors": errors,
        "status": "completed" if not errors else "partial_success"
    }


@router.get("/health")
def webhook_health_check():
    """Health check endpoint for webhook service"""
    return {"status": "healthy", "service": "webhooks"}