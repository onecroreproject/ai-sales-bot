from app.ai.embeddings import create_embedding
from app.database.connection import SessionLocal
from app.services.vector_search import search_knowledge


def main():
    db = SessionLocal()

    try:
        question = "What does your AI Sales Assistant do?"

        embedding = create_embedding(question)

        results = search_knowledge(
            db=db,
            company_id=2,
            query_embedding=embedding,
            limit=5,
        )

        print(f"\nFound {len(results)} results:\n")

        for result in results:
            print("ID:", result.id)
            print("Product ID:", result.product_id)
            print("Content:", result.content)
            print("-" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    main()