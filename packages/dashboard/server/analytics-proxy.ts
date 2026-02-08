// Server-side analytics proxy for Vite dev mode
// Calls Cloudflare's Analytics Engine API directly — no local worker needed

import type { Plugin } from "vite"
import type { IncomingMessage, ServerResponse } from "http"

const CF_API = "https://api.cloudflare.com/client/v4/accounts"

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk: Buffer) => (body += chunk.toString()))
    req.on("end", () => resolve(body))
    req.on("error", reject)
  })
}

function substituteParams(query: string, params?: Record<string, string | number>): string {
  if (!params) return query
  let result = query
  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{{${key}}}`
    const re = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    if (typeof value === "string") {
      const isInterval = /^'\d+'\s+(SECOND|MINUTE|HOUR|DAY|WEEK|MONTH|YEAR)$/i.test(value)
      result = result.replace(re, isInterval ? value : `'${value.replace(/'/g, "''")}'`)
    } else {
      result = result.replace(re, String(value))
    }
  }
  return result
}

async function runSql(accountId: string, apiToken: string, sql: string) {
  const res = await fetch(`${CF_API}/${accountId}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "text/plain" },
    body: sql,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{
    data: Record<string, unknown>[]
    meta: { name: string; type: string }[]
    rows: number
    rows_before_limit_at_least: number
  }>
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(data))
}

export function analyticsProxy(): Plugin {
  return {
    name: "analytics-proxy",
    configureServer(server) {
      server.middlewares.use("/api/analytics", async (req: IncomingMessage, res: ServerResponse) => {
        const accountId = req.headers["x-cf-account-id"] as string
        const apiToken = req.headers["x-cf-api-token"] as string
        const path = req.url || "/"

        if (path === "/health") return json(res, 200, { status: "ok", hasCredentials: Boolean(accountId && apiToken) })
        if (!accountId || !apiToken) return json(res, 400, { error: "Missing credentials" })

        try {
          let sql = ""
          if (path === "/datasets") sql = "SHOW TABLES"
          else if (path.match(/^\/datasets\/(.+)\/schema$/)) sql = `SELECT * FROM ${decodeURIComponent(path.split("/")[2])} LIMIT 1`
          else if (path === "/query" && req.method === "POST") {
            const body = JSON.parse(await readBody(req))
            sql = substituteParams(body.query, body.params)
          } else return json(res, 404, { error: "Not found" })

          const result = await runSql(accountId, apiToken, sql)

          if (path === "/datasets") {
            const datasets = (result.data || []).map((r) => ({ id: (r.name || Object.values(r)[0]) as string, name: (r.name || Object.values(r)[0]) as string }))
            return json(res, 200, { datasets })
          }
          if (path.match(/^\/datasets\/(.+)\/schema$/)) {
            return json(res, 200, { datasetId: decodeURIComponent(path.split("/")[2]), columns: (result.meta || []).map((c) => ({ name: c.name, type: c.type })) })
          }
          return json(res, 200, { data: result.data || [], meta: result.meta || [], rowCount: result.rows || 0, totalRows: result.rows_before_limit_at_least || result.rows || 0 })
        } catch (e) {
          return json(res, 500, { error: "Request failed", message: String(e) })
        }
      })
    },
  }
}
