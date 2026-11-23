// One-off: fill @@PY / @@OUT / @@CS placeholders in new lesson files with the real example code and real program output.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = 'D:/ClaudeApps/AIGuideApp/Code/';
for (const f of process.argv.slice(2)) {
  let t = fs.readFileSync(ROOT + f, 'utf8').replace(/\r\n/g, '\n');
  t = t.replace(/^@@PY (\S+)$/gm, (_, p) => '```python ' + path.basename(p) + '\n' + fs.readFileSync(ROOT + p, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '') + '\n```');
  t = t.replace(/^@@CS (\S+)$/gm, (_, p) => '```cs Program.cs\n' + fs.readFileSync(ROOT + p, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '') + '\n```');
  t = t.replace(/^@@OUT (\S+)$/gm, (_, p) => {
    const out = execFileSync('python', [path.basename(p)], { cwd: ROOT + path.dirname(p), encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).replace(/\n$/, '');
    return '```text Output of ' + path.basename(p) + ' (executed)\n' + out + '\n```';
  });
  fs.writeFileSync(ROOT + f, t);
  console.log('composed', f);
}
