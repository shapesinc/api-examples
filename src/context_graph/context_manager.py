from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from .vector_store import VectorStore

class ContextManager:
    def __init__(self):
        self.vector_store = VectorStore()
        self.context_history: Dict[str, Dict[str, Any]] = {}
    
    def add_context(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Add a new context to the system."""
        context_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        context_data = {
            "text": text,
            "timestamp": timestamp,
            "metadata": metadata or {}
        }
        
        self.context_history[context_id] = context_data
        self.vector_store.add_context(
            context_id=context_id,
            text=text,
            metadata={
                "timestamp": timestamp,
                **(metadata or {})
            }
        )
        
        return context_id
    
    def get_relevant_context(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Get the most relevant context for a given query."""
        matches = self.vector_store.search_context(query, top_k=top_k)
        
        # Enrich matches with full context data
        enriched_matches = []
        for match in matches:
            context_id = match.id
            if context_id in self.context_history:
                enriched_matches.append({
                    **self.context_history[context_id],
                    "similarity_score": match.score
                })
        
        return enriched_matches
    
    def delete_context(self, context_id: str) -> None:
        """Delete a context from the system."""
        if context_id in self.context_history:
            del self.context_history[context_id]
            self.vector_store.delete_context(context_id)
    
    def get_context_summary(self) -> Dict[str, Any]:
        """Get a summary of the current context state."""
        return {
            "total_contexts": len(self.context_history),
            "context_ids": list(self.context_history.keys()),
            "latest_timestamp": max(
                (ctx["timestamp"] for ctx in self.context_history.values()),
                default=None
            )
        } 