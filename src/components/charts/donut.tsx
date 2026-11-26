import { TONE_CLASSES, type Tone } from "@/components/status/tones";
import { cn } from "@/lib/utils";

export type DonutSegment = { label: string; value: number; tone: Tone };

const TONE_STROKE: Record<Tone, string> = {
  danger: "var(--danger-mid)",
  caution: "var(--caution-mid)",
  warning: "var(--warning-mid)",
  success: "var(--success-mid)",
  brand: "var(--brand-mid)",
  neutral: "var(--neutral-mid)",
};

/** Accessible SVG donut: segments are decorative, the legend carries the numbers. */
export function Donut({
  segments,
  centerLabel,
  size = 168,
  thickness = 16,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = total > 0 && segments.filter((s) => s.value > 0).length > 1 ? 3 : 0;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
          {total > 0 &&
            segments.map((segment) => {
              if (segment.value === 0) return null;
              const length = (segment.value / total) * circumference;
              const dash = Math.max(length - gap, 0.5);
              const circle = (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={TONE_STROKE[segment.tone]}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="metric text-3xl font-semibold">{total}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className={cn("size-2.5 rounded-full", TONE_CLASSES[segment.tone].dot)} aria-hidden />
              {segment.label}
            </span>
            <span className="metric font-medium">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
