import { cn } from "@/lib/utils";

// Architectural line compositions in the brand palette. These stand in for photography until
// the business supplies its own approved imagery; they are decorative and hidden from
// assistive technology.

type Tone = "dark" | "forest" | "ivory";

const tones: Record<Tone, { bg: string; line: string; fill: string }> = {
  dark: { bg: "#232321", line: "#A67C52", fill: "#1C1C1C" },
  forest: { bg: "#1F3D36", line: "#C9A57C", fill: "#17302A" },
  ivory: { bg: "#E9E4DB", line: "#A67C52", fill: "#F4F1EC" },
};

interface PlateProps {
  tone?: Tone;
  className?: string;
  animate?: boolean;
}

/** Nested arches receding into a doorway: the threshold of the lounge. */
export function ArchPlate({ tone = "dark", className, animate = false }: PlateProps) {
  const t = tones[tone];
  const arches = [0, 1, 2, 3, 4];
  return (
    <svg
      viewBox="0 0 400 520"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
    >
      <rect width="400" height="520" fill={t.bg} />
      {arches.map((i) => {
        const inset = 40 + i * 30;
        const w = 400 - inset * 2;
        const r = w / 2;
        const top = 70 + i * 34;
        return (
          <path
            key={i}
            d={`M${inset} 520 V${top + r} a${r} ${r} 0 0 1 ${w} 0 V520`}
            fill={i === arches.length - 1 ? t.fill : "none"}
            stroke={t.line}
            strokeWidth="1"
            strokeOpacity={0.35 + i * 0.13}
            pathLength={1}
            strokeDasharray={animate ? 1 : undefined}
            className={animate ? "animate-draw" : undefined}
            style={animate ? { animationDelay: `${i * 160}ms` } : undefined}
          />
        );
      })}
      <line x1="0" y1="470" x2="400" y2="470" stroke={t.line} strokeOpacity="0.3" />
      <circle cx="200" cy="300" r="2.5" fill={t.line} />
    </svg>
  );
}

/** Meridians and parallels: the atlas. */
export function MeridianPlate({ tone = "forest", className }: PlateProps) {
  const t = tones[tone];
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
    >
      <rect width="400" height="400" fill={t.bg} />
      <g fill="none" stroke={t.line} strokeWidth="1">
        <circle cx="200" cy="200" r="150" strokeOpacity="0.8" />
        {[30, 62, 96, 128].map((rx) => (
          <ellipse key={rx} cx="200" cy="200" rx={rx} ry="150" strokeOpacity="0.4" />
        ))}
        {[-100, -50, 0, 50, 100].map((dy) => {
          const half = Math.sqrt(150 * 150 - dy * dy);
          return (
            <line
              key={dy}
              x1={200 - half}
              x2={200 + half}
              y1={200 + dy}
              y2={200 + dy}
              strokeOpacity="0.4"
            />
          );
        })}
        <line x1="200" y1="20" x2="200" y2="380" strokeOpacity="0.55" />
      </g>
    </svg>
  );
}

/** Horizontal strata: still water, a plunge pool, a horizon. */
export function StrataPlate({ tone = "ivory", className }: PlateProps) {
  const t = tones[tone];
  return (
    <svg
      viewBox="0 0 400 300"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
    >
      <rect width="400" height="300" fill={t.bg} />
      <g stroke={t.line} strokeWidth="1" fill="none">
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            x1={30 + i * 6}
            x2={370 - i * 6}
            y1={120 + i * 18}
            y2={120 + i * 18}
            strokeOpacity={0.9 - i * 0.08}
          />
        ))}
        <path d="M150 120 V90 a50 50 0 0 1 100 0 V120" strokeOpacity="0.7" />
      </g>
    </svg>
  );
}

/** The mark: an arch over a horizon line. */
export function AtlasMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)} fill="none">
      <path d="M7 27 V15 a9 9 0 0 1 18 0 V27" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 27 V16 a4 4 0 0 1 8 0 V27" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
      <line x1="3" y1="27" x2="29" y2="27" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
