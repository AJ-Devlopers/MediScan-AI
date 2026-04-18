from .vectorstore import query_documents

def retrieve_context(question: str, k: int = 3):
    docs = query_documents(question, n_results=k)

    # Remove empty results
    docs = [doc for doc in docs if doc and doc.strip()]

    return "\n".join(docs)