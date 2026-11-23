# From lesson 's-python-refresher' (start). Code status: Python executed 2026-11-19 (examples/refreshers/refresher_python.py); the C# version prints the same output
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
