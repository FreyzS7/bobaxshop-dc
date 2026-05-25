import { getGuild } from "@bobaxshop/database"
import { notFound } from "next/navigation"
import Header from "@/components/layout/Header"
import { GuildConfigForm } from "./GuildConfigForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function GuildConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guild = await getGuild(id)
  if (!guild) notFound()

  return (
    <>
      <Header title={`Config — ${guild.name}`} />
      <main className="flex-1 p-6 max-w-3xl space-y-5">
        <Link href="/guilds" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          Kembali ke Guilds
        </Link>
        <GuildConfigForm guild={guild} />
      </main>
    </>
  )
}
