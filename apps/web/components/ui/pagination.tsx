import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
  /** Given a page number, returns the href for that page */
  buildHref: (page: number) => string
}

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null

  // Show at most 5 page buttons around current page
  const delta = 2
  const pages: (number | "...")[] = []

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...")
    }
  }

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <PaginationLink href={page > 1 ? buildHref(page - 1) : null} aria-label="Previous">
        <ChevronLeft size={14} />
      </PaginationLink>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm select-none">
            …
          </span>
        ) : (
          <PaginationLink key={p} href={buildHref(p)} active={p === page}>
            {p}
          </PaginationLink>
        )
      )}

      <PaginationLink href={page < totalPages ? buildHref(page + 1) : null} aria-label="Next">
        <ChevronRight size={14} />
      </PaginationLink>
    </nav>
  )
}

function PaginationLink({
  href,
  children,
  active,
  ...props
}: {
  href: string | null
  children: React.ReactNode
  active?: boolean
  "aria-label"?: string
}) {
  const base = "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors"
  const activeClass = "bg-primary text-primary-foreground font-medium"
  const defaultClass = "text-muted-foreground hover:bg-accent hover:text-foreground"
  const disabledClass = "text-muted-foreground/30 cursor-not-allowed pointer-events-none"

  if (!href) {
    return (
      <span className={cn(base, disabledClass)} {...props}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} className={cn(base, active ? activeClass : defaultClass)} {...props}>
      {children}
    </Link>
  )
}
