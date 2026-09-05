import asyncio
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.models.user import User
from app.models.company import Company
from app.core.security import hash_password
from app.core.config import settings

async def reset_seed():
    async with AsyncSessionLocal() as db:
        # 1. Ensure Super Admin company exists
        res_comp = await db.execute(select(Company).where(Company.name == "Super Admin Platform"))
        comp = res_comp.scalars().first()
        if not comp:
            comp = Company(name="Super Admin Platform", website="https://platform.internal", description="System Platform Administration")
            db.add(comp)
            await db.commit()
            await db.refresh(comp)

        # 2. Ensure Super Admin user exists
        res_user = await db.execute(select(User).where(User.email == settings.SUPERADMIN_EMAIL))
        user = res_user.scalars().first()

        hashed = hash_password(settings.SUPERADMIN_PASSWORD)
        if user:
            user.hashed_password = hashed
            user.company_id = comp.id
            print(f"Super Admin user reset: {settings.SUPERADMIN_EMAIL}")
        else:
            user = User(company_id=comp.id, email=settings.SUPERADMIN_EMAIL, hashed_password=hashed)
            db.add(user)
            print(f"Super Admin user created: {settings.SUPERADMIN_EMAIL}")

        await db.commit()

if __name__ == "__main__":
    asyncio.run(reset_seed())
