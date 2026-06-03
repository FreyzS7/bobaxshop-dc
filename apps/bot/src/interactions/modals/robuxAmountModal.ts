import {
  type ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { getGuild } from '@bobaxshop/database'
import { COLORS, formatIDR, formatRobux, calcRobuxGross, calcPrice } from '@bobaxshop/shared'
import { updatePendingOrder, getPendingOrder } from '../../utils/pendingOrders'
import { getTransferStock } from '../../services/stockService'

export async function handleRobuxAmountModal(
  interaction: ModalSubmitInteraction,
  method: 'gamepass' | 'community' | 'transfer'
) {
  try {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({ content: '❌ Sesi habis. Mulai ulang dari tombol Beli Robux.', ephemeral: true })
    return
  }

  const rawAmount = interaction.fields.getTextInputValue('robux_amount').trim()
  const robuxAmount = parseInt(rawAmount, 10)

  const guild = await getGuild(pending.guildId)
  if (!guild?.robuxRate) {
    await interaction.reply({ content: '❌ Rate belum diset.', ephemeral: true })
    return
  }

  const minRobux = guild.minRobux ?? 1000
  const stepRobux = guild.stepRobux ?? 500

  if (isNaN(robuxAmount) || robuxAmount < minRobux) {
    await interaction.reply({ content: `❌ Minimal pembelian **${formatRobux(minRobux)} Robux**.`, ephemeral: true })
    return
  }
  if (robuxAmount % stepRobux !== 0) {
    await interaction.reply({
      content: `❌ Jumlah Robux harus kelipatan **${formatRobux(stepRobux)}**. Contoh: ${formatRobux(minRobux)}, ${formatRobux(minRobux + stepRobux)}, ...`,
      ephemeral: true,
    })
    return
  }

  // Cek stok transfer
  if (method === 'transfer') {
    const stock = await getTransferStock(pending.guildId)
    if (stock !== null) {
      if (stock.remaining <= 0) {
        await interaction.reply({
          content: `❌ Stok **Via Robux Transfer** hari ini sudah habis.\nCoba lagi besok atau pilih metode lain.`,
          ephemeral: true,
        })
        return
      }
      if (robuxAmount > stock.remaining) {
        await interaction.reply({
          content: `❌ Sisa stok transfer hari ini hanya **${formatRobux(stock.remaining)}**. Masukkan jumlah yang tidak melebihi sisa stok.`,
          ephemeral: true,
        })
        return
      }
    }
  }

  const rate = method === 'gamepass' && guild.robuxRateGamepass
    ? Number(guild.robuxRateGamepass)
    : method === 'transfer' && guild.robuxRateTransfer
    ? Number(guild.robuxRateTransfer)
    : Number(guild.robuxRate)

  const robuxGross = method === 'gamepass' ? calcRobuxGross(robuxAmount) : robuxAmount
  const priceIdr = calcPrice(robuxAmount, rate)

  updatePendingOrder(interaction.user.id, { robuxAmount, robuxGross, priceIdr })

  const summaryEmbed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('📋 Ringkasan Order')
    .addFields(
      { name: '💳 Robux yang kamu terima', value: `**${formatRobux(robuxAmount)} Robux**`, inline: true },
      { name: '💰 Total Bayar', value: `**${formatIDR(priceIdr)}**`, inline: true },
    )

  if (method === 'gamepass') {
    summaryEmbed.addFields(
      {
        name: '📌 Instruksi Gamepass',
        value: [
          `Set harga gamepass kamu ke **${formatRobux(robuxGross)} Robux**`,
          `> Setelah dipotong tax 30% Roblox, kamu akan menerima **${formatRobux(robuxAmount)} Robux**`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '⚠️ Syarat Wajib',
        value: [
          '1. Experience harus **Public**, **Rated**, dan **tercantum di profil** kamu',
          '2. Buat **Gamepass** di dalam experience tersebut dengan harga yang sudah ditentukan',
          '3. Pastikan gamepass sudah **aktif** dan bisa dibeli',
        ].join('\n'),
        inline: false,
      },
      { name: '\u200B', value: '⬇️ Klik tombol di bawah untuk input **username Roblox** kamu.', inline: false }
    )

    await interaction.reply({
      embeds: [summaryEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('input_roblox_username')
            .setLabel('👤 Input Username Roblox')
            .setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    })
  } else if (method === 'transfer') {
    const robloxUserId = guild.robloxUserId ?? '456687425'
    summaryEmbed.addFields(
      {
        name: '💸 Syarat Via Robux Transfer',
        value: [
          `Tambahkan akun Roblox seller sebagai **teman** terlebih dahulu agar Robux bisa dikirim langsung ke akunmu.`,
          `> 👤 Profil Roblox Seller: https://www.roblox.com/users/${robloxUserId}/profile`,
          `> Setelah berteman, seller akan transfer **${formatRobux(robuxAmount)} Robux** ke akunmu setelah pembayaran dikonfirmasi.`,
        ].join('\n'),
        inline: false,
      },
      { name: '\u200B', value: '⬇️ Klik tombol di bawah untuk input **username Roblox** kamu.', inline: false }
    )

    await interaction.reply({
      embeds: [summaryEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('input_roblox_username')
            .setLabel('👤 Input Username Roblox')
            .setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    })
  } else {
    summaryEmbed.addFields(
      { name: '\u200B', value: '⬇️ Klik tombol di bawah untuk input **username Roblox** kamu.', inline: false }
    )

    await interaction.reply({
      embeds: [summaryEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('input_roblox_username')
            .setLabel('👤 Input Username Roblox')
            .setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    })
  }
  } catch (err: any) {
    if (err?.code === 10062) return // interaction expired, abaikan
    console.error('[robuxAmountModal] error:', err)
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Terjadi kesalahan, coba lagi.', ephemeral: true }).catch(() => {})
    }
  }
}
