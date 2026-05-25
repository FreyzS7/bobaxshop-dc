import {
  type ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import { updatePendingOrder, getPendingOrder } from '../../utils/pendingOrders'
import { getRobloxUserByUsername } from '../../services/robloxService'

export async function handleRobloxUsernameModal(interaction: ModalSubmitInteraction) {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({ content: '❌ Sesi habis. Mulai ulang dari tombol Beli Robux.', ephemeral: true })
    return
  }

  const inputUsername = interaction.fields.getTextInputValue('roblox_username').trim()

  await interaction.deferReply({ ephemeral: true })

  // Validasi via Roblox API
  const robloxUser = await getRobloxUserByUsername(inputUsername)

  if (!robloxUser) {
    await interaction.editReply({
      content: `❌ Username Roblox **${inputUsername}** tidak ditemukan.\n> Pastikan kamu memasukkan **username**, bukan display name.\n> Cek di profil Roblox kamu: nama setelah \`@\` adalah username.`,
    })
    return
  }

  // Verifikasi input = username, bukan display name
  if (robloxUser.name.toLowerCase() !== inputUsername.toLowerCase()) {
    await interaction.editReply({
      content: `❌ **${inputUsername}** adalah display name, bukan username.\nUsername yang benar adalah: **${robloxUser.name}**\n> Gunakan username yang muncul setelah \`@\` di profil Roblox.`,
    })
    return
  }

  updatePendingOrder(interaction.user.id, { robloxUsername: robloxUser.name })

  const methodNote = pending.method === 'transfer'
    ? '> Setelah pembayaran dikonfirmasi, seller akan mengirim Robux langsung ke akunmu via Robux Transfer. Pastikan kamu sudah **berteman** dengan akun seller.'
    : pending.method === 'gamepass'
    ? '> Pastikan **Gamepass sudah aktif** di experience yang public, rated, dan tercantum di profil kamu.'
    : '> Akun Roblox kamu **wajib sudah bergabung dengan group community minimal 5 hari** sebelum bisa menerima Robux.'

  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('📋 Ringkasan Order')
    .addFields(
      { name: '💳 Robux yang kamu terima', value: `**${formatRobux(pending.robuxAmount!)} Robux**`, inline: true },
      { name: '💰 Total Bayar', value: `**${formatIDR(pending.priceIdr!)}**`, inline: true },
      { name: '👤 Username Roblox', value: `**${robloxUser.name}** (ID: ${robloxUser.id})`, inline: false },
      { name: '⚠️ PENTING', value: methodNote, inline: false },
      { name: '\u200B', value: 'Pilih metode pembayaran:', inline: false },
    )

  await interaction.editReply({
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('pay_qris')
          .setLabel('📱 Bayar dengan QRIS')
          .setStyle(ButtonStyle.Primary)
      ),
    ],
  })
}
