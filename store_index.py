from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from src.helper import load_pdf_file, text_split, download_hugging_face_embeddings

extracted_data = load_pdf_file(r"C:/Users/Tina Khatri/ASTRABOT/Data")

text_chunks = text_split(extracted_data)

embeddings = download_hugging_face_embeddings()

vectorstore = Chroma.from_documents(
    documents = text_chunks,
    embedding = embeddings,
    persist_directory= "./chroma_db"
)
vectorstore.persist()
docstore = Chroma(
    persist_directory = "./chroma_db",
    embedding_function = embeddings
)
