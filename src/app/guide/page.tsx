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
            End the strife of searching every platform separately to find something to watch, losing track of preferences in the process. With Chillflix, lose the stress and gain convenience, personalization, and cost-savings — all in one place.
          </p>
        </section>

        {/* Benefits */}
        <section>
          <div className="grid sm:grid-cols-3 gap-6">
            <BenefitCard
              number="1"
              title="Convenience"
              description="All your streaming options tracked in one place."
            />
            <BenefitCard
              number="2"
              title="Personalization"
              description="Tailored profiles and ratings for your household."
            />
            <BenefitCard
              number="3"
              title="Cost-savings"
              description="Analytics and ROI insights across every subscription."
            />
          </div>
        </section>

        {/* Getting Started */}
        <section className="space-y-6">
          <SectionHeading label="Getting Started" title="Up and running in minutes" />

          <Step number="01" title="Set Up Your Profile" subtitle="Takes 2 min">
            <Bullet>
              In the <Chip>Intro Page</Chip>, name your <Strong>&ldquo;household&rdquo;</Strong>{" "}
              — e.g. <em>Hamm Family</em>. Add members (e.g. Mom, Dad, Billy) or combos
              (e.g. &ldquo;Mom &amp; Dad&rdquo;, &ldquo;Billy &amp; Friends&rdquo;).
            </Bullet>
            <Bullet>
              Go to <Chip>Settings</Chip> and select <ChipOutline>My Subscriptions</ChipOutline>.
              Not sure what you&rsquo;re paying for? Try the optional{" "}
              <Strong>Rocketmoney import</Strong>.
            </Bullet>
            <Note>Don&rsquo;t worry — you can change any of this later!</Note>
          </Step>

          <Step number="02" title="Start Tracking" subtitle="Any time">
            <Bullet>
              Go to <Chip>Add Shows</Chip> to mark a series you&rsquo;re actively watching
              or have finished. Updates your queue instantly.
            </Bullet>
            <Bullet>
              Within a show, <Strong>rate the series</Strong> on a 1–5 scale to build a record
              of your preferences over time.
            </Bullet>
          </Step>
        </section>

        {/* Features */}
        <section className="space-y-6">
          <SectionHeading label="Features" title="Everything you need" />

          <Feature badge="Discover" title="Find Something to Watch">
            <Bullet>
              Select the <Chip>Discover</Chip> tab and describe your mood —
              &ldquo;something spooky from the 80s&rdquo; or &ldquo;a feel-good
              comedy.&rdquo; Draws from <Strong>all platforms</Strong>, not one
              streamer&rsquo;s biased categories.
            </Bullet>
          </Feature>

          <Feature badge="Tips" title="Get Recommendations">
            <Bullet>
              In <Chip>Settings</Chip>, find your <ChipOutline>Recommendations Link</ChipOutline>{" "}
              and share it with trusted friends and family. Their picks land in your queue
              automatically.
            </Bullet>
            <Bullet>
              <Strong>Accept or decline</Strong> suggestions as they arrive — keeping your
              queue curated and personal.
            </Bullet>
          </Feature>

          <Feature badge="Analytics" title="View Analytics">
            <Bullet>
              Select the <BarChartChip /> next to <Chip>Discover</Chip> to open the analytics
              dashboard — a family-wide view of every queue. Track shows added, platform
              usage, satisfaction ratings per service, and ROI, all updated in real time.
            </Bullet>
          </Feature>
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
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-5 space-y-3 text-center">
      <div className="w-10 h-10 mx-auto rounded-full bg-[#C01900] flex items-center justify-center">
        <span className="text-white font-bold">{number}</span>
      </div>
      <h3 className="font-semibold text-[color:var(--foreground)]">{title}</h3>
      <p className="text-sm text-[color:var(--muted)] leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-[color:var(--border)]">
        <span className="bg-[#C01900] text-white text-[10px] font-bold uppercase tracking-wider rounded px-2 py-1">
          Step {number}
        </span>
        <h3 className="font-semibold text-[color:var(--foreground)] flex-1">{title}</h3>
        <span className="text-xs text-[color:var(--muted)] italic">{subtitle}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Feature({
  badge,
  title,
  children,
}: {
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-[color:var(--border)]">
        <span className="bg-[color:var(--surface-elevated)] text-[color:var(--foreground)] text-[10px] font-bold uppercase tracking-wider rounded px-2 py-1 border border-[color:var(--border)]">
          {badge}
        </span>
        <h3 className="font-semibold text-[color:var(--foreground)] flex-1">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#C01900] mt-[0.55rem]" />
      <p className="text-sm text-[color:var(--muted)] leading-relaxed">{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#C01900]/10 border-l-2 border-[#C01900] rounded-r px-3 py-2">
      <p className="text-sm text-[color:var(--foreground)]">{children}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-[#C01900] text-white text-[11px] font-bold rounded px-1.5 py-0.5 align-middle whitespace-nowrap">
      {children}
    </span>
  );
}

function ChipOutline({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-[#C01900]/15 border border-[#C01900]/50 text-[color:var(--foreground)] text-[11px] font-bold rounded px-1.5 py-0.5 align-middle whitespace-nowrap">
      {children}
    </span>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-[color:var(--foreground)] font-semibold">{children}</strong>;
}

function BarChartChip() {
  return (
    <span className="inline-flex items-end gap-[2px] bg-[#C01900] rounded px-1.5 py-1 align-middle h-[18px]">
      <span className="block w-[3px] h-[5px] bg-white/60 rounded-sm" />
      <span className="block w-[3px] h-[8px] bg-white/80 rounded-sm" />
      <span className="block w-[3px] h-[11px] bg-white rounded-sm" />
    </span>
  );
}
