export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-poke-yellow border-t-transparent" />
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
