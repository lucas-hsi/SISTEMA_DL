import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import crud_product
from app.api.v1 import deps
from app.schemas.product_image import ProductImage, ProductImageUpdate
from app.models.user import User as UserModel

router = APIRouter()

# Diretório onde as imagens estão salvas
UPLOAD_DIR = "backend/static/product_images"


@router.put("/product_images/{image_id}", response_model=ProductImage)
def update_product_image(
    *,
    db: Session = Depends(deps.get_db),
    image_id: int,
    image_in: ProductImageUpdate,
    current_catalog_manager: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Update product image data (e.g., order).
    Only accessible by catalog managers (anuncios).
    """
    # Buscar a imagem
    image = crud_product.get_product_image_by_id(db=db, image_id=image_id)
    if not image:
        raise HTTPException(
            status_code=404,
            detail="Product image not found."
        )
    
    # Verificar se o produto da imagem pertence à empresa do catalog manager
    product = crud_product.get_product_by_id(db=db, product_id=image.product_id)
    if not product or product.company_id != current_catalog_manager.company_id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage images from products of your own company."
        )
    
    # Atualizar a imagem
    image = crud_product.update_product_image(db=db, db_obj=image, obj_in=image_in)
    return image


@router.delete("/product_images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_image(
    *,
    db: Session = Depends(deps.get_db),
    image_id: int,
    current_catalog_manager: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Delete a product image from database and optionally from filesystem.
    Only accessible by catalog managers (anuncios).
    """
    # Buscar a imagem
    image = crud_product.get_product_image_by_id(db=db, image_id=image_id)
    if not image:
        raise HTTPException(
            status_code=404,
            detail="Product image not found."
        )
    
    # Verificar se o produto da imagem pertence à empresa do catalog manager
    product = crud_product.get_product_by_id(db=db, product_id=image.product_id)
    if not product or product.company_id != current_catalog_manager.company_id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage images from products of your own company."
        )
    
    # Extrair o nome do arquivo da URL
    image_url = image.url
    if image_url.startswith("/static/product_images/"):
        filename = image_url.replace("/static/product_images/", "")
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Tentar deletar o arquivo do sistema de arquivos
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log do erro, mas não falha a operação
            print(f"Warning: Failed to delete file {file_path}: {str(e)}")
    
    # Deletar o registro do banco de dados
    success = crud_product.delete_product_image(db=db, image_id=image_id)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete product image."
        )