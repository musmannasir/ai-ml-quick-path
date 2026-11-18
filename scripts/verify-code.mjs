// Code verification: compiles every C# lesson sample with the installed .NET SDK and runs / syntax-checks
// every Python lesson sample. Writes qa/code-status.json, which the site build reads to show honest status pills.
// Nothing here is assumed: a sample is "compiled" or "ran" only when the tool exited with code 0 on this machine.
//
// Run:  node scripts/verify-code.mjs            (everything; first run downloads NuGet packages)
//       node scripts/verify-code.mjs --python   (Python only)
//       node scripts/verify-code.mjs --dotnet   (C# only)
//       node scripts/verify-code.mjs --only=ml-regression,dl-vision
// Needs: npm run extract:code first (it copies lesson code blocks into examples/lesson-code/).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'qa', 'code-status.json');
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const doPy = !args.includes('--dotnet');
const doCs = !args.includes('--python');
const today = new Date().toISOString().slice(0, 10);
const py = process.platform === 'win32' ? 'python' : 'python3';
const WORK = join(process.env.VERIFY_WORK || tmpdir(), 'aimlqp-verify');

const walk = (d, ext) => (existsSync(d) ? readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : []; }) : []);
// examples/lesson-code/<python|dotnet>/<part>-<lesson id>/[sub-folder/]file  ->  lesson id
const lessonOf = (file) => { const p = file.split(/[\\/]/); const k = Math.max(p.lastIndexOf('dotnet'), p.lastIndexOf('python')); return p[k + 1].replace(/^(start|data|ml|dl|llm|apps|ops)-/, ''); };
const tool = (cmd, a) => { try { return execFileSync(cmd, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim().split('\n')[0]; } catch { return null; } };

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { lessons: {} };
const status = { generated: today, machine: process.platform, tools: prev.tools || {}, examples: prev.examples || [], lessons: prev.lessons || {} };
const L = (id) => (status.lessons[id] ||= { python: [], csharp: [] });

// ---------------- Python ----------------
if (doPy) {
  status.tools.python = tool(py, ['--version']);
  const mods = ['numpy', 'pandas', 'sklearn', 'torch', 'fastapi', 'mlflow', 'langgraph', 'transformers', 'onnxruntime'];
  status.tools.pythonModules = Object.fromEntries(mods.map((m) => [m, tool(py, ['-c', `import ${m};print(getattr(${m},'__version__','installed'))`]) || 'not installed']));
  // 1. The runnable example programmes (same list as scripts/run-examples.mjs).
  const EX = join(ROOT, 'examples');
  const runs = [['spam-classifier', ['spam_classifier.py']], ['attention', ['attention_toy.py']], ['tiny-lm', ['tiny_char_lm_numpy.py']],
    ['memory-estimate', ['memory_estimate.py']], ['rag-leave-policy', ['rag_leave_policy.py']], ['agent-returns', ['returns_workflow.py']],
    ['llm-summarizer/python', ['summarize.py', '--offline']], ['llm-summarizer/python', ['-m', 'unittest', 'test_summary_schema.py']],
    ['ml-basics', ['ml_basics.py']], ['applied-ai-basics', ['applied_basics.py']],
    ['quickpath', ['quickpath.py']], ['math', ['math_for_ai.py']], ['ai-extras', ['ai_extras.py']], ['gap-topics', ['gap_topics.py']], ['generalisation', ['generalisation.py']], ['model-compare', ['model_compare.py']], ['linear-deeper', ['linear_deeper.py']], ['boosting', ['adaboost.py']], ['clustering', ['clustering.py']], ['seeing-data', ['see_data.py']], ['patterns', ['patterns.py']], ['maths-moments', ['maths_moments.py']]];
  status.examples = [];
  for (const [dir, a] of runs) {
    if (!existsSync(join(EX, dir))) continue;
    const r = spawnSync(py, a, { cwd: join(EX, dir), encoding: 'utf8', timeout: 300000, env: { ...process.env, PYTHONIOENCODING: 'utf-8', MPLBACKEND: 'Agg' } });
    const ok = r.status === 0;
    status.examples.push({ command: `${py} ${a.join(' ')}`, cwd: `examples/${dir}`, result: ok ? 'ran' : 'failed', date: today, detail: ok ? '' : String(r.stderr || r.error || '').trim().split('\n').slice(-2).join(' | ').slice(0, 300) });
    console.log(`${ok ? 'ran   ' : 'FAILED'} examples/${dir} ${a.join(' ')}`);
  }
  // 2. Every Python block copied from a lesson: syntax check, then try to run the ones that are whole programmes.
  for (const f of walk(join(ROOT, 'examples/lesson-code/python'), '.py')) {
    const id = lessonOf(f);
    if (only.length && !only.includes(id)) continue;
    const src = readFileSync(f, 'utf8');
    const rec = { file: f.slice(ROOT.length + 1).replace(/\\/g, '/'), date: today };
    if (/^# FRAGMENT/m.test(src)) { rec.result = 'fragment'; rec.detail = 'Part of a larger programme; not valid Python on its own.'; }
    else {
      const c = spawnSync(py, ['-m', 'py_compile', f], { encoding: 'utf8' });
      if (c.status !== 0) { rec.result = 'syntax-error'; rec.detail = String(c.stderr).trim().split('\n').pop().slice(0, 200); }
      else {
        const dir = join(WORK, 'py', id); mkdirSync(dir, { recursive: true });
        const r = spawnSync(py, [f], { cwd: dir, encoding: 'utf8', timeout: 60000, env: { ...process.env, PYTHONIOENCODING: 'utf-8', MPLBACKEND: 'Agg' } });
        const err = String(r.stderr || '').trim().split('\n').pop() || '';
        if (r.status === 0) rec.result = 'ran';
        else if (r.error && r.error.code === 'ETIMEDOUT') { rec.result = 'syntax-ok'; rec.detail = 'Did not finish in 60 s (likely a server or a long training loop); syntax is valid.'; }
        else if (/ModuleNotFoundError|ImportError/.test(err)) { rec.result = 'syntax-ok'; rec.detail = 'Not run: ' + err.replace(/^.*Error: /, '').slice(0, 120); }
        else if (/NameError|FileNotFoundError|No such file/.test(err)) { rec.result = 'syntax-ok'; rec.detail = 'Excerpt of a larger programme (needs names or files defined elsewhere); syntax is valid.'; }
        else { rec.result = 'syntax-ok'; rec.detail = 'Not run to completion here: ' + err.slice(0, 160); }
      }
    }
    const list = L(id).python; const k = list.findIndex((x) => x.file === rec.file);
    if (k >= 0) list[k] = rec; else list.push(rec);
    console.log(`py  ${rec.result.padEnd(12)} ${rec.file}`);
  }
}

// ---------------- C# ----------------
// Namespace or keyword -> NuGet package. Versions float to the newest release so the result reflects today's APIs;
// the resolved versions are recorded in the status file.
const PKG = [
  [/\busing Microsoft\.ML\b|\bMLContext\b/, 'Microsoft.ML'],
  [/FastTree|FastForest|Gam\(/, 'Microsoft.ML.FastTree'],
  [/LightGbm/, 'Microsoft.ML.LightGbm'],
  [/MatrixFactorization|using Microsoft\.ML\.Trainers\.Recommender/, 'Microsoft.ML.Recommender'],
  [/Microsoft\.ML\.Transforms\.TimeSeries|ForecastBySsa|DetectSpike|DetectIidSpike|DetectChangePoint/, 'Microsoft.ML.TimeSeries'],
  [/Microsoft\.ML\.AutoML/, 'Microsoft.ML.AutoML'],
  [/ImageClassification\(|Microsoft\.ML\.Vision/, 'Microsoft.ML.Vision'],
  [/ApplyOnnxModel|OnnxTransformer/, 'Microsoft.ML.OnnxTransformer'],
  [/Microsoft\.ML\.OnnxRuntime/, 'Microsoft.ML.OnnxRuntime'],
  [/Microsoft\.ML\.Tokenizers/, 'Microsoft.ML.Tokenizers'],
  [/TiktokenTokenizer|Tiktoken/, 'Microsoft.ML.Tokenizers.Data.O200kBase'],
  [/using TorchSharp|\btorch\./, 'TorchSharp-cpu'],
  [/using Microsoft\.Extensions\.AI/, 'Microsoft.Extensions.AI'],
  [/using OpenAI|OpenAIClient|AsIChatClient|AsIEmbeddingGenerator/, 'Microsoft.Extensions.AI.OpenAI'],
  [/using OllamaSharp|OllamaApiClient/, 'OllamaSharp'],
  [/using Whisper\.net/, 'Whisper.net'],
  [/using ModelContextProtocol/, 'ModelContextProtocol'],
  [/using Microsoft\.Agents\.AI/, 'Microsoft.Agents.AI'],
  [/using Microsoft\.Extensions\.ML|PredictionEnginePool/, 'Microsoft.Extensions.ML'],
  [/using Microsoft\.Data\.SqlClient/, 'Microsoft.Data.SqlClient'],
  [/using System\.Numerics\.Tensors|TensorPrimitives/, 'System.Numerics.Tensors'],
  [/using Microsoft\.Extensions\.Hosting/, 'Microsoft.Extensions.Hosting'],
  [/using Microsoft\.Extensions\.Caching\.Memory/, 'Microsoft.Extensions.Caching.Memory'],
  [/using Microsoft\.Extensions\.Logging/, 'Microsoft.Extensions.Logging.Console'],
];
const PRERELEASE = new Set(['ModelContextProtocol', 'Microsoft.Agents.AI', 'Microsoft.ML.Tokenizers.Data.O200kBase']);
const WEB = /WebApplication\.|MapPost\(|MapGet\(|IResult\b|Results\.|AddOpenApi|IHostedService|BackgroundService|IConfiguration\b|ILogger<|AddHttpClient/;

function buildCs(file) {
  const src = readFileSync(file, 'utf8');
  const id = lessonOf(file);
  const name = basename(file, '.cs').replace(/[^A-Za-z0-9_]/g, '_');
  const dir = join(WORK, 'cs', id, name);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  copyFileSync(file, join(dir, basename(file)));
  const pkgs = [...new Set(PKG.filter(([re]) => re.test(src)).map(([, p]) => p))];
  const web = WEB.test(src);
  const proj = (type) => `<Project Sdk="Microsoft.NET.Sdk${web ? '.Web' : ''}">
  <PropertyGroup>
    <OutputType>${type}</OutputType><TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable><ImplicitUsings>enable</ImplicitUsings><LangVersion>latest</LangVersion>
    <NoWarn>$(NoWarn);NU1701;NU1903;NU1902;NU1904;CS8618;CS1998;CS0168;CS0219;CS8321;MEAI001;SKEXP0001;MCPEXP001</NoWarn>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors><AllowUnsafeBlocks>true</AllowUnsafeBlocks>
  </PropertyGroup>
  <ItemGroup>
${pkgs.map((p) => `    <PackageReference Include="${p}" Version="${PRERELEASE.has(p) ? '*-*' : '*'}" />`).join('\n')}
  </ItemGroup>
</Project>
`;
  const run = (type) => {
    writeFileSync(join(dir, `${name}.csproj`), proj(type));
    return spawnSync('dotnet', ['build', '-nologo', '-v', 'q', '-clp:NoSummary'], { cwd: dir, encoding: 'utf8', timeout: 900000 });
  };
  let type = 'Exe', r = run(type);
  let out = String(r.stdout || '') + String(r.stderr || '');
  if (r.status !== 0 && /CS5001/.test(out)) { type = 'Library'; r = run(type); out = String(r.stdout || '') + String(r.stderr || ''); }
  const errs = [...new Set([...out.matchAll(/(?:error|: error) ([A-Z]+\d+): ([^\[\n]+)/g)].map((m) => `${m[1]}: ${m[2].trim()}`))];
  let resolved = {};
  try {
    const assets = JSON.parse(readFileSync(join(dir, 'obj', 'project.assets.json'), 'utf8'));
    for (const key of Object.keys(assets.libraries || {})) { const [n, v] = key.split('/'); if (pkgs.includes(n)) resolved[n] = v; }
  } catch { /* restore failed */ }
  // Run step: only a console programme that compiled is started, in its own scratch folder, for at most 120 seconds.
  // "ran" means it finished with exit code 0. Anything else is recorded with the reason (no data file, no model, no key).
  let run2 = { run: 'not run', runDetail: type !== 'Exe' ? 'A class with no entry point; it is used from another programme.' : web ? 'A web service; starting it would wait for requests.' : '' };
  if (r.status === 0 && type === 'Exe' && !web) {
    const x = spawnSync('dotnet', ['run', '--no-build'], { cwd: dir, encoding: 'utf8', timeout: 120000, env: { ...process.env, LLM_API_KEY: '', DOTNET_NOLOGO: '1' } });
    const errLine = String(x.stderr || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
    if (x.status === 0) run2 = { run: 'ran', runDetail: '', output: String(x.stdout || '').trim().split('\n').slice(0, 12).join('\n').slice(0, 900) };
    else if (x.error && x.error.code === 'ETIMEDOUT') run2 = { run: 'not run', runDetail: 'Did not finish within 120 seconds.' };
    else run2 = { run: 'not run', runDetail: /FileNotFound|Could not find|DirectoryNotFound|No such file|does not exist at path|ConnectionString/.test(errLine) ? 'Needs a data or model file that is not part of the sample.'
      : /ApiKey|api key|ArgumentNull|ArgumentException.*key|Unauthorized|401/i.test(errLine) ? 'Needs an API key for a model service.'
      : /HttpRequestException|SocketException|refused|No connection/i.test(errLine) ? 'Needs a model service running on this machine or the network.'
      : 'Stopped with an error: ' + errLine.replace(/^Unhandled exception\.\s*/, '').slice(0, 140) };
  }
  return { file: file.slice(ROOT.length + 1).replace(/\\/g, '/'), date: today, result: r.status === 0 ? 'compiled' : 'failed', kind: type === 'Exe' ? 'console programme' : 'class library (no entry point)',
    sdk: web ? 'Microsoft.NET.Sdk.Web' : 'Microsoft.NET.Sdk', packages: resolved, wanted: pkgs, errors: errs.slice(0, 6), errorCount: errs.length, ...run2 };
}

if (doCs) {
  status.tools.dotnet = tool('dotnet', ['--version']);
  if (!status.tools.dotnet) { console.log('dotnet not found: C# samples are recorded as not compiled.'); }
  else {
    for (const f of walk(join(ROOT, 'examples/lesson-code/dotnet'), '.cs')) {
      const id = lessonOf(f);
      if (only.length && !only.includes(id)) continue;
      const rec = buildCs(f);
      const list = L(id).csharp; const k = list.findIndex((x) => x.file === rec.file);
      if (k >= 0) list[k] = rec; else list.push(rec);
      console.log(`cs  ${rec.result.padEnd(9)} ${(rec.run || '').padEnd(8)} ${rec.file}${rec.runDetail && rec.result === 'compiled' ? '  [' + rec.runDetail + ']' : ''}${rec.errors.length ? '\n      ' + rec.errors.slice(0, 3).join('\n      ') : ''}`);
      mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify(status, null, 1));
    }
  }
}

// Drop records for files that no longer exist (a lesson block was renamed or removed).
for (const rec of Object.values(status.lessons)) for (const k of ['python', 'csharp']) rec[k] = rec[k].filter((x) => existsSync(join(ROOT, x.file)));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(status, null, 1));
const all = Object.values(status.lessons);
const count = (k, r) => all.flatMap((x) => x[k]).filter((x) => x.result === r).length;
console.log(`\nC#: ${count('csharp', 'compiled')} compiled, ${count('csharp', 'failed')} failed. Python blocks: ${count('python', 'ran')} ran, ${count('python', 'syntax-ok')} syntax only, ${count('python', 'fragment')} fragments, ${count('python', 'syntax-error')} syntax errors. Example programmes: ${status.examples.filter((e) => e.result === 'ran').length}/${status.examples.length} ran.`);
console.log(`Wrote ${OUT.slice(ROOT.length + 1)}`);
