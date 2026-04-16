import json
import uuid
from .vectorstore import add_documents


def load_knowledge_base(file_path="app/data/medical_knowledge.json"):
    with open(file_path, "r") as f:
        data = json.load(f)

    docs = []
    ids = []

    for item in data:
        text = item.get("text")
        if text:
            docs.append(text)
            ids.append(str(uuid.uuid4()))

    if docs:
        add_documents(docs, ids)
        print("✅ Knowledge base loaded into ChromaDB")
    else:
        print("⚠️ No data found in knowledge file")