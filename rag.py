from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

def build_vectorstore():
    with open("data/policies.txt", "r") as f:
        text = f.read()

    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
    docs = splitter.create_documents([text])

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    vectorstore = FAISS.from_documents(docs, embeddings)
    return vectorstore


def get_retriever():
    vs = build_vectorstore()
    return vs.as_retriever(search_kwargs={"k": 3})