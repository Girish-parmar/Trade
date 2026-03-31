"""
Database Configuration and Session Management

PostgreSQL Connection:
- Async SQLAlchemy with asyncpg driver
- Connection pooling for performance
- Automatic reconnection handling
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os
from typing import AsyncGenerator

# Database URL from environment
# Format: postgresql+asyncpg://user:password@host:port/database
DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql+asyncpg://tradepro:tradepro123@localhost:5432/tradepro_db'
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_size=20,  # Connection pool size
    max_overflow=40,  # Max overflow connections
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create async session factory
SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database session
    
    Usage:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    """
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_database():
    """
    Initialize database (create all tables)
    
    Call this on application startup.
    
    Note: In production, use Alembic migrations instead.
    """
    from models import Base
    
    async with engine.begin() as conn:
        # Drop all tables (WARNING: destructive - only for development)
        # await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
