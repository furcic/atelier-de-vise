import { z } from 'zod';
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => {
    let phone = value.replace(/[\s().-]/g, '');
    if (phone.startsWith('00')) phone = '+' + phone.slice(2);
    if (/^0\d{9}$/.test(phone)) phone = '+40' + phone.slice(1);
    return phone;
  })
  .pipe(
    z.string().regex(/^\+[1-9]\d{7,14}$/, 'Introdu un telefon valid, de exemplu 07xx xxx xxx.'),
  );
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  consent: z.literal(true),
});
export const registrationSchema = contactSchema.extend({ seats: z.number().int().min(1).max(10) });
const imagePath = z
  .string()
  .max(500)
  .regex(
    /^\/(images\/[a-zA-Z0-9_.-]+|api\/(photos|artwork-images)\/\d+)$/,
    'Folosește o imagine încărcată în aplicație.',
  );
const date = z
  .string()
  .datetime({ offset: true })
  .transform((s) => new Date(s).toISOString().slice(0, 19).replace('T', ' '));
export const eventSchema = z
  .object({
    category: z.enum(['wine', 'kids', 'adults', 'exhibition']),
    title: z.string().trim().min(3).max(140),
    description: z.string().trim().min(10).max(6000),
    starts_at: date,
    ends_at: date,
    capacity: z.number().int().min(1).max(500),
    price: z.number().min(0).max(100000),
    location: z.string().trim().min(3).max(240),
    format: z.enum(['group', 'private', 'exhibition']),
    status: z.enum(['published', 'draft', 'cancelled']),
    cover: imagePath,
  })
  .refine((v) => v.ends_at > v.starts_at, {
    message: 'Ora de sfârșit trebuie să fie după început.',
  })
  .refine((v) => v.format !== 'private' || v.capacity === 1, {
    message: 'O ședință particulară are un singur loc.',
  })
  .refine((v) => (v.category === 'exhibition') === (v.format === 'exhibition'), {
    message: 'Expozițiile trebuie să folosească formatul expoziție.',
  });
export const artworkSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().min(10).max(6000),
  price: z.number().min(0).max(1000000),
  dimensions: z.string().trim().min(2).max(80),
  medium: z.string().trim().min(2).max(120),
  image: imagePath,
  status: z.enum(['available', 'reserved', 'sold', 'draft']),
});
export const settingsSchema = z.object({
  artist: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(240),
  phone: z.union([z.literal(''), phoneSchema]),
  instagram: z.union([
    z.literal(''),
    z.url().regex(/^https:\/\/(www\.)?instagram\.com\/[\w.\/-]+$/),
  ]),
  demo: z.boolean(),
});
export function problem(status, message) {
  return Object.assign(new Error(message), { status });
}
export function idParam(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw problem(400, 'Identificator invalid.');
  return id;
}
