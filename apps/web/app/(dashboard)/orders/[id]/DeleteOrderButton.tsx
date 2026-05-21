"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { deleteOrder } from "./actions"

export function DeleteOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await deleteOrder(orderId)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
      >
        <Trash2 size={14} />
        Hapus Order
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => !loading && setOpen(false)}>
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold">Hapus Order</h3>
                <p className="text-muted-foreground text-sm">Tindakan ini tidak bisa dibatalkan.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Order <span className="text-foreground font-mono font-medium">{orderNumber}</span> beserta semua log akan dihapus permanen.
            </p>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-4 py-1.5 rounded-md text-sm border border-border text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-1.5 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                {loading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
