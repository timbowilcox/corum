import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Leaf, ArrowRight, CheckCircle, TrendingUp, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#0D3B2E] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-[#E8B84B]" />
            <span className="text-xl font-semibold">Corum</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/80 hover:text-white text-sm">
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-zinc-900 font-semibold">
              <Link href="/register">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-[#0D3B2E] text-white px-6 py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Stay continuously ready for your SMETA audit
            </h1>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              AI-powered compliance advisor for food and agricultural suppliers. Know your readiness score, fix your gaps, and prove continuous improvement to buyers.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button asChild size="lg" className="bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-zinc-900 font-semibold h-12 px-8">
                <Link href="/register">
                  Start free assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8">
                <Link href="/quick-check">
                  Try the 5-question check
                </Link>
              </Button>
            </div>
            <p className="text-white/50 text-sm mt-4">No credit card required</p>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#0D3B2E]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-[#0D3B2E]" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">AI compliance advisor</h3>
              <p className="text-zinc-500 text-sm">Conversational intake that feels like talking to a knowledgeable consultant, not filling in a form.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#0D3B2E]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-[#0D3B2E]" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Live readiness score</h3>
              <p className="text-zinc-500 text-sm">Scored against all four SMETA pillars with severity-ranked findings and a prioritised remediation roadmap.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#0D3B2E]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-[#0D3B2E]" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Continuous improvement</h3>
              <p className="text-zinc-500 text-sm">Track score history across re-analyses and simulate the impact of fixing specific issues before committing.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
