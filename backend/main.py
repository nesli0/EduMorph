import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from models import User, Base, TestResult
from database import engine, get_db
from schemas import UserCreate, User as UserSchema, Token, TokenData, ContentRequest, TestResult as TestResultSchema
from passlib.context import CryptContext
from jose import JWTError, jwt
import google.generativeai as genai

# Environment variables yükle
load_dotenv()

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS ayarları - frontend ile iletişim için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT ve güvenlik ayarları
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    import secrets
    SECRET_KEY = secrets.token_urlsafe(32)
    print("Uyarı: SECRET_KEY bulunamadı, otomatik oluşturuldu. Production için .env dosyasında ayarlayın")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Gemini AI ayarları
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
else:
    print("Uyarı: GEMINI_API_KEY bulunamadı")
    model = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", response_model=Token)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Email zaten kullanımda mı kontrol et
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Bu email adresi zaten kullanımda"
            )

        # Kullanıcı adı zaten kullanımda mı kontrol et
        existing_username = db.query(User).filter(User.username == user.username).first()
        if existing_username:
            raise HTTPException(
                status_code=400,
                detail="Bu kullanıcı adı zaten kullanımda"
            )

        # Şifreyi hashle ve yeni kullanıcı oluştur
        hashed_password = get_password_hash(user.password)
        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
            role="user",
            is_active=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Giriş tokeni oluştur
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.username}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Kayıt işlemi sırasında bir hata oluştu: {str(e)}"
        )

@app.post("/token", response_model=Token)
async def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"Giriş denemesi: {username}")
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print("Kullanıcı bulunamadı")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı adı veya şifre hatalı",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(password, user.hashed_password):
            print("Şifre doğrulaması başarısız")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı adı veya şifre hatalı",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        print(f"Token oluşturuldu: {user.username}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Giriş hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Giriş işlemi sırasında bir hata oluştu: {str(e)}"
        )

@app.post("/create-sample-user")
async def create_sample_user(db: Session = Depends(get_db)):
    try:
        # Test kullanıcısı oluştur
        sample_user = User(
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User",
            hashed_password=get_password_hash("test123"),
            role="student",
            is_active=True
        )
        
        db.add(sample_user)
        db.commit()
        db.refresh(sample_user)
        
        print(f"Test kullanıcısı oluşturuldu: {sample_user.username}")
        
        return {
            "message": "Test kullanıcısı başarıyla oluşturuldu",
            "user": {
                "username": sample_user.username,
                "email": sample_user.email
            }
        }
    except Exception as e:
        db.rollback()
        print(f"Test kullanıcısı oluşturma hatası: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Test kullanıcısı oluşturulurken hata oluştu: {str(e)}"
        )

@app.post("/api/generate-content")
async def generate_content(request: ContentRequest, current_user: User = Depends(get_current_user)):
    try:
        # Gemini AI'ya bağlan
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        # Konu hakkında detaylı analiz iste
        prompt = f"""
        Bu konu hakkında detaylı bir analiz yap:
        
        {request.prompt}
        
        Analiz şunları içersin:
        - Genel bakış
        - Detaylı açıklama  
        - Öneriler
        - Pratik uygulamalar
        
        En az 500 kelime olsun ve Türkçe yaz.
        """
        
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="AI'dan yanıt alınamadı")
            
        return {"content": response.text}
        
    except Exception as e:
        print(f"İçerik üretme hatası: {str(e)}")
        
        # API kotası kontrolü
        if "quota" in str(e).lower() or "429" in str(e):
            raise HTTPException(
                status_code=429, 
                detail="API kotası doldu. Lütfen daha sonra tekrar deneyin veya yeni bir API anahtarı kullanın."
            )
        
        raise HTTPException(status_code=500, detail=f"İçerik üretilirken hata: {str(e)}")

@app.post("/api/save-test-results")
async def save_test_results(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        test_type = request.get('testType')
        results = request.get('results')
        
        if not test_type or not results:
            raise HTTPException(
                status_code=400,
                detail="Test tipi ve sonuçları gerekli"
            )
            
        # Sonuçları kaydet
        test_result = TestResult(
            user_id=current_user.id,
            test_type=test_type,
            results=results,
            created_at=datetime.utcnow()
        )
        
        db.add(test_result)
        db.commit()
        db.refresh(test_result)
        
        return {
            "message": "Test sonuçları kaydedildi",
            "test_id": test_result.id
        }
        
    except Exception as e:
        db.rollback()
        print(f"Test sonuçları kaydetme hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Test sonuçları kaydedilirken hata: {str(e)}"
        )

@app.get("/api/test-results", response_model=List[TestResultSchema])
async def get_test_results(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Kullanıcının test sonuçlarını getir
        test_results = db.query(TestResult).filter(
            TestResult.user_id == current_user.id
        ).order_by(TestResult.created_at.desc()).all()
        
        return test_results
        
    except Exception as e:
        print(f"Test sonuçları getirme hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Test sonuçları alınırken hata: {str(e)}"
        )

@app.get("/api/test-results/{test_id}")
async def get_test_result(
    test_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Test sonucunu bul
        test_result = db.query(TestResult).filter(
            TestResult.id == test_id,
            TestResult.user_id == current_user.id
        ).first()
        
        if not test_result:
            raise HTTPException(
                status_code=404,
                detail="Test sonucu bulunamadı"
            )
        
        return test_result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Test sonucu getirme hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Test sonucu alınırken hata: {str(e)}"
        )

@app.delete("/api/test-results/{test_id}")
async def delete_test_result(
    test_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Test sonucunu bul
        test_result = db.query(TestResult).filter(
            TestResult.id == test_id,
            TestResult.user_id == current_user.id
        ).first()
        
        if not test_result:
            raise HTTPException(
                status_code=404,
                detail="Test sonucu bulunamadı"
            )
        
        # Test sonucunu sil
        db.delete(test_result)
        db.commit()
        
        return {"message": "Test sonucu başarıyla silindi"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Test sonucu silme hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Test sonucu silinirken hata: {str(e)}"
        )