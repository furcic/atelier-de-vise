export type Category = 'wine' | 'kids' | 'adults' | 'exhibition';
export type AtelierEvent = {
  id: number;
  category: Category;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked: number;
  available: number;
  photo_count: number;
  price: number;
  location: string;
  format: 'group' | 'private' | 'exhibition';
  status: 'published' | 'draft' | 'cancelled';
  cover: string;
};
export type Artwork = {
  id: number;
  title: string;
  description: string;
  price: number;
  dimensions: string;
  medium: string;
  image: string;
  status: 'available' | 'reserved' | 'sold' | 'draft';
};
export type Settings = {
  artist: string;
  address: string;
  phone: string;
  instagram: string;
  demo: boolean;
};
export type Catalog = { events: AtelierEvent[]; artworks: Artwork[]; settings: Settings };
export type Registration = {
  id: number;
  event_id: number;
  name: string;
  phone: string;
  seats: number;
  status: 'confirmed' | 'cancelled';
  reference: string;
  title: string;
  starts_at: string;
  created_at: string;
};
export type Inquiry = {
  id: number;
  name: string;
  phone: string;
  title: string;
  status: 'new' | 'contacted' | 'closed';
};
export type Dashboard = Catalog & { registrations: Registration[]; inquiries: Inquiry[] };
export type Photo = { id: number; url: string };
