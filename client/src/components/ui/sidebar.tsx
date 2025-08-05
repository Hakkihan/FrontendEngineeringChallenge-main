import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title: string
  defaultCollapsed?: boolean
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, title, defaultCollapsed = false, ...props }, ref) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-2 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-4 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          {!isCollapsed && (
            <h3 className="font-semibold">{title}</h3>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="space-y-2">
            {children}
          </div>
        )}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

export { Sidebar } 