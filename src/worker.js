export default {
    async fetch(request, env) {
        // Auto-create table for dev environment resilience
        try {
            await env.DB.prepare(`CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_key TEXT NOT NULL, user_name TEXT NOT NULL, comment TEXT NOT NULL, created_at INTEGER DEFAULT (strftime('%s', 'now')));`).run();
        } catch (e) {
            console.error('Table init failed:', e);
        }

        const url = new URL(request.url);

        // TODO: 実際の案件ではバリデーションやリレートリミットを検討
        if (url.pathname === '/api/register' && request.method === 'POST') {
            try {
                const { key, name, berries } = await request.json();
                if (!key || !name || !berries) {
                    return new Response('Missing fields', { status: 400 });
                }

                // ON CONFLICTでcountをインクリメント
                await env.DB.prepare(`
          INSERT INTO recipes (key, name, berries, count)
          VALUES (?, ?, ?, 1)
          ON CONFLICT(key) DO UPDATE SET count = count + 1
        `).bind(key, name, JSON.stringify(berries)).run();

                return new Response('OK', { status: 200 });
            } catch (err) {
                return new Response(err.message, { status: 500 });
            }
        }

        // コメント投稿
        if (url.pathname === '/api/comments' && request.method === 'POST') {
            try {
                const { recipe_key, user_name, comment } = await request.json();
                if (!recipe_key || !user_name || !comment) {
                    return new Response('Missing fields', { status: 400 });
                }

                const now = Math.floor(Date.now() / 1000);
                await env.DB.prepare(`
                    INSERT INTO comments (recipe_key, user_name, comment, created_at)
                    VALUES (?, ?, ?, ?)
                `).bind(recipe_key, user_name, comment, now).run();

                return new Response('OK', { status: 200 });
            } catch (err) {
                return new Response(err.message, { status: 500 });
            }
        }

        // コメント取得
        if (url.pathname === '/api/comments' && request.method === 'GET') {
            const recipe_key = url.searchParams.get('key');
            if (!recipe_key) {
                return new Response('Missing key', { status: 400 });
            }

            try {
                const { results } = await env.DB.prepare(`
                    SELECT * FROM comments WHERE recipe_key = ? ORDER BY created_at DESC
                `).bind(recipe_key).all();

                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err) {
                return new Response(err.message, { status: 500 });
            }
        }

        // [Admin] コメント削除
        if (url.pathname.startsWith('/api/admin/comments/') && request.method === 'DELETE') {
            // 簡易認証: Bearer Token
            const authHeader = request.headers.get('Authorization');
            const adminKey = env.ADMIN_KEY; // wrangler.toml で設定する環境変数

            if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
                return new Response('Unauthorized', { status: 401 });
            }

            const id = url.pathname.split('/').pop();
            if (!id) {
                return new Response('Missing ID', { status: 400 });
            }

            try {
                await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
                return new Response('Deleted', { status: 200 });
            } catch (err) {
                return new Response(err.message, { status: 500 });
            }
        }

        if (url.pathname === '/api/ranking' && request.method === 'GET') {
            try {
                const { results } = await env.DB.prepare(`
          SELECT * FROM recipes ORDER BY count DESC LIMIT 10
        `).all();

                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err) {
                return new Response(err.message, { status: 500 });
            }
        }

        // API以外は静的アセットを返す (undefinedを返すとデフォルトのアセットサーバーが起動)
        return undefined;
    }
};
