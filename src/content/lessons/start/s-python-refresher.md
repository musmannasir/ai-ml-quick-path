---
id: s-python-refresher
title: Python in a nutshell (for .NET developers)
module: start
level: Beginner
minutes: 45
maths: none
goal: Read and write the small amount of Python that the lessons use (list comprehensions, dictionaries, recursion, error handling and simple text data), by comparing each idea with the C# you already know.
prereqs:
reviewed: 2026-11-19
evidence: The refresher program run on your machine, plus the same five tasks written again by you in your own words and checked against the output.
code: Python executed 2026-11-19 (examples/refreshers/refresher_python.py); the C# version prints the same output
---
## In plain words
This is an optional refresher for people who know C# and are new to Python. Python reads more like plain English: there are no braces or semicolons, the indentation shows which lines belong together, and you do not declare types. A **list comprehension** builds a new list from an old one in one line. A **dictionary** is a set of key and value pairs, like a `Dictionary` in C#. **Recursion** means a function that calls itself. Python reports problems as **exceptions**, which you catch with `try` and `except`. This lesson shows five small tasks in Python and the same five in C#, so you can see the match between the two languages and then read the rest of the guide with ease.

```diagram compare The same idea in Python and C#
note: Most Python you meet in this guide maps to a C# idea you already use.
## Python | model
- List comprehension
- Dictionary and dict.get
- try and except
## C# | process
- LINQ Where and Select
- Dictionary and GetValueOrDefault
- TryParse or try and catch
```

```diagram flow Running a Python file
note: There is no separate build step. The interpreter reads the file and runs it.
- Write the code in a .py file | Plain text, indentation matters | input
- Run: python file.py | The interpreter reads it line by line | process
- Read the printed output | Errors show the line that failed | output
```

```diagram layers What the five tasks cover
note: Each task is small, and each is a pattern that appears again in the lessons.
- Filtering and mapping | Comprehension | process
- Counting words | Dictionary | process
- Recursion | A function calling itself | model
- Safe parsing | try and except | warn
- Reading a small CSV | Split text, convert, average | input
```

## Real-world example
A data analyst gets a spreadsheet exported as plain text. They write a short Python file that reads each line, converts the marks to numbers, skips lines that are not numbers, counts how often each word appears in the comments column, and prints an average. This is the shape of most data-preparation scripts in AI projects: read text, clean it, count or average, print the result. The five tasks in this lesson are that shape in miniature.

## How it works
1. **Indentation.** A block is the lines indented under a `:`. Use four spaces.
2. **Types.** A value has a type, but a name does not. `n = 3` and later `n = "three"` are both allowed. Check with small tests.
3. **Comprehension.** `[n * n for n in numbers if n % 2 == 0]` reads as "n times n, for each n in numbers, if n is even". The C# form is `numbers.Where(...).Select(...)`.
4. **Dictionary.** `counts.get(word, 0)` returns the count, or 0 if the word is new. The C# form is `GetValueOrDefault`.
5. **Errors.** Wrap the risky line in `try`, catch `ValueError`, and return `None` (Python's "no value", like `null`).
6. **Text data.** `split` cuts a string into pieces. A CSV line is split at commas, and the second piece is converted with `int`.

## Python example
Five tasks: even squares, word counts, Fibonacci numbers by recursion, safe parsing and a tiny CSV.

```python refresher_python.py
"""Python in a nutshell for this guide: comprehensions, dictionaries, recursion, errors and a small CSV.

Run:  python refresher_python.py
"""
numbers = [3, 8, 1, 9, 4, 6]
print("squares of the even numbers:", [n * n for n in numbers if n % 2 == 0])      # a list comprehension

text = "the cat and the hat and the bat"
counts = {}
for word in text.split():                                                            # a dictionary used as a counter
    counts[word] = counts.get(word, 0) + 1
print("word counts:", dict(sorted(counts.items())))

def fib(n):                                                                          # recursion: a function that calls itself
    return n if n < 2 else fib(n - 1) + fib(n - 2)
print("first ten Fibonacci numbers:", [fib(i) for i in range(10)])

def to_int(s):                                                                       # an error caught instead of crashing
    try:
        return int(s)
    except ValueError:
        return None
print("parsing 42, x7 and -3:", [to_int(s) for s in ["42", "x7", "-3"]])

csv = "name,mark\nAna,70\nBen,85\nCy,90"                                              # a small CSV held in a string
rows = [line.split(",") for line in csv.split("\n")[1:]]
marks = [int(m) for _, m in rows]
print("average mark: %.1f" % (sum(marks) / len(marks)))
print("best student:", max(rows, key=lambda r: int(r[1]))[0])
```
```text Output of refresher_python.py (executed)
squares of the even numbers: [64, 16, 36]
word counts: {'and': 2, 'bat': 1, 'cat': 1, 'hat': 1, 'the': 3}
first ten Fibonacci numbers: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
parsing 42, x7 and -3: [42, None, -3]
average mark: 81.7
best student: Cy
```
The mark average is 81.7 because (70 + 85 + 90) ÷ 3 = 81.67, shown to one decimal place. The text "x7" is not a whole number, so the parser returns `None` instead of crashing.

## .NET (C#) example
The same five tasks in C#, using LINQ, a sorted dictionary, recursion, `TryParse` and a small CSV in a string. It prints the same output.

```cs Program.cs
// The same tasks as refresher_python.py, written in C#: filtering, counting, recursion, safe parsing and a small CSV.
int[] numbers = { 3, 8, 1, 9, 4, 6 };
Console.WriteLine("squares of the even numbers: [" + string.Join(", ", numbers.Where(n => n % 2 == 0).Select(n => n * n)) + "]");      // LINQ: filter then map

string text = "the cat and the hat and the bat";
var counts = new SortedDictionary<string, int>(StringComparer.Ordinal);                                                               // a dictionary used as a counter
foreach (var word in text.Split(' ')) counts[word] = counts.GetValueOrDefault(word) + 1;
Console.WriteLine("word counts: {" + string.Join(", ", counts.Select(kv => $"'{kv.Key}': {kv.Value}")) + "}");

int Fib(int n) => n < 2 ? n : Fib(n - 1) + Fib(n - 2);                                                                                // recursion: a method that calls itself
Console.WriteLine("first ten Fibonacci numbers: [" + string.Join(", ", Enumerable.Range(0, 10).Select(Fib)) + "]");

int? ToInt(string s) => int.TryParse(s, out int v) ? v : null;                                                                        // no exception needed: TryParse reports failure
Console.WriteLine("parsing 42, x7 and -3: [" + string.Join(", ", new[] { "42", "x7", "-3" }.Select(s => ToInt(s)?.ToString() ?? "None")) + "]");

string csv = "name,mark\nAna,70\nBen,85\nCy,90";                                                                                       // a small CSV held in a string
var rows = csv.Split('\n').Skip(1).Select(line => line.Split(',')).ToList();
var marks = rows.Select(r => int.Parse(r[1])).ToList();
Console.WriteLine($"average mark: {marks.Average():F1}");
Console.WriteLine("best student: " + rows.OrderByDescending(r => int.Parse(r[1])).First()[0]);
```

## Maths behind it
- None needed. The only calculation is an average of three marks.

## Common mistakes
- Mixing tabs and spaces in indentation, or indenting by a different amount in the same block.
- Forgetting that `range(10)` stops at 9.
- Using `int(s)` on text without a `try` and crashing on bad input.
- Changing a list while looping over it.
- Expecting `5 / 2` to be 2. In Python it is 2.5, and `5 // 2` is 2.

## Quick check
Q: What does `[n * n for n in numbers if n % 2 == 0]` produce for `[3, 8, 1, 9, 4, 6]`?
A: `[64, 16, 36]`, the squares of the even numbers 8, 4 and 6.

Q: What is the C# match for `counts.get(word, 0)`?
A: `GetValueOrDefault` on a dictionary, which gives 0 for a word that has not been seen.

Q: What does Python use instead of braces to group lines?
A: Indentation after a colon.

Q: Why does the parser return `None` for "x7"?
A: The conversion raises a `ValueError`, the `except` block catches it, and the function returns `None` instead of stopping the program.
