"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  type CSSProperties,
  type ReactNode,
} from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { motion, AnimatePresence, useReducedMotion, type Variants } from "motion/react"
import { Heart, Check, X, Sparkles, MapPin } from "lucide-react"
import localFont from "next/font/local"
import { Cinzel, Playfair_Display } from "next/font/google"
import { ProposalMixedText, proposalMixedTextInter } from "@/lib/proposal-mixed-text"
import { useSiteConfig } from "@/hooks/use-site-config"
import { Hero as InvitationHero } from "@/components/loader/Hero"
import { LoadingScreen } from "@/components/loader/LoadingScreen"
import { InvitePhotoBackdrop } from "@/components/loader/invite-photo-backdrop"
import { sectionType, welcomeTitleSize } from "@/lib/section-typography"
import { sectionBackground } from "@/lib/section-background"
import { siteConfig as defaultSiteConfig } from "@/content/site"
import { parseWeddingDate } from "@/lib/wedding-date"
import type { ProposalRole } from "@/lib/proposal-types"
import { parseInviteeNameFromSearchParams } from "@/lib/proposal-invite-link"
import { TintedDeco } from "@/components/tinted-deco"
import { useCssColor } from "@/hooks/use-css-color"

const Silk = dynamic(() => import("@/components/silk"), { ssr: false })

const proposalEntryEase = [0.22, 1, 0.36, 1] as const
const CINEMATIC_ENTRY_MS = 3000

// True once the invitation is on screen, so the header reveal plays when guests can see it
const RevealContext = createContext(true)

const revealEase = [0.22, 1, 0.36, 1] as const

const headerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.35 } },
}

const headerItem: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: revealEase } },
}

// Petals drifting behind the card, in the invitation's script / accent colors
const PETALS = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 41 + 7) % 100,
  size: 5 + ((i * 7) % 6),
  dur: 16 + ((i * 5) % 10),
  delay: -((i * 3.3) % 20),
  drift: (i % 2 === 0 ? 1 : -1) * (14 + ((i * 11) % 30)),
  spin: (i % 2 === 0 ? 1 : -1) * (160 + ((i * 47) % 300)),
  // Sky, sage and butter petals
  color: ["var(--color-motif-medium)", "var(--color-motif-yellow)", "var(--color-motif-silver)"][i % 3],
  petal: i % 2 === 0,
}))

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
})

const inter = proposalMixedTextInter

const theSeasons = localFont({
  src: "../Font/Fontspring-DEMO-theseasons-reg.otf",
  display: "swap",
  variable: "--font-the-seasons",
})

const aboveTheBeyond = localFont({
  src: "../Font/above-the-beyond-script.otf",
  display: "swap",
  variable: "--font-above-beyond",
})

// Every color is a shared invitation role from app/globals.css (--invite-*),
// so the palette there restyles this page, its cards and its dialogs.
const IVORY = "var(--invite-paper)"
const CHAMPAGNE = "var(--invite-accent)"
const INK = "var(--invite-ink)"
const CREAM = "var(--invite-body)"
const LABEL_GOLD = "var(--invite-accent)"
const SCRIPT_GREEN = "var(--invite-script)"
const TITLE = "var(--invite-title)"
const GOLD_BORDER = "var(--invite-line)"
const GOLD_BORDER_SOFT = "var(--invite-line-soft)"
const INNER_SURFACE = "var(--invite-paper-tint)"

// Display lettering is flat, like the loading screen's "Save Date"
const goldGradientText: CSSProperties = { color: TITLE }

const palette = {
  body: CREAM,
  bodySoft: "color-mix(in srgb, var(--invite-body) 80%, transparent)",
  heading: INK,
  label: LABEL_GOLD,
  script: SCRIPT_GREEN,
} as const

const ambientGlowStyle = {
  background: "radial-gradient(ellipse 80% 65% at 50% 50%, var(--invite-glow), transparent 68%)",
} as const

const dividerLineStyle = {
  background: "linear-gradient(to right, transparent, var(--invite-line), transparent)",
} as const

// Dusty blue → navy pill with white text (matches the rest of the invitation)
const primaryBtnStyle: CSSProperties = {
  background:
    "linear-gradient(180deg, var(--color-welcome-heading) 0%, color-mix(in srgb, var(--color-welcome-heading) 72%, var(--color-welcome-navy)) 100%)",
  borderColor: "rgb(255 255 255 / 70%)",
  color: "#FFFFFF",
  boxShadow:
    "0 0 0 3px color-mix(in srgb, var(--color-motif-medium) 22%, transparent), 0 12px 24px -12px var(--invite-shadow)",
}

// White pill with a sky border and navy text
const secondaryBtnStyle: CSSProperties = {
  color: INK,
  backgroundColor: "#FFFFFF",
  borderColor: "color-mix(in srgb, var(--color-motif-medium) 75%, transparent)",
}

const primaryBtnClass =
  `${cinzel.className} touch-manipulation inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border px-5 py-3.5 text-[0.72rem] font-semibold uppercase leading-snug tracking-[0.14em] transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 sm:px-8 sm:text-xs sm:tracking-[0.2em] sm:hover:scale-[1.02]`

const secondaryBtnClass =
  `${cinzel.className} touch-manipulation inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border px-5 py-3 text-[0.66rem] font-semibold uppercase leading-snug tracking-[0.12em] transition-all duration-300 active:scale-[0.98] sm:px-8 sm:text-[0.7rem] sm:tracking-[0.18em] sm:hover:scale-[1.02]`

/* ── Invitation types (wording lives in site.ts → proposal.copy) ──────────── */

type CopyKey = "party" | "sponsor" | "bearer" | "flowerGirl"

const CEREMONY_BEARER_ROLE_IDS = new Set(["ring-bearer", "coin-bearer", "bible-bearer", "herald-bearer"])

function copyKeyFor(role: ProposalRole): CopyKey {
  if (role.type === "sponsor-ninong" || role.type === "sponsor-ninang") return "sponsor"
  if (role.id === "flower-girl") return "flowerGirl"
  if (CEREMONY_BEARER_ROLE_IDS.has(role.id)) return "bearer"
  return "party"
}

function isPlayful(key: CopyKey) {
  return key === "bearer" || key === "flowerGirl"
}

/* ── Small pieces ─────────────────────────────────────────────────────────── */

/** Config text with emoji / apostrophes / "&" / "!" in a clean font (display fonts lack them). */
function T({ text, className = "" }: { text: string; className?: string }) {
  return (
    <ProposalMixedText
      text={text}
      className={className}
      specialClassName={`${inter.className} inline-block align-baseline text-[0.95em] leading-none font-normal not-italic tracking-normal`}
    />
  )
}

/** Large corner decorations pinned to the screen corners, behind the card, plus drifting petals. */
function ProposalPageFrame() {
  const decos = useSiteConfig().proposal.decos
  const reduceMotion = useReducedMotion()
  const corners = [
    { src: decos.topLeft, pos: "tl" },
    { src: decos.topRight, pos: "tr" },
    { src: decos.bottomLeft, pos: "bl" },
    { src: decos.bottomRight, pos: "br" },
  ]
  return (
    <>
      <div className="invite-corners" aria-hidden>
        {corners.map(({ src, pos }) =>
          src ? (
            <div key={pos} className={`invite-corner invite-corner--${pos}`}>
              {/* Corners keep their original artwork colors (no tint) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="invite-corner__img" />
            </div>
          ) : null,
        )}
      </div>
      {!reduceMotion && (
        <div className="invite-motes" aria-hidden>
          {PETALS.map((m, i) => (
            <span
              key={i}
              className={`invite-mote${m.petal ? " invite-mote--petal" : ""}`}
              style={
                {
                  "--x": `${m.x}%`,
                  "--size": `${m.size}px`,
                  "--dur": `${m.dur}s`,
                  "--delay": `${m.delay}s`,
                  "--drift": `${m.drift}px`,
                  "--spin": `${m.spin}deg`,
                  "--c": m.color,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </>
  )
}

function OrnamentalDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`mx-auto flex items-center justify-center gap-2 ${compact ? "max-w-[10rem]" : "max-w-xs sm:max-w-sm"}`}
      aria-hidden
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--invite-line)]" />
      <span className="h-1 w-1 rotate-45 bg-[var(--invite-script)]" />
      <span className="h-1.5 w-1.5 rotate-45 bg-[var(--color-motif-accent)]" />
      <span className="h-1 w-1 rotate-45 bg-[var(--invite-script)]" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--invite-line)]" />
    </div>
  )
}

function DividerLine({ className = "w-16 sm:w-24 md:w-32" }: { className?: string }) {
  return <span className={`block h-px ${className}`} style={dividerLineStyle} aria-hidden />
}

/** Small-caps line between two short hairlines — the invitation's eyebrow. */
function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-8 sm:w-12" style={{ background: "linear-gradient(to right, transparent, var(--invite-line))" }} aria-hidden />
      <SmallCaps className="tracking-[0.3em] sm:tracking-[0.36em]">{children}</SmallCaps>
      <span className="h-px w-8 sm:w-12" style={{ background: "linear-gradient(to left, transparent, var(--invite-line))" }} aria-hidden />
    </div>
  )
}

function SmallCaps({
  children,
  className = "",
  color = palette.label,
}: {
  children: ReactNode
  className?: string
  color?: string
}) {
  return (
    <p
      className={`${cinzel.className} text-[0.64rem] font-semibold uppercase leading-relaxed tracking-[0.2em] sm:text-[0.7rem] sm:tracking-[0.24em] ${className}`}
      style={{ color }}
    >
      {children}
    </p>
  )
}

/** "JV & Jemiree" in The Seasons with a script "&". */
function CoupleNamesText({ className = "" }: { className?: string }) {
  const siteConfig = useSiteConfig()
  const groom = siteConfig.couple.groomNickname || siteConfig.couple.groom
  const bride = siteConfig.couple.brideNickname || siteConfig.couple.bride
  return (
    <p className={`${theSeasons.className} uppercase leading-snug tracking-[0.12em] ${className}`} style={{ color: TITLE }}>
      {groom}
      <span
        className={`${aboveTheBeyond.className} mx-2 inline-block text-[1.25em] normal-case tracking-normal`}
        style={{ color: SCRIPT_GREEN }}
        aria-hidden
      >
        &
      </span>
      <span className="sr-only">and</span>
      {bride}
    </p>
  )
}

function LayeredProposalTitle({ main, script }: { main: string; script: string }) {
  return (
    <h2
      className="welcome-title-lockup relative mx-auto w-full max-w-full text-center"
      style={
        {
          "--welcome-size": welcomeTitleSize.main,
          "--script-size": welcomeTitleSize.script,
          "--script-overlap": welcomeTitleSize.overlap,
        } as CSSProperties
      }
    >
      <span
        className={`${theSeasons.className} block uppercase leading-[0.92] tracking-[0.05em] min-[400px]:tracking-[0.08em] sm:leading-[0.94] sm:tracking-[0.12em] md:tracking-[0.14em]`}
        style={{ fontSize: "var(--welcome-size)", ...goldGradientText }}
      >
        <T text={main} />
      </span>
      {script ? (
        <>
          <span
            aria-hidden
            className={`${aboveTheBeyond.className} relative z-10 mx-auto block w-fit max-w-full px-1 leading-[1]`}
            style={{ marginTop: "var(--script-overlap)", fontSize: "var(--script-size)", color: SCRIPT_GREEN }}
          >
            <T text={script} />
          </span>
          <span className="sr-only">{script}</span>
        </>
      ) : null}
    </h2>
  )
}

const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: revealEase } },
}

/** Fades and lifts its content in as it scrolls into view (once). Waits until the invitation is open. */
function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: "div" | "p"
}) {
  const revealed = useContext(RevealContext)
  const reduceMotion = useReducedMotion()
  if (reduceMotion) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }
  const MotionTag = as === "p" ? motion.p : motion.div
  return (
    <MotionTag
      className={className}
      variants={scrollReveal}
      initial="hidden"
      whileInView={revealed ? "show" : undefined}
      viewport={{ once: true, amount: 0.35, margin: "0px 0px -8% 0px" }}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  )
}

function Paragraphs({ lines, className = "" }: { lines: readonly string[]; className?: string }) {
  if (lines.length === 0) return null
  return (
    <div className={`mx-auto max-w-md space-y-3.5 text-pretty sm:space-y-4 ${className}`} style={{ color: palette.body }}>
      {lines.map((line, i) => (
        <Reveal key={i} as="p">
          <T text={line} />
        </Reveal>
      ))}
    </div>
  )
}

/* ── Card shell ───────────────────────────────────────────────────────────── */

function ProposalCard({ children }: { children: ReactNode }) {
  // Arched top like a chapel window; the frames follow the same curve
  const arch = "rounded-t-[9rem] rounded-b-[1.5rem] sm:rounded-t-[15rem] sm:rounded-b-[2rem]"
  const archInner = "rounded-t-[8.4rem] rounded-b-[1.1rem] sm:rounded-t-[14rem] sm:rounded-b-[1.5rem]"
  const archInnermost = "rounded-t-[8rem] rounded-b-[0.85rem] sm:rounded-t-[13.4rem] sm:rounded-b-[1.2rem]"
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className={`pointer-events-none absolute -inset-4 opacity-70 blur-2xl ${arch}`} style={ambientGlowStyle} aria-hidden />
      <div
        className={`relative overflow-hidden border ${arch}`}
        style={{
          background: `radial-gradient(90% 30% at 50% 0%, #FFFFFF 0%, transparent 70%), linear-gradient(175deg, #FFFFFF 0%, ${IVORY} 55%, ${INNER_SURFACE} 100%)`,
          borderColor: "color-mix(in srgb, var(--color-motif-medium) 70%, transparent)",
          boxShadow: "0 30px 70px -36px var(--invite-shadow), inset 0 1px 0 rgb(255 255 255 / 85%)",
        }}
      >
        {/* Double hairline frame following the arch, diamond at the top and bottom */}
        <div
          className={`pointer-events-none absolute inset-2.5 sm:inset-4 ${archInner}`}
          style={{ border: `1px solid ${GOLD_BORDER_SOFT}` }}
          aria-hidden
        >
          <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ background: "var(--color-motif-accent)", boxShadow: "0 0 0 2px #FFFFFF" }} />
          <span className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rotate-45" style={{ background: "var(--color-motif-accent)", boxShadow: "0 0 0 2px #FFFFFF" }} />
        </div>
        <div
          className={`pointer-events-none absolute inset-[0.95rem] sm:inset-[1.45rem] ${archInnermost}`}
          style={{ border: "1px solid color-mix(in srgb, var(--color-motif-medium) 40%, transparent)" }}
          aria-hidden
        />

        <div className="relative z-20 px-6 pb-12 pt-16 text-center sm:px-14 sm:pb-16 sm:pt-24 md:px-16">{children}</div>
      </div>
    </div>
  )
}

/** Couple names set in type like the loading screen: nickname · "and" · nickname. */
function CoupleNamesStack() {
  const siteConfig = useSiteConfig()
  const groom = siteConfig.couple.groomNickname || siteConfig.couple.groom
  const bride = siteConfig.couple.brideNickname || siteConfig.couple.bride
  return (
    <h1 className="invite-names" aria-label={`${groom} and ${bride}`}>
      <span className={`${theSeasons.className} invite-names__nick text-[clamp(2.1rem,10vw,3.4rem)]`} aria-hidden>
        <T text={groom} />
      </span>
      <span className={`${aboveTheBeyond.className} invite-names__and text-[clamp(1.25rem,5.6vw,1.9rem)]`} aria-hidden>
        and
      </span>
      <span className={`${theSeasons.className} invite-names__nick text-[clamp(2.1rem,10vw,3.4rem)]`} aria-hidden>
        <T text={bride} />
      </span>
    </h1>
  )
}

/** Classic invitation date: month / weekday — day — time / year. */
function DateLockup() {
  const siteConfig = useSiteConfig()
  const dateStr = siteConfig.ceremony.date ?? siteConfig.wedding.date ?? defaultSiteConfig.ceremony.date
  const time = siteConfig.ceremony.time ?? siteConfig.wedding.time ?? defaultSiteConfig.ceremony.time
  const parsed = parseWeddingDate(dateStr)
  const weekday = siteConfig.ceremony.day || parsed.dayOfWeek
  const side = `${cinzel.className} w-[5.5rem] text-[0.6rem] font-semibold uppercase tracking-[0.24em] sm:w-28 sm:text-[0.7rem] sm:tracking-[0.3em]`

  return (
    <div className="mx-auto mt-6 w-full max-w-sm sm:mt-7" aria-label={`${weekday}, ${dateStr} at ${time}`}>
      <p className={`${theSeasons.className} text-[clamp(1.05rem,4.4vw,1.4rem)] uppercase leading-none tracking-[0.22em]`} style={{ color: TITLE }}>
        {parsed.month}
      </p>
      <div className="mt-2 flex items-center justify-center gap-2 sm:gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <DividerLine className="w-full" />
          <span className={side} style={{ color: palette.label }}>{weekday}</span>
          <DividerLine className="w-full" />
        </div>
        <span className="relative px-1">
          <span className="absolute inset-0 -z-0 rounded-full opacity-80 blur-xl" style={ambientGlowStyle} aria-hidden />
          <span
            className={`${playfair.className} relative block text-[clamp(2.8rem,13vw,4.25rem)] font-semibold italic leading-[0.95] tabular-nums`}
            style={{ color: SCRIPT_GREEN }}
          >
            {parsed.day}
          </span>
        </span>
        <div className="flex flex-col items-center gap-1.5">
          <DividerLine className="w-full" />
          <span className={side} style={{ color: palette.label }}>{time}</span>
          <DividerLine className="w-full" />
        </div>
      </div>
      <p className={`${cinzel.className} mt-2 text-[0.8rem] font-semibold tracking-[0.42em] sm:text-sm`} style={goldGradientText}>
        {parsed.year}
      </p>
    </div>
  )
}

/** Top of the invitation card: sprig, eyebrow, couple names with sprigs, script line, date. */
function CardHeader() {
  const siteConfig = useSiteConfig()
  const revealed = useContext(RevealContext)
  const reduceMotion = useReducedMotion()
  const { ornament, labels, nameDecos, showDate } = siteConfig.proposal
  const sprig = "pointer-events-none absolute top-1/2 h-auto w-12 -translate-y-1/2 select-none opacity-90 sm:w-20"

  return (
    <motion.header
      className="mb-9 sm:mb-12"
      variants={headerStagger}
      initial={reduceMotion ? false : "hidden"}
      animate={revealed ? "show" : "hidden"}
    >
      {ornament ? (
        <motion.div variants={headerItem}>
          <TintedDeco src={ornament} className="mx-auto mb-4 block h-auto w-24 select-none sm:mb-5 sm:w-32" />
        </motion.div>
      ) : null}
      {labels.headerEyebrow ? (
        <motion.div variants={headerItem}>
          <Eyebrow className="mb-5 sm:mb-6">
            <T text={labels.headerEyebrow} />
          </Eyebrow>
        </motion.div>
      ) : null}

      {/* Names flanked by eucalyptus sprigs */}
      <motion.div variants={headerItem} className="relative mx-auto max-w-md px-10 sm:px-16">
        {nameDecos?.left ? (
          <TintedDeco src={nameDecos.left} className={`${sprig} left-0`} />
        ) : null}
        {nameDecos?.right ? (
          <TintedDeco src={nameDecos.right} className={`${sprig} right-0`} />
        ) : null}
        <CoupleNamesStack />
      </motion.div>

      {labels.headerScript ? (
        <motion.p
          variants={headerItem}
          className={`${aboveTheBeyond.className} mt-4 text-[clamp(1.1rem,4.8vw,1.6rem)] leading-none`}
          style={{ color: SCRIPT_GREEN }}
        >
          <T text={labels.headerScript} />
        </motion.p>
      ) : null}

      {showDate ? (
        <motion.div variants={headerItem}>
          <DateLockup />
        </motion.div>
      ) : null}

      <motion.div variants={headerItem} className="mt-7 sm:mt-8">
        <OrnamentalDivider />
      </motion.div>
    </motion.header>
  )
}

function SignOff({ line }: { line: string }) {
  if (!line) return null
  return (
    <div className="text-center">
      <SmallCaps color={palette.bodySoft}>
        <T text={line} />
      </SmallCaps>
      <CoupleNamesText className="mt-1 text-base" />
    </div>
  )
}

/** Ceremony start in Philippine time (GMT+8), from the site's date + time strings. */
function useCeremonyTimestamp() {
  const siteConfig = useSiteConfig()
  const dateStr = siteConfig.ceremony.date ?? siteConfig.wedding.date ?? defaultSiteConfig.ceremony.date
  const timeStr = siteConfig.ceremony.time ?? siteConfig.wedding.time ?? defaultSiteConfig.ceremony.time
  return useMemo(() => {
    const parsed = parseWeddingDate(dateStr)
    const monthIndex = new Date(`${parsed.month} 1, 2000`).getMonth()
    const t = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)/i)
    let hour = 15
    let minute = 0
    if (t) {
      hour = Number(t[1]) % 12 + (t[3].toUpperCase() === "PM" ? 12 : 0)
      minute = Number(t[2])
    }
    const ts = Date.UTC(Number(parsed.year), monthIndex, Number(parsed.day), hour - 8, minute)
    return Number.isNaN(ts) ? null : ts
  }, [dateStr, timeStr])
}

/** One large day count until the ceremony — quiet, like an engraved line — plus the venue. */
function CountdownPanel({ venue }: { venue: string }) {
  const target = useCeremonyTimestamp()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const diff = target !== null && now !== null ? target - now : null
  const days = diff === null ? null : Math.max(0, Math.ceil(diff / 86_400_000))
  const isDay = diff !== null && days === 0

  return (
    <div className="relative mx-auto max-w-md px-2 py-2">
      <p className={`${aboveTheBeyond.className} text-[clamp(1.2rem,5vw,1.55rem)] leading-none`} style={{ color: SCRIPT_GREEN }}>
        {isDay ? "today is the day" : "only"}
      </p>

      {!isDay ? (
        <div className="mt-3 flex items-center justify-center gap-4 sm:gap-6" role="timer" aria-live="off">
          <span className="h-px w-12 sm:w-20" style={{ background: "linear-gradient(to right, transparent, var(--invite-line))" }} aria-hidden />
          <span className="relative">
            <span className="absolute inset-0 -z-0 rounded-full opacity-80 blur-xl" style={ambientGlowStyle} aria-hidden />
            <span
              className={`${playfair.className} relative block text-[clamp(3.4rem,16vw,5rem)] font-semibold italic leading-[0.9] tabular-nums`}
              style={{ color: TITLE }}
            >
              {days === null ? "\u00a0" : days.toLocaleString()}
            </span>
          </span>
          <span className="h-px w-12 sm:w-20" style={{ background: "linear-gradient(to left, transparent, var(--invite-line))" }} aria-hidden />
        </div>
      ) : null}

      {!isDay ? (
        <SmallCaps className="mt-3 tracking-[0.3em]">
          {days === 1 ? "day until we say “I do”" : "days until we say “I do”"}
        </SmallCaps>
      ) : null}

      <div className="mt-5">
        <OrnamentalDivider compact />
      </div>
      <p
        className="font-goudy-italic mx-auto mt-4 flex max-w-sm items-start justify-center gap-1.5 text-[0.9rem] leading-snug sm:text-[0.95rem]"
        style={{ color: palette.body }}
      >
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: palette.label }} aria-hidden />
        <span>
          <T text={venue} />
        </span>
      </p>
    </div>
  )
}

/* ── The letter ───────────────────────────────────────────────────────────── */

function ProposalLetter({
  copyKey,
  inviteeName,
  roleTitle,
  fill,
  bodyClass,
}: {
  copyKey: CopyKey
  inviteeName: string
  roleTitle: string
  fill: (text: string) => string
  bodyClass: string
}) {
  const siteConfig = useSiteConfig()
  const copy = siteConfig.proposal.copy[copyKey]
  const { labels } = siteConfig.proposal
  const playful = isPlayful(copyKey)

  const venueName = siteConfig.ceremony.location ?? defaultSiteConfig.ceremony.location
  const venueDetail = siteConfig.ceremony.venue ?? defaultSiteConfig.ceremony.venue
  const venue = `${venueName}${venueDetail && venueDetail !== venueName ? `, ${venueDetail}` : ""}`
  const greetingName = inviteeName.trim() || "Friend"

  return (
    <div className="mx-auto w-full max-w-lg space-y-7 text-center sm:space-y-8">
      {/* Greeting */}
      <Reveal className="space-y-3">
        <p
          className={
            playful
              ? `${playfair.className} text-[clamp(1.4rem,6vw,1.9rem)] font-semibold leading-tight [overflow-wrap:anywhere]`
              : `${theSeasons.className} text-[clamp(1.3rem,5.6vw,1.9rem)] leading-tight tracking-[0.05em] [overflow-wrap:anywhere]`
          }
          style={{ color: TITLE }}
        >
          <T text={`${fill(copy.greeting)} ${greetingName},`} />
        </p>
        <OrnamentalDivider compact />
      </Reveal>

      <Paragraphs lines={copy.intro.map(fill)} className={bodyClass} />

      {/* Live countdown to the ceremony + venue (the date itself is already in the header) */}
      <Reveal>
        <CountdownPanel venue={venue} />
      </Reveal>

      <Paragraphs lines={copy.body.map(fill)} className={bodyClass} />

      {/* Role / name summary (wedding party only, when the link carries a name) */}
      {copyKey === "party" && inviteeName.trim() ? (
        <Reveal>
        <div
          className="mx-auto grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-2xl border"
          style={{ borderColor: GOLD_BORDER_SOFT, background: GOLD_BORDER_SOFT }}
        >
          {[
            { label: labels.roleOffered, value: roleTitle, color: TITLE },
            { label: labels.preparedFor, value: inviteeName.trim(), color: SCRIPT_GREEN },
          ].map((cell) => (
            <div key={cell.label} className="px-3 py-4 sm:px-4 sm:py-5" style={{ background: IVORY }}>
              <SmallCaps className="text-[0.58rem] sm:text-[0.62rem]">
                <T text={cell.label} />
              </SmallCaps>
              <p
                className={`${theSeasons.className} mt-1.5 text-[0.98rem] tracking-wide [overflow-wrap:anywhere] sm:text-lg`}
                style={{ color: cell.color }}
              >
                <T text={cell.value} />
              </p>
            </div>
          ))}
        </div>
        </Reveal>
      ) : null}

      {copy.askLead ? (
        <Reveal>
          <SmallCaps className="mx-auto max-w-sm">
            <T text={fill(copy.askLead)} />
          </SmallCaps>
        </Reveal>
      ) : null}
    </div>
  )
}

function ProposalAsk({
  copyKey,
  roleTitle,
  submitting,
  onYes,
  onNo,
  fill,
  bodyClass,
}: {
  copyKey: CopyKey
  roleTitle: string
  submitting?: boolean
  onYes: () => void
  onNo: () => void
  fill: (text: string) => string
  bodyClass: string
}) {
  const siteConfig = useSiteConfig()
  const copy = siteConfig.proposal.copy[copyKey]
  const { labels, coupleImage } = siteConfig.proposal

  return (
    <div className="relative mx-auto mt-9 w-full max-w-lg px-1 sm:mt-11">
      {coupleImage ? (
        <Reveal className="relative mx-auto mb-5 w-[7.5rem] sm:mb-7 sm:w-[9.5rem]">
          <div className="absolute -inset-3 rounded-full opacity-70 blur-xl" style={ambientGlowStyle} aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coupleImage}
            alt="The couple"
            className="relative mx-auto block h-auto w-full select-none"
            style={{ filter: "drop-shadow(0 14px 28px var(--invite-shadow))" }}
          />
        </Reveal>
      ) : null}

      <Reveal>
        <h2 className={`${theSeasons.className} mx-auto max-w-md text-[clamp(1.15rem,5.2vw,1.6rem)] leading-snug tracking-[0.04em]`} style={{ color: INK }}>
          <T text={labels.askQuestion} />
          <span className="block pt-1 text-[1.3em] capitalize [overflow-wrap:anywhere]" style={goldGradientText}>
            <T text={`${roleTitle}?`} />
          </span>
        </h2>
      </Reveal>

      {copy.askNote ? (
        <div className="mt-4">
          <Paragraphs lines={[fill(copy.askNote)]} className={bodyClass} />
        </div>
      ) : null}

      <Reveal className="mx-auto mt-7 flex w-full max-w-sm flex-col gap-3 sm:mt-9">
        <button type="button" disabled={submitting} onClick={onYes} className={primaryBtnClass} style={primaryBtnStyle}>
          {submitting ? labels.saving : <T text={fill(copy.yesButton)} />}
        </button>
        <button type="button" disabled={submitting} onClick={onNo} className={secondaryBtnClass} style={secondaryBtnStyle}>
          <T text={fill(copy.noButton)} />
        </button>
      </Reveal>
    </div>
  )
}

/** Header for the after-answer cards (icon + layered title + subheader). */
function FlowHeader({
  icon,
  title,
  script,
  subheader,
  animated = false,
}: {
  icon: ReactNode
  title: string
  script: string
  subheader: string
  animated?: boolean
}) {
  const iconNode = (
    <div
      className="flex h-16 w-16 items-center justify-center rounded-full border"
      style={{
        borderColor: GOLD_BORDER,
        background: INNER_SURFACE,
        boxShadow: `0 0 0 5px ${IVORY}, 0 0 0 6px ${GOLD_BORDER_SOFT}, 0 14px 28px -14px var(--invite-shadow)`,
      }}
    >
      {icon}
    </div>
  )
  return (
    <div className="mb-6">
      <div className="mb-6 flex justify-center">
        {animated ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.6 }}>
            {iconNode}
          </motion.div>
        ) : (
          iconNode
        )}
      </div>
      <LayeredProposalTitle main={title} script={script} />
      {subheader ? (
        <SmallCaps className="mx-auto mt-5 max-w-md">
          <T text={subheader} />
        </SmallCaps>
      ) : null}
    </div>
  )
}

/** "rgb(r, g, b)" → "#rrggbb" (canvas-only consumers such as Silk). */
function rgbToHex(rgb: string) {
  const m = rgb.match(/\d+/g)
  if (!m || m.length < 3 || rgb.startsWith("#")) return rgb
  return `#${m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

type ProposalFlowState = "question" | "yes_details" | "yes_submitted" | "no_clicked" | "no_submitted"

interface ProposalPageProps {
  role: ProposalRole
}

function ProposalPageInner({ role }: ProposalPageProps) {
  const searchParams = useSearchParams()
  const inviteeFromLink = useMemo(() => parseInviteeNameFromSearchParams(searchParams), [searchParams])

  const [flowState, setFlowState] = useState<ProposalFlowState>("question")
  const [preferredName, setPreferredName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [showInvitation, setShowInvitation] = useState(false)
  const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(true)
  const [heroEnterFromLoading, setHeroEnterFromLoading] = useState(false)
  const [proposalVisible, setProposalVisible] = useState(false)
  const [enteringFromInvite, setEnteringFromInvite] = useState(false)

  const handleLoadingFadeStart = useCallback(() => {
    setShowInvitation(true)
    setHeroEnterFromLoading(true)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setLoadingOverlayVisible(false)
  }, [])

  const handleTransitionStart = useCallback(() => {
    setEnteringFromInvite(true)
    setProposalVisible(true)
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  const handleOpenInvitation = useCallback(() => {
    setShowInvitation(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
    window.setTimeout(() => setEnteringFromInvite(false), CINEMATIC_ENTRY_MS)
  }, [])

  const pageScrollLocked = loadingOverlayVisible || showInvitation
  const cinematicEntry = enteringFromInvite && proposalVisible

  useEffect(() => {
    if (inviteeFromLink) {
      setPreferredName(inviteeFromLink)
    }
  }, [inviteeFromLink])

  const siteConfig = useSiteConfig()
  const { labels } = siteConfig.proposal
  // Silk paints on canvas, so resolve the CSS token to a hex color (dusty blue, like the main invitation)
  const silkColor = rgbToHex(useCssColor("--color-welcome-heading", "#94505E"))
  const copyKey = copyKeyFor(role)
  const copy = siteConfig.proposal.copy[copyKey]
  const confirmedDisplayName = (inviteeFromLink || preferredName).trim()

  const groom = siteConfig.couple.groomNickname || siteConfig.couple.groom
  const bride = siteConfig.couple.brideNickname || siteConfig.couple.bride
  const fill = (text: string) =>
    text
      .split("{name}").join(confirmedDisplayName || "Friend")
      .split("{role}").join(role.title)
      .split("{groom}").join(groom)
      .split("{bride}").join(bride)

  // Playful roles (bearers, flower girl) read in Playfair; the rest in Goudy italic
  const bodyClass = isPlayful(copyKey)
    ? `${playfair.className} text-[0.95rem] font-medium leading-[1.7] sm:text-base`
    : `font-goudy-italic text-[0.98rem] sm:text-[1.05rem] ${sectionType.textRelaxed}`

  const submitResponse = async (status: "Confirmed" | "Declined", name: string) => {
    const response = await fetch("/api/proposal-responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: role.id,
        name,
        status,
        submittedAt: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to submit response")
    }

    window.dispatchEvent(new Event("entourageUpdated"))
  }

  const handleYesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preferredName.trim()) {
      setValidationError(labels.nameForm.required)
      return
    }
    setValidationError("")
    setSubmitting(true)

    try {
      await submitResponse("Confirmed", preferredName.trim())
      setFlowState("yes_submitted")
    } catch (err) {
      console.error("Failed to submit confirmation:", err)
      setValidationError(labels.saveError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNoSubmit = async () => {
    setSubmitting(true)
    setValidationError("")
    try {
      const declineLabel = confirmedDisplayName ? `${confirmedDisplayName} (declined)` : "Declined Entourage Offer"
      await submitResponse("Declined", declineLabel)
      setFlowState("no_submitted")
    } catch (err) {
      console.error("Failed to submit decline:", err)
      setValidationError(labels.saveError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleYesClick = async () => {
    const name = (inviteeFromLink || preferredName).trim()
    if (!name) {
      setFlowState("yes_details")
      return
    }
    setPreferredName(name)
    setValidationError("")
    setSubmitting(true)
    try {
      await submitResponse("Confirmed", name)
      setFlowState("yes_submitted")
    } catch (err) {
      console.error("Failed to submit confirmation:", err)
      setValidationError(labels.saveError)
    } finally {
      setSubmitting(false)
    }
  }

  const goTo = (state: ProposalFlowState) => {
    setValidationError("")
    setFlowState(state)
  }

  const errorLine = validationError ? (
    <p className="mt-4 text-center text-sm font-medium" style={{ color: TITLE }} role="alert">
      <T text={validationError} />
    </p>
  ) : null

  const cardMotion = {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  }

  return (
    <div
      className={`${theSeasons.variable} ${aboveTheBeyond.variable} relative min-h-[100dvh] select-none px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-16 md:py-20 ${pageScrollLocked ? "overflow-hidden" : "overflow-x-hidden"}`}
      style={{ background: sectionBackground, color: CREAM }}
    >
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.32]" aria-hidden>
        <Suspense fallback={<div className="h-full w-full" style={{ background: sectionBackground }} />}>
          <Silk speed={6} scale={1} color={silkColor} noiseIntensity={0} rotation={0.25} />
        </Suspense>
      </div>

      {loadingOverlayVisible && (
        <div className="invite-photo-backdrop-wrap invite-photo-backdrop-wrap--loading" aria-hidden="true">
          <InvitePhotoBackdrop />
        </div>
      )}

      {loadingOverlayVisible && (
        <LoadingScreen onFadeStart={handleLoadingFadeStart} onComplete={handleLoadingComplete} />
      )}

      {(loadingOverlayVisible || showInvitation) && (
        <InvitationHero
          onOpen={handleOpenInvitation}
          onTransitionStart={handleTransitionStart}
          enterFromLoading={heroEnterFromLoading}
          visible={showInvitation}
        />
      )}

      {cinematicEntry && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[28] bg-[var(--invite-page-bg)]"
          aria-hidden="true"
          initial={{ clipPath: "circle(0% at 50% 46%)", opacity: 0.98 }}
          animate={{ clipPath: "circle(145% at 50% 46%)", opacity: 0 }}
          transition={{ duration: 1.55, delay: 0.12, ease: proposalEntryEase }}
        />
      )}

      {proposalVisible && <ProposalPageFrame />}

      <RevealContext.Provider value={proposalVisible}>
      <motion.div
        initial={false}
        animate={proposalVisible ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 40, filter: "blur(8px)" }}
        transition={cinematicEntry ? { duration: 1.08, ease: proposalEntryEase, delay: 0.86 } : { duration: 0.01 }}
        className={`relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center justify-start pt-6 pb-4 sm:min-h-[calc(100dvh-8rem)] sm:justify-center sm:pt-0 ${proposalVisible ? "" : "pointer-events-none"}`}
        style={{ color: palette.body }}
      >
        <AnimatePresence mode="wait">
          {flowState === "question" && (
            <motion.div key="question" className="relative z-10 w-full" {...cardMotion}>
              <ProposalCard>
                <CardHeader />
                <ProposalLetter
                  copyKey={copyKey}
                  inviteeName={inviteeFromLink || preferredName}
                  roleTitle={role.title}
                  fill={fill}
                  bodyClass={bodyClass}
                />
                <ProposalAsk
                  copyKey={copyKey}
                  roleTitle={role.title}
                  submitting={submitting}
                  onYes={() => void handleYesClick()}
                  onNo={() => goTo("no_clicked")}
                  fill={fill}
                  bodyClass={bodyClass}
                />
                {errorLine}
                <Reveal className="mt-9 space-y-4 sm:mt-10">
                  <OrnamentalDivider compact />
                  <SignOff line={fill(copy.signOff)} />
                </Reveal>
              </ProposalCard>
            </motion.div>
          )}

          {flowState === "yes_details" && (
            <motion.form key="yes-form" onSubmit={handleYesSubmit} className="relative z-10 w-full" {...cardMotion}>
              <ProposalCard>
                <FlowHeader
                  icon={<Check className="h-6 w-6" style={{ color: INK }} />}
                  title={fill(labels.nameForm.title)}
                  script={fill(labels.nameForm.script)}
                  subheader={fill(labels.nameForm.subheader)}
                />
                <Paragraphs lines={[fill(labels.nameForm.body)]} className={bodyClass} />

                <div className="mx-auto mt-6 max-w-md text-left">
                  <label htmlFor="preferred-name" className="mb-2 block">
                    <SmallCaps>
                      <T text={labels.nameForm.label} /> <span style={{ color: "var(--color-welcome-heading)" }}>*</span>
                    </SmallCaps>
                  </label>
                  <input
                    id="preferred-name"
                    type="text"
                    required
                    placeholder={labels.nameForm.placeholder}
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    // 16px text on phones so iOS doesn't zoom in while typing
                    className="font-goudy-italic w-full select-text rounded-xl px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-motif-medium)_45%,transparent)] placeholder:text-[color-mix(in_srgb,var(--color-welcome-text)_55%,white)] focus:border-[var(--color-welcome-heading)]"
                    style={{
                      color: INK,
                      backgroundColor: IVORY,
                      border: `1px solid ${GOLD_BORDER}`,
                      boxShadow: "inset 0 1px 2px color-mix(in srgb, var(--invite-ink) 6%, transparent)",
                    }}
                  />
                </div>
                {errorLine}

                <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
                  <button type="submit" disabled={submitting} className={primaryBtnClass} style={primaryBtnStyle}>
                    {submitting ? labels.saving : <T text={labels.nameForm.submit} />}
                  </button>
                  <button type="button" onClick={() => goTo("question")} className={secondaryBtnClass} style={secondaryBtnStyle}>
                    <T text={labels.nameForm.cancel} />
                  </button>
                </div>
              </ProposalCard>
            </motion.form>
          )}

          {flowState === "yes_submitted" && (
            <motion.div key="yes-success" className="relative z-10 w-full" {...cardMotion}>
              <ProposalCard>
                <FlowHeader
                  animated
                  icon={<Sparkles className="h-7 w-7" style={{ color: CHAMPAGNE }} />}
                  title={fill(copy.yes.title)}
                  script={fill(copy.yes.script)}
                  subheader={fill(copy.yes.subheader)}
                />

                <div
                  className="mx-auto mb-7 max-w-sm rounded-2xl border px-5 py-4"
                  style={{ borderColor: GOLD_BORDER_SOFT, backgroundColor: INNER_SURFACE }}
                >
                  {confirmedDisplayName && !isPlayful(copyKey) ? (
                    <>
                      <SmallCaps className="text-[0.58rem] sm:text-[0.62rem]">
                        <T text={labels.registeredName} />
                      </SmallCaps>
                      <p className={`${theSeasons.className} mt-1 text-lg tracking-wide [overflow-wrap:anywhere]`} style={{ color: INK }}>
                        <T text={confirmedDisplayName} />
                      </p>
                    </>
                  ) : null}
                  <SmallCaps className="mt-1.5" color={palette.bodySoft}>
                    <T text={fill(copy.yes.roleLine)} />
                  </SmallCaps>
                </div>

                <Paragraphs lines={copy.yes.body.map(fill)} className={bodyClass} />

                <div className="mt-9 space-y-6">
                  <SignOff line={fill(copy.yes.signOff)} />
                  <DividerLine className="mx-auto w-full max-w-md" />
                  <Link href="/" className={`${primaryBtnClass} mx-auto max-w-sm`} style={primaryBtnStyle}>
                    <T text={labels.returnButton} />
                  </Link>
                </div>
              </ProposalCard>
            </motion.div>
          )}

          {flowState === "no_clicked" && (
            <motion.div key="no-confirm" className="relative z-10 w-full" {...cardMotion}>
              <ProposalCard>
                <FlowHeader
                  icon={<X className="h-6 w-6" style={{ color: CHAMPAGNE }} />}
                  title={fill(copy.no.title)}
                  script={fill(copy.no.script)}
                  subheader={fill(copy.no.subheader)}
                />
                <Paragraphs lines={copy.no.body.map(fill)} className={bodyClass} />
                {errorLine}
                <div className="mt-9 space-y-6">
                  <DividerLine className="mx-auto w-full max-w-md" />
                  <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void handleNoSubmit()}
                      disabled={submitting}
                      className={primaryBtnClass}
                      style={primaryBtnStyle}
                    >
                      {submitting ? labels.sending : <T text={labels.sendButton} />}
                    </button>
                    <button type="button" onClick={() => goTo("question")} className={secondaryBtnClass} style={secondaryBtnStyle}>
                      <T text={labels.goBack} />
                    </button>
                  </div>
                </div>
              </ProposalCard>
            </motion.div>
          )}

          {flowState === "no_submitted" && (
            <motion.div key="no-sent" className="relative z-10 w-full" {...cardMotion}>
              <ProposalCard>
                <FlowHeader
                  icon={<Heart className="h-6 w-6" style={{ color: CHAMPAGNE }} />}
                  title={fill(copy.sent.title)}
                  script={fill(copy.sent.script)}
                  subheader={fill(copy.sent.subheader)}
                />
                <Paragraphs lines={copy.sent.body.map(fill)} className={bodyClass} />
                <div className="mt-9 space-y-6">
                  <SignOff line={fill(copy.sent.signOff)} />
                  <DividerLine className="mx-auto w-full max-w-md" />
                  <Link href="/" className={`${secondaryBtnClass} mx-auto max-w-sm`} style={secondaryBtnStyle}>
                    <T text={labels.returnButton} />
                  </Link>
                </div>
              </ProposalCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </RevealContext.Provider>
    </div>
  )
}

export function ProposalPage(props: ProposalPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6" style={{ background: sectionBackground, color: CREAM }}>
          <p className={`${cinzel.className} text-sm uppercase tracking-[0.2em]`}>Loading invitation…</p>
        </div>
      }
    >
      <ProposalPageInner {...props} />
    </Suspense>
  )
}
