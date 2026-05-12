import type { GuildMember } from 'discord.js'
import { isAdmin } from '@bobaxshop/database'

/**
 * Cek apakah member punya permission admin:
 * 1. Punya role "Administration" di guild, ATAU
 * 2. Terdaftar di tabel admins, ATAU
 * 3. Punya permission Administrator
 */
export async function checkIsAdmin(member: GuildMember, guildId: string): Promise<boolean> {
  // Cek Discord Administrator permission
  if (member.permissions.has('Administrator')) return true

  // Cek role bernama "Administration"
  const hasAdminRole = member.roles.cache.some(
    (role) => role.name.toLowerCase() === 'administration'
  )
  if (hasAdminRole) return true

  // Cek tabel admins di DB
  return isAdmin(guildId, member.id)
}
