import asyncio
from app.database.connection import engine, AsyncSessionLocal
from app.database.base import Base

# Import all models to register with Base.metadata
from app.models.company import Company
from app.models.user import User
from app.models.widget_config import WidgetConfig
from app.models.product import Product
from app.models.product_knowledge import ProductKnowledge
from app.models.lead import Lead
from app.models.token_usage import TokenUsage
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage

from app.core.security import hash_password
from app.core.config import settings


async def reset_and_seed_db():
    print("[RESET DB] Recreating all database tables from metadata...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[RESET DB] Database tables recreated successfully.")

    async with AsyncSessionLocal() as db:
        # 1. Seed Verified Demo Company
        print("[RESET DB] Seeding Demo Verified Company...")
        demo_company = Company(
            name="Acme AI Technologies",
            website="https://acmeai.com",
            description="Enterprise AI Sales & Automation Platform",
            is_active=True,
            is_verified=True,
        )
        db.add(demo_company)
        await db.commit()
        await db.refresh(demo_company)

        # 2. Seed Demo Company Admin User (admin@test.com / password123)
        demo_user = User(
            company_id=demo_company.id,
            email="admin@test.com",
            hashed_password=hash_password("password123"),
            is_active=True,
            email_verified=True,
        )
        db.add(demo_user)

        # 3. Seed Demo Widget Config
        demo_widget = WidgetConfig(
            company_id=demo_company.id,
            site_key="sk_live_demo1234567890abcdef",
            bot_title="Sales Assistant",
            greeting_message="Hello! Welcome to Acme AI. How can I help you learn about our products today?",
            primary_color="#6366f1",
            widget_icon="Bot",
            allowed_domains="*",
            is_enabled=True,
        )
        db.add(demo_widget)

        # 4. Seed Demo Products
        p1 = Product(
            company_id=demo_company.id,
            name="Acme AI Sales Assistant Pro",
            description="Automated 24/7 lead qualification & chat bot for web platforms.",
            price=49.00,
            features="RAG Knowledge Vector Search, Custom Branding, Multi-tenant Isolation",
            target_customer="B2B SaaS & E-commerce",
        )
        p2 = Product(
            company_id=demo_company.id,
            name="Acme Enterprise Custom Bot",
            description="Dedicated LLM fine-tuning & CRM integration.",
            price=199.00,
            features="Dedicated PostgreSQL, Unlimited Messages, Dedicated Manager",
            target_customer="Enterprise Companies",
        )
        db.add_all([p1, p2])

        # 5. Seed Platform Super Admin (superadmin@platform.com / adminpass123)
        super_admin_user = User(
            company_id=demo_company.id,
            email=settings.SUPERADMIN_EMAIL,
            hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
            is_active=True,
            email_verified=True,
        )
        db.add(super_admin_user)

        await db.commit()
        print("[RESET DB] Database successfully reset and seeded with clean accounts!")
        print(f"   - Demo Company Admin: admin@test.com / password123")
        print(f"   - Super Admin: {settings.SUPERADMIN_EMAIL} / {settings.SUPERADMIN_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(reset_and_seed_db())
