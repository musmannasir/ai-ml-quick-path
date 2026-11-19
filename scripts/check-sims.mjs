// Checks that every simulation's calculation (the JavaScript the page runs) gives the same headline numbers as the
// Python reference program printed next to it in examples/sim-*/.  Run:  node scripts/check-sims.mjs
// The page code keeps its calculation in AIQPSim.logic.<module>, so Node can run it without a browser.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (file) => {
  const w = globalThis.window || (globalThis.window = { AIQPSim: { logic: {}, register() {} } });
  w.AIQPSim = w.AIQPSim || { logic: {}, register() {} };
  new Function('window', 'document', readFileSync(join(ROOT, 'public/assets/sims', file), 'utf8'))(w, undefined);
  return w.AIQPSim;
};
const python = (rel) => execFileSync(process.env.PYTHON || 'python', [join(ROOT, rel)], { encoding: 'utf8' }).replace(/\r/g, '').trim().split('\n');
const f = (v, d) => v.toFixed(d);
const pad = (v, n) => String(v).padStart(n, ' ');

const checks = [];

// ---- neural network playground ----
checks.push(['nn', 'examples/sim-nn/nn_playground.py', () => {
  const P = load('nn.js').logic.nn, D = P.DEFAULTS, out = [];
  const tr = P.makeData('xor', D.trainN, D.dataSeed), te = P.makeData('xor', D.testN, D.testSeed);
  const run = (hidden, epochs, report) => {
    const net = P.makeNet(hidden, 'tanh', D.netSeed);
    for (let e = 0; e <= epochs; e++) { if (report && report.includes(e)) { const a = P.evaluate(net, tr), b = P.evaluate(net, te); out.push(`epoch ${pad(e, 3)}  train_loss ${f(a.loss, 4)}  train_acc ${f(a.acc, 4)}  test_loss ${f(b.loss, 4)}  test_acc ${f(b.acc, 4)}`); } P.trainEpoch(net, tr, 0.5); }
    return net;
  };
  run([4], 400, [0, 50, 100, 200, 400]);
  const n1 = P.makeNet([1], 'tanh', D.netSeed); for (let e = 0; e <= 400; e++) P.trainEpoch(n1, tr, 0.5);
  const a = P.evaluate(n1, tr), b = P.evaluate(n1, te);
  out.push(`one hidden unit, epoch 401  train_loss ${f(a.loss, 4)}  train_acc ${f(a.acc, 4)}  test_loss ${f(b.loss, 4)}  test_acc ${f(b.acc, 4)}`);
  return out;
}]);

// ---- tokens: byte-pair encoding ----
checks.push(['bpe', 'examples/sim-tokens/bpe_tokens.py', () => {
  const P = load('bpe.js').logic.bpe, m = P.learn(P.CORPUS, 60), out = [];
  out.push(`merges learned: ${m.merges.length}  base symbols: ${m.base.length}`);
  out.push('first 12 merges: ' + m.merges.slice(0, 12).map((x) => `${x.a}+${x.b}(${x.count})`).join(', '));
  const text = 'the lowest newer widest cat';
  for (const k of [0, 12, m.merges.length]) {
    const toks = text.split(' ').flatMap((w) => P.segment(w, m.merges, k));
    out.push(`merges ${pad(k, 2)}: ${pad(toks.length, 2)} tokens for ${text.replace(/ /g, '').length} characters: ${toks.join(' ')}`);
  }
  return out;
}]);

// ---- tokens: generation loop ----
checks.push(['gen', 'examples/sim-tokens/gen_tokens.py', () => {
  const P = load('gen.js').logic.gen, m = P.train(P.CORPUS), out = [];
  for (const t of [1, 0.5, 0.2, 1.8]) { const d = P.distribution(m, ['the', 'cat'], t, 0, 1); out.push(`temperature ${f(t, 1)} after 'the cat': ${d.list.slice(0, 4).map((e) => `${e.t}:${f(e.p, 3)}`).join(' ')}`); }
  out.push('greedy: ' + P.generate(m, 'the cat', 10, 1, 0, 1, 'greedy', 7).join(' '));
  out.push('sample, seed 7: ' + P.generate(m, 'the cat', 10, 1, 0, 1, 'sample', 7).join(' '));
  out.push('top-k 3, top-p 0.8, seed 7: ' + P.generate(m, 'the cat', 10, 1, 3, 0.8, 'sample', 7).join(' '));
  return out;
}]);

// ---- attention ----
checks.push(['attn', 'examples/sim-attention/attention_forward.py', () => {
  const Q = load('attn-model.js'); const A = load('attn.js').logic.attn, model = Q.models.attn, out = [];
  const words = 'the cats near the box sleep .'.split(' '), q = 4, r = A.run(model, words, true, true);
  r.heads.forEach((h, i) => out.push(`head ${i + 1}, row for word ${q + 1} (${words[q]}): ${words.map((w, j) => `${w}:${f(h.A[q][j], 2)}`).join(' ')}`));
  const top = r.P[q].map((p, i) => i).sort((a, b) => r.P[q][b] - r.P[q][a] || a - b).slice(0, 4);
  out.push(`next word after '${words[q]}': ${top.map((i) => `${model.vocab[i]}:${f(r.P[q][i], 2)}`).join(' ')}`);
  out.push(`probability on verbs that agree with the plural subject: ${f(['sleep', 'run', 'sit'].reduce((s, v) => s + r.P[q][model.vocab.indexOf(v)], 0), 3)}`);
  const u = A.run(model, words, false, false);
  out.push(`no mask, no scaling, head 1, row for word ${q + 1}: ${words.map((w, j) => `${w}:${f(u.heads[0].A[q][j], 2)}`).join(' ')}`);
  return out;
}]);

// ---- supervised algorithms ----
checks.push(['sup', 'examples/sim-supervised/algorithms.py', () => {
  const P = load('sup.js').logic.sup, D = P.DEFAULTS, out = [];
  for (const kind of ['blobs', 'moons', 'circles']) {
    const tr = P.makeData(kind, D.trainN, D.trainSeed), te = P.makeData(kind, D.testN, D.testSeed);
    const fits = [['k-nearest (k=5)', P.fitKnn(tr, 5)], ['logistic (300 steps)', P.fitLogistic(tr, 300)], ['tree (depth 3)', P.fitTree(tr, 3)], ['naive Bayes', P.fitNB(tr)]];
    out.push(kind + ': ' + fits.map(([n, fn]) => `${n} train ${f(P.evaluate(fn, tr).acc, 2)} test ${f(P.evaluate(fn, te).acc, 2)}`).join('; '));
  }
  const tr = P.makeData('blobs', D.trainN, D.trainSeed), te = P.makeData('blobs', D.testN, D.testSeed), k1 = P.fitKnn(tr, 1);
  out.push(`blobs, k=1: train ${f(P.evaluate(k1, tr).acc, 2)} test ${f(P.evaluate(k1, te).acc, 2)}`);
  return out;
}]);

let bad = 0;
for (const [name, ref, js] of checks) {
  let a, b;
  try { a = js(); b = python(ref); } catch (e) { console.log(`FAIL  ${name}: ${e.message.split('\n')[0]}`); bad++; continue; }
  const diffs = []; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diffs.push(`  page   : ${a[i]}\n  python : ${b[i]}`);
  if (diffs.length) { bad++; console.log(`FAIL  ${name} (${ref}): ${diffs.length} line(s) differ\n${diffs.join('\n')}`); }
  else console.log(`ok    ${name}: ${a.length} lines agree with ${ref}`);
}
console.log(bad ? `${bad} simulation(s) disagree with their Python program` : `${checks.length} simulations agree with their Python programs`);
process.exit(bad ? 1 : 0);
