import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TaskDone01Icon,
  Loading03Icon,
  Sent02Icon,
} from "@hugeicons/core-free-icons"
import { queuesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function QueuesExplorer() {
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)
  const [messageBody, setMessageBody] = useState("")

  const { data: queues, isLoading } = useQuery({
    queryKey: ["queues"],
    queryFn: queuesApi.list,
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ binding, message }: { binding: string; message: unknown }) =>
      queuesApi.send(binding, message),
    onSuccess: () => {
      setMessageBody("")
    },
  })

  const handleSendMessage = () => {
    if (!selectedQueue || !messageBody.trim()) return

    try {
      const message = JSON.parse(messageBody)
      sendMessageMutation.mutate({ binding: selectedQueue, message })
    } catch {
      // If not valid JSON, send as string
      sendMessageMutation.mutate({ binding: selectedQueue, message: messageBody })
    }
  }

  if (isLoading) {
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

  const producers = queues?.producers ?? []

  if (!producers.length) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon
                icon={TaskDone01Icon}
                className="size-5 text-pink-500"
                strokeWidth={2}
              />
              Queues
            </CardTitle>
            <CardDescription>
              No Queues configured in wrangler.toml
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
            icon={TaskDone01Icon}
            className="size-5 text-pink-500"
            strokeWidth={2}
          />
          Queues
        </h2>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Queue List */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-2 border-b text-xs font-medium text-muted-foreground uppercase">
            Producers
          </div>
          <div className="p-2 space-y-1">
            {producers.map((producer) => (
              <button
                key={producer.binding}
                onClick={() => setSelectedQueue(producer.binding)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2",
                  selectedQueue === producer.binding
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <HugeiconsIcon
                  icon={TaskDone01Icon}
                  className="size-4"
                  strokeWidth={2}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{producer.binding}</div>
                  <div className="text-[10px] opacity-60 truncate">
                    {producer.queue}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {queues?.consumers && queues.consumers.length > 0 && (
            <>
              <div className="p-2 border-t border-b text-xs font-medium text-muted-foreground uppercase">
                Consumers
              </div>
              <div className="p-2 space-y-1">
                {queues.consumers.map((consumer) => (
                  <div
                    key={consumer.queue}
                    className="px-2 py-1.5 rounded text-xs flex items-center gap-2 text-muted-foreground"
                  >
                    <HugeiconsIcon
                      icon={TaskDone01Icon}
                      className="size-4"
                      strokeWidth={2}
                    />
                    {consumer.queue}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedQueue ? (
            <div className="flex-1 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Sent02Icon}
                      className="size-4"
                      strokeWidth={2}
                    />
                    Send Message to {selectedQueue}
                  </CardTitle>
                  <CardDescription>
                    Send a test message to the queue. JSON will be parsed
                    automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium">Message Body</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder='{"type": "test", "data": "hello"}'
                      className="mt-1 w-full min-h-[200px] p-3 rounded-lg border bg-background font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  {sendMessageMutation.isError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                      {String(sendMessageMutation.error)}
                    </div>
                  )}

                  {sendMessageMutation.isSuccess && (
                    <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-xs">
                      Message sent successfully!
                    </div>
                  )}

                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageBody.trim() || sendMessageMutation.isPending}
                  >
                    <HugeiconsIcon
                      icon={Sent02Icon}
                      className="size-4 mr-1"
                      strokeWidth={2}
                    />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a queue to send messages
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
