import os

from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI

from rag import get_retriever


load_dotenv()


def get_client():
    return ChatMistralAI(
        model="mistral-large-latest",
        mistral_api_key=os.getenv("MISTRAL_API_KEY")
    )


def get_policy_retriever():
    return get_retriever()