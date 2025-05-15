import json
import os
from typing import Dict, Any

def load_results(filename: str) -> Dict[str, Any]:
    """Load and parse a results JSON file."""
    with open(filename, 'r') as f:
        return json.load(f)

def analyze_results(results: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze a single results file and return key metrics."""
    total_questions = results["total_questions"]
    correct_answers = results["correct_answers"]
    accuracy = correct_answers / total_questions
    
    # Calculate total tokens (3.5 characters per token)
    total_input_tokens = 0
    total_output_tokens = 0
    
    for q in results["question_results"]:
        # Count input tokens from each message in the prompt array
        for message in q["prompt"]:
            content = message["content"]
            prompt_length = len(content)
            total_input_tokens += prompt_length / 3.5
        
        # Count output tokens from model answer
        model_answer = q["model_answer"]
        output_length = len(model_answer)
        total_output_tokens += output_length / 3.5
    
    # Analyze individual questions
    question_analysis = []
    for q in results["question_results"]:
        question_analysis.append({
            "question_number": q["question_number"],
            "accuracy": q["accuracy"],
            "gold_answer": q["gold_answer"],
            "model_answer": q["model_answer"],
            "context_used": q["context_used"]
        })
    
    return {
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "accuracy": accuracy,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "question_analysis": question_analysis
    }

def main():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Load both result files using full paths
    without_pinecone = load_results(os.path.join(script_dir, "babi_qa_task1_without_pinecone.json"))
    with_pinecone = load_results(os.path.join(script_dir, "babi_qa_task1_with_pinecone.json"))
    
    # Analyze results
    without_analysis = analyze_results(without_pinecone)
    with_analysis = analyze_results(with_pinecone)
    
    # Print summary
    print("\n=== Results Analysis ===")
    print("\nWithout Pinecone:")
    print(f"Total Questions: {without_analysis['total_questions']}")
    print(f"Correct Answers: {without_analysis['correct_answers']}")
    print(f"Accuracy: {without_analysis['accuracy']:.2%}")
    print(f"Total Input Tokens: {without_analysis['total_input_tokens']:.0f}")
    print(f"Total Output Tokens: {without_analysis['total_output_tokens']:.0f}")
    print(f"Total Tokens: {without_analysis['total_input_tokens'] + without_analysis['total_output_tokens']:.0f}")
    
    print("\nWith Pinecone:")
    print(f"Total Questions: {with_analysis['total_questions']}")
    print(f"Correct Answers: {with_analysis['correct_answers']}")
    print(f"Accuracy: {with_analysis['accuracy']:.2%}")
    print(f"Total Input Tokens: {with_analysis['total_input_tokens']:.0f}")
    print(f"Total Output Tokens: {with_analysis['total_output_tokens']:.0f}")
    print(f"Total Tokens: {with_analysis['total_input_tokens'] + with_analysis['total_output_tokens']:.0f}")
    
    # Calculate improvement
    improvement = with_analysis['accuracy'] - without_analysis['accuracy']
    print(f"\nImprovement with Pinecone: {improvement:+.2%}")

if __name__ == "__main__":
    main() 