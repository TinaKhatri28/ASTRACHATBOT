from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
from src.helper import download_hugging_face_embeddings
from src.prompt import prompt
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

load_dotenv()
app = Flask(__name__)
embeddings = download_hugging_face_embeddings()
docstore = Chroma(
    persist_directory = "./chroma_db",
    embedding_function = embeddings
)
os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HUGGINGFACE_API")

llm_endpoint = HuggingFaceEndpoint(
    repo_id="mistralai/Mistral-7B-Instruct-v0.2",
    temperature=0.1,
    max_new_tokens=512
)

llm = ChatHuggingFace(llm=llm_endpoint)

from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a helpful AI assistant.
Rules:
- Never say "based on the context"
- Never explain the source
- Answer directly
-Donot tell the source of the information at any point in the answer.
If the answer is not in the context, say "I don't know".
If the client  greets you , greet them back politely.

Context:
{context}

Question:
{question}

Answer:
"""
)
retriever = docstore.as_retriever(search_kwargs={"k": 3})

rag_chain = (
    {
        "context": retriever,
        "question": RunnablePassthrough()
    }
    | prompt
    | llm
)

from flask import Flask, request, jsonify, render_template



# HOME PAGE 
@app.route("/")
def index():
    return render_template("index.html")

# CHAT API 
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"response": "Please enter a message"}), 400

        response = rag_chain.invoke(user_message)

        if hasattr(response, "content"):
            final_answer = response.content
        elif isinstance(response, dict) and "answer" in response:
            final_answer = response["answer"]
        else:
            final_answer = str(response)

        return jsonify({"response": final_answer})

    except Exception as e:
        print("CHAT ERROR:", e)
        return jsonify({"response": "Backend error occurred"}), 500


# RUN SERVER
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8080)),
        use_reloader=False
    )
