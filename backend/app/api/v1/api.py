from fastapi import APIRouter

from app.api.v1.endpoints import login, users, products, product_images, webhooks, clients, orders, shipping, integrations, part_number

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(products.router, tags=["products"])
api_router.include_router(product_images.router, tags=["product-images"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(shipping.router, prefix="/shipping", tags=["shipping"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(part_number.router, prefix="/part-number", tags=["part-number"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
