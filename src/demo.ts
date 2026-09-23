import type { AtelierEvent, Catalog, Photo } from './types';
import { addWeeks, bucharestToISO, categories, dateKey } from './lib';

// Self-contained public examples. Never export the database or participant data.
const day = new Date(`${dateKey(new Date().toISOString())}T12:00:00Z`);
day.setUTCDate(day.getUTCDate() + ((4 - day.getUTCDay() + 7) % 7 || 7));
const thursday = day.toISOString().slice(0, 10);
const events: AtelierEvent[] = [];
const photo = (name: string) => `/images/atelier/${name}.webp`;
const wineCovers = [
  'vin-floarea-soarelui',
  'vin-velier-masa',
  'vin-pictand',
  'vin-bujori',
  'vin-trandafiri',
  'vin-lalele',
].map(photo);
// Each archived Thursday shows its own set of paintings from past evenings.
const archivePhotos = [
  [
    'vin-pictand',
    'lucrare-flori-in-par',
    'lucrare-bujori',
    'vin-bujori',
    'lucrare-cires',
    'lucrare-floarea-soarelui',
    'lucrare-doua-flori',
    'lucrare-floare-rosie',
  ],
  [
    'vin-velier',
    'lucrare-luna-plina',
    'lucrare-felinar',
    'lucrare-semiluna',
    'lucrare-silueta-luna',
    'lucrare-pisica',
    'lucrare-lamai',
    'vin-pictura-rotunda',
    'lucrare-oras',
    'lucrare-lavanda',
  ],
].map((names) => names.map(photo));
function event(
  category: AtelierEvent['category'],
  title: string,
  offset: number,
  hour: number,
  capacity: number,
  price: number,
  format: AtelierEvent['format'] = 'group',
) {
  const date = new Date(`${thursday}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  const local = `${date.toISOString().slice(0, 10)}T${String(hour).padStart(2, '0')}:00`;
  const starts_at = bucharestToISO(local);
  const description =
    category === 'wine'
      ? 'Pictăm pas cu pas, povestim și ne bucurăm de o seară cu vin și culoare. Materialele sunt incluse. Atelier pentru adulți, 18+. Eveniment demonstrativ.'
      : category === 'kids'
        ? 'Descoperim desenul și culoarea prin joc, în ritmul fiecărui copil. Materialele sunt incluse. Eveniment demonstrativ; înscrierile se vor face de către părinte sau tutore.'
        : category === 'adults'
          ? 'O ședință individuală dedicată creativității tale. Nu ai nevoie de experiență, doar de curiozitate. Materialele sunt incluse. Eveniment demonstrativ.'
          : 'O întâlnire cu tablouri, emoții și povești. Expoziție demonstrativă; programul și locul real vor fi anunțate la lansare.';
  events.push({
    id: events.length + 1,
    category,
    title,
    description,
    starts_at,
    ends_at: new Date(new Date(starts_at).getTime() + 2 * 3600000).toISOString(),
    capacity,
    price,
    format,
    booked: 0,
    available: capacity,
    photo_count: 0,
    status: 'published',
    location: 'La atelier · adresă în curând',
    cover:
      category === 'wine'
        ? wineCovers[events.filter((e) => e.category === 'wine').length % wineCovers.length]
        : categories[category].image,
  });
}
for (const [week, title] of [
  'Un pahar de vin. O pânză de posibilități.',
  'Flori, vin și povești',
  'Culorile unei seri de joi',
  'Pictăm o toamnă în culori',
].entries())
  event('wine', title, week * 7, 18, 12, 180);
event('kids', 'Mâini mici, idei mari', 2, 10, 8, 90);
event('kids', 'Primii pași în desen', 5, 15, 1, 130, 'private');
event('adults', 'O pauză cu pensula în mână', 3, 17, 1, 200, 'private');
event('exhibition', 'Între vis și culoare', 16, 16, 100, 0, 'exhibition');
event('wine', 'O joi cu gust de vară', -14, 18, 12, 180);
event('wine', 'Povești pictate împreună', -7, 18, 12, 180);
const archive = events.filter((e) => new Date(e.starts_at) < new Date(`${thursday}T00:00:00Z`));
archive.forEach((item, index) => {
  item.photo_count = archivePhotos[index % archivePhotos.length].length;
});
// Keep archive dates in the past even when viewing the preview on a Thursday.
for (const item of archive) {
  if (new Date(item.ends_at) >= new Date()) {
    const local = `${dateKey(item.starts_at)}T18:00`;
    item.starts_at = bucharestToISO(addWeeks(local, -1));
    item.ends_at = new Date(new Date(item.starts_at).getTime() + 2 * 3600000).toISOString();
  }
}
const catalog: Catalog = {
  events: events.sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
  artworks: [
    {
      id: 1,
      title: 'Înflorire',
      description:
        'Lucrare și preț demonstrative. Tablourile originale vor fi publicate de artist la lansare.',
      price: 650,
      dimensions: '50 × 70 cm',
      medium: 'Acrilic pe pânză',
      image: photo('tablou-bujori-interior'),
      status: 'available',
    },
    {
      id: 2,
      title: 'Doamna cu pălărie',
      description:
        'Lucrare și preț demonstrative. Tablourile originale vor fi publicate de artist la lansare.',
      price: 720,
      dimensions: '60 × 80 cm',
      medium: 'Tehnică mixtă',
      image: photo('tablou-doamna-palarie'),
      status: 'available',
    },
    {
      id: 3,
      title: 'Lumina lunii',
      description:
        'Lucrare și preț demonstrative. Tablourile originale vor fi publicate de artist la lansare.',
      price: 480,
      dimensions: '40 × 50 cm',
      medium: 'Acrilic pe pânză',
      image: photo('tablou-pisica-luna'),
      status: 'available',
    },
    {
      id: 4,
      title: 'Flori albe',
      description:
        'Lucrare și preț demonstrative. Tablourile originale vor fi publicate de artist la lansare.',
      price: 690,
      dimensions: '50 × 70 cm',
      medium: 'Acrilic și pastă de structură',
      image: photo('tablou-flori-albe'),
      status: 'available',
    },
    {
      id: 5,
      title: 'Apus pe mare',
      description:
        'Lucrare și preț demonstrative. Tablourile originale vor fi publicate de artist la lansare.',
      price: 420,
      dimensions: '40 × 50 cm',
      medium: 'Acrilic pe pânză',
      image: photo('tablou-apus'),
      status: 'available',
    },
    {
      id: 6,
      title: 'Tot ce simt',
      description:
        'Lucrare și preț demonstrative. Tablourile originale vor fi publicate de artist la lansare.',
      price: 560,
      dimensions: '50 × 60 cm',
      medium: 'Acrilic pe pânză',
      image: photo('tablou-legata-la-ochi'),
      status: 'available',
    },
  ],
  settings: {
    artist: 'Atelier de vise',
    address: 'Adresa atelierului va fi anunțată',
    phone: '',
    instagram: '',
    demo: true,
  },
};
export async function previewApi<T>(path: string, options: RequestInit): Promise<T> {
  if (options.method && options.method !== 'GET')
    throw new Error('Aceasta este o previzualizare. Solicitările vor fi disponibile la lansare.');
  if (path === '/catalog') return structuredClone(catalog) as T;
  const match = path.match(/^\/events\/(\d+)\/photos$/);
  if (match) {
    const index = archive.findIndex((e) => e.id === Number(match[1]));
    const photos: Photo[] =
      index < 0
        ? []
        : archivePhotos[index % archivePhotos.length].map((url, i) => ({ id: i + 1, url }));
    return photos as T;
  }
  throw new Error('Această funcție va fi disponibilă la lansare.');
}
