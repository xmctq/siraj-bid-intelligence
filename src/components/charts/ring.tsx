import type { Tone } from "@/components/status/tones";

const STROKE: Record<Tone, string> = {
  danger: "var(--danger-mid)",
  caution: "var(--caution-mid)",
  warning: "var(--warning-mid)",
  success: "var(--success-mid)",
  brand: "var(--brand-mid)",
  neutral: "var(--neutral-mid)",
};

/** Small progress ring (e.g. compliance 64/100). */
export function Ring({ value, tone = "brand", size = 44, label }: { value: number; tone?: Tone; size?: number; label: string }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`${label}: ${Math.round(clamped)}%`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={STROKE[tone]}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
        className="transition-[stroke-dasharray] duration-700"
      />
    </svg>
  );
}
