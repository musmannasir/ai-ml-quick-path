// From lesson 'llm-eval' (llm). Code status: Perplexity values computed 2026-11-02 from the executed tiny-model run
// Probabilities the model assigned to each correct next token in a held-out sentence.
double[] correctTokenProbabilities = { 0.42, 0.10, 0.65, 0.31, 0.08, 0.55 };

double averageLoss = correctTokenProbabilities.Average(p => -Math.Log(p));   // cross-entropy in nats
double perplexity = Math.Exp(averageLoss);
Console.WriteLine($"average loss {averageLoss:F3} nats, perplexity {perplexity:F2}");
