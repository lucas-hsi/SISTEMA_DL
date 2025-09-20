from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.ad import Ad
from app.schemas.ad import AdCreate, AdUpdate, AdStatus, MarketplaceType


def get_ad_by_id(db: Session, *, ad_id: int) -> Optional[Ad]:
    """Get ad by ID"""
    return db.query(Ad).filter(Ad.id == ad_id).first()


def get_ad_by_external_id(db: Session, *, external_id: str, marketplace: MarketplaceType) -> Optional[Ad]:
    """Get ad by external ID and marketplace"""
    return db.query(Ad).filter(
        Ad.external_id == external_id,
        Ad.marketplace == marketplace
    ).first()


def get_ads_by_company(db: Session, *, company_id: int, skip: int = 0, limit: int = 100) -> List[Ad]:
    """Get ads by company with pagination"""
    return db.query(Ad).filter(
        Ad.company_id == company_id
    ).offset(skip).limit(limit).all()


def get_ads_by_user(db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Ad]:
    """Get ads by user with pagination"""
    return db.query(Ad).filter(
        Ad.user_id == user_id
    ).offset(skip).limit(limit).all()


def get_ads_by_product(db: Session, *, product_id: int) -> List[Ad]:
    """Get all ads for a specific product"""
    return db.query(Ad).filter(Ad.product_id == product_id).all()


def get_ads_by_status(db: Session, *, company_id: int, status: AdStatus, skip: int = 0, limit: int = 100) -> List[Ad]:
    """Get ads by status within a company"""
    return db.query(Ad).filter(
        Ad.company_id == company_id,
        Ad.status == status
    ).offset(skip).limit(limit).all()


def get_ads_by_marketplace(db: Session, *, company_id: int, marketplace: MarketplaceType, skip: int = 0, limit: int = 100) -> List[Ad]:
    """Get ads by marketplace within a company"""
    return db.query(Ad).filter(
        Ad.company_id == company_id,
        Ad.marketplace == marketplace
    ).offset(skip).limit(limit).all()


def count_ads_by_company(db: Session, *, company_id: int) -> int:
    """Count total ads for a company"""
    return db.query(Ad).filter(Ad.company_id == company_id).count()


def count_ads_by_user(db: Session, *, user_id: int) -> int:
    """Count total ads for a user"""
    return db.query(Ad).filter(Ad.user_id == user_id).count()


def count_ads_by_status(db: Session, *, company_id: int, status: AdStatus) -> int:
    """Count ads by status within a company"""
    return db.query(Ad).filter(
        Ad.company_id == company_id,
        Ad.status == status
    ).count()


def create_ad(db: Session, *, obj_in: AdCreate, user_id: int, company_id: int) -> Ad:
    """Create a new ad"""
    db_obj = Ad(
        title=obj_in.title,
        description=obj_in.description,
        price=obj_in.price,
        marketplace=obj_in.marketplace,
        product_id=obj_in.product_id,
        user_id=user_id,
        company_id=company_id,
        status=obj_in.status
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_ad(db: Session, *, db_obj: Ad, obj_in: AdUpdate) -> Ad:
    """Update an existing ad"""
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_ad_status(db: Session, *, ad_id: int, status: AdStatus) -> Optional[Ad]:
    """Update ad status"""
    db_obj = get_ad_by_id(db, ad_id=ad_id)
    if db_obj:
        db_obj.status = status
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def update_ad_external_info(db: Session, *, ad_id: int, external_id: str, external_url: str) -> Optional[Ad]:
    """Update ad external marketplace information"""
    db_obj = get_ad_by_id(db, ad_id=ad_id)
    if db_obj:
        db_obj.external_id = external_id
        db_obj.external_url = external_url
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete_ad(db: Session, *, ad_id: int) -> bool:
    """Delete an ad"""
    db_obj = get_ad_by_id(db, ad_id=ad_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False


def search_ads(db: Session, *, company_id: int, query: str, skip: int = 0, limit: int = 100) -> List[Ad]:
    """Search ads by title or description"""
    return db.query(Ad).filter(
        Ad.company_id == company_id,
        (Ad.title.ilike(f"%{query}%") | Ad.description.ilike(f"%{query}%"))
    ).offset(skip).limit(limit).all()


def get_active_ads_by_product(db: Session, *, product_id: int) -> List[Ad]:
    """Get all active ads for a specific product"""
    return db.query(Ad).filter(
        Ad.product_id == product_id,
        Ad.status == AdStatus.ACTIVE
    ).all()


def bulk_update_ads_status(db: Session, *, ad_ids: List[int], status: AdStatus) -> int:
    """Bulk update status for multiple ads"""
    updated_count = db.query(Ad).filter(
        Ad.id.in_(ad_ids)
    ).update({Ad.status: status}, synchronize_session=False)
    
    db.commit()
    return updated_count