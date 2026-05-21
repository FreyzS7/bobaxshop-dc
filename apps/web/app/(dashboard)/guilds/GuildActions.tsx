'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalClose,
  ModalBody,
} from '@/components/ui/modal'
import { Settings, LogOut, Trash2, Loader2, CheckCircle2, XCircle, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { kickBot, wipeGuild } from './actions'

type Action = 'kick' | 'wipe'

interface ActionMeta {
  Icon: LucideIcon
  iconClass: string
  label: string
  labelClass: string
  description: string
  confirm: string
  warning: string | null
  confirmVariant: 'destructive' | 'outline'
}

const ACTION_META: Record<Action, ActionMeta> = {
  kick: {
    Icon: LogOut,
    iconClass: 'text-orange-400',
    label: 'Kick Bot',
    labelClass: 'text-foreground',
    description: 'Bot keluar dari server. Data tetap aman, bot bisa rejoin kapan saja.',
    confirm: 'Bot akan keluar dari server. Data guild tetap tersimpan dan bisa reconnect saat bot rejoin.',
    warning: null,
    confirmVariant: 'outline',
  },
  wipe: {
    Icon: Trash2,
    iconClass: 'text-destructive',
    label: 'Wipe Data',
    labelClass: 'text-destructive',
    description: 'Hapus semua data guild dari database secara permanen.',
    confirm: 'Semua data guild termasuk orders dan admins akan dihapus permanen dari database.',
    warning: 'Tindakan ini tidak bisa dibatalkan.',
    confirmVariant: 'destructive',
  },
}

interface Result { success: boolean; message: string }

export function GuildActions({ guildId, guildName }: { guildId: string; guildName: string }) {
  const [confirming, setConfirming] = useState<Action | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  function reset() {
    setConfirming(null)
    setResult(null)
  }

  async function execute(action: Action) {
    setLoading(true)
    const res = action === 'kick' ? await kickBot(guildId) : await wipeGuild(guildId)
    setResult(res)
    setLoading(false)
  }

  return (
    <Modal onOpenChange={(open) => { if (!open) reset() }}>
      <ModalTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full mt-1 text-muted-foreground">
          <Settings size={14} />
          Kelola Guild
        </Button>
      </ModalTrigger>

      <ModalContent onInteractOutside={(e) => { if (loading) e.preventDefault() }}>
        <ModalHeader>
          <div>
            <ModalTitle>Kelola Guild</ModalTitle>
            <ModalDescription>{guildName}</ModalDescription>
          </div>
          <ModalClose asChild>
            <Button variant="ghost" size="icon-sm" disabled={loading}>
              <X size={14} />
            </Button>
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          {result ? (
            <ResultView result={result} />
          ) : confirming ? (
            <ConfirmView
              action={confirming}
              loading={loading}
              onConfirm={() => execute(confirming)}
              onBack={() => setConfirming(null)}
            />
          ) : (
            <OptionsView onSelect={setConfirming} />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

function OptionsView({ onSelect }: { onSelect: (a: Action) => void }) {
  return (
    <>
      {(Object.entries(ACTION_META) as [Action, ActionMeta][]).map(([key, meta]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className="w-full flex items-start gap-3 px-4 py-3 rounded-lg bg-muted hover:bg-accent text-left transition-colors"
        >
          <meta.Icon size={18} className={`mt-0.5 shrink-0 ${meta.iconClass}`} />
          <div>
            <p className={`text-sm font-medium ${meta.labelClass}`}>{meta.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </button>
      ))}
    </>
  )
}

function ConfirmView({ action, loading, onConfirm, onBack }: {
  action: Action
  loading: boolean
  onConfirm: () => void
  onBack: () => void
}) {
  const meta = ACTION_META[action]
  return (
    <>
      <p className="text-sm text-foreground">{meta.confirm}</p>
      {meta.warning && <p className="text-xs text-muted-foreground">{meta.warning}</p>}
      <div className="flex gap-2 pt-1">
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant={meta.confirmVariant}
          size="sm"
          className="flex-1"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Proses...' : 'Ya, lanjutkan'}
        </Button>
        <Button onClick={onBack} disabled={loading} variant="ghost" size="sm" className="flex-1">
          Batal
        </Button>
      </div>
    </>
  )
}

function ResultView({ result }: { result: Result }) {
  return (
    <>
      <div className={`flex items-center gap-2 text-sm ${result.success ? 'text-green-400' : 'text-destructive'}`}>
        {result.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        {result.message}
      </div>
      <ModalClose asChild>
        <Button variant="outline" size="sm" className="w-full">
          Tutup
        </Button>
      </ModalClose>
    </>
  )
}
