# Content sources register (AI & ML Quick Path)

This guide is **self-contained**: the website has no external links (enforced by `npm run build` and
`npm run test:static`). Case pages name their sources by title and publisher only. This file is the one place
where web addresses are recorded, so maintainers can re-check facts. It ships in the source package, not on the site.

Method: **Seen** = destination read during research for the sibling editions (checked 2026-10-30 to 2026-11-02);
**Listed** = official address not re-opened from the build environment; **Executed** = number produced by code run
in this repository.

## Case studies (facts and results only; workflows are the academy's own designs)

| Case | Source | Topic / fact used | Method | Confidence | Uncertainty |
|---|---|---|---|---|---|
| Morgan Stanley | https://openai.com/index/morgan-stanley/ | Internal assistant; over 98% of advisor teams use it | Seen | Medium | Vendor case study; adoption is not accuracy |
| Morgan Stanley | https://investmentnews.com/fintech/morgan-stanleys-open-ai-powered-solution-for-advisors-has-expanded/254880 | Debrief tool, 28 Jun 2024 | Seen | High | — |
| Klarna | https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/ | 2.3M conversations, two-thirds of chats, first month (27 Feb 2024) | Seen (cited by multiple outlets) | High | Launch-month company figure |
| Klarna | https://www.entrepreneur.com/business-news/klarna-ceo-reverses-course-by-hiring-more-humans-not-ai/491396 | May 2025 renewed hiring of human support | Seen | Medium | Based on Bloomberg interview |
| Indeed | https://openai.com/index/indeed/ | +20% started applications, +13% downstream success; fine-tuned smaller model | Seen | Medium | Company A/B results; methods not public |
| Indeed | https://indeed.com/lead/how-indeed-uses-ai-to-provide-better-matching-context-for-job-seekers | Invite to Apply explanations | Seen | High | — |
| Duolingo | https://blog.duolingo.com/duolingo-max/ | Max launch: Explain My Answer, Roleplay, human review | Seen | High | No outcome metric used |
| Duolingo | https://techcrunch.com/2023/03/14/duolingo-launches-new-subscription-tier-with-access-to-ai-tutor-powered-by-gpt-4 | Independent report of launch | Seen | High | — |
| John Deere | https://deere.com/en/news/all-news/see-spray-herbicide-savings | 59% average herbicide mix savings, >1M acres, 2024 | Seen | Medium | Manufacturer figure |
| John Deere | https://uaex.uada.edu/media-resources/news/2025/march/03-10-2025-see-and-spray-research.aspx | 43–59% reduction; seed-bank trade-off | Seen | High | Single region and crop |
| Google DeepMind | https://deepmind.google/blog/deepmind-ai-reduces-google-data-centre-cooling-bill-by-40/ | Up to 40% cooling energy reduction, 15% PUE overhead (2016) | Seen | High | Historical, specific sites |
| Google DeepMind | https://techcrunch.com/2016/07/20/google-unleashes-deepmind-on-energy-hungry-datacenter-cutting-cooling-bill-by-40-percent/ | Independent report | Seen | High | — |
| Intercom | https://www.intercom.com/blog/fin-ai-chatbot-customer-service-improvements | Earlier average resolution rate 41% | Seen | Medium | Undated in search snippet; metric definition is Intercom's |
| Intercom | https://www.intercom.com/learning-center/intercom-vs-liveagent | Current page: 76% average resolution, 8,000+ customers | Seen | Medium | Vendor metric changes over time |
| Moderna | https://openai.com/index/moderna | mChat, ChatGPT Enterprise, Dose ID | Seen | Medium | Usage counts only |
| Moderna | https://www.biospace.com/moderna-and-openai-collaborate-to-advance-mrna-medicine | 750+ GPTs, >80% mChat adoption (24 Apr 2024 press release) | Seen | High | — |
| Lowe's | https://openai.com/index/lowes | Mylow and Mylow Companion with OpenAI | Seen | Medium | No metric used |
| Lowe's | https://www.prnewswire.com/news-releases/lowes-deploys-first-at-scale-ai-assistant-for-retail-associates-302445687.html | Rollout to 1,700+ stores, 5 May 2025 | Seen | High | Second-hand earnings-call metrics deliberately excluded |
| GitHub | https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/ | 95 developers; 55% faster; CI 21–89%; completion 78% vs 70% | Seen | High | One task, one language |
| GitHub | https://arxiv.org/abs/2302.06590 | Peer research paper on the experiment | Listed | High | — |
| Toyota | https://cloud.google.com/blog/ja/topics/hybrid-cloud/toyota-ai-platform-manufacturing-efficiency | Factory AI platform; up to ~10,000 hours/year; 6 developers, ~1.5 years | Seen (Japanese and Korean editions) | Medium | English edition URL not confirmed, so the Japanese edition is cited |
| Toyota | https://logisticsviewpoints.com/2025/06/05/people-ai-augmenting-the-supply-chain-workforce/ | Independent summary | Seen | Medium | Secondary source |

## Framework and API facts used in lessons

| Topic | Source | Method | Confidence | Uncertainty |
|---|---|---|---|---|
| `GetResponseAsync<T>` structured output (Microsoft.Extensions.AI) | https://learn.microsoft.com/dotnet/api/microsoft.extensions.ai.chatclientstructuredoutputextensions.getresponseasync | Seen | High | `ChatResponse<T>.TryGetResult` used in samples was not separately confirmed; verify with your package version |
| Microsoft Agent Framework 1.0 GA (April 2026), .NET and Python | Visual Studio Magazine 6 Apr 2026; Microsoft TechWiese | Seen | High | — |
| `AsAIAgent`, `ApprovalRequiredAIFunction`, `RunAsync`, sessions | https://learn.microsoft.com/en-us/agent-framework/agents/tools/tool-approval | Seen | High | Doc pages show both `GetNewSessionAsync` and `CreateSessionAsync` across versions; samples use `CreateSessionAsync` |
| LangGraph `interrupt`, `Command(resume=...)`, `InMemorySaver` | https://docs.langchain.com/oss/python/langgraph/interrupts | Seen | High | — |
| LangChain `init_chat_model`, `create_agent`, `with_structured_output`, `@tool` | https://docs.langchain.com/oss/python/langchain/overview | Listed | Medium | Not re-checked this session; LangChain APIs change between versions |
| OWASP Top 10 for LLM Applications 2025 | https://genai.owasp.org/llm-top-10/ | Seen | High | One secondary source reports a 2026 edition (Aug 2026); not verified, so lessons name the 2025 edition and say newer editions may exist |
| Chinchilla ~20 tokens/parameter rule of thumb | https://arxiv.org/abs/2203.15556 | Listed | High | Presented as a rule of thumb, not a law |
| vLLM PagedAttention, continuous batching | https://docs.vllm.ai/, https://arxiv.org/abs/2309.06180 | Listed | High | CLI flags change; lesson marks commands as conceptual |

## Hardware

| Fact | Source | Method | Confidence |
|---|---|---|---|
| GeForce RTX 5090 32 GB, 5080 16 GB, 5070 Ti 16 GB, 5070 12 GB, 5060 Ti 16/8 GB, 5060 8 GB | https://www.nvidia.com/en-us/geforce/graphics-cards/compare/ | Seen | High |
| RTX PRO 6000 Blackwell 96 GB | https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000-family/ | Listed (carried from previous edition) | Medium |
| Prices | — | **Not verified; no prices published** | — |

## Numbers produced by code in this repository

| What | Where | Method | Note |
|---|---|---|---|
| Every Python output quoted in the 49 lessons | `examples/quickpath/quickpath.py`, `ml-basics`, `gap-topics`, `ai-extras`, `applied-ai-basics`, `math`, `spam-classifier`, `attention`, `tiny-lm`, `memory-estimate`, `rag-leave-policy`, `agent-returns`, `llm-summarizer` | Executed 2026-11-02/03 (Python 3, NumPy, pandas, scikit-learn) | Synthetic data, fixed seeds. On 2026-11-03, 116 quoted lines from quickpath, ml_basics, applied_basics, gap_topics, ai_extras and math_for_ai were compared automatically with fresh runs: 0 mismatches (machine-dependent timing lines excluded). |
| Serving latency (p50 0.9 ms, p95 1.1–1.2 ms) and batching speed-up (about 1,500×) | `quickpath.py serving`, `quickpath.py batching` | Executed 2026-11-03 | Machine-dependent; lessons say so |
| Registry promotion example (AUC 0.877 vs 0.874 vs 0.848) | `quickpath.py registry` | Executed 2026-11-03 | Synthetic churn data |
| Cache saving (99.2% hit rate, cost 10.00 → 0.08) | `quickpath.py cache` | Executed | Illustrative price, Zipf-like synthetic traffic; real traffic has more unique questions |
| PSI 0.005 / 0.496 | `ml_basics.py drift` | Executed | The 0.1 / 0.25 thresholds are a common industry rule of thumb, not a standard |
| GPU memory estimates on the hardware page | `memory_estimate.py` | Executed | Arithmetic; real use needs more memory |

## Concepts stated from general knowledge (no single source)

Definitions of standard terms (supervised learning, gradient boosting, transformers, LoRA, quantisation,
mixture of experts, speculative decoding, federated learning, feature stores and so on) are textbook material
explained in the guide's own words. Where a lesson names a tool or package (for example FastAPI, MLflow, ML.NET,
`PredictionEnginePool`, ONNX Runtime, Ollama, vLLM, llama.cpp), it describes documented behaviour current at
the review date; package APIs change, so the C# and framework code is labelled with its honest status.

## Corrections from the independent C# review (2026-11-03)

| Lesson | Problem | Fix |
|---|---|---|
| ml-recommenders | Label column named `Score` collides with the trainer's `Score` output, so evaluation compared predictions with themselves | Label renamed to `Label` |
| app-frameworks | MCP stdio server logged to stdout, which is reserved for protocol messages | Console logs sent to stderr |
| app-agents | Approval types are experimental (MEAI001) in some Microsoft.Extensions.AI versions and may be renamed | `#pragma warning disable MEAI001` plus a version note (uncertain finding, kept as a caution) |
| app-responsible | Dictionary lookup could throw for a group with no qualified applicants | `TryGetValue` with "n/a" |
| ops-mlops | Trainer looks for a `Label` column the sample did not define | `Customer` class added with `[ColumnName("Label")]` |
