// What search results show for a page: the browser/search title and the description. Page headings are not affected.
// Add an entry only where the page's own title or description is missing, longer than a search result shows (about 60 and
// 160 characters; npm run test:static fails above that) or does not use the words people search for.
// Say only what the page really contains. The build fails on a path that is not a page.

const T = (title, description) => ({ ...(title ? { title } : {}), ...(description ? { description } : {}) });
const page = (description) => T('', description);

export const SEARCH = {
  // ---------- main pages ----------
  'index.html': T('Learn AI and Machine Learning Free | AI & ML Quick Path'),
  'plan.html': page('A 12-week study plan through the guide, with the lessons, practice and capstone project for each week.'),
  'roles.html': page('AI engineer or ML engineer? What each role does, the skills each needs, and which lessons to read for them.'),
  'roadmaps.html': page('Three visual roadmaps through the lessons: a quick complete path, a machine learning engineer view and an AI engineer view.'),
  'lessons.html': page('Every lesson in the guide, with filters by part, level, study time, track and the maths it uses.'),
  'solve.html': page('A decision guide: start from your problem and find the kind of AI or machine learning approach that fits it.'),
  'maths.html': page('A map of the maths names used in the lessons, from averages to attention, with the lessons that explain each one.'),
  'simulations.html': page('All the live simulations in one place: change a setting, watch the calculation respond and make a prediction first.'),
  'projects.html': page('Capstone projects that combine the lessons into working AI and machine learning systems, with acceptance tests.'),
  'cases.html': page('How real companies use AI, with published sources, the documented facts kept apart from the suggested design.'),
  'hardware.html': page('What laptops, desktops and cloud GPUs can do for AI work, and how to estimate the GPU memory a model needs.'),
  'glossary.html': page('AI and machine learning terms in plain words, each linked to the lesson that explains it with an example.'),
  'assessment.html': page('Short quizzes for each part and readiness checklists, to find gaps in what you have learned. Self-checks, not a certificate.'),
  'progress.html': page('Your reading progress, stored only in your browser: see it, resume a lesson, export it, import it or reset it.'),
  'about.html': page('About this free guide: who it is for, how it was checked, its sources, licences and accessibility.'),
  'privacy.html': page('Privacy and cookies: what this site stores in your browser, what it does not collect, and how advertising works.'),
  'cheatsheets.html': page('One-page cheat sheets for revising AI and machine learning: one for each part of the guide, and several by topic.'),
  '404.html': page('This page was not found. Go to the home page or the lesson list of this free guide to AI and machine learning.'),

  // ---------- part pages ----------
  'part-2-data.html': page('Data for machine learning in plain words: what it looks like, how to collect and label it, clean it, explore it and turn it into features.'),
  'part-3-ml.html': page('Machine learning in plain words: the main problem types and algorithms, with how to measure and improve the results.'),
  'part-5-llms.html': page('How large language models work, how to train a small one, fine-tune it, run it on your own machine and evaluate it.'),

  // ---------- company cases ----------
  'cases/morgan-stanley.html': T('Morgan Stanley case study: RAG assistant for advisors', 'The GPT-4 assistant for Morgan Stanley financial advisors: what published sources confirm, a suggested RAG design, risks and a practice project.'),
  'cases/klarna.html': T('Klarna case study: AI customer service assistant', 'The Klarna AI customer service assistant and the later hiring of human staff: what sources confirm, a suggested design, risks and a project.'),
  'cases/indeed.html': T('Indeed case study: fine-tuning for job recommendations', 'How Indeed used fine-tuned GPT models to explain job recommendations: what sources confirm, a suggested design, risks and a practice project.'),
  'cases/duolingo.html': T('Duolingo Max case study: GPT-4 features for learners', 'Duolingo Max and its GPT-4 features, Explain My Answer and Roleplay: what sources confirm, a suggested design, risks and a practice project.'),
  'cases/john-deere.html': T('John Deere See & Spray: computer vision case study', 'How John Deere See & Spray uses cameras and machine learning to spray where weeds are seen: confirmed facts, a suggested design and risks.'),
  'cases/deepmind-cooling.html': T('DeepMind data centre cooling: machine learning case study', 'How DeepMind and Google used neural networks to recommend data-centre cooling actions: confirmed facts, a suggested design and risks.'),
  'cases/intercom-fin.html': T('Intercom Fin case study: AI customer support agent', 'The Intercom Fin AI agent answers support questions from help content: what sources confirm, a suggested design, risks and a practice project.'),
  'cases/moderna.html': T('Moderna case study: enterprise AI assistants', 'How Moderna uses ChatGPT Enterprise and custom GPTs: what published sources confirm, a suggested design, risks and a practice project.'),
  'cases/lowes.html': T('Lowe\'s Mylow case study: AI assistant built with OpenAI', 'The Mylow assistants at Lowe\'s, built with OpenAI for shoppers and store staff: what sources confirm, a suggested design, risks and a project.'),
  'cases/github-copilot.html': T('GitHub Copilot case study: AI code assistants', 'The published GitHub Copilot developer experiment: what it confirms, a suggested code assistant design, risks and a practice project.'),
  'cases/toyota.html': T('Toyota AI Platform case study: ML for factory staff', 'The Toyota AI Platform lets factory staff build machine learning models: what sources confirm, a suggested design, risks and a project.'),

  // ---------- capstones ----------
  'projects/c01-churn.html': page('Build a customer churn prediction service in Python or C#: a daily list of customers likely to cancel and a live score for the support team.'),
  'projects/c04-rag-assistant.html': page('Build a company knowledge assistant with RAG that answers only from approved documents, cites the passage and says when it does not know.'),
  'projects/c08-lora-finetune.html': T('LoRA fine-tuning project: tune a small model', 'A LoRA fine-tuning project: tune a small open model on a few hundred examples, then test whether it beats the plain prompted model.'),

  // ---------- lessons: search titles ----------
  'lessons/s-what-is-ai.html': T('What is AI, machine learning, deep learning and GenAI?'),
  'lessons/app-responsible.html': T('Responsible AI: fairness, privacy and oversight'),
  'lessons/s-lifecycle.html': T('AI and ML project lifecycle: from idea to production'),
  'lessons/ml-algorithms.html': T('Machine learning (ML) algorithms: when to use each', 'Main machine learning algorithms in plain words, with Python and ML.NET (C#) examples: linear models, trees, forests, boosting, SVM and more.'),
  'lessons/ml-timeseries.html': T('Time-series forecasting in machine learning', 'Time-series forecasting in plain words: trend, seasonality, baselines to beat and testing on the future, with Python and ML.NET examples.'),
  'lessons/dl-rl.html': T('Reinforcement learning: Q-learning and policy gradient', 'Reinforcement learning in plain words: agents, rewards and policies, with Q-learning in Python and C# and a policy gradient run in Python.'),
  'lessons/dl-rl-value.html': T('Q-learning and SARSA: value-based reinforcement learning', 'Value-based reinforcement learning: Monte Carlo, temporal-difference learning, Q-learning, SARSA and deep Q-networks in plain words.'),
  'lessons/dl-rl-policy.html': T('Policy optimization in reinforcement learning: PPO', 'Policy gradient methods in plain words: how action probabilities move towards reward, why a baseline helps and how PPO clipping works.'),
  'lessons/llm-finetune.html': T('LoRA and QLoRA fine-tuning explained, with examples', 'When to use prompting, RAG or fine-tuning, how to prepare data, and how to fine-tune an open model with LoRA or QLoRA and compare it fairly.'),
  'lessons/app-rag.html': T('RAG in Python and C#: answer from your own documents', 'Build retrieval-augmented generation (RAG) with Python and C# examples: permission checks, retrieval, citations and how to measure it.'),
  'lessons/app-rag-advanced.html': T('Advanced RAG: chunking, hybrid search and re-ranking', 'Improve RAG with better chunking, hybrid keyword and vector search, re-ranking, query rewriting and filters, and measure each change.'),
  'lessons/app-llm-api.html': T('Call an LLM from Python and C# (.NET)'),
  'lessons/app-embeddings.html': T('Embeddings and vector search in Python and C#'),
  'lessons/app-agents.html': T('AI agents and tools in Python and C#, with approval', 'Let a model call tools safely, with Python and C# examples. Covers workflow state, permissions, human approval, retries and audit.'),

  // ---------- lessons: shorter descriptions ----------
  'lessons/s-python-refresher.html': page('Python for .NET developers: the small amount the lessons use, such as list comprehensions, dictionaries and error handling, compared with C#.'),
  'lessons/s-csharp-refresher.html': page('C# for Python developers: records, LINQ grouping, generic methods, async tasks and spans, each compared with the Python you already know.'),
  'lessons/ml-linear-deeper.html': page('Solve linear regression with the normal equation, see how a log link makes a count model, and choose a threshold from the cost of mistakes.'),
  'lessons/ml-trees-more.html': page('How AdaBoost builds a strong model by re-weighting mistakes, three rounds by hand, and how it compares with bagging and gradient boosting.'),
  'lessons/ml-clustering.html': page('Choose between k-means, hierarchical clustering, DBSCAN and Gaussian mixtures, and score clusters with the silhouette score.'),
  'lessons/ml-see-data.html': page('PCA, kernel PCA, t-SNE and UMAP in plain words: what each keeps in a 2-D picture, how to read it safely and how to measure it.'),
  'lessons/ml-patterns.html': page('Anomaly detection with Mahalanobis distance, kernel density estimates and shopping-basket rules with support, confidence and lift.'),
  'lessons/ai-search.html': page('Breadth-first search and A* for finding routes, and minimax with alpha-beta pruning for two-player games, explained in plain words.'),
  'lessons/ai-logic-plan.html': page('Backtracking for constraint problems, truth tables for logical rules, how a planner works and how a genetic algorithm searches.'),
  'lessons/ml-causal.html': page('Why comparing treated and untreated groups can mislead, how to adjust for a confounder or randomise, and how to read a causal diagram.'),
  'lessons/ml-bayes.html': page('Bayes\' rule, small Bayesian networks, Markov chain Monte Carlo sampling and a one-number Kalman filter, in plain words.'),
  'lessons/ml-model-compare.html': page('Compare two models fairly, judge their probabilities with log loss and the Brier score, and check calibration with a simple table.'),
  'lessons/ml-generalisation.html': page('Bias and variance in plain words: read training and test error, tell too simple from too flexible, and see what more data changes.'),
  'lessons/ml-improve.html': page('Tune hyperparameters, reduce overfitting with regularisation and ensembles, and explain predictions with feature importance and Shapley values.'),
  'lessons/ml-recommenders.html': page('Build a recommender with matrix factorisation, compare it with simple baselines, and handle cold start, ranking and diversity.'),
  'lessons/dl-backprop.html': page('Backpropagation by hand with the chain rule, how automatic differentiation does it for any model, and why gradients can vanish.'),
  'lessons/dl-vision-more.html': page('Apply an edge filter by hand, see how mixup and CutMix vary training images, and learn how a triplet loss powers image matching.'),
  'lessons/dl-sequences.html': page('How text becomes numbers with tokens and embeddings, how recurrent networks read sequences and why transformers replaced them.'),
  'lessons/dl-nlp-classic.html': page('Classic text processing: tokens, stop words and stemming, the BLEU score, and tagging with a hidden Markov model and Viterbi.'),
  'lessons/dl-gen-more.html': page('VAEs, normalising flows and diffusion in plain words: the reparameterisation trick, the KL term, forward noising and GAN problems.'),
  'lessons/llm-hardware.html': page('CPU, GPU and CUDA explained: check your device, load a model on a GPU, estimate memory and speed, and fix out-of-memory errors.'),
  'lessons/llm-train-laptop.html': page('Train a character-level language model on a laptop: read the losses, save checkpoints and run the same loop as a tiny transformer.'),
  'lessons/llm-scale.html': page('Estimate memory for training and inference, and choose GPUs, mixed precision, checkpointing or parallel training as models grow.'),
  'lessons/llm-local.html': page('Run an open-weight language model locally, understand quantization and memory needs, and call it from Python and .NET.'),
  'lessons/llm-embed-train.html': page('How embedding models learn to place related texts close together: cosine similarity, contrastive loss, negatives and temperature.'),
  'lessons/llm-paradigms.html': page('Few-shot, continual and meta-learning, double descent, model merging and quantisation-aware training in plain words.'),
  'lessons/app-frameworks.html': page('LangChain, LangGraph, Microsoft.Extensions.AI, Semantic Kernel, Agent Framework and MCP: what each does and when plain code is better.'),
  'lessons/app-security.html': page('The main security risks of LLM applications, such as prompt injection and data leakage, with layered defences and personal data redaction.'),
  'lessons/ops-mlops.html': page('MLOps in plain words: version data, code and models, record metrics in a registry and release a new model only when it passes a gate.'),
  'lessons/ops-data-debt.html': page('Validate data before it reaches a model, spot shifts between training and live data, and recognise technical debt in ML systems.'),
  'lessons/ops-architecture.html': page('Design a production AI system with a .NET app, a Python model service and an LLM: containers, secrets, fallbacks and security.'),
};
