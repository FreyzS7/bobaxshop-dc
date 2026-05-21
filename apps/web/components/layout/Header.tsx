import { auth } from "@/lib/auth"
import SignOutButton from "./SignOutButton"

export default async function Header({ title }: { title: string }) {
  const session = await auth()

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background shrink-0">
      <h1 className="text-foreground font-semibold text-sm md:text-base">{title}</h1>
      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-xs md:text-sm text-muted-foreground hidden sm:block">{session?.user?.name}</span>
        <SignOutButton />
      </div>
    </header>
  )
}
