import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { validator } from 'hono/validator'

// ===== 型定義 =====

type Bindings = {
  DB: D1Database
  ADMIN_KEY: string
  ASSETS: Fetcher
}

type Env = { Bindings: Bindings }

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

// ===== バリデーション =====

const requireString = (val: unknown, field: string): string => {
  if (typeof val !== 'string' || val.trim() === '') {
    throw new HTTPException(400, { message: `${field} is required` })
  }
  return val.trim()
}

// ===== API ルーター =====

const api = new Hono<Env>()

// --- レシピ登録 / カウントインクリメント ---
api.post(
  '/register',
  validator('json', (body) => {
    const key = requireString(body.key, 'key')
    const name = requireString(body.name, 'name')
    const berries = body.berries
    if (!Array.isArray(berries) || berries.length === 0) {
      throw new HTTPException(400, { message: 'berries must be a non-empty array' })
    }
    return { key, name, berries: berries as string[] }
  }),
  async (c) => {
    const { key, name, berries } = c.req.valid('json')

    await c.env.DB.prepare(`
      INSERT INTO recipes (key, name, berries, count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(key) DO UPDATE SET count = count + 1
    `)
      .bind(key, name, JSON.stringify(berries))
      .run()

    return c.json({ ok: true })
  }
)

// --- コメント投稿 ---
api.post(
  '/comments',
  validator('json', (body) => {
    const recipe_key = requireString(body.recipe_key, 'recipe_key')
    const user_name = requireString(body.user_name, 'user_name')
    const comment = requireString(body.comment, 'comment')

    if (user_name.length > 20) {
      throw new HTTPException(400, { message: 'user_name must be 20 chars or less' })
    }
    if (comment.length > 200) {
      throw new HTTPException(400, { message: 'comment must be 200 chars or less' })
    }

    return { recipe_key, user_name, comment }
  }),
  async (c) => {
    const { recipe_key, user_name, comment } = c.req.valid('json')
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(`
      INSERT INTO comments (recipe_key, user_name, comment, created_at)
      VALUES (?, ?, ?, ?)
    `)
      .bind(recipe_key, user_name, comment, now)
      .run()

    return c.json({ ok: true }, 201)
  }
)

// --- コメント一覧取得 ---
api.get(
  '/comments',
  validator('query', (query) => {
    const key = requireString(query.key, 'key')
    return { key }
  }),
  async (c) => {
    const { key } = c.req.valid('query')

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM comments WHERE recipe_key = ? ORDER BY created_at DESC
    `)
      .bind(key)
      .all<CommentRow>()

    return c.json(results)
  }
)

// --- [Admin] コメント削除 ---
api.delete('/admin/comments/:id', async (c) => {
  const authHeader = c.req.header('Authorization')
  const adminKey = c.env.ADMIN_KEY

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const id = c.req.param('id')

  await c.env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run()

  return c.json({ ok: true })
})

// --- 人気ランキング取得（上位10件） ---
api.get('/ranking', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM recipes ORDER BY count DESC LIMIT 10
  `).all<RecipeRow>()

  return c.json(results)
})

// ===== メインアプリ =====

const app = new Hono<Env>()

// API をマウント
app.route('/api', api)

// グローバルエラーハンドラ
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// 静的アセット（HTML / CSS / JS / 画像）を ASSETS バインディング経由で配信
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
