"""Copy every Python and C# code block from the lessons into examples/lesson-code/ so it can be opened in an editor.

Run:  python3 scripts/extract_lesson_code.py   (or: npm run extract:code)
The lessons are the source of truth: edit the lesson, then rerun this script.
Python blocks that are not complete programs are commented out and marked FRAGMENT so the folder still compiles.
"""
import os, py_compile, re, shutil, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'examples' / 'lesson-code'
EXT = {'python': 'py', 'cs': 'cs', 'csharp': 'cs'}

shutil.rmtree(OUT, ignore_errors=True)
counts = {'py': 0, 'cs': 0, 'fragments': 0}
for f in sorted((ROOT / 'src' / 'content' / 'lessons').glob('*/*.md')):
    lid, part = f.stem, f.parent.name
    text = f.read_text(encoding='utf-8')
    status = re.search(r'^code: (.*)$', text, re.M).group(1)
    for i, m in enumerate(re.finditer(r'^```(\w+)([^\n]*)\n(.*?)^```', text, re.S | re.M)):
        lang, title, code = m.group(1), m.group(2).strip(), m.group(3)
        if lang not in EXT:
            continue
        e = EXT[lang]
        name = title.split()[0] if title else ''
        if not name.endswith('.' + e):
            name = f'snippet{i + 1}.{e}'
        folder = OUT / ('dotnet' if e == 'cs' else 'python') / f'{part}-{lid}'
        path, n = folder / name, 2
        while path.exists():
            path = folder / name.replace('.' + e, f'_{n}.' + e); n += 1
        path.parent.mkdir(parents=True, exist_ok=True)
        cm = '//' if e == 'cs' else '#'
        head = f"{cm} From lesson '{lid}' ({part}). Code status: {status}\n"
        if e == 'py':
            with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False) as t:
                t.write(code)
            try:
                py_compile.compile(t.name, doraise=True)
            except py_compile.PyCompileError:
                head += '# FRAGMENT: part of a larger program; see the lesson for the surrounding code. Not runnable on its own.\n'
                code = ''.join('# ' + l if l.strip() else l for l in code.splitlines(True))
                counts['fragments'] += 1
            os.unlink(t.name)
        path.write_text(head + code, encoding='utf-8')
        counts[e] += 1
print(f"Extracted {counts['py']} Python files ({counts['fragments']} fragments) and {counts['cs']} C# files into {OUT.relative_to(ROOT)}")
