import { Hono } from 'hono'

// ===== 型定義 =====

type Bindings = {
  DB: D1Database
  ADMIN_KEY: string
  ASSETS: Fetcher
}

type CommentRow = {
  id: number
  recipe_key: string
  user_name: string
  comment: string
  created_at: number
}

type RecipeRow = {
  key: string
  name: string
  berries: string
  count: number
}

type RegisterBody = {
  key: string
  name: string
  berries: string[]
}

type CommentBody = {
  recipe_key: string
  user_name: string
  comment: string
}

// ===== Hono アプリ =====

const app = new Hono<{ Bindings: Bindings }>()

// テーブル自動作成（開発環境の初回起動向け）
app.use('/api/*', async (c, next) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_key TEXT NOT NULL,
        user_name TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run()
  } catch (e) {
    console.error('Table init failed:', e)
  }
  await next()
})

// ===== API Routes =====

// レシピ登録 / カウントインクリメント
app.post('/api/register', async (c) => {
  let body: RegisterBody
  try {
    body = await c.req.json<RegisterBody>()
  } catch {
    return c.text('Invalid JSON', 400)
  }

  const { key, name, berries } = body
  if (!key || !name || !berries) {
    return c.text('Missing fields', 400)
  }

  try {
    await c.env.DB.prepare(`
      INSERT INTO recipes (key, name, berries, count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(key) DO UPDATE SET count = count + 1
    `)
      .bind(key, name, JSON.stringify(berries))
      .run()

    return c.text('OK')
  } catch (err) {
    return c.text((err as Error).message, 500)
  }
})

// コメント投稿
app.post('/api/comments', async (c) => {
  let body: CommentBody
  try {
    body = await c.req.json<CommentBody>()
  } catch {
    return c.text('Invalid JSON', 400)
  }

  const { recipe_key, user_name, comment } = body
  if (!recipe_key || !user_name || !comment) {
    return c.text('Missing fields', 400)
  }

  const now = Math.floor(Date.now() / 1000)

  try {
    await c.env.DB.prepare(`
      INSERT INTO comments (recipe_key, user_name, comment, created_at)
      VALUES (?, ?, ?, ?)
    `)
      .bind(recipe_key, user_name, comment, now)
      .run()

    return c.text('OK')
  } catch (err) {
    return c.text((err as Error).message, 500)
  }
})

// コメント一覧取得
app.get('/api/comments', async (c) => {
  const recipe_key = c.req.query('key')
  if (!recipe_key) {
    return c.text('Missing key', 400)
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM comments WHERE recipe_key = ? ORDER BY created_at DESC
    `)
      .bind(recipe_key)
      .all<CommentRow>()

    return c.json(results)
  } catch (err) {
    return c.text((err as Error).message, 500)
  }
})

// [Admin] コメント削除
// Authorization: Bearer <ADMIN_KEY> ヘッダーが必要
app.delete('/api/admin/comments/:id', async (c) => {
  const adminKey = c.env.ADMIN_KEY
  const authHeader = c.req.header('Authorization')

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return c.text('Unauthorized', 401)
  }

  const id = c.req.param('id')

  try {
    await c.env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run()
    return c.text('Deleted')
  } catch (err) {
    return c.text((err as Error).message, 500)
  }
})

// 人気ランキング取得（上位10件）
app.get('/api/ranking', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM recipes ORDER BY count DESC LIMIT 10
    `).all<RecipeRow>()

    return c.json(results)
  } catch (err) {
    return c.text((err as Error).message, 500)
  }
})

// ===== エクスポート =====
// /api/* は Hono で処理し、それ以外は Cloudflare Assets にフォールスルー

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx)
    }

    // 静的アセット（HTML / CSS / JS / 画像）を ASSETS バインディング経由で配信
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Bindings>
