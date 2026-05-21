import { db } from "@bobaxshop/database"
import { webUsers } from "@bobaxshop/database"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Header from "@/components/layout/Header"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const session = await auth()
  if (session?.user?.role !== "superadmin") redirect("/")

  const users = await db.query.webUsers.findMany()

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 p-6 max-w-2xl space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-white font-medium mb-1">Web Users</h2>
          <p className="text-zinc-500 text-sm mb-4">Daftar akun yang bisa akses dashboard.</p>
          <Separator className="bg-zinc-800 mb-4" />
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-zinc-200">{user.name}</p>
                  <p className="text-zinc-500 text-xs">{user.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.role === "superadmin"
                    ? "bg-indigo-900 text-indigo-300"
                    : "bg-zinc-700 text-zinc-300"
                }`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-white font-medium mb-1">Tambah User</h2>
          <p className="text-zinc-500 text-sm">Gunakan seed script untuk menambah user baru:</p>
          <pre className="mt-3 bg-zinc-950 border border-zinc-800 rounded p-3 text-xs text-zinc-400 overflow-x-auto">
            {`cd apps/web\npnpm seed`}
          </pre>
        </div>
      </main>
    </>
  )
}
