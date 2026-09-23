import { existsSync, readFileSync } from 'node:fs';
import { pool, transaction } from './db.js';
const image = (name) => `/images/atelier/${name}.webp`;
// Archive photos are stored in MySQL like admin uploads. Works from the repo (public/)
// and from the production image, where Vite copies public/ into dist/.
function photoFile(name) {
  for (const dir of ['../public', '../dist']) {
    const file = new URL(`${dir}${image(name)}`, import.meta.url);
    if (existsSync(file)) return readFileSync(file);
  }
  throw new Error(`Imaginea ${name} lipsește din public/ și dist/.`);
}
const wineDescription =
  'O seară în care lași graba la ușă și iei pensula în mână. Pictăm pas cu pas, povestim și ne bucurăm de un pahar de vin. Nu ai nevoie de experiență: toate materialele sunt pregătite, iar tabloul creat pleacă acasă cu tine. Atelier dedicat persoanelor de minimum 18 ani. Sunt disponibile și băuturi fără alcool.';
const kidsGroupDescription =
  'Un atelier de grup pentru copii de 6–12 ani. Explorăm culoarea, formele și imaginația prin joc. Materialele sunt incluse. Înscrierea se face de către părinte sau tutore, cu numele și numărul său de telefon.';
const kidsPrivateDescription =
  'O ședință individuală, adaptată ritmului și curiozității copilului. Descoperim împreună desenul și culoarea. Materialele sunt incluse. Părintele sau tutorele face înscrierea.';
const adultsDescription =
  'Două ore doar pentru tine și creativitatea ta. O ședință individuală pentru adulți, fără presiune și fără experiență necesară. Alegem împreună subiectul și tehnica. Toate materialele sunt incluse.';
const exhibitionDescription =
  'O întâlnire cu tablouri, emoții și povești. Descoperă o selecție de lucrări și bucură-te de o plimbare printre culori. Expoziție demonstrativă; locul și programul real vor fi publicate de artist.';
// [category, title, description, days from next Thursday, UTC hour, capacity, price, format, cover, archive photos]
const events = [
  [
    'wine',
    'O joi cu gust de vară',
    wineDescription,
    -28,
    15,
    12,
    180,
    'group',
    'vin-velier-masa',
    [
      'vin-velier-masa',
      'vin-velier',
      'lucrare-lamai',
      'lucrare-luna-plina',
      'lucrare-semiluna',
      'lucrare-copac',
    ],
  ],
  [
    'wine',
    'Povești pictate împreună',
    wineDescription,
    -21,
    15,
    12,
    180,
    'group',
    'vin-lalele',
    [
      'vin-lalele',
      'vin-pictura-rotunda',
      'lucrare-oras',
      'lucrare-cires',
      'lucrare-casa-rau',
      'lucrare-lavanda',
    ],
  ],
  [
    'wine',
    'Floarea-soarelui și un pahar de vin',
    wineDescription,
    -14,
    15,
    12,
    180,
    'group',
    'vin-floarea-soarelui',
    [
      'vin-floarea-soarelui',
      'lucrare-floarea-soarelui',
      'lucrare-doua-flori',
      'lucrare-floare-rosie',
      'lucrare-felinar',
      'lucrare-silueta-luna',
      'lucrare-pisica',
    ],
  ],
  ['kids', 'Mâini mici, idei mari', kidsGroupDescription, -12, 7, 8, 90, 'group', 'copii-casute'],
  [
    'adults',
    'O pauză cu pensula în mână',
    adultsDescription,
    -11,
    14,
    1,
    200,
    'private',
    'adulti-pictura',
  ],
  [
    'wine',
    'Flori, vin și povești',
    wineDescription,
    -7,
    15,
    12,
    180,
    'group',
    'vin-bujori',
    [
      'vin-bujori',
      'vin-pictand',
      'vin-trandafiri',
      'lucrare-flori-in-par',
      'lucrare-bujori',
      'vin-sat-colorat',
    ],
  ],
  ['wine', 'Culorile unei seri de joi', wineDescription, 0, 15, 12, 180, 'group', 'vin-pictand'],
  [
    'kids',
    'Căsuțe colorate și cer senin',
    kidsGroupDescription,
    2,
    7,
    8,
    90,
    'group',
    'lucrare-casa-rau',
  ],
  [
    'adults',
    'Seara mea de culoare',
    adultsDescription,
    3,
    14,
    1,
    200,
    'private',
    'lucrare-flori-in-par',
  ],
  [
    'kids',
    'Luna, pisica și stelele',
    kidsPrivateDescription,
    5,
    12,
    1,
    130,
    'private',
    'lucrare-pisica',
  ],
  ['wine', 'Pictăm o toamnă în culori', wineDescription, 7, 15, 12, 180, 'group', 'vin-trandafiri'],
  [
    'kids',
    'Floarea-soarelui în pași mici',
    kidsGroupDescription,
    9,
    7,
    8,
    90,
    'group',
    'lucrare-floarea-soarelui',
  ],
  [
    'adults',
    'Lămâi, mare și timp pentru tine',
    adultsDescription,
    10,
    14,
    1,
    200,
    'private',
    'lucrare-lamai',
  ],
  ['wine', 'Velier pe lac, vin în pahar', wineDescription, 14, 15, 12, 180, 'group', 'vin-velier'],
  [
    'exhibition',
    'Între vis și culoare',
    exhibitionDescription,
    16,
    13,
    100,
    0,
    'exhibition',
    'expozitie-liliac',
  ],
  ['wine', 'Sub lumina felinarului', wineDescription, 21, 15, 12, 180, 'group', 'lucrare-felinar'],
];
const artworkNote = 'Lucrare demonstrativă; detaliile și prețul vor fi confirmate de artist.';
// [title, price, dimensions, medium, image]
const artworks = [
  ['Înflorire', 650, '50 × 70 cm', 'Acrilic pe pânză', 'tablou-bujori-interior'],
  ['Doamna cu pălărie', 720, '60 × 80 cm', 'Tehnică mixtă', 'tablou-doamna-palarie'],
  ['Lumina lunii', 480, '40 × 50 cm', 'Acrilic pe pânză', 'tablou-pisica-luna'],
  ['Flori albe', 690, '50 × 70 cm', 'Acrilic și pastă de structură', 'tablou-flori-albe'],
  ['Apus pe mare', 420, '40 × 50 cm', 'Acrilic pe pânză', 'tablou-apus'],
  ['Tot ce simt', 560, '50 × 60 cm', 'Acrilic pe pânză', 'tablou-legata-la-ochi'],
];
// Seed is opt-in, idempotent and only adds data to an empty catalog.
try {
  await transaction(pool, async (db) => {
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM events');
    if (Number(count) > 0) {
      console.log('Catalogul conține deja evenimente. Seed omis.');
      return;
    }
    const nextThursday = new Date();
    let days = (4 - nextThursday.getUTCDay() + 7) % 7;
    if (days === 0) days = 7;
    nextThursday.setUTCDate(nextThursday.getUTCDate() + days);
    const sqlDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
    for (const [
      category,
      title,
      description,
      dayOffset,
      hour,
      capacity,
      price,
      format,
      cover,
      photos = [],
    ] of events) {
      const start = new Date(nextThursday);
      start.setUTCDate(start.getUTCDate() + dayOffset);
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + (category === 'exhibition' ? 5 : 2) * 3600000);
      const [result] = await db.execute(
        'INSERT INTO events (category,title,description,starts_at,ends_at,capacity,price,location,format,cover) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [
          category,
          title,
          description,
          sqlDate(start),
          sqlDate(end),
          capacity,
          price,
          'La atelier · adresă în curând',
          format,
          image(cover),
        ],
      );
      for (const name of photos)
        await db.execute('INSERT INTO photos (event_id,data,mime) VALUES (?,?,?)', [
          result.insertId,
          photoFile(name),
          'image/webp',
        ]);
    }
    for (const [title, price, dimensions, medium, name] of artworks)
      await db.execute(
        'INSERT INTO artworks (title,description,price,dimensions,medium,image) VALUES (?,?,?,?,?,?)',
        [title, artworkNote, price, dimensions, medium, image(name)],
      );
    console.log('Catalog demonstrativ creat. Nu au fost adăugate înscrieri fictive.');
  });
} finally {
  await pool.end();
}
