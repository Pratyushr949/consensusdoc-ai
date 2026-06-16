from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database.models import User, UserRole
from backend.auth import get_db, get_current_user, RoleChecker
from backend.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/users", tags=["Users"])

# Pydantic schemas for request validation
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user (Employee or Admin) with secure hashed password.
    """
    # Check if username exists
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered."
        )

    # Hash the plain text password
    hashed_password = get_password_hash(user_in.password)

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        role=user_in.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login", response_model=Token)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Standard OAuth2 compatible token login. Checks credentials and returns JWT.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token incorporating user ID and role
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value
    }

@router.get("/me", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user profile details.
    """
    return current_user
