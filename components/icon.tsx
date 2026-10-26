// Square-cap pictograms: 24 grid, stroke 2.6 (DESIGN.md "Shapes")
const PATHS = {
  arrow: "M4 12h15M13 5l7 7-7 7",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  check: "M5 12l5 5 9-10",
  heart: "M12 20l-7.6-7.6a4.6 4.6 0 0 1 6.5-6.5L12 7l1.1-1.1a4.6 4.6 0 0 1 6.5 6.5z",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  copy: "M8 8h11v11H8zM5 16V5h11",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square">
      <path d={PATHS[name]} />
    </svg>
  );
}
