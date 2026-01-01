import { Hono } from 'hono'
import type { Env } from '../types.js'
import { getManifest, isD1Database } from '../types.js'

export function createD1Routes() {
  const app = new Hono<{ Bindings: Env }>()

  // Helper to get database from env
  function getDatabase(env: Env, binding: string): D1Database | null {
    const db = env[binding]
    if (isD1Database(db)) {
      return db
    }
    return null
  }

  // List all D1 databases
  app.get('/', async (c) => {
    const manifest = getManifest(c.env)
    return c.json({
      databases: manifest.d1.map((db) => ({
        binding: db.binding,
        database_name: db.database_name,
      })),
    })
  })

  // Get schema for a database
  app.get('/:binding/schema', async (c) => {
    const db = getDatabase(c.env, c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const result = await db.prepare(
        `SELECT name, sql FROM sqlite_master
         WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE '_mf_%'
         ORDER BY name`
      ).all()

      return c.json({ tables: result.results })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Get table info (columns)
  app.get('/:binding/tables/:table', async (c) => {
    const db = getDatabase(c.env, c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')

      // Get column info
      const columnsResult = await db.prepare(`PRAGMA table_info("${tableName}")`).all()

      // Get row count
      const countResult = await db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).first<{ count: number }>()

      return c.json({
        table: tableName,
        columns: columnsResult.results,
        rowCount: countResult?.count ?? 0,
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Query data from a table with pagination
  app.get('/:binding/tables/:table/rows', async (c) => {
    const db = getDatabase(c.env, c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const limit = Number(c.req.query('limit')) || 100
      const offset = Number(c.req.query('offset')) || 0

      const result = await db
        .prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`)
        .bind(limit, offset)
        .all()

      return c.json({
        rows: result.results,
        meta: { limit, offset },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Execute arbitrary SQL query
  app.post('/:binding/query', async (c) => {
    const db = getDatabase(c.env, c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const { sql, params = [] } = await c.req.json<{ sql: string; params?: unknown[] }>()

      if (!sql) {
        return c.json({ error: 'SQL query is required' }, 400)
      }

      // Determine if it's a read or write query
      const isRead = sql.trim().toUpperCase().startsWith('SELECT')

      const stmt = db.prepare(sql)
      const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt

      if (isRead) {
        const result = await boundStmt.all()
        return c.json({
          success: true,
          results: result.results,
          meta: { changes: 0, duration: result.meta?.duration },
        })
      } else {
        const result = await boundStmt.run()
        return c.json({
          success: true,
          meta: {
            changes: result.meta?.changes ?? 0,
            last_row_id: result.meta?.last_row_id,
            duration: result.meta?.duration,
          },
        })
      }
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Insert a row
  app.post('/:binding/tables/:table/rows', async (c) => {
    const db = getDatabase(c.env, c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const data = await c.req.json<Record<string, unknown>>()

      const columns = Object.keys(data)
      const values = Object.values(data)
      const placeholders = columns.map(() => '?').join(', ')

      const sql = `INSERT INTO "${tableName}" (${columns.map((col) => `"${col}"`).join(', ')}) VALUES (${placeholders})`
      const result = await db.prepare(sql).bind(...values).run()

      return c.json({
        success: true,
        meta: {
          changes: result.meta?.changes ?? 0,
          last_row_id: result.meta?.last_row_id,
        },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Update a row
  app.put('/:binding/tables/:table/rows/:id', async (c) => {
    const db = getDatabase(c.env, c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const id = c.req.param('id')
      const data = await c.req.json<Record<string, unknown>>()

      const setClause = Object.keys(data)
        .map((col) => `"${col}" = ?`)
        .join(', ')
      const values = [...Object.values(data), id]

      const sql = `UPDATE "${tableName}" SET ${setClause} WHERE id = ?`
      const result = await db.prepare(sql).bind(...values).run()

      return c.json({
        success: true,
        meta: { changes: result.meta?.changes ?? 0 },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  // Delete a row
  app.delete('/:binding/tables/:table/rows/:id', async (c) => {
    const db = getDatabase(c.env, c.req.param('binding'))
    if (!db) {
      return c.json({ error: 'Database not found' }, 404)
    }

    try {
      const tableName = c.req.param('table')
      const id = c.req.param('id')

      const result = await db.prepare(`DELETE FROM "${tableName}" WHERE id = ?`).bind(id).run()

      return c.json({
        success: true,
        meta: { changes: result.meta?.changes ?? 0 },
      })
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })

  return app
}
