import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Play, Table, RefreshCw } from 'lucide-react'
import { d1Api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function D1Explorer() {
  const [selectedDb, setSelectedDb] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [sqlQuery, setSqlQuery] = useState('')
  const [queryResult, setQueryResult] = useState<unknown[] | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: databases, isLoading: loadingDatabases } = useQuery({
    queryKey: ['d1-databases'],
    queryFn: d1Api.list,
  })

  const { data: schema } = useQuery({
    queryKey: ['d1-schema', selectedDb],
    queryFn: () => (selectedDb ? d1Api.getSchema(selectedDb) : null),
    enabled: !!selectedDb,
  })

  const { data: tableData, isLoading: loadingTableData } = useQuery({
    queryKey: ['d1-table-data', selectedDb, selectedTable],
    queryFn: () => (selectedDb && selectedTable ? d1Api.getRows(selectedDb, selectedTable) : null),
    enabled: !!selectedDb && !!selectedTable,
  })

  const queryMutation = useMutation({
    mutationFn: ({ sql }: { sql: string }) => {
      if (!selectedDb) throw new Error('No database selected')
      return d1Api.query(selectedDb, sql)
    },
    onSuccess: (data) => {
      setQueryResult(data.results ?? [])
      setQueryError(null)
      queryClient.invalidateQueries({ queryKey: ['d1-table-data'] })
    },
    onError: (error) => {
      setQueryError(String(error))
      setQueryResult(null)
    },
  })

  const handleRunQuery = () => {
    if (sqlQuery.trim()) {
      queryMutation.mutate({ sql: sqlQuery })
    }
  }

  if (loadingDatabases) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!databases?.databases.length) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              D1 Databases
            </CardTitle>
            <CardDescription>No D1 databases configured in wrangler.toml</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          D1 Databases
        </h2>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Database & Table List */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-2 border-b text-xs font-medium text-muted-foreground uppercase">
            Databases
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {databases.databases.map((db) => (
                <div key={db.binding}>
                  <button
                    onClick={() => {
                      setSelectedDb(db.binding)
                      setSelectedTable(null)
                    }}
                    className={cn(
                      'w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2',
                      selectedDb === db.binding ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <Database className="w-4 h-4" />
                    {db.binding}
                  </button>

                  {selectedDb === db.binding && schema?.tables && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {schema.tables.map((table) => (
                        <button
                          key={table.name}
                          onClick={() => setSelectedTable(table.name)}
                          className={cn(
                            'w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2',
                            selectedTable === table.name
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-muted text-muted-foreground'
                          )}
                        >
                          <Table className="w-3 h-3" />
                          {table.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs defaultValue="data" className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="h-10">
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="query">SQL Query</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="data" className="flex-1 m-0 overflow-auto">
              {selectedTable && tableData ? (
                <div className="p-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {tableData.rows[0] &&
                            Object.keys(tableData.rows[0]).map((col) => (
                              <th key={col} className="px-3 py-2 text-left font-medium">
                                {col}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row, i) => (
                          <tr key={i} className="border-t hover:bg-muted/50">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 font-mono text-xs">
                                {val === null ? (
                                  <span className="text-muted-foreground italic">NULL</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  {loadingTableData ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    'Select a table to view data'
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="query" className="flex-1 m-0 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex gap-2">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="SELECT * FROM users LIMIT 10"
                    className="flex-1 min-h-[100px] p-3 rounded-md border bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {selectedDb ? `Database: ${selectedDb}` : 'Select a database first'}
                  </span>
                  <Button
                    onClick={handleRunQuery}
                    disabled={!selectedDb || !sqlQuery.trim() || queryMutation.isPending}
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Run Query
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {queryError && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {queryError}
                  </div>
                )}
                {queryResult && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {queryResult.length > 0
                            ? Object.keys(queryResult[0] as Record<string, unknown>).map((col) => (
                                <th key={col} className="px-3 py-2 text-left font-medium">
                                  {col}
                                </th>
                              ))
                            : null}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.map((row, i) => (
                          <tr key={i} className="border-t hover:bg-muted/50">
                            {Object.values(row as object).map((val, j) => (
                              <td key={j} className="px-3 py-2 font-mono text-xs">
                                {val === null ? (
                                  <span className="text-muted-foreground italic">NULL</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-3 py-2 bg-muted text-xs text-muted-foreground">
                      {queryResult.length} row(s)
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
