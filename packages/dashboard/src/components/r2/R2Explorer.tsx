import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, File, RefreshCw, Trash2, Download, Search } from 'lucide-react'
import { r2Api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatBytes, formatDate } from '@/lib/utils'

export function R2Explorer() {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [searchPrefix, setSearchPrefix] = useState('')

  const queryClient = useQueryClient()

  const { data: buckets, isLoading: loadingBuckets } = useQuery({
    queryKey: ['r2-buckets'],
    queryFn: r2Api.list,
  })

  const { data: objects, isLoading: loadingObjects } = useQuery({
    queryKey: ['r2-objects', selectedBucket, searchPrefix],
    queryFn: () => (selectedBucket ? r2Api.getObjects(selectedBucket, searchPrefix || undefined) : null),
    enabled: !!selectedBucket,
  })

  const { data: objectMeta } = useQuery({
    queryKey: ['r2-object-meta', selectedBucket, selectedObject],
    queryFn: () =>
      selectedBucket && selectedObject ? r2Api.getObjectMeta(selectedBucket, selectedObject) : null,
    enabled: !!selectedBucket && !!selectedObject,
  })

  const deleteObjectMutation = useMutation({
    mutationFn: (key: string) => {
      if (!selectedBucket) throw new Error('No bucket selected')
      return r2Api.deleteObject(selectedBucket, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['r2-objects', selectedBucket] })
      setSelectedObject(null)
    },
  })

  const handleDownload = () => {
    if (selectedBucket && selectedObject) {
      window.open(`/api/r2/${selectedBucket}/objects/${encodeURIComponent(selectedObject)}`, '_blank')
    }
  }

  if (loadingBuckets) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!buckets?.buckets.length) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-500" />
              R2 Buckets
            </CardTitle>
            <CardDescription>No R2 buckets configured in wrangler.toml</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-purple-500" />
          R2 Buckets
        </h2>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Bucket & Object List */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-2 border-b text-xs font-medium text-muted-foreground uppercase">
            Buckets
          </div>
          <div className="p-2 space-y-1">
            {buckets.buckets.map((bucket) => (
              <button
                key={bucket.binding}
                onClick={() => {
                  setSelectedBucket(bucket.binding)
                  setSelectedObject(null)
                }}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2',
                  selectedBucket === bucket.binding
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <FolderOpen className="w-4 h-4" />
                {bucket.binding}
              </button>
            ))}
          </div>

          {selectedBucket && (
            <>
              <div className="p-2 border-t border-b">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchPrefix}
                    onChange={(e) => setSearchPrefix(e.target.value)}
                    placeholder="Filter by prefix..."
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="p-2 border-b text-xs font-medium text-muted-foreground uppercase">
                Objects ({objects?.objects.length ?? 0})
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {loadingObjects ? (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    objects?.objects.map((obj) => (
                      <button
                        key={obj.key}
                        onClick={() => setSelectedObject(obj.key)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2',
                          selectedObject === obj.key
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <File className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate flex-1 font-mono">{obj.key}</span>
                        <span className="text-[10px] opacity-60">{formatBytes(obj.size)}</span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Object Details */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedObject && objectMeta ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-medium font-mono text-sm">{selectedObject}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(objectMeta.size)} • Uploaded {formatDate(objectMeta.uploaded)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteObjectMutation.mutate(selectedObject)}
                    disabled={deleteObjectMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Metadata</h4>
                    <div className="p-4 rounded-lg bg-muted font-mono text-sm space-y-1">
                      <div>
                        <span className="text-muted-foreground">ETag:</span> {objectMeta.etag}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Content-Type:</span>{' '}
                        {objectMeta.httpMetadata?.contentType || 'application/octet-stream'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span> {formatBytes(objectMeta.size)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uploaded:</span>{' '}
                        {formatDate(objectMeta.uploaded)}
                      </div>
                    </div>
                  </div>

                  {objectMeta.customMetadata && Object.keys(objectMeta.customMetadata).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Custom Metadata</h4>
                      <div className="p-4 rounded-lg bg-muted font-mono text-sm space-y-1">
                        {Object.entries(objectMeta.customMetadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {selectedBucket ? 'Select an object to view details' : 'Select a bucket to browse objects'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
