import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

import json
import time
import string
import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Any, Generator
from openai import AsyncOpenAI
from .vector_store import VectorStore
from .context_graph import ContextGraph
from utils.rate_limiter import RateLimiter
from datasets import load_dataset
from dotenv import load_dotenv

load_dotenv()

class BabiQATester:
    def __init__(self, task_id: str = "task1", use_pinecone: bool = False):
        self.user_id = str(uuid.uuid4())  # Generate unique user ID
        self.shapes_client = AsyncOpenAI(
            api_key=os.getenv("SHAPESINC_API_KEY2" if use_pinecone else "SHAPESINC_API_KEY"),
            base_url="https://api.shapes.inc/v1/",
            default_headers={"X-User-Id": self.user_id}  # Add user ID to default headers
        )
        self.shape_username = "botgraph" if use_pinecone else "botnograph"
        self.rate_limiter = RateLimiter(rpm=4)  # 4 RPM = 15 seconds between requests
        self.task_id = task_id
        self.use_pinecone = use_pinecone
        
        # Set Pinecone API key in environment
        os.environ["PINECONE_API_KEY"] = os.getenv("PINECONE_API_KEY")
        
        # Use a shared VectorStore instance
        self.vector_store = VectorStore()
        self.context_graph = ContextGraph(self.vector_store)
        
        # Results storage
        self.results_dir = os.path.join(os.path.dirname(__file__), "../../test_results")
        os.makedirs(self.results_dir, exist_ok=True)
        
        # Load bAbI QA dataset
        self.dataset = self._load_babi_dataset()
    
    def _load_babi_dataset(self) -> List[Dict[str, Any]]:
        """Load and prepare bAbI QA dataset."""
        print(f"Loading bAbI QA dataset (Task {self.task_id})...")
        
        # Map task_id to correct config name
        task_to_config = {
            "task1": "en-valid-qa1",
            "task2": "en-valid-qa2",
            "task3": "en-valid-qa3",
            "task4": "en-valid-qa4",
            "task5": "en-valid-qa5",
            "task6": "en-valid-qa6",
            "task7": "en-valid-qa7",
            "task8": "en-valid-qa8",
            "task9": "en-valid-qa9",
            "task10": "en-valid-qa10",
            "task11": "en-valid-qa11",
            "task12": "en-valid-qa12",
            "task13": "en-valid-qa13",
            "task14": "en-valid-qa14",
            "task15": "en-valid-qa15",
            "task16": "en-valid-qa16",
            "task17": "en-valid-qa17",
            "task18": "en-valid-qa18",
            "task19": "en-valid-qa19",
            "task20": "en-valid-qa20"
        }
        
        config_name = task_to_config.get(self.task_id)
        if not config_name:
            raise ValueError(f"Invalid task_id: {self.task_id}. Must be one of: {list(task_to_config.keys())}")
        
        # Load dataset from Hugging Face
        dataset = load_dataset("facebook/babi_qa", config_name)
        
        # Process examples progressively
        processed_data = []
        story_so_far = []
        question_count = 0
        
        for row in dataset["validation"]:  # Use validation split
            story = row["story"]
            texts = story["text"]
            types = story["type"]
            answers = story["answer"]
            supporting_ids = story["supporting_ids"]
            
            # Process each turn in the story
            for i, (text, type_, answer, supports) in enumerate(zip(texts, types, answers, supporting_ids)):
                if type_ == 0:  # This is a statement
                    story_so_far.append(text)
                elif type_ == 1:  # This is a question
                    question_count += 1
                    # Add all previous statements to context
                    context = [t for t, type_ in zip(texts[:i], types[:i]) if type_ == 0]
                    
                    processed_data.append({
                        "question_number": question_count,
                        "context": context,
                        "question": text,
                        "gold_answer": answer,
                        "support_ids": supports,
                        "story_id": len(processed_data),
                        "full_history": story_so_far.copy()  # Store full history for non-Pinecone version
                    })
        
        if not processed_data:
            raise ValueError("No valid examples found in the dataset")
        
        print(f"Successfully loaded {len(processed_data)} questions")
        return processed_data
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text by removing punctuation and converting to lowercase."""
        # Remove punctuation and convert to lowercase
        text = text.lower()
        # Remove all punctuation
        text = text.translate(str.maketrans('', '', string.punctuation))
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text
    
    def _calculate_accuracy(self, prediction: str, gold_answer: str) -> float:
        """Calculate accuracy as a binary match: is the gold answer in the prediction?"""
        try:
            # Normalize both texts
            norm_pred = self._normalize_text(prediction)
            norm_gold = self._normalize_text(gold_answer)
            
            # Check if gold answer exists anywhere in prediction
            return 1.0 if norm_gold in norm_pred else 0.0
        except Exception as e:
            print(f"Error calculating accuracy: {str(e)}")
            return 0.0
    
    async def _get_model_response(self, messages: List[Dict[str, str]]) -> str:
        """Get response from the model with rate limiting."""
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                self.rate_limiter.wait_if_needed()
                
                # Print the exact prompt being sent
                print("\n=== Prompt Sent to Shape ===")
                for msg in messages:
                    print(f"\n{msg['role'].upper()}:")
                    print(msg['content'])
                print("\n===========================")
                
                response = await self.shapes_client.chat.completions.create(
                    model=f"shapesinc/{self.shape_username}",
                    messages=messages,
                    temperature=0.0  # Set temperature to 0 for most deterministic responses
                )
                return response.choices[0].message.content.strip()
                
            except Exception as e:
                if "rate_limit" in str(e).lower() and attempt < max_retries - 1:
                    # Extract retry-after from headers if available, default to 60 seconds
                    retry_after = 60
                    if hasattr(e, 'response') and hasattr(e.response, 'headers'):
                        retry_after = int(e.response.headers.get("retry-after", "60"))
                    
                    print(f"Rate limit hit, waiting {retry_after} seconds before retry {attempt + 1}/{max_retries}...")
                    await asyncio.sleep(retry_after)
                    continue
                raise  # Re-raise if it's not a rate limit error or we're out of retries
    
    def _save_results(self, results: Dict[str, Any], phase: str):
        """Save test results to file."""
        filename = os.path.join(self.results_dir, f"babi_qa_{self.task_id}_{phase}.json")
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
    
    async def _reset_shape(self):
        """Reset the Shape's long-term memory."""
        print("Resetting Shape's memory...")
        await self._get_model_response([], "!reset")
        print("Shape memory reset complete.")
    
    async def _delete_all_vectors(self):
        """Delete all vectors from the Pinecone index."""
        print("Deleting all vectors from Pinecone index...")
        try:
            self.vector_store.clear_namespace()
            print("Successfully deleted all vectors from Pinecone index")
        except Exception as e:
            print(f"Error deleting vectors: {str(e)}")
            raise
    
    async def run_test_phase(self) -> Dict[str, Any]:
        """Run a test phase."""
        phase_name = "with_pinecone" if self.use_pinecone else "without_pinecone"
        print(f"\n=== Running Test Phase: {phase_name} ===")
        
        # Delete all vectors if using Pinecone
        if self.use_pinecone:
            await self._delete_all_vectors()
        
        # Generate new user ID for this phase
        self.user_id = str(uuid.uuid4())
        
        results = {
            "phase": phase_name,
            "task": self.task_id,
            "timestamp": datetime.now().isoformat(),
            "total_questions": len(self.dataset),
            "correct_answers": 0,
            "question_results": []
        }
        
        for i, example in enumerate(self.dataset):
            question_number = example["question_number"]
            print(f"\nProcessing question {question_number}/{len(self.dataset)}")
            
            context = example["context"]
            question = example["question"]
            gold_answer = example["gold_answer"]
            support_ids = example["support_ids"]
            
            # Get context based on whether we're using Pinecone
            if self.use_pinecone:
                # Add new context to Pinecone
                for sentence in context:
                    self.context_graph.ingest_context(
                        user_id="test_user",
                        text=sentence,
                        topic=f"babi_qa_{self.task_id}",
                        metadata={"type": "story_sentence"}
                    )
                # Query Pinecone for relevant context (top 2)
                pinecone_context = self.context_graph.query_graph(
                    user_id="test_user",
                    query=question,
                    topic=f"babi_qa_{self.task_id}",
                    top_k=2  # Only get top 2 most relevant chunks
                )
                print(f"Retrieved {len(pinecone_context)} supporting facts from Pinecone")
                print("Fetched context from Pinecone:")
                for i, ctx in enumerate(pinecone_context, 1):
                    print(f"{i}. {ctx}")
                
                # Use Pinecone context for the prompt
                context_text = "\n".join(pinecone_context)
            else:
                # Use full history for non-Pinecone version
                context_text = "\n".join(example["full_history"])
            
            # Construct the prompt
            messages = [
                {"role": "user", "content": context_text},
                {"role": "user", "content": question}
            ]
            
            # Get model response
            model_answer = await self._get_model_response(messages)
            
            # Calculate accuracy
            accuracy = self._calculate_accuracy(model_answer, gold_answer)
            results["correct_answers"] += accuracy
            
            # Store results
            results["question_results"].append({
                "question_number": question_number,
                "prompt": messages,
                "gold_answer": gold_answer,
                "model_answer": model_answer,
                "accuracy": accuracy,
                "support_ids": support_ids,
                "context_used": len(context),
                "feedback_provided": False
            })
            
            # Save intermediate results
            self._save_results(results, phase_name)
            
            # Add a small delay between questions
            await asyncio.sleep(1)
        
        return results

async def main():
    # Test task 1 (Single supporting fact)
    # Create both testers
    without_pinecone = BabiQATester(task_id="task1", use_pinecone=False)
    with_pinecone = BabiQATester(task_id="task1", use_pinecone=True)
    
    # Run tests
    await without_pinecone.run_test_phase()
    await with_pinecone.run_test_phase()

if __name__ == "__main__":
    asyncio.run(main()) 