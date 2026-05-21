import type { RepliableInteraction } from 'discord.js'
import { checkIsAdmin } from '../utils/permissions'

/**
 * Guard middleware untuk command admin.
 * Return true jika boleh lanjut, false jika ditolak (sudah reply error).
 */
async function sendError(interaction: RepliableInteraction, content: string) {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content })
  } else {
    await interaction.reply({ content, ephemeral: true })
  }
}

export async function requireAdmin(interaction: RepliableInteraction): Promise<boolean> {
  if (!interaction.guild || !interaction.member) {
    await sendError(interaction, '❌ Command ini hanya bisa digunakan di server.')
    return false
  }

  const member = await interaction.guild.members.fetch(interaction.user.id)
  const allowed = await checkIsAdmin(member, interaction.guild.id)

  if (!allowed) {
    await sendError(interaction, '❌ Kamu tidak punya izin untuk menjalankan command ini.')
    return false
  }

  return true
}
