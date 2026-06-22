import { AttachmentBuilder, type Client } from 'discord.js'
import type { Guild } from '@bobaxshop/database'
import { resolve } from 'path'

const QRIS_STATIC_PATH = resolve(__dirname, '../../../../packages/shared/assets/qrisscan.png')

/**
 * Ambil attachment QRIS untuk server ini.
 * Jika guild punya custom QRIS, fetch message dari chLogs untuk URL fresh (Discord URLs expire ~24 jam).
 * Fallback ke file statis bawaan.
 */
export async function getQrisAttachment(client: Client, guild: Guild | null | undefined): Promise<AttachmentBuilder> {
  if (guild?.chLogs && guild?.qrisMessageId) {
    try {
      const ch = client.channels.cache.get(guild.chLogs)
      if (ch?.isTextBased()) {
        const msg = await ch.messages.fetch(guild.qrisMessageId)
        const freshUrl = msg.attachments.first()?.url
        if (freshUrl) return new AttachmentBuilder(freshUrl, { name: 'qris.png' })
      }
    } catch {
      // Pesan dihapus atau channel tidak bisa diakses — fallback
    }
  }
  return new AttachmentBuilder(QRIS_STATIC_PATH, { name: 'qris.png' })
}
