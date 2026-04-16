import chromadb
from chromadb.config import Settings
from .embeddings import embed_text

# Create client
client = chromadb.Client(Settings())

# Create / get collection
collection = client.get_or_create_collection(name="medical_knowledge")


# ✅ Add documents
def add_documents(docs, ids):
    embeddings = [embed_text(doc) for doc in docs]

    collection.add(
        documents=docs,
        embeddings=embeddings,
        ids=ids
    )


# ✅ Query documents
def query_documents(query, n_results=3):
    query_embedding = embed_text(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    return results["documents"][0] if results["documents"] else []