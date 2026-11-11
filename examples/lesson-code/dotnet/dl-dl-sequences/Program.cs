// From lesson 'dl-sequences' (dl). Code status: Python executed 2026-11-02 (gap_topics.py wordvec, ai_extras.py rnn); C# (TorchSharp) not run (not installed in the build environment)
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

var classifier = new TextClassifier(vocabSize: 10_000, embeddingSize: 64, hiddenSize: 128, classes: 3);
var tokenIds = tensor(new long[] { 12, 845, 3, 991, 7 }).reshape(1, 5);   // one sentence of 5 token ids
var scores = classifier.forward(tokenIds);
Console.WriteLine(string.Join(", ", scores.softmax(-1).data<float>().ToArray().Select(p => p.ToString("F2"))));

public class TextClassifier : Module<Tensor, Tensor>
{
    private readonly Module<Tensor, Tensor> embed, head;
    private readonly TorchSharp.Modules.LSTM lstm;
    public TextClassifier(long vocabSize, long embeddingSize, long hiddenSize, long classes) : base(nameof(TextClassifier))
    {
        embed = Embedding(vocabSize, embeddingSize);                 // id -> meaning vector
        lstm = LSTM(embeddingSize, hiddenSize, batchFirst: true);    // reads the sequence, keeps a memory
        head = Linear(hiddenSize, classes);
        RegisterComponents();
    }
    public override Tensor forward(Tensor ids)
    {
        var (output, _, _) = lstm.forward(embed.forward(ids));
        return head.forward(output.select(1, -1));                   // use the memory after the last token
    }
}
