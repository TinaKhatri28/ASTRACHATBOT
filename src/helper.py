from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
import os

def load_pdf_file(Data):
    loader = DirectoryLoader(Data, glob="*.pdf",loader_cls = PyPDFLoader)
    documents = loader.load()
    return documents

def text_split(extracted_data):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size = 500 , chunk_overlap = 20 )
    text_chunks = text_splitter.split_documents(extracted_data)
    return text_chunks

def download_hugging_face_embeddings():
    embeddings = HuggingFaceInferenceAPIEmbeddings(
        api_key=os.environ.get("HUGGINGFACE_API"),
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    return embeddings