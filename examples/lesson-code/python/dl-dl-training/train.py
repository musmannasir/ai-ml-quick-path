# From lesson 'dl-training' (dl). Code status: Python dropout demo executed 2026-11-02 (ai_extras.py dropout); PyTorch and C# (TorchSharp) not run (not installed in the build environment)
device = "cuda" if torch.cuda.is_available() else "cpu"
model = torch.nn.Sequential(torch.nn.Linear(20, 64), torch.nn.ReLU(), torch.nn.Dropout(0.3), torch.nn.Linear(64, 2)).to(device)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
train_dl = torch.utils.data.DataLoader(train_ds, batch_size=32, shuffle=True)
best, patience, bad_epochs = float("inf"), 5, 0
for epoch in range(100):
    model.train()
    for xb, yb in train_dl:
        xb, yb = xb.to(device), yb.to(device)
        loss = torch.nn.functional.cross_entropy(model(xb), yb)
        opt.zero_grad(); loss.backward(); opt.step()
    model.eval()
    with torch.no_grad():
        val = sum(torch.nn.functional.cross_entropy(model(x.to(device)), y.to(device)).item() for x, y in val_dl) / len(val_dl)
    if val < best:
        best, bad_epochs = val, 0
        torch.save(model.state_dict(), "best.pt")          # checkpoint
    else:
        bad_epochs += 1
        if bad_epochs >= patience: break                   # early stopping
