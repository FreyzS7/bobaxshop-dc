import { db } from "@bobaxshop/database"
import { orders } from "@bobaxshop/database"
import { eq, count } from "drizzle-orm"
import Header from "@/components/layout/Header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SetupButton } from "./SetupButton"
import { GuildActions } from "./GuildActions"
import { Server, CheckCircle, Clock, ShoppingCart, Plus, Settings2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`

export default async function GuildsPage() {
  const allGuilds = await db.query.guilds.findMany()

  const guildsWithCount = await Promise.all(
    allGuilds.map(async (guild) => {
      const [result] = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.guildId, guild.id))
      return { ...guild, orderCount: result.count }
    })
  )

  return (
    <>
      <Header title="Guilds" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-muted-foreground text-sm">{guildsWithCount.length} guild terdaftar</p>
          <Button asChild size="sm">
            <a href={INVITE_URL} target="_blank" rel="noopener noreferrer">
              <Plus size={14} />
              Invite Bot
            </a>
          </Button>
        </div>

        {guildsWithCount.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Server size={36} className="text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Belum ada guild terdaftar.</p>
            <p className="text-muted-foreground/50 text-xs mt-1">Klik Invite Bot di atas untuk menambahkan ke server Discord kamu.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {guildsWithCount.map((guild) => (
            <Card key={guild.id} className="p-4 gap-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Server size={14} className="text-muted-foreground shrink-0 mt-px" />
                  <h3 className="text-foreground font-medium text-sm truncate">{guild.name}</h3>
                </div>
                <Badge className={cn(
                  "shrink-0 px-2 py-0.5 rounded-full text-[10px]",
                  guild.isOpen
                    ? "bg-green-500/10 text-green-400"
                    : "bg-destructive/10 text-destructive"
                )}>
                  {guild.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>

              <p className="text-muted-foreground/50 text-[11px] mb-4 pl-[22px] font-mono">{guild.id}</p>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <ShoppingCart size={10} />
                    <span className="text-[10px]">Orders</span>
                  </div>
                  <p className="text-foreground text-sm font-medium">{guild.orderCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] mb-1">Rate</p>
                  <p className="text-foreground text-sm font-medium">
                    {guild.robuxRate ? `Rp ${Number(guild.robuxRate).toLocaleString("id-ID")}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] mb-1">Setup</p>
                  <div className="flex items-center gap-1">
                    {guild.setupDone
                      ? <CheckCircle size={12} className="text-green-400" />
                      : <Clock size={12} className="text-muted-foreground" />
                    }
                    <span className={cn("text-xs", guild.setupDone ? "text-green-400" : "text-muted-foreground")}>
                      {guild.setupDone ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {guild.statusMessage && (
                <p className="text-muted-foreground/50 text-xs mb-3 italic border-l-2 border-border pl-2">
                  {guild.statusMessage}
                </p>
              )}

              {!guild.setupDone && <SetupButton guildId={guild.id} />}
              <div className="flex gap-2 mt-1">
                <div className="flex-1"><GuildActions guildId={guild.id} guildName={guild.name} /></div>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link href={`/guilds/${guild.id}`}>
                    <Settings2 size={13} />
                    Config
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </>
  )
}
