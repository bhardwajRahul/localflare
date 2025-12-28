import { Miniflare } from 'miniflare'
import { resolve, dirname } from 'node:path'
import * as esbuild from 'esbuild'
import { parseWranglerConfig, discoverBindings, getBindingSummary } from './config.js'
import type { LocalFlareOptions, DiscoveredBindings, WranglerConfig } from './types.js'

export class LocalFlare {
  private mf: Miniflare | null = null
  private config: WranglerConfig | null = null
  private bindings: DiscoveredBindings | null = null
  private options: Required<LocalFlareOptions>

  constructor(options: LocalFlareOptions = {}) {
    this.options = {
      configPath: options.configPath ?? './wrangler.toml',
      port: options.port ?? 8787,
      dashboardPort: options.dashboardPort ?? 8788,
      persistPath: options.persistPath ?? '.localflare',
      verbose: options.verbose ?? false,
    }
  }

  async start(): Promise<void> {
    const configPath = resolve(this.options.configPath)
    const rootDir = dirname(configPath)

    // Parse wrangler.toml
    this.config = parseWranglerConfig(configPath)
    this.bindings = discoverBindings(this.config)

    // Log discovered bindings
    if (this.options.verbose) {
      console.log('\n📦 Discovered bindings:')
      getBindingSummary(this.bindings).forEach(line => {
        console.log(`   ${line}`)
      })
      console.log('')
    }

    // Build Miniflare options
    const persistRoot = resolve(rootDir, this.options.persistPath)

    // Compile the worker entry point with esbuild
    const entryPoint = resolve(rootDir, this.config.main || 'src/index.ts')
    const buildResult = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm',
      target: 'es2022',
      write: false,
      minify: false,
      sourcemap: false,
      conditions: ['workerd', 'worker', 'browser'],
    })

    const scriptContent = buildResult.outputFiles?.[0]?.text
    if (!scriptContent) {
      throw new Error('Failed to compile worker script')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.mf = new Miniflare({
      wranglerConfigPath: configPath,
      modules: [
        {
          type: 'ESModule',
          path: entryPoint,
          contents: scriptContent,
        },
      ],
      port: this.options.port,
      verbose: this.options.verbose,
      kvPersist: `${persistRoot}/kv`,
      d1Persist: `${persistRoot}/d1`,
      r2Persist: `${persistRoot}/r2`,
      durableObjectsPersist: `${persistRoot}/do`,
      cachePersist: `${persistRoot}/cache`,
    } as any)

    // Wait for Miniflare to be ready
    const url = await this.mf.ready
    console.log(`⚡ Worker running at ${url}`)
  }

  async stop(): Promise<void> {
    if (this.mf) {
      await this.mf.dispose()
      this.mf = null
    }
  }

  // Binding accessors - use generic types for portability
  // Consumers can cast to @cloudflare/workers-types if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getD1Database(bindingName: string): Promise<any> {
    this.ensureRunning()
    return this.mf!.getD1Database(bindingName)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getKVNamespace(bindingName: string): Promise<any> {
    this.ensureRunning()
    return this.mf!.getKVNamespace(bindingName)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getR2Bucket(bindingName: string): Promise<any> {
    this.ensureRunning()
    return this.mf!.getR2Bucket(bindingName)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getDurableObjectNamespace(bindingName: string): Promise<any> {
    this.ensureRunning()
    return this.mf!.getDurableObjectNamespace(bindingName)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getQueueProducer<T = unknown>(bindingName: string): Promise<any> {
    this.ensureRunning()
    return this.mf!.getQueueProducer<T>(bindingName)
  }

  async getAllBindings<T = Record<string, unknown>>(): Promise<T> {
    this.ensureRunning()
    return this.mf!.getBindings() as Promise<T>
  }

  // Getters
  getDiscoveredBindings(): DiscoveredBindings | null {
    return this.bindings
  }

  getConfig(): WranglerConfig | null {
    return this.config
  }

  getOptions(): Required<LocalFlareOptions> {
    return this.options
  }

  getMiniflare(): Miniflare | null {
    return this.mf
  }

  isRunning(): boolean {
    return this.mf !== null
  }

  private ensureRunning(): void {
    if (!this.mf) {
      throw new Error('LocalFlare is not running. Call start() first.')
    }
  }
}
