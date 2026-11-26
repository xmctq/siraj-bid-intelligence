import Link from "next/link";

/** Product mark: a stacked-document glyph drawn in SVG so it stays crisp at any size. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect x="7" y="4" width="16" height="20" rx="3" fill="currentColor" opacity="0.35" />
      <rect x="10" y="8" width="16" height="20" rx="3" fill="currentColor" />
      <path d="M14 15h8M14 19h5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24.5" cy="9.5" r="3.5" fill="oklch(0.86 0.1 85)" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <BrandMark className={inverted ? "size-8 text-white" : "size-8 text-primary"} />
      <span className="flex flex-col leading-tight">
        <span className={inverted ? "text-[15px] font-semibold tracking-tight text-white" : "text-[15px] font-semibold tracking-tight"}>
          Siraj
        </span>
        <span
          className={
            inverted
              ? "text-[10px] font-medium tracking-[0.14em] text-white/65 uppercase"
              : "text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
          }
        >
          Bid intelligence
        </span>
      </span>
    </Link>
  );
}
