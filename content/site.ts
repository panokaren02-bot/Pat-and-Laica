import {
  proposalRoleDefinitions,
  proposalRoleIdAliases,
} from "@/content/proposal-roles"

export type TimelineIconName =
  | "arrival"
  | "rings"
  | "departure"
  | "cocktail"
  | "fireworks"
  | "dance"

export type AttireGroupId = "entourage" | "family" | "sponsors" | "guests"
// A palette color: "#9CAF88" or { name: "Sage", hex: "#9CAF88", role: "Dominant" } (role is optional)
export type AttireColor = string | { name: string; hex: string; role?: string }

/* ============================================================================
   SOP — CREATING / UPDATING AN INVITATION
   ----------------------------------------------------------------------------
   This file is the single source of truth for the couple's content. Pages,
   metadata (link previews), robots.txt, sitemap.xml, QR codes, the table
   finder and proposal pages all read from here. Avoid hard-coding couple
   names, dates, URLs or image paths in components — add them here instead.

   NEW INVITATION (cloned from a previous couple) — work top to bottom:
     1. COUPLE          names + nicknames (nicknames drive "Groom & Bride" text)
     2. DATE & TIMES    wedding date, day, entourage/guest/ceremony/reception times
     3. VENUES          ceremony + reception name, address, Google Maps link, photos;
                        VENUE_CARDS = one combined card or two separate cards + their labels
     4. RSVP            deadline, coordinator, phone; HASHTAGS
     5. WEBSITE         SITE_URL = the live domain (keep the trailing "/").
                        LINK_PREVIEW_IMAGE = 1200×630 JPG for Facebook/Messenger.
                        Both feed app/layout.tsx, app/robots.ts, app/sitemap.ts,
                        lib/proposal-metadata.ts and the table finder.
                        NEXT_PUBLIC_SITE_URL (env, e.g. on Vercel) overrides SITE_URL.
     6. LOOK & FEEL     DISPLAY_MODE "plain" or "photos"
     7. SHARED IMAGES   monogram, couple-name lettering, wax seal, music, COUPLE_PHOTOS
     8. googleAPI       new Apps Script / Form URLs for THIS couple's sheet —
                        never reuse the previous couple's (guests would mix).
     9. SECTIONS        love story, timeline events, ATTIRE (cards + palette), reminders,
                        FAQ, registry accounts/QRs, playlist, snap & share, socials.
    10. Search for "⚠ check" and old couple names/hashtags/QRs and replace them.

   BEFORE GOING LIVE:
     • Put every referenced file in /public (paths are case-sensitive on Vercel).
     • Run `npm run build` to catch typos.
     • Paste the live URL in https://developers.facebook.com/tools/debug/ and
       click "Scrape Again" so Facebook picks up the new title + preview image.
       (Changing the preview image? Rename the file — FB caches by URL.)
     • Test RSVP search, a test RSVP submission, messages and /table on mobile.

   CONVENTIONS:
     • Image paths start with "/" and are relative to /public.
     • "" on a decoration/image hides it; show: false hides a card/account/link.
     • Placeholders like {couple}, {name}, {deadline} are filled automatically —
       keep the braces when editing text.
     • ⚠ marks values likely left over from a previous couple.
   ============================================================================ */

/* ============================================================================
   QUICK SETUP — edit these first.
   Every section below reads from here, so one change updates the whole site
   (loader, envelope, hero, details, timeline, RSVP, FAQ, footer, …).
   ============================================================================ */

// ── The couple ──────────────────────────────────────────────────────────────
const COUPLE = {
  bride: "Jhellaica Marie C. Jaen",
  brideNickname: "Jhellaica",
  groom: "John Patrick O. Lagrama",
  groomNickname: "Patrick",
}

// ── Date & times ────────────────────────────────────────────────────────────
const WEDDING_DATE = "December 23,2026" // e.g. "June 5, 2027"
const WEDDING_DAY = "Saturday"
const TIMES = {
  entourageCall: "2:30 PM", // entourage assembly
  guestArrival: "2:30 PM", // guests arrival / assembly (shown in Event Details + reminders)
  ceremony: "3:00 PM",
  reception: "5:30 PM", // start of program
}

// ── Venues ──────────────────────────────────────────────────────────────────

const CEREMONY_VENUE = {
  name: "The Ranch",
  address: "Barangay San Jose (Tarlac- Sta. Rosa Road), Tarlac, Philippines, 2300",
  map: "https://maps.app.goo.gl/atAiK6xcjfuhgRJB7",
  photos: ["/Details/ceremony.jpg", "/Details/ceremony1.jpg", "/Details/ceremony2.jpg","/Details/ceremony3.jpg"],
}
const RECEPTION_VENUE = {
  name: "The Ranch",
  address: "Barangay San Jose (Tarlac- Sta. Rosa Road), Tarlac, Philippines, 2300",
  map: "https://maps.app.goo.gl/atAiK6xcjfuhgRJB7",
  photos: ["/Details/ceremony.jpg", "/Details/ceremony1.jpg", "/Details/ceremony2.jpg","/Details/ceremony3.jpg"],
}

// ── Venue cards (Event Details section) ─────────────────────────────────────
// layout:
//   "separate" = two cards: ceremony (CEREMONY_VENUE) + reception (RECEPTION_VENUE)
//   "combined" = ONE card for both — use when ceremony and reception share a venue.
//                Name, address, map and photos come from CEREMONY_VENUE.
// badge        = small pill on the photo (e.g. "Ceremony & Reception")
// sectionLabel = label above the venue name (e.g. "Venue")
// showDate     = show the big Month / Day / Year
// showArrival  = show "Arrival: <guest arrival time>" (otherwise "At <time>")
const VENUE_CARDS = {
  layout: "combined" as "separate" | "combined",
  // Used when layout is "combined"
  combined: {
    badge: "Ceremony & Reception",
    sectionLabel: "Venue",
    showDate: true,
    showArrival: false,
    // Time rows on the card, e.g. "Ceremony 4:30 PM | Reception 7:00 PM"
    ceremonyLabel: "Ceremony",
    receptionLabel: "Reception",
    // false = show only the ceremony time on the combined card
    showReceptionTime: false,
  },
  // Used when layout is "separate"
  ceremony: {
    show: true,
    badge: "Ceremony",
    sectionLabel: "Ceremony Venue",
    showDate: true,
    showArrival: true,
  },
  reception: {
    show: true,
    badge: "Reception",
    sectionLabel: "Reception Venue",
    showDate: false,
    showArrival: false,
  },
}

// ── RSVP & contact ──────────────────────────────────────────────────────────
const RSVP = {
  deadline: " November 30, 2026",
  coordinator: "{groom} / {bride}", // {groom} / {bride} → couple nicknames
  phone: "to be announced",
}
const HASHTAGS = ["#LAICAfoundtherightPAT"] // ⚠ check — looks like it's from a previous couple

// ── Attire guide (Event Details → Attire Guidelines) ────────────────────────
// SHOW = which cards to display AND their order, top to bottom. Examples:
//   ["guests"]                            guests only
//   ["entourage", "guests"]               entourage + guests
//   ["sponsors", "entourage", "guests"]   complete
//   ["guests", "sponsors"]                guests first, then sponsors
//   []                                    hide the whole attire guide
// Leave out a name to hide that card. Unknown or empty entries are ignored.
// Each card: fill in only what you need — anything left "" or [] is hidden.
//   image:     illustration path in /public ("" = no image; any size/shape works)
//   palette:   colors for this card — "#9CAF88" or { name: "Sage", hex: "#9CAF88" }
//              (names show on the swatches; [] = no palette)
//   ladies / gentlemen:
//     label:     e.g. "Ninang", "Bridesmaids", "Ladies"
//     details:   the dress code text ("" hides this half of the card)
//     highlight: phrase inside details shown bold + underlined ("" for none)
// Official wedding color palette — shown as circles with the name and role under each.
// Same hexes as the motif tokens in app/globals.css (change both together).
// Also shown in the "Dress Code" gentle reminder.
const DRESS_CODE_PALETTE: AttireColor[] = [
  { name: "Old Rose", hex: "#B86F7E", role: "Dominant" },
  { name: "Blush Pink", hex: "#E1B4BE", role: "Dominant" },
  { name: "Warm Cream", hex: "#F4EEE1", role: "Dominant" },
  { name: "Nude Beige", hex: "#E6D5BE", role: "Dominant" },
  { name: "Burgundy", hex: "#6E2430", role: "Accent" },
];

// Attire groups shown in the Details section (components/sections/details.tsx).
//   show      → which groups appear, in order
//   dressCode → small line under the palette title, e.g. "Formal Attire"
//   note      → closing line shown above the card's palette ("" = default color guide note)
//   Each side (ladies / gentlemen) has a label, an optional intro (details, with an
//   optional highlighted phrase) and an optional list of roles with what they wear.
const ATTIRE = {
  show: ["sponsors", "guests"] as AttireGroupId[],

  entourage: {
    title: "Entourage",
    image: "/Details/Entourage.png",
    dressCode: "Formal Attire",
    palette: [] as AttireColor[], // no palette on the entourage card
    note: "",
    ladies: {
      label: "Ladies",
      details: "Floor-length gowns in old rose, blush pink, cream or nude beige, with a touch of burgundy. Soft, flowy fabrics like chiffon or tulle are perfect, and each of you may wear a different shade from the palette.",
      highlight: "Floor-length gowns",
      roles: [] as { role: string; attire: string }[],
    },
    gentlemen: {
      label: "Gentlemen",
      details: "An ivory Barong Tagalog with dark brown slacks and brown leather shoes.",
      highlight: "ivory Barong Tagalog",
      roles: [] as { role: string; attire: string }[],
    },
  },

  family: {
    title: "Family",
    image: "/Details/Family.png",
    dressCode: "Formal Attire",
    palette: [
      { name: "Blue", hex: "#4E86B7" },
      { name: "Yellow", hex: "#F6D35B" },
      { name: "Black", hex: "#1E1E1E" },
    ] as AttireColor[],
    note: "",
    ladies: {
      label: "Ladies",
      details: "",
      highlight: "",
      roles: [
        { role: "Mothers of the Bride & Groom", attire: "Blue long dress." },
        { role: "Sisters", attire: "Yellow gown." },
      ],
    },
    gentlemen: {
      label: "Gentlemen",
      details: "",
      highlight: "",
      roles: [
        { role: "Fathers of the Bride & Groom", attire: "Black suit with a blue necktie." },
        { role: "Brothers", attire: "All-black suit and necktie." },
      ],
    },
  },

  sponsors: {
    title: "Principal Sponsors",
    image: "/Details/entourage-new.png",
    dressCode: "Formal Attire",
    palette: [] as AttireColor[], // no palette on the sponsors card
    note: "We invite our principal sponsors to dress elegantly in these designated colors to complement our wedding motif.",
    ladies: {
      label: "Ninang",
      details: "Floor-length formal gowns in Old Rose.",
      highlight: "Floor-length formal gowns",
      roles: [] as { role: string; attire: string }[],
    },
    gentlemen: {
      label: "Ninong",
      details: "Classic black suits with black ties and formal shoes.",
      highlight: "Classic black suits",
      roles: [] as { role: string; attire: string }[],
    },
  },

  guests: {
    title: "Wedding Guests",
    image: "/Details/guest-new-1.png",
    dressCode: "Formal / Semi-Formal Attire",
    palette: DRESS_CODE_PALETTE,
    note: "Our dominant motif is **Blush Pink (Old Rose)** and **Cream / Beige**, accented with a **Touch of Burgundy**. Kindly refrain from wearing pure white, as this is reserved for the Bride.",
    ladies: {
      label: "Ladies",
      details: "Flowy long or midi dresses in any of our wedding palette colors: Old Rose, Blush Pink, Warm Cream, Nude Beige, or Burgundy.",
      highlight: "Flowy long or midi dresses",
      roles: [] as { role: string; attire: string }[],
    },
    gentlemen: {
      label: "Gentlemen",
      details: "Long-sleeved collared shirts in Nude Beige, Cream, Blush Pink, Old Rose, or Burgundy, paired with Khaki, Brown, or Black slacks.",
      highlight: "Long-sleeved collared shirts",
      roles: [] as { role: string; attire: string }[],
    },
  },
}

// ── Website address (used for QR codes, link previews, table finder) ────────
// NEXT_PUBLIC_SITE_URL (env) overrides this when set.
const SITE_URL = "https://pat-and-laica.weddinginvitationrsvp.com/"
// Image shown when the link is shared (Facebook, Messenger, Viber, X, …) — 1200×630 JPG in /public
const LINK_PREVIEW_IMAGE = "/Details/LinkPreview.png"

// Site address with env override applied and no trailing slash — no need to edit
export const canonicalSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL).replace(/\/$/, "")

// ── Look & feel ─────────────────────────────────────────────────────────────
// "plain"  = no photo backgrounds anywhere (botanical cards, hides photo-only blocks)
// "photos" = photo backgrounds on the loader, envelope and closing section
const DISPLAY_MODE = "plain" as "photos" | "plain"

// ── Shared images ───────────────────────────────────────────────────────────
const BRAND = {
  monogram: "/monogram/monogram-new.png",
  coupleNameImage: "/Details/newcoupelNames.png", // couple-name lettering (loader, envelope)
  seal: "/monogram/seal-mongoram.png", // envelope wax seal
  backgroundMusic: "/background_music/Libu-Libong Buwan (Uuwian) - Kyle Raphael (Lyric Video).mp3",
}

// Couple photos reused across the site (gallery, loader, reminders, snap & share, closing)
const COUPLE_PHOTOS = [
  "/mobile-background/couples (9).webp",
  "/mobile-background/couples (11).webp",
  "/mobile-background/couples (13).webp",
  "/mobile-background/couples (17).webp",
  "/mobile-background/couples (18).webp",
  "/mobile-background/couples (57).webp",
  "/mobile-background/couples (81).webp",
  "/mobile-background/couples (83).webp",
  "/mobile-background/couples (5).webp",
]

// Portraits for the envelope reveal + the main cover photo (soft natural light, no heavy filters)
const COUPLE_PORTRAITS = {
  groom: "/mobile-background/couples (61).webp",
  bride: "/mobile-background/couples (52).webp",
  cover: "/Details/CoupleImage.png", // home hero cover photo
}

// Sliding photo marquee behind the loader and envelope — files in /public/mobile-background
const MARQUEE_PHOTO_COUNT = 88
const MARQUEE_PHOTOS = Array.from(
  { length: MARQUEE_PHOTO_COUNT },
  (_, i) => `/mobile-background/couples (${i + 1}).webp`,
)

// ── Decorations ─────────────────────────────────────────────────────────────
// Change a path here to swap it on every section at once.
// To change ONE section only, override it there, e.g. decos: { ...SECTION_DECOS, footerVine: "" }
const DECOR = {
  // Corner, header and footer decorations are turned off ("" hides them everywhere).
  // Originals: corners /deco/new-deco/{left,right}-{top-corner-new,bottom-corner}.png,
  // overlays /deco/new-deco/{left,right}-top-corner.png, header small-center.png, footer long-center.png
  cornerTopLeft: "",
  cornerTopRight: "",
  cornerBottomLeft: "",
  cornerBottomRight: "",
  cornerOverlayTopLeft: "", // floral corner layered over the top vines (loader + envelope)
  cornerOverlayTopRight: "",
  headerOrnament: "", // small sprig above titles
  footerVine: "", // long vine at section ends
  sideLeft: "/deco/lovestorydeco/Elegant-Eucalyptus-Left.png", // love story side sprigs
  sideRight: "/deco/lovestorydeco/Elegant-Eucalyptus-Right.png",
}

// The four corners as one set
const CORNER_DECOS = {
  topLeft: DECOR.cornerTopLeft,
  topRight: DECOR.cornerTopRight,
  bottomLeft: DECOR.cornerBottomLeft,
  bottomRight: DECOR.cornerBottomRight,
}

// Default decoration set used by most sections (corners + ornament + vine)
const SECTION_DECOS = {
  ...CORNER_DECOS,
  headerOrnament: DECOR.headerOrnament,
  footerVine: DECOR.footerVine,
}

// Handy derived values — no need to edit
const COUPLE_LABEL = `${COUPLE.groomNickname} & ${COUPLE.brideNickname}`

/* ============================================================================
   SECTIONS — wording and per-section options. Values above are referenced here.
   ============================================================================ */

// Principal sponsors Google Apps Script — used by the main page and /inviteone
const SPONSORS_API = "https://script.google.com/macros/s/AKfycbzFw1p7V90y2pH1p_69JuYtU1c_gQKbCjL5VE8_cVePe6otUp8tJVjQMt4HQV7OHNzI/exec"

export const siteConfig = {
  siteUrl: SITE_URL,
  linkPreviewImage: LINK_PREVIEW_IMAGE,
  couple: {
    ...COUPLE,
    monogram: BRAND.monogram,
    backgroundMusic: BRAND.backgroundMusic,
  },
  googleAPI:{
    messageForm: "https://docs.google.com/forms/d/e/1FAIpQLSd6xU-2yIy1NqlDo1FCVKD094Ay00LtKJEDwi3-Q53_2gZEyQ/formResponse",   //done
    message: "https://script.google.com/macros/s/AKfycbwIPJzCLc8JWTdspGwGK1U--8lpoFbSX4RekoWfVEdxV5TZi-9tet2W4fhAuPUj1N4o/exec",  //done
    guestList: "https://script.google.com/macros/s/AKfycbwsNT-ysI-taavtWmmS76ac1ym8IVqbs_4QJsNqaxtMokqAY7HMnfAnnqnggLSw0QMg/exec",  //done
    guestRequest: "https://script.google.com/macros/s/AKfycbxjHMMZqSpaxVrfrUi6ZNmjyX2CfDHz07mL8MFHHOdcsYBhktanmo0RWjbrh2xEDevX/exec",   //done
    entourage: "https://script.google.com/macros/s/AKfycby2kEmQ3V40LGIVrqUugN7C-jiivs3XRIhr1RnSjSldfCb6MfyorQQm53jrVtkrmhBr/exec",  //done
    sponsors: SPONSORS_API,  //done 
    // Principal sponsors shown on /inviteone and /invitetwo (entourage section)
    sponsorsInviteOne: SPONSORS_API, // same sheet as sponsors above
    sponsorsInviteTwo: "https://script.google.com/macros/s/AKfycbzFw1p7V90y2pH1p_69JuYtU1c_gQKbCjL5VE8_cVePe6otUp8tJVjQMt4HQV7OHNzI/exec",
////google share 
    googleShare: "https://docs.google.com/spreadsheets/d/18q3VFEsfZUw1UP0iD8yOEGRrDeKoQGI0hy9KyuttP3s/edit?usp=sharing",
    videoMessageForm:
      "https://docs.google.com/forms/d/e/1FAIpQLSfeGlEl4CMXWefdvCw6AOPHFS1ROku_rs-Gbofa2LkVJ0sLGQ/viewform", 
  },
  wedding: {
    date: WEDDING_DATE,
    time: TIMES.ceremony,
    venue: CEREMONY_VENUE.name,
    tagline: "are getting married!!!!!",
    theme: "Blush Pink (Old Rose) & Cream / Beige, with a touch of Burgundy",
    motif: "#B86F7E, #E1B4BE, #F4EEE1, #E6D5BE, #6E2430",
  },
  // Opening "Save the Date" loading screen (components/loader/LoadingScreen.tsx).
  // Couple names, wedding date and ceremony details come from couple / wedding / ceremony above.
  loadingScreen: {
    // "photos" = sliding photo background + photo date cards
    // "plain"  = no images at all: soft solid background + plain date cards
    display: DISPLAY_MODE,
    // Colors used when display is "plain"
    plainTheme: {
      background: "var(--color-welcome-bg)",
      text: "var(--color-welcome-text)",
      accent: "var(--color-welcome-gold)",
    },
    // Sliding photo marquee behind the loader and envelope (both display modes); files live in /public
    backgroundPhotos: MARQUEE_PHOTOS,
    // Opening title on the loader and the envelope letter — short joining words ("of", "the") are set in script
    headline: "Mark Your Calendar",
    // {days} is replaced with the number of days left before wedding.date
    countdownText: "{days} more days to go",
    countdownOneDayText: "1 more day to go",
    countdownTodayText: "Today is the day",
    countdownPastText: "Thank you for celebrating with us",
    coupleNameImage: BRAND.coupleNameImage,
    // Shown in the three date cards (Month / Day / Year), left to right (display: "photos")
    photos: [
      "/frontboxes/couple (1).webp",
      "/frontboxes/couple (2).webp",
      "/frontboxes/couple (3).webp",
    ],
    dateLabels: ["Month", "Day", "Year"],
    // Plain mode invitation card — classic invitation wording around the couple's names ("" to hide a line)
    plainInvite: {
      ornament: DECOR.headerOrnament,
      lineAbove: "Together with their families",
      lineBelow: "request the honour of your presence",
    },
    showCeremonyDetails: true,
    eyebrow: "You are invited",
    message: "We can't wait to celebrate with you",
    // Rotates under the progress bar while the invitation loads
    statusMessages: [
      "Gathering our favorite moments",
      "Setting the table for you",
      "Crafting your invitation experience",
    ],
    durationMs: 10000,
    // Invitation envelope (components/loader/Hero.tsx) — shares display + photos with loader above
    hintText: "Tap the Seal to Open",
    enterButtonText: "View the Invitation",
    sealImage: BRAND.seal,
    // Revealed when the envelope opens: one portrait of each, side by side (groom left, bride right)
    portraits: {
      groom: COUPLE_PORTRAITS.groom,
      bride: COUPLE_PORTRAITS.bride,
    },
    // Bouquet tucked inside the open envelope, peeking out on both sides ("" to hide)
    envelopeFlowers: "/deco/new-deco/Blush Garden Rose Corner Bouquet.png",
    // Main page cover photo (home hero, plain display) — one natural, candid couple photo
    coverPhoto: COUPLE_PORTRAITS.cover,
    coverPhotoAlt: COUPLE_LABEL,
    // All four corner florals (top two are drawn smaller in CSS; "" hides a corner)
    cornerDecos: { ...CORNER_DECOS },
    // Floral corners drawn on top of the top corner vines ("" hides one)
    cornerOverlays: {
      topLeft: DECOR.cornerOverlayTopLeft,
      topRight: DECOR.cornerOverlayTopRight,
    },
  },
  // Couple video (components/sections/couple-video.tsx)
  coupleVideo: {
    title: "A Glimpse of Our Love",
    script: "Our Journey Together",
    subtitle: "Watch the journey that brought our hearts together",
    closingNote: "A glimpse into the moments that made our hearts one",
    // Your own video file in /public (e.g. "/video/our-story.mp4"). When set it is
    // played directly with no YouTube at all; leave "" to use youtubeId instead.
    videoSrc: "",
    // YouTube video ID — the part after "watch?v=" (or after "youtu.be/")
    youtubeId: "ojZmsQf8_AM",
    // Cover image shown before the video plays
    thumbnail: "/Details/thumbnail.jpg",
    thumbnailAlt: `${COUPLE_LABEL} — video cover`,
    playLabel: "Play our video",
  },
  // Love story timeline (components/sections/love-story.tsx + StorySection)
  loveStory: {
    title: "Our Love Story",
    subtitle: "a love that bloomed",
    // Shown above a chapter's title when it has no date, e.g. "Chapter 03"
    chapterLabel: "Chapter",
    // Closing block: big word, hashtag, then the verse (also shown in Snap & Share)
    closingEyebrow: "Puhon", // large word on top — "" hides it
    closingHashtag: HASHTAGS[0] ?? "", // "" hides it
    closingQuoteLead: "He hath made every thing beautiful in his time", // bold first line ("" for none)
    closingQuote: "also he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end.",
    closingCitation: "Ecclesiastes 3:11 KJV",
    eucalyptusDecos: {
      topLeft: DECOR.sideLeft,
      bottomRight: DECOR.sideRight,
      timelineTop: DECOR.headerOrnament,
      sectionBottom: DECOR.footerVine,
    },
    // The story, one chapter at a time. date → small caps line above the title ("" shows "Chapter 0X").
    // image → photo beside the text ("" for none). {groom} / {bride} → nicknames.
    chapters: [
      {
        date: "August 2015",
        title: "Where It All Began",
        theme: "light" as const,
        layout: "image-left" as const,
        image: "/mobile-background/couples (31).webp",
        imageAlt: "{groom} and {bride}",
        paragraphs: [
          "Every love story has a first page, and ours was written at Golden Faith Academy. Two people in the same place at the same time, neither of us knowing that a simple meeting would quietly become the start of everything.",
        ],
      },
      {
        date: "March 2016",
        title: "The First Hello",
        theme: "dark" as const,
        layout: "image-right" as const,
        image: "/mobile-background/couples (70).webp",
        imageAlt: "{groom} and {bride} smiling together",
        paragraphs: [
          "Then came our first real conversation. It started small, the way the best things often do: a few words, a little laughter, and a feeling that this was easy.",
          "Before we knew it, one conversation turned into many, and talking to each other became the best part of our days.",
        ],
      },
      {
        date: "January 7, 2018",
        title: "Made It Official",
        theme: "light" as const,
        layout: "image-left" as const,
        image: "/mobile-background/couples (80).webp",
        imageAlt: "{groom} and {bride} together",
        paragraphs: [
          "On January 7, 2018, we stopped wondering and started choosing each other. What began as a friendship became a promise to show up, to grow together, and to make room for each other in every plan, big or small.",
        ],
      },
      {
        date: "July 25, 2026",
        title: "She Said Yes!",
        theme: "dark" as const,
        layout: "image-right" as const,
        image: "/mobile-background/couples (4).webp",
        imageAlt: "{groom} and {bride} after the proposal",
        paragraphs: [
          "And then, on July 25, 2026, {groom} asked the question, and {bride} said YES! Every conversation, every adventure, and every quiet, ordinary day of loving each other had been leading us here.",
        ],
      },
      {
        date: "Him & Her",
        title: "Perfectly Different",
        theme: "light" as const,
        layout: "image-left" as const,
        image: "/mobile-background/couples (42).webp",
        imageAlt: "{groom} and {bride}",
        paragraphs: [
          "Along the way, we learned just how different we are, and how perfectly matched.",
          "{groom} is happiest with coffee in hand, a good nap on standby, the latest political news, and an action-packed movie. He has also truly mastered the art of doing absolutely nothing.",
          "{bride} creates little masterpieces, bakes sweet treats, cooks with love, gets lost in K-drama worlds, and always says yes to the next adventure.",
        ],
      },
      {
        date: "Us",
        title: "Our Little World",
        theme: "dark" as const,
        layout: "image-right" as const,
        image: "/mobile-background/couples (56).webp",
        imageAlt: "{groom} and {bride}",
        paragraphs: [
          "Together, we've built a world that's entirely ours. We spoil our fur baby Naira like royalty, never say no to another hotpot date, and keep collecting the little moments that become big memories.",
          "Above everything else, we choose quality time, because being together is our favorite place to be. Now we're counting down to forever, and we can't wait to celebrate its beginning with you. ♡",
        ],
      },
    ],
  },
  // Gallery section (components/sections/gallery.tsx)
  gallery: {
    eyebrow: "Our Moments",
    title: "Gallery",
    subtitle: "our favorite moments",
    description:
      "From our first chapter to this beautiful season of commitment — every moment has been a testament to love, faith, and grace.",
    footnote:
      "More pictures will be added as we gather the rest of our favorite moments. Please check back — this gallery is still growing.",
    buttonText: "View Full Gallery",
    buttonHref: "/gallery",
    decos: { ...SECTION_DECOS },
    // Uses COUPLE_PHOTOS; replace with your own list if the gallery should differ.
    // text → caption used as the photo's description
    images: [
      { image: "/mobile-background/couples (5).webp", text: "image 1" },
      { image: "/mobile-background/couples (11).webp", text: "image 2" },
      { image: "/mobile-background/couples (13).webp", text: "image 3" },
      { image: "/mobile-background/couples (17).webp", text: "image 4" },
      { image: "/mobile-background/couples (18).webp", text: "image 5" },
      { image: "/mobile-background/couples (57).webp", text: "image 6" },
      { image: "/mobile-background/couples (81).webp", text: "image 7" },
      { image: "/mobile-background/couples (83).webp", text: "image 8" },
    ],
  },

  // "/mobile-background/couples (9).webp",
  // "/mobile-background/couples (11).webp",
  // "/mobile-background/couples (13).webp",
  // "/mobile-background/couples (17).webp",
  // "/mobile-background/couples (18).webp",
  // "/mobile-background/couples (57).webp",
  // "/mobile-background/couples (81).webp",
  // "/mobile-background/couples (83).webp",
  // "/mobile-background/couples (5).webp",
  // Event details section (components/sections/details.tsx)
  // Venue names, addresses, dates, times, maps and venue photos come from ceremony / reception below.
  // In reminder text, {guestsTime} and {ceremonyTime} are replaced from ceremony below.
  eventDetails: {
    eyebrow: "Our Celebration",
    title: "Event Details",
    subtitle: "our special day",
    description: "Everything you need to know about our special day.",
    // Verse under the description — "" hides it
    verse: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.",
    verseCitation: "1 Corinthians 13:13",
    decos: { ...SECTION_DECOS },
    // Venue cards layout:
    //   "separate" = one card each for ceremony and reception (uses ceremony / reception below)
    //   "combined" = ONE card for both — use when ceremony and reception share a venue.
    //                Venue name, address, map and photos come from CEREMONY_VENUE;
    //                the card lists both times (ceremony.time + reception.time).
    // Set in QUICK SETUP → VENUE_CARDS
    venues: VENUE_CARDS,
    labels: {
      arrival: "Arrival",
      at: "At",
      scanForDirections: "Scan for directions",
      getDirections: "Get Directions",
      copyAddress: "Copy Address",
      copied: "Copied!",
    },
    // Cards, colors, images and which groups show → QUICK SETUP → ATTIRE
    attire: {
      title: "Attire Guidelines",
      description: "Our day is dressed in warm, romantic tones, and we would love for you to wear them with us. Please follow the guide for your role below.",
      // Shown above a card's palette
      paletteTitle: "Official Color Palette",
      paletteSubtitle: "", // script line under the palette title — "" hides it
      colorGuideTitle: "Color Guide",
      colorGuideNote: "Choose any shade from the palette below. Solid colors and soft, flowy fabrics are all welcome.",
      // Order and visibility come from ATTIRE.show (skips blanks, typos and repeats)
      groups: ATTIRE.show
        .filter((id, i, list) => ["entourage", "family", "sponsors", "guests"].includes(id) && list.indexOf(id) === i)
        .map((id) => ({ id, ...ATTIRE[id] })),
      // Shared dress code palette (used by the "Strictly Formal" reminder)
      palette: DRESS_CODE_PALETTE,
    },
    reminders: {
      title: "Gentle Reminders",
      description: "A few thoughtful notes to help everyone enjoy our celebration.",
      // Small photos that take turns above the "Gentle Reminders" title (files in /public/box)
      images: [
        "/box/box (1).jpg",
        "/box/box (2).jpg",
        "/box/box (3).jpg",
        "/box/box (4).jpg",
      ],
      // showPalette: shows the dress code palette after the first paragraph
      items: [
        {
          title: "Adults-Only Celebration",
          variant: "accent" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "We love your kids, but consider this your night off! Please note that our celebration is adults-only.",
          ],
        },
        {
          title: "No Surprise Announcements",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "To keep the focus on the celebration, we kindly ask that there be no surprise announcements or proposals during our wedding.",
          ],
        },
        {
          title: "Keep Our Invitation Private",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "Please keep this just between us! Kindly refrain from posting our invitation online.",
          ],
        },
        {
          title: "Parking",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "Parking for both cars and motorcycles is available inside the venue.",
          ],
        },
        {
          title: "Unplugged Ceremony",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "We're having a mostly unplugged ceremony. Guests may take photos, but we kindly ask that it be kept minimal. Please avoid blocking or crowding our official photographers so they can capture the special moments. We'd love for everyone to stay present and share the moment with us. Don't worry—professional photos will be shared with you after the event. Thank you for your understanding.",
          ],
        },
        {
          title: "Dress Code",
          variant: "accent" as "accent" | "soft",
          showPalette: true,
          paragraphs: [
            "Guests, kindly come in semi-formal attire in any of our palette colors: old rose, blush pink, warm cream, nude beige, or a touch of burgundy.",
            "Please avoid casual clothes and all-white outfits.",
          ],
        },
        {
          title: "Arrival",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "To ensure everything runs smoothly, please arrive at {guestsTime}. This will give you enough time to find your seat, settle in comfortably, and fully enjoy the beautiful ceremony before it begins at {ceremonyTime}. We truly appreciate your punctuality and look forward to celebrating this special moment with you.",
          ],
        },
        {
          title: "Reception Details",
          variant: "accent" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "Please join us for early dinner, laughter, and dancing after the ceremony.",
          ],
        },
      ],
    },
  },
  // Wedding day timeline (components/sections/wedding-timeline.tsx)
  weddingTimeline: {
    kicker: "Join us as we tie the knot!",
    title: "Timeline",
    subtitle: "our wedding day",
    description:
      "From the first arrival to the last farewell, here is how we will spend this day together.",
    // "" hides the verse — Isaiah 60:22 is already shown in the Love Story
    quote: "",
    quoteCitation: "",
    // Optional corner decorations — leave "" to hide
    decos: {
      topLeft: "",
      topRight: "",
      bottomLeft: "",
      bottomRight: "",
    },
    // Each event — shown top to bottom in this order (move a block to reorder):
    //   show:     true = display on the site, false = hide it (still kept here to edit later)
    //   time:     shown above the title; TIMES.* come from QUICK SETUP, others are typed in, e.g. "4:00 PM"
    //   location: text shown under the title; {ceremony} / {reception} are replaced
    //             with ceremony.location / reception.location ("" to hide)
    //   image:    line-art illustration from /public/weddingtimeline; "" to use the icon instead
    //   icon:     fallback icon when there is no image —
    //             "arrival" | "rings" | "departure" | "cocktail" | "fireworks" | "dance"
    //   description: optional extra line ("" to hide)
    events: [
      {
        show: true,
        time: TIMES.guestArrival,
        title: "Guests Arrive",
        description: "",
        location: "{ceremony}",
        image: "/weddingtimeline/assemble.png",
        icon: "arrival" as TimelineIconName,
      },
      {
        show: true,
        time: TIMES.ceremony,
        title: "Ceremony",
        description: "",
        location: "{ceremony}",
        image: "/weddingtimeline/WeddingCeremony.png",
        icon: "rings" as TimelineIconName,
      },
      {
        show: true,
        time: "4:00 PM",
        title: "Photo, Coffee & Light Bites",
        description: "",
        location: "{reception}",
        image: "/weddingtimeline/PhotoSession.png",
        icon: "cocktail" as TimelineIconName,
      },
      {
        show: true,
        time: "5:00 PM",
        title: "Dinner & Celebration",
        description: "",
        location: "{reception}",
        image: "/weddingtimeline/DinnerService.png",
        icon: "cocktail" as TimelineIconName,
      },
      {
        show: true,
        time: "7:30 PM",
        title: "Closing Toast",
        description: "Please stay until the end of the program at 8:00 PM.",
        location: "{reception}",
        image: "/weddingtimeline/SendOff.png",
        icon: "departure" as TimelineIconName,
      },
      // Unused events — set show: true to bring one back
      {
        show: false,
        time: "4:30 PM",
        title: "Cocktails",
        description: "",
        location: "{reception}",
        image: "/weddingtimeline/CockTailHour.png",
        icon: "cocktail" as TimelineIconName,
      },
      {
        show: false,
        time: TIMES.reception,
        title: "Start of Program",
        description: "",
        location: "{reception}",
        image: "/weddingtimeline/reception welcom.png",
        icon: "fireworks" as TimelineIconName,
      },
      // Spare illustrations — set show: true and a time to use them
      {
        show: false,
        time: "",
        title: "Cake Cutting",
        description: "",
        location: "{reception}",
        image: "/weddingtimeline/cakecutting.png",
        icon: "fireworks" as TimelineIconName,
      },
      {
        show: false,
        time: "",
        title: "First Dance",
        description: "",
        location: "{reception}",
        image: "/weddingtimeline/dance.png",
        icon: "dance" as TimelineIconName,
      },
    ],
  },
  // Wedding entourage (components/sections/entourage.tsx)
  // Names and roles come from the Google Sheet (googleAPI.entourage); couple names from couple above.
  entourage: {
    eyebrow: "Our People",
    title: "Wedding Entourage",
    subtitle: "standing with us",
    description: "Honoring those who stand with us on our special day",
    coupleKicker: "Together as one",
    coupleLine: "The beginning of our forever",
    coupleHeading: "The Couple",
    groomRole: "Groom",
    brideRole: "Bride",
    loadingText: "Loading entourage...",
    retryingText: "Still gathering the wedding party. Trying again...",
    errorText: "Unable to load entourage",
    retryText: "Try again",
    // Leave any path "" to hide that decoration
    decos: { ...SECTION_DECOS },
    // Rename any heading shown in the entourage card: "Heading as shown": "Your text"
    headingLabels: {
      "Parents of the Groom": "Parents of the Groom",
      "Parents of the Bride": "Parents of the Bride",
      "Principal Sponsors": "Principal Sponsors",
      "Peer Sponsors": "Peer Sponsors",
      "Family of the Groom": "Family of the Groom",
      "Family of the Bride": "Family of the Bride",
      "Man of Honor": "Man of Honor",
      "Best Man": "Best Man",
      "Maid of Honor": "Maid of Honor",
      "Matron of Honor": "Matron of Honor",
      "Little Groom": "Little Groom",
      "Little Bride": "Little Bride",
      "Flower Girls": "Flower Girls",
      "Beloved Entourage": "Beloved Entourage",
      "To light our path": "To light our path",
      "To Cloth us as one": "To Cloth us as one",
      "To bind us together": "To bind us together",
    } as Record<string, string>,
  },
  // RSVP / guest list (components/sections/guest-list.tsx) — card, search, RSVP form and all modals.
  // Placeholders in curly braces are filled in automatically: {name}, {count}, {n}.
  // The RSVP deadline itself comes from details.rsvp.deadline.
  rsvp: {
    headerOrnament: DECOR.headerOrnament, // "" to hide
    title: "RSVP",
    script: "Are you going",
    intro: "Kindly confirm your attendance so we may prepare a place for you at our celebration.",
    deadlineLabel: "RSVP Deadline",
    openButton: "Tap here to respond",
    search: {
      title: "RSVP",
      script: "Find your Name",
      placeholder: "Begin with your first name",
      loading: "Preparing the guest list. We'll keep trying until names appear.",
      refine: "Keep typing to refine results",
      notFoundTitle: "Not finding your name?",
      notFoundText: "We'd love to have you with us. Send a request to join the celebration.",
      requestButton: "Request to Join",
    },
    invite: {
      title: "You are Invited",
      scriptFallback: "to our celebration",
      greeting: "Hello {name}, you are invited to our wedding!",
      seats: "We've reserved {count} for you.",
      seatSingular: "seat",
      seatPlural: "seats",
    },
    responded: {
      title: "Thank You for Responding!",
      text: "We've received your RSVP and look forward to celebrating with you!",
      attending: "You're Attending!",
      declined: "Unable to Attend",
      guestCountLabel: "Number of Guests",
      closeButton: "Close",
    },
    form: {
      attendLabel: "Can you attend? *",
      yes: "Yes!",
      no: "Sorry, No",
      companionsLabel: "Who's Coming With You?",
      companionsHint: "Please provide names and relationships for your {count} additional {guests}",
      guestSingular: "guest",
      guestPlural: "guests",
      companionTitle: "Guest {n}",
      companionNameLabel: "Full Name",
      companionNamePlaceholder: "Name of guest {n}",
      relationshipLabel: "Relationship with {name}",
      relationshipFallbackName: "Primary Guest",
      relationshipPlaceholder: "e.g., Spouse, Friend, Child, Parent",
      // One-tap relationship choices shown under the relationship field
      relationshipOptions: ["Spouse", "Partner", "Child", "Parent", "Sibling", "Friend"],
      companionProgress: "Guest {n} of {total}",
      companionsAdded: "{done} of {total} added",
      prevButton: "Back",
      nextButton: "Next guest",
      phoneLabel: "Phone Number *",
      phonePlaceholder: "09XX XXX XXXX",
      phoneNote: "For wedding updates only. Your number stays private and will never be shown to other guests.",
      submitting: "Submitting...",
      submit: "Submit RSVP",
    },
    phoneAlert: {
      title: "A phone number is needed",
      paragraphs: [
        "We ask for your number so we can reach you with important updates — seating, timing, or anything you may need on the day.",
        "Your number will not appear on this invitation, and it will not be shared with other guests. It is kept private and used only by us and our coordinators to take care of you.",
      ],
      button: "Add my number",
    },
    success: {
      title: "RSVP Confirmed",
      attending: "We're thrilled you'll be joining us — your spot is saved!",
      declined: "We'll miss you, but thank you for letting us know.",
      neutral: "Thank you for your response!",
      messagePrompt:
        "Before you go, leave a message for the couple — your words will be a cherished memory they can always look back on.",
      messageButton: "Leave a Message",
      laterButton: "Maybe later — close",
    },
    request: {
      title: "Request",
      script: "to join us",
      greetingNamed: "Hi {name} — want to celebrate with us? Send a request!",
      greeting: "Want to celebrate with us? Send a request!",
      optional: "(Optional)",
      nameLabel: "Full Name *",
      namePlaceholder: "Enter your full name",
      emailLabel: "Email Address",
      emailPlaceholder: "your.email@example.com",
      phoneLabel: "Phone Number",
      phonePlaceholder: "+63 912 345 6789",
      guestsLabel: "Number of Guests *",
      guestsPlaceholder: "How many guests?",
      messageLabel: "Message",
      messagePlaceholder: "Share why you'd like to join...",
      submitting: "Submitting...",
      submit: "Send Request",
      sentTitle: "Request Sent!",
      sentText: "We've received your request",
      sentSubtext: "We'll review it and get back to you soon",
      autoClose: "This will close automatically",
    },
    messages: {
      thankYou: "Thank you for your response!",
      requestSubmitted: "Request submitted! We'll review and get back to you.",
      loadFailed: "Failed to load guest list",
      selectAttendance: "Please select if you can attend",
      nameRequired: "Name is required",
      requestFailed: "Failed to submit request. Please try again.",
      submitFailed: "We couldn't save your RSVP. Please check your connection and try again.",
    },
  },
  // Messages wall (components/sections/message-wall-display.tsx)
  // Small decorations on each message card — leave "" to hide
  messageWall: {
    cardDecos: {
      topRight: DECOR.cornerTopRight, // sprig tucked in the card's top-right corner
      bottomLeft: "", // e.g. DECOR.cornerBottomLeft (sits behind the text — keep it subtle)
    },
  },
  // Book of guests (components/sections/book-of-guests.tsx) — confirmed guests come from the guest list API.
  bookOfGuests: {
    title: "Book of Guests",
    subtitle: "celebrating with us",
    description:
      "Meet the cherished souls joining us in celebration — your presence makes our day truly special.",
    statsEyebrow: "Our Celebration",
    guestSingular: "Guest",
    guestPlural: "Guests",
    statsCaption: "Celebrating With Us",
    rsvpSingular: "RSVP",
    rsvpPlural: "RSVPs",
    partySingular: "Party",
    partyPlural: "Parties",
    thankYou: "Thank you for confirming your RSVP — your presence means the world to us.",
    updatedLabel: "Updated",
    refreshLabel: "Refresh guest counts",
    listEyebrow: "Joining Us",
    listDescription: "A glimpse of the wonderful guests celebrating with us",
    vipLabel: "VIP",
    noTable: "No Table Yet",
    companionsLabel: "With Them",
    // Shown when a guest has more than 4 companions
    companionsMore: "+{count} more",
    companionsLess: "Show less",
    confirmedLabel: "Confirmed",
    emptyTitle: "Guest list updating",
    emptyText: "Confirmed guests will appear here as RSVPs come in.",
    // How many guest cards show at once (rotates every few seconds when there are more)
    cardsPerView: 4,
    // Leave any path "" to hide that decoration
    decos: { ...SECTION_DECOS },
  },
  // FAQ (components/sections/faq.tsx)
  // In answers you can use:
  //   {deadline}    → details.rsvp.deadline
  //   {coordinator} → details.rsvp.coordinator
  //   {contact}     → " at <phone>" when details.rsvp.phone is set (empty while "to be announced")
  //   [link text](#section-id) → a link that smoothly scrolls to that section
  //   A blank line (\n\n) starts a new paragraph; lines starting with "• " show as a bulleted list
  faq: {
    eyebrow: "A Few Notes",
    title: "Frequently Asked Questions",
    subtitle: "everything you need to know",
    description:
      "Helpful notes so you can simply arrive, celebrate, and enjoy this new chapter with us.",
    // Leave any path "" to hide that decoration
    decos: { ...SECTION_DECOS },
    // Answers: blank line = new paragraph, "• " = bullet, [label](#section) or [label](https://…) = link.
    // {deadline} {coordinator} {contact} {groom} {bride} are filled in automatically.
    items: [
      {
        question: "When is the wedding?",
        answer: `Our wedding will be held on ${WEDDING_DAY}, ${WEDDING_DATE}. The ceremony begins at ${TIMES.ceremony}, and the reception follows at ${TIMES.reception}.`,
      },
      {
        question: "What time should I arrive for the ceremony?",
        answer: `Please arrive by ${TIMES.guestArrival} so you have time to find your seat and settle in. The ceremony will begin promptly at ${TIMES.ceremony}. Entourage members are requested to assemble at ${TIMES.entourageCall}.`,
      },
      {
        question: "Where will the ceremony and reception take place?",
        answer: `Both the ceremony and the reception will be held at ${CEREMONY_VENUE.name}, ${CEREMONY_VENUE.address}. [Open in Google Maps](${CEREMONY_VENUE.map})`,
      },
      {
        question: "How do I RSVP?",
        answer:
          "Please RSVP using the [guest list](#guest-list) on this invitation: search for your name and confirm your attendance.\n\nPlease respond by {deadline}.\n\nIf you have questions, please contact {coordinator}{contact}.",
      },
      {
        question: 'Do we really need to RSVP? We already said "Yes" to the couple.',
        answer:
          "Yes, please. We will be needing your formal RSVP to consolidate guest details and finalize the headcount for catering and seating purposes.",
      },
      {
        question: "May we choose our own seats at the reception?",
        answer:
          "We kindly ask that you take the place reserved for you. Each seat has been arranged with care so everyone may be comfortably seated with those we hoped you would share the evening with.",
      },
      {
        question: 'Can I bring a "Plus One" to the event?',
        answer:
          "As much as we would love to accommodate all our friends and family, we have a limited number of guests. Please understand that this event is strictly by invitation only.",
      },
      {
        question: "Can I bring my child to the event?",
        answer:
          "We love your kids, but consider this your night off! Please note that our celebration is adults-only.",
      },
      {
        question: "May I make an announcement or a proposal during the wedding?",
        answer:
          "To keep the focus on the celebration, we kindly ask that there be no surprise announcements or proposals during our wedding.",
      },
      {
        question: "Can I share the invitation online?",
        answer:
          "Please keep this just between us! Kindly refrain from posting our invitation online.",
      },
      {
        question:
          'I said "No" to the RSVP but I had a change of plans—I can attend now! What should I do?',
        answer:
          "Please check with us first as we have a strict guest list. If seats become available, we will let you know as soon as possible. Please do not attend unannounced, as we may not have any available seats for you.",
      },
      {
        question: "What if I RSVP'd but cannot attend?",
        answer:
          "We would love to have you at our wedding, but we understand that there are circumstances beyond our control. However, please let us know as soon as possible so we can reallocate your seat/s.",
      },
      {
        question: "Is there parking available?",
        answer:
          "Yes, parking for both cars and motorcycles is available inside the venue. Please arrive a little early so you have time to park comfortably.",
      },
      {
        question: "What is the dress code?",
        answer:
          "Please follow the [attire guide](#details) in Event Details. Our guest dress code is semi-formal in old rose, blush pink, warm cream or nude beige, with a touch of burgundy. Ladies may wear a flowy long or midi dress in any of these colors. Gentlemen may wear a long-sleeve collared shirt in old rose, blush pink, nude beige or burgundy with beige or khaki slacks. Kindly avoid casual clothes and all-white outfits.",
      },
      {
        question: "Will the ceremony be unplugged?",
        answer:
          "Mostly. You may take a few photos, but we kindly ask that you keep it minimal and avoid blocking or crowding our official photographers. We would love for everyone to stay present and share the moment with us. Don't worry—professional photos will be shared with you after the event.",
      },
      {
        question: "Can I take photos or videos during the reception?",
        answer:
          "Yes. We would love for you to capture the joy throughout the reception. We prepared this celebration wholeheartedly and we want everyone to enjoy it fully.",
      },
      {
        question: "When would it be most thoughtful to take our leave?",
        answer:
          "It would mean so much if you could stay with us through the end of the program. We have prepared the evening with love, and we hope you will laugh, take photos, and celebrate until the night draws to a close.",
      },
      {
        question: "What if I have dietary restrictions or allergies?",
        answer:
          "Please let us know about any dietary restrictions or allergies when you RSVP. We want to ensure everyone can enjoy the celebration comfortably.",
      },
      {
        question: "How can I help the couple have a great time during their wedding?",
        answer:
          "• Pray with us for favorable weather and the continuous blessings of our Lord as we enter this new chapter of our lives as husband and wife.\n• RSVP as soon as your schedule is cleared.\n• Dress according to the attire guide and color palette.\n• Arrive on time.\n• Follow the seating arrangement at the reception.\n• Stay until the end of the program.\n• Join the activities and enjoy!",
      },
    ],
  },
  // Gift guide (components/sections/registry.tsx). The signature uses couple.groomNickname / brideNickname.
  registry: {
    eyebrow: "A Token of Love",
    title: "Gift Guide",
    subtitle: "with gratitude",
    description: "Your presence on our wedding day is the greatest gift of all.",
    paragraphs: [
      "Your presence and prayers are all that we request; but should you wish to bless us further, a monetary gift is one we humbly suggest.",
      "Your love and generosity mean the world to us.",
    ],
    thankYou: "Thank you for being part of our story.", // "" hides the line
    signOff: "With joyful hearts,",
    signature: "{groom} & {bride}", // "" falls back to "{groom} & {bride}" nicknames
    // Colors — any CSS color or a palette token from app/globals.css (e.g. "var(--color-motif-accent)")
    colors: {
      title: "var(--color-welcome-navy)",                                              // "Gift Guide", account names
      script: "var(--color-welcome-heading)",                                          // drop cap, couple signature
      eyebrow: "var(--color-welcome-heading)",                                         // small caps labels, icons
      body: "var(--color-welcome-text)",                                               // paragraphs
      soft: "color-mix(in srgb, var(--color-welcome-text) 75%, white)",                // "With joyful hearts," and secondary text
      card: "#FFFFFF",                                                                 // letter card
      cardEdge: "color-mix(in srgb, var(--color-motif-medium) 65%, transparent)",      // letter card border
      accountCard: "color-mix(in srgb, var(--color-motif-medium) 12%, white)",         // e-gift account card
      button: "linear-gradient(180deg, var(--color-welcome-heading) 0%, color-mix(in srgb, var(--color-welcome-heading) 72%, var(--color-welcome-navy)) 100%)", // gift seal, selected tab, Save QR
      line: "var(--color-motif-yellow)",                                               // sage dividers
      glow: "color-mix(in srgb, var(--color-motif-medium) 30%, transparent)",          // tab track / borders
      background: "var(--color-motif-cream)",                                          // section background
    },
    // E-gift accounts — optional, as many as you like.
    //   showAccounts: false hides the whole block
    //   show:  false hides one account
    //   qr:    "/QR/BPI.png" to show a QR image, or "" when you have no QR (card shows name + number only).
    //          Guests can tap the QR to enlarge it and save it with the "Save QR" button.
    //   accountNumber: shown under the name (display only)
    //   With 2+ visible accounts, guests switch between them with a toggle; each shows its QR and a "Save QR" button
    showAccounts: false,
    accountsTitle: "For e-gifts",
    accountsNote: "Choose an account, then scan its QR — tap the QR to enlarge.",
    saveQrLabel: "Save QR",
    zoomNote: "Scan with your banking or e-wallet app, or save it and upload from your gallery.",
    accounts: [
      { show: true, label: "BPI", accountName: "Raph", accountNumber: "********619", qr: "/QR/BPI.png" },
      { show: true, label: "GCash", accountName: "JU***H H", accountNumber: "0906267****", qr: "/QR/Gcash.png" },
      { show: false, label: "BDO", accountName: "", accountNumber: "", qr: "" },
    ] as { show: boolean; label: string; accountName: string; accountNumber: string; qr: string }[],
    // Leave any path "" to hide that decoration
    decos: { ...SECTION_DECOS },
  },
  // Table finder page (/table — components/table-finder.tsx)
  tableFinder: {
    decos: { ...CORNER_DECOS },
    // "Find Your Table" QR card on the dashboard (components/table-finder-qr-card.tsx)
    // {couple} → "Groom & Bride" nicknames. "" hides a line or image.
    qrCard: {
      coupleNameImage: BRAND.coupleNameImage, // unused: the card sets the names in type like the loader
      coupleImage: "/Details/coupleImage.png", // couple illustration beside the text
      eyebrow: "The wedding of",
      title: "Find Your Table",
      script: "please be seated",
      description:
        "Place this code at the entrance. Guests scan it, search their name, and go straight to their table.",
      scanLabel: "Scan to find your table",
      buttonText: "Download QR",
      downloadNote: "Saves a print-ready PNG for signs and table cards.",
      previewText: "Preview seating page",
    },
  },
  // Entourage proposal pages (components/proposal-page.tsx)
  // Text placeholders: {name} = invitee, {role} = role title, {groom} / {bride} = nicknames.
  // Each invitation type has its own wording:
  //   party      → Best Man, Maid/Matron of Honor, Bridesmaid, Groomsman, Little Bride, secondary sponsors
  //   sponsor    → Principal Sponsors (Ninong / Ninang)
  //   bearer     → Ring / Coin / Bible / Herald Bearer
  //   flowerGirl → Flower Girl
  // A list ([...]) shows one paragraph per line; "" or [] hides that part.
  proposal: {
    decos: { ...CORNER_DECOS },
    coupleNameImage: BRAND.coupleNameImage, // unused: names are set in type like the loader
    coupleImage: "/Details/coupleImage.png", // couple illustration above the question
    ornament: DECOR.headerOrnament, // small sprig at the top of the card; "" to hide
    // Eucalyptus sprigs on either side of the couple name; "" to hide one
    nameDecos: { left: DECOR.sideLeft, right: DECOR.sideRight },
    showDate: true, // big date under the couple name (Month / Day / Day-number / Time / Year)
    // Use "Maid of Honor" for unmarried, "Matron of Honor" for married
    honorAttendant: "Matron of Honor" as "Matron of Honor" | "Maid of Honor",
    roles: proposalRoleDefinitions,
    roleIdAliases: proposalRoleIdAliases,
    // Shared labels used on every invitation.
    // Placeholders: {name} invitee, {role} role title, {groom} / {bride} nicknames.
    labels: {
      headerEyebrow: "A Personal Invitation",
      headerScript: "written just for you",
      saveTheDate: "Save the Date",
      roleOffered: "Your role",
      preparedFor: "Written for",
      askQuestion: "Will you be our",
      registeredName: "Your name on our list",
      returnButton: "Return to Our Wedding Page",
      saving: "Saving...",
      sending: "Sending...",
      sendButton: "Send My Response",
      goBack: "Go Back",
      saveError: "We couldn't save your response just now. Please try again.",
      // Shown when the invite link has no name and the guest says yes
      nameForm: {
        title: "You Said Yes",
        script: "our hearts are full",
        subheader: "Just one little thing",
        body: "We're so happy to have you with us! How would you like your name to appear on our invitation and guest list?",
        label: "Your Preferred Name",
        placeholder: "e.g. Tita Maria Clara / Mr. James Reyes",
        required: "Please type your preferred name so we can include you properly.",
        submit: "Confirm My Name",
        cancel: "Cancel",
      },
    },
    copy: {
      party: {
        greeting: "Dear",
        intro: [
          "Before anything else, we wanted you to hear this from us personally.",
          "We're getting married! After everything we've shared so far, we're ready to begin the next chapter of our lives together, and we couldn't wait to tell you.",
        ],
        body: [
          "This little letter isn't a general invitation. We wrote it with you in mind.",
          "When we pictured our wedding day, we thought about the people who have walked with us, laughed with us and cheered us on. Your name came up right away.",
          "We would love for you to be more than a guest. We'd love you right beside us, sharing the nerves, the joy, the happy tears and every memory we'll keep from that day.",
        ],
        askLead: "So, with all our hearts, we'd like to ask you",
        askNote:
          "We know it takes a bit of your time and effort, and we don't take that lightly. More than anything, we just want you there with us, celebrating this moment together.",
        yesButton: "Yes, I'd Love To!",
        noButton: "I Can't, But With Love",
        signOff: "With all our love,",
        yes: {
          title: "You Said Yes",
          script: "thank you",
          subheader: "You just made our day",
          roleLine: "Standing with us as our {role}",
          body: [
            "Thank you, {name}. Knowing you'll be right beside us makes our wedding feel even more like us. We can't wait to celebrate, laugh, and make memories with you. We'll be in touch soon with all the little details!",
          ],
          signOff: "With so much love,",
        },
        no: {
          title: "Thank You",
          script: "for telling us",
          subheader: "We completely understand",
          body: [
            "Thank you for taking the time to read our letter and think it over. There are truly no hard feelings. Whether you're beside us or cheering from wherever you are, we're grateful to have you in our lives.",
          ],
        },
        sent: {
          title: "Response Sent",
          script: "with love",
          subheader: "Your reply has reached us",
          body: [
            "We hope you'll still celebrate with us in your own way. Your love and good wishes mean the world to us.",
          ],
          signOff: "With love and warmest wishes,",
        },
      },
      sponsor: {
        greeting: "Dear",
        intro: [
          "We wanted to share some happy news with you, and we wanted you to hear it from us first.",
          "We're getting married, and we're about to begin a new life together as husband and wife.",
        ],
        body: [
          "This letter is not a general invitation. It's a personal request, written especially for you.",
          "As we prepare for this day, we keep thinking of the people we look up to. You have shown us, in ways you may not even realize, what a loving and faithful life looks like.",
          "To us, a {role} is more than a name in our program. It is someone whose wisdom we trust, whose prayers we hold dear, and whose example we hope to follow as we build our own home.",
        ],
        askLead: "With deep respect and sincerity, we'd like to ask you",
        askNote: "Having you stand with us, and having your blessing on our marriage, would mean more to us than we can say.",
        yesButton: "Yes, I'd Be Honored 🤍",
        noButton: "I Can't, But With Love",
        signOff: "With love and respect,",
        yes: {
          title: "You Said Yes",
          script: "thank you",
          subheader: "We are truly honored",
          roleLine: "Our {role}",
          body: [
            "Thank you, {name}, for accepting this role with such an open heart. Your guidance and prayers mean so much to us, and we're grateful to begin our marriage with you beside us. We'll reach out soon with the details.",
          ],
          signOff: "With love and heartfelt gratitude,",
        },
        no: {
          title: "Thank You",
          script: "for your kindness",
          subheader: "We completely understand and respect your decision",
          body: [
            "Thank you for reading our letter and giving our request your thought. There are no hard feelings at all. We're simply grateful for you, and we'd be happy to have your prayers and blessings in whatever way you can share them.",
          ],
        },
        sent: {
          title: "Response Sent",
          script: "with gratitude",
          subheader: "Your reply has reached us",
          body: [
            "Thank you for being part of our story. Your love and good wishes mean the world to us.",
          ],
          signOff: "With love and warmest wishes,",
        },
      },
      bearer: {
        greeting: "Hi",
        intro: [
          "Guess what? We have the happiest news, and we wanted to tell you first! 🤍",
          "{groom} & {bride} are getting married!",
        ],
        body: [
          "Our wedding is going to be a very special day, and it wouldn't feel complete without you there with us.",
        ],
        askLead: "So we have a super important question, just for you:",
        askNote: "You'd get to walk down the aisle and carry something very precious for our ceremony. We think you'd be amazing at it!",
        yesButton: "Yes, I'd Love To! 🤍",
        noButton: "Maybe Next Time 🤍",
        signOff: "With lots of love,",
        yes: {
          title: "Yay!",
          script: "you said yes!",
          subheader: "You're officially on our team!",
          roleLine: "Our {role}",
          body: [
            "We're so excited to have you as our {role}! We can't wait to see you walk down the aisle. You have a very special job, and we know you'll do great. See you on our big day! 🤍",
          ],
          signOff: "With lots of love,",
        },
        no: {
          title: "That's Okay!",
          script: "we understand",
          subheader: "No worries at all 😊",
          body: [
            "Thank you for thinking about being our {role}. You are special to us no matter what, and we'd love to celebrate with you either way.",
          ],
        },
        sent: {
          title: "Response Sent",
          script: "thank you",
          subheader: "Thanks for letting us know",
          body: ["You are so special to us, and we can't wait to celebrate with you."],
          signOff: "With lots of love,",
        },
      },
      flowerGirl: {
        greeting: "Hi",
        intro: [
          "Guess what? We have the happiest news, and we wanted to tell you first! 🤍",
          "{groom} & {bride} are getting married!",
        ],
        body: [
          "Our wedding needs a little extra sweetness, lots of smiles, and a sprinkle of magic. We thought of you right away.",
        ],
        askLead: "And we have a very special role we'd love for you to have:",
        askNote: "You'd get to walk down the aisle before the bride and make our day even more beautiful. We think you'd be perfect!",
        yesButton: "Yes, I'd Love To! 🌸",
        noButton: "Maybe Next Time 🤍",
        signOff: "With lots of love,",
        yes: {
          title: "Yay!",
          script: "you said yes!",
          subheader: "We're so happy you'll be our Flower Girl!",
          roleLine: "Our {role}",
          body: [
            "We can't wait to see you walk down the aisle! Have fun, smile big, and enjoy every moment. See you on our big day! 🤍",
          ],
          signOff: "With lots of love,",
        },
        no: {
          title: "That's Okay!",
          script: "we understand",
          subheader: "No worries at all 😊",
          body: [
            "Thank you for thinking about being our Flower Girl. You are special to us no matter what, and we'd love to celebrate with you either way!",
          ],
        },
        sent: {
          title: "Response Sent",
          script: "thank you",
          subheader: "Thanks for letting us know",
          body: ["You are so special to us, and we can't wait to celebrate with you."],
          signOff: "With lots of love,",
        },
      },
    },
  },
  details: {
    rsvp: { ...RSVP },
  },
  contact: {
    bridePhone: "to be announced",
    groomPhone: "to be announced",
    email: "to be announced",
  },
  giftRegistry: {
    // QR_1:{
    // id: "BPI",
    // src: "/QR/BPI.png",
    // label: "BPI",
    // accountNumber: "KAMS : ***********569",
    // },
    // QR_2:{
    // id: "MariBank",
    // src: "/QR/MariBank.png",
    // label: "MariBank",
    // accountNumber: "****7672",
    // }
    // ,
    // QR_3:{
    // id: "Gcash",
    // src: "/QR/pleaseProvideQR.png",
    // label: "Gcash",
    // accountNumber: "to be announced",
    // }
  },
  // Built from QUICK SETUP — edit the values at the top of the file
  ceremony: {
    location: CEREMONY_VENUE.name,
    venue: CEREMONY_VENUE.address,
    map: CEREMONY_VENUE.map,
    date: WEDDING_DATE,
    day: WEDDING_DAY,
    time: TIMES.ceremony,
    entourageTime: TIMES.entourageCall,
    guestsTime: TIMES.guestArrival,
    image: CEREMONY_VENUE.photos,
  },
  reception: {
    location: RECEPTION_VENUE.name,
    venue: RECEPTION_VENUE.address,
    map: RECEPTION_VENUE.map,
    date: WEDDING_DATE,
    day: WEDDING_DAY,
    time: TIMES.reception,
    image: RECEPTION_VENUE.photos,
  },
  dressCode: {
    theme: "Whimsical Spring Minimalist",
    sponsors: {
      title: "Sponsors",
      ninang: {
        label: "Ninang",
        description: "Long gown in the shade of silver gray.",
        image: "/Details/Ninang.png",
        palette: ["#D8D3CD", "#C0C0C0", "#A9A9A9", "#969090", "#8C8686"],
      },
      ninong: {
        label: "Ninong",
        description: "Barong Tagalog and black slacks.",
        image: "/Details/Ninong.png",
        palette: ["#D0A386", "#E3C5B3", "#E4DCD1"],
      },
    },
    entourage: {
      title: "Entourage",
      bridesmaid: {
        label: "Bridesmaids",
        description: "Long gown that suits our color motif.",
        image: "/Details/bridesmaid.png",
        palette: ["#B4A3D4", "#C8A2C8"],
      },
      groomsmen: {
        label: "Groomsmen",
        description: "Long sleeve Barong Tagalog and black slacks.",
        image: "/Details/Groomsmen.png",
        palette: ["#D0A386", "#E3C5B3", "#E4DCD1"],
      },
    },
    guests: {
      title: "Guests",
      label: "Guests",
      description: "Casual attire: Whimsical Spring.",
      image: "/Details/guest.png",
      palette: ["#835643", "#C48C73", "#E3CAC5", "#CBAFA1", "#F2E9E2"],
    },
    paletteNote:
      "Our theme is Whimsical Spring Minimalist. Entourage: women, a flowy spring sage green dress, strictly floor length; gentlemen, a black and white suit, a white and gray suit, or sage green long sleeves with gray or brown pants — strictly no rubber shoes. Guests: casual attire, Whimsical Spring.",
    closing:
      "Thank you for helping us bring our wedding vision to life. We can't wait to celebrate with you!",
    note: "We kindly request our guests to dress in attire following our Whimsical Spring Minimalist palette.",
  },
  narratives: {
    ourStory: `Once upon a signature…

Our story began with a simple signature, one that slowly turned into something magical. He was my financial advisor, and I was there to sign documents. It was July 5, 2021, and we met at the Lobby of the building. Little did we know, that ordinary day would start a story neither of us expected.

I wasn't looking for anything, yet somehow, our connection grew in its own gentle, unexpected way. And then, on June 1, 2022, our story truly began—we became us. We found a love that feels like home.

Our journey wasn't rushed, but perfectly timed. We believe that God brought us together in His own way and season.

With hearts full of gratitude, we step into this new chapter hand in hand, trusting His plan and celebrating a love rooted in faith, patience, and grace.

Today, we choose each other- again and again- and we can't wait to celebrate this new chapter with the people we love most.`,
    groom: `The first time Mark saw Catherine, time seemed to slow down. It was an ordinary day that instantly became unforgettable: one smile, one hello, and suddenly his world had a new center. He didn't have the perfect words ready, but he knew he had met someone who felt like home.

Early conversations turned into late-night talks, sharing dreams, favorite meals, and whispered prayers for a future together. With every small adventure—coffee runs, long drives, quiet walks—Mark found himself choosing her over and over again. He loved how she laughed freely, how she listened with her whole heart, and how her faith steadied him.

There were seasons of distance and long workdays, but every reunion reminded him why he stayed patient: because Catherine was worth every mile and every minute apart. When he finally knelt to ask for her hand, it wasn't a question of "if," only "when can we start forever?"`,
    bride: `Catherine remembers the first time Mark said her name. It was gentle but sure, a kindness that made her feel both seen and safe. In that softness, she found a partner who met her with the same grace she prayed to give.

Mark's steadiness won her heart: the way he showed up, even when schedules were tight, and how he always found lightness in the small things. He celebrated her wins, held space for her worries, and never hesitated to choose "us" in every decision.

Now, as they prepare to say yes before God and the people they love most, Catherine is grateful for the patience, humor, and hope Mark brings to every day. She knows this next chapter is just the start of the love story they get to write together.`,
  },
  colors: {
    primary: "#87AE73",
    secondary: "#F5F5DC",
  },
  // Wedding playlist (components/sections/wedding-playlist.tsx). {couple} → "Groom & Bride" nicknames.
  playlist: {
    eyebrow: "Our Soundtrack",
    title: "A Playlist from our hearts",
    script: "songs of our love",
    subtitle: "Songs that have been part of our journey together",
    // Shown on the playlist card
    cardEyebrow: "Spotify Playlist",
    playlistName: `${COUPLE_LABEL} Wedding`,
    cardNote: "Press play and listen along — every song holds a little piece of our story.",
    buttonText: "Open in Spotify",
    // Leave any path "" to hide that decoration
    decos: { ...CORNER_DECOS, headerOrnament: DECOR.headerOrnament },
    embedUrl:
    //https://open.spotify.com/embed/playlist/5sT43YjdM8pJ3xtEkrxyEY?utm_source=generator&si=e5e64aa63fd04356
      "https://open.spotify.com/embed/playlist/7DhxGDwXwtgx4ibPQdOMYU?utm_source=generator&si=1c9a67323e524e04",
    spotifyUrl: "https://open.spotify.com/playlist/7DhxGDwXwtgx4ibPQdOMYU",
  },
  // Closing "See you there!" section (components/sections/see-you-there.tsx).
  //   photos mode (loadingScreen.display "photos") → full-screen couple photo
  //   plain mode  (loadingScreen.display "plain")  → botanical card, no photo
  // {couple} → "Groom & Bride" nicknames.
  seeYouThere: {
    titleLine1: "See you",
    titleLine2: "there!",
    // Photos mode
    photo: COUPLE_PHOTOS[4],
    photoAlt: "{couple}",
    // Plain mode
    plain: {
      eyebrow: "Until we meet",
      script: "with love, {couple}",
      message: "We can't wait to celebrate this beautiful day with you.",
      decos: { ...CORNER_DECOS, footerVine: DECOR.footerVine },
    },
  },
  // Footer (components/sections/footer.tsx).
  // {couple} → "Groom & Bride" nicknames, {year} → current year. Date comes from ceremony, deadline from details.rsvp.
  footer: {
    showMonogram: true, // couple.monogram, tinted to the motif
    dateLabel: "Wedding Date",
    // Ceremony & reception at a glance (times and places come from ceremony / reception)
    summary: {
      show: true,
      ceremonyLabel: "Ceremony",
      receptionLabel: "Reception",
    },
    noteTitle: "A Note From Us",
    // Typed out one after another
    quotes: [
      '"I have found the one whom my soul loves." – Song of Solomon 3:4',
      "Welcome to our wedding website! We've found a love that's a true blessing, and we give thanks to God for writing the beautiful story of our journey together.",
      "Thank you for your love, prayers, and support. We can't wait to celebrate this joyful day together!",
    ],
    rsvp: {
      show: true,
      title: "RSVP Deadline",
      label: "Please respond by",
      note: "Please confirm your attendance by this date.",
      button: "Tap here to respond",
      href: "#guest-list",
    },
    // Social links — replace each href with your own profile link.
    //   show: false hides one; platforms: facebook | instagram | tiktok | youtube | twitter | threads | messenger | email
    //   email: use "mailto:you@example.com"; messenger: use "https://m.me/yourpage"
    followTitle: "Follow Us",
    followNote: "Share your photos and tag us — we'd love to see the day through your eyes.",
    socials: [
      { show: true, platform: "facebook", href: "https://www.facebook.com" },
      { show: true, platform: "instagram", href: "https://www.instagram.com/" },
      { show: true, platform: "tiktok", href: "https://www.tiktok.com/" },
      { show: true, platform: "youtube", href: "https://www.youtube.com" },
      { show: true, platform: "twitter", href: "https://x.com/" },
      { show: false, platform: "threads", href: "https://www.threads.net/" },
      { show: false, platform: "messenger", href: "https://m.me/" },
      { show: false, platform: "email", href: "mailto:" },
    ] as {
      show: boolean
      platform: "facebook" | "instagram" | "tiktok" | "youtube" | "twitter" | "threads" | "messenger" | "email"
      href: string
    }[],
    quickLinksTitle: "Quick Links",
    links: [
      { label: "Home", href: "#home" },
      { label: "Event Details", href: "#details" },
      { label: "RSVP", href: "#guest-list" },
      { label: "Gallery", href: "#gallery" },
      { label: "Messages", href: "#messages" },
      { label: "FAQ", href: "#faq" },
    ],
    copyright: "© {year} {couple} — crafted with love, prayers, and gratitude.",
    tagline: "This celebration site was designed to share our story and joy with you.",
    credit: {
      show: true,
      developedBy: "Developed by",
      developerName: "Lance Valle",
      developerUrl: "https://lance28-beep.github.io/portfolio-website/",
      promoText: "Want a website like this? Visit",
      promoName: "Wedding Invitation Naga",
      promoUrl: "https://www.facebook.com/WeddingInvitationNaga",
    },
    // Leave any path "" to hide that decoration
    decos: { ...CORNER_DECOS, headerOrnament: DECOR.headerOrnament },
  },
  // Snap & Share (components/sections/snap-share.tsx). {couple} → "Groom & Bride" nicknames.
  snapShare: {
    googleDriveLink:
      "https://drive.google.com/drive/folders/1qVjxLcmkcWEmoDRYv_cgFgCKiYMmcf6j?usp=sharing",
    albumQR: "/QR/AlbumQR.png",
    hashtag: HASHTAGS,
    instructions: "Please scan this QR Code and upload the photos and videos you have taken during our wedding reception. We are delighted to see your snaps too!",
    title: "Snap and Share",
    subtitle: "Share your memories",
    description:
      "Help us remember the little moments of {couple}'s day — every smile, embrace, and candid laugh. Your photos and clips complete our love story.",
    // "Our Favorite Moments" photo card — always hidden when loadingScreen.display is "plain"
    moments: {
      show: true,
      title: "Our Favorite Moments",
      caption: "Share your snapshots to be featured in our keepsake gallery.",
      // 3 photos: two squares on top, one wide photo below
      images: COUPLE_PHOTOS.slice(0, 3),
    },
    website: {
      show: true,
      title: "Share Our Wedding Website",
      description:
        "Spread the word about {couple}'s celebration. Share this QR code so friends and family can join us.",
      downloadButton: "Download QR",
      note: "Scan with any camera app to open the full invitation and schedule.",
    },
    hashtags: {
      show: true,
      title: "Wedding Hashtags",
      copy: "Copy",
      copied: "Copied",
      copyAll: "Copy All",
      allCopied: "All Copied!",
    },
    social: {
      show: true,
      title: "Share on Social Media",
      description: "Help spread the word about {couple}'s wedding across your favorite platforms.",
      // Remove any you don't want: "instagram" | "facebook" | "tiktok" | "twitter"
      platforms: ["instagram", "facebook", "tiktok", "twitter"] as ("instagram" | "facebook" | "tiktok" | "twitter")[],
      shareText: "Celebrate {couple}'s wedding! Explore the details and share your special memories:",
    },
    // Shown only when googleDriveLink is set
    upload: {
      badge: "Upload Your Photos & Videos",
      scanNote: "Scan with your camera app",
      copyLink: "Copy Link",
      copied: "Copied!",
      downloadQr: "Download QR",
      uploadButton: "Upload Photos",
    },
    closing:
      "Thank you for helping make {couple}'s wedding celebration memorable. Your photos and messages create beautiful memories we will treasure for a lifetime.",
    closingTag: "Thank you for sharing the joy",
    // "Puhon" banner — text comes from loveStory.closing*; photos crossfade behind it
    puhon: {
      show: true,
      images: [
        "/desktop-background/couples (18).webp",
        "/desktop-background/couples (20).webp",
        "/desktop-background/couples (3).webp",
      ],
      intervalMs: 5000, // time each photo stays before fading to the next
    },
  },
  accommodation: {
    coordinator: {
      name: RSVP.coordinator,
      phone: RSVP.phone,
    },
    hotels: [
      {
        name: "La Luna Resort",
        discount: "Offered 20% discount for early booking",
        facebook: "https://www.facebook.com/lalunabeachresortofficial",
      },
      {
        name: "GOSAM Beach Resort",
        discount: "Offered 10% discount",
        facebook: "https://www.facebook.com/profile.php?id=100083461714073",
      },
      {
        name: "Calicoan Villa",
        discount: "Offered 10% discount",
        facebook: "https://www.facebook.com/CalicoanVilla",
      },
      {
        name: "G Camp Beachfront",
        discount: "Offered 10% discount",
        facebook: "https://www.facebook.com/profile.php?id=100085772194096",
      },
      {
        name: "Punta Viajero Beach Resort",
        discount: "Offered 15% discount",
        phone: "0932 214 6408",
        facebook: "https://www.facebook.com/puntoviajeroresort",
      },
      { name: "Balay Sunset" },
      { name: "Balay Pacifico" },
      { name: "Casa Nala" },
      { name: "The Grey Inn" },
    ],
    carRentals: [
      {
        name: "Apex Car Rental Tacloban",
        facebook: "https://www.facebook.com/profile.php?id=61574882327115",
      },
      {
        name: "Cassey Wheels Car Rental",
        facebook: "https://www.facebook.com/search/top?q=casseywheels%20car%20rental",
      },
    ],
  },
}
