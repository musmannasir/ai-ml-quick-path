# From lesson 'd-clean-eda' (data). Code status: Python executed 2026-11-02 (examples/ml-basics/ml_basics.py quality, gap_topics.py viz); C# not compiled (no .NET SDK in the build environment)
for ch, grp in df.groupby("channel"):
    ax.hist(grp["minutes"], bins=30, alpha=0.6, label=ch)
ax.set_xlabel("Minutes to first reply"); ax.set_ylabel("Tickets"); ax.legend()
