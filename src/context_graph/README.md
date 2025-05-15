# Contextual Memory Benchmarking with Shapes + Pinecone + LLaMA 3.1 8B

To evaluate the contextual memory and efficiency of the **default Shape model** (which currently uses **LLaMA 3.1 8B**), I ran a benchmarking experiment using the **bAbI QA Task 1 dataset**. This dataset is designed to test a model’s ability to track entities and answer questions based on narrative context, such as "Where is Daniel?" after a sequence of movements. It's a classic benchmark for evaluating reasoning and memory over multi-sentence stories.

I created a **blank Shape** and only gave it the following description:

> *You are a **strict extractive QA** model.  
Return **only** the exact word or short phrase from the story that answers the question.  
If absent, reply `unknown`.*

This ensured the model operated in a purely extractive, non-interpretive mode.

I then ran a **100-question evaluation** from bAbI Task 1 under two configurations:

- **Without Pinecone**: I sent the *entire* story and dialogue history with each new question.
- **With Pinecone**: I sent only the *most recent user prompt* plus the *two most semantically relevant past chunks* retrieved via Pinecone vector search across all prior context.

---

## Accuracy and Cost Tradeoffs

| Method            | Accuracy | Tokens Used | Cost @ $0.0004/1K |
|------------------|----------|-------------|-------------------|
| Without Pinecone | 97%      | 84,807      | **$0.03392**       |
| With Pinecone    | 93%      | 7,769       | **$0.00311**       |

- **Accuracy Tradeoff**: A 4% drop in accuracy (97% → 93%) when using Pinecone.
- **Token Savings**: ~91% fewer tokens used (84,807 → 7,769).
- **Cost Savings**: From $0.0339 to $0.00311 — a **90.8% drop** in LLM token cost.
- **Effective Cost per Question**:
  - Without Pinecone: **~$0.000339**
  - With Pinecone: **~$0.000031**

---

## Pinecone Usage Breakdown (Starter Plan Pricing Equivalent)

| Resource          | Usage     | Cost       |
|------------------|-----------|------------|
| Write Units      | 2,200     | $0.0088    |
| Read Units       | 899       | $0.014384  |
| Vector Storage   | 0.00065GB | $0.000215  |

- **Total Pinecone Cost**: **~$0.0234**

---

## Final Analysis

🧮 **Net cost savings** using Pinecone retrieval (including retrieval overhead):

```
$0.0339 (no Pinecone)
– ($0.0031 + $0.0234) 
= $0.0074 saved
```

That’s a **21.8% reduction in total cost** for only a **4% drop in accuracy**.

---

## Conclusion

This test serves as a **proof of concept**. While the naive Pinecone setup already achieves a strong token and cost reduction, there's still significant room for improvement. With smarter **chunking algorithms**, **vector filtering**, or **semantic compression**, it’s likely that the small loss in accuracy can be recovered—possibly even improved—while maintaining or further reducing inference cost.
