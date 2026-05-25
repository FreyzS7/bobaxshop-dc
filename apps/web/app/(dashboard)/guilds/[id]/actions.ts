"use server"

import { updateGuild } from "@bobaxshop/database"
import { revalidatePath } from "next/cache"

export async function saveGuildConfig(guildId: string, formData: FormData) {
  const get = (key: string) => {
    const v = formData.get(key)
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null
  }

  await updateGuild(guildId, {
    robuxRate: get("robuxRate") ?? undefined,
    robuxRateGamepass: get("robuxRateGamepass") ?? undefined,
    robuxRateTransfer: get("robuxRateTransfer") ?? undefined,
    autoCancelMinutes: get("autoCancelMinutes") ? Number(get("autoCancelMinutes")) : undefined,
    minRobux: get("minRobux") ? Number(get("minRobux")) : undefined,
    stepRobux: get("stepRobux") ? Number(get("stepRobux")) : undefined,
    taxPercent: get("taxPercent") ?? undefined,
    paymentMode: (get("paymentMode") as "manual" | "midtrans") ?? undefined,
    isOpen: formData.get("isOpen") === "true",
    statusMessage: get("statusMessage"),
    enableCommunity: formData.get("enable_community") === "on",
    enableGamepass: formData.get("enable_gamepass") === "on",
    enableTransfer: formData.get("enable_transfer") === "on",
    robloxUserId: get("robloxUserId"),
    chOrder: get("chOrder"),
    chBuy: get("chBuy"),
    chLogs: get("chLogs"),
    chCommands: get("chCommands"),
    chAnnounce: get("chAnnounce"),
    categoryId: get("categoryId"),
    pendingCatId: get("pendingCatId"),
  })

  revalidatePath(`/guilds/${guildId}`)
}
