import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  Download,
  Heart,
  LogOut,
  Palette,
  Plus,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  addWeeks,
  api,
  bucharestToISO,
  categories,
  dateFormat,
  inputDate,
  json,
  money,
} from './lib';
import { Empty, ErrorMessage, Flower, Modal } from './components';
import type { Artwork, AtelierEvent, Dashboard, Photo, Settings } from './types';
import { assetUrl } from './preview';

type Tab = 'events' | 'registrations' | 'artworks' | 'inquiries' | 'settings';
const tabs: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'events', label: 'Program & evenimente', icon: CalendarDays },
  { id: 'registrations', label: 'Înscrieri', icon: Users },
  { id: 'artworks', label: 'Tablouri', icon: Palette },
  { id: 'inquiries', label: 'Cereri de cumpărare', icon: Heart },
  { id: 'settings', label: 'Setări atelier', icon: SettingsIcon },
];
const statusLabel: Record<string, string> = {
  published: 'Publicat',
  draft: 'Ciornă',
  cancelled: 'Anulat',
  confirmed: 'Confirmat',
  available: 'Disponibil',
  reserved: 'Rezervat',
  sold: 'Vândut',
  new: 'Nouă',
  contacted: 'Contactat',
  closed: 'Închisă',
};
export default function Admin({ onExit }: { onExit: () => void }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>('events');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [eventEdit, setEventEdit] = useState<AtelierEvent | 'new' | null>(null);
  const [artEdit, setArtEdit] = useState<Artwork | 'new' | null>(null);
  const [gallery, setGallery] = useState<AtelierEvent | null>(null);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const refresh = useCallback(async () => {
    try {
      setData(await api<Dashboard>('/admin/dashboard'));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    api('/admin/me')
      .then(() => {
        setAuthenticated(true);
        void refresh();
      })
      .catch(() => setAuthenticated(false));
  }, [refresh]);
  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api(
        '/admin/login',
        json('POST', { email: form.get('email'), password: form.get('password') }),
      );
      setAuthenticated(true);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    try {
      await api('/admin/logout', json('POST', {}));
      setAuthenticated(false);
      setData(null);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const mutate = async (path: string, method: string, body: unknown) => {
    setBusy(true);
    setError('');
    try {
      await api(path, json(method, body));
      await refresh();
      setNotice('Modificarea a fost salvată.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const saved = async () => {
    await refresh();
    setEventEdit(null);
    setArtEdit(null);
    setNotice('Modificările sunt salvate în MySQL.');
  };
  if (authenticated === null)
    return (
      <div className="loading">
        <Flower />
        Pregătim atelierul…
      </div>
    );
  if (!authenticated)
    return (
      <main className="admin-login">
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={17} />
          Înapoi la atelier
        </button>
        <div className="login-card">
          <Flower />
          <span className="eyebrow">ÎN SPATELE CULORILOR</span>
          <h1>
            Bun venit
            <br />
            <em>în atelier.</em>
          </h1>
          <p>Intră în spațiul de administrare.</p>
          <form onSubmit={login}>
            <label className="field">
              Email
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Emailul administratorului"
                required
              />
            </label>
            <label className="field">
              Parolă
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Parola ta"
                required
                maxLength={200}
              />
            </label>
            <ErrorMessage error={error} />
            <button className="button primary full-width" disabled={busy}>
              {busy ? 'Se verifică…' : 'Intră în atelier'}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="fine-print">
            <ShieldCheck size={14} />
            Acces rezervat administratorului.
          </p>
        </div>
      </main>
    );
  const registrations =
    data?.registrations.filter(
      (r) =>
        (eventFilter === 'all' || r.event_id === Number(eventFilter)) &&
        `${r.name} ${r.phone} ${r.title} ${r.reference}`
          .toLocaleLowerCase('ro')
          .includes(search.toLocaleLowerCase('ro')),
    ) || [];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <button className="brand" onClick={onExit}>
          <Flower />
          <span>
            atelier<em>de vise</em>
          </span>
        </button>
        <span className="admin-label">SPAȚIUL TĂU CREATIV</span>
        <nav aria-label="Administrare">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => {
                setTab(t.id);
                setNotice('');
                setSearch('');
              }}
            >
              <t.icon size={19} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={onExit}>
            <ArrowUpRight size={17} />
            Vezi aplicația publică
          </button>
          <button onClick={() => void logout()}>
            <LogOut size={17} />
            Deconectare
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-topline">
          <span>
            <i /> Atelier de vise · Administrare
          </span>
          <button className="text-button" onClick={onExit}>
            Vezi aplicația <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="admin-heading">
          <div>
            <span className="eyebrow orange-text">TOTUL ÎNTR-UN SINGUR LOC</span>
            <h1>{tabs.find((t) => t.id === tab)?.label}</h1>
          </div>
          {tab === 'events' && (
            <button className="button primary" onClick={() => setEventEdit('new')}>
              <Plus size={18} />
              Adaugă eveniment
            </button>
          )}
          {tab === 'artworks' && (
            <button className="button primary" onClick={() => setArtEdit('new')}>
              <Plus size={18} />
              Adaugă tablou
            </button>
          )}
        </div>
        <ErrorMessage error={error} />
        {notice && (
          <div className="notice" role="status">
            <Check size={17} />
            {notice}
            <button
              className="icon-button"
              onClick={() => setNotice('')}
              aria-label="Închide notificarea"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!data ? (
          <div className="empty">
            <p>Se încarcă datele atelierului…</p>
            <button className="button dark" onClick={() => void refresh()}>
              Reîncarcă
            </button>
          </div>
        ) : (
          <>
            <div className="stat-grid">
              <div>
                <CalendarDays />
                <span>Evenimente viitoare</span>
                <strong>
                  {
                    data.events.filter(
                      (e) => new Date(e.starts_at) > new Date() && e.status === 'published',
                    ).length
                  }
                </strong>
              </div>
              <div>
                <Users />
                <span>Locuri rezervate, în viitor</span>
                <strong>
                  {data.events
                    .filter((e) => new Date(e.starts_at) > new Date() && e.status === 'published')
                    .reduce((sum, e) => sum + e.booked, 0)}
                </strong>
              </div>
              <div>
                <Heart />
                <span>Cereri noi pentru tablouri</span>
                <strong>{data.inquiries.filter((i) => i.status === 'new').length}</strong>
              </div>
            </div>
            {tab === 'events' && (
              <>
                <div className="admin-toolbar">
                  <label className="search-field">
                    <Search size={17} />
                    <input
                      placeholder="Caută un eveniment…"
                      aria-label="Caută evenimente"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <span className="muted">Orele sunt afișate pentru România</span>
                </div>
                <div className="admin-event-list">
                  {data.events
                    .filter((e) =>
                      `${e.title} ${categories[e.category].label}`
                        .toLocaleLowerCase('ro')
                        .includes(search.toLocaleLowerCase('ro')),
                    )
                    .map((e) => (
                      <article className="admin-event" key={e.id}>
                        <img src={assetUrl(e.cover)} alt="" />
                        <div className="admin-event-info">
                          <span className="eyebrow">
                            {categories[e.category].label} ·{' '}
                            {dateFormat(e.starts_at, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <h3>{e.title}</h3>
                          <span className={`status ${e.status}`}>{statusLabel[e.status]}</span>
                          <span className="muted">
                            {e.booked}/{e.capacity} locuri · {money(e.price)} · {e.photo_count}/10
                            fotografii
                          </span>
                        </div>
                        <div className="admin-event-actions">
                          <button
                            className="button outline small"
                            onClick={() => {
                              setEventFilter(String(e.id));
                              setTab('registrations');
                              setSearch('');
                            }}
                          >
                            <Users size={15} />
                            Înscrieri
                          </button>
                          <button className="button outline small" onClick={() => setGallery(e)}>
                            <Camera size={15} />
                            Fotografii
                          </button>
                          <button className="button dark small" onClick={() => setEventEdit(e)}>
                            Editează
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
                {!data.events.length && (
                  <Empty title="Primul atelier începe cu o idee.">
                    Adaugă un eveniment pentru a deschide înscrierile.
                  </Empty>
                )}
              </>
            )}
            {tab === 'registrations' && (
              <>
                <div className="admin-toolbar">
                  <label className="search-field">
                    <Search size={17} />
                    <input
                      placeholder="Nume, telefon sau cod…"
                      aria-label="Caută înscrieri"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filtrează după eveniment"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                  >
                    <option value="all">Toate evenimentele</option>
                    {data.events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title} · {dateFormat(e.starts_at)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="button outline small"
                    onClick={() => exportCSV(registrations)}
                    disabled={!registrations.length}
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Eveniment</th>
                        <th>Locuri</th>
                        <th>Cod</th>
                        <th>Status</th>
                        <th>Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.name}</strong>
                            <a href={`tel:${r.phone}`}>{r.phone}</a>
                          </td>
                          <td>
                            {r.title}
                            <small>
                              {dateFormat(r.starts_at.replace(' ', 'T') + 'Z', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </small>
                          </td>
                          <td>{r.seats}</td>
                          <td>
                            <code>{r.reference}</code>
                          </td>
                          <td>
                            <span className={`status ${r.status}`}>{statusLabel[r.status]}</span>
                          </td>
                          <td>
                            {r.status === 'confirmed' && (
                              <button
                                className="text-button danger"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Anulezi înscrierea pentru ${r.name}? Cele ${r.seats} locuri vor fi eliberate. Contactează participantul pentru a-l informa.`,
                                    )
                                  )
                                    void mutate(`/admin/registrations/${r.id}`, 'PATCH', {
                                      status: 'cancelled',
                                    });
                                }}
                              >
                                Anulează
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!registrations.length && (
                  <Empty title="Nicio înscriere pentru această selecție." />
                )}
              </>
            )}
            {tab === 'artworks' && (
              <div className="admin-art-grid">
                {data.artworks.map((a) => (
                  <article key={a.id}>
                    <img src={assetUrl(a.image)} alt={a.title} />
                    <div>
                      <span className={`status ${a.status}`}>{statusLabel[a.status]}</span>
                      <h3>{a.title}</h3>
                      <p>
                        {a.dimensions} · {money(a.price)}
                      </p>
                      <button className="button dark small" onClick={() => setArtEdit(a)}>
                        Editează tabloul
                      </button>
                    </div>
                  </article>
                ))}
                {!data.artworks.length && <Empty />}
              </div>
            )}
            {tab === 'inquiries' && (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Persoană</th>
                        <th>Tablou</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.inquiries.map((i) => (
                        <tr key={i.id}>
                          <td>
                            <strong>{i.name}</strong>
                            <a href={`tel:${i.phone}`}>{i.phone}</a>
                          </td>
                          <td>{i.title}</td>
                          <td>
                            <select
                              aria-label={`Status cerere ${i.name}`}
                              disabled={busy}
                              value={i.status}
                              onChange={(e) =>
                                void mutate(`/admin/inquiries/${i.id}`, 'PATCH', {
                                  status: e.target.value,
                                })
                              }
                            >
                              <option value="new">Nouă</option>
                              <option value="contacted">Contactat</option>
                              <option value="closed">Închisă</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="muted">
                  Cererile nu rezervă automat tabloul. După confirmarea cumpărării, schimbă și
                  statusul lucrării în secțiunea Tablouri.
                </p>
                {!data.inquiries.length && <Empty title="Lucrările își așteaptă oamenii." />}
              </>
            )}
            {tab === 'settings' && (
              <SettingsForm
                settings={data.settings}
                onSave={async (settings) => {
                  await api('/admin/settings', json('PUT', settings));
                  await refresh();
                  setNotice('Datele publice au fost actualizate.');
                }}
              />
            )}
          </>
        )}
      </main>
      {eventEdit && (
        <EventEditor
          event={eventEdit === 'new' ? null : eventEdit}
          address={data?.settings.address || ''}
          onClose={() => setEventEdit(null)}
          onSaved={saved}
        />
      )}
      {artEdit && (
        <ArtworkEditor
          artwork={artEdit === 'new' ? null : artEdit}
          onClose={() => setArtEdit(null)}
          onSaved={saved}
        />
      )}
      {gallery && (
        <GalleryEditor
          event={gallery}
          onClose={() => {
            setGallery(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
function EventEditor({
  event,
  address,
  onClose,
  onSaved,
}: {
  event: AtelierEvent | null;
  address: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [category, setCategory] = useState(event?.category || 'wine');
  const [format, setFormat] = useState(event?.format || 'group');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const start = String(form.get('starts_at'));
      const end = String(form.get('ends_at'));
      const repeat = Number(form.get('repeat') || 1);
      const events = Array.from({ length: repeat }, (_, week) => ({
        category,
        title: form.get('title'),
        description: form.get('description'),
        starts_at: bucharestToISO(addWeeks(start, week)),
        ends_at: bucharestToISO(addWeeks(end, week)),
        capacity: format === 'private' ? 1 : Number(form.get('capacity')),
        price: Number(form.get('price')),
        location: form.get('location'),
        format,
        status: form.get('status'),
        cover: event?.cover || categories[category].image,
      }));
      if (category === 'wine' && repeat > 1 && new Date(`${start}:00Z`).getUTCDay() !== 4)
        throw new Error('Pentru seria „Vin și pictez”, alege o zi de joi.');
      await api(
        event ? `/admin/events/${event.id}` : '/admin/events',
        json(event ? 'PUT' : 'POST', event ? events[0] : { events }),
      );
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={event ? 'Editează evenimentul' : 'Adaugă eveniment'} onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        <span className="eyebrow orange-text">PROGRAMUL ATELIERULUI</span>
        <h2>{event ? 'Un pic de ajustare.' : 'O nouă întâlnire.'}</h2>
        <label className="field">
          Activitate
          <select
            aria-label="Activitate"
            value={category}
            onChange={(e) => {
              const value = e.target.value as typeof category;
              setCategory(value);
              setFormat(
                value === 'exhibition' ? 'exhibition' : value === 'adults' ? 'private' : 'group',
              );
            }}
          >
            {Object.entries(categories).map(([key, c]) => (
              <option key={key} value={key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Titlul evenimentului
          <input
            name="title"
            defaultValue={event?.title}
            placeholder="De exemplu: Flori, vin și povești"
            required
            minLength={3}
            maxLength={140}
          />
        </label>
        <label className="field">
          Povestea și detaliile
          <textarea
            name="description"
            defaultValue={event?.description}
            required
            minLength={10}
            maxLength={6000}
            rows={4}
            placeholder="Ce facem, cui se adresează și ce este inclus…"
          />
        </label>
        <div className="form-row">
          <label className="field">
            Început · ora României
            <input
              type="datetime-local"
              name="starts_at"
              defaultValue={event ? inputDate(event.starts_at) : ''}
              required
            />
          </label>
          <label className="field">
            Sfârșit · ora României
            <input
              type="datetime-local"
              name="ends_at"
              defaultValue={event ? inputDate(event.ends_at) : ''}
              required
            />
          </label>
        </div>
        {!event && (
          <label className="field">
            Repetare săptămânală
            <select name="repeat" defaultValue="1">
              <option value="1">O singură întâlnire</option>
              {[2, 4, 8, 12, 26].map((n) => (
                <option value={n} key={n}>
                  {n} întâlniri, în aceeași zi și la aceeași oră
                </option>
              ))}
            </select>
            <small>
              Fiecare dată va avea înscrieri și fotografii proprii. Poți anula individual o joi
              liberă.
            </small>
          </label>
        )}
        <div className="form-row">
          <label className="field">
            Format
            <select
              aria-label="Format"
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              disabled={category === 'exhibition'}
            >
              {category === 'exhibition' ? (
                <option value="exhibition">Expoziție</option>
              ) : (
                <>
                  <option value="group">Atelier de grup</option>
                  <option value="private">Ședință particulară</option>
                </>
              )}
            </select>
          </label>
          <label className="field">
            Locuri
            <input
              name="capacity"
              type="number"
              min="1"
              max="500"
              required
              defaultValue={event?.capacity || 12}
              disabled={format === 'private'}
            />
            {format === 'private' && <small>Un singur loc pentru ședința particulară.</small>}
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            Preț (lei / persoană)
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              max="100000"
              defaultValue={event?.price || 0}
              required
            />
          </label>
          <label className="field">
            Vizibilitate
            <select name="status" defaultValue={event?.status || 'published'}>
              <option value="published">Publicat</option>
              <option value="draft">Ciornă</option>
              <option value="cancelled">Anulat</option>
            </select>
          </label>
        </div>
        <label className="field">
          Loc / adresă
          <input
            name="location"
            defaultValue={event?.location || address}
            required
            minLength={3}
            maxLength={240}
          />
        </label>
        {event && event.booked > 0 && (
          <p className="warning">
            Există {event.booked} locuri rezervate. Dacă modifici data, locul sau anulezi
            evenimentul, contactează participanții din lista de înscrieri. Aplicația nu trimite
            SMS-uri automat.
          </p>
        )}
        <ErrorMessage error={error} />
        <button className="button primary full-width" disabled={busy}>
          {busy ? 'Se salvează…' : event ? 'Salvează modificările' : 'Creează evenimentul'}
          <Check size={17} />
        </button>
      </form>
    </Modal>
  );
}
function GalleryEditor({ event, onClose }: { event: AtelierEvent; onClose: () => void }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cover, setCover] = useState(event.cover);
  const refresh = useCallback(
    async () => setPhotos(await api<Photo[]>(`/admin/events/${event.id}/photos`)),
    [event.id],
  );
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    if (files.length + photos.length > 10) {
      setError('Poți avea maximum 10 fotografii pentru un eveniment.');
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024)
          throw new Error('Fiecare fotografie trebuie să aibă maximum 5 MB.');
        form.append('photos', file);
      }
      await api(`/admin/events/${event.id}/photos`, { method: 'POST', body: form });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (photo: Photo) => {
    if (!window.confirm('Ștergi definitiv această fotografie din eveniment?')) return;
    setBusy(true);
    setError('');
    try {
      await api(`/admin/photos/${photo.id}`, json('DELETE', {}));
      if (cover === photo.url) setCover('/images/workshop.jpg');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const makeCover = async (photo: Photo) => {
    setBusy(true);
    setError('');
    try {
      const dashboard = await api<Dashboard>('/admin/dashboard');
      const current = dashboard.events.find((e) => e.id === event.id);
      if (!current) throw new Error('Evenimentul nu mai există.');
      await api(`/admin/events/${event.id}`, json('PUT', { ...current, cover: photo.url }));
      setCover(photo.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Fotografiile evenimentului" onClose={onClose}>
      <div className="editor-form">
        <span className="eyebrow orange-text">AMINTIRI DE LA ATELIER</span>
        <h2>{event.title}</h2>
        <p>{photos.length} din 10 fotografii. JPG, PNG sau WebP, maximum 5 MB fiecare.</p>
        <label className={`upload-zone ${busy ? 'disabled' : ''}`}>
          <Upload size={27} />
          <strong>{busy ? 'Se procesează…' : 'Adaugă fotografii'}</strong>
          <span>Selectează una sau mai multe imagini</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy || photos.length >= 10}
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        <ErrorMessage error={error} />
        <div className="admin-photos">
          {photos.map((p) => (
            <div key={p.id}>
              <img src={assetUrl(p.url)} alt="Fotografie de la eveniment" />
              <div>
                <button
                  className="text-button"
                  disabled={busy || cover === p.url}
                  onClick={() => void makeCover(p)}
                >
                  {cover === p.url ? 'Copertă ✓' : 'Setează copertă'}
                </button>
                <button
                  className="icon-button danger"
                  disabled={busy}
                  onClick={() => void remove(p)}
                  aria-label="Șterge fotografia"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="fine-print">
          Fotografiile sunt publice când evenimentul este publicat. Încarcă doar imagini pentru care
          ai drept de utilizare și acordul persoanelor fotografiate.
        </p>
      </div>
    </Modal>
  );
}
function ArtworkEditor({
  artwork,
  onClose,
  onSaved,
}: {
  artwork: Artwork | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [image, setImage] = useState(artwork?.image || '/images/artwork.jpg');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Imaginea trebuie să aibă maximum 5 MB.');
      const data = new FormData();
      data.append('photo', file);
      const result = await api<{ url: string }>('/admin/artwork-images', {
        method: 'POST',
        body: data,
      });
      setImage(result.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api(
        artwork ? `/admin/artworks/${artwork.id}` : '/admin/artworks',
        json(artwork ? 'PUT' : 'POST', {
          title: form.get('title'),
          description: form.get('description'),
          price: Number(form.get('price')),
          dimensions: form.get('dimensions'),
          medium: form.get('medium'),
          status: form.get('status'),
          image,
        }),
      );
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={artwork ? 'Editează tabloul' : 'Adaugă tablou'} onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        <span className="eyebrow orange-text">PENTRU SUFLET</span>
        <h2>{artwork ? 'Povestea unui tablou.' : 'O nouă lucrare.'}</h2>
        <img className="artwork-preview" src={assetUrl(image)} alt="Previzualizare tablou" />
        <label className="field">
          Fotografia lucrării
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => void upload(e.target.files?.[0])}
          />
        </label>
        <label className="field">
          Titlu
          <input
            name="title"
            required
            minLength={2}
            maxLength={140}
            defaultValue={artwork?.title}
          />
        </label>
        <label className="field">
          Descriere
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={6000}
            rows={3}
            defaultValue={artwork?.description}
          />
        </label>
        <div className="form-row">
          <label className="field">
            Dimensiuni
            <input
              name="dimensions"
              required
              minLength={2}
              maxLength={80}
              placeholder="50 × 70 cm"
              defaultValue={artwork?.dimensions}
            />
          </label>
          <label className="field">
            Tehnică
            <input
              name="medium"
              required
              minLength={2}
              maxLength={120}
              placeholder="Acrilic pe pânză"
              defaultValue={artwork?.medium}
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            Preț (lei)
            <input
              name="price"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              required
              defaultValue={artwork?.price}
            />
          </label>
          <label className="field">
            Status
            <select name="status" defaultValue={artwork?.status || 'available'}>
              <option value="available">Disponibil</option>
              <option value="reserved">Rezervat</option>
              <option value="sold">Vândut</option>
              <option value="draft">Ciornă</option>
            </select>
          </label>
        </div>
        <ErrorMessage error={error} />
        <button className="button primary full-width" disabled={busy}>
          {busy ? 'Se salvează…' : 'Salvează tabloul'}
          <Check size={17} />
        </button>
      </form>
    </Modal>
  );
}
function SettingsForm({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await onSave({
        artist: String(form.get('artist')),
        address: String(form.get('address')),
        phone: String(form.get('phone')),
        instagram: String(form.get('instagram')),
        demo: form.get('demo') === 'on',
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="settings-form" onSubmit={submit}>
      <h2>Oamenii să știe unde te găsesc.</h2>
      <label className="field">
        Numele artistului / atelierului
        <input
          name="artist"
          defaultValue={settings.artist}
          required
          minLength={2}
          maxLength={120}
        />
      </label>
      <label className="field">
        Adresă publică
        <input
          name="address"
          defaultValue={settings.address}
          required
          minLength={3}
          maxLength={240}
        />
      </label>
      <label className="field">
        Telefon public
        <input
          name="phone"
          type="tel"
          defaultValue={settings.phone}
          maxLength={24}
          placeholder="07xx xxx xxx"
        />
      </label>
      <label className="field">
        Link Instagram
        <input
          name="instagram"
          type="url"
          defaultValue={settings.instagram}
          maxLength={200}
          placeholder="https://www.instagram.com/atelierul.tau/"
        />
      </label>
      <label className="checkbox-field">
        <input name="demo" type="checkbox" defaultChecked={settings.demo} />
        <span>
          Afișează eticheta „conținut demonstrativ” în aplicație. Debifează după ce ai înlocuit
          evenimentele, prețurile și imaginile cu date reale.
        </span>
      </label>
      <p className="muted">
        Schimbarea adresei publice nu modifică locul evenimentelor existente. Editează-le individual
        dacă este nevoie.
      </p>
      <ErrorMessage error={error} />
      <button className="button primary" disabled={busy}>
        {busy ? 'Se salvează…' : 'Salvează setările'}
        <Check size={17} />
      </button>
    </form>
  );
}
function exportCSV(rows: Dashboard['registrations']) {
  const cell = (value: unknown) => {
    let s = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const csv = [
    ['Nume', 'Telefon', 'Eveniment', 'Data UTC', 'Locuri', 'Status', 'Cod'],
    ...rows.map((r) => [
      r.name,
      r.phone,
      r.title,
      r.starts_at,
      r.seats,
      statusLabel[r.status],
      r.reference,
    ]),
  ]
    .map((r) => r.map(cell).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inscrieri-atelier.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
