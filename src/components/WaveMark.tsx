export function WaveMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="16"
      viewBox="0 0 48 16"
      aria-hidden
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="0" y="8" width="4" height="2" fill="currentColor" opacity="0.7" />
      <rect x="4" y="6" width="4" height="2" fill="currentColor" />
      <rect x="8" y="8" width="4" height="2" fill="currentColor" opacity="0.7" />
      <rect x="12" y="10" width="4" height="2" fill="currentColor" opacity="0.55" />
      <rect x="16" y="8" width="4" height="2" fill="currentColor" />
      <rect x="20" y="6" width="4" height="2" fill="currentColor" />
      <rect x="24" y="8" width="4" height="2" fill="currentColor" opacity="0.7" />
      <rect x="28" y="10" width="4" height="2" fill="currentColor" opacity="0.5" />
      <rect x="32" y="8" width="4" height="2" fill="currentColor" />
      <rect x="36" y="6" width="4" height="2" fill="currentColor" opacity="0.85" />
      <rect x="40" y="8" width="4" height="2" fill="currentColor" opacity="0.65" />
      <rect x="44" y="10" width="4" height="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
