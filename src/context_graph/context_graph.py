import uuid
from datetime import datetime
from typing import List, Dict, Any
from .vector_store import VectorStore

class ContextGraph:
    def __init__(self, vector_store: VectorStore = None):
        self.vector_store = vector_store or VectorStore()

    def ingest_context(self, user_id: str, text: str, topic: str = "general", metadata: Dict[str, Any] = None) -> str:
        """Ingest a new context into the graph."""
        context_id = f"{user_id}_{uuid.uuid4().hex}"
        context_metadata = {
            "user_id": user_id,
            "topic": topic,
            "timestamp": datetime.utcnow().isoformat(),
            **(metadata or {})
        }
        self.vector_store.add_context(context_id, text, context_metadata)
        return context_id

    def query_graph(self, user_id: str, query: str, topic: str = "general", top_k: int = 5) -> List[str]:
        """Query the context graph for relevant information."""
        results = self.vector_store.search_context(query, top_k=top_k)
        contexts = []
        for result in results:
            # Only include contexts from the same user and topic
            if (result.metadata.get("user_id") == user_id and 
                (topic == "general" or result.metadata.get("topic") == topic)):
                contexts.append(result.metadata.get("text", ""))
        return contexts 