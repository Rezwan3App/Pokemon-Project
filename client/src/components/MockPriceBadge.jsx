/** Shown when prices are sample/MVP data, not live marketplace feeds */
export default function MockPriceBadge({ price }) {
  if (!price?.isMock) return null;
  return (
    <span
      className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200"
      title={price.note}
    >
      Sample prices (MVP)
    </span>
  );
}
