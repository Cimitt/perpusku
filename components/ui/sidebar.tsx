"use client"

import * as React from "react"
import { PanelLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  open: true,
  setOpen: () => {},
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function SidebarProvider({
  children,
  defaultOpen = true,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { defaultOpen?: boolean }) {
  // Selalu gunakan defaultOpen agar SSR dan client match (mencegah hydration error)
  const [open, setOpen] = React.useState(defaultOpen)

  // Setelah mount, sync ke mobile state & listen resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setOpen(false)
      }
    }
    // Initial sync saat mount
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className={cn("flex min-h-dvh w-full", className)} style={style} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsible?: "offcanvas" | "icon" | "none"
}

export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, collapsible = "offcanvas", children, ...props }, ref) => {
    const { open, setOpen } = useSidebar()
    return (
      <>
        {/* Backdrop overlay — hanya muncul di mobile saat sidebar terbuka */}
        {open && (
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          ref={ref}
          data-state={open ? "expanded" : "collapsed"}
          data-collapsible={collapsible}
          className={cn(
            // Base styles
            "group flex h-dvh flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r overflow-hidden",
            // Mobile: fixed overlay with z-index, slide from left
            "fixed top-0 left-0 z-[70] transition-transform duration-300 ease-in-out w-64",
            open ? "translate-x-0" : "-translate-x-full",
            // Desktop: kembali ke mode push (relative position)
            "md:relative md:z-auto md:transition-[width] md:duration-300 md:translate-x-0",
            open
              ? "md:w-64"
              : collapsible === "icon"
              ? "md:w-14"
              : "md:w-0",
            className
          )}
          {...props}
        >
          {children}
        </aside>
      </>
    )
  }
)
Sidebar.displayName = "Sidebar"

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { open, setOpen } = useSidebar()
  return (
    <button
      ref={ref}
      type="button"
      data-sidebar="trigger"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        setOpen(!open)
      }}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-2 py-1", className)} {...props} />
))
SidebarGroup.displayName = "SidebarGroup"

export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar()
  return (
    <div
      ref={ref}
      className={cn(
        "px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/60 transition-[opacity,height] duration-200",
        !open && "opacity-0 h-0 overflow-hidden pointer-events-none",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

export const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-col gap-0.5 list-none p-0 m-0", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("relative list-none", className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

interface SidebarMenuButtonProps {
  asChild?: boolean
  isActive?: boolean
  className?: string
  children?: React.ReactNode
  tooltip?: string
  [key: string]: any
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ asChild = false, isActive = false, className, children, tooltip, ...props }, ref) => {
    const { open, setOpen } = useSidebar()

    // Auto-close sidebar pada mobile saat navigasi
    const handleMobileClose = React.useCallback(() => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setOpen(false)
      }
    }, [setOpen])

    const buttonClass = cn(
      "flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors",
      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
      !open && "justify-center px-0",
      "[&_svg]:size-4 [&_svg]:shrink-0 [&>span]:truncate",
      className
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        className: cn(buttonClass, (children.props as Record<string, unknown>).className as string),
        "data-active": isActive,
        onClick: (e: React.MouseEvent) => {
          // Panggil onClick asli dari child jika ada
          const childOnClick = (children.props as Record<string, unknown>).onClick as ((e: React.MouseEvent) => void) | undefined
          childOnClick?.(e)
          handleMobileClose()
        },
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        data-active={isActive}
        className={buttonClass}
        onClick={(e) => {
          props.onClick?.(e)
          handleMobileClose()
        }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar()
  if (!open) return null
  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5 min-w-5 select-none items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-sidebar-foreground",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuBadge.displayName = "SidebarMenuBadge"
