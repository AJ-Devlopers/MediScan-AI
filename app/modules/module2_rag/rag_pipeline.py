from groq import Groq
import os
from dotenv import load_dotenv
from .retriever import retrieve_context

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_answer(
    question: str,
    chat_history: list = [],
    system_prefix: str = ""
):
    # 🔍 Retrieve context
    context = retrieve_context(question)

    # 🧠 YOUR ORIGINAL PROMPT (CLEANED + FORMATTED)
    base_prompt = """
You are MediScan AI — an intelligent, friendly, and versatile AI assistant (like ChatGPT),
with deep expertise in medicine and healthcare, but capable of helping with anything.

## Your Personality
- Warm, conversational, and approachable
- Confident but never arrogant
- Concise yet thorough — never pad responses unnecessarily
- Adapt tone based on context

## Your Capabilities
- 🏥 Medicine & Health (primary)
- 💻 Tech & Programming
- 📚 Science, Math, History
- 🎨 Culture & General knowledge
- 💬 Conversation & support

## Response Formatting Rules

### Casual messages:
- Natural tone
- No bullets
- Short (1–3 sentences)

### Informational answers:
- Use **bold** for key terms
- Use bullet points for lists
- Use headings only if needed
- Keep structured and readable

### Medical questions:
- Not a diagnosis
- Highlight **critical values**
- Suggest doctor if needed
- Structure: Answer → Details → When to act

### Technical/code:
- Use code blocks
- Explain briefly

## Boundaries
- No hallucination
- Say "I'm not certain" if unsure
- Emergency → **Call emergency services**
- Keep medical advice general
"""

    # 🔥 MERGE EVERYTHING (THIS IS KEY)
    system_prompt = f"""
{base_prompt}

--------------------------------------------------

📄 Patient Report Context:
{system_prefix if system_prefix else "No uploaded report available."}

--------------------------------------------------

🔍 Retrieved Knowledge Base Context:
{context if context else "No relevant documents found. Use general knowledge."}
"""

    # 💬 Build messages
    messages = [{"role": "system", "content": system_prompt}]

    # 🧠 Chat memory (last 10)
    for turn in chat_history[-10:]:
        messages.append({
            "role": turn["role"],
            "content": turn["content"]
        })

    # ❓ User question
    messages.append({
        "role": "user",
        "content": question
    })

    # 🤖 LLM call
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.6,
        max_tokens=1024,
        top_p=0.9,
    )

    return response.choices[0].message.content.strip()