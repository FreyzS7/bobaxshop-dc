"use client"

import { useTransition, useState } from "react"
import { saveGuildConfig } from "./actions"
import type { Guild } from "@bobaxshop/database"

interface Props { guild: Guild }

function Field({ label, name, defaultValue, type = "text", placeholder }: {
  label: string
  name: string
  defaultValue?: string | number | null
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

export function GuildConfigForm({ guild }: Props) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await saveGuildConfig(guild.id, fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="Harga & Rate">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Rate Community (IDR per 1000 Robux)" name="robuxRate" defaultValue={guild.robuxRate} placeholder="120000" />
          <Field label="Rate Gamepass (IDR per 1000 Robux)" name="robuxRateGamepass" defaultValue={guild.robuxRateGamepass} placeholder="kosong = sama dengan Community" />
          <Field label="Min Robux" name="minRobux" defaultValue={guild.minRobux} type="number" />
          <Field label="Step Robux (kelipatan)" name="stepRobux" defaultValue={guild.stepRobux} type="number" />
          <Field label="Tax %" name="taxPercent" defaultValue={guild.taxPercent} placeholder="30" />
        </div>
      </Section>

      <Section title="Pembayaran & Status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Metode Pembayaran</label>
            <select
              name="paymentMode"
              defaultValue={guild.paymentMode}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="manual">Manual (QRIS Static)</option>
              <option value="midtrans">Midtrans (QRIS Dinamis)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status Toko</label>
            <select
              name="isOpen"
              defaultValue={String(guild.isOpen)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="true">Open</option>
              <option value="false">Closed</option>
            </select>
          </div>
        </div>
        <Field label="Pesan Status (opsional)" name="statusMessage" defaultValue={guild.statusMessage} placeholder="Contoh: Sedang libur, buka lagi Senin" />
      </Section>

      <Section title="Channel & Kategori Discord">
        <p className="text-xs text-muted-foreground -mt-1">Isi dengan Channel/Category ID dari Discord server.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Channel Order (#order)" name="chOrder" defaultValue={guild.chOrder} placeholder="Channel ID" />
          <Field label="Channel Beli (#buy)" name="chBuy" defaultValue={guild.chBuy} placeholder="Channel ID" />
          <Field label="Channel Logs" name="chLogs" defaultValue={guild.chLogs} placeholder="Channel ID" />
          <Field label="Channel Commands" name="chCommands" defaultValue={guild.chCommands} placeholder="Channel ID" />
          <Field label="Channel Announce" name="chAnnounce" defaultValue={guild.chAnnounce} placeholder="Channel ID" />
          <Field label="Kategori Utama" name="categoryId" defaultValue={guild.categoryId} placeholder="Category ID" />
          <Field label="Kategori Pending Orders" name="pendingCatId" defaultValue={guild.pendingCatId} placeholder="Category ID" />
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        {saved && <span className="text-sm text-green-400">✓ Tersimpan</span>}
      </div>
    </form>
  )
}
