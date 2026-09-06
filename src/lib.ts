export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (import.meta.env?.VITE_STATIC_PREVIEW === 'true') {
    const { previewApi } = await import('./demo');
    return previewApi<T>(path, options);
  }
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const data = await response
    .json()
    .catch(() => ({ error: 'Serverul nu este disponibil momentan.' }));
  if (!response.ok)
    throw new Error(data.error + (data.details ? ` ${data.details.join(' ')}` : ''));
  return data;
}
export const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });
export const money = (value: number) =>
  new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(value) + ' lei';
export const dateFormat = (
  value: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
) =>
  new Intl.DateTimeFormat('ro-RO', { ...options, timeZone: 'Europe/Bucharest' }).format(
    new Date(value),
  );
export const clock = (value: string) => dateFormat(value, { hour: '2-digit', minute: '2-digit' });
export const dateKey = (value: string) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Bucharest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
export const inputDate = (value: string) => `${dateKey(value)}T${clock(value)}`;
export function bucharestToISO(local: string) {
  const naive = new Date(`${local}:00Z`).getTime();
  let result = naive;
  for (let i = 0; i < 3; i++) {
    const represented = new Date(`${inputDate(new Date(result).toISOString())}:00Z`).getTime();
    result += naive - represented;
  }
  if (inputDate(new Date(result).toISOString()) !== local)
    throw new Error('Ora aleasă nu există din cauza schimbării orei. Alege altă oră.');
  return new Date(result).toISOString();
}
export function addWeeks(local: string, weeks: number) {
  const date = new Date(`${local}:00Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 16);
}
export const categories = {
  wine: {
    label: 'Vin și pictez',
    short: 'O seară specială',
    color: 'pink',
    image: '/images/workshop.jpg',
  },
  kids: {
    label: 'Mic, dar desenez',
    short: 'Imaginație fără limite',
    color: 'orange',
    image: '/images/paints.jpg',
  },
  adults: {
    label: 'Mare mă distrez',
    short: 'Timp pentru tine',
    color: 'green',
    image: '/images/paints.jpg',
  },
  exhibition: {
    label: 'Pentru ochi',
    short: 'Artă de văzut',
    color: 'purple',
    image: '/images/gallery.jpg',
  },
};
export function downloadCalendar(event: {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location: string;
  id: number;
}) {
  const escape = (s: string) =>
    s
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\r/g, '');
  const stamp = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atelier de vise//RO',
    'BEGIN:VEVENT',
    `UID:atelier-${event.id}@atelier.local`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.starts_at)}`,
    `DTEND:${stamp(event.ends_at)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description)}`,
    `LOCATION:${escape(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const folded = lines.map((line) => {
    const chunks: string[] = [];
    let chunk = '';
    let bytes = 0;
    for (const c of line) {
      const size = new TextEncoder().encode(c).length;
      if (bytes + size > 74) {
        chunks.push(chunk);
        chunk = ' ';
        bytes = 1;
      }
      chunk += c;
      bytes += size;
    }
    chunks.push(chunk);
    return chunks.join('\r\n');
  });
  const url = URL.createObjectURL(
    new Blob([folded.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'atelier-de-vise.ics';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
