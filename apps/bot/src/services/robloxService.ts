interface RobloxUser {
  id: number
  name: string        // exact username (bukan display name)
  displayName: string
}

/**
 * Cari user Roblox berdasarkan username.
 * Return user jika ditemukan, null jika tidak ada.
 * Validasi: pastikan input adalah username bukan displayName.
 */
export async function getRobloxUserByUsername(username: string): Promise<RobloxUser | null> {
  try {
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    })

    if (!res.ok) return null

    const data = await res.json() as { data: RobloxUser[] }
    if (!data.data || data.data.length === 0) return null

    return data.data[0]
  } catch {
    return null
  }
}
