"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Server, Settings, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/guilds", label: "Guilds", icon: Server },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navContent = (
    <nav className="flex-1 p-3 space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        <span className="font-bold text-sidebar-foreground text-lg">BobaxShop</span>
        <button onClick={() => setOpen(!open)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        "md:hidden fixed top-14 left-0 bottom-0 z-20 w-56 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {navContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 min-h-screen bg-sidebar border-r border-sidebar-border flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <span className="font-bold text-sidebar-foreground text-lg">BobaxShop</span>
        </div>
        {navContent}
      </aside>
    </>
  )
}
