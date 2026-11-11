// Runs the offline Python examples and compiles all others. Requires Python 3.10+ with
// numpy, pandas and scikit-learn. Examples needing torch, langgraph, fastapi or an API key are compiled only.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const EX = fileURLToPath(new URL('../examples/', import.meta.url));
const py = process.platform === 'win32' ? 'python' : 'python3';
const runs = [['spam-classifier', ['spam_classifier.py']], ['attention', ['attention_toy.py']], ['tiny-lm', ['tiny_char_lm_numpy.py']],
  ['memory-estimate', ['memory_estimate.py']], ['rag-leave-policy', ['rag_leave_policy.py']], ['agent-returns', ['returns_workflow.py']],
  ['llm-summarizer/python', ['summarize.py', '--offline']], ['llm-summarizer/python', ['-m', 'unittest', 'test_summary_schema.py']],
  ['ml-basics', ['ml_basics.py']], ['applied-ai-basics', ['applied_basics.py']],
  ['quickpath', ['quickpath.py']], ['math', ['math_for_ai.py']], ['ai-extras', ['ai_extras.py']], ['gap-topics', ['gap_topics.py']]];
let failed = 0;
for (const [dir, args] of runs) {
  try { execFileSync(py, args, { cwd: join(EX, dir), stdio: 'pipe' }); console.log(`ran      ${dir}/${args.join(' ')}`); }
  catch (e) { failed++; console.log(`FAILED   ${dir}/${args.join(' ')}\n${e.stderr}`); }
}
const all = (function walk(d) { return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.py') ? [p] : []; }); })(EX);
for (const f of all) { try { execFileSync(py, ['-m', 'py_compile', f], { stdio: 'pipe' }); } catch (e) { failed++; console.log(`SYNTAX   ${f}\n${e.stderr}`); } }
console.log(`${runs.length} runs, ${all.length} files compiled, ${failed} failures.`);
process.exit(failed ? 1 : 0);
