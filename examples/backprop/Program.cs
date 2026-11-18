// A tiny automatic-differentiation engine in C#. Same numbers as autograd.py. No packages.
using System.Globalization;
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

Value LossOf(Value w, Value b)
{
    double x = 2.0, y = 1.0;
    Value err = (w * x + b).Sigmoid() - y;
    return err * err;
}

var w = new Value(0.5); var b = new Value(-0.3);
Value loss = LossOf(w, b);
loss.Backward();
Console.WriteLine($"loss {loss.Data:F4}  d loss / d w = {w.Grad:F4}  d loss / d b = {b.Grad:F4}");
double h = 1e-6;                                                  // check against a tiny nudge of w
double numeric = (LossOf(new Value(0.5 + h), new Value(-0.3)).Data - LossOf(new Value(0.5 - h), new Value(-0.3)).Data) / (2 * h);
Console.WriteLine($"numerical check of d loss / d w: {numeric:F4}");

Console.WriteLine("layers  gradient reaching the first layer (sigmoid layers, weight 1)  (ReLU layers, weight 1)");
foreach (int n in new[] { 1, 5, 10, 20 })
{
    double gSig = 1.0, z = 0.5;
    for (int i = 0; i < n; i++)
    {
        double s = 1 / (1 + Math.Exp(-z));
        gSig *= s * (1 - s);                                      // each sigmoid layer multiplies the gradient by at most 0.25
        z = s;
    }
    Console.WriteLine($"{n,6}  {gSig.ToString("0.00e+00").PadLeft(57)}  {1.0.ToString("F1").PadLeft(22)}");
}

class Value
{
    public double Data, Grad;
    readonly Value[] parents; readonly double[] local;             // local[i] = d(this) / d(parents[i])
    public Value(double data, Value[]? parents = null, double[]? local = null)
    { Data = data; this.parents = parents ?? Array.Empty<Value>(); this.local = local ?? Array.Empty<double>(); }
    public static Value operator +(Value a, Value b) => new(a.Data + b.Data, new[] { a, b }, new[] { 1.0, 1.0 });
    public static Value operator *(Value a, Value b) => new(a.Data * b.Data, new[] { a, b }, new[] { b.Data, a.Data });
    public static Value operator +(Value a, double b) => a + new Value(b);
    public static Value operator *(Value a, double b) => a * new Value(b);
    public static Value operator -(Value a, double b) => a + new Value(-b);
    public Value Sigmoid() { double s = 1 / (1 + Math.Exp(-Data)); return new Value(s, new[] { this }, new[] { s * (1 - s) }); }
    public void Backward()
    {
        var order = new List<Value>(); var seen = new HashSet<Value>();
        void Visit(Value v)                                       // parents before children
        {
            if (!seen.Add(v)) return;
            foreach (var p in v.parents) Visit(p);
            order.Add(v);
        }
        Visit(this);
        Grad = 1.0;
        for (int i = order.Count - 1; i >= 0; i--)                // the chain rule, one step at a time
            for (int k = 0; k < order[i].parents.Length; k++)
                order[i].parents[k].Grad += order[i].local[k] * order[i].Grad;
    }
}
