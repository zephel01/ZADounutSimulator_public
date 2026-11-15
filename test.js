// 検証: node test.js <元プロジェクトのdata.jsのディレクトリ>
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const here = __dirname, dataDir = process.argv[2] || here;
const FB = require(path.join(here, 'flavorBudget.js'));
const ctx = { console, Math, FlavorBudget: FB, Object, Set, Array };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dataDir, 'data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(here, 'simulator.js'), 'utf8') + '\n' +
  (fs.existsSync(path.join(here, 'recipes.js')) ? fs.readFileSync(path.join(here, 'recipes.js'), 'utf8') : '') +
  '\n;globalThis.__api={BERRIES,calculateDonutResult,findDonutCombinations,getCorrectionFactor,RR:globalThis.RecommendedRecipes};', ctx);
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

// 6b) v2.0.1: レインボー +1 は 120 以上の味のみ / 最大値 120 未満の同値はレインボーではない
const rb2 = FB.computeBudgets({ sweet: 420, spicy: 420, sour: 50, bitter: 0, fresh: 0 });
check(rb2.isRainbow && rb2.levelBudgets.sour === 0 && rb2.levelBudgets.spicy === 7, 'レインボー: 120未満の味は予算0のまま');
const rb3 = FB.computeBudgets({ sweet: 100, spicy: 100, sour: 0, bitter: 0, fresh: 0 });
check(!rb3.isRainbow && rb3.levelBudgets.sweet === 0, 'レインボー: 最大値120未満は対象外');

// 6c) v2.0.1: きのみ 3 個未満はパワーなし
const two = calculateDonutResult(rep('いじげんタンガのみ', 2), 420, { withOdds: true, oddsIterations: 2000 });
check(two.powerOdds.avgCount === 0 && Object.keys(two.powerOdds.byFamily).length === 0, 'きのみ2個 → パワーなし');
const three = calculateDonutResult(rep('いじげんタンガのみ', 3), 420, { withOdds: true, oddsIterations: 2000 });
check(three.powerOdds.avgCount > 0, `きのみ3個 → パワーあり (平均 ${three.powerOdds.avgCount})`);
check(FB.rollPowers({ sweet: 760, spicy: 0, sour: 0, bitter: 0, fresh: 0 }, { rng }).length > 0, 'berryCount 未指定時は従来どおり');

// 6d) v2.0.1: コスト表は分数・各行の合計 = 1
check(Object.values(FB.COST_PROB).every(r => Math.abs(r.reduce((a, b) => a + b, 0) - 1) < 1e-12) && FB.COST_PROB[5][0] === 4 / 21, 'コスト表: 分数・合計1');

// 7) 従来互換・滞在時間
const d = calculateDonutResult(rep('いじげんリリバのみ', 8));
check(['totals', 'finalLevel', 'finalKcal', 'powers', 'stars', 'duration'].every(k => k in d), '従来フィールド維持');
const d5 = calculateDonutResult(rep('いじげんリリバのみ', 8), 420, { distortionStars: 5 });
check(d5.duration === Math.floor(d.finalKcal / 10) && d5.durationByDistortion[1] === d.finalKcal, `歪み★別滞在 (★5: ${d5.duration}s, ★1: ${d5.durationByDistortion[1]}s)`);
const d4 = calculateDonutResult(rep('いじげんリリバのみ', 8), 420, { distortionStars: 4 });
check(d4.duration === Math.floor(d.finalKcal / 7.52), `★4消費率 7.52 (★4: ${d4.duration}s)`);
const low = calculateDonutResult(rep('クラボのみ', 3), 420, { distortionStars: 5 });
check(low.catchPenalty === 0.3, `捕獲率補正 (★${low.stars} で★5歪み → ${low.catchPenalty})`);

// 8) 探索ループが壊れていない・速度
let t0 = Date.now(); const res = ctx.__api.findDonutCombinations(['sweet'], 700, 20000);
check(Array.isArray(res), `探索関数動作 (20000回 ${Date.now() - t0}ms, 結果${res.length}件)`);
t0 = Date.now(); calculateDonutResult(mixed, 420, { withOdds: true });
console.log(`INFO withOdds 5000回 推定時間: ${Date.now() - t0}ms`);

// 9) v2.1.0: おすすめレシピ（全レシピのきのみが存在・8個以内・確率が妥当）
const RR = ctx.__api.RR;
check(!!RR && RR.RECIPES.length >= 10, `おすすめレシピ定義 (${RR ? RR.RECIPES.length : 0}件)`);
if (RR) {
  const bad = RR.RECIPES.filter(r => r.berries.some(([n]) => !BERRIES.find(b => b.name === n)) || r.berries.reduce((a, [, c]) => a + c, 0) !== 8);
  check(bad.length === 0, 'レシピのきのみ名・個数(8個)が正しい' + (bad.length ? ' NG: ' + bad.map(r => JSON.stringify(r.berries)).join(';') : ''));
  const t8 = RR.evaluate(RR.RECIPES.find(r => r.purpose === 'shiny' && r.tag === '確率最大'));
  near(+(t8.p[1] * 100).toFixed(1), 32.9, 2.0, 'レシピ: タンガ×8 かがやきLv3');
  const k8 = RR.evaluate(RR.RECIPES.find(r => r.purpose === 'berry' && r.tag === '確率最大'));
  near(+(k8.p[2] * 100).toFixed(1), 14.3, 1.5, 'レシピ: カシブ×8 きのみLv3');
  const namo = RR.evaluate(RR.RECIPES.find(r => r.tag === '店売りのみ'));
  check(namo.p[1] === 0 && namo.hard === 0 && namo.d.durationByDistortion[4] === 89, `レシピ: ナモ×8 Lv2以上0%・★4滞在${namo.d.durationByDistortion[4]}秒`);
}
