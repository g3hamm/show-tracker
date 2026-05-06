import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[color:var(--background)]">
      {/* Header */}
      <header className="bg-[#C01900] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-white/80 hover:text-white text-sm transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 space-y-16">

        {/* Intro */}
        <section className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C01900]">User Guide</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--foreground)]">
            Chillflix for You
          </h1>
          <p className="text-[color:var(--muted)] text-lg max-w-xl mx-auto leading-relaxed">
            Keep track of everything you want to watch — solo or with your household — in one simple place.
          </p>
        </section>

        {/* Benefits */}
        <section>
          <div className="grid sm:grid-cols-3 gap-6">
            <BenefitCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                </svg>
              }
              title="Convenience"
              description="One list instead of ten. No more forgetting what you bookmarked across Netflix, Hulu, and everywhere else."
            />
            <BenefitCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                </svg>
              }
              title="Personalization"
              description="Your taste, tracked. See what genres you love and get smarter recommendations over time."
            />
            <BenefitCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.576Z" />
                  <path fillRule="evenodd" d="M9.99 1.875a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM8.25 6.5a.75.75 0 0 1 1.5 0v.191c.897.175 1.68.604 2.196 1.207a.75.75 0 1 1-1.144.972c-.236-.277-.63-.492-1.052-.612v2.34c.454.132.903.306 1.3.573 1.002.678 1.4 1.696 1.4 2.577 0 .881-.398 1.9-1.4 2.578a4.558 4.558 0 0 1-1.3.573V16a.75.75 0 0 1-1.5 0v-.21a4.856 4.856 0 0 1-2.068-1.017.75.75 0 0 1 .98-1.14c.422.363.99.603 1.588.67V12.02a6.165 6.165 0 0 1-1.186-.399C6.716 11.114 6 10.152 6 9c0-1.151.716-2.113 1.745-2.62.327-.157.69-.27 1.005-.33V6.5Z" clipRule="evenodd" />
                </svg>
              }
              title="Cost-savings"
              description="Know what's on your services before adding new ones. Track subscriptions and get the most out of what you already pay for."
            />
          </div>
        </section>

        {/* Getting Started */}
        <section className="space-y-6">
          <SectionHeading label="Getting Started" title="Up and running in minutes" />

          <div className="space-y-4">
            <Step
              number="01"
              title="Set up your profile"
              description="Create your account and tell Chillflix which streaming services you subscribe to. This helps the app highlight shows you can actually watch right now."
            />
            <Step
              number="02"
              title="Start tracking shows"
              description="Search for any show or movie and add it to your queue. Mark items as watched as you go, and rate them to help sharpen your recommendations."
            />
          </div>
        </section>

        {/* Features */}
        <section className="space-y-6">
          <SectionHeading label="Features" title="Everything you need" />

          <div className="space-y-4">
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
              }
              title="Discover"
              description="Browse curated lists — top-rated, trending, or filtered by genre — to find your next binge. Chillflix highlights titles available on your services."
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                </svg>
              }
              title="Recommendations"
              description="Share a personal recommendation link with anyone — even people who don't have a Chillflix account. They can submit shows directly to your queue."
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" />
                </svg>
              }
              title="Analytics"
              description="See your watching patterns at a glance — genre breakdowns, platform usage, and more. Useful for spotting which subscriptions are actually earning their keep."
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
                </svg>
              }
              title="Shared Queues"
              description="Create a group queue with your household and manage a shared watchlist together. Everyone can add shows and mark things as watched."
            />
          </div>
        </section>

        {/* Tips */}
        <section className="space-y-6">
          <SectionHeading label="Tips" title="Get the most out of Chillflix" />
          <div className="grid sm:grid-cols-2 gap-4">
            <TipCard
              title="Rate as you go"
              description="Giving shows a thumbs up or down trains your personal taste profile for better Discover results."
            />
            <TipCard
              title="Use the solo queue"
              description="Add guilty pleasures or shows your household wouldn't enjoy to your solo queue — it stays private."
            />
            <TipCard
              title="Refresh periodically"
              description='Use "Refresh shows" in the menu to pull the latest streaming availability so you always know where to watch.'
            />
            <TipCard
              title="Keep subscriptions current"
              description="Update My Subscriptions whenever you add or drop a service so Chillflix can highlight the right shows."
            />
          </div>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#C01900] hover:bg-[#a01400] text-white font-semibold text-sm transition-colors"
          >
            Go to my dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#C01900] mb-1">{label}</p>
      <h2 className="text-2xl font-bold text-[color:var(--foreground)]">{title}</h2>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-5 space-y-3">
      <div className="w-10 h-10 rounded-lg bg-[#C01900]/10 flex items-center justify-center text-[#C01900]">
        {icon}
      </div>
      <h3 className="font-semibold text-[color:var(--foreground)]">{title}</h3>
      <p className="text-sm text-[color:var(--muted)] leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-5 bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-5">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C01900] flex items-center justify-center">
        <span className="text-white text-xs font-bold">{number}</span>
      </div>
      <div className="space-y-1 min-w-0">
        <h3 className="font-semibold text-[color:var(--foreground)]">{title}</h3>
        <p className="text-sm text-[color:var(--muted)] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-5">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[color:var(--surface-elevated)] flex items-center justify-center text-[color:var(--muted)]">
        {icon}
      </div>
      <div className="space-y-1 min-w-0">
        <h3 className="font-semibold text-[color:var(--foreground)] text-sm">{title}</h3>
        <p className="text-sm text-[color:var(--muted)] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-4 space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#C01900]" />
        <h3 className="font-semibold text-[color:var(--foreground)] text-sm">{title}</h3>
      </div>
      <p className="text-sm text-[color:var(--muted)] leading-relaxed pl-3.5">{description}</p>
    </div>
  );
}
