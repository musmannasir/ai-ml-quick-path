// From lesson 'dl-transformers' (dl). Code status: Python NumPy executed 2026-11-02 (examples/attention/attention_toy.py); C# (TorchSharp) not run (not installed in the build environment)
using TorchSharp;
using static TorchSharp.torch;

int T = 7, d = 16;                                         // 7 tokens, 16 numbers each
var x = randn(T, d);                                       // token embeddings + positions
var wq = randn(d, d); var wk = randn(d, d); var wv = randn(d, d);   // learned in a real model

var q = x.matmul(wq); var k = x.matmul(wk); var v = x.matmul(wv);
var scores = q.matmul(k.transpose(0, 1)) / Math.Sqrt(d);   // every token compared with every token
var causal = ones(T, T).tril();                            // 1 = allowed, 0 = future
scores = scores.masked_fill(causal.eq(0), double.NegativeInfinity);
var weights = scores.softmax(-1);                          // each row sums to 1
var output = weights.matmul(v);                            // (7, 16)
Console.WriteLine($"weights {string.Join("x", weights.shape)}, output {string.Join("x", output.shape)}");
