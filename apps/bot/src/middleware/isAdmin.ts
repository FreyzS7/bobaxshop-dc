import type { RepliableInteraction } from 'discord.js'
import { checkIsAdmin } from '../utils/permissions'

/**
 * Guard middleware untuk command admin.
 * Return true jika boleh lanjut, false jika ditolak (sudah reply error).
 */
export async function requireAdmin(interaction: RepliableInteraction): Promise<boolean> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: '❌ Command ini hanya bisa digunakan di server.',
      ephemeral: true,
    })
    return false
  }

  const member = await interaction.guild.members.fetch(interaction.user.id)
  const allowed = await checkIsAdmin(member, interaction.guild.id)

  if (!allowed) {
    await interaction.reply({
      content: '❌ Kamu tidak punya izin untuk menjalankan command ini.',
      ephemeral: true,
    })
    return false
  }

  return true
}
