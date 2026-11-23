---
id: s-csharp-refresher
title: C# in a nutshell (for Python developers)
module: start
level: Beginner
minutes: 45
maths: none
goal: Read and write the small amount of C# that the lessons use (records, LINQ grouping, generic methods, async tasks and spans), by comparing each idea with the Python you already know.
prereqs:
reviewed: 2026-11-19
evidence: The refresher program run on your machine with the .NET SDK, plus the same four tasks written again by you in your own words and checked against the output.
code: Python executed 2026-11-19 (examples/refreshers/refresher_csharp.py); the C# version (csharp_tasks) prints the same output when built with the .NET SDK
---
## In plain words
This is an optional refresher for people who know Python and are new to C#. C# is a **typed** language: every value has a type that is checked before the program runs, so many mistakes are caught early. Code is grouped by braces and every statement ends with a semicolon. A **record** is a small, unchangeable data holder, like a Python `dataclass`. **LINQ** is a set of methods such as `Where`, `Select` and `GroupBy` that work on lists, much like comprehensions. A **generic** method works for any type that meets a stated rule. **async** and **await** let a program wait for slow work, such as a web request, without blocking. A **Span** is a window onto memory that avoids copying, like a slice in Python.

```diagram compare The same idea in C# and Python
note: Most C# in this guide maps to a Python idea you already use.
## C# | process
- record
- LINQ GroupBy
- async and await
## Python | model
- dataclass
- setdefault or a loop
- async and await
```

```diagram flow Running a C# program
note: The compiler checks the types first. Type errors stop the build, not the run.
- Write the code in Program.cs | Types and braces | input
- Build with dotnet build | The compiler checks every type | process
- Run with dotnet run | Runs the compiled program | model
- Read the printed output | Same result as the Python version | output
```

```diagram layers What the four tasks cover
note: Each task is small, and each is a pattern that appears again in the lessons.
- Records and grouping | Data holder plus GroupBy | process
- Generic methods | One method for many types | model
- Async tasks | Wait without blocking | warn
- Spans | A window, no copy | input
```

## Real-world example
A team's model runs in Python, but the company's web service is written in C#. A developer who knows Python needs to read the service code that calls the model. It stores each request in a record, groups requests by customer with LINQ, calls the model through an async method so the page stays responsive, and passes a slice of an array without copying it. These four ideas are most of what the C# examples in this guide use.

## How it works
1. **Types.** `int`, `string` and `double` are checked when you build. `var` lets the compiler work the type out, but it is still fixed.
2. **Records.** `record Student(string Name, string Class, int Mark);` makes a small immutable class with the three fields.
3. **LINQ.** `students.GroupBy(s => s.Class)` groups by class, then `Count()` and `Average(...)` summarise each group. The arrow `s => ...` is a small function.
4. **Generics.** `T Largest<T>(IEnumerable<T> items) where T : IComparable<T>` works for numbers and words alike, because both can be compared.
5. **Async.** `async Task<int>` marks a method that can wait. `await Task.WhenAll(...)` runs several at once and collects the results.
6. **Span.** `data[1..4]` is a window onto items 1, 2 and 3 of the same memory.

## Python example
The Python equivalent of the four tasks: a dataclass, grouping with a dictionary, a comparison-based function, `asyncio` and a slice.

```python refresher_csharp.py
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
```
```text Output of refresher_csharp.py (executed)
class A: 2 students, average 77.5
class B: 3 students, average 75.0
largest number: 9, largest word: zebra
doubled in parallel: [2, 4, 6] total 12
sum of the middle three: 9
```
Class A has marks 70 and 85, so its average is 77.5. Class B has 90, 60 and 75, so its average is 75.0. The middle three of 1, 2, 3, 4, 5 are 2, 3 and 4, which add to 9.

## .NET (C#) example
The four tasks in C# with no packages. It prints the same output as the Python program above.

```cs Program.cs
// C# in a nutshell for this guide: records, LINQ grouping, generics, async and Span.
var students = new List<Student> { new("Ana", "A", 70), new("Ben", "A", 85), new("Cy", "B", 90), new("Di", "B", 60), new("Eve", "B", 75) };
foreach (var g in students.GroupBy(s => s.Class).OrderBy(g => g.Key))                                                    // LINQ GroupBy
    Console.WriteLine($"class {g.Key}: {g.Count()} students, average {g.Average(s => s.Mark):F1}");

T Largest<T>(IEnumerable<T> items) where T : IComparable<T>                                                              // a generic method: works for anything comparable
{
    T best = items.First();
    foreach (var item in items.Skip(1)) if (item.CompareTo(best) > 0) best = item;
    return best;
}
Console.WriteLine($"largest number: {Largest(new[] { 4, 9, 2 })}, largest word: {Largest(new[] { "pear", "apple", "zebra" })}");

async Task<int> SlowDouble(int x) { await Task.Delay(10); return 2 * x; }                                                // an async method
var doubled = await Task.WhenAll(new[] { 1, 2, 3 }.Select(SlowDouble));
Console.WriteLine($"doubled in parallel: [{string.Join(", ", doubled)}] total {doubled.Sum()}");

Span<int> data = stackalloc int[] { 1, 2, 3, 4, 5 };                                                                     // a Span: a window onto memory with no copy
Span<int> middle = data[1..4];
int sum = 0; foreach (int v in middle) sum += v;
Console.WriteLine($"sum of the middle three: {sum}");

record Student(string Name, string Class, int Mark);                                                                    // a record: a small immutable data holder
```

## Maths behind it
- None needed. The only calculations are averages and a sum.

## Common mistakes
- Forgetting the semicolon at the end of a statement.
- Writing `await` in a method that is not marked `async`.
- Using `==` to compare text in a way that ignores the culture rules you wanted. Use an explicit comparer when it matters.
- Dividing two integers and expecting a decimal. `5 / 2` is 2 in C#, and `5 / 2.0` is 2.5.
- Copying a large array when a `Span` would do.

## Quick check
Q: What is the Python match for a C# record?
A: A frozen dataclass: a small data holder whose fields cannot be changed.

Q: What does `GroupBy` followed by `Average` give for class B with marks 90, 60 and 75?
A: 75.0, because (90 + 60 + 75) ÷ 3 = 75.

Q: Why do generic methods need a rule such as `IComparable<T>`?
A: The method compares items, so the compiler must know that every type used can be compared.

Q: What does `await Task.WhenAll(...)` do?
A: It runs the tasks together, waits for all of them and returns their results as a list.
