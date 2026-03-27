export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Leaf, LogOut, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-[#0D3B2E] text-white px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/sites" className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[#E8B84B]" />
            <span className="text-lg font-semibold">Corum</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard/sites"
              className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Sites
            </Link>
            <form action="/api/auth/signout" method="POST">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-2"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
