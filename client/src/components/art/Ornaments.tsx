/**
 * Ornamental gold flourishes lifted from the Mehfuz poster: filigree corner
 * scrollwork, a centred divider, and a framed panel that combines them.
 */

import type { ReactNode } from "react";

/** One corner's scrollwork. Drawn for the top-left; rotated for the rest. */
export function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true" fill="none">
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M2 22c0-11 9-20 20-20" />
        <path d="M8 24c0-9 7-16 16-16" />
        {/* inner scroll */}
        <path d="M14 26c0-3 2-6 5-7 4-1 7 2 7 5 0 2-2 4-4 4s-3-1-3-3" />
        {/* leafy tendrils */}
        <path d="M26 8c4-2 8-1 11 2-4 1-8 1-11-2z" fill="currentColor" opacity="0.55" stroke="none" />
        <path d="M8 26c-2 4-1 8 2 11 1-4 1-8-2-11z" fill="currentColor" opacity="0.55" stroke="none" />
        <path d="M33 4c3 0 6 1 8 3" />
        <path d="M4 33c0 3 1 6 3 8" />
      </g>
      <circle cx="22" cy="22" r="1.8" fill="currentColor" />
    </svg>
  );
}

/** Horizontal rule with a diamond flourish at its centre. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold-600 ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/60 to-gold-500/70" />
      <svg viewBox="0 0 44 16" className="h-4 w-11" fill="none" aria-hidden="true">
        <path d="M22 2l5 6-5 6-5-6 5-6z" fill="currentColor" opacity="0.9" />
        <path
          d="M14 8c-4 0-7-2-9-4 0 4 3 6 9 4zM30 8c4 0 7-2 9-4 0 4-3 6-9 4z"
          fill="currentColor"
          opacity="0.65"
        />
        <circle cx="22" cy="8" r="1.4" fill="#fffaf0" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-500/60 to-gold-500/70" />
    </div>
  );
}

/** Small fleur used as a list bullet, matching the poster's benefit list. */
export function Fleuron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <path
        d="M8 1.5c1.2 2.4 2.6 3.8 5 5-2.4 1.2-3.8 2.6-5 5-1.2-2.4-2.6-3.8-5-5 2.4-1.2 3.8-2.6 5-5z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * A panel with a double gold rule and filigree in all four corners — the
 * poster's "Available Packages" / "Health Benefits" treatment.
 */
export function OrnateFrame({
  children,
  className = "",
  corners = true,
}: {
  children: ReactNode;
  className?: string;
  corners?: boolean;
}) {
  return (
    <div className={`relative rounded-lg border border-gold-500/70 ${className}`}>
      <div className="relative rounded-[7px]">
        {corners && (
          <>
            <CornerFlourish className="pointer-events-none absolute -left-px -top-px h-8 w-8 text-gold-600/70" />
            <CornerFlourish className="pointer-events-none absolute -right-px -top-px h-8 w-8 -scale-x-100 text-gold-600/70" />
            <CornerFlourish className="pointer-events-none absolute -bottom-px -left-px h-8 w-8 -scale-y-100 text-gold-600/70" />
            <CornerFlourish className="pointer-events-none absolute -bottom-px -right-px h-8 w-8 -scale-100 text-gold-600/70" />
          </>
        )}
        {children}
      </div>
    </div>
  );
}

/** Section heading in a gold-ruled cartouche, as on the poster. */
export function SectionTitle({
  children,
  eyebrow,
  className = "",
}: {
  children: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-700">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-2xl font-bold tracking-wide text-brown-950 sm:text-3xl">
        {children}
      </h2>
      <Divider className="mx-auto mt-3 max-w-xs" />
    </div>
  );
}
