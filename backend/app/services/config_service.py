"""Configuration service - business logic for configs."""

from sqlalchemy.orm import Session
from app.models.config import Config
from app.schemas.config import ConfigCreate, ConfigUpdate
import uuid
from datetime import datetime


def get_configs(db: Session, org_id: str = "demo_org") -> list[Config]:
    return db.query(Config).filter(Config.org_id == org_id).order_by(Config.created_at.desc()).all()


def get_config(db: Session, config_id: str) -> Config | None:
    return db.query(Config).filter(Config.config_id == config_id).first()


def create_config(db: Session, data: ConfigCreate) -> Config:
    config = Config(
        config_id=str(uuid.uuid4()),
        org_id=data.org_id,
        name=data.name,
        source_type=data.source_type,
        source_table=data.source_table,
        column_mapping=data.column_mapping,
    )
    db.add(config)
    db.flush()
    return config


def update_config(db: Session, config_id: str, data: ConfigUpdate) -> Config | None:
    config = db.query(Config).filter(Config.config_id == config_id).first()
    if not config:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)
    config.updated_at = datetime.utcnow()
    db.flush()
    return config


def delete_config(db: Session, config_id: str) -> bool:
    config = db.query(Config).filter(Config.config_id == config_id).first()
    if not config:
        return False
    db.delete(config)
    db.flush()
    return True


def duplicate_config(db: Session, config_id: str) -> Config | None:
    original = db.query(Config).filter(Config.config_id == config_id).first()
    if not original:
        return None
    new_config = Config(
        config_id=str(uuid.uuid4()),
        org_id=original.org_id,
        name=f"{original.name} (Copy)",
        source_type=original.source_type,
        source_table=original.source_table,
        column_mapping=original.column_mapping,
    )
    db.add(new_config)
    db.flush()
    return new_config
