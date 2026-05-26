import CardTile from './CardTile.jsx';

export default function CardGrid({ cards, emptyMessage = 'No cards found.' }) {
  if (!cards?.length) {
    return (
      <p className="rounded-xl border border-dashed border-white/20 py-12 text-center text-white/60">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} />
      ))}
    </div>
  );
}
