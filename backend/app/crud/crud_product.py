from sqlalchemy.orm import Session
from typing import List, Optional
import time
import random
from app.models.product import Product
from app.models.product_image import ProductImage
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.product_image import ProductImageCreate, ProductImageUpdate


def generate_unique_sku(db: Session, company_id: int) -> str:
    """Generate a unique SKU for a product"""
    while True:
        # Generate SKU with format: DL-{timestamp}-{random_number}
        timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        random_num = str(random.randint(1000, 9999))
        sku = f"DL-{timestamp}-{random_num}"
        
        # Check if SKU already exists in the company
        existing = db.query(Product).filter(
            Product.sku == sku,
            Product.company_id == company_id
        ).first()
        
        if not existing:
            return sku


def get_product_by_id(db: Session, *, product_id: int) -> Optional[Product]:
    """Get product by ID with images"""
    return db.query(Product).filter(Product.id == product_id).first()


def get_product_by_sku(db: Session, *, sku: str, company_id: int) -> Optional[Product]:
    """Get product by SKU within a company"""
    return db.query(Product).filter(
        Product.sku == sku,
        Product.company_id == company_id
    ).first()


def update_product_stock(db: Session, *, product: Product, quantity_change: int) -> Product:
    """Update product stock quantity (can be positive or negative)"""
    new_stock = product.stock_quantity + quantity_change
    if new_stock < 0:
        new_stock = 0  # Prevent negative stock
    
    product.stock_quantity = new_stock
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_products_by_company(db: Session, *, company_id: int, skip: int = 0, limit: int = 100) -> List[Product]:
    """Get all products from a specific company with pagination"""
    return (
        db.query(Product)
        .filter(Product.company_id == company_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_product(db: Session, *, obj_in: ProductCreate, company_id: int) -> Product:
    """Create a new product"""
    # Generate SKU if not provided
    sku = obj_in.sku
    if not sku or sku.strip() == "":
        sku = generate_unique_sku(db, company_id)
    
    db_obj = Product(
        name=obj_in.name,
        description=obj_in.description,
        sku=sku,
        part_number=obj_in.part_number,
        brand=obj_in.brand,
        cost_price=obj_in.cost_price,
        sale_price=obj_in.sale_price,
        stock_quantity=obj_in.stock_quantity,
        company_id=company_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_product(db: Session, *, db_obj: Product, obj_in: ProductUpdate) -> Product:
    """Update product information"""
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_product(db: Session, *, product_id: int) -> bool:
    """Delete a product and its associated images"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        db.delete(product)
        db.commit()
        return True
    return False


# Product Images CRUD operations
def create_product_image(db: Session, *, obj_in: ProductImageCreate) -> ProductImage:
    """Create a new product image"""
    db_obj = ProductImage(
        url=obj_in.url,
        order=obj_in.order,
        product_id=obj_in.product_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_product_image_by_id(db: Session, *, image_id: int) -> Optional[ProductImage]:
    """Get product image by ID"""
    return db.query(ProductImage).filter(ProductImage.id == image_id).first()


def update_product_image(db: Session, *, db_obj: ProductImage, obj_in: ProductImageUpdate) -> ProductImage:
    """Update product image information"""
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_product_image(db: Session, *, image_id: int) -> bool:
    """Delete a product image"""
    image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if image:
        db.delete(image)
        db.commit()
        return True
    return False


def get_next_image_order(db: Session, *, product_id: int) -> int:
    """Get the next order number for a product image"""
    max_order = (
        db.query(ProductImage.order)
        .filter(ProductImage.product_id == product_id)
        .order_by(ProductImage.order.desc())
        .first()
    )
    return (max_order[0] + 1) if max_order and max_order[0] is not None else 1