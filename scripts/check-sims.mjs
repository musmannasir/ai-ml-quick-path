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
  const Q = load('attn-model.js'); const A = load('attn.js').logic.attn, G5 = load('tf5.js').logic.tf5, G6 = load('tf6.js').logic.tf6, model = Q.models.attn, out = [];
  const words = 'the cats near the box sleep .'.split(' '), q = 4, r = A.run(model, words, true, true);
  r.heads.forEach((h, i) => out.push(`head ${i + 1}, row for word ${q + 1} (${words[q]}): ${words.map((w, j) => `${w}:${f(h.A[q][j], 2)}`).join(' ')}`));
  const top = r.P[q].map((p, i) => i).sort((a, b) => r.P[q][b] - r.P[q][a] || a - b).slice(0, 4);
  out.push(`next word after '${words[q]}': ${top.map((i) => `${model.vocab[i]}:${f(r.P[q][i], 2)}`).join(' ')}`);
  out.push(`probability on verbs that agree with the plural subject: ${f(['sleep', 'run', 'sit'].reduce((s, v) => s + r.P[q][model.vocab.indexOf(v)], 0), 3)}`);
  const u = A.run(model, words, false, false);
  out.push(`no mask, no scaling, head 1, row for word ${q + 1}: ${words.map((w, j) => `${w}:${f(u.heads[0].A[q][j], 2)}`).join(' ')}`);
  const b = r.blk[q], f4 = (v) => v.slice(0, 4).map((x) => f(x, 2)).join(' ');
  out.push(`block at word ${q + 1}: after add+norm ${f4(b.n1)} | feed-forward adds ${f4(b.g)} | final ${f4(b.n2)}`);
  const agreeP = (o) => ['sleep', 'run', 'sit'].reduce((s, v) => s + o.p[model.vocab.indexOf(v)], 0);
  const C = r.heads.flatMap((h) => h.O[q]), back = A.vecMat(C, model.Wo);
  for (const [label, o] of [['no attention', { noAttn: true }], ['no feed-forward', { noFfn: true }], ['no add path', { noRes: true }]]) out.push(`${label}: probability on agreeing verbs ${f(agreeP(A.block(model, r.X[q], back, o)), 3)}`);
  const wr = (prompt, t, k, mode, seed) => G5.generate(model, prompt.split(' '), t, k, mode, seed).words.join(' ');
  out.push("greedy from 'the cats': " + wr('the cats', 1, 0, 'greedy', 7));
  out.push("sampled from 'the', seed 7: " + wr('the', 1, 0, 'sample', 7));
  out.push("sampled from 'the', seed 7, top-k 3, temperature 0.5: " + wr('the', 0.5, 3, 'sample', 7));
  const L = G6.losses(model, words);
  out.push('loss per position: ' + L.map((o) => f(o.loss, 2)).join(' ') + `  average ${f(L.reduce((s, o) => s + o.loss, 0) / L.length, 3)}  random guessing ${f(Math.log(model.vocab.length), 2)}`);
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
  for (const kind of ['blobs', 'moons', 'circles']) { const a = P.makeData(kind, D.trainN, D.trainSeed), b = P.makeData(kind, D.testN, D.testSeed), t = P.fitTree(a, 3, 'entropy'); out.push(`${kind}, tree (depth 3, entropy): train ${f(P.evaluate(t, a).acc, 2)} test ${f(P.evaluate(t, b).acc, 2)}`); }
  const tr = P.makeData('blobs', D.trainN, D.trainSeed), te = P.makeData('blobs', D.testN, D.testSeed), k1 = P.fitKnn(tr, 1);
  out.push(`blobs, k=1: train ${f(P.evaluate(k1, tr).acc, 2)} test ${f(P.evaluate(k1, te).acc, 2)}`);
  return out;
}]);

// ---- gradient descent and the optimiser race ----
checks.push(['gd+train', 'examples/sim-training/dynamics.py', () => {
  const G = load('gd.js').logic.gd, T = load('train.js').logic.train, out = [];
  const big = (v) => (Math.abs(v) < 1e6 ? v.toFixed(4) : v.toExponential(2));
  for (const lr of [0.1, 0.9, 1.0, 1.1]) out.push(`bowl, learning rate ${f(lr, 1)}, start 0: ${G.descend('bowl', 0, lr, 5).map((v) => f(v, 3)).join(' ')}`);
  for (const s of [2, -2]) out.push(`valleys, start ${f(s, 1)}, rate 0.05, 200 steps: ends at ${f(G.descend('valleys', s, 0.05, 200)[200], 3)}`);
  for (const lr of [0.02, 0.05, 0.1]) out.push(`race, rate ${f(lr, 2)}, no noise, 60 steps: plain ${big(T.race('plain', lr, 0, 60))}, momentum ${big(T.race('momentum', lr, 0, 60))}, Adam ${big(T.race('adam', lr, 0, 60))}`);
  out.push(`race, rate 0.05, noise 1, 60 steps: plain ${big(T.race('plain', 0.05, 1, 60))}, momentum ${big(T.race('momentum', 0.05, 1, 60))}, Adam ${big(T.race('adam', 0.05, 1, 60))}`);
  return out;
}]);

// ---- backpropagation ----
checks.push(['bp', 'examples/sim-backprop/graph.py', () => {
  const B = load('bp.js').logic.bp, out = [];
  let [x, w, b, y] = [2, 0.3, 0.1, 1];
  const fw = B.forward(x, w, b, y);
  out.push(`forward: m ${f(fw.m, 4)}  z ${f(fw.z, 4)}  a ${f(fw.a, 4)}  loss ${f(fw.loss, 4)}`);
  const g = B.backward(x, w, b, y);
  out.push(`backward: dloss/da ${f(g.a, 4)}  dloss/dz ${f(g.z, 4)}  dloss/dw ${f(g.w, 4)}  dloss/db ${f(g.b, 4)}  dloss/dx ${f(g.x, 4)}`);
  out.push(`nudge check: w ${f(B.nudge(x, w, b, y, 'w'), 4)}  b ${f(B.nudge(x, w, b, y, 'b'), 4)}`);
  for (let i = 1; i <= 5; i++) { const h = B.backward(x, w, b, y); w -= 0.1 * h.w; b -= 0.1 * h.b; out.push(`update ${i} (rate 0.1): w ${f(w, 4)}  b ${f(b, 4)}  loss ${f(B.forward(x, w, b, y).loss, 4)}`); }
  return out;
}]);

// ---- Phase 2: regression, classification, bias and variance, cross-validation, clustering, PCA, anomalies ----
checks.push(['core', 'examples/sim-core/core.py', () => {
  load('sup.js'); const C = load('core.js').logic.core, S = globalThis.window.AIQPSim.logic.sup, out = [];
  const r3 = (v) => f(v, 3), join = (a, d) => a.map((v) => f(v, d)).join(' ');
  let d = C.regData(5, 12, 0.3, false), o = C.ols(d.X, d.Y, 0);
  out.push(`regression: slope ${r3(o.a)} intercept ${r3(o.b)} MSE ${f(C.mse(d.X, d.Y, o.a, o.b), 4)} R2 ${r3(C.r2(d.X, d.Y, o.a, o.b))}`);
  const d2 = C.regData(5, 12, 0.3, true), o2 = C.ols(d2.X, d2.Y, 0);
  out.push(`with one outlier: slope ${r3(o2.a)} intercept ${r3(o2.b)} R2 ${r3(C.r2(d2.X, d2.Y, o2.a, o2.b))}`);
  out.push('ridge slopes (penalty 0, 1, 5): ' + [0, 1, 5].map((l) => r3(C.ols(d.X, d.Y, l).a)).join(' '));
  const cd = C.clsData(11, 100), pr = S.fitLogistic(cd, 300), p = cd.X.map((q) => pr(q));
  for (const t of [0.2, 0.5, 0.8]) { const c = C.confusion(p, cd.y, t); out.push(`classification, threshold ${f(t, 1)}: tp ${c.tp} fp ${c.fp} fn ${c.fn} tn ${c.tn} precision ${r3(c.tp / Math.max(1, c.tp + c.fp))} recall ${r3(c.tp / Math.max(1, c.tp + c.fn))}`); }
  out.push(`area under the ROC curve: ${r3(C.roc(p, cd.y).auc)}`);
  for (const [n, noise] of [[15, 0.25], [50, 0.25]]) {
    const tr = C.polyData(3, n, noise), te = C.polyData(4, 200, noise);
    out.push(`polynomials, ${n} points, noise ${f(noise, 2)}: ` + [1, 3, 7, 9].map((g) => { const w = C.polyFit(tr.X, tr.Y, g); return `deg ${g} train ${r3(C.polyMse(w, tr.X, tr.Y))} test ${r3(C.polyMse(w, te.X, te.Y))}`; }).join('; '));
  }
  const cv = S.makeData('blobs', 40, 21);
  for (const kk of [1, 3]) out.push(`cross-validation, 5 folds, k-nearest k=${kk}: ${join(C.cvScores(cv.X, cv.y, 5, 7, kk), 2)}`);
  const B = C.blobs3(60, 5), last = (h) => h[h.length - 1].inertia;
  out.push('k-means on three blobs, k=3, seeds 1-6: inertia ' + [1, 2, 3, 4, 5, 6].map((s) => r3(last(C.kmeans(B, 3, s)))).join(' '));
  out.push('elbow, seed 1, k=1..8: ' + [1, 2, 3, 4, 5, 6, 7, 8].map((k) => f(last(C.kmeans(B, k, 1)), 2)).join(' '));
  const mo = S.makeData('moons', 200, 3), lab = C.dbscan(mo.X, 0.2, 4);
  out.push(`DBSCAN on moons, eps 0.2, min points 4: clusters ${Math.max(-1, ...lab.filter((l) => l !== null)) + 1}, noise ${lab.filter((l) => l === null).length}`);
  out.push(`k-means on moons, k=2: inertia ${r3(last(C.kmeans(mo.X, 2, 1)))}`);
  const P = C.pcaData(8, 40), st = C.pcaStats(P), best = C.bestAngle(st), tot = st[0] + st[1];
  out.push(`PCA: best axis ${f(best, 1)} degrees; variance kept at 0 ${r3(C.varAlong(st, 0) / tot)}, 90 ${r3(C.varAlong(st, 90) / tot)}, best ${r3(C.varAlong(st, best) / tot)}`);
  const A = C.anomalyData(6, 80), sc = C.knnScores(A, 5);
  for (const c of [0.02, 0.05, 0.1]) { const fl = Object.keys(C.flag(sc, c)).map(Number), caught = fl.filter((i) => i >= 80).length; out.push(`anomalies, flag ${Math.round(c * 100)}%: flagged ${fl.length}, real anomalies caught ${caught} of 4, false alarms ${fl.length - caught}`); }
  return out;
}]);

// ---- Phase 3: model builder, learning to write, embeddings, LoRA, vector search, RAG ----
checks.push(['llm', 'examples/sim-llm/llm.py', () => {
  load('gen.js'); const L = load('llm.js').logic.llm, out = [];
  const r3 = (v) => f(v, 3), gb = (n, b) => f(L.weightBytes(n, b) / 1e9, 2);
  for (const [name, [l, d, v]] of [['toy', [1, 8, 21]], ['GPT-2 small shape', [12, 768, 50257]], ['7B-class shape', [32, 4096, 32000]], ['70B-class shape', [80, 8192, 32000]]]) {
    const n = L.params(l, d, v); out.push(`${name}: ${n} parameters, weights ${gb(n, 16)} GB at 16 bits, ${gb(n, 4)} GB at 4 bits, cache ${f(L.kvBytesPerToken(l, d, 16) / 1e3, 0)} KB per token`);
  }
  out.push(`training work for the 7B-class shape on 140 billion words of text: ${L.trainFlops(L.params(32, 4096, 32000), 140e9).toExponential(2)} operations`);
  out.push('held-out loss by training words: ' + [10, 30, 60, 100, L.trainLen()].map((n) => `${n}:${r3(L.holdoutLoss(n))}`).join(' '));
  const P = L.embInit(), o = [`step 0 loss ${r3(L.embStep(P.map((p) => p.slice()), 0.5, 0))} neighbours ${f(L.embAccuracy(P), 2)}`];
  for (let s = 1; s <= 100; s++) { const loss = L.embStep(P, 0.5, 0.3); if ([5, 20, 100].includes(s)) o.push(`step ${s} loss ${r3(loss)} neighbours ${f(L.embAccuracy(P), 2)}`); }
  out.push('embedding training, temperature 0.5: ' + o.join('; '));
  const M = L.loraTarget();
  out.push('rank-r error of a made-up update (relative): ' + [1, 2, 3, 4].map((r) => `r=${r}:${r3(L.lowRank(M, r).err)}`).join(' '));
  out.push(`one 4096 by 4096 layer: ${4096 * 4096} weights to change, LoRA rank 8 trains ${2 * 4096 * 8} (${f(100 * 2 * 4096 * 8 / (4096 * 4096), 2)}%)`);
  out.push('cache per token, 7B-class shape at 16 bits, query heads per key-value head 1/4/8: ' + [1, 4, 8].map((g) => `${f(L.kvBytesGrouped(32, 4096, 16, g) / 1e3, 1)} KB`).join(' '));
  for (const [name, p, b, layers, vram] of [['8B 16-bit 24 GB', 8, 16, 32, 24], ['8B 4-bit 16 GB', 8, 4, 32, 16], ['8B 16-bit 16 GB', 8, 16, 32, 16], ['70B 4-bit 48 GB', 70, 4, 80, 48], ['70B 16-bit 48 GB', 70, 16, 80, 48]]) {
    const r = L.fitCheck(p, b, layers, 8192, vram); out.push(`hardware fit check, ${name}, 8192 tokens: weights ${f(r.weights, 2)} cache ${f(r.cache, 2)} total ${f(r.total, 2)} ${r.fits ? 'fits' : 'does not fit'}`);
  }
  out.push('hardware speed limit at 400 GB/s, 8B: ' + [16, 8, 4].map((b) => `${b}-bit ${f(L.speedLimit(8 * b / 8, 400), 1)}`).join(' ') + `; 70B 4-bit at 1000 GB/s: ${f(L.speedLimit(35, 1000), 1)}`);
  for (const [d, r] of [[4096, 8], [4096, 64], [768, 8]]) { const v = L.loraVariants(d, r); out.push(`LoRA variants, ${d} by ${d} layer, rank ${r}: LoRA ${v.lora}, LoRA-FA ${v.fa}, VeRA ${v.vera}, LoRA+ ${v.plus}, Delta-LoRA ${v.delta}`); }
  const W = L.quantWeights();
  out.push('quantisation error (RMSE) by bits: ' + [8, 6, 4, 3, 2].map((b) => `${b}:${f(L.quantRmse(W, b), 5)}`).join(' '));
  const pts = L.vsPoints();
  for (const q of [[0.5, 0.45], [0, 0.9]]) out.push(`search near (${f(q[0], 2)}, ${f(q[1], 2)}), 5 nearest: cosine ${L.vsSearch(pts, q, 5, 'cos').map((e) => e.w).join(' ')} | distance ${L.vsSearch(pts, q, 5, 'euclid').map((e) => e.w).join(' ')}`);
  out.push('chunks of 10, 30, 60 words (no overlap): ' + [10, 30, 60].map((s) => L.chunk(s, 0).length).join(' '));
  for (const s of [10, 20, 30, 60, 80]) out.push(`size ${s}, no overlap, top 1: answer found for questions ${[0, 1, 2, 3].map((q) => (L.ragHit(s, 0, 1, q) ? 'yes ' : 'no  ')).join('').trim()}`);
  out.push('size 20, overlap 10, top 2: ' + [0, 1, 2, 3].map((q) => (L.ragHit(20, 10, 2, q) ? 'yes' : 'no')).join(' '));
  return out;
}]);

// ---- Phase 4: convolution, running state, word weights, autoencoder and diffusion, graph, spectrogram, reinforcement learning ----
checks.push(['dl', 'examples/sim-dl/dl.py', () => {
  const D = load('dl.js').logic.dl, out = [], r3 = (v) => f(v, 3), max2 = (m) => Math.max(...m.map((r) => Math.max(...r))), min2 = (m) => Math.min(...m.map((r) => Math.min(...r)));
  const V = D.KERNELS['vertical edge'], m = D.conv2d(D.IMAGES.bar, V, 1, 0);
  out.push(`bar with vertical edge filter, row 3 of the map: ${m[3].join(' ')}; map size ${m.length}`);
  out.push(`output sizes for an 8 by 8 image, 3 by 3 filter: stride 1 pad 0 -> ${m.length}, stride 2 pad 0 -> ${D.conv2d(D.IMAGES.bar, V, 2, 0).length}, stride 1 pad 1 -> ${D.conv2d(D.IMAGES.bar, V, 1, 1).length}, after 2 by 2 max pool of the first -> ${D.maxpool2(m).length}`);
  for (const [img, ker] of [['square', 'horizontal edge'], ['square', 'vertical edge'], ['diagonal', 'blur']]) { const mm = D.conv2d(D.IMAGES[img], D.KERNELS[ker], 1, 0); out.push(`${img} with ${ker}: strongest response ${f(max2(mm), 2)}, weakest ${f(min2(mm) + 0, 2)}`); }
  for (const a of [0.9, 0.3]) out.push(`running state, memory ${f(a, 1)}, sentence 1: ${D.runState(D.SENTENCES[0], a, 1).map((v) => r3(v)).join(' ')}`);
  out.push(`running state, memory 0.9, sentence 2: ${D.runState(D.SENTENCES[1], 0.9, 1).map((v) => r3(v)).join(' ')}`);
  for (const idf of [false, true]) { const v = D.tfVectors(idf)[0], top = Object.keys(v).sort((a, b) => v[b] - v[a] || (a < b ? -1 : 1)).slice(0, 3); out.push(`document 1 top words, ${idf ? 'with idf' : 'counts only'}: ${top.map((w) => `${w}:${r3(v[w])}`).join(' ')}`); }
  const T = D.tfVectors(true); out.push('similarity of document 1 to all four (with idf): ' + T.map((d) => r3(D.cosine(T[0], d))).join(' '));
  const X = D.aeData(), comps = D.components(X, 4);
  out.push('autoencoder with 1 to 4 numbers in the middle, share of the data lost: ' + [1, 2, 3, 4].map((k) => `${k}:${r3(D.aeError(X, comps.slice(0, k)))}`).join(' '));
  const eps = D.noise(5);
  out.push('diffusion, signal kept (alpha bar) and distance from the clean signal: ' + [0, 5, 10, 20].map((t) => `t=${t} ${r3(D.alphaBar(t))} ${r3(D.rms(D.noisy(t, eps), D.SIGNAL))}`).join(' '));
  const g2 = D.noise(6), ab = D.alphaBar(10), xt = D.noisy(10, eps);
  out.push('diffusion at t=10, rebuilt signal error by error in the noise guess: ' + [0, 0.1, 0.3, 0.5].map((e) => `${f(e, 1)}:${r3(D.rms(xt.map((x, q) => (x - Math.sqrt(1 - ab) * (eps[q] + e * g2[q])) / Math.sqrt(ab)), D.SIGNAL))}`).join(' '));
  let h = [1, 0, 0, 0, 0, 0]; const rows = {};
  for (let k = 1; k <= 10; k++) { h = D.messageRound(h, 0.4); rows[k] = h; }
  for (const k of [1, 2, 3, 5, 10]) out.push(`graph, round ${k}: ${rows[k].map((v) => r3(v)).join(' ')} spread ${r3(Math.max(...rows[k]) - Math.min(...rows[k]))}`);
  const sig = D.signal();
  for (const N of [32, 128]) { const sp = D.spectrogram(sig, N); out.push(`spectrogram, window ${N}: ${sp.length} frames, ${sp[0].length} bins, peak frequency first frame ${f(D.peak(sp[0], N), 1)} Hz, last frame ${f(D.peak(sp[sp.length - 1], N), 1)} Hz`); }
  for (const ep of [1, 3, 10, 50]) { const path = D.greedyPath(D.qLearn(0.2, 0.5, 0.9, ep, 5)); out.push(`grid world, ${ep} episodes: greedy path ${path.join('>')} (${path[path.length - 1] === D.GOAL ? 'reaches the goal' : 'does not reach the goal'})`); }
  for (const e of [0, 0.1, 0.5]) { const b = D.bandit(e, 500); out.push(`bandit, epsilon ${f(e, 1)}, 500 pulls: pulls [${b.n.join(', ')}] estimates ${b.est.map((v) => f(v, 2)).join(' ')} regret ${f(b.regret, 1)}`); }
  return out;
}]);

// ---- Phase 5: recommender, time series, probability of a test, treatment paradox, search and games, backtracking ----
checks.push(['ai', 'examples/sim-ai/ai.py', () => {
  const A = load('ai.js').logic.ai, out = [], r3 = (v) => f(v, 3), r2 = (v) => f(v, 2);
  out.push('similarity of user 1 to the others: ' + [1, 2, 3, 4, 5].map((u) => r3(A.userSimilarity(0, u))).join(' '));
  for (const item of [2, 4]) out.push(`predicted rating for user 1, ${A.ITEMS[item]}: k=2 ${r2(A.predict(0, item, 2).value)}, k=3 ${r2(A.predict(0, item, 3).value)}, everyone's average ${r2(A.itemAverage(item))}`);
  const y = A.series(), fit = A.fitTrendSeason(y, 36), strongest = fit.season.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), fit.season[0]);
  out.push(`trend per month ${r3(fit.b)}, strongest season effect ${r2(strongest)}`);
  for (const h of [1, 3, 12]) out.push(`forecast error (MAE) over the next ${h} month(s): repeat last ${r2(A.mae('naive', y, h))}, repeat last year ${r2(A.mae('seasonal', y, h))}, trend and season ${r2(A.mae('trend', y, h))}`);
  for (const [pr, se, sp] of [[0.1, 0.95, 0.9], [0.01, 0.95, 0.9], [0.5, 0.95, 0.9]]) out.push(`prior ${r2(pr)}, sensitivity ${r2(se)}, specificity ${r2(sp)}: chance of illness after 1 positive ${r3(A.posterior(pr, se, sp, 1))}, after 2 ${r3(A.posterior(pr, se, sp, 2))}`);
  const c = A.counts(0.01, 0.95, 0.9); out.push(`10000 people at prior 0.01: true positives ${c.tp}, missed ${c.fn}, false alarms ${c.fp}, true negatives ${c.tn}`);
  for (const hs of [[0.8, 0.1], [0.5, 0.5]]) out.push(`treatment A with ${f(hs[0] * 100, 0)}% hard cases ${r3(A.overall('A', hs[0]))}; treatment B with ${f(hs[1] * 100, 0)}% hard cases ${r3(A.overall('B', hs[1]))}`);
  for (const algo of ['bfs', 'dfs', 'astar']) { const r = A.solve(algo); out.push(`maze, ${algo}: ${r.order.length} cells examined, path of ${r.length} steps`); }
  for (const prune of [false, true]) { const m = A.minimax(prune); out.push(`game tree, ${prune ? 'with pruning' : 'without pruning'}: best value ${m.best}, leaves looked at ${m.seen} of 9`); }
  for (const smart of [false, true]) { const m = A.colourMap(smart); out.push(`map colouring, ${smart ? 'most constrained first' : 'fixed order'}: solved ${m.ok ? 'True' : 'False'}, colours tried ${m.tries}, backtracks ${m.back}, result ${m.col.map((k) => 'RGB'[k]).join('')}`); }
  return out;
}]);

// ---- Phase 6: rules against learning, project loop, splits, cleaning, scaling, label noise, API call, agent, patches, injection, test size, fairness ----
checks.push(['fnd', 'examples/sim-apps/apps.py', () => {
  load('sup.js'); const F = load('fnd.js').logic.fnd, out = [], r2 = (v) => f(v, 2), r3 = (v) => f(v, 3);
  for (const ws of [['free', 'win', 'prize', 'urgent'], F.KEYWORDS]) out.push(`rules ${ws.join('+')}: train ${r3(F.ruleAccuracy(ws, F.SPAM_TRAIN, F.HAM_TRAIN))}, new messages ${r3(F.ruleAccuracy(ws, F.SPAM_TEST, F.HAM_TEST))}`);
  const m = F.nbModel(); out.push(`learned word weights: train ${r3(F.nbAccuracy(m, F.SPAM_TRAIN, F.HAM_TRAIN))}, new messages ${r3(F.nbAccuracy(m, F.SPAM_TEST, F.HAM_TEST))}`);
  out.push('project loop, stages repeated: ' + F.FAULTS.map((x) => `${x[0]} -> ${x[1] - x[2] + 1}`).join('; '));
  for (const mode of ['random', 'time']) out.push(`split ${mode}: error with the day number ${r2(F.splitMae(mode, 'day'))}, with a leaked column ${r2(F.splitMae(mode, 'leak'))}`);
  for (const meth of ['drop', 'mean', 'median', 'zero']) { const c = F.cleanStats(meth); out.push(`fill ${meth}: ${c.n} values, mean ${r2(c.mean)}, median ${r2(c.median)}, spread ${r2(c.sd)}`); }
  for (const sc of [false, true]) { const n = F.nearestPerson([48, 60000], sc); out.push(`nearest person to age 48, income 60000, ${sc ? 'scaled' : 'unscaled'}: person ${n.i + 1}, distance ${r3(n.d)}`); }
  out.push('accuracy with noisy labels: ' + [0, 0.1, 0.3, 0.45].map((n) => `${r2(n)}:${r3(F.noisyAccuracy(n))}`).join(' '));
  out.push(`two annotators agree, each wrong 10% / 30%: ${r3(F.agreement(0.1, 11))} ${r3(F.agreement(0.3, 12))}`);
  for (const fail of [0, 0.3, 0.6]) { const a = F.apiCalls(fail); out.push(`20 calls, failure rate ${f(fail, 1)}, up to 3 retries: ${a.ok} succeeded, ${a.attempts} attempts, ${a.wait} seconds waiting, cost of successful calls ${f(a.cost, 4)}`); }
  out.push(`agent success: 5 steps ${r3(F.agentSuccess(0.9, 5, 0))}, 10 steps ${r3(F.agentSuccess(0.9, 10, 0))}, 10 steps with checks ${r3(F.agentSuccess(0.9, 10, 0.8))}`);
  out.push('patches of 1, 2, 4, 8 pixels give 64, 16, 4, 1 tokens; first patch strengths ' + [2, 4, 8].map((s) => r2(F.patches(s)[0][0])).join(' '));
  for (const g of [[], ['sep'], ['sep', 'approve'], ['sep', 'approve', 'least']]) { const o = F.injection(g); out.push(`attacks that work with guards ${g.join('+') || 'none'}: ${F.ATTACKS.filter((a) => o[a]).join(' ') || 'none'}`); }
  out.push(`margin of error at 80%: 20 cases ${r3(F.margin(0.8, 20))}, 100 cases ${r3(F.margin(0.8, 100))}, 500 cases ${r3(F.margin(0.8, 500))}`);
  for (const n of [20, 100, 500]) { const sr = F.sampleRates(n); out.push(`10 test sets of ${n} cases, observed pass rate from ${r2(Math.min(...sr))} to ${r2(Math.max(...sr))}`); }
  const [ga, gb] = F.groups();
  for (const [ta, tb] of [[0.5, 0.5], [0.5, 0.15]]) { const a = F.fairMetrics(ga, ta), b = F.fairMetrics(gb, tb); out.push(`thresholds ${r2(ta)} and ${r2(tb)}: selected ${r3(a.sel)} / ${r3(b.sel)}, caught ${r3(a.tpr)} / ${r3(b.tpr)}, correct ${r3(a.acc)} / ${r3(b.acc)}`); }
  return out;
}]);

// ---- Phase 7: data checks, safe release, drift alerts, serving and scaling, a production request, scoring a language model ----
checks.push(['ops', 'examples/sim-ops/ops.py', () => {
  load('gen.js'); load('llm.js'); const O = load('ops.js').logic.ops, L = globalThis.window.AIQPSim.logic.llm, out = [], r2 = (v) => f(v, 2), r3 = (v) => f(v, 3);
  for (const [en, ren] of [[O.CHECKS.slice(1), false], [['email', 'country'], false], [O.CHECKS, true], [['email', 'country'], true]]) { const v = O.validate(en, ren); out.push(`checks ${en.filter((c) => c !== 'schema' || true).join('+')}, column renamed ${ren ? 'yes' : 'no'}: ${v.pass} of 10 rows pass, failures ${Object.keys(v.fails).map((k) => `${k}:${v.fails[k]}`).join(' ')}${v.stopped ? ', pipeline stopped' : ''}`); }
  for (const [sc, sh, th] of [['same', 0.05, 3], ['slight', 0.05, 2], ['bad', 0.05, 3], ['bad', 0.01, 3], ['slight', 0.05, 4]]) { const v = O.release(sc, sh, th); out.push(`release ${sc}, ${Math.round(sh * 100)}% canary, roll back above ${th} points: canary ${v.cn} requests with ${v.ce} wrong (${r3(v.rc)}), others ${r3(v.rk)}, decision ${v.decision}`); }
  for (const [sh, w, th] of [[5, 7, 3], [5, 3, 2], [2, 14, 3], [0, 3, 2]]) { const v = O.drift(sh, w, th); out.push(`drift, shift ${sh}, window ${w}, alert above ${th}: false alarms ${v.false}, days to alert ${v.delay === null ? 'none' : v.delay}`); }
  for (const [lam, s, b, a] of [[6, 1, 1, false], [6, 1, 4, false], [6, 2, 1, false], [12, 1, 4, true], [8, 1, 4, false]]) { const v = O.serve(lam, s, b, a); out.push(`serving, ${lam} requests a second, ${s} server(s), batch ${b}, autoscaling ${a ? 'on' : 'off'}: served ${v.served}, median ${r2(v.p50)} s, slowest 5% over ${r2(v.p95)} s, waiting at end ${v.queue}, cost per hour $${r2(v.cost)}`); }
  for (const p of O.PARTS) out.push(`if ${p} breaks: ${O.EFFECT[p][0]}`);
  out.push(`perplexity after reading 10, 60 and ${L.trainLen()} words: ` + [10, 60, L.trainLen()].map((n) => r2(Math.exp(L.holdoutLoss(n)))).join(' '));
  for (const k of ['exact', 'normalised', 'contains', 'f1']) out.push(`scoring by ${k}: ` + O.ANSWERS.map((e) => r2(O.score(k, e[0], e[1]))).join(' '));
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
