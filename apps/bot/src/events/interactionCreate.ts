import { Events, type Interaction } from 'discord.js'
import { client } from '../client'
import { handleBuyStart } from '../interactions/buttons/buyButton'
import { handleMethodSelect } from '../interactions/buttons/methodSelect'
import { handleInputRobloxUsername } from '../interactions/buttons/inputRobloxUsername'
import { handleOrderAction } from '../interactions/buttons/orderAction'
import { handlePayQris } from '../interactions/buttons/payQrisButton'
import { handleRobloxUsernameModal } from '../interactions/modals/robloxUsernameModal'
import { handleRobuxAmountModal } from '../interactions/modals/robuxAmountModal'
import { handleCancelReasonModal } from '../interactions/modals/cancelReasonModal'
import { handleRefundReasonModal } from '../interactions/modals/refundReasonModal'
import { handleInvalidProofModal } from '../interactions/modals/invalidProofModal'
import { handleConfirmProof } from '../interactions/buttons/confirmProofButton'
import { handlePaymentMethodSelect } from '../interactions/selectMenus/paymentMethodMenu'

export const name = Events.InteractionCreate
export const once = false

export async function execute(interaction: Interaction) {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = (client as any).commands.get(interaction.commandName)
      if (!command) return
      await command.execute(interaction)
      return
    }

    // Buttons
    if (interaction.isButton()) {
      const id = interaction.customId

      if (id === 'buy_start') return handleBuyStart(interaction)
      if (id === 'method_gamepass') return handleMethodSelect(interaction, 'gamepass')
      if (id === 'method_community') return handleMethodSelect(interaction, 'community')
      if (id === 'input_roblox_username') return handleInputRobloxUsername(interaction)
      if (id === 'pay_qris') return handlePayQris(interaction)
      if (id.startsWith('order_done:')) return handleOrderAction(interaction, 'done', id.split(':')[1])
      if (id.startsWith('order_pending:')) return handleOrderAction(interaction, 'pending', id.split(':')[1])
      if (id.startsWith('order_cancel:')) return handleOrderAction(interaction, 'cancel', id.split(':')[1])
      if (id.startsWith('order_refund:')) return handleOrderAction(interaction, 'refund', id.split(':')[1])
      if (id.startsWith('confirm_proof:')) return handleConfirmProof(interaction, id.split(':')[1])
      if (id.startsWith('order_invalid_proof:')) return handleOrderAction(interaction, 'invalid_proof', id.split(':')[1])
      return
    }

    // Modals
    if (interaction.isModalSubmit()) {
      const id = interaction.customId

      if (id.startsWith('modal_robux_amount:')) {
        const method = id.split(':')[1] as 'gamepass' | 'community'
        return handleRobuxAmountModal(interaction, method)
      }
if (id === 'modal_roblox_username') return handleRobloxUsernameModal(interaction)
      if (id.startsWith('modal_cancel_reason:')) return handleCancelReasonModal(interaction, id.split(':')[1])
      if (id.startsWith('modal_refund_reason:')) return handleRefundReasonModal(interaction, id.split(':')[1])
      if (id.startsWith('modal_invalid_proof:')) return handleInvalidProofModal(interaction, id.split(':')[1])
      return
    }

    // Select menus
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'payment_method_select') {
        return handlePaymentMethodSelect(interaction)
      }
      return
    }

  } catch (err) {
    console.error(`❌ Interaction error [${(interaction as any).customId ?? (interaction as any).commandName}]:`, err)

    const errMsg = { content: '❌ Terjadi kesalahan. Coba lagi.', ephemeral: true }
    if ('replied' in interaction && 'deferred' in interaction) {
      if ((interaction as any).replied || (interaction as any).deferred) {
        await (interaction as any).followUp(errMsg)
      } else {
        await (interaction as any).reply(errMsg)
      }
    }
  }
}
