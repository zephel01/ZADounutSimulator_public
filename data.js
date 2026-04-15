const BERRIES = [
  { name: "クラボのみ", sweet: 0, spicy: 10, sour: 0, bitter: 0, fresh: 0, plus_level: 1, kcal: 60, flavor_rank: 10 },
  { name: "カゴのみ", sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 10, plus_level: 1, kcal: 60, flavor_rank: 10 },
  { name: "モモンのみ", sweet: 10, spicy: 0, sour: 0, bitter: 0, fresh: 0, plus_level: 1, kcal: 60, flavor_rank: 10 },
  { name: "チーゴのみ", sweet: 0, spicy: 0, sour: 0, bitter: 10, fresh: 0, plus_level: 1, kcal: 60, flavor_rank: 10 },
  { name: "ナナシのみ", sweet: 0, spicy: 0, sour: 10, bitter: 0, fresh: 0, plus_level: 1, kcal: 60, flavor_rank: 10 },
  { name: "オレンのみ", sweet: 0, spicy: 5, sour: 5, bitter: 5, fresh: 5, plus_level: 1, kcal: 60, flavor_rank: 20 },
  { name: "キーのみ", sweet: 5, spicy: 5, sour: 5, bitter: 0, fresh: 5, plus_level: 1, kcal: 60, flavor_rank: 20 },
  { name: "ラムのみ", sweet: 5, spicy: 5, sour: 0, bitter: 5, fresh: 5, plus_level: 2, kcal: 65, flavor_rank: 20 },
  { name: "オボンのみ", sweet: 5, spicy: 0, sour: 5, bitter: 5, fresh: 5, plus_level: 2, kcal: 65, flavor_rank: 20 },
  { name: "ザロクのみ", sweet: 10, spicy: 10, sour: 0, bitter: 10, fresh: 0, plus_level: 2, kcal: 65, flavor_rank: 30 },
  { name: "ネコブのみ", sweet: 0, spicy: 0, sour: 10, bitter: 10, fresh: 10, plus_level: 2, kcal: 65, flavor_rank: 30 },
  { name: "タポルのみ", sweet: 10, spicy: 10, sour: 10, bitter: 0, fresh: 0, plus_level: 2, kcal: 65, flavor_rank: 30 },
  { name: "ロメのみ", sweet: 0, spicy: 10, sour: 0, bitter: 10, fresh: 10, plus_level: 2, kcal: 65, flavor_rank: 30 },
  { name: "ウブのみ", sweet: 10, spicy: 0, sour: 10, bitter: 0, fresh: 10, plus_level: 2, kcal: 65, flavor_rank: 30 },
  { name: "マトマのみ", sweet: 0, spicy: 20, sour: 0, bitter: 0, fresh: 10, plus_level: 2, kcal: 65, flavor_rank: 25 },
  { name: "オッカのみ", sweet: 10, spicy: 15, sour: 0, bitter: 0, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "イトケのみ", sweet: 0, spicy: 0, sour: 0, bitter: 10, fresh: 15, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "ソクノのみ", sweet: 15, spicy: 0, sour: 10, bitter: 0, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "リンドのみ", sweet: 0, spicy: 10, sour: 0, bitter: 15, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "ヤチェのみ", sweet: 0, spicy: 0, sour: 15, bitter: 0, fresh: 10, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "ヨプのみ", sweet: 0, spicy: 15, sour: 0, bitter: 10, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "ビアーのみ", sweet: 0, spicy: 0, sour: 10, bitter: 0, fresh: 15, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "シュカのみ", sweet: 15, spicy: 10, sour: 0, bitter: 0, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "バコウのみ", sweet: 0, spicy: 0, sour: 0, bitter: 15, fresh: 10, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "ウタンのみ", sweet: 10, spicy: 0, sour: 15, bitter: 0, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 25 },
  { name: "タンガのみ", sweet: 0, spicy: 20, sour: 10, bitter: 0, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 30 },
  { name: "ヨロギのみ", sweet: 0, spicy: 10, sour: 0, bitter: 0, fresh: 20, plus_level: 3, kcal: 70, flavor_rank: 30 },
  { name: "カシブのみ", sweet: 20, spicy: 0, sour: 0, bitter: 0, fresh: 10, plus_level: 3, kcal: 70, flavor_rank: 30 },
  { name: "ハバンのみ", sweet: 10, spicy: 0, sour: 0, bitter: 20, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 30 },
  { name: "ナモのみ", sweet: 0, spicy: 0, sour: 20, bitter: 10, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 30 },
  { name: "リリバのみ", sweet: 0, spicy: 25, sour: 0, bitter: 0, fresh: 10, plus_level: 3, kcal: 70, flavor_rank: 35 },
  { name: "ホズのみ", sweet: 10, spicy: 0, sour: 0, bitter: 0, fresh: 25, plus_level: 3, kcal: 70, flavor_rank: 35 },
  { name: "ロゼルのみ", sweet: 25, spicy: 0, sour: 0, bitter: 10, fresh: 0, plus_level: 3, kcal: 70, flavor_rank: 35 },
  { name: "いじげんクラボのみ", sweet: 0, spicy: 40, sour: 0, bitter: 0, fresh: 0, plus_level: 5, kcal: 80, flavor_rank: 40 },
  { name: "いじげんカゴのみ", sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 40, plus_level: 3, kcal: 100, flavor_rank: 40 },
  { name: "いじげんモモンのみ", sweet: 40, spicy: 0, sour: 0, bitter: 0, fresh: 0, plus_level: 2, kcal: 100, flavor_rank: 40 },
  { name: "いじげんチーゴのみ", sweet: 0, spicy: 0, sour: 0, bitter: 40, fresh: 0, plus_level: 3, kcal: 110, flavor_rank: 40 },
  { name: "いじげんナナシのみ", sweet: 0, spicy: 0, sour: 40, bitter: 0, fresh: 0, plus_level: 4, kcal: 90, flavor_rank: 40 },
  { name: "いじげんオレンのみ", sweet: 10, spicy: 20, sour: 15, bitter: 15, fresh: 0, plus_level: 6, kcal: 90, flavor_rank: 60 },
  { name: "いじげんキーのみ", sweet: 0, spicy: 15, sour: 15, bitter: 10, fresh: 20, plus_level: 4, kcal: 110, flavor_rank: 60 },
  { name: "いじげんラムのみ", sweet: 20, spicy: 15, sour: 10, bitter: 0, fresh: 15, plus_level: 3, kcal: 110, flavor_rank: 60 },
  { name: "いじげんオボンのみ", sweet: 15, spicy: 10, sour: 0, bitter: 20, fresh: 15, plus_level: 4, kcal: 120, flavor_rank: 60 },
  { name: "いじげんザロクのみ", sweet: 30, spicy: 35, sour: 0, bitter: 0, fresh: 5, plus_level: 7, kcal: 140, flavor_rank: 70 },
  { name: "いじげんネコブのみ", sweet: 5, spicy: 0, sour: 0, bitter: 30, fresh: 35, plus_level: 5, kcal: 160, flavor_rank: 70 },
  { name: "いじげんタポルのみ", sweet: 35, spicy: 0, sour: 30, bitter: 5, fresh: 0, plus_level: 4, kcal: 160, flavor_rank: 70 },
  { name: "いじげんロメのみ", sweet: 0, spicy: 5, sour: 35, bitter: 0, fresh: 30, plus_level: 6, kcal: 150, flavor_rank: 70 },
  { name: "いじげんウブのみ", sweet: 0, spicy: 60, sour: 25, bitter: 0, fresh: 5, plus_level: 8, kcal: 140, flavor_rank: 90 },
  { name: "いじげんマトマのみ", sweet: 5, spicy: 25, sour: 0, bitter: 0, fresh: 60, plus_level: 6, kcal: 180, flavor_rank: 90 },
  { name: "いじげんオッカのみ", sweet: 60, spicy: 0, sour: 0, bitter: 5, fresh: 25, plus_level: 5, kcal: 180, flavor_rank: 90 },
  { name: "いじげんイトケのみ", sweet: 25, spicy: 0, sour: 5, bitter: 60, fresh: 0, plus_level: 6, kcal: 200, flavor_rank: 90 },
  { name: "いじげんソクノのみ", sweet: 0, spicy: 5, sour: 60, bitter: 25, fresh: 0, plus_level: 7, kcal: 160, flavor_rank: 90 },
  { name: "いじげんリンドのみ", sweet: 15, spicy: 55, sour: 0, bitter: 5, fresh: 25, plus_level: 9, kcal: 210, flavor_rank: 100 },
  { name: "いじげんヤチェのみ", sweet: 25, spicy: 0, sour: 5, bitter: 15, fresh: 55, plus_level: 7, kcal: 250, flavor_rank: 100 },
  { name: "いじげんヨプのみ", sweet: 55, spicy: 5, sour: 15, bitter: 25, fresh: 0, plus_level: 6, kcal: 250, flavor_rank: 100 },
  { name: "いじげんビアーのみ", sweet: 0, spicy: 15, sour: 25, bitter: 55, fresh: 5, plus_level: 7, kcal: 270, flavor_rank: 100 },
  { name: "いじげんシュカのみ", sweet: 5, spicy: 25, sour: 55, bitter: 0, fresh: 15, plus_level: 8, kcal: 230, flavor_rank: 100 },
  { name: "いじげんバコウのみ", sweet: 10, spicy: 95, sour: 0, bitter: 10, fresh: 5, plus_level: 10, kcal: 240, flavor_rank: 120 },
  { name: "いじげんウタンのみ", sweet: 5, spicy: 0, sour: 10, bitter: 10, fresh: 95, plus_level: 8, kcal: 300, flavor_rank: 120 },
  { name: "いじげんタンガのみ", sweet: 95, spicy: 10, sour: 10, bitter: 5, fresh: 0, plus_level: 7, kcal: 300, flavor_rank: 120 },
  { name: "いじげんヨロギのみ", sweet: 0, spicy: 10, sour: 5, bitter: 95, fresh: 10, plus_level: 8, kcal: 330, flavor_rank: 120 },
  { name: "いじげんカシブのみ", sweet: 10, spicy: 5, sour: 95, bitter: 0, fresh: 10, plus_level: 9, kcal: 270, flavor_rank: 120 },
  { name: "いじげんハバンのみ", sweet: 85, spicy: 0, sour: 0, bitter: 0, fresh: 65, plus_level: 8, kcal: 370, flavor_rank: 150 },
  { name: "いじげんナモのみ", sweet: 0, spicy: 0, sour: 65, bitter: 0, fresh: 85, plus_level: 9, kcal: 370, flavor_rank: 150 },
  { name: "いじげんリリバのみ", sweet: 0, spicy: 0, sour: 65, bitter: 85, fresh: 0, plus_level: 9, kcal: 400, flavor_rank: 150 },
  { name: "いじげんホズのみ", sweet: 0, spicy: 85, sour: 0, bitter: 65, fresh: 0, plus_level: 9, kcal: 370, flavor_rank: 150 },
  { name: "いじげんロゼルのみ", sweet: 0, spicy: 65, sour: 85, bitter: 0, fresh: 0, plus_level: 10, kcal: 340, flavor_rank: 150 },
];

const DONUT_REQUIREMENTS = [
  { name: "ナイトメアクルーラー", pokemon: "ダークライ", sweet: 310, spicy: 100, sour: 310, bitter: 40, fresh: 40, image: "NightmareCruller.webp" },
  { name: "オールドファッションアルファ", pokemon: "カイオーガ", sweet: 50, spicy: 50, sour: 210, bitter: 180, fresh: 370, image: "Old-FashionedAlpha.webp" },
  { name: "オールドファッションオメガ", pokemon: "グラードン", sweet: 260, spicy: 160, sour: 160, bitter: 20, fresh: 260, image: "Old-FashionedOmega.webp" },
  { name: "オールドファッションデルタ", pokemon: "レックウザ", sweet: 120, spicy: 40, sour: 340, bitter: 40, fresh: 390, image: "Old-FashionedDelta.webp" },
  { name: "プラズマディップ", pokemon: "ゼラオラ", sweet: 40, spicy: 200, sour: 400, bitter: 280, fresh: 40, image: "PlasmaDip.webp" },
];

const FLAVOR_POWERS = {
  sweet: ["オヤブンパワー", "でかでかパワー", "ちびちびパワー", "かがやきパワー"],
  spicy: ["こうげきパワー", "とくこうパワー", "すばやさパワー", "わざパワー"],
  sour: [
    "どっさりパワー",
    "どうぐパワー：とくべつ",
    "どうぐパワー：きのみ",
    "どうぐパワー：ボール",
    "どうぐパワー：アメ",
    "どうぐパワー：コイン",
    "どうぐパワー：おたから",
    "メガパワー：チャージ",
    "メガパワー：ながもち"
  ],
  bitter: ["めんえきパワー", "ぼうぎょパワー", "とくぼうパワー"],
  fresh: ["ほかくパワー", "そうぐうパワー"]
};
const BERRY_STAR_POOLS = [
  {
    "id": "star1",
    "label": "★1",
    "stars": [1],
    "items": [
      { "key": "ijigen_kurabo", "name": "いじげんクラボのみ" },
      { "key": "ijigen_kago", "name": "いじげんカゴのみ" },
      { "key": "ijigen_momon", "name": "いじげんモモンのみ" },
      { "key": "ijigen_chigo", "name": "いじげんチーゴのみ" },
      { "key": "ijigen_nanashi", "name": "いじげんナナシのみ" }
    ]
  },
  {
    "id": "star2",
    "label": "★2",
    "stars": [2],
    "items": [
      { "key": "ijigen_oren", "name": "いじげんオレンのみ" },
      { "key": "ijigen_key", "name": "いじげんキーのみ" },
      { "key": "ijigen_ramu", "name": "いじげんラムのみ" },
      { "key": "ijigen_obon", "name": "いじげんオボンのみ" }
    ]
  },
  {
    "id": "star3",
    "label": "★3",
    "stars": [3],
    "items": [
      { "key": "ijigen_zaroku", "name": "いじげんザロクのみ" },
      { "key": "ijigen_nekobu", "name": "いじげんネコブのみ" },
      { "key": "ijigen_taporu", "name": "いじげんタポルのみ" },
      { "key": "ijigen_rome", "name": "いじげんロメのみ" },
      { "key": "ijigen_ubu", "name": "いじげんウブのみ" },
      { "key": "ijigen_matoma", "name": "いじげんマトマのみ" },
      { "key": "ijigen_okka", "name": "いじげんオッカのみ" },
      { "key": "ijigen_itoke", "name": "いじげんイトケのみ" },
      { "key": "ijigen_sokuno", "name": "いじげんソクノのみ" }
    ]
  },
  {
    "id": "star45",
    "label": "★4-5",
    "stars": [4, 5],
    "items": [
      { "key": "ijigen_rindo", "name": "いじげんリンドのみ" },
      { "key": "ijigen_yache", "name": "いじげんヤチェのみ" },
      { "key": "ijigen_yopu", "name": "いじげんヨプのみ" },
      { "key": "ijigen_bia", "name": "いじげんビアーのみ" },
      { "key": "ijigen_shuka", "name": "いじげんシュカのみ" },
      { "key": "ijigen_bakou", "name": "いじげんバコウのみ" },
      { "key": "ijigen_utan", "name": "いじげんウタンのみ" },
      { "key": "ijigen_tanga", "name": "いじげんタンガのみ" },
      { "key": "ijigen_yorogi", "name": "いじげんヨロギのみ" },
      { "key": "ijigen_kashibu", "name": "いじげんカシブのみ" },
      { "key": "ijigen_haban", "name": "いじげんハバンのみ" },
      { "key": "ijigen_namo", "name": "いじげんナモのみ" },
      { "key": "ijigen_ririba", "name": "いじげんリリバのみ" },
      { "key": "ijigen_hoz", "name": "いじげんホズのみ" },
      { "key": "ijigen_rozel", "name": "いじげんロゼルのみ" }
    ]
  }
];

// Assign stars to BERRIES
(function () {
  const starMap = new Map();
  BERRY_STAR_POOLS.forEach(pool => {
    // Determine the max star in this pool for simplicity, or just use the first one if we treat them as a group
    // The request separates 4-5, but let's assign the specific star value if possible or just use the pool's primary star.
    // Actually, "stars": [4, 5] implies berries could be 4 or 5.
    // However, the input just groups them. Let's assign the pool's ID or max star?
    // Let's just flag them with the pool's stars.
    // Simpler: Just map name -> stars array.
    pool.items.forEach(item => {
      starMap.set(item.name, pool.stars);
    });
  });

  BERRIES.forEach(berry => {
    if (starMap.has(berry.name)) {
      berry.stars = starMap.get(berry.name);
    } else {
      berry.stars = []; // Normal berries have no stars (or treat as star 0?)
    }
  });
})();
