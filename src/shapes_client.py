import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv
from .context_graph.context_manager import ContextManager

load_dotenv()

class ShapesClient:
    def __init__(self, use_context_graph: bool = False):
        self.api_key = os.getenv("SHAPESINC_API_KEY")
        self.shape_username = os.getenv("SHAPESINC_SHAPE_USERNAME")
        
        if not self.api_key or not self.shape_username:
            raise ValueError("SHAPESINC_API_KEY and SHAPESINC_SHAPE_USERNAME must be set in .env")
        
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://api.shapes.inc/v1/"
        )
        
        self.use_context_graph = use_context_graph
        self.context_manager = ContextManager() if use_context_graph else None
    
    async def chat(
        self,
        message: str,
        user_id: Optional[str] = None,
        channel_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a message to the shape and get a response."""
        headers = {}
        if user_id:
            headers["X-User-Id"] = user_id
        if channel_id:
            headers["X-Channel-Id"] = channel_id
        
        # If using context graph, get relevant context
        if self.use_context_graph and self.context_manager:
            relevant_contexts = self.context_manager.get_relevant_context(message)
            context_text = "\n".join(ctx["text"] for ctx in relevant_contexts)
            
            # Add the current message to context
            self.context_manager.add_context(message, metadata)
            
            # Include relevant context in the message
            enhanced_message = f"Context:\n{context_text}\n\nUser message: {message}"
        else:
            enhanced_message = message
        
        response = await self.client.chat.completions.create(
            model=f"shapesinc/{self.shape_username}",
            messages=[{"role": "user", "content": enhanced_message}],
            extra_headers=headers
        )
        
        # Store the response in context if using context graph
        if self.use_context_graph and self.context_manager:
            self.context_manager.add_context(
                response.choices[0].message.content,
                {"type": "response", "original_message": message}
            )
        
        return {
            "response": response.choices[0].message.content,
            "usage": response.usage,
            "context_used": self.use_context_graph
        }
    
    def get_context_summary(self) -> Optional[Dict[str, Any]]:
        """Get a summary of the current context state if using context graph."""
        if self.use_context_graph and self.context_manager:
            return self.context_manager.get_context_summary()
        return None 