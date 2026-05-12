import { z } from 'zod'

export const robuxAmountSchema = z.object({
  amount: z.number().int().min(100, 'Minimal pembelian 100 Robux'),
})

export const gamepasLinkSchema = z.object({
  link: z
    .string()
    .url()
    .regex(/roblox\.com\/game-pass\//, 'Link harus berupa link gamepass Roblox yang valid'),
})

export const setRateSchema = z.object({
  rate: z.number().positive('Rate harus lebih dari 0'),
})
