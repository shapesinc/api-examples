import os
from typing import List, Dict, Any
import pinecone
from pinecone import ServerlessSpec
from pinecone.openapi_support.exceptions import PineconeApiException
from pinecone.exceptions import NotFoundException
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import time

load_dotenv()

class VectorStore:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, index_name: str = "shapes-context", namespace: str = "default"):
        if hasattr(self, 'initialized'):
            return
            
        self.pc = pinecone.Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index_name = index_name
        self.namespace = namespace
        # Initialize the sentence transformer model
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        
        # Handle index creation/cleanup
        self._setup_index()
        self.index = self.pc.Index(index_name)
        self.initialized = True

    def _setup_index(self):
        """Setup the index with proper existence checking."""
        try:
            if self.index_name not in self.pc.list_indexes():
                print(f"Creating index '{self.index_name}'...")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=384,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                print(f"Index '{self.index_name}' created successfully.")
            else:
                print(f"Index '{self.index_name}' already exists. Skipping creation.")
        except pinecone.openapi_support.exceptions.PineconeApiException as e:
            if "ALREADY_EXISTS" in str(e):
                print(f"Index '{self.index_name}' already exists (caught 409). Skipping creation.")
            else:
                raise
        except Exception as e:
            print(f"Error managing index: {str(e)}")
            raise

    def add_context(self, context_id: str, text: str, metadata: Dict[str, Any] = None) -> None:
        """Add a new context to the vector store as a text record."""
        try:
            # Generate embeddings using the sentence transformer model
            vector = self.model.encode(text).tolist()
            record = {
                "id": context_id,
                "values": vector,
                "metadata": {"text": text, **(metadata or {})}
            }
            self.index.upsert(vectors=[record], namespace=self.namespace)
        except Exception as e:
            print(f"Warning: Could not add context {context_id}: {str(e)}")

    def search_context(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant contexts based on the query text."""
        try:
            # Generate query embeddings using the sentence transformer model
            query_vector = self.model.encode(query).tolist()
            results = self.index.query(
                vector=query_vector,
                top_k=top_k,
                namespace=self.namespace,
                include_metadata=True
            )
            return results.matches
        except Exception as e:
            print(f"Warning: Could not search context: {str(e)}")
            return []

    def delete_context(self, context_id: str) -> None:
        """Delete a context from the vector store."""
        try:
            self.index.delete(ids=[context_id], namespace=self.namespace)
        except Exception as e:
            print(f"Warning: Could not delete context {context_id}: {str(e)}")

    def clear_namespace(self) -> None:
        """Clear all vectors in the current namespace."""
        try:
            self.index.delete(delete_all=True, namespace=self.namespace)
        except (NotFoundException, PineconeApiException) as e:
            # namespace missing is fine – just ignore it
            pass
        except Exception as e:
            print(f"Warning: Could not clear namespace: {str(e)}") 