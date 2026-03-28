import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Leaf,
  ArrowRight,
  MessageSquare,
  BarChart3,
  Target,
  Clock,
  Zap,
  ChevronRight,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ───── Nav ───── */}
      <header className="bg-[#0D3B2E] text-white px-6 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="h-6 w-6 text-[#E8B84B] transition-transform group-hover:rotate-12" />
            <span className="text-xl font-semibold tracking-tight">Corum</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-white/70 hover:text-white text-sm transition-colors"
            >
              Sign in
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-[#E8B84B] hover:bg-[#d4a53e] text-[#0D3B2E] font-semibold shadow-sm"
            >
              <Link href="/register">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ───── Hero ───── */}
        <section className="bg-[#0D3B2E] text-white px-6 pt-20 pb-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-8 text-sm text-white/80">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              For food &amp; agricultural suppliers preparing for SMETA
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              Know exactly where you stand{' '}
              <span className="text-[#E8B84B]">before the auditor arrives</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
              Corum analyses your site against every SMETA criterion, shows you
              what to fix first, and tracks your progress — so you walk into
              audit day with confidence, not anxiety.
            </p>

            {/* CTAs — quick check is primary (value before registration) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[#E8B84B] hover:bg-[#d4a53e] text-[#0D3B2E] font-semibold h-13 px-8 text-base shadow-lg shadow-black/20 w-full sm:w-auto"
              >
                <Link href="/quick-check">
                  Check your readiness now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 h-13 px-8 text-base w-full sm:w-auto"
              >
                <Link href="/register">Create free account</Link>
              </Button>
            </div>

            <p className="text-white/40 text-sm mt-5">
              Free readiness snapshot — no account required
            </p>
          </div>
        </section>

        {/* ───── How it works ───── */}
        <section className="px-6 py-20 bg-zinc-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[#0D3B2E] font-semibold text-sm uppercase tracking-wider mb-2">
                How it works
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                From uncertainty to audit-ready in three steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-8 border border-zinc-200/80 shadow-sm relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-lg">Tell us about your site</h3>
                </div>
                <p className="text-zinc-500 leading-relaxed">
                  Answer questions about your operations — working hours, safety
                  practices, wage policies. It takes 15 minutes, not 15 days.
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm text-[#0D3B2E]">
                  <MessageSquare className="h-4 w-4" />
                  <span>Conversational or structured — your choice</span>
                </div>
                {/* Connector arrow (desktop) */}
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="h-6 w-6 text-zinc-300" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-8 border border-zinc-200/80 shadow-sm relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-lg">Get your readiness score</h3>
                </div>
                <p className="text-zinc-500 leading-relaxed">
                  AI analyses your responses against all four SMETA pillars and
                  flags exactly what an auditor would find — before they do.
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm text-[#0D3B2E]">
                  <BarChart3 className="h-4 w-4" />
                  <span>Scored 0-100 with severity-ranked findings</span>
                </div>
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="h-6 w-6 text-zinc-300" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-8 border border-zinc-200/80 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-lg">Fix what matters most</h3>
                </div>
                <p className="text-zinc-500 leading-relaxed">
                  A prioritised action plan shows which fixes have the biggest
                  impact on your score. Simulate improvements before committing.
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm text-[#0D3B2E]">
                  <Target className="h-4 w-4" />
                  <span>&ldquo;Fix these 3 items&rdquo; &rarr; score jumps 21 points</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Why Corum ───── */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[#0D3B2E] font-semibold text-sm uppercase tracking-wider mb-2">
                Why suppliers choose Corum
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                Built for the people who actually prepare for audits
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-1">
                    Minutes, not months
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Get a readiness snapshot from a quick check in under 2
                    minutes. Full analysis takes 15-20 minutes — not the weeks
                    of spreadsheet wrangling you&apos;re used to.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-1">
                    Advisor, not interrogator
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    The intake feels like a conversation with someone who
                    understands your operations — not a government form designed
                    to trip you up.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-1">
                    Actions, not just findings
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Every gap comes with a clear fix. See exactly how each
                    remediation improves your score before you spend time or
                    money on it.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-1">
                    Prove progress to buyers
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Score history and trend tracking give you evidence of
                    continuous improvement — the story buyers and auditors
                    actually want to hear.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Bottom CTA ───── */}
        <section className="px-6 py-20 bg-[#0D3B2E]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Your next audit doesn&apos;t have to be stressful
            </h2>
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              Take the 2-minute readiness check and see where you stand — no
              account needed.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[#E8B84B] hover:bg-[#d4a53e] text-[#0D3B2E] font-semibold h-13 px-10 text-base shadow-lg shadow-black/20"
            >
              <Link href="/quick-check">
                Check your readiness
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ───── Footer ───── */}
      <footer className="bg-[#0a2e24] text-white/40 px-6 py-8 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-[#E8B84B]/60" />
            <span>&copy; {new Date().getFullYear()} Corum</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/quick-check" className="hover:text-white/70 transition-colors">
              Quick check
            </Link>
            <Link href="/login" className="hover:text-white/70 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-white/70 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
