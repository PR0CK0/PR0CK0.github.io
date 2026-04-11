// ─── UI Constants ─────────────────────────────────────────────────────────────
// Shared Tailwind class strings for consistent sizing across pages.
// Breakpoints: sm: (640px+) is the primary responsive step. ls: (landscape
// phone) is Landing-page-specific and not used here.

// ─── Typography ───────────────────────────────────────────────────────────────

/** ~/cv.pdf, ~/resume.pdf page titles */
export const PAGE_TITLE    = 'text-xl sm:text-2xl font-bold tracking-tight'
/** ~/about and smaller headings */
export const PAGE_TITLE_SM = 'text-lg sm:text-xl font-bold tracking-tight'
/** Subtitle line below page title */
export const PAGE_SUBTITLE = 'text-xs sm:text-sm mt-1 opacity-80'
/** Section headers — EDUCATION, SKILLS, etc. */
export const SECTION_LABEL = 'text-[0.675rem] sm:text-xs font-bold uppercase tracking-wider'
/** Standard body / list text */
export const BODY_TEXT     = 'text-xs sm:text-sm leading-relaxed'
/** Small meta text — labels, captions, toggles */
export const META_TEXT     = 'text-[0.65rem] sm:text-xs'
/** Footer description / nav links */
export const FOOTER_TEXT   = 'text-[0.55rem] sm:text-[0.63rem]'
/** Footer copyright / commit line */
export const FOOTER_META   = 'text-[7px] sm:text-[8px]'

// ─── Buttons ──────────────────────────────────────────────────────────────────

/** Primary action button — blue (Download PDF) */
export const BTN_PRIMARY   = 'px-3 py-1.5 sm:px-4 sm:py-2 bg-terminal-blue/15 border border-terminal-blue/60 text-terminal-blue text-xs sm:text-sm font-mono hover:bg-terminal-blue/25 transition-colors rounded'
/** Secondary action button — neutral (View Raw YAML, etc.) */
export const BTN_SECONDARY = 'px-3 py-1.5 sm:px-4 sm:py-2 bg-terminal-surface border border-terminal-border text-terminal-text text-xs sm:text-sm font-mono hover:bg-terminal-border/40 transition-colors rounded'
/** Base classes shared by both toggle states */
export const BTN_TOGGLE_BASE     = 'px-2 py-1.5 sm:px-3 sm:py-2 text-[0.65rem] sm:text-xs font-mono transition-colors'
/** Toggle button — active/selected state */
export const BTN_TOGGLE_ACTIVE   = `${BTN_TOGGLE_BASE} bg-terminal-green/20 text-terminal-green`
/** Toggle button — inactive state */
export const BTN_TOGGLE_INACTIVE = `${BTN_TOGGLE_BASE} bg-terminal-surface border border-terminal-border text-terminal-muted hover:text-terminal-text`

// ─── Layout ───────────────────────────────────────────────────────────────────

/** Page header chrome — max-width constrained, padded */
export const PAGE_CHROME    = 'max-w-4xl mx-auto w-full px-4 mb-4 sm:mb-8 cv-page-chrome'
/** Button row below page title */
export const BTN_ROW        = 'flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-5 items-center'
/** Full-screen loading / error state wrapper */
export const LOADING_SCREEN = 'min-h-screen flex items-center justify-center bg-terminal-bg font-mono'

// ─── Landing-specific ─────────────────────────────────────────────────────────

/** Base for tech/skill tag chips — append color variant classes per usage */
export const TAG_CHIP = 'text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150'
/** Project / publication card wrapper */
export const CARD_BASE = 'group flex flex-col p-3 sm:p-4 ls:p-3 rounded-lg border border-terminal-border bg-terminal-surface/80 hover:bg-terminal-surface hover:border-terminal-purple/40 transition-all duration-250'
/** Outer section container (skills matrix, repos, etc.) */
export const SECTION_CONTAINER = 'max-w-5xl mx-auto px-4 sm:px-6 ls:px-4 py-7 sm:py-12 ls:py-7'
/** Tag row inside cards */
export const TAG_CONTAINER = 'flex flex-wrap gap-1.5 mt-auto relative'
