# Importa todos os modelos aqui para que o Alembic possa encontrá-los
from app.db.base_class import Base
from app.models.company import Company
from app.models.user import User
from app.models.client import Client
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.integration import Integration
from app.models.compatibility import Compatibility
from app.models.competitor_price import CompetitorPrice
