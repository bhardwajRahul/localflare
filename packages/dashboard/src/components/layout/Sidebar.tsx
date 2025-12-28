import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Database, HardDrive, FolderOpen, Layers, ListTodo, Settings } from 'lucide-react'
import { bindingsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

const navItems = [
  { icon: Database, label: 'D1 Databases', path: '/d1', color: 'text-blue-500' },
  { icon: HardDrive, label: 'KV Namespaces', path: '/kv', color: 'text-green-500' },
  { icon: FolderOpen, label: 'R2 Buckets', path: '/r2', color: 'text-purple-500' },
  { icon: Layers, label: 'Durable Objects', path: '/do', color: 'text-yellow-500' },
  { icon: ListTodo, label: 'Queues', path: '/queues', color: 'text-pink-500' },
]

export function Sidebar() {
  const { data: bindings } = useQuery({
    queryKey: ['bindings'],
    queryFn: bindingsApi.getAll,
  })

  const getBindingCount = (type: string) => {
    if (!bindings) return 0
    switch (type) {
      case '/d1':
        return bindings.bindings.d1.length
      case '/kv':
        return bindings.bindings.kv.length
      case '/r2':
        return bindings.bindings.r2.length
      case '/do':
        return bindings.bindings.durableObjects.length
      case '/queues':
        return bindings.bindings.queues.producers.length
      default:
        return 0
    }
  }

  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cloudflare-orange flex items-center justify-center">
            <span className="text-white font-bold text-sm">LF</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">LocalFlare</h1>
            <p className="text-xs text-muted-foreground">{bindings?.name ?? 'Loading...'}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const count = getBindingCount(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className={cn('w-4 h-4', item.color)} />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="p-2 border-t">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
