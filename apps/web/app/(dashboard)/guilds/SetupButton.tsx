'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { triggerSetup } from './actions'

export function SetupButton({ guildId }: { guildId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    const res = await triggerSetup(guildId)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="mb-2 space-y-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Settings2 size={14} />}
        {loading ? 'Setting up...' : 'Run Setup'}
      </Button>
      {result && (
        <div className={`flex items-center gap-1.5 text-xs ${result.success ? 'text-green-400' : 'text-destructive'}`}>
          {result.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {result.message}
        </div>
      )}
    </div>
  )
}
