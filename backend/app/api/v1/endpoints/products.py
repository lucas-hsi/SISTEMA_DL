import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.crud import crud_product
from app.api.v1 import deps
from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.schemas.product_image import ProductImage, ProductImageCreate
from app.models.user import User as UserModel

router = APIRouter()

# Diretório para salvar imagens
UPLOAD_DIR = "backend/static/product_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/products/", response_model=Product, status_code=status.HTTP_201_CREATED)
def create_product(
    *,
    db: Session = Depends(deps.get_db),
    product_in: ProductCreate,
    current_catalog_manager: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Create a new product.
    Only accessible by catalog managers (anuncios).
    """
    product = crud_product.create_product(
        db=db, obj_in=product_in, company_id=current_catalog_manager.company_id
    )
    return product


@router.get("/products/", response_model=List[Product])
def get_products(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(deps.get_current_user_any_role)
):
    """
    Get all products from the same company as the current user.
    Accessible by all roles (gestor, vendedor, anuncios).
    """
    products = crud_product.get_products_by_company(
        db=db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return products


@router.get("/products/{product_id}", response_model=Product)
def get_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    current_user: UserModel = Depends(deps.get_current_user_any_role)
):
    """
    Get a specific product by ID, including its images.
    Accessible by all roles (gestor, vendedor, anuncios).
    """
    product = crud_product.get_product_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )
    
    # Verificar se o produto pertence à mesma empresa do usuário
    if product.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You can only access products from your own company."
        )
    
    return product


@router.put("/products/{product_id}", response_model=Product)
def update_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    product_in: ProductUpdate,
    current_catalog_manager: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Update product details.
    Only accessible by catalog managers (anuncios).
    """
    product = crud_product.get_product_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )
    
    # Verificar se o produto pertence à mesma empresa do catalog manager
    if product.company_id != current_catalog_manager.company_id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage products from your own company."
        )
    
    product = crud_product.update_product(db=db, db_obj=product, obj_in=product_in)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    current_catalog_manager: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Delete a product.
    Only accessible by catalog managers (anuncios).
    """
    product = crud_product.get_product_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )
    
    # Verificar se o produto pertence à mesma empresa do catalog manager
    if product.company_id != current_catalog_manager.company_id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage products from your own company."
        )
    
    success = crud_product.delete_product(db=db, product_id=product_id)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete product."
        )


@router.post("/products/{product_id}/images/", response_model=ProductImage, status_code=status.HTTP_201_CREATED)
def upload_product_image(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    file: UploadFile = File(...),
    current_catalog_manager: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Upload an image for a specific product.
    Only accessible by catalog managers (anuncios).
    """
    # Verificar se o produto existe e pertence à empresa do catalog manager
    product = crud_product.get_product_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )
    
    if product.company_id != current_catalog_manager.company_id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage products from your own company."
        )
    
    # Verificar se o arquivo é uma imagem
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image."
        )
    
    # Gerar nome único para o arquivo
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Salvar o arquivo
    try:
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Criar registro no banco de dados
    next_order = crud_product.get_next_image_order(db=db, product_id=product_id)
    image_url = f"/static/product_images/{unique_filename}"
    
    image_in = ProductImageCreate(
        url=image_url,
        order=next_order,
        product_id=product_id
    )
    
    image = crud_product.create_product_image(db=db, obj_in=image_in)
    return image