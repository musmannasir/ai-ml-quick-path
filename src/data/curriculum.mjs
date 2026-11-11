// Curriculum for AI & ML Quick Path (self-contained, maths shown only as short applied panels).
// Lesson text lives in src/content/lessons/<module>/<id>.md; this file only orders it.

export const REVIEWED = '2026-11-02';
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const MODULES = [
  {
    id: 'start', page: 'part-1-start.html', stage: '1', title: 'Part 1: The big picture', short: '1 Big picture',
    intro: 'What AI and machine learning are, how a real AI project runs from idea to production, and how to set up Python and .NET on your own laptop.',
    groups: [{ title: 'The big picture', lessons: ['s-what-is-ai', 's-lifecycle', 's-setup'] }],
  },
  {
    id: 'data', page: 'part-2-data.html', stage: '2', title: 'Part 2: Data', short: '2 Data',
    intro: 'Every model is only as good as its data. Learn what data looks like, how companies collect and label it, how to clean and explore it, and how to turn it into features.',
    groups: [{ title: 'Working with data', lessons: ['d-basics', 'd-collect', 'd-clean-eda', 'd-features'] }],
  },
  {
    id: 'ml', page: 'part-3-ml.html', stage: '3', title: 'Part 3: Machine learning', short: '3 Machine learning', track: 'ml',
    intro: 'How models learn from examples, the main types of problems (predict a number, pick a category, find groups, spot anomalies, forecast, recommend), the main algorithms, and how to measure and improve results.',
    groups: [
      { title: 'How learning works', lessons: ['ml-learning', 'ml-regression', 'ml-classification', 'ml-algorithms', 'ml-unsupervised'] },
      { title: 'Measure and improve', lessons: ['ml-evaluation', 'ml-improve'] },
      { title: 'Common industry problems', lessons: ['ml-timeseries', 'ml-recommenders'] },
    ],
  },
  {
    id: 'dl', page: 'part-4-deep-learning.html', stage: '4', title: 'Part 4: Deep learning', short: '4 Deep learning', track: 'ml',
    intro: 'Neural networks and how to train them, then the model families used for images, text, audio, generation, decision-making and connected data.',
    groups: [
      { title: 'Neural networks', lessons: ['dl-neural-nets', 'dl-training'] },
      { title: 'Model families', lessons: ['dl-vision', 'dl-sequences', 'dl-transformers', 'dl-generative', 'dl-speech', 'dl-rl', 'dl-graphs'] },
    ],
  },
  {
    id: 'llm', page: 'part-5-llms.html', stage: '5', title: 'Part 5: Large language models', short: '5 Language models', track: 'lm',
    intro: 'How large language models work, how to design one, how to train a small one on your laptop and scale it to big hardware, how to fine-tune and run models locally, and how to evaluate them.',
    groups: [
      { title: 'How LLMs work', lessons: ['llm-how', 'llm-tokens'] },
      { title: 'Design and train', lessons: ['llm-design', 'llm-train-laptop', 'llm-scale'] },
      { title: 'Adapt, run and evaluate', lessons: ['llm-finetune', 'llm-local', 'llm-eval'] },
    ],
  },
  {
    id: 'apps', page: 'part-6-ai-apps.html', stage: '6', title: 'Part 6: Building AI applications', short: '6 AI applications', track: 'applied',
    intro: 'Build real products on top of models: calling LLMs, prompting, embeddings, RAG, agents and tools, multimodal apps, evaluation, security and responsible AI.',
    groups: [
      { title: 'Talking to models', lessons: ['app-llm-api', 'app-prompting'] },
      { title: 'Knowledge: embeddings and RAG', lessons: ['app-embeddings', 'app-rag', 'app-rag-advanced'] },
      { title: 'Actions: tools and agents', lessons: ['app-agents', 'app-frameworks', 'app-multimodal'] },
      { title: 'Quality and trust', lessons: ['app-evals', 'app-security', 'app-responsible'] },
      { title: 'Advanced: the whole picture', lessons: ['app-genai-agentic'] },
    ],
  },
  {
    id: 'ops', page: 'part-7-production.html', stage: '7', title: 'Part 7: Production', short: '7 Production',
    intro: 'Run AI and ML reliably for real users: serving models as APIs, MLOps, monitoring, cost and scale, and reference architectures that combine .NET and Python.',
    groups: [{ title: 'From prototype to production', lessons: ['ops-serving', 'ops-mlops', 'ops-monitoring', 'ops-scale', 'ops-architecture'] }],
  },
];

export const moduleOfLesson = Object.fromEntries(
  MODULES.flatMap((m) => m.groups.flatMap((g) => g.lessons.map((l) => [l, m.id]))),
);
export const LESSON_ORDER = MODULES.flatMap((m) => m.groups.flatMap((g) => g.lessons));

export const ROADMAPS = [
  {
    id: 'applied', title: 'Quick path: complete grip', color: 'applied',
    summary: 'The full sequence in the shortest sensible order. Each step builds on the one before. Finish with a capstone that combines ML and AI.',
    nodes: [
      { n: 1, title: 'The big picture and your setup', short: 'Start', effort: '4–6 h', desc: 'What AI and ML are, the project lifecycle, Python and .NET on your laptop.', lessons: ['s-what-is-ai', 's-lifecycle', 's-setup'] },
      { n: 2, title: 'Data skills', short: 'Data', effort: '8–12 h', desc: 'Data types, collection, labelling, cleaning, exploring and features.', lessons: ['d-basics', 'd-collect', 'd-clean-eda', 'd-features'] },
      { n: 3, title: 'Core machine learning', short: 'ML', effort: '12–18 h', desc: 'How models learn, regression, classification, the main algorithms and unsupervised learning.', lessons: ['ml-learning', 'ml-regression', 'ml-classification', 'ml-algorithms', 'ml-unsupervised'] },
      { n: 4, title: 'Measure, improve and apply ML', short: 'Improve', effort: '8–12 h', desc: 'Metrics, tuning, explanations, forecasting and recommenders.', lessons: ['ml-evaluation', 'ml-improve', 'ml-timeseries', 'ml-recommenders'] },
      { n: 5, title: 'Deep learning', short: 'Deep learning', effort: '14–20 h', desc: 'Neural networks, training, vision, text, transformers, generation, speech, RL and graphs.', lessons: ['dl-neural-nets', 'dl-training', 'dl-vision', 'dl-sequences', 'dl-transformers', 'dl-generative', 'dl-speech', 'dl-rl', 'dl-graphs'] },
      { n: 6, title: 'Large language models', short: 'LLMs', effort: '14–20 h', desc: 'How LLMs work, design, train on a laptop, scale up, fine-tune, run locally, evaluate.', lessons: ['llm-how', 'llm-tokens', 'llm-design', 'llm-train-laptop', 'llm-scale', 'llm-finetune', 'llm-local', 'llm-eval'] },
      { n: 7, title: 'Talk to models and add knowledge', short: 'RAG', effort: '10–14 h', desc: 'LLM APIs, prompting, embeddings, RAG and advanced retrieval.', lessons: ['app-llm-api', 'app-prompting', 'app-embeddings', 'app-rag', 'app-rag-advanced'] },
      { n: 8, title: 'Agents, multimodal and trust', short: 'Agents', effort: '12–16 h', desc: 'Tools, agents, frameworks, multimodal apps, evaluation, security and responsible AI.', lessons: ['app-agents', 'app-frameworks', 'app-multimodal', 'app-evals', 'app-security', 'app-responsible', 'app-genai-agentic'] },
      { n: 9, title: 'Production', short: 'Production', effort: '10–14 h', desc: 'Serving, MLOps, monitoring, cost and scale, architectures.', lessons: ['ops-serving', 'ops-mlops', 'ops-monitoring', 'ops-scale', 'ops-architecture'] },
      { n: 10, title: 'Capstones and real cases', short: 'Capstone', effort: '30–60 h', desc: 'Use the decision guide on real cases and build at least two capstones.', lessons: [], projects: ['c01-churn', 'c04-rag-assistant', 'c06-tiny-llm', 'c08-lora-finetune'] },
    ],
  },
  {
    id: 'ml', title: 'ML engineer view', color: 'ml',
    summary: 'Focus on training models from data and running them in production. Read Part 6 later for LLM applications.',
    nodes: [
      { n: 1, title: 'Big picture and setup', short: 'Start', effort: '4–6 h', desc: 'Lifecycle and tools.', lessons: ['s-what-is-ai', 's-lifecycle', 's-setup'] },
      { n: 2, title: 'Data', short: 'Data', effort: '8–12 h', desc: 'Collect, clean, explore, engineer features.', lessons: ['d-basics', 'd-collect', 'd-clean-eda', 'd-features'] },
      { n: 3, title: 'Supervised learning', short: 'Supervised', effort: '8–12 h', desc: 'How models learn, regression and classification.', lessons: ['ml-learning', 'ml-regression', 'ml-classification'] },
      { n: 4, title: 'Algorithms and unsupervised learning', short: 'Algorithms', effort: '6–10 h', desc: 'Which algorithm when; clustering, PCA and anomalies.', lessons: ['ml-algorithms', 'ml-unsupervised'] },
      { n: 5, title: 'Evaluation and improvement', short: 'Evaluate', effort: '6–10 h', desc: 'Metrics, validation, tuning, explanations.', lessons: ['ml-evaluation', 'ml-improve'] },
      { n: 6, title: 'Forecasting and recommendations', short: 'Industry ML', effort: '6–10 h', desc: 'Two of the most common business uses.', lessons: ['ml-timeseries', 'ml-recommenders'] },
      { n: 7, title: 'Deep learning', short: 'Deep learning', effort: '14–20 h', desc: 'Networks, training, vision and other model families.', lessons: ['dl-neural-nets', 'dl-training', 'dl-vision', 'dl-sequences', 'dl-transformers', 'dl-rl'] },
      { n: 8, title: 'MLOps and production', short: 'MLOps', effort: '10–14 h', desc: 'Serve, track, monitor and scale models.', lessons: ['ops-serving', 'ops-mlops', 'ops-monitoring', 'ops-scale'] },
      { n: 9, title: 'Capstones', short: 'Capstone', effort: '30–50 h', desc: 'Churn prediction, demand forecasting and image inspection.', lessons: [], projects: ['c01-churn', 'c02-forecast', 'c03-vision'] },
    ],
  },
  {
    id: 'lm', title: 'AI engineer view', color: 'lm',
    summary: 'Focus on building products with language models: RAG, agents, evaluation and security. Learn enough ML to reason about models and data.',
    nodes: [
      { n: 1, title: 'Big picture and setup', short: 'Start', effort: '4–6 h', desc: 'Lifecycle and tools for Python and .NET.', lessons: ['s-what-is-ai', 's-lifecycle', 's-setup'] },
      { n: 2, title: 'Enough data and ML', short: 'ML basics', effort: '8–12 h', desc: 'Data, how models learn, classification and evaluation.', lessons: ['d-basics', 'ml-learning', 'ml-classification', 'ml-evaluation'] },
      { n: 3, title: 'How LLMs work', short: 'LLMs', effort: '6–10 h', desc: 'Transformers, tokens, sampling and limits.', lessons: ['dl-transformers', 'llm-how', 'llm-tokens'] },
      { n: 4, title: 'Calling models and prompting', short: 'APIs', effort: '6–8 h', desc: 'APIs, structured output, prompt patterns.', lessons: ['app-llm-api', 'app-prompting'] },
      { n: 5, title: 'Embeddings and RAG', short: 'RAG', effort: '10–14 h', desc: 'Search by meaning and answer from your documents.', lessons: ['app-embeddings', 'app-rag', 'app-rag-advanced'] },
      { n: 6, title: 'Agents and multimodal apps', short: 'Agents', effort: '10–14 h', desc: 'Tools, agents, frameworks, images and speech.', lessons: ['app-agents', 'app-frameworks', 'app-multimodal'] },
      { n: 7, title: 'Quality, security and responsibility', short: 'Trust', effort: '8–12 h', desc: 'Evaluation, attacks and defences, fairness and privacy.', lessons: ['app-evals', 'app-security', 'app-responsible'] },
      { n: 8, title: 'Own and run models', short: 'Models', effort: '10–16 h', desc: 'Fine-tune, run locally, evaluate; serve and scale.', lessons: ['llm-finetune', 'llm-local', 'llm-eval', 'ops-serving', 'ops-scale', 'ops-architecture'] },
      { n: 9, title: 'Capstones', short: 'Capstone', effort: '30–50 h', desc: 'RAG assistant, approval-based agent and a local private assistant.', lessons: [], projects: ['c04-rag-assistant', 'c05-agent', 'c07-local-assistant', 'c08-lora-finetune'] },
    ],
  },
];

export const ROUTES = [
  {
    id: 'quick', title: 'Get a complete grip (recommended)',
    advice: 'Follow Parts 1 to 7 in order. Read "In plain words" and "How it works" first, run the Python or .NET example in your main language, then answer the quick check before moving on.',
    steps: ['s-what-is-ai', 's-lifecycle', 'd-basics', 'ml-learning', 'ml-classification', 'dl-neural-nets', 'llm-how', 'app-rag', 'app-agents', 'ops-serving'],
    estimate: 'About 12 weeks at 8–10 hours a week, plus capstones (study estimate).',
  },
  {
    id: 'apps', title: 'I want to build AI apps first',
    advice: 'Start with how models learn and how LLMs work, then go straight to Part 6. Come back to Parts 3 and 4 when you need to train your own models.',
    steps: ['s-what-is-ai', 'ml-learning', 'llm-how', 'app-llm-api', 'app-prompting', 'app-embeddings', 'app-rag', 'app-agents', 'app-evals', 'app-security'],
    estimate: 'About 4–6 weeks at 8–10 hours a week to a first working AI app (study estimate).',
  },
  {
    id: 'models', title: 'I want to train models first',
    advice: 'Work through data and machine learning, then deep learning, then train a tiny language model on your laptop. Add Part 7 to put your models into production.',
    steps: ['s-lifecycle', 'd-basics', 'd-clean-eda', 'd-features', 'ml-regression', 'ml-classification', 'ml-evaluation', 'dl-neural-nets', 'llm-train-laptop', 'ops-serving'],
    estimate: 'About 6–8 weeks at 8–10 hours a week to a trained, served model (study estimate).',
  },
];
