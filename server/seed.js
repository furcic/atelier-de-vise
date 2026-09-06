import { pool, transaction } from './db.js';
const photos = {
  wine: '/images/workshop.jpg',
  kids: '/images/paints.jpg',
  adults: '/images/paints.jpg',
  exhibition: '/images/gallery.jpg',
};
// Seed is opt-in, idempotent and only adds data to an empty catalog.
try {
  await transaction(pool, async (db) => {
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM events');
    if (Number(count) > 0) {
      console.log('Catalogul conține deja evenimente. Seed omis.');
      return;
    }
    const nextThursday = new Date();
    nextThursday.setUTCHours(15, 30, 0, 0);
    let days = (4 - nextThursday.getUTCDay() + 7) % 7;
    if (days === 0) days = 7;
    nextThursday.setUTCDate(nextThursday.getUTCDate() + days);
    const add = async (
      category,
      title,
      description,
      dayOffset,
      hour,
      capacity,
      price,
      format = 'group',
    ) => {
      const start = new Date(nextThursday);
      start.setUTCDate(start.getUTCDate() + dayOffset);
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + (category === 'exhibition' ? 5 : 2) * 3600000);
      const sqlDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
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
          photos[category],
        ],
      );
      return result.insertId;
    };
    const wineDescription =
      'O seară în care lași graba la ușă și iei pensula în mână. Pictăm pas cu pas, povestim și ne bucurăm de un pahar de vin. Nu ai nevoie de experiență: toate materialele sunt pregătite, iar tabloul creat pleacă acasă cu tine. Atelier dedicat persoanelor de minimum 18 ani. Sunt disponibile și băuturi fără alcool.';
    for (let week = 0; week < 4; week++)
      await add(
        'wine',
        [
          'Un pahar de vin. O pânză de posibilități.',
          'Flori, vin și povești',
          'Culorile unei seri de joi',
          'Pictăm o toamnă în culori',
        ][week],
        wineDescription,
        week * 7,
        15,
        12,
        180,
      );
    await add(
      'kids',
      'Mâini mici, idei mari',
      'Un atelier de grup pentru copii de 6–12 ani. Explorăm culoarea, formele și imaginația prin joc. Materialele sunt incluse. Înscrierea se face de către părinte sau tutore, cu numele și numărul său de telefon.',
      2,
      7,
      8,
      90,
    );
    await add(
      'kids',
      'Primii pași în desen',
      'O ședință individuală, adaptată ritmului și curiozității copilului. Descoperim împreună desenul și culoarea. Materialele sunt incluse. Părintele sau tutorele face înscrierea.',
      5,
      12,
      1,
      130,
      'private',
    );
    await add(
      'adults',
      'O pauză cu pensula în mână',
      'Două ore doar pentru tine și creativitatea ta. O ședință individuală pentru adulți, fără presiune și fără experiență necesară. Alegem împreună subiectul și tehnica. Toate materialele sunt incluse.',
      3,
      14,
      1,
      200,
      'private',
    );
    await add(
      'exhibition',
      'Între vis și culoare',
      'O întâlnire cu tablouri, emoții și povești. Descoperă o selecție de lucrări și bucură-te de o plimbare printre culori. Expoziție demonstrativă; locul și programul real vor fi publicate de artist.',
      16,
      13,
      100,
      0,
      'exhibition',
    );
    await add('wine', 'O joi cu gust de vară', wineDescription, -14, 15, 12, 180);
    await add('wine', 'Povești pictate împreună', wineDescription, -7, 15, 12, 180);
    await db.execute(
      'INSERT INTO artworks (title,description,price,dimensions,medium,image) VALUES (?,?,?,?,?,?),(?,?,?,?,?,?),(?,?,?,?,?,?)',
      [
        'Înflorire',
        'O întâlnire vibrantă între culoare și emoție. Lucrare demonstrativă; artistul va înlocui imaginea și detaliile cu tabloul original.',
        650,
        '50 × 70 cm',
        'Acrilic pe pânză',
        '/images/artwork.jpg',
        'Un colț de liniște',
        'Culori care aduc un moment de răgaz în casa ta. Lucrare demonstrativă; detaliile vor fi confirmate de artist.',
        480,
        '40 × 50 cm',
        'Tehnică mixtă',
        '/images/gallery.jpg',
        'Tot ce simt',
        'Un strop de îndrăzneală pentru un spațiu drag. Lucrare demonstrativă; imaginea va fi înlocuită de artist.',
        720,
        '60 × 80 cm',
        'Acrilic pe pânză',
        '/images/artwork.jpg',
      ],
    );
    console.log('Catalog demonstrativ creat. Nu au fost adăugate înscrieri fictive.');
  });
} finally {
  await pool.end();
}
