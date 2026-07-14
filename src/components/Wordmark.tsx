/**
 * Brand wordmark: the CT monogram mark + "CollegeTrends" two-tone text
 * ("Trends" in brand signal cyan). Size/weight/color of the text are inherited
 * from the parent (so it drops into the existing headers unchanged); only
 * "Trends" is recolored. Uses the app's current font on purpose.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <a
      href="/"
      className={`inline-flex items-center gap-2 hover:opacity-80 transition ${className}`}
    >
      <img
        src="/favicon.svg"
        alt=""
        width={26}
        height={26}
        className="shrink-0"
        aria-hidden="true"
      />
      <span className="whitespace-nowrap">
        College<span style={{ color: 'var(--ct-signal-cyan)' }}> Trends</span>
      </span>
    </a>
  );
}
