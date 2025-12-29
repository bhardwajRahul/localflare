import { useState } from "react"
import { NavLink } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Database02Icon,
  HardDriveIcon,
  Folder01Icon,
  Layers01Icon,
  TaskDone01Icon,
  Settings02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { bindingsApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    icon: Database02Icon,
    label: "D1 Databases",
    path: "/d1",
    color: "text-blue-500",
  },
  {
    icon: HardDriveIcon,
    label: "KV Namespaces",
    path: "/kv",
    color: "text-green-500",
  },
  {
    icon: Folder01Icon,
    label: "R2 Buckets",
    path: "/r2",
    color: "text-purple-500",
  },
  {
    icon: Layers01Icon,
    label: "Durable Objects",
    path: "/do",
    color: "text-yellow-500",
  },
  {
    icon: TaskDone01Icon,
    label: "Queues",
    path: "/queues",
    color: "text-pink-500",
  },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { data: bindings } = useQuery({
    queryKey: ["bindings"],
    queryFn: bindingsApi.getAll,
  })

  const getBindingCount = (type: string) => {
    if (!bindings) return 0
    switch (type) {
      case "/d1":
        return bindings.bindings.d1.length
      case "/kv":
        return bindings.bindings.kv.length
      case "/r2":
        return bindings.bindings.r2.length
      case "/do":
        return bindings.bindings.durableObjects.length
      case "/queues":
        return bindings.bindings.queues.producers.length
      default:
        return 0
    }
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-200",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!isCollapsed && (
          <NavLink to="/" className="flex items-center gap-2">
            <svg
              className="size-7"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" rx="20" className="fill-primary" />
              <path d="M20 75 L20 45 L32 45 L32 75 Z" fill="white" />
              <path d="M38 75 L38 30 L50 30 L50 75 Z" fill="white" />
              <path d="M56 75 L56 55 L68 55 L68 75 Z" fill="white" />
              <path d="M74 75 L74 20 L86 20 L86 75 Z" fill="white" />
            </svg>
            <div>
              <span className="text-sm font-semibold">LocalFlare</span>
              {bindings?.name && (
                <p className="text-xs text-muted-foreground truncate max-w-32">
                  {bindings.name}
                </p>
              )}
            </div>
          </NavLink>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="size-8"
        >
          <HugeiconsIcon
            icon={isCollapsed ? ArrowRight01Icon : ArrowLeft01Icon}
            size={16}
            strokeWidth={2}
          />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const count = getBindingCount(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                    isCollapsed && "justify-center",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <HugeiconsIcon
                  icon={item.icon}
                  className={cn("size-4", item.color)}
                  strokeWidth={2}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className="text-[10px] bg-muted-foreground/20 px-1.5 py-0.5 rounded">
                        {count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
              isCollapsed && "justify-center",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <HugeiconsIcon icon={Settings02Icon} className="size-4" strokeWidth={2} />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
        {!isCollapsed && (
          <p className="mt-2 px-2 text-[10px] text-muted-foreground">
            LocalFlare v0.0.1
          </p>
        )}
      </div>
    </aside>
  )
}
