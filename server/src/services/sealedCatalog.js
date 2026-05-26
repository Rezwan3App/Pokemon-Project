/**
 * Curated sealed product catalog (booster boxes, ETBs).
 * Real TCGplayer/eBay IDs can be mapped in metadata when APIs are connected.
 */
const SEALED_PRODUCTS = [
  { id: 'sealed:sv4-bb', name: 'Paradox Rift Booster Box', setName: 'Paradox Rift', subtype: 'booster_box', basePrice: 142 },
  { id: 'sealed:sv4-etb', name: 'Paradox Rift Elite Trainer Box', setName: 'Paradox Rift', subtype: 'etb', basePrice: 48 },
  { id: 'sealed:sv3-bb', name: 'Obsidian Flames Booster Box', setName: 'Obsidian Flames', subtype: 'booster_box', basePrice: 128 },
  { id: 'sealed:sv3-etb', name: 'Obsidian Flames Elite Trainer Box', setName: 'Obsidian Flames', subtype: 'etb', basePrice: 44 },
  { id: 'sealed:sv2-bb', name: 'Paldea Evolved Booster Box', setName: 'Paldea Evolved', subtype: 'booster_box', basePrice: 135 },
  { id: 'sealed:sv2-etb', name: 'Paldea Evolved Elite Trainer Box', setName: 'Paldea Evolved', subtype: 'etb', basePrice: 42 },
  { id: 'sealed:sv1-bb', name: 'Scarlet & Violet Base Booster Box', setName: 'Scarlet & Violet', subtype: 'booster_box', basePrice: 118 },
  { id: 'sealed:sv1-etb', name: 'Scarlet & Violet Base Elite Trainer Box', setName: 'Scarlet & Violet', subtype: 'etb', basePrice: 38 },
  { id: 'sealed:swsh12-bb', name: 'Silver Tempest Booster Box', setName: 'Silver Tempest', subtype: 'booster_box', basePrice: 165 },
  { id: 'sealed:swsh12-etb', name: 'Silver Tempest Elite Trainer Box', setName: 'Silver Tempest', subtype: 'etb', basePrice: 55 },
  { id: 'sealed:swsh11-bb', name: 'Lost Origin Booster Box', setName: 'Lost Origin', subtype: 'booster_box', basePrice: 175 },
  { id: 'sealed:swsh11-etb', name: 'Lost Origin Elite Trainer Box', setName: 'Lost Origin', subtype: 'etb', basePrice: 58 },
  { id: 'sealed:swsh10-bb', name: 'Astral Radiance Booster Box', setName: 'Astral Radiance', subtype: 'booster_box', basePrice: 155 },
  { id: 'sealed:swsh10-etb', name: 'Astral Radiance Elite Trainer Box', setName: 'Astral Radiance', subtype: 'etb', basePrice: 52 },
  { id: 'sealed:celebrations-etb', name: 'Celebrations Elite Trainer Box', setName: 'Celebrations', subtype: 'etb', basePrice: 72 },
  { id: 'sealed:evolving-skies-bb', name: 'Evolving Skies Booster Box', setName: 'Evolving Skies', subtype: 'booster_box', basePrice: 285 },
  { id: 'sealed:evolving-skies-etb', name: 'Evolving Skies Elite Trainer Box', setName: 'Evolving Skies', subtype: 'etb', basePrice: 95 },
  { id: 'sealed:151-etb', name: '151 Elite Trainer Box', setName: '151', subtype: 'etb', basePrice: 88 },
  { id: 'sealed:151-bb', name: '151 Booster Bundle Box', setName: '151', subtype: 'booster_box', basePrice: 42 },
  { id: 'sealed:crown-etb', name: 'Crown Zenith Elite Trainer Box', setName: 'Crown Zenith', subtype: 'etb', basePrice: 65 },
];

const SUBTYPE_LABELS = {
  booster_box: 'Booster Box',
  etb: 'Elite Trainer Box',
};

export function sealedToProduct(item) {
  return {
    id: item.id,
    type: 'sealed',
    name: item.name,
    setName: item.setName,
    image: null,
    subtype: SUBTYPE_LABELS[item.subtype] || item.subtype,
    metadata: {
      sealedType: item.subtype,
      basePrice: item.basePrice,
      productKind: 'sealed',
    },
    source: 'catalog',
  };
}

export function searchSealed(query, limit = 20) {
  const q = query.toLowerCase();
  return SEALED_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.setName.toLowerCase().includes(q) ||
      p.subtype.replace('_', ' ').includes(q) ||
      (q.includes('box') && p.subtype === 'booster_box') ||
      (q.includes('etb') && p.subtype === 'etb') ||
      (q.includes('elite') && p.subtype === 'etb')
  )
    .slice(0, limit)
    .map(sealedToProduct);
}

export function getSealedById(id) {
  const item = SEALED_PRODUCTS.find((p) => p.id === id);
  return item ? sealedToProduct(item) : null;
}

export function getAllSealedProducts() {
  return SEALED_PRODUCTS.map(sealedToProduct);
}
