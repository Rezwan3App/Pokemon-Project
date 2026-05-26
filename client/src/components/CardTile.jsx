import { Link } from 'react-router-dom';
import TrendBadge from './TrendBadge.jsx';
import PriceTag from './PriceTag.jsx';

export default function CardTile({ card }) {
  return (
    <Link to={`/card/${card.id}`} className="card-surface group block overflow-hidden p-3">
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg bg-black/40">
        {card.imageSmall || card.image ? (
          <img
            src={card.imageSmall || card.image}
            alt={card.name}
            className="h-full w-full object-contain transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">No image</div>
        )}
        {card.trend && (
          <div className="absolute right-2 top-2">
            <TrendBadge trend={card.trend} compact />
          </div>
        )}
      </div>
      <h3 className="mt-2 truncate font-semibold text-white group-hover:text-poke-yellow">
        {card.name}
      </h3>
      <p className="truncate text-xs text-white/50">
        {card.set?.name} · {card.rarity || 'Unknown'}
      </p>
      {card.price && <PriceTag price={card.price} className="mt-2" />}
    </Link>
  );
}
