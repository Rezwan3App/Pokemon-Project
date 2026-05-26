export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-poke-yellow border-t-transparent" />
      <p className="text-white/60">{label}</p>
    </div>
  );
}
