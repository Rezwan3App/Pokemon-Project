/** Single-source label shown next to price */
export default function MockPriceBadge({ price }) {
  if (!price) return null;
  if (price.isLive) {
    return (
      <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
        Live · TCGplayer
      </span>
    );
  }
  if (price.isMock) {
    return (
      <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
        Sample price
      </span>
    );
  }
  return null;
}
