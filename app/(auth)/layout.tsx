import { Leaf } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-[#0D3B2E] text-white px-6 py-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Leaf className="h-6 w-6 text-[#E8B84B]" />
            <span className="text-xl font-semibold">Corum</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
