import { useQuery } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Database02Icon,
  HardDriveIcon,
  Folder01Icon,
  Layers01Icon,
  TaskDone01Icon,
  Settings02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { Link } from "react-router-dom"
import { bindingsApi } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const bindingIcons = {
  D1: { icon: Database02Icon, color: "text-blue-500", bg: "bg-blue-500/10" },
  KV: { icon: HardDriveIcon, color: "text-green-500", bg: "bg-green-500/10" },
  R2: { icon: Folder01Icon, color: "text-purple-500", bg: "bg-purple-500/10" },
  DO: { icon: Layers01Icon, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  Queue: { icon: TaskDone01Icon, color: "text-pink-500", bg: "bg-pink-500/10" },
  Var: { icon: Settings02Icon, color: "text-gray-500", bg: "bg-gray-500/10" },
}

export function Home() {
  const { data: bindings, isLoading, error } = useQuery({
    queryKey: ["bindings"],
    queryFn: bindingsApi.getAll,
  })

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          className="size-8 animate-spin text-muted-foreground"
          strokeWidth={2}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive text-base">
              Connection Error
            </CardTitle>
            <CardDescription>
              Could not connect to LocalFlare server. Make sure it's running on
              port 8788.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto">
              {String(error)}
            </pre>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">Welcome to LocalFlare</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Local dashboard for your Cloudflare Worker:{" "}
            <strong className="text-foreground">{bindings?.name}</strong>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* D1 */}
          {bindings?.bindings.d1 && bindings.bindings.d1.length > 0 && (
            <Link to="/d1">
              <Card className="hover:ring-primary/30 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${bindingIcons.D1.bg}`}>
                    <HugeiconsIcon
                      icon={bindingIcons.D1.icon}
                      className={`size-5 ${bindingIcons.D1.color}`}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-sm">D1 Databases</CardTitle>
                    <CardDescription>
                      {bindings.bindings.d1.length} database(s)
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {bindings.bindings.d1.map((db) => (
                      <div
                        key={db.binding}
                        className="text-xs font-mono text-muted-foreground"
                      >
                        {db.binding}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* KV */}
          {bindings?.bindings.kv && bindings.bindings.kv.length > 0 && (
            <Link to="/kv">
              <Card className="hover:ring-primary/30 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${bindingIcons.KV.bg}`}>
                    <HugeiconsIcon
                      icon={bindingIcons.KV.icon}
                      className={`size-5 ${bindingIcons.KV.color}`}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-sm">KV Namespaces</CardTitle>
                    <CardDescription>
                      {bindings.bindings.kv.length} namespace(s)
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {bindings.bindings.kv.map((kv) => (
                      <div
                        key={kv.binding}
                        className="text-xs font-mono text-muted-foreground"
                      >
                        {kv.binding}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* R2 */}
          {bindings?.bindings.r2 && bindings.bindings.r2.length > 0 && (
            <Link to="/r2">
              <Card className="hover:ring-primary/30 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${bindingIcons.R2.bg}`}>
                    <HugeiconsIcon
                      icon={bindingIcons.R2.icon}
                      className={`size-5 ${bindingIcons.R2.color}`}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-sm">R2 Buckets</CardTitle>
                    <CardDescription>
                      {bindings.bindings.r2.length} bucket(s)
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {bindings.bindings.r2.map((r2) => (
                      <div
                        key={r2.binding}
                        className="text-xs font-mono text-muted-foreground"
                      >
                        {r2.binding}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* DO */}
          {bindings?.bindings.durableObjects &&
            bindings.bindings.durableObjects.length > 0 && (
              <Link to="/do">
                <Card className="hover:ring-primary/30 transition-all cursor-pointer">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className={`p-2.5 rounded-lg ${bindingIcons.DO.bg}`}>
                      <HugeiconsIcon
                        icon={bindingIcons.DO.icon}
                        className={`size-5 ${bindingIcons.DO.color}`}
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Durable Objects</CardTitle>
                      <CardDescription>
                        {bindings.bindings.durableObjects.length} binding(s)
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {bindings.bindings.durableObjects.map((obj) => (
                        <div
                          key={obj.binding}
                          className="text-xs font-mono text-muted-foreground"
                        >
                          {obj.binding}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

          {/* Queues */}
          {bindings?.bindings.queues.producers &&
            bindings.bindings.queues.producers.length > 0 && (
              <Link to="/queues">
                <Card className="hover:ring-primary/30 transition-all cursor-pointer">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className={`p-2.5 rounded-lg ${bindingIcons.Queue.bg}`}>
                      <HugeiconsIcon
                        icon={bindingIcons.Queue.icon}
                        className={`size-5 ${bindingIcons.Queue.color}`}
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Queues</CardTitle>
                      <CardDescription>
                        {bindings.bindings.queues.producers.length} producer(s)
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {bindings.bindings.queues.producers.map((q) => (
                        <div
                          key={q.binding}
                          className="text-xs font-mono text-muted-foreground"
                        >
                          {q.binding}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

          {/* Vars */}
          {bindings?.bindings.vars && bindings.bindings.vars.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-2.5 rounded-lg ${bindingIcons.Var.bg}`}>
                  <HugeiconsIcon
                    icon={bindingIcons.Var.icon}
                    className={`size-5 ${bindingIcons.Var.color}`}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <CardTitle className="text-sm">Environment Variables</CardTitle>
                  <CardDescription>
                    {bindings.bindings.vars.length} variable(s)
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {bindings.bindings.vars.map((v) => (
                    <div
                      key={v.key}
                      className="text-xs font-mono text-muted-foreground"
                    >
                      {v.key}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
