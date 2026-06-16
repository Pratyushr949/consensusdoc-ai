import os
import yaml
from pathlib import Path
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from database.models import User, UserRole
from backend.security import decode_access_token

# Load Database URL from environment or configuration file
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    possible_paths = [
        Path("config/config.yaml"),
        Path("project2/config/config.yaml"),
        Path("../config/config.yaml")
    ]
    for p in possible_paths:
        if p.exists():
            try:
                with open(p, "r") as f:
                    config = yaml.safe_load(f)
                    if config and "database" in config and "url" in config["database"]:
                        DATABASE_URL = config["database"]["url"]
                        break
            except Exception:
                pass
                
# Safe default PostgreSQL connection URL if none is configured
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/consensusdoc"

# Set up SQLAlchemy Engine and SessionLocal
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Database session generator dependency.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# OAuth2 bearer token extractor
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to fetch and validate the currently authenticated user from the JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

class RoleChecker:
    """
    Role check dependency validator. Checks if current user possesses allowed privileges.
    """
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Insufficient role permissions."
            )
        return user
