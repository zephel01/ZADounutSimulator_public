// 検証: node test.js <元プロジェクトのdata.jsのディレクトリ>
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const here = __dirname, dataDir = process.argv[2] || here;
const FB = require(path.join(here, 'flavorBudget.js'));
const ctx = { console, Math, FlavorBudget: FB, Object, Set, Array };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dataDir, 'data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(here, 'simulator.js'), 'utf8') +
  '\n;globalThis.__api={BERRIES,calculateDonutResult,findDonutCombinations,getCorrectionFactor};', ctx);
const { BERRIES, calculateDonutResult, getCorrectionFactor } = ctx.__api;
const B = n => { const b = BERRIES.find(x => x.name === n); assert(b, n); return b; };
const rep = (n, c) => Array(c).fill(B(n));
const near = (a, e, tol, label) => { const ok = Math.abs(a - e) <= tol; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${a} (期待 ${e}±${tol})`); if (!ok) process.exitCode = 1; };
const check = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${label}`); if (!cond) process.exitCode = 1; };
const N = 200000, rng = FB.mulberry32(42);

// 1) RotomLabs 公開値: いじげんタンガ×8
let t = calculateDonutResult(rep('いじげんタンガのみ', 8)).totals;
let r = FB.estimateProbabilities(t, { iterations: N, rng });
near(r.byCategory['sweet:size'], 100, 0.01, 'タンガ×8 サイズ系');
near(r.byCategory['sweet:sparkling'], 98.13, 0.3, 'タンガ×8 かがやき');

// 2) RotomLabs 公開値: いじげんハバン×4 + タンガ×4
t = calculateDonutResult([...rep('いじげんハバンのみ', 4), ...rep('いじげんタンガのみ', 4)]).totals;
r = FB.estimateProbabilities(t, { iterations: N, rng });
near(r.byCategory['sweet:size'], 100, 0.01, 'ハバン4タンガ4 サイズ系');
near(r.byCategory['fresh:catch'], 95.78, 0.3, 'ハバン4タンガ4 ほかく');
near(r.byCategory['sweet:sparkling'], 84.42, 0.4, 'ハバン4タンガ4 かがやき');
near(r.byCategory['fresh:encounter'], 19.80, 0.4, 'ハバン4タンガ4 そうぐう');

// 3) ★閾値
check(getCorrectionFactor(349).stars === 2 && getCorrectionFactor(350).stars === 3, '★3閾値 = 350');
check(getCorrectionFactor(960).factor === 1.5 && getCorrectionFactor(959).stars === 4, '★5閾値 = 960 / ×1.5');

// 4) 上限・カテゴリ制約（多フレーバーの雑多な組み合わせで 2 万回）
const mixed = ['いじげんハバンのみ', 'いじげんナモのみ', 'いじげんリリバのみ', 'いじげんホズのみ', 'いじげんロゼルのみ', 'いじげんタンガのみ', 'いじげんカシブのみ', 'いじげんバコウのみ'].map(B);
t = calculateDonutResult(mixed).totals;
let okMax = true, okCat = true, okBudget = true;
const { totalBudget } = FB.computeBudgets(t);
for (let i = 0; i < 20000; i++) {
  const ps = FB.rollPowers(t, { rng });
  if (ps.length > 3) okMax = false;
  const cats = ps.map(p => p.flavor + p.category);
  if (new Set(cats).size !== cats.length) okCat = false;
  if (ps.reduce((a, p) => a + p.cost, 0) > totalBudget) okBudget = false;
}
check(okMax, 'パワーは最大3個'); check(okCat, '1カテゴリ1個'); check(okBudget, 'コスト合計 ≤ 総予算');

// 5) 特別ドーナツ: スイート/フレッシュ/どうぐ/どっさり 除外・最大2
const nm = calculateDonutResult([...rep('いじげんタンガのみ', 3), ...rep('いじげんカシブのみ', 3), B('いじげんバコウのみ'), B('いじげんヤチェのみ')], 420, { withOdds: true, oddsIterations: 5000 });
check(nm.pokemon === 'ダークライ', `特別ドーナツ判定 (${nm.donutName})`);
const fams = Object.keys(nm.powerOdds.byFamily);
check(!fams.some(f => /かがやき|オヤブン|でかでか|ちびちび|そうぐう|ほかく|どうぐ|どっさり/.test(f)), `特別ドーナツ除外 (${fams.join(',')})`);
check(nm.powerOdds.avgCount <= 2, `特別ドーナツ抽選枠≤2 (平均 ${nm.powerOdds.avgCount})`);

// 6) レインボー
const rb = FB.computeBudgets({ sweet: 420, spicy: 420, sour: 0, bitter: 0, fresh: 130 });
check(rb.isRainbow && rb.levelBudgets.sweet === 7 && rb.levelBudgets.fresh === 2 && rb.levelBudgets.sour === 0, 'レインボー +1');

// 7) 従来互換・滞在時間
const d = calculateDonutResult(rep('いじげんリリバのみ', 8));
check(['totals', 'finalLevel', 'finalKcal', 'powers', 'stars', 'duration'].every(k => k in d), '従来フィールド維持');
const d5 = calculateDonutResult(rep('いじげんリリバのみ', 8), 420, { distortionStars: 5 });
check(d5.duration === Math.floor(d.finalKcal / 10) && d5.durationByDistortion[1] === d.finalKcal, `歪み★別滞在 (★5: ${d5.duration}s, ★1: ${d5.durationByDistortion[1]}s)`);
const low = calculateDonutResult(rep('クラボのみ', 3), 420, { distortionStars: 5 });
check(low.catchPenalty === 0.3, `捕獲率補正 (★${low.stars} で★5歪み → ${low.catchPenalty})`);

// 8) 探索ループが壊れていない・速度
let t0 = Date.now(); const res = ctx.__api.findDonutCombinations(['sweet'], 700, 20000);
check(Array.isArray(res), `探索関数動作 (20000回 ${Date.now() - t0}ms, 結果${res.length}件)`);
t0 = Date.now(); calculateDonutResult(mixed, 420, { withOdds: true });
console.log(`INFO withOdds 5000回 推定時間: ${Date.now() - t0}ms`);
