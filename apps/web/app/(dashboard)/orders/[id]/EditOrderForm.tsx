"use client"

import { useState, useTransition } from "react"
import { updateOrderWeb } from "./actions"

const ORDER_STATUSES = ["waiting_payment", "paid", "processing", "completed", "cancelled", "refunded"]
const PAYMENT_STATUSES = ["pending", "paid", "expired", "failed"]

interface Props {
  orderId: string
  current: {
    orderStatus: string
    paymentStatus: string
    robloxUsername: string | null
    priceIdr: number
    robuxAmount: number
  }
}

export function EditOrderForm({ orderId, current }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const [orderStatus, setOrderStatus] = useState(current.orderStatus)
  const [paymentStatus, setPaymentStatus] = useState(current.paymentStatus)
  const [robloxUsername, setRobloxUsername] = useState(current.robloxUsername ?? "")
  const [priceIdr, setPriceIdr] = useState(String(current.priceIdr))
  const [robuxAmount, setRobuxAmount] = useState(String(current.robuxAmount))
  const [note, setNote] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await updateOrderWeb(orderId, {
        orderStatus,
        paymentStatus,
        robloxUsername,
        priceIdr: Number(priceIdr),
        robuxAmount: Number(robuxAmount),
        note,
      })
      setResult({ ok: res.success, text: res.message })
      if (res.success) setNote("")
    })
  }

  const selectClass = "w-full h-9 px-2 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
  const inputClass = "w-full h-9 px-3 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-zinc-600"

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-1.5 rounded-md border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
      >
        {open ? "Tutup" : "✏ Edit"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Edit Order</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Status Order</label>
              <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={selectClass}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Status Bayar</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={selectClass}>
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Harga (IDR)</label>
              <input
                type="number"
                value={priceIdr}
                onChange={(e) => setPriceIdr(e.target.value)}
                min={0}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Robux</label>
              <input
                type="number"
                value={robuxAmount}
                onChange={(e) => setRobuxAmount(e.target.value)}
                min={0}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Roblox Username</label>
            <input
              type="text"
              value={robloxUsername}
              onChange={(e) => setRobloxUsername(e.target.value)}
              placeholder="Username Roblox buyer"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Catatan (opsional, ditambah ke log)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Status dikoreksi manual oleh admin"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
            {result && (
              <span className={`text-xs ${result.ok ? "text-green-400" : "text-red-400"}`}>
                {result.ok ? "✓" : "✗"} {result.text}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
