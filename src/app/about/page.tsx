import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "About — Chillflix" };

const PAIN_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Siloed platforms",
    body: "Netflix recommends Netflix. HBO recommends HBO. Nobody's looking across everything you pay for.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Time you don't get back",
    body: "Scrolling for ten minutes. Loading apps. Exiting apps. Googling. By then your mood has changed.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "The group decision trap",
    body: "Whose turn is it? Did we already watch this? The kids are arguing. Again.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
    title: "Too much of everything",
    body: "More options doesn't mean an easier decision. It means a harder one. We have too much and too little at the same time.",
  },
];

const STEPS = [
  {
    title: "Connect your services once",
    body: "Tell us what you subscribe to. We see across all of them — Netflix, HBO, Hulu, Apple TV+, and more.",
  },
  {
    title: "Build your queue together",
    body: "Add shows as you hear about them. Recommendations from friends land right in your queue, not a forgotten text thread.",
  },
  {
    title: "We remember what you've watched",
    body: "No more “wait, did we see this?” We track watch history across your whole household so you never re-watch by accident.",
  },
  {
    title: "Know where to find it",
    body: "See exactly which service a show is on before you go looking. No more opening five apps to find it.",
  },
  {
    title: "Settle the whose-turn-is-it debate",
    body: "Built-in queue management means no more arguing. Everyone knows what's up next.",
  },
];

const TAGS = [
  "All platforms",
  "Household watch history",
  "Saved recommendations",
  "Whose-turn tracker",
  "No more endless scrolling",
  "Know what's coming next",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)]">

      {/* Header */}
      <header className="bg-[#C01900] shadow-lg">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Image
            src="/chillflix-logo.png"
            alt="Chillflix"
            width={140}
            height={40}
            className="select-none opacity-95"
          />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Back to dashboard
          </Link>
        </div>
      </header>

      {/* Hero — images anchored to full-width wrapper, text in constrained centre */}
      <div className="bg-[#C01900] overflow-hidden relative">
        {/* Characters at true page edges, hidden on mobile */}
        <div className="hidden sm:block absolute bottom-0 left-0 w-64 md:w-80 lg:w-96 select-none pointer-events-none">
          <Image
            src="/cuppie.png"
            alt=""
            width={384}
            height={384}
            className="object-contain object-bottom w-full"
          />
        </div>
        <div className="hidden sm:block absolute bottom-0 right-0 w-64 md:w-80 lg:w-96 select-none pointer-events-none">
          <Image
            src="/couchie.png"
            alt=""
            width={384}
            height={384}
            className="object-contain object-bottom w-full"
          />
        </div>

        {/* Text — narrow enough to stay clear of both characters */}
        <div className="relative max-w-sm mx-auto px-6 pb-20 pt-12 text-center">
          <div className="inline-block text-[10px] uppercase tracking-widest font-semibold text-white/60 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-5">
            About us
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
            We built the app for<br />
            <em className="italic opacity-80">the other 45 minutes.</em>
          </h1>
          <p className="text-base text-white/70 leading-relaxed mb-6">
            The ones you spent scrolling, switching apps, arguing, and forgetting — before you ever pressed play.
          </p>
          <span className="inline-block text-sm font-medium text-white/75 bg-white/10 border border-white/20 rounded-full px-5 py-2">
            Your couch deserves better
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8">

        {/* The Problem */}
        <section className="py-14 border-b border-[color:var(--border)]">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#C01900] mb-2">
            The problem
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            It wasn&rsquo;t supposed to be this complicated.
          </h2>
          <p className="text-sm text-[color:var(--muted)] leading-relaxed mb-8 max-w-xl">
            You have a free evening. You want to watch something good. Somehow, you&rsquo;re still deciding 40 minutes later — bouncing between apps, second-guessing yourself, and half-heartedly settling for something you&rsquo;ve already seen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAIN_ITEMS.map((item) => (
              <div
                key={item.title}
                className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-5"
              >
                <div className="w-9 h-9 rounded-lg bg-[#C01900]/10 text-[#C01900] flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-[color:var(--muted)] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quotes */}
        <section className="py-14 border-b border-[color:var(--border)]">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#C01900] mb-6">
            Sound familiar?
          </p>
          <div className="space-y-4 mb-6">
            {[
              { quote: '"Wait — what did my friend tell me we absolutely had to watch?"', cite: "every person, every Friday night" },
              { quote: '"I heard there\'s a show like Mare of Easttown, but what was it called?"', cite: "also every person, every Friday night" },
            ].map(({ quote, cite }) => (
              <div
                key={cite}
                className="border-l-2 border-[#C01900] pl-5 py-1"
              >
                <p className="text-base italic leading-relaxed mb-1.5">{quote}</p>
                <span className="text-xs font-semibold text-[#C01900]">— {cite}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-[color:var(--muted)] leading-relaxed max-w-xl">
            The tip from a coworker. The trailer you saw once. The title you swore you bookmarked. That information used to disappear into the void. It doesn&rsquo;t anymore.
          </p>
        </section>

        {/* How it works */}
        <section className="py-14 border-b border-[color:var(--border)]">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#C01900] mb-2">
            Our answer
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            One place. Every platform. No more searching.
          </h2>
          <p className="text-sm text-[color:var(--muted)] leading-relaxed mb-8 max-w-xl">
            We built a single app that knows what you have access to, remembers what you&rsquo;ve already seen, and keeps your whole household on the same page.
          </p>
          <div className="flex flex-col gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-4 items-start">
                <div className="w-8 h-8 min-w-[2rem] rounded-full bg-[#C01900]/10 border border-[#C01900]/25 flex items-center justify-center text-sm font-bold text-[#C01900]">
                  {i + 1}
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold mb-1">{step.title}</p>
                  <p className="text-sm text-[color:var(--muted)] leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Manifesto */}
      <section className="bg-[#C01900] mt-0">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-16 text-center">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-white/50 mb-3">
            Our belief
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug tracking-tight mb-4 max-w-lg mx-auto">
            You&rsquo;re paying for those subscriptions.<br />
            You should actually enjoy them.
          </h2>
          <p className="text-sm text-white/65 leading-relaxed max-w-md mx-auto mb-8">
            We made this because we were tired of spending money on services we&rsquo;d grown to resent — not because the content was bad, but because finding anything felt like a part-time job. The problem was never the shows. It was the searching.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="text-xs text-white/70 bg-white/10 border border-white/15 rounded-full px-4 py-1.5"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="/"
            className="inline-block bg-white text-[#C01900] font-bold text-sm px-8 py-3 rounded-full hover:bg-white/90 transition-colors shadow-lg"
          >
            Back to my dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[color:var(--border)] py-6 text-center">
        <p className="text-xs text-[color:var(--muted)]">
          &copy; {new Date().getFullYear()} Chillflix. Made for people who just want to watch something good.
        </p>
      </footer>

    </div>
  );
}
