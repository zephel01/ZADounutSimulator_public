/**
 * recipes.js — 目的別おすすめレシピ（v2.1.0）
 *
 * レシピ候補は、いじげんきのみ 8 個の全組み合わせ（約 7,690 万通り）と
 * 店売り＋いじげんきのみの混合（約 20 万通り）を flavorBudget.js で総当たり評価して選定。
 * 画面の確率は表示時に flavorBudget.js で再計算する（固定値は持たない）。
 * 依存: data.js (BERRIES), flavorBudget.js, simulator.js, app.js (state, updateUI)
 */
(function () {
  'use strict';

  const RECIPES = [
    // ---- 色違い ----
    { purpose: 'shiny', tag: '確率最大', berries: [['いじげんタンガのみ', 8]],
      note: 'かがやきLv3の確率が最大。ほかくパワーは付かない。' },
    { purpose: 'shiny', tag: 'おすすめ', berries: [['いじげんタンガのみ', 4], ['いじげんハバンのみ', 4]],
      note: '1種4個まで。かがやきLv3とほかくが同時に付きやすく、滞在も長い。' },
    { purpose: 'shiny', tag: '★4,5節約', berries: [['いじげんオッカのみ', 3], ['いじげんハバンのみ', 3], ['いじげんタンガのみ', 1], ['いじげんイトケのみ', 1]],
      note: '1種3個まで・★4,5のきのみは4個まで。' },
    { purpose: 'shiny', tag: '★1〜3のみ', berries: [['いじげんオッカのみ', 7], ['いじげんイトケのみ', 1]],
      note: '★4,5のきのみを使わない。確率と滞在は下がる。' },
    // ---- きのみ集め ----
    { purpose: 'berry', tag: '確率最大', berries: [['いじげんカシブのみ', 8]],
      note: 'きのみLv3・どっさりLv3の同時発動が最も狙いやすい。' },
    { purpose: 'berry', tag: 'おすすめ', berries: [['いじげんカシブのみ', 4], ['いじげんロゼルのみ', 3], ['いじげんリリバのみ', 1]],
      note: '1種4個まで。カシブを温存しつつ滞在が長い。' },
    { purpose: 'berry', tag: '★1〜3のみ', berries: [['いじげんソクノのみ', 6], ['いじげんタポルのみ', 2]],
      note: '節約の本命。★4の小〜中規模でボール割り向け。' },
    { purpose: 'berry', tag: '店売り＋★3', berries: [['ナモのみ', 4], ['いじげんソクノのみ', 4]],
      note: 'いじげんきのみ4個だけでLv2が狙える。' },
    { purpose: 'berry', tag: '店売りのみ', berries: [['ナモのみ', 8]],
      note: 'いじげんきのみを減らさない。Lv1のみ。★4小規模でボールだけ割る。' },
    // ---- ボール集め ----
    { purpose: 'ball', tag: '確率最大', berries: [['いじげんカシブのみ', 8]],
      note: '珍しいボールは★5の異次元で出る（1つの異次元につき最大1個）。' },
    { purpose: 'ball', tag: 'おすすめ', berries: [['いじげんカシブのみ', 4], ['いじげんロゼルのみ', 3], ['いじげんリリバのみ', 1]],
      note: '1種4個まで。★5でも滞在に余裕がある。' },
    { purpose: 'ball', tag: '★1〜3のみ', berries: [['いじげんソクノのみ', 6], ['いじげんタポルのみ', 2]],
      note: '節約用。★5では滞在が短いので注意。' },
  ];

  const PURPOSES = {
    shiny: { label: '✨ 色違い', metrics: [
      ['かがやき', ps => has(ps, 'かがやきパワー')],
      ['かがやきLv3', ps => has(ps, 'かがやきパワー', 3)],
      ['Lv3＋ほかく', ps => has(ps, 'かがやきパワー', 3) && has(ps, 'ほかくパワー')],
      ['Lv3＋オヤブンLv3', ps => has(ps, 'かがやきパワー', 3) && has(ps, 'オヤブンパワー', 3)],
    ], extra: r => `狙ったタイプ（またはぜんぶ）のLv3: 約${(r[1] * 2 / 19 * 100).toFixed(1)}%（1回あたり）` },
    berry: { label: '🍇 きのみ集め', metrics: [
      ['きのみ', ps => hasItem(ps, 'きのみ')],
      ['きのみLv2+', ps => hasItem(ps, 'きのみ', 2)],
      ['きのみLv3', ps => hasItem(ps, 'きのみ', 3)],
      ['＋どっさり', ps => hasItem(ps, 'きのみ') && has(ps, 'どっさりパワー')],
    ] },
    ball: { label: '⚾ ボール集め', metrics: [
      ['ボール', ps => hasItem(ps, 'ボール')],
      ['ボールLv2+', ps => hasItem(ps, 'ボール', 2)],
      ['ボールLv3', ps => hasItem(ps, 'ボール', 3)],
      ['＋どっさり', ps => hasItem(ps, 'ボール') && has(ps, 'どっさりパワー')],
    ] },
  };

  function has(ps, family, minLv = 1) { return ps.some(p => p.family === family && p.level >= minLv); }
  function hasItem(ps, sub, minLv = 1) { return ps.some(p => p.family === 'どうぐパワー' && p.sub === sub && p.level >= minLv); }

  const ITER = 15000; // 表示誤差 ±0.5pt 程度
  const cache = new Map();
  let current = 'shiny';

  function expand(r) {
    const list = [];
    for (const [name, n] of r.berries) {
      const b = BERRIES.find(x => x.name === name);
      if (!b) { console.warn('recipe berry not found:', name); return null; }
      for (let i = 0; i < n; i++) list.push(b);
    }
    return list;
  }

  function evaluate(r) {
    const key = JSON.stringify(r.berries) + r.purpose;
    if (cache.has(key)) return cache.get(key);
    const list = expand(r);
    if (!list) return null;
    const d = calculateDonutResult(list, 420);
    const rng = FlavorBudget.mulberry32(20261115); // 表示を毎回同じ値にするため固定シード
    const ms = PURPOSES[r.purpose].metrics;
    const cnt = ms.map(() => 0);
    for (let i = 0; i < ITER; i++) {
      const ps = FlavorBudget.rollPowers(d.totals, { rng, berryCount: list.length });
      ms.forEach(([, f], k) => { if (f(ps)) cnt[k]++; });
    }
    const hard = list.filter(b => String(b.stars).includes('4')).length;
    const res = { d, p: cnt.map(c => c / ITER), hard };
    cache.set(key, res);
    return res;
  }

  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render() {
    const box = document.getElementById('recipe-list');
    if (!box) return;
    document.querySelectorAll('.recipe-purpose-btn').forEach(b => b.classList.toggle('active', b.dataset.purpose === current));
    const items = RECIPES.map((r, i) => ({ r, i })).filter(x => x.r.purpose === current);
    const ms = PURPOSES[current].metrics;
    const purpose = current;
    box.innerHTML = items.map(({ i }) => `<div class="recipe-card" id="recipe-card-${i}"><div class="recipe-loading">計算中…</div></div>`).join('');
    // 1 枚ずつ計算して差し替え（UI を固めない）
    items.forEach(({ r, i }, n) => setTimeout(() => {
      if (purpose !== current) return;
      const el = document.getElementById(`recipe-card-${i}`);
      if (!el) return;
      const e = evaluate(r);
      if (!e) { el.remove(); return; }
      const berries = r.berries.map(([nm, c]) => `${esc(nm.replace('のみ', ''))}×${c}`).join(' ＋ ');
      const stay4 = e.d.durationByDistortion[4], stay5 = e.d.durationByDistortion[5];
      const tagCls = r.tag === 'おすすめ' ? 'rec' : r.tag === '確率最大' ? 'max' : 'eco';
      el.innerHTML = `
            <div class="recipe-head">
              <span class="recipe-tag tag-${tagCls}">${esc(r.tag)}</span>
              <span class="recipe-berries">${berries}</span>
            </div>
            <div class="recipe-metrics">
              ${ms.map(([label], k) => `<div class="recipe-metric"><small>${esc(label)}</small><b>${(e.p[k] * 100).toFixed(1)}%</b></div>`).join('')}
            </div>
            <div class="recipe-sub">
              ★${e.d.stars}・+Lv.${e.d.finalLevel}・${e.d.finalKcal}kcal ／ 滞在 ★4 ${fmtTime(stay4)}・★5 ${fmtTime(stay5)} ／ ★4,5のきのみ ${e.hard}個
            </div>
            ${PURPOSES[purpose].extra ? `<div class="recipe-sub">${esc(PURPOSES[purpose].extra(e.p))}</div>` : ''}
            <div class="recipe-note">${esc(r.note)}</div>
            <button type="button" class="action-btn recipe-load" data-idx="${i}">このレシピを読み込む</button>`;
    }, 30 * n));
  }

  function load(idx) {
    const list = expand(RECIPES[idx]);
    if (!list) return;
    state.selectedBerries = list.slice(0, 8);
    updateUI();
    const tab = document.querySelector('.tab-btn[data-tab="selection"]');
    if (tab) tab.click();
  }

  function init() {
    const root = document.getElementById('tab-recipes');
    if (!root || typeof FlavorBudget === 'undefined') return;
    root.addEventListener('click', e => {
      const p = e.target.closest('.recipe-purpose-btn');
      if (p) { current = p.dataset.purpose; render(); return; }
      const l = e.target.closest('.recipe-load');
      if (l) load(+l.dataset.idx);
    });
    const tabBtn = document.querySelector('.tab-btn[data-tab="recipes"]');
    let rendered = false;
    if (tabBtn) tabBtn.addEventListener('click', () => { if (!rendered) { rendered = true; render(); } });
  }

  (typeof window !== 'undefined' ? window : globalThis).RecommendedRecipes = { RECIPES, PURPOSES, evaluate, render };
  if (typeof document === 'undefined') return; // Node（test.js）では UI 初期化しない
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
