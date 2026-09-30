export function Icon({ kind }: { kind: string }) {
  return (
    <svg
      className="line-icon"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {kind === "sun" ? (
        <>
          <circle cx="24" cy="24" r="9" />
          <path d="M24 3v7m0 28v7M3 24h7m28 0h7M9 9l5 5m20 20 5 5M9 39l5-5m20-20 5-5" />
        </>
      ) : kind === "cycle" ? (
        <>
          <path d="M10 22a15 15 0 0 1 26-9l4 5M40 8v10H30M38 27a15 15 0 0 1-26 9l-4-5M8 41V31h10" />
        </>
      ) : kind === "leaf" ? (
        <>
          <path d="M10 38C4 14 23 5 40 8c1 22-12 30-30 30Zm0 0L31 17M20 28V17m0 11h11" />
        </>
      ) : (
        <>
          <path d="M6 40V19h11v21m3 0V7h12v33m4 0V24h7v16M3 40h42M24 14h4m-4 7h4m-4 7h4M10 25h3m-3 7h3" />
        </>
      )}
    </svg>
  );
}
