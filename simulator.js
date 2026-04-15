/**
 * 星レベルごとの消費率テーブル
 */
const ENERGY_CONSUMPTION_RATES = {
    1: 1.0,
    2: 1.6,
    3: 3.5,
    4: 7.5,
    5: 10.0
};

/**
 * Total Flavor Rank から補正係数と星の数を算出する
 * @param {number} totalFlavorRank 
 * @returns {Object} { factor, stars }
 */
function getCorrectionFactor(totalFlavorRank) {
    if (totalFlavorRank >= 960) return { factor: 1.5, stars: 5 };
    if (totalFlavorRank >= 700) return { factor: 1.4, stars: 4 };
    if (totalFlavorRank >= 360) return { factor: 1.3, stars: 3 };
    if (totalFlavorRank >= 240) return { factor: 1.2, stars: 2 };
    if (totalFlavorRank >= 120) return { factor: 1.1, stars: 1 };
    return { factor: 1.0, stars: 0 };
}

/**
 * 8つのきのみからドーナツの結果を計算する
 * @param {Array} selectedBerries 
 * @param {number} minVal 判定の閾値 (デフォルト420)
 * @returns {Object} 計算結果
 */
function calculateDonutResult(selectedBerries, minVal = 420) {
    if (selectedBerries.length === 0) {
        return null;
    }

    const totals = {
        sweet: 0,
        spicy: 0,
        sour: 0,
        bitter: 0,
        fresh: 0,
        plus_level: 0,
        kcal: 0,
        flavor_rank: 0
    };

    selectedBerries.forEach(berry => {
        totals.sweet += berry.sweet;
        totals.spicy += berry.spicy;
        totals.sour += berry.sour;
        totals.bitter += berry.bitter;
        totals.fresh += berry.fresh;
        totals.plus_level += berry.plus_level;
        totals.kcal += berry.kcal;
        totals.flavor_rank += berry.flavor_rank;
    });

    // ミックスドーナツの判定: フレーバーの最大値が2つ以上同じ
    const flavors = ['sweet', 'spicy', 'sour', 'bitter', 'fresh'];
    const values = flavors.map(f => totals[f]);
    const maxVal = Math.max(...values);
    const isMixDonut = maxVal > 0 && values.filter(v => v === maxVal).length >= 2;

    const { factor, stars } = getCorrectionFactor(totals.flavor_rank);

    // 補正後のステータス
    const finalLevel = Math.floor(totals.plus_level * factor);
    const finalKcal = Math.floor(totals.kcal * factor);

    // 名前付きドーナツの判定
    let donutName = "";
    if (isMixDonut) {
        donutName = "ミックスドーナツ";
    } else {
        const flavorNames = {
            sweet: "スイートドーナツ",
            spicy: "スパイシードーナツ",
            sour: "サワードーナツ",
            bitter: "ビタードーナツ",
            fresh: "フレッシュドーナツ"
        };
        const dominantFlavor = flavors.find(f => totals[f] === maxVal);
        donutName = flavorNames[dominantFlavor] || "普通のドーナツ";
    }
    let pokemon = null;

    for (const req of DONUT_REQUIREMENTS) {
        if (
            totals.sweet >= req.sweet &&
            totals.spicy >= req.spicy &&
            totals.sour >= req.sour &&
            totals.bitter >= req.bitter &&
            totals.fresh >= req.fresh
        ) {
            donutName = req.name;
            pokemon = req.pokemon;
            break;
        }
    }

    // 目的別サフィックスの付与 (Lv3パワーに基づく)
    let suffix = "";
    if (isMixDonut) {
        // ミックスの場合、指定された下限以上の構成要素で判定
        const highFlavors = flavors.filter(f => totals[f] >= minVal);
        if (highFlavors.includes('sweet') && highFlavors.includes('fresh')) {
            suffix = "(色違い厳選用)";
        } else if (highFlavors.includes('sour') && highFlavors.includes('fresh')) {
            suffix = "(きのみ/ボール集め用)";
        } else if (highFlavors.includes('spicy') && highFlavors.includes('bitter')) {
            suffix = "(戦闘・レイド用)";
        }
    } else {
        // 単独の場合、700以上の要素で判定
        const highFlavors = flavors.filter(f => totals[f] >= 700);
        if (highFlavors.includes('sweet')) suffix = "(かがやきパワー特化)";
        if (highFlavors.includes('sour')) suffix = "(どうぐパワー特化)";
        if (highFlavors.includes('spicy')) suffix = "(こうげきパワー特化)";
        if (highFlavors.includes('bitter')) suffix = "(ぼうぎょパワー特化)";
        if (highFlavors.includes('fresh')) suffix = "(ほかくパワー特化)";
    }

    if (suffix) {
        donutName += ` ${suffix}`;
    }

    return {
        totals,
        factor,
        finalLevel,
        finalKcal,
        donutName,
        pokemon,
        isMixDonut,
        powers: calculateFlavorPowers(totals, isMixDonut),
        stars,
        duration: stars > 0 ? Math.floor(finalKcal / ENERGY_CONSUMPTION_RATES[stars]) : 0
    };
}

/**
 * フレーバーの値から候補となるパワーを計算する
 * @param {Object} totals 
 * @param {boolean} isMixDonut
 * @returns {Array} パワー候補のリスト
 */
function calculateFlavorPowers(totals, isMixDonut) {
    const powerCandidates = [];
    const flavors = ['sweet', 'spicy', 'sour', 'bitter', 'fresh'];
    const sum = flavors.reduce((acc, f) => acc + totals[f], 0);

    flavors.forEach(flavor => {
        const val = totals[flavor];
        if (val <= 0) return;

        let levelDisplay = "0";
        let levelNum = 0;

        if (isMixDonut) {
            // ミックスドーナツの特別ルール: 420以上でLv3の可能性がある
            if (val >= 420) {
                levelDisplay = "2-3";
                levelNum = 3;
            } else if (val >= 300) {
                levelDisplay = "2";
                levelNum = 2;
            } else if (val >= 100) {
                levelDisplay = "1";
                levelNum = 1;
            }
        } else {
            // 通常のルール
            if (val >= 500) {
                levelDisplay = "2-3";
                levelNum = 3;
            } else if (val >= 300) {
                levelDisplay = "2";
                levelNum = 2;
            } else if (val >= 100) {
                levelDisplay = "1";
                levelNum = 1;
            }
        }




        if (levelNum > 0) {
            const ratio = sum > 0 ? (val / sum) : 0;
            const powers = FLAVOR_POWERS[flavor];

            powers.forEach(name => {
                let display = levelDisplay;

                // ミックス(420+) または 単体(700+) の場合、特定のパワーにゆらぎがある、あるいは全体的にゆらぎがある
                // User said: "700以上でも... Lv2-Lv3の間で出る" -> implies ALL powers or specific ones?
                // Context usually implies "Kagayaki" etc might be 3, but others 2.
                // But the user's message is general: "Lv2-Lv3の間で出る".
                // I will set the base display to 2-3 for >= 700.

                // Special override cleanup:
                if (isMixDonut && val >= 420) {
                    if (name.includes("でかでか") || name.includes("ちびちび") || name.includes("オヤブン") ||
                        name.includes("ほかく") || name.includes("そうぐう") || name.includes("どうぐ") || name.includes("メガ") ||
                        name.includes("こうげき") || name.includes("とくこう") || name.includes("すばやさ") || name.includes("わざ") ||
                        name.includes("めんえき") || name.includes("ぼうぎょ") || name.includes("とくぼう")) {
                        display = "2-3";
                    } else {
                        display = "3";
                    }
                }
                // For Single > 700, if we want to mimic the mix logic (some guaranteed, some not), we need more info.
                // But the user instruction "Lv2-Lv3の間で出る" suggests the *result* varies.
                // So "2-3" is the correct safe display. 

                // However, if I change levelDisplay to "2-3" above, I don't need to do anything here unless I want to FORCE "3" for some.
                // Previous logic for Mix 420 was: base "2-3", but override specific to "3".

                // Let's check the Mix logic again.
                // Mix 420+: levelDisplay="2-3". Override: "3" for non-size, "2-3" for size.

                // If Single 700+ follows Mix 420+ logic:
                // We should probably apply the same "Size = 2-3, Others = 3" logic OR just plain 2-3 for everything.
                // Given "Lv3だけでなく...出る", it sounds like a warning that it's NOT stable.
                // I will apply "2-3" to all for Single > 700 to be safe, unless it matches the Mix pattern.
                // Let's assume the user wants the display to reflect the uncertainty.



                powerCandidates.push({
                    name,
                    level: display,
                    levelNum: levelNum,
                    flavor,
                    ratio,
                    score: val * ratio
                });
            });
        }
    });

    return powerCandidates.sort((a, b) => b.score - a.score);
}

/**
 * ドーナツの組み合わせを探索する（旧ミックス検索）
 * ミックスドーナツまたは通常ドーナツを探します。
 * @param {Array} targetFlavors 揃えたい1〜2つのフレーバー ['sweet', 'fresh'] など
 * @param {number} minVal 目標とする最低値 (420または700が目安)
 * @param {number} iterations 試行回数
 * @param {Array} targetStars 対象のスターランク (空の場合はフィルタなし)
 * @returns {Array} 結果のリスト
 */
function findDonutCombinations(targetFlavors, minVal = 0, iterations = 100000, targetStars = [], maximizeDuration = false, targetRequirement = null, excludeBerryNames = []) {
    const results = [];
    const flavors = ['sweet', 'spicy', 'sour', 'bitter', 'fresh'];
    const f1 = targetFlavors[0];
    const f2 = targetFlavors.length > 1 ? targetFlavors[1] : null;

    // Filter berries by star rank if specified
    const sourceBerries = (targetStars.length > 0)
        ? BERRIES.filter(b => b.stars && b.stars.some(s => targetStars.includes(s)))
        : BERRIES;

    // 除外するきのみ名が指定されている場合はフィルタリング
    const filteredBerries = (excludeBerryNames.length > 0)
        ? sourceBerries.filter(b => !excludeBerryNames.includes(b.name))
        : sourceBerries;

    // プール作成: ターゲット要件がある場合は、要件で必要とされるフレーバーを持つきのみを優先
    let pool;
    if (targetRequirement) {
        // 要件で必要なフレーバー (>0) をリストアップ
        const requiredFlavors = flavors.filter(f => targetRequirement[f] > 0);
        // それらのフレーバーを持つきのみを抽出
        pool = filteredBerries.filter(b => requiredFlavors.some(f => b[f] > 0))
            .sort((a, b) => {
                // 必要フレーバーの合計値が高い順
                const valA = requiredFlavors.reduce((sum, f) => sum + a[f], 0);
                const valB = requiredFlavors.reduce((sum, f) => sum + b[f], 0);
                return valB - valA;
            });
    } else {
        // 既存ロジック
        pool = filteredBerries.filter(b => b[f1] > 0 || (f2 && b[f2] > 0))
            .sort((a, b) => {
                const valA = a[f1] + (f2 ? a[f2] : 0);
                const valB = b[f1] + (f2 ? b[f2] : 0);
                return valB - valA;
            });
    }

    // 多様性を保ちつつ、無関係なきのみを減らして精度を上げる
    let finalPool;
    if (targetRequirement) {
        // 特定ドーナツ検索の場合、高ランクのきのみが必須級であることが多いので、
        // 上位プールを広めにとるが、低ランクのノイズは減らす
        // ただ、伝説系は合計値が非常に高いので、Flavor Rankが高いきのみを中心に構成する必要がある
        const highRankReqPool = pool.filter(b => b.flavor_rank >= 30);
        finalPool = highRankReqPool.length > 10 ? highRankReqPool : pool;
    } else if (maximizeDuration) {
        finalPool = pool.sort((a, b) => b.plus_level - a.plus_level).slice(0, Math.ceil(pool.length * 0.8));
    } else {
        const mainPoolCandidate = pool.slice(0, Math.ceil(pool.length * 0.7));
        finalPool = mainPoolCandidate.length > 0 ? mainPoolCandidate : filteredBerries;
    }

    for (let i = 0; i < iterations; i++) {
        const selected = [];
        const rand = Math.random();

        // 選択戦略: 特定要件がある場合は、構築的なアプローチを優先
        if (targetRequirement) {
            // Strategy 4: Constructive Selection (Target Requirement Mode)
            // 不足しているステータスを埋めるように1つずつ選んでいく
            let currentTotals = { sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 0 };
            // 最初の1個はランダム（ただしプール内から）
            let firstBerry = finalPool[Math.floor(Math.random() * finalPool.length)];
            selected.push(firstBerry);
            ['sweet', 'spicy', 'sour', 'bitter', 'fresh'].forEach(f => currentTotals[f] += firstBerry[f]);

            for (let j = 0; j < 6; j++) { // 残り6個（最後1個はGap Closerに残す）
                // 現在の不足分を計算
                let deficits = {};
                let maxDeficit = -9999;

                ['sweet', 'spicy', 'sour', 'bitter', 'fresh'].forEach(f => {
                    let diff = targetRequirement[f] - currentTotals[f];
                    deficits[f] = diff;
                    if (diff > maxDeficit) {
                        maxDeficit = diff;
                    }
                });

                if (maxDeficit <= 0) {
                    // もう要件は満たしそうなので、Rankが高いものやPlusLevelが高いものを選ぶ
                    selected.push(finalPool[Math.floor(Math.random() * finalPool.length)]);
                } else {
                    // 候補選定
                    let candidates = finalPool.map(b => {
                        let score = 0;
                        ['sweet', 'spicy', 'sour', 'bitter', 'fresh'].forEach(f => {
                            if (deficits[f] > 0) {
                                score += Math.min(deficits[f], b[f]); // 不足分までを評価
                            }
                        });
                        // 味覚レベルが高いものやPlusLevelが高いものに少しボーナス
                        score += b.flavor_rank * 0.1;
                        return { berry: b, score: score };
                    });

                    candidates.sort((a, b) => b.score - a.score);

                    // 上位10%または上位5件からランダム
                    let pickCount = Math.max(3, Math.floor(candidates.length * 0.1));
                    let pickPool = candidates.slice(0, pickCount);
                    selected.push(pickPool[Math.floor(Math.random() * pickPool.length)].berry);
                }

                // Totals更新
                let last = selected[selected.length - 1];
                ['sweet', 'spicy', 'sour', 'bitter', 'fresh'].forEach(f => currentTotals[f] += last[f]);
            }
        } else {
            // ... 既存の戦略ブロック (変更なし) ...
            if (rand < 0.4) {
                const baseBerry = finalPool[Math.floor(Math.random() * finalPool.length)];
                const count = Math.floor(Math.random() * 7) + 1;  // 7個まで同じきのみを選ぶように変更（8個目も同じになる可能性あり）
                for (let j = 0; j < count; j++) selected.push(baseBerry);
                while (selected.length < 7) {
                    selected.push(finalPool[Math.floor(Math.random() * finalPool.length)]);
                }
            }
            else if (rand < 0.7) {
                const count = 7;
                const subPool = finalPool.slice(0, 8);
                for (let k = 0; k < count; k++) {
                    selected.push(subPool[Math.floor(Math.random() * subPool.length)]);
                }
            }
            else {
                let sourcePool;
                if (maximizeDuration && Math.random() < 0.6) {
                    const highPlusPool = finalPool.filter(b => b.plus_level >= 8);
                    sourcePool = highPlusPool.length > 3 ? highPlusPool : finalPool;
                } else {
                    const highRankPool = finalPool.filter(b => b.flavor_rank >= 80);
                    sourcePool = highRankPool.length > 5 ? highRankPool : finalPool;
                }

                for (let j = 0; j < 7; j++) {
                    selected.push(sourcePool[Math.floor(Math.random() * sourcePool.length)]);
                }
            }
        }

        // 8個目のきのみ調整 (Gap Closer)
        let s_totals = { sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 0 };
        selected.forEach(b => flavors.forEach(f => s_totals[f] += b[f]));

        let gapClosers = [];

        if (targetRequirement) {
            // 要件に対する不足分を計算
            // 最も不足しているフレーバー、あるいは不足しているフレーバーの合計を補えるきのみを探す
            // 各フレーバーごとの不足値
            const deficits = {};
            let maxDeficit = -9999;
            let maxDeficitFlavor = '';

            flavors.forEach(f => {
                const diff = targetRequirement[f] - s_totals[f];
                deficits[f] = diff;
                if (diff > maxDeficit) {
                    maxDeficit = diff;
                    maxDeficitFlavor = f;
                }
            });

            // ターゲット要件を満たすために最も貢献するきのみを探す
            // 単純化: 不足している全フレーバーに対して、最も効率よく数値を足せるきのみ
            // 不足しているフレーバーの値の合計が大きい順にソートして候補にする
            gapClosers = sourceBerries.filter(b => {
                // 少なくとも1つの不足フレーバーを補えること
                return flavors.some(f => deficits[f] > 0 && b[f] > 0);
            }).sort((a, b) => {
                // 不足分に対する貢献度スコア (過剰分は評価しない、不足分を埋めるのを優先)
                const scoreA = flavors.reduce((acc, f) => acc + (deficits[f] > 0 ? Math.min(deficits[f], a[f]) : 0), 0);
                const scoreB = flavors.reduce((acc, f) => acc + (deficits[f] > 0 ? Math.min(deficits[f], b[f]) : 0), 0);
                return scoreB - scoreA;
            }).slice(0, 5); // 上位5件

        } else if (f2) {
            // ミックス狙い
            let s_f1 = s_totals[f1];
            let s_f2 = s_totals[f2];
            const diff = s_f1 - s_f2;
            gapClosers = sourceBerries.filter(b => (b[f2] - b[f1]) === diff);
        } else {
            // 単独狙い
            gapClosers = sourceBerries.filter(b => b[f1] > 0).sort((a, b) => b[f1] - a[f1]).slice(0, 5);

            // 8個目も同じきのみが選ばれる可能性を追加
            // 既に選んだきのみの中で最も多く使われているものを取得
            const berryCounts = {};
            let maxBerry = null;
            let maxCount = 0;
            selected.forEach(b => {
                berryCounts[b.name] = (berryCounts[b.name] || 0) + 1;
                if (berryCounts[b.name] > maxCount) {
                    maxCount = berryCounts[b.name];
                    maxBerry = b;
                }
            });

            // 7個までに同じきのみを多く選んでいる場合、8個目も同じきのみが選ばれる可能性を追加
            if (maxBerry && maxCount >= 3 && Math.random() < 0.5) {
                gapClosers.unshift(maxBerry); // 候補の先頭に追加して選ばれやすくする
            }
        }

        if (gapClosers.length > 0) {
            let targetCloser;
            if (maximizeDuration && !f2 && !targetRequirement) {
                const top2 = gapClosers.slice(0, 5).sort((a, b) => b.plus_level - a.plus_level).slice(0, 2);
                targetCloser = top2[Math.floor(Math.random() * top2.length)];
            } else {
                targetCloser = gapClosers[Math.floor(Math.random() * gapClosers.length)];
            }
            selected.push(targetCloser);

            // 合計計算
            const finalTotals = { sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 0, flavor_rank: 0, kcal: 0, plus_level: 0 };
            selected.forEach(b => {
                flavors.forEach(f => finalTotals[f] += b[f]);
                finalTotals.flavor_rank += b.flavor_rank;
                finalTotals.kcal += b.kcal;
                finalTotals.plus_level += b.plus_level;
            });

            // 判定
            let isValid = false;

            if (targetRequirement) {
                // 全ての要件を満たしているかチェック
                isValid = flavors.every(f => finalTotals[f] >= targetRequirement[f]);
            } else {
                const maxVal = Math.max(...flavors.map(f => finalTotals[f]));
                // isTargetMax is redundant if we check values directly, but good for focus
                const isTargetMax = finalTotals[f1] === maxVal || (f2 && finalTotals[f2] === maxVal);

                if (isTargetMax) {
                    if (maximizeDuration) {
                        if (f2) { if (finalTotals[f1] === finalTotals[f2] && finalTotals[f1] >= minVal) isValid = true; }
                        else { if (finalTotals[f1] >= minVal) isValid = true; }
                    } else {
                        if (f2 && finalTotals[f1] === finalTotals[f2] && finalTotals[f1] >= 420) isValid = true;
                        else if (finalTotals[f1] >= 700) isValid = true;
                        else if (f2 && finalTotals[f2] >= 700) isValid = true;
                    }
                }
            }

            if (isValid) {
                const result = calculateDonutResult(selected);
                let totalScore;
                if (maximizeDuration) {
                    totalScore = result.duration;
                } else if (targetRequirement) {
                    // 特定ドーナツの場合、要件ギリギリよりも余裕がある方が良いか？
                    // あるいはカロリー/持続時間を評価するか。
                    // 伝説ドーナツは基本的につくるのが難しいので見つかるだけで御の字だが、
                    // 評価軸として「余分なコストが少ない」あるいは「プラスレベルが高い」などを入れる。
                    // ここではデフォルト同様、RankとPlusLevelで評価する。
                    totalScore = finalTotals.flavor_rank + (finalTotals.plus_level * 10) + (finalTotals.kcal / 10);
                } else {
                    totalScore = finalTotals.flavor_rank + (finalTotals.plus_level * 10) + (finalTotals.kcal / 10);
                }

                results.push({
                    berries: [...selected],
                    totals: { ...finalTotals },
                    finalKcal: result.finalKcal,
                    finalLevel: result.finalLevel,
                    stars: result.stars,
                    totalScore: totalScore
                });
            }
        }
    }

    // 重複を排除
    const uniqueResults = [];
    const seen = new Set();
    for (const res of results) {
        const key = res.berries.map(b => b.name).sort().join('|');
        if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push(res);
        }
    }

    return uniqueResults
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10);
}

