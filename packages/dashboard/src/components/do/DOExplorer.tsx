import { useQuery } from '@tanstack/react-query'
import { Layers, RefreshCw } from 'lucide-react'
import { bindingsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DOExplorer() {
  const { data: bindings, isLoading } = useQuery({
    queryKey: ['bindings'],
    queryFn: bindingsApi.getAll,
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const durableObjects = bindings?.bindings.durableObjects ?? []

  if (!durableObjects.length) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-yellow-500" />
              Durable Objects
            </CardTitle>
            <CardDescription>No Durable Objects configured in wrangler.toml</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5 text-yellow-500" />
          Durable Objects
        </h2>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {durableObjects.map((obj) => (
            <Card key={obj.binding}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-yellow-500" />
                  {obj.binding}
                </CardTitle>
                <CardDescription>Class: {obj.class_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Durable Object inspection coming soon. You can interact with DO instances through
                  your worker's fetch handler.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
