const state = {
    selectedBerries: []
};



// DOM Elements
const berryGrid = document.getElementById('berry-grid');
const selectedList = document.getElementById('selected-list');
const selectionCount = document.getElementById('selection-count');
const donutOutput = document.getElementById('donut-output');
const versionDisplay = document.getElementById('version-display');

/**
 * きのみ一覧を表示する
 */
function renderBerryGrid(filterText = '') {
    berryGrid.innerHTML = '';
    const filteredBerries = BERRIES.filter(berry => {
        if (!filterText) return true;
        const lowerText = filterText.toLowerCase();
        return (
            berry.name.toLowerCase().includes(lowerText) ||
            berry.sweet.toString().includes(lowerText) ||
            berry.spicy.toString().includes(lowerText) ||
            berry.sour.toString().includes(lowerText) ||
            berry.bitter.toString().includes(lowerText) ||
            berry.fresh.toString().includes(lowerText)
        );
    });

    filteredBerries.forEach((berry, index) => {
        const div = document.createElement('div');
        div.className = 'berry-item';
        div.innerHTML = `
            <div class="berry-name">${berry.name}</div>
            <div class="berry-stats">
                <div class="stat-dot" style="background: var(--sweet-color); width: ${berry.sweet / 2}px"></div>
                <div class="stat-dot" style="background: var(--spicy-color); width: ${berry.spicy / 2}px"></div>
                <div class="stat-dot" style="background: var(--sour-color); width: ${berry.sour / 2}px"></div>
                <div class="stat-dot" style="background: var(--bitter-color); width: ${berry.bitter / 2}px"></div>
                <div class="stat-dot" style="background: var(--fresh-color); width: ${berry.fresh / 2}px"></div>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">Rank: ${berry.flavor_rank}</div>
        `;
        div.onclick = () => addBerry(berry);
        berryGrid.appendChild(div);
    });

    if (filteredBerries.length === 0) {
        berryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">見つかりませんでした</p>';
    }
}

/**
 * きのみを追加する
 */
function addBerry(berry) {
    if (state.selectedBerries.length < 8) {
        state.selectedBerries.push(berry);
        updateUI();
    }
}

/**
 * きのみを削除する
 */
function removeBerry(index) {
    state.selectedBerries.splice(index, 1);
    updateUI();
}

/**
 * UI全体を更新する
 */
function updateUI() {
    // 選択件数
    selectionCount.textContent = `(${state.selectedBerries.length}/8)`;

    // 選択済みリスト
    selectedList.innerHTML = '';
    state.selectedBerries.forEach((berry, index) => {
        const div = document.createElement('div');
        div.className = 'selected-berry';
        div.innerHTML = `
            ${berry.name}
            <span class="remove-btn" onclick="this.parentElement.dataset.index='${index}'">×</span>
        `;
        div.querySelector('.remove-btn').onclick = (e) => {
            e.stopPropagation();
            removeBerry(index);
        };
        selectedList.appendChild(div);
    });

    // 結果表示
    if (state.selectedBerries.length > 0) {
        const result = calculateDonutResult(state.selectedBerries);
        if (result) {
            renderResult(result);
            // Title stays static or General
            document.getElementById('comment-card').querySelector('h3').textContent = '💬 みんなの反応';
        }
    } else {
        donutOutput.innerHTML = `
            <div class="donut-placeholder">
                <p>きのみを選んでください<br>(最大8個まで)</p>
            </div>
        `;
        // Berries 0 -> Load GENERAL thread
        loadComments('GENERAL');
        document.getElementById('comment-card').querySelector('h3').textContent = '💬 みんなの反応 (総合)';
    }
}

/**
 * 選択をリセットする
 */
function clearSelection() {
    state.selectedBerries = [];
    updateUI();
}

/**
 * 秒数を分:秒の形式にフォーマットする
 */
function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * 結果をレンダリングする
 */
function renderResult(result) {
    const { totals, factor, finalLevel, finalKcal, duration, donutName, pokemon } = result;

    // フレーバーの最大値を計算（プログレスバー用）
    const maxFlavor = Math.max(totals.sweet, totals.spicy, totals.sour, totals.bitter, totals.fresh, 400);

    // アイコン判定
    let iconPath = 'images/donut_rainbow.png'; // Default to rainbow/mix

    // 名前からサフィックスを除外してベース名を取得 (e.g. "オールドファッションデルタ (色違い厳選用)" -> "オールドファッションデルタ")
    // 日本語のスペース区切りを想定
    const baseDonutName = donutName.split(' ')[0];

    // Check for special donut images first
    const specialDonut = DONUT_REQUIREMENTS.find(d => d.name === baseDonutName);
    if (specialDonut && specialDonut.image) {
        iconPath = `images/${specialDonut.image}`;
    } else {
        // Fallback logic for generic donuts
        // 明示的にマッピングを行う
        if (baseDonutName === 'ミックスドーナツ') {
            iconPath = 'images/donut_rainbow.png';
        } else if (baseDonutName === 'スイートドーナツ') {
            iconPath = 'images/donut_shiny.png';
        } else if (baseDonutName === 'サワードーナツ') {
            iconPath = 'images/donut_sour.png';
        } else if (baseDonutName === 'スパイシードーナツ') {
            iconPath = 'images/donut_spicy.png';
        } else if (baseDonutName === 'ビタードーナツ') {
            iconPath = 'images/donut_bitter.png';
        } else if (baseDonutName === 'フレッシュドーナツ') {
            iconPath = 'images/donut_fresh.png';
        } else if (baseDonutName.includes('かがやき') || baseDonutName.includes('スイート')) {
            // 旧ロジックの互換性維持 (念のため)
            iconPath = 'images/donut_shiny.png';
        } else if (baseDonutName.includes('どうぐ') || baseDonutName.includes('サワー')) {
            iconPath = 'images/donut_sour.png';
        } else if (baseDonutName.includes('こうげき') || baseDonutName.includes('スパイシー')) {
            iconPath = 'images/donut_spicy.png';
        } else if (baseDonutName.includes('ぼうぎょ') || baseDonutName.includes('ビター')) {
            iconPath = 'images/donut_bitter.png';
        } else if (baseDonutName.includes('フレッシュ')) {
            iconPath = 'images/donut_fresh.png';
        } else {
            // Others fallback to rainbow
            iconPath = 'images/donut_rainbow.png';
        }
    }

    // Duration calculation for display
    const rates = {
        1: 1.0,
        2: 1.6,
        3: 3.5,
        4: 7.5,
        5: 10.0
    };
    const durationHTML = [1, 2, 3, 4, 5].map(star => {
        const consumption = rates[star];
        const totalSeconds = Math.floor(finalKcal / consumption);
        const highlightClass = star === 5 ? 'highlight' : '';
        return `
            <div class="duration-box ${highlightClass}">
                <div class="star-label">★${star}</div>
                <div class="time-main">${formatDuration(totalSeconds)}</div>
                <div class="time-sub">${totalSeconds}秒</div>
            </div>
        `;
    }).join('');

    donutOutput.innerHTML = `
        <div class="donut-result ${result.isMixDonut ? 'mix-donut' : ''}">
            ${iconPath ? `<img src="${iconPath}" class="donut-icon" alt="Donut Icon" />` : ''}
            <div class="donut-name">${donutName}</div>
            <div class="pokemon-name">${pokemon ? `for ${pokemon}` : ''}</div>
            ${result.isMixDonut ? '<div class="mix-badge">MIX!</div>' : ''}
            
            <div class="stat-group">
                <div class="stat-box">
                    <div class="stat-value">＋Lv.${finalLevel}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">🔥${finalKcal}kcal</div>
                </div>
            </div>

            <!-- Interdimensional Duration Section -->
            <div style="margin-bottom: 2rem;">
                <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; letter-spacing: 1px;">
                    異次元 滞在時間
                </div>
                <div class="duration-grid">
                    ${durationHTML}
                </div>
                <p class="duration-note">※ 消費レート: ★5 = 10 kcal/秒</p>
            </div>

            <div class="radar-container">
                <canvas id="radar-chart" width="300" height="300"></canvas>
            </div>

            <div class="rank-display">
                <div class="stars">${'★'.repeat(result.stars)}${'☆'.repeat(5 - result.stars)}</div>
                <div class="multiplier">Flavor Rank: ★${result.stars} (×${factor.toFixed(1)})</div>
                <div class="total-score">Total Score: ${totals.flavor_rank}</div>
            </div>

            <div class="flavor-stats">
                ${renderFlavorRow('スイート', totals.sweet, 'var(--sweet-color)', maxFlavor)}
                ${renderFlavorRow('スパイシー', totals.spicy, 'var(--spicy-color)', maxFlavor)}
                ${renderFlavorRow('サワー', totals.sour, 'var(--sour-color)', maxFlavor)}
                ${renderFlavorRow('ビター', totals.bitter, 'var(--bitter-color)', maxFlavor)}
                ${renderFlavorRow('フレッシュ', totals.fresh, 'var(--fresh-color)', maxFlavor)}
            </div>

            ${result.powers && result.powers.length > 0 ? `
                <div class="power-candidates">
                    <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); text-align: center;">
                        候補フレーバーパワー
                    </div>
                    <div class="power-grid">
                        ${result.powers.slice(0, 20).map(p => `
                            <div class="power-tag">
                                <div class="flavor-indicator" style="background: var(--${p.flavor}-color)"></div>
                                <span class="power-name">${p.name}</span>
                                <span class="power-level">Lv.${p.level}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // canvasがDOMに追加された直後に描画
    setTimeout(() => drawRadarChart(totals), 0);
}

function renderFlavorRow(label, value, color, max) {
    const percent = (value / max) * 100;
    return `
        <div class="flavor-row">
            <div class="flavor-label">${label}</div>
            <div class="progress-bg">
                <div class="progress-bar" style="width: ${percent}%; background: ${color}"></div>
            </div>
            <div style="width: 40px; text-align: right; font-weight: 600;">${value}</div>
        </div>
    `;
}

/**
 * レーダーチャートを描画する
 */
function drawRadarChart(totals) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 100;

    // 軸の定義 (スパイシーが真上、時計回り)
    const axes = [
        { label: 'スパイシー', value: totals.spicy, color: '#ef4444' }, // Red
        { label: 'サワー', value: totals.sour, color: '#f97316' },    // Orange
        { label: 'フレッシュ', value: totals.fresh, color: '#22c55e' }, // Green
        { label: 'ビター', value: totals.bitter, color: '#38bdf8' },  // Blue
        { label: 'スイート', value: totals.sweet, color: '#f472b6' }   // Pink
    ];

    const numAxes = axes.length;
    const maxVal = Math.max(...axes.map(a => a.value), 400);

    ctx.clearRect(0, 0, width, height);

    const computedStyle = getComputedStyle(document.body);
    const gridColor = computedStyle.getPropertyValue('--chart-grid').trim() || 'rgba(255, 255, 255, 0.1)';
    const labelColor = computedStyle.getPropertyValue('--chart-label').trim() || '#94a3b8';

    // 背景の五角形 (グリッド)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        const r = (radius / 4) * i;
        for (let j = 0; j < numAxes; j++) {
            const angle = (Math.PI * 2 / numAxes) * j - Math.PI / 2;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // 軸の線
    axes.forEach((axis, i) => {
        const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        ctx.stroke();

        // ラベル
        ctx.fillStyle = labelColor;
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        const labelX = centerX + (radius + 25) * Math.cos(angle);
        const labelY = centerY + (radius + 15) * Math.sin(angle);
        ctx.fillText(axis.label, labelX, labelY);

        // 値
        ctx.fillStyle = axis.color;
        ctx.font = 'bold 14px Inter';
        ctx.fillText(axis.value, labelX, labelY + 16);
    });

    // データプロット
    ctx.beginPath();
    ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    axes.forEach((axis, i) => {
        const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
        const valR = (axis.value / maxVal) * radius;
        const x = centerX + valR * Math.cos(angle);
        const y = centerY + valR * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

/**
 * 検索機能の初期化
 */
/**
 * 検索機能の初期化
 */
function initSearch() {
    const startBtn = document.getElementById('start-search');
    const resultsList = document.getElementById('search-results');
    // Loading element needs to be created or found. HTML has 'search-loading' div?
    // Looking at index.html: <div id="search-loading" class="hidden">...</div> exists.
    const loading = document.getElementById('search-loading');

    // プリセットボタンの初期化
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targets = btn.dataset.targets.split(',');
            const minVal = 0;
            const title = btn.dataset.title;

            // チェックボックスの更新
            const checkboxes = document.querySelectorAll('#flavor-select input[type="checkbox"]');
            const targetFlavors = []; // To store actual flavors to search

            checkboxes.forEach(cb => {
                // If target is specific flavor or 'active' (which seems to map to fresh/sweet/special logic)
                // In presets: "sweet,active" -> active likely meant fresh or just extra.
                // "sour,fresh" -> exact match.

                // Logic: Uncheck all first? No, just set based on targets.
                // Note: 'active' isn't a flavor value.
                if (targets.includes(cb.value)) {
                    cb.checked = true;
                    targetFlavors.push(cb.value);
                } else if (targets.includes('active') && cb.value === 'fresh') {
                    // Assuming 'active' meant 'fresh' for the second preset based on context?
                    // Actually let's just trust the values.
                    cb.checked = false;
                } else {
                    cb.checked = false;
                }
            });

            // Fix for 'active' target if it exists in data
            // The presets were: sour,fresh / sweet,active / spicy,bitter
            // 'active' probably typo for 'fresh' or 'sweet'?
            // "Sweet & Fresh" was title. So sweet,active -> sweet, fresh.
            if (targets.includes('active')) {
                const freshCb = document.querySelector('#flavor-select input[value="fresh"]');
                if (freshCb) {
                    freshCb.checked = true;
                    targetFlavors.push('fresh');
                }
            }

            // 除外するきのみのチェックボックスをクリア
            document.querySelectorAll('#exclude-berries input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });

            // 検索実行
            document.getElementById('search-min-val').value = minVal;
            runSearch(targetFlavors, minVal, title, 10000, [], false, null, []);
        });
    });

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const minVal = parseInt(document.getElementById('search-min-val').value) || 0;

            // 選択されたチェックボックスを取得
            const checkedBoxes = document.querySelectorAll('#flavor-select input[type="checkbox"]:checked');
            const selectedFlavors = Array.from(checkedBoxes).map(cb => cb.value);

            // 特定ドーナツ選択のチェック
            const specificDonutSelect = document.getElementById('specific-donut-select');
            const selectedSpecificDonutName = specificDonutSelect ? specificDonutSelect.value : '';

            // 選択されたスターランクを取得
            const checkedStars = document.querySelectorAll('#star-select input[type="checkbox"]:checked');
            const selectedStars = Array.from(checkedStars).map(cb => parseInt(cb.value));

            // 除外するきのみを取得
            const excludeBerrySelects = document.querySelectorAll('.exclude-berry-select');
            const excludeBerryNames = Array.from(excludeBerrySelects)
                .map(select => select.value)
                .filter(value => value !== '');

            if (selectedFlavors.length === 0 && !selectedSpecificDonutName) {
                alert('フレーバーを1つ以上選ぶか、特定のドーナツを選択してください');
                return;
            }

            const maximizeDuration = document.getElementById('maximize-duration').checked;
            runSearch(selectedFlavors, minVal, '', 10000, selectedStars, maximizeDuration, null, excludeBerryNames);
        });
    }

    /**
     * 探索実行と表示
     */
    function runSearch(flavors, actualMinVal, title = '', iterations = 10000, targetStars = [], maximizeDuration = false, targetRequirement = null, excludeBerryNames = []) {
        if (!resultsList) return;

        if (loading) loading.classList.remove('hidden');
        resultsList.innerHTML = '';

        // 特定ドーナツ選択のチェック
        const specificDonutSelect = document.getElementById('specific-donut-select');
        const selectedSpecificDonutName = specificDonutSelect ? specificDonutSelect.value : '';
        if (selectedSpecificDonutName) {
            targetRequirement = DONUT_REQUIREMENTS.find(d => d.name === selectedSpecificDonutName);
        }
        let searchTitle = title;

        if (selectedSpecificDonutName) {
            targetRequirement = DONUT_REQUIREMENTS.find(d => d.name === selectedSpecificDonutName);
            if (targetRequirement) {
                // 特定ドーナツ検索モード
                // flavors引数等は無視して、この要件に基づく検索を行う
                // タイトルも上書き
                searchTitle = `${selectedSpecificDonutName} の探索結果`;
                // 特定ドーナツの検索は難易度が高いので試行回数を増やす
                iterations = 50000;
                // フレーバー配列は空で渡しても良いが、一応要件から作っておくと安全かもしれない
                // findDonutCombinations側で targetRequirement があれば flavors はあまり使わないようにしたが
                // プール生成などで flavors[0] を参照する箇所が残っている場合は修正が必要
                // 先ほどの simulator.js の変更では pool 生成時に targetRequirement があれば flavors は使わないようにしたので大丈夫。
                // ただし f1, f2 の定義で落ちないように空配列[]で渡す。
                flavors = [];
            }
        }

        if (searchTitle) {
            const titleEl = document.createElement('h4');
            titleEl.style.padding = '0.5rem';
            titleEl.style.color = '#fbbf24'; // Yellow-ish
            titleEl.style.textAlign = 'center';
            titleEl.textContent = `「${searchTitle}」`; // すでに探索結果の文字が入っている場合などは調整
            resultsList.appendChild(titleEl);
        }

        // UIをブロックしないようにsetTimeout
        setTimeout(() => {
            const results = findDonutCombinations(flavors, actualMinVal, iterations, targetStars, maximizeDuration, targetRequirement, excludeBerryNames);
            if (loading) loading.classList.add('hidden');

            if (results.length === 0) {
                resultsList.innerHTML += '<p style="text-align:center; color:var(--text-muted); padding:1rem;">条件に合う組み合わせが見つかりませんでした。再度お試しください。<br>※伝説等の高難易度ドーナツはヒットしにくい場合があります。</p>';
                return;
            }

            results.forEach((res, i) => {
                const item = document.createElement('div');
                item.className = 'search-result-item';

                // ... (既存の表示ロジック) ...
                // 特定ドーナツの場合は表示を少し変える？
                const flavorLabelMap = {
                    sweet: 'Sw',
                    spicy: 'Sp',
                    sour: 'So',
                    bitter: 'Bi',
                    fresh: 'Fr'
                };

                let valLabel = '';
                if (targetRequirement) {
                    // ドーナツ名を表示したいが、res-subに表示されるはず。
                    // ここでは主要なステータスを表示
                    // 全部表示すると長いので、ターゲット要件に含まれる(>0)ものだけ表示
                    valLabel = Object.keys(flavorLabelMap)
                        .filter(f => targetRequirement[f] > 0)
                        .map(f => `${res.totals[f]}${flavorLabelMap[f]}`)
                        .join(' / ');
                } else if (flavors.length === 2) {
                    valLabel = `${res.totals[flavors[0]]} ${flavorLabelMap[flavors[0]]} / ${res.totals[flavors[1]]} ${flavorLabelMap[flavors[1]]}`;
                } else {
                    valLabel = flavors.map(f => `${res.totals[f]} ${flavorLabelMap[f]}`).join(' / ');
                }

                item.innerHTML = `
                    <div class="res-main">
                        <div class="res-val">${valLabel}</div>
                        <div class="res-sub">${res.finalKcal}kcal (${formatDuration(calculateDonutResult(res.berries).duration)}) / Lv.${res.finalLevel} (+${res.totals.plus_level})</div>
                    </div>
                    <div class="res-score">
                        <div class="res-stars">${'★'.repeat(res.stars)}${'☆'.repeat(5 - res.stars)}</div>
                        <div class="res-sub">S:${Math.floor(res.totalScore)} / R:${res.totals.flavor_rank}</div>
                    </div>
                `;
                item.onclick = () => {
                    // Switch tab if needed
                    const tabBtn = document.querySelector('.tab-btn[data-tab="selection"]');
                    if (tabBtn) tabBtn.click();

                    state.selectedBerries = [...res.berries];
                    updateUI();
                    // Scroll to list
                    const selList = document.getElementById('selected-list');
                    if (selList) selList.scrollIntoView({ behavior: 'smooth' });
                };
                resultsList.appendChild(item);
            });

            // 結果リストへスクロール
            resultsList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}



// Help Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelp = document.getElementById('close-help');

    if (helpBtn && helpModal && closeHelp) {
        helpBtn.addEventListener('click', () => {
            helpModal.classList.remove('hidden');
        });

        closeHelp.addEventListener('click', () => {
            helpModal.classList.add('hidden');
        });

        // Close when clicking outside content
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.add('hidden');
            }
        });
    }

    setupTabs();
    initBerrySearch();


    // Check for Admin Mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        state.isAdmin = true;
        // Prompt for Admin Key if not stored (simplified for demo)
        if (!localStorage.getItem('admin_key')) {
            const key = prompt('Enter Admin Key:');
            if (key) localStorage.setItem('admin_key', key);
        }
    }

    // --- Theme Toggle Logic ---
    const themeBtn = document.getElementById('theme-toggle');

    if (localStorage.getItem('theme') === 'light' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: light)').matches)) {
        document.body.classList.add('light-mode');
        if (themeBtn) themeBtn.textContent = '☀️';
    } else {
        if (themeBtn) themeBtn.textContent = '🌙';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLightNow = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLightNow ? 'light' : 'dark');
            themeBtn.textContent = isLightNow ? '☀️' : '🌙';

            // Re-render chart if it exists
            const canvas = document.getElementById('radar-chart');
            if (canvas && state.selectedBerries.length > 0) {
                const result = calculateDonutResult(state.selectedBerries);
                if (result) drawRadarChart(result.totals);
            }
        });
    }
});


// Tab Logic
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate clicked
            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });
}
// --- Comment System ---


let currentRecipeKeyForComments = 'GENERAL';

async function loadComments(recipeKey) {
    // If no key provided, default to GENERAL (or keep current if valid)
    if (!recipeKey) recipeKey = 'GENERAL';

    currentRecipeKeyForComments = recipeKey;
    const commentCard = document.getElementById('comment-card');
    const commentList = document.getElementById('comment-list');

    // Debug display
    const debugEl = document.getElementById('debug-key');
    if (debugEl) debugEl.textContent = `Key: ${recipeKey.substring(0, 10)}...`;

    // commentCard.classList.remove('hidden'); // Always visible now
    commentList.innerHTML = '<p class="loading-text">コメントを読み込み中...</p>';

    try {
        const encodedKey = encodeURIComponent(recipeKey);
        const response = await fetch(`/api/comments?key=${encodedKey}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load comments (${response.status} ${response.statusText}): ${errorText}`);
        }
        const comments = await response.json();

        commentList.innerHTML = '';
        if (comments.length === 0) {
            commentList.innerHTML = '<p class="loading-text">コメントはまだありません</p>';
            return;
        }

        comments.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-header">
                    <span class="comment-name">${escapeHtml(c.user_name)}</span>
                    <span class="comment-date">${new Date(c.created_at * 1000).toLocaleDateString()}</span>
                </div>
                <div class="comment-body">${escapeHtml(c.comment)}</div>
            `;

            // Admin Delete Button
            if (state.isAdmin) {
                const delBtn = document.createElement('button');
                delBtn.className = 'admin-delete-btn';
                delBtn.textContent = '削除';
                delBtn.onclick = () => deleteComment(c.id);
                div.appendChild(delBtn);
            }

            commentList.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        commentList.innerHTML = `<p class="loading-text" style="color: #ef4444;">エラー: ${e.message}<br><small>※ file:// で開いている場合は localhost:8787 で開いてください</small></p>`;
    }
}

async function postComment() {
    const user = document.getElementById('comment-user').value.trim();
    const text = document.getElementById('comment-text').value.trim();

    if (!user || !text || !currentRecipeKeyForComments) {
        alert('名前とコメントを入力してください');
        return;
    }

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipe_key: currentRecipeKeyForComments,
                user_name: user,
                comment: text
            })
        });

        if (response.ok) {
            document.getElementById('comment-text').value = '';
            loadComments(currentRecipeKeyForComments); // Reload
        } else {
            alert('コメントの投稿に失敗しました');
        }
    } catch (e) {
        alert('エラーが発生しました');
    }
}

async function deleteComment(id) {
    if (!confirm('このコメントを削除しますか？')) return;

    const adminKey = localStorage.getItem('admin_key');
    if (!adminKey) {
        alert('Admin Keyが見つかりません');
        return;
    }

    try {
        const response = await fetch(`/api/admin/comments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminKey}` }
        });

        if (response.ok) {
            loadComments(currentRecipeKeyForComments);
        } else {
            alert('削除に失敗しました (認証エラーの可能性)');
        }
    } catch (e) {
        alert('削除エラー');
    }
}

// Utility
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function registerRecipeInDB(berries, donutName) {
    const recipeNames = berries.map(b => b.name).sort();
    const recipeKey = recipeNames.join('|');

    try {
        await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: recipeKey,
                name: donutName,
                berries: recipeNames
            })
        });
        // 登録後にランキングを更新
        fetchRanking();
    } catch (err) {
        console.error('Failed to register recipe:', err);
    }
}

/**
 * グローバルランキングを取得して表示する
 */
async function fetchRanking() {
    const list = document.getElementById('ranking-list');
    if (!list) return;

    try {
        const res = await fetch('/api/ranking');
        const data = await res.json();

        if (data.length === 0) {
            list.innerHTML = '<p class="loading-text">まだランキングデータがありません</p>';
            return;
        }

        list.innerHTML = '';
        data.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `ranking-item rank-${index + 1}`;
            div.innerHTML = `
                <div class="rank-number">${index + 1}</div>
                <div class="rank-info">
                    <span class="rank-name">${item.name}</span>
                    <span class="rank-count">${item.count} shares/saves</span>
                </div>
            `;
            div.onclick = () => {
                const berries = JSON.parse(item.berries);
                state.selectedBerries = berries.map(name =>
                    BERRIES.find(b => b.name === name)
                ).filter(b => b);
                updateUI();
                document.getElementById('selected-list').scrollIntoView({ behavior: 'smooth' });
            };
            list.appendChild(div);
        });
    } catch (err) {
        list.innerHTML = '<p class="loading-text">ランキングの取得に失敗しました</p>';
    }
}


/**
 * レシピを保存する (Local Storage)
 */
function saveRecipe() {
    if (state.selectedBerries.length === 0) {
        alert('保存するきのみを選んでください');
        return;
    }

    const recipeNames = state.selectedBerries.map(b => b.name).sort();
    const recipeKey = recipeNames.join('|');

    // 現在の結果から名前を取得
    const result = calculateDonutResult(state.selectedBerries);
    const donutName = result ? result.donutName : "カスタムドーナツ";

    let saved = JSON.parse(localStorage.getItem('saved_recipes') || '[]');

    // 既に保存されているかチェック
    if (!saved.some(r => r.key === recipeKey)) {
        saved.push({
            id: Date.now(),
            name: donutName,
            key: recipeKey,
            berries: state.selectedBerries.map(b => b.name)
        });
        localStorage.setItem('saved_recipes', JSON.stringify(saved));
        renderSavedRecipes();
    }

    // データベースに登録（人気度アップ）
    registerRecipeInDB(state.selectedBerries, donutName);
    alert('レシピを保存しました！（ランキングに反映されます）');
}

/**
 * TARGETS配列を決定する
 * @param {Object} totals - フレーバーの合計値
 * @param {Object} result - ドーナツ結果
 * @returns {string[]} TARGETS配列
 */
function determineTargets(totals, result) {
    const targets = [];
    const isMix = result.isMixDonut;
    const donutName = result.donutName;

    // ミックスドーナツの場合: 420以上のフレーバーで判定
    // 単独ドーナツの場合: 700以上のフレーバーで判定
    const threshold = isMix ? 420 : 700;

    // ドーナツ名に基づく判定
    if (donutName.includes('色違い') || donutName.includes('かがやき')) {
        targets.push('shiny');
    }
    if (donutName.includes('どうぐ') || donutName.includes('きのみ') || donutName.includes('ボール')) {
        targets.push('tool');
    }

    // フレーバーの値に基づく判定
    if (totals.sweet >= threshold && !targets.includes('shiny')) {
        targets.push('shiny');
    }
    if (totals.sour >= threshold && !targets.includes('tool')) {
        targets.push('tool');
    }

    // デフォルトターゲット
    if (targets.length === 0) {
        targets.push('general');
    }

    return targets;
}

/**
 * 選択中のレシピからマクロスクリプトを作成・ダウンロードする
 */
/**
 * 選択中のレシピからマクロスクリプトを作成・ダウンロードする
 */
/**
 * 選択中のレシピからマクロスクリプトを作成・ダウンロードする
 */
/**
 * 選択中のレシピからマクロスクリプトを作成・ダウンロードする
 */
function downloadScript() {
    if (state.selectedBerries.length === 0) {
        alert("きのみを選んでください");
        return;
    }

    // ドーナツ結果を取得してTARGETSを決定
    const result = calculateDonutResult(state.selectedBerries);
    const targets = determineTargets(result.totals, result);

    // ファイル名を生成 (例: sweet_recipe.py, tool_recipe.py, mix_recipe.py)
    let filename = 'donut_recipe.py';
    if (result.isMixDonut) {
        if (targets.includes('shiny')) {
            filename = 'shiny_recipe.py';
        } else if (targets.includes('tool')) {
            filename = 'tool_recipe.py';
        } else {
            filename = 'mix_recipe.py';
        }
    } else {
        // 単独ドーナツの場合
        const flavors = ['sweet', 'spicy', 'sour', 'bitter', 'fresh'];
        const maxFlavor = flavors.reduce((max, f) =>
            result.totals[f] > result.totals[max] ? f : max
        );
        const filenameMap = {
            sweet: 'sweet_recipe.py',
            spicy: 'spicy_recipe.py',
            sour: 'sour_recipe.py',
            bitter: 'bitter_recipe.py',
            fresh: 'fresh_recipe.py'
        };
        filename = filenameMap[maxFlavor] || 'donut_recipe.py';
    }

    // NAMEの作成（サフィックスを除去）
    let recipeName = result.donutName.split('(')[0].trim();

    // CATEGORYの作成（ドーナツタイプに応じて設定）
    let recipeCategory;
    if (result.isMixDonut) {
        recipeCategory = 'rainbow';
    } else {
        const flavors = ['sweet', 'spicy', 'sour', 'bitter', 'fresh'];
        const maxFlavor = flavors.reduce((max, f) =>
            result.totals[f] > result.totals[max] ? f : max
        );
        const categoryMap = {
            sweet: 'sweet',
            spicy: 'spicy',
            sour: 'sour',
            bitter: 'bitter',
            fresh: 'fresh'
        };
        recipeCategory = categoryMap[maxFlavor] || 'custom';
    }

    // 用途文字列を生成
    let purposeText;
    if (targets.includes('shiny')) {
        purposeText = 'かがやきパワー';
    } else if (targets.includes('tool')) {
        purposeText = 'どうぐパワー';
    } else {
        purposeText = '';
    }

    // 候補フレーバーパワーをグループ化して文字列化
    const powerGroups = new Set();
    result.powers.forEach(power => {
        const name = power.name;
        // 同系統グループ判定
        if (name.startsWith('どうぐパワー：')) {
            powerGroups.add('どうぐパワー');
        } else if (name.startsWith('メガパワー：')) {
            powerGroups.add('メガパワー');
        } else {
            // そのまま追加
            powerGroups.add(name);
        }
    });
    const powersText = Array.from(powerGroups).join('/');

    // きのみごとの個数を集計して文字列を作成
    const counts = {};
    state.selectedBerries.forEach(b => {
        counts[b.name] = (counts[b.name] || 0) + 1;
    });
    const berriesText = Object.entries(counts)
        .map(([name, count]) => `${name}${count}`)
        .join(',');

    // 処理対象リストを作成 (インデックス情報含む)
    const targetBerries = Object.keys(counts).map(name => {
        const index = BERRIES.findIndex(b => b.name === name);
        if (index === -1) return null;
        return {
            name: name,
            count: counts[name],
            index: index
        };
    }).filter(t => t);

    // インデックスの降順でソート (リストの下から順に処理)
    targetBerries.sort((a, b) => b.index - a.index);

    // STEPS配列を生成
    const steps = [];
    let currentIdx = BERRIES.length;

    targetBerries.forEach(t => {
        const moveSteps = currentIdx - t.index;

        // 移動 (Hat.TOP)
        if (moveSteps > 0) {
            steps.push({
                'action': 'pressRep',
                'type': 'Hat.TOP',
                'repeat': moveSteps,
                'duration': 0.05,
                'interval': 0.1
            });
        }

        // 選択 (Button.A)
        steps.push({
            'action': 'pressRep',
            'type': 'Button.A',
            'repeat': t.count,
            'duration': 0.1,
            'interval': 0.1
        });

        // カーソル位置更新
        currentIdx = t.index;
    });

    // Pythonスクリプトを生成（コメントを2行に分割）
    const scriptLines = [
        `# ${recipeName}${purposeText ? ' ' + purposeText : ''}${powersText ? ' ' + powersText : ''}`,
        `# ${berriesText}`,
        'from Commands.Keys import Button, Hat',
        '',
        `NAME = "${recipeName}"`,
        `CATEGORY = "${recipeCategory}"`,
        `TARGETS = ${JSON.stringify(targets)}`,
        '',
        'STEPS = ['
    ];

    steps.forEach(step => {
        const typeValue = step.type.startsWith('Hat.') ? step.type : `Button.${step.type.replace('Button.', '')}`;
        scriptLines.push(`    {'action': '${step.action}', 'type': ${typeValue}, 'repeat': ${step.repeat}, 'duration': ${step.duration}, 'interval': ${step.interval}},`);
    });

    scriptLines.push(']');

    const scriptContent = scriptLines.join('\n');

    // ダウンロード処理
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


/**
 * 保存済みレシピをレンダリングする
 */
function renderSavedRecipes() {
    const container = document.getElementById('saved-recipes-container');
    const list = document.getElementById('saved-recipes-list');
    if (!container || !list) return;

    const saved = JSON.parse(localStorage.getItem('saved_recipes') || '[]');

    if (saved.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    list.innerHTML = '';

    saved.forEach(recipe => {
        const div = document.createElement('div');
        div.className = 'saved-recipe-item';
        div.innerHTML = `
            <span class="saved-recipe-name">${recipe.name}</span>
            <span class="delete-recipe" onclick="deleteRecipe(${recipe.id}, event)">×</span>
        `;
        div.onclick = () => {
            // 名前のリストからきのみオブジェクトを復元
            state.selectedBerries = recipe.berries.map(name =>
                BERRIES.find(b => b.name === name)
            ).filter(b => b);
            updateUI();
            document.getElementById('selected-list').scrollIntoView({ behavior: 'smooth' });
        };
        list.appendChild(div);
    });
}

/**
 * 保存済みレシピを削除する
 */
function deleteRecipe(id, event) {
    event.stopPropagation();
    if (!confirm('このレシピを削除しますか？')) return;

    let saved = JSON.parse(localStorage.getItem('saved_recipes') || '[]');
    saved = saved.filter(r => r.id !== id);
    localStorage.setItem('saved_recipes', JSON.stringify(saved));
    renderSavedRecipes();
}

/**
 * レシピを共有するためのURLを生成・コピーする
 */
/**
 * 共通: 共有用URL生成とDB登録
 */
function prepareShareUrl() {
    if (state.selectedBerries.length === 0) {
        alert('共有するきのみを選んでください');
        return null;
    }

    const result = calculateDonutResult(state.selectedBerries);
    const donutName = result ? result.donutName : "カスタムドーナツ";

    // データベースに登録（人気度アップ）
    registerRecipeInDB(state.selectedBerries, donutName);

    // きのみのインデックスをカンマ区切りで並べる
    const indices = state.selectedBerries.map(b => {
        return BERRIES.findIndex(orig => orig.name === b.name);
    }).join(',');

    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('r', indices);

    // X共有用のテキスト
    const text = `ポケモンZA ドーナツシミュレーターで「${donutName}」を作りました！`;

    return { url: url.toString(), text: text };
}

function copyShareLink() {
    const data = prepareShareUrl();
    if (!data) return;

    navigator.clipboard.writeText(data.url).then(() => {
        alert('共有用URLをコピーしました！ランキングに1点加算されました。');
    }).catch(err => {
        console.error('Copy failed', err);
        alert('URLのコピーに失敗しました');
    });
}

function shareToX() {
    const data = prepareShareUrl();
    if (!data) return;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}&hashtags=ポケモンZA,ドーナツ,レシピ`;
    window.open(shareUrl, '_blank');
}

function shareToLine() {
    const data = prepareShareUrl();
    if (!data) return;
    // LINE encodes text + url
    const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(data.url)}`;
    window.open(shareUrl, '_blank');
}

function shareToFacebook() {
    const data = prepareShareUrl();
    if (!data) return;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
    window.open(shareUrl, '_blank');
}

function downloadImage(canvas) {
    const link = document.createElement('a');
    link.download = 'donut_recipe.png';
    link.href = canvas.toDataURL();
    link.click();
}


/**
 * URLパラメータからレシピを読み込む
 */
function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const recipeParam = params.get('r');

    if (recipeParam) {
        const indices = recipeParam.split(',').map(s => parseInt(s));
        state.selectedBerries = indices
            .map(idx => BERRIES[idx])
            .filter(b => b)
            .slice(0, 8);
        updateUI();
    }
}

// Initial render
renderBerryGrid();
updateUI();
initSearch();
renderSavedRecipes();
loadFromURL();
fetchRanking();
loadComments('GENERAL');
document.getElementById('comment-card').querySelector('h3').textContent = '💬 みんなの反応';
if (versionDisplay) versionDisplay.textContent = APP_VERSION;

/**
 * きのみ検索の初期化
 */
function initBerrySearch() {
    const searchInput = document.getElementById('berry-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        renderBerryGrid(e.target.value);
    });
}

