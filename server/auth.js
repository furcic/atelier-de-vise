import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
export function cookieToken(req) {
  return (
    req.headers.cookie
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith('atelier_session='))
      ?.slice('atelier_session='.length) || ''
  );
}
export const sessionOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 12 * 60 * 60 * 1000,
};
