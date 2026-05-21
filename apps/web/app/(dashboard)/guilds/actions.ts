'use server'

import { revalidatePath } from 'next/cache'
import { deleteGuild } from '@bobaxshop/database'

function getBotApi() {
  return {
    url: process.env.BOT_API_URL ?? 'http://localhost:3001',
    secret: process.env.BOT_API_SECRET ?? '',
  }
}

export async function triggerSetup(guildId: string): Promise<{ success: boolean; message: string }> {
  const { url, secret } = getBotApi()

  try {
    const res = await fetch(`${url}/api/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ guildId }),
    })

    const data = await res.json() as { success: boolean; message: string }
    if (data.success) revalidatePath('/guilds')
    return data
  } catch {
    return { success: false, message: 'Bot tidak dapat dihubungi. Pastikan bot sedang berjalan.' }
  }
}

export async function kickBot(guildId: string): Promise<{ success: boolean; message: string }> {
  const { url, secret } = getBotApi()

  try {
    const res = await fetch(`${url}/api/guild/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ guildId }),
    })

    const data = await res.json() as { success: boolean; message: string }
    if (data.success) revalidatePath('/guilds')
    return data
  } catch {
    return { success: false, message: 'Bot tidak dapat dihubungi. Pastikan bot sedang berjalan.' }
  }
}

export async function wipeGuild(guildId: string): Promise<{ success: boolean; message: string }> {
  const { url, secret } = getBotApi()

  // Teardown Discord channels + kick bot first (best effort — continue even if bot offline)
  try {
    await fetch(`${url}/api/guild/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ guildId }),
    })
  } catch {
    // Bot offline — continue with DB wipe anyway
  }

  try {
    await deleteGuild(guildId)
    revalidatePath('/guilds')
    return { success: true, message: 'Data guild dan channel Discord berhasil dihapus.' }
  } catch (err) {
    console.error('wipeGuild error:', err)
    return { success: false, message: 'Gagal menghapus data guild dari database.' }
  }
}
