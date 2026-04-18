import chromadb
from chromadb.config import Settings
from .embeddings import embed_text

# ─────────────────────────────────────────────
# 🔧 INIT CHROMA
# ─────────────────────────────────────────────
client = chromadb.Client(Settings())
collection = client.get_or_create_collection(name="medical_knowledge")


# ─────────────────────────────────────────────
# 📥 ADD DOCUMENTS
# ─────────────────────────────────────────────
def add_documents(docs, ids):
    embeddings = []
    valid_docs = []
    valid_ids  = []

    print(f"[vectorstore] Starting embedding for {len(docs)} documents...")

    for idx, (doc, doc_id) in enumerate(zip(docs, ids)):

        try:
            emb = embed_text(doc)

            # 🔍 VALIDATION
            if not emb:
                print(f"[vectorstore] Skipping empty embedding (doc {idx})")
                continue

            if not isinstance(emb, list):
                print(f"[vectorstore] Invalid embedding type: {type(emb)}")
                continue

            if not isinstance(emb[0], float):
                print(f"[vectorstore] Invalid embedding values (doc {idx})")
                continue

            # ✅ ADD VALID
            embeddings.append(emb)
            valid_docs.append(doc)
            valid_ids.append(doc_id)

        except Exception as e:
            print(f"[vectorstore] Failed doc {idx}: {e}")
            continue

    # ─────────────────────────
    # 🚀 INSERT INTO CHROMA
    # ─────────────────────────
    if embeddings:
        try:
            collection.add(
                documents=valid_docs,
                embeddings=embeddings,
                ids=valid_ids
            )
            print(f"[vectorstore] ✅ Added {len(embeddings)} documents successfully.")

        except Exception as e:
            print(f"[vectorstore] ❌ Failed to add documents to Chroma: {e}")

    else:
        print("[vectorstore] ⚠️ No valid embeddings to insert.")


# ─────────────────────────────────────────────
# 🔍 QUERY DOCUMENTS
# ─────────────────────────────────────────────
def query_documents(query, n_results=3):

    try:
        print(f"[vectorstore] Querying for: {query[:50]}...")

        query_embedding = embed_text(query)

        # 🔍 VALIDATION
        if not query_embedding or not isinstance(query_embedding, list):
            print("[vectorstore] Invalid query embedding")
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

        docs = results.get("documents", [])

        if docs and len(docs) > 0:
            return docs[0]

        return []

    except Exception as e:
        print(f"[vectorstore] ❌ Query failed: {e}")
        return []