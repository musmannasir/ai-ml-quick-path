# From lesson 's-csharp-refresher' (start). Code status: Python executed 2026-11-19 (examples/refreshers/refresher_csharp.py); the C# version (csharp_tasks) prints the same output when built with the .NET SDK
"""The Python equivalent of the C# refresher: records, grouping, generics, async and slices.

Run:  python refresher_csharp.py
"""
import asyncio
from dataclasses import dataclass

@dataclass(frozen=True)
class Student:                                                                       # like a C# record: a small data holder
    name: str
    cls: str
    mark: int

students = [Student("Ana", "A", 70), Student("Ben", "A", 85), Student("Cy", "B", 90), Student("Di", "B", 60), Student("Eve", "B", 75)]
groups = {}
for s in students:                                                                   # like LINQ GroupBy
    groups.setdefault(s.cls, []).append(s.mark)
for key in sorted(groups):
    marks = groups[key]
    print("class %s: %d students, average %.1f" % (key, len(marks), sum(marks) / len(marks)))

def largest(items):                                                                  # works for anything that can be compared
    best = items[0]
    for item in items[1:]:
        if item > best:
            best = item
    return best
print("largest number: %d, largest word: %s" % (largest([4, 9, 2]), largest(["pear", "apple", "zebra"])))

async def slow_double(x):                                                            # like an async method
    await asyncio.sleep(0.01)
    return 2 * x
async def main():
    return await asyncio.gather(*[slow_double(x) for x in (1, 2, 3)])
doubled = asyncio.run(main())
print("doubled in parallel: [%s] total %d" % (", ".join(map(str, doubled)), sum(doubled)))

data = [1, 2, 3, 4, 5]
print("sum of the middle three:", sum(data[1:4]))                                    # like a Span slice
