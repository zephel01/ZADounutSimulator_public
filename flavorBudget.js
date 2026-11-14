/**
 * flavorBudget.js — Pokémon Legends Z-A ドーナツ フレーバーパワー抽選エンジン（予算方式）
 *
 * 出典: RotomLabs "Legends: Z-A Donut Mechanics"（Anubis 氏のデータマインに基づく）
 *       https://rotomlabs.net/guide/legends-z-a-donut-mechanics
 *       Serebii "Ansha's Donuts"（総予算 9 の閾値が 900 とされている点のみ相違 → オプション化）
 *
 * 公開資料で曖昧な点は ASSUMPTION コメントで明示。
 * ブラウザ（グローバル）／Node（module.exports）両対応。
 */
(function (root) {
  'use strict';

  const FLAVORS = ['sweet', 'spicy', 'sour', 'bitter', 'fresh']; // 同値時の優先順もこの順

  /** フレーバー値 → そのフレーバーの Level Budget */
  const FLAVOR_LEVEL_BUDGET = [
    [760, 9], [700, 8], [525, 7], [420, 6], [360, 5],
    [300, 4], [200, 3], [160, 2], [120, 1]
  ];

  /** 合計フレーバー → ドーナツ全体の Total Budget（最上段は資料で 960 / 900 の相違あり） */
  function totalBudgetTable(top9 = 960) {
    return [
      [top9, 9], [800, 8], [700, 7], [600, 6], [500, 5],
      [420, 4], [350, 3], [240, 2], [120, 1]
    ];
  }

  /** Level Budget → [cost1, cost2, cost3] の確率（%） */
  const COST_PROB = {
    1: [100, 0, 0],
    2: [100, 0, 0],
    3: [50, 50, 0],
    4: [25, 75, 0],
    5: [19.05, 42.86, 38.10],
    6: [14.29, 28.57, 57.14],
    7: [9.52, 33.33, 57.14],
    8: [0, 33.33, 66.67],
    9: [0, 0, 100]
  };

  const TYPES = ['ノーマル', 'ほのお', 'みず', 'でんき', 'くさ', 'こおり', 'かくとう', 'どく', 'じめん',
    'ひこう', 'エスパー', 'むし', 'いわ', 'ゴースト', 'ドラゴン', 'あく', 'はがね', 'フェアリー', 'ぜんぶ']; // 19 = 57/3

  /**
   * パワー定義: flavor → category → { family: [subtypes] }
   * 各 family は Lv1〜3 を持ち、コスト = Lv（例外: かがやきは全 Lv がコスト 3）
   */
  const POWER_DEFS = {
    sweet: {
      sparkling: { 'かがやきパワー': TYPES },
      size: { 'オヤブンパワー': [null], 'でかでかパワー': [null], 'ちびちびパワー': [null] }
    },
    spicy: {
      move: { 'わざパワー': TYPES },
      battle: { 'こうげきパワー': [null], 'とくこうパワー': [null], 'すばやさパワー': [null] }
    },
    sour: {
      item: { 'どうぐパワー': ['きのみ', 'アメ', 'おたから', 'ボール', 'とくべつ', 'コイン'] },
      distortion: { 'メガパワー：チャージ': [null], 'メガパワー：ながもち': [null], 'どっさりパワー': [null] }
    },
    bitter: {
      resistance: { 'めんえきパワー': TYPES },
      defense: { 'ぼうぎょパワー': [null], 'とくぼうパワー': [null] }
    },
    fresh: {
      encounter: { 'そうぐうパワー': [null] },
      catch: { 'ほかくパワー': TYPES }
    }
  };

  /** 特別ドーナツ時に除外されるカテゴリ */
  const SPECIAL_EXCLUDED = new Set(['sweet:sparkling', 'sweet:size', 'fresh:encounter', 'fresh:catch',
    'sour:item', 'sour:distortion:どっさりパワー']);

  /** 全パワー（個別エントリ）を展開 */
  function buildPowerList() {
    const list = [];
    for (const flavor of FLAVORS) {
      for (const [category, families] of Object.entries(POWER_DEFS[flavor])) {
        for (const [family, subs] of Object.entries(families)) {
          for (let lv = 1; lv <= 3; lv++) {
            for (const sub of subs) {
              list.push({
                flavor, category, family, sub, level: lv,
                cost: family === 'かがやきパワー' ? 3 : lv,
                name: sub ? `${family}：${sub} Lv.${lv}` : `${family} Lv.${lv}`,
                key: `${flavor}|${category}|${family}|${sub}|${lv}`
              });
            }
          }
        }
      }
    }
    return list;
  }
  const ALL_POWERS = buildPowerList();

  function lookup(table, v) {
    for (const [th, b] of table) if (v >= th) return b;
    return 0;
  }

  /**
   * フレーバー合計から抽選前の予算情報を計算（決定論的）
   * @param {{sweet,spicy,sour,bitter,fresh}} totals
   * @param {{totalTop9?:number}} opts
   */
  function computeBudgets(totals, opts = {}) {
    const values = FLAVORS.map(f => totals[f] || 0);
    const max = Math.max(...values);
    const isRainbow = max > 0 && values.filter(v => v === max).length >= 2;
    const levelBudgets = {};
    FLAVORS.forEach((f, i) => {
      let b = lookup(FLAVOR_LEVEL_BUDGET, values[i]);
      // ASSUMPTION: レインボーの +1 は値が 0 より大きいフレーバーに適用（資料は "every flavor"）、上限 9
      if (isRainbow && values[i] > 0) b = Math.min(9, b + 1);
      levelBudgets[f] = b;
    });
    const sum = values.reduce((a, b) => a + b, 0);
    const totalBudget = lookup(totalBudgetTable(opts.totalTop9 || 960), sum);
    return { isRainbow, levelBudgets, totalBudget, sum };
  }

  function rollCost(budget, rng) {
    const p = COST_PROB[Math.min(budget, 9)];
    // そのバジェットで取りうるコストのみ（budget < cost は不可）
    const w = p.map((x, i) => (i + 1 <= budget ? x : 0));
    const s = w.reduce((a, b) => a + b, 0);
    let r = rng() * s;
    for (let i = 0; i < 3; i++) { if ((r -= w[i]) < 0) return i + 1; }
    return 1;
  }

  /**
   * ドーナツ 1 個分のフレーバーパワーを抽選
   * @param {object} totals フレーバー合計
   * @param {{rng?:function,totalTop9?:number,special?:boolean,maxPowers?:number}} opts
   * @returns {Array<object>} 付与されたパワー（最大 3）
   */
  function rollPowers(totals, opts = {}) {
    const rng = opts.rng || Math.random;
    // 特別ドーナツは 1 枠目が専用パワーで埋まるため、抽選枠は残り 2
    // ASSUMPTION: 専用パワーは総予算を消費しない
    const maxPowers = opts.maxPowers || (opts.special ? 2 : 3);
    const { levelBudgets, totalBudget } = computeBudgets(totals, opts);

    // 1) 各フレーバーが「ウィッシュリスト」を作る。
    // ASSUMPTION: 残りの Level Budget が尽きるまでコストを繰り返し抽選し、抽選値を差し引く。
    const wishes = [];
    FLAVORS.forEach((f, fi) => {
      let b = levelBudgets[f];
      while (b > 0) {
        const c = rollCost(b, rng);
        wishes.push({ flavor: f, cost: c, value: totals[f] || 0, order: fi, tie: rng() });
        b -= c;
      }
    });

    // 2) 高コスト順 → フレーバー値の高い順 → 乱数
    wishes.sort((a, b) => b.cost - a.cost || b.value - a.value || a.tie - b.tie);

    // 3) 総予算の範囲で割り当て。不足時は残り予算レベルへ格下げ。
    let remaining = totalBudget;
    const usedCategories = new Set();
    const usedKeys = new Set();
    const result = [];
    for (const w of wishes) {
      if (result.length >= maxPowers || remaining <= 0) break;
      const cost = Math.min(w.cost, remaining);
      const pool = ALL_POWERS.filter(p =>
        p.flavor === w.flavor &&
        p.cost === cost &&
        !usedCategories.has(`${p.flavor}:${p.category}`) &&
        !usedKeys.has(p.key) &&
        !(opts.special && (SPECIAL_EXCLUDED.has(`${p.flavor}:${p.category}`) ||
          SPECIAL_EXCLUDED.has(`${p.flavor}:${p.category}:${p.family}`)))
      );
      // ASSUMPTION: 候補が空ならこのウィッシュは消費せずスキップ
      if (pool.length === 0) continue;
      const pick = pool[Math.floor(rng() * pool.length)];
      result.push(pick);
      usedCategories.add(`${pick.flavor}:${pick.category}`);
      usedKeys.add(pick.key);
      remaining -= cost;
    }
    return result;
  }

  /**
   * モンテカルロで各パワー（family 単位／カテゴリ単位）の出現率を推定
   * @returns {{byFamily:Object, byCategory:Object, byFamilyLevel:Object, avgCount:number, budgets:object}}
   */
  function estimateProbabilities(totals, opts = {}) {
    const n = opts.iterations || 20000;
    const byFamily = {}, byCategory = {}, byFamilyLevel = {};
    let count = 0;
    for (let i = 0; i < n; i++) {
      const ps = rollPowers(totals, opts);
      count += ps.length;
      const fams = new Set(), cats = new Set(), fls = new Set();
      ps.forEach(p => { fams.add(p.family); cats.add(`${p.flavor}:${p.category}`); fls.add(`${p.family} Lv.${p.level}`); });
      fams.forEach(k => byFamily[k] = (byFamily[k] || 0) + 1);
      cats.forEach(k => byCategory[k] = (byCategory[k] || 0) + 1);
      fls.forEach(k => byFamilyLevel[k] = (byFamilyLevel[k] || 0) + 1);
    }
    const pct = o => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +(v / n * 100).toFixed(2)]));
    return {
      byFamily: pct(byFamily), byCategory: pct(byCategory), byFamilyLevel: pct(byFamilyLevel),
      avgCount: +(count / n).toFixed(3), budgets: computeBudgets(totals, opts)
    };
  }

  /** シード付き乱数（検証の再現用） */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const api = {
    FLAVORS, FLAVOR_LEVEL_BUDGET, COST_PROB, POWER_DEFS, ALL_POWERS, TYPES,
    totalBudgetTable, computeBudgets, rollPowers, estimateProbabilities, mulberry32
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlavorBudget = api;
})(typeof window !== 'undefined' ? window : globalThis);
