# Lesson code

Every Python and C# code block from the 49 lessons, copied into files so you can open them in VS Code,
Visual Studio or Rider. One folder per lesson: `<part>-<lesson-id>/`.

- `python/` — 44 files. They compile (`python -m py_compile`); one fragment that is only part of a larger
  program is commented out and marked `FRAGMENT`.
- `dotnet/` — 50 C# files. **Not compiled**: no .NET SDK was available in the build environment. They were
  desk-reviewed against the package APIs, and five issues found in that review were fixed on 2026-11-03.
  Several files are partial (a class, or top-level statements that use a client created earlier in the lesson);
  the lesson text explains what surrounds them.

The first line of every file names its lesson and the honest status of the code.

These files are generated. To change one, edit the lesson in `src/content/lessons/` and run
`npm run extract:code` (or `python3 scripts/extract_lesson_code.py`).

## Running a C# example
```bash
dotnet new console -n Demo && cd Demo
dotnet add package Microsoft.ML            # add the packages named in the lesson
# replace Program.cs with the lesson file, then:
dotnet run
```
For ASP.NET Core examples use `dotnet new web`. Keep API keys in user secrets
(`dotnet user-secrets set "OpenAI:ApiKey" "..."`) or environment variables, never in code.
