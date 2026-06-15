from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
from src.helper import download_hugging_face_embeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langdetect import detect
from gtts import gTTS
import io
import base64

print("RUNNING FROM:", os.getcwd())
# -------------------- LOAD ENV --------------------
load_dotenv()

# -------------------- FLASK INIT --------------------
app = Flask(__name__)

# -------------------- EMBEDDINGS + DB --------------------
embeddings = download_hugging_face_embeddings()

docstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HUGGINGFACE_API")

# -------------------- LLM SETUP --------------------
llm_endpoint = HuggingFaceEndpoint(
    repo_id="mistralai/Mistral-7B-Instruct-v0.2",
    temperature=0.1,
    max_new_tokens=512
)

llm = ChatHuggingFace(llm=llm_endpoint)

# -------------------- PROMPT --------------------
prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a helpful AI assistant.
Rules:
- Answer directly
- Do not mention context or source
- If unknown say "I don't know"

Context:
{context}

Question:
{question}

Answer:
"""
)

# -------------------- RAG CHAIN --------------------
retriever = docstore.as_retriever(search_kwargs={"k": 3})

rag_chain = (
    {
        "context": retriever,
        "question": RunnablePassthrough()
    }
    | prompt
    | llm
)

# -------------------- ROUTES --------------------

@app.route("/")
def index():
    print("TEMPLATE FOLDER:", app.template_folder)
    print("FILES INSIDE TEMPLATE FOLDER:", os.listdir(app.template_folder))
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"response": "Please enter a message"}), 400

        # Get response normally (no forced language)
        response = rag_chain.invoke(user_message)
        final_answer = response.content if hasattr(response, "content") else str(response)

        # Detect language of FINAL ANSWER (not user input)
        try:
            detected_lang = detect(final_answer)
        except:
            detected_lang = "en"

        # Generate TTS using detected answer language
        try:
            tts = gTTS(text=final_answer, lang=detected_lang)
        except:
            tts = gTTS(text=final_answer, lang="en")

        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        audio_b64 = base64.b64encode(audio_buffer.read()).decode()

        return jsonify({
            "response": final_answer,
            "audio": audio_b64
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"response": f"Backend error occurred: {str(e)}"}), 500


# -------------------- RUN --------------------
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
