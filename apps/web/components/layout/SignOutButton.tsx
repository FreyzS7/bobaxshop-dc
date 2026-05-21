"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut size={14} className="mr-1" />
      Keluar
    </Button>
  )
}
