/**
 * Environment bindings for the Localflare API Worker
 *
 * In sidecar mode, bindings are shared with the user's worker via
 * the same binding IDs in the generated shadow config.
 */

// Manifest passed from CLI via env variable
export interface LocalflareManifest {
  d1: { binding: string; database_name: string }[]
  kv: { binding: string }[]
  r2: { binding: string; bucket_name: string }[]
  queues: {
    producers: { binding: string; queue: string }[]
    consumers: { queue: string; max_batch_size?: number; max_batch_timeout?: number; max_retries?: number; dead_letter_queue?: string }[]
  }
  do: { binding: string; className: string }[]
}

// Dynamic environment type - bindings are added at runtime
export interface Env {
  // Manifest JSON string from CLI
  LOCALFLARE_MANIFEST: string

  // All other properties are dynamic bindings
  [key: string]: D1Database | KVNamespace | R2Bucket | Queue | DurableObjectNamespace | string | undefined
}

// Helper to parse manifest from env
export function getManifest(env: Env): LocalflareManifest {
  try {
    return JSON.parse(env.LOCALFLARE_MANIFEST || '{}')
  } catch {
    return { d1: [], kv: [], r2: [], queues: { producers: [], consumers: [] }, do: [] }
  }
}

// Type guards for bindings
export function isD1Database(binding: unknown): binding is D1Database {
  return binding !== null &&
    typeof binding === 'object' &&
    'prepare' in binding &&
    typeof (binding as D1Database).prepare === 'function'
}

export function isKVNamespace(binding: unknown): binding is KVNamespace {
  return binding !== null &&
    typeof binding === 'object' &&
    'get' in binding &&
    'put' in binding &&
    'list' in binding
}

export function isR2Bucket(binding: unknown): binding is R2Bucket {
  return binding !== null &&
    typeof binding === 'object' &&
    'get' in binding &&
    'put' in binding &&
    'list' in binding &&
    'head' in binding
}

export function isQueue(binding: unknown): binding is Queue {
  return binding !== null &&
    typeof binding === 'object' &&
    'send' in binding &&
    'sendBatch' in binding
}
