import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  HardDriveIcon,
  Key01Icon,
  Loading03Icon,
  Add01Icon,
  Delete02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { kvApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export function KVExplorer() {
  const [selectedNs, setSelectedNs] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [searchPrefix, setSearchPrefix] = useState("")
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")

  const queryClient = useQueryClient()

  const { data: namespaces, isLoading: loadingNamespaces } = useQuery({
    queryKey: ["kv-namespaces"],
    queryFn: kvApi.list,
  })

  const { data: keys, isLoading: loadingKeys } = useQuery({
    queryKey: ["kv-keys", selectedNs, searchPrefix],
    queryFn: () =>
      selectedNs ? kvApi.getKeys(selectedNs, searchPrefix || undefined) : null,
    enabled: !!selectedNs,
  })

  const { data: keyValue } = useQuery({
    queryKey: ["kv-value", selectedNs, selectedKey],
    queryFn: () =>
      selectedNs && selectedKey ? kvApi.getValue(selectedNs, selectedKey) : null,
    enabled: !!selectedNs && !!selectedKey,
  })

  const setValueMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => {
      if (!selectedNs) throw new Error("No namespace selected")
      return kvApi.setValue(selectedNs, key, value)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kv-keys", selectedNs] })
      setNewKey("")
      setNewValue("")
    },
  })

  const deleteKeyMutation = useMutation({
    mutationFn: (key: string) => {
      if (!selectedNs) throw new Error("No namespace selected")
      return kvApi.deleteKey(selectedNs, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kv-keys", selectedNs] })
      setSelectedKey(null)
    },
  })

  if (loadingNamespaces) {
    return (
      <div className="p-6 flex items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          className="size-6 animate-spin text-muted-foreground"
          strokeWidth={2}
        />
      </div>
    )
  }

  if (!namespaces?.namespaces.length) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon
                icon={HardDriveIcon}
                className="size-5 text-green-500"
                strokeWidth={2}
              />
              KV Namespaces
            </CardTitle>
            <CardDescription>
              No KV namespaces configured in wrangler.toml
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <HugeiconsIcon
            icon={HardDriveIcon}
            className="size-5 text-green-500"
            strokeWidth={2}
          />
          KV Namespaces
        </h2>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Namespace & Key List */}
        <div className="w-72 border-r flex flex-col">
          <div className="p-2 border-b text-xs font-medium text-muted-foreground uppercase">
            Namespaces
          </div>
          <div className="p-2 space-y-1">
            {namespaces.namespaces.map((ns) => (
              <button
                key={ns.binding}
                onClick={() => {
                  setSelectedNs(ns.binding)
                  setSelectedKey(null)
                }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2",
                  selectedNs === ns.binding
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <HugeiconsIcon
                  icon={HardDriveIcon}
                  className="size-4"
                  strokeWidth={2}
                />
                {ns.binding}
              </button>
            ))}
          </div>

          {selectedNs && (
            <>
              <div className="p-2 border-t border-b">
                <div className="relative">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <Input
                    value={searchPrefix}
                    onChange={(e) => setSearchPrefix(e.target.value)}
                    placeholder="Filter by prefix..."
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="p-2 border-b text-xs font-medium text-muted-foreground uppercase">
                Keys ({keys?.keys.length ?? 0})
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {loadingKeys ? (
                    <div className="flex justify-center py-4">
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="size-4 animate-spin text-muted-foreground"
                        strokeWidth={2}
                      />
                    </div>
                  ) : (
                    keys?.keys.map((key) => (
                      <button
                        key={key.name}
                        onClick={() => setSelectedKey(key.name)}
                        className={cn(
                          "w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 font-mono",
                          selectedKey === key.name
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <HugeiconsIcon
                          icon={Key01Icon}
                          className="size-3 shrink-0"
                          strokeWidth={2}
                        />
                        <span className="truncate">{key.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedKey && keyValue ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-medium font-mono text-xs">{selectedKey}</h3>
                  {keyValue.metadata ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Metadata: {JSON.stringify(keyValue.metadata)}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteKeyMutation.mutate(selectedKey)}
                  disabled={deleteKeyMutation.isPending}
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    className="size-4 mr-1"
                    strokeWidth={2}
                  />
                  Delete
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <pre className="p-4 rounded-lg bg-muted font-mono text-xs whitespace-pre-wrap break-all">
                  {typeof keyValue.value === "string"
                    ? keyValue.value
                    : JSON.stringify(keyValue.value, null, 2)}
                </pre>
              </div>
            </div>
          ) : selectedNs ? (
            <div className="flex-1 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Add01Icon}
                      className="size-4"
                      strokeWidth={2}
                    />
                    Add New Key
                  </CardTitle>
                </CardHeader>
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <label className="text-xs font-medium">Key</label>
                    <Input
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="my-key"
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Value</label>
                    <textarea
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter value..."
                      className="mt-1 w-full min-h-[150px] p-3 rounded-lg border bg-background font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <Button
                    onClick={() =>
                      setValueMutation.mutate({ key: newKey, value: newValue })
                    }
                    disabled={!newKey || !newValue || setValueMutation.isPending}
                  >
                    <HugeiconsIcon
                      icon={Add01Icon}
                      className="size-4 mr-1"
                      strokeWidth={2}
                    />
                    Add Key
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a namespace to browse keys
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
