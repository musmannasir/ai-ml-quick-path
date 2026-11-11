# From lesson 'dl-neural-nets' (dl). Code status: Python NumPy executed 2026-11-02 (examples/ai-extras/ai_extras.py nn); PyTorch and C# (TorchSharp) not run (not installed in the build environment)
model = torch.nn.Sequential(torch.nn.Linear(2, 8), torch.nn.Tanh(), torch.nn.Linear(8, 1))
optimizer = torch.optim.Adam(model.parameters(), lr=0.05)
for step in range(2000):
    optimizer.zero_grad()
    loss = torch.nn.functional.binary_cross_entropy_with_logits(model(X), y)
    loss.backward()            # backpropagation, done automatically
    optimizer.step()
