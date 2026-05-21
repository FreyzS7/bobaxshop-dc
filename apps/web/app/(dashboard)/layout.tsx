import Sidebar from "@/components/layout/Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      {/* Offset for mobile top bar */}
      <div className="flex-1 flex flex-col md:ml-0 mt-14 md:mt-0 min-w-0">
        {children}
      </div>
    </div>
  )
}
