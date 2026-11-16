// From lesson 'dl-vision' (dl). Code status: Python NumPy demos executed 2026-11-02 (ai_extras.py conv, gap_topics.py vision); PyTorch not run (not installed in the build environment); added technique snippets (2026-11-05) not run
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

string[] labels = { "good", "scratched", "dented" };
using var session = new InferenceSession("inspector.onnx");

float[] pixels = LoadAndNormalise("part-0042.jpg");          // 3 x 224 x 224 values, same preprocessing as training
var input = new DenseTensor<float>(pixels, new[] { 1, 3, 224, 224 });
using var results = session.Run(new[] { NamedOnnxValue.CreateFromTensor("input", input) });

float[] scores = results.First().AsEnumerable<float>().ToArray();
var exp = scores.Select(s => Math.Exp(s)).ToArray();
int best = Array.IndexOf(scores, scores.Max());
Console.WriteLine($"{labels[best]} ({exp[best] / exp.Sum():P0})");
// Stand-in so the sample compiles: it returns an empty image. A real version decodes the file, resizes it to
// 224 x 224 and normalises it exactly as during training (for example with the ImageSharp package).
static float[] LoadAndNormalise(string path) => new float[3 * 224 * 224];
