# Shapes QA Retrieval Benchmark  
### (Context-Graph + Pinecone PoC for token-efficient extractive QA)

---

## 1 — Problem This Project Tackles
Modern LLM apps often waste tokens by replaying the *entire* chat history in every prompt.  
This proof-of-concept shows how **semantic retrieval (Pinecone) + local context graphs** can:

* surface only the most relevant memory chunks,
* slash token usage & cost,
* keep accuracy “good enough” for strict extractive tasks.

We benchmark two pipelines on **bAbI QA Task 1** (100 questions):

| Pipeline | Prompt Strategy | Goal |
|----------|-----------------|------|
| **Baseline** | Send *full* story so far with every question | Measure naïve cost & accuracy |
| **Retrieval** | Send only the *current turn* + **2 most-relevant past chunks** from Pinecone | Measure savings vs. accuracy hit |

---

## 2 — High-Level Flow

```text
              +--------------------------+
bAbI dataset  |  test_qa.py (runner)     |
─────────────►|  loops over 100 Q-A pairs|  (with_context=False / True)
              +-----------┬--------------+
                          |
                          | builds SYSTEM + USER prompt
                          v
                 +-------------------+                      +------------------+
                 |  ShapesClient     |--(async)--> OpenAI   |  Blank “Shape”   |
                 | (shapes_client.py)|  / REST              |  (Llama-3.1-8B)  |
                 +----------┬--------+                      +------------------+
                            | (optional) context graph
                            v
                 +-----------------------------+
                 |  ContextGraph (vector layer)|
                 |   └─► VectorStore (Pinecone)|
                 +-----------------------------+

After each answer:
➜ accuracy calculated  
➜ token usage recorded  
➜ JSON results written.
## 3 — File-by-File Breakdown

| File | Purpose | Key Points |
|------|---------|------------|
| **`setup.py`** | pip-installable package scaffold | Declares core deps (`pinecone`, `openai`, `sentence-transformers`, …) |
| **`vector_store.py`** | *Singleton* Pinecone wrapper | • Creates/uses **`shapes-context`** index<br>• Embeds text with MiniLM (384-d)<br>• Methods: `add_context`, `search_context`, `clear_namespace` |
| **`context_graph.py`** | Per-user semantic memory | `ingest_context()` writes vectors; `query_graph()` filters by `user_id` + topic |
| **`context_manager.py`** | In-memory history + retrieval glue | Used when Pinecone disabled or for local searches |
| **`shapes_client.py`** | Async client for Shapes API | • Adds `X-User-Id` / `X-Channel-Id` headers<br>• If `use_context_graph=True`, prepends retrieved chunks to prompt and stores turns |
| **`test_qa.py`** | **🚀 Benchmark driver** | • Loads `facebook/babi_qa` **Task 1**<br>• Runs phases *with* and *without* Pinecone<br>• Tracks accuracy, token counts, cost<br>• Writes JSON: `babi_qa_task1_{with,without}_pinecone.json` |
| **`README.md`** | Top-level read-me | Install guide, Shapes overview, quick-start |
| **`docs/PRICE_BREAKDOWN.md`** | Cost & accuracy table | Shows token savings, Pinecone cost, 21.8 % net savings |
## 4 — Workflow / Data-Flow Diagram

1. **Dataset Loader** (`test_qa.py`) pulls bAbI QA Task 1 via hugging face datasets.  
2. Each story/question pair is processed in two phases:  

   a. **Without Pinecone**  
      * `context` = full story so far  
      * Prompt = system instructions + entire story + question  

   b. **With Pinecone**  
      * Every sentence → `ContextGraph.ingest_context()` (=> **Pinecone** vector)  
      * `ContextGraph.query_graph()` retrieves **k = 3** chunks (latest + 2 most-similar)  
      * Prompt = system instructions + those chunks + question  

3. Prompt reaches the **Shapes API** (default *Llama-3 8B* engine).  
4. Response recorded, token usage counted.  
5. Metrics & JSON logs written.

## 5 — Extending the PoC

* **Smarter Chunking** – experiment with sentence windows, sliding context, or semantic splitting.  
* **Advanced Similarity** – swap MiniLM for a domain-specific embedding model; tune `top-k` & score cutoff.  
* **RAG-Style Re-ranking** – rerank retrieved chunks with a cross-encoder before composing the final prompt.  
* **Streaming & Caching** – enable output streaming and cache identical queries to cut latencies / tokens.  
* **Batch Evaluation** – add HotpotQA & Natural Questions to cover multi-hop reasoning and open-domain QA.  
* **Observability** – plug in logging (e.g., Weights & Biases) to track per-question latency / cost / F1.  
* **Fine-Tuned Llama** – swap the vanilla 8B for a LoRA fine-tune on extractive QA to recoup the 4 % accuracy gap.  
* **Vector DB Cost Optimisation** – play with pod types (Starter → Standard → Serverless) and auto-scale rules.

## 6 — Proof-of-Concept Caveats & Next Steps  <!-- originally Section 7 -->

This repository demonstrates **only a minimal, end-to-end proof-of-concept** for RAG-style retrieval on the *bAbI QA Task 1* benchmark. As such, several areas remain deliberately simple and can be improved:

| Area | Current PoC Choice | Why It’s Imperfect | Improvement Ideas |
|------|-------------------|--------------------|-------------------|
| **Sentence-Level Chunking** | Each line of the story is ingested as an independent Pinecone vector. | Ignores cross-sentence context; can split entities across chunks. | Try sliding windows, paragraph grouping, or dynamic span merging. |
| **Embedding Model** | `sentence-transformers/all-MiniLM-L6-v2` (384-d). | Generic; not tuned for story QA; may mis-rank events vs. locations. | Use domain-fine-tuned MiniLM or OpenAI text-embedding-3-small, or evaluate Cohere/Instructor. |
| **Similarity Retrieval** | Plain cosine, *k = 3* (latest + top-2). | No score cut-off; cannot filter noisy matches; rank is “good-enough”. | Add score threshold, MMR re-ranking, or cross-encoder verification before prompting. |
| **Prompt Construction** | Latest k chunks concatenated verbatim → Llama-3 8B. | No de-duplication, no temporal ordering tag, no citation markers. | Inject inline citations (`[1]`, `[2]`), keep only unique sentences, or sort chronologically. |
| **Evaluation Set** | 100 validation Qs from bAbI Task 1. | Single synthetic domain; short stories; single-hop answers. | Expand to Tasks 2–20, HotpotQA, or Natural Questions for multi-hop and open-domain stress-tests. |
| **Costing** | Token cost + starter-tier Pinecone fees. | Static prices; ignores real-world autoscaling, cold-start latency. | Profile throughput under load; test Pinecone serverless or hybrid on-disk indexes. |
| **LLM** | Default Shapes engine = Llama-3 8B, zero-shot. | 4 % accuracy drop vs. full-context baseline. | Fine-tune (LoRA) on extractive QA; explore 70B for parity; evaluate quantized variants. |

> **Take-away:** the current pipeline already **cuts LLM token spend by ≈ 91 % and total cost by ≈ 22 %** while trimming accuracy by only four points — but smarter retrieval, prompt engineering, and model tuning can push that frontier further.
