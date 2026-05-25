"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface Props {
  guilds: { id: string; name: string | null }[]
  selected: string
}

export function GuildFilter({ guilds, selected }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set("guild", e.target.value)
    } else {
      params.delete("guild")
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <select
      value={selected}
      onChange={onChange}
      className="h-8 px-3 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
    >
      <option value="">Semua Server</option>
      {guilds.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name ?? g.id}
        </option>
      ))}
    </select>
  )
}
