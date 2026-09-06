import { lazy, Suspense, useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Home,
  Instagram,
  Menu,
  Palette,
  ShieldCheck,
  Sparkles,
  Wine,
  X,
} from 'lucide-react';
import { api, categories, clock, dateFormat, dateKey, downloadCalendar, json, money } from './lib';
import {
  categoryIcons,
  Empty,
  ErrorMessage,
  EventCard,
  EventFacts,
  Flower,
  Modal,
} from './components';
import type { AtelierEvent, Artwork, Catalog, Category, Photo, Settings } from './types';
import { assetUrl, isStaticPreview } from './preview';
const Admin = lazy(() => import('./Admin'));

type Page = 'home' | 'calendar' | 'memories' | 'art' | 'exhibitions';
const categoryKicker = {
  wine: 'joi seara',
  kids: 'pentru copii',
  adults: 'pentru adulți',
  art: 'tablouri',
  exhibition: 'expoziții',
};
const nav: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Ateliere', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'memories', label: 'Amintiri', icon: Camera },
  { id: 'art', label: 'Pentru suflet', icon: Heart },
  { id: 'exhibitions', label: 'Pentru ochi', icon: Palette },
];
const pageFromHash = (): Page =>
  nav.some((n) => n.id === location.hash.slice(1)) ? (location.hash.slice(1) as Page) : 'home';
export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [admin, setAdmin] = useState(!isStaticPreview && location.pathname.startsWith('/admin'));
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [event, setEvent] = useState<AtelierEvent | null>(null);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [menu, setMenu] = useState(false);
  const [install, setInstall] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const data = await api<Catalog>('/catalog');
      setCatalog(data);
      setError('');
      return data;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const onHash = () => setPage(pageFromHash());
    const onPop = () => setAdmin(!isStaticPreview && location.pathname.startsWith('/admin'));
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onPop);
    };
  }, [refresh]);
  useEffect(() => {
    document.title = admin
      ? 'Administrare · Atelier de vise'
      : `${nav.find((n) => n.id === page)?.label} · Atelier de vise`;
  }, [page, admin]);
  const navigate = (next: Page, filter: Category | 'all' = 'all') => {
    setCategory(filter);
    setPage(next);
    location.hash = next;
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openAdmin = () => {
    history.pushState(null, '', '/admin');
    setAdmin(true);
    setMenu(false);
    window.scrollTo(0, 0);
  };
  const leaveAdmin = () => {
    history.pushState(null, '', '/');
    setAdmin(false);
    void refresh();
  };
  if (admin)
    return (
      <Suspense fallback={<div className="loading">Pregătim atelierul…</div>}>
        <Admin onExit={leaveAdmin} />
      </Suspense>
    );
  const upcoming =
    catalog?.events.filter(
      (e) => new Date(e.starts_at) > new Date() && e.category !== 'exhibition',
    ) || [];
  const past =
    catalog?.events
      .filter((e) => new Date(e.ends_at) < new Date() && e.category !== 'exhibition')
      .reverse() || [];
  const selectedEvents = upcoming.filter((e) => category === 'all' || e.category === category);
  const nextWine = upcoming.find((e) => e.category === 'wine');
  return (
    <>
      <div className="announcement">
        <Sparkles size={13} />
        <span>Un pic de culoare. Un strop de curaj. Multă bucurie.</span>
        <Sparkles size={13} />
      </div>
      {isStaticPreview && (
        <div className="preview-notice">
          Previzualizare · Program demonstrativ. Înscrierile și cumpărăturile se deschid la lansare.
        </div>
      )}
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate('home')}
          aria-label="Atelier de vise, acasă"
        >
          <Flower />
          <span>
            atelier<em>de vise</em>
          </span>
        </button>
        <nav className={menu ? 'desktop-nav open' : 'desktop-nav'} aria-label="Navigare principală">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={page === item.id ? 'active' : ''}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          {!isStaticPreview && (
            <button className="admin-link" onClick={openAdmin} aria-label="Administrare">
              <ShieldCheck size={19} />
              <span>Admin</span>
            </button>
          )}
          <button className="button small dark header-cta" onClick={() => navigate('calendar')}>
            Găsește-ți atelierul <ArrowUpRight size={16} />
          </button>
          <button
            className="icon-button menu-toggle"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-label={menu ? 'Închide meniul' : 'Deschide meniul'}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        {page === 'home' && (
          <>
            <section className="hero section-width">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span className="little-line" /> UN LOC PENTRU LATURA TA CREATIVĂ
                </span>
                <h1>
                  Fă loc
                  <br />
                  <em>bucuriei.</em>
                  <Flower className="hero-title-flower" />
                </h1>
                <p>
                  Lasă lumea pe pauză. Ia o pensulă, un strop de curaj și hai să facem ceva frumos.
                  Împreună.
                </p>
                <div className="hero-buttons">
                  <button className="button primary" onClick={() => navigate('calendar')}>
                    Descoperă atelierele <ArrowUpRight size={20} />
                  </button>
                  <span className="handwritten">
                    Nu trebuie să știi să pictezi.
                    <br />
                    Doar să ai chef să încerci. <span>↗</span>
                  </span>
                </div>
                <div className="hero-note">
                  <span className="tiny-art">
                    <Palette size={17} />
                  </span>
                  Materiale incluse. Emoții binevenite.
                </div>
              </div>
              <div className="hero-art">
                <div className="hero-pink-shape" />
                <img
                  className="hero-main-image"
                  src={assetUrl('/images/portret.png')}
                  alt="Portret artistic în tonuri calde, cu texturi de colaj și flori"
                />
                <div className="hero-caption">
                  <span>MAI PUȚIN SCROLL.</span>
                  <em>Mai mult suflet.</em>
                </div>
                <div className="hero-small-photo">
                  <img
                    src={assetUrl('/images/gallery.jpg')}
                    alt="Pictură florală cu trandafiri și lalele pe un fundal închis"
                  />
                  <span>puțină culoare schimbă tot.</span>
                </div>
                <div className="hero-round-sticker">
                  <Wine size={27} />
                  <span>
                    JOIA E<br />
                    CU VIN & ARTĂ
                  </span>
                </div>
                <svg className="hero-scribble" viewBox="0 0 160 90" fill="none" aria-hidden="true">
                  <path
                    d="M8 60C25 2 110 5 99 42S20 75 54 33 155 22 139 75M126 65l13 12 9-19"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </section>
            <section className="category-section section-width">
              <div className="small-heading">
                <span>CUM AI CHEF SĂ CREEZI?</span>
                <span>5 feluri de a-ți face ziua mai frumoasă</span>
              </div>
              <div className="category-grid">
                {(['wine', 'kids', 'adults', 'art', 'exhibition'] as const).map((key) => {
                  const item =
                    key === 'art'
                      ? { label: 'Pentru suflet', short: 'Un tablou, o emoție', color: 'yellow' }
                      : categories[key];
                  return (
                    <button
                      key={key}
                      className={`category-card ${item.color}`}
                      onClick={() =>
                        navigate(
                          key === 'art' ? 'art' : key === 'exhibition' ? 'exhibitions' : 'calendar',
                          key === 'art' ? 'all' : key,
                        )
                      }
                    >
                      <span className="category-tag">{item.short}</span>
                      <span className="category-body">
                        <span className="category-kicker">
                          {categoryKicker[key]}
                          <ArrowUpRight className="category-arrow" size={17} />
                        </span>
                        <h3>{item.label}</h3>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="section-width upcoming-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow orange-text">NE VEDEM LA ATELIER</span>
                  <h2>
                    Următoarea ta <em>pauză frumoasă.</em>
                  </h2>
                </div>
                <button className="text-button" onClick={() => navigate('calendar')}>
                  Tot calendarul <ArrowUpRight size={18} />
                </button>
              </div>
              {catalog?.settings.demo && (
                <p className="demo-note">
                  Program și prețuri demonstrative · detaliile reale vor fi publicate de atelier.
                </p>
              )}
              <div className="event-grid">
                {[
                  upcoming.find((e) => e.category === 'wine'),
                  upcoming.find((e) => e.category === 'kids'),
                  upcoming.find((e) => e.category === 'adults'),
                ]
                  .filter((e): e is AtelierEvent => !!e)
                  .map((e) => (
                    <EventCard key={e.id} event={e} onClick={() => setEvent(e)} />
                  ))}
              </div>
              {!loading && !upcoming.length && !error && <Empty />}
            </section>
            <section className="wine-banner section-width">
              <div className="wine-drawing">
                <Wine size={82} strokeWidth={1} />
                <Flower />
              </div>
              <div>
                <span className="eyebrow">UN MIC RITUAL DE JOI</span>
                <h2>
                  Vin pentru vin.
                  <br />
                  <em>Rămân pentru oameni.</em>
                </h2>
                <p>
                  O pânză albă, un pahar bun și o seară care nu seamănă cu celelalte. La „Vin și
                  pictez”, fiecare joi are povestea ei.
                </p>
              </div>
              <button
                className="button cream-button"
                onClick={() => (nextWine ? setEvent(nextWine) : navigate('calendar', 'wine'))}
              >
                Ne vedem joi? <ArrowUpRight size={20} />
              </button>
            </section>
            <section className="section-width story-section">
              <span className="eyebrow">AICI NU EXISTĂ „NU AM TALENT”</span>
              <h2>
                Există doar <em>„hai să încerc”.</em>
              </h2>
              <p>
                Atelier de vise este despre bucuria de a face ceva cu mâinile tale. Despre timp
                pentru tine, oameni noi și culori care rămân cu tine mult după ce ai lăsat pensula
                jos.
              </p>
              <Flower />
            </section>
          </>
        )}
        {page === 'calendar' && (
          <section className="section-width inner-page">
            <PageHeading
              eyebrow="TIMP PENTRU CE ÎȚI PLACE"
              title="Pune bucuria"
              accent="în calendar."
              description="Alege o zi, găsește-ți atelierul și păstrează-ți un loc. Ne ocupăm noi de restul."
            />
            {catalog?.settings.demo && (
              <p className="demo-note">Program demonstrativ. Orele sunt afișate pentru România.</p>
            )}
            <CategoryFilter value={category} onChange={setCategory} />
            <Calendar events={selectedEvents} onSelect={setEvent} />
          </section>
        )}
        {page === 'memories' && (
          <section className="section-width inner-page">
            <PageHeading
              eyebrow="CULOAREA RĂMÂNE"
              title="A fost odată"
              accent="la atelier."
              description="Fiecare întâlnire are povestea ei. Deschide un eveniment și răsfoiește amintirile, fotografie cu fotografie."
            />
            <div className="event-grid">
              {past.map((e) => (
                <EventCard key={e.id} event={e} archive onClick={() => setEvent(e)} />
              ))}
            </div>
            {!past.length && <Empty title="Cele mai frumoase amintiri urmează." />}
          </section>
        )}
        {page === 'art' && (
          <section className="section-width inner-page">
            <PageHeading
              eyebrow="PENTRU SUFLET"
              title="Artă care își găsește"
              accent="locul la tine."
              description="Un tablou nu umple doar un perete. Alege lucrarea care îți spune ceva și trimite-ne o cerere de cumpărare."
            />
            {catalog?.settings.demo && (
              <p className="demo-note">Lucrări, imagini și prețuri demonstrative.</p>
            )}
            <div className="art-grid">
              {catalog?.artworks.map((a) => (
                <button className="art-card" key={a.id} onClick={() => setArtwork(a)}>
                  <div className="art-image">
                    <img src={assetUrl(a.image)} alt={a.title} loading="lazy" />
                    <span className={`tag ${a.status === 'available' ? 'green' : 'neutral'}`}>
                      {a.status === 'available'
                        ? 'Disponibil'
                        : a.status === 'sold'
                          ? 'Vândut'
                          : 'Rezervat'}
                    </span>
                    <span className="art-arrow">
                      <ArrowUpRight />
                    </span>
                  </div>
                  <div className="art-card-info">
                    <div>
                      <h3>{a.title}</h3>
                      <p>
                        {a.medium} · {a.dimensions}
                      </p>
                    </div>
                    <strong>{money(a.price)}</strong>
                  </div>
                </button>
              ))}
            </div>
            {catalog && !catalog.artworks.length && <Empty />}
          </section>
        )}
        {page === 'exhibitions' && (
          <section className="section-width inner-page">
            <PageHeading
              eyebrow="PENTRU OCHI"
              title="Ne întâlnim"
              accent="printre tablouri."
              description="Expoziții, vernisaje și alte motive de a ieși din cotidian. Aici găsești locul, data și povestea fiecărei întâlniri."
            />
            <div className="event-grid">
              {catalog?.events
                .filter((e) => e.category === 'exhibition')
                .map((e) => (
                  <EventCard key={e.id} event={e} onClick={() => setEvent(e)} />
                ))}
            </div>
            {catalog && !catalog.events.some((e) => e.category === 'exhibition') && <Empty />}
          </section>
        )}
        {loading && (
          <div className="loading" role="status">
            <Flower />
            Pregătim culorile…
          </div>
        )}
        {error && (
          <div className="section-width">
            <ErrorMessage error={error} />
            <button
              className="button dark"
              onClick={() => {
                setLoading(true);
                void refresh();
              }}
            >
              Încearcă din nou
            </button>
          </div>
        )}
      </main>
      <footer>
        <div className="footer-top section-width">
          <div>
            <button className="brand" onClick={() => navigate('home')}>
              <Flower />
              <span>
                atelier<em>de vise</em>
              </span>
            </button>
            <p>Un loc pentru artă. Un pic de timp pentru tine.</p>
          </div>
          <div className="footer-contact">
            <span>{catalog?.settings.artist || 'Atelier de vise'}</span>
            <span>{catalog?.settings.address}</span>
            {catalog?.settings.phone && (
              <a href={`tel:${catalog.settings.phone}`}>{catalog.settings.phone}</a>
            )}
          </div>
          <div className="footer-links">
            {catalog?.settings.instagram && (
              <a href={catalog.settings.instagram} target="_blank" rel="noreferrer">
                <Instagram size={16} /> Instagram <ArrowUpRight size={14} />
              </a>
            )}
            <button onClick={() => setInstall(true)}>
              <Download size={16} /> Ia atelierul cu tine
            </button>
            <button onClick={() => setPrivacy(true)}>Despre datele tale</button>
            {!isStaticPreview && (
              <button onClick={openAdmin}>
                Administrare <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="footer-bottom section-width">
          <span>© {new Date().getFullYear()} Atelier de vise</span>
          <span>
            Făcut cu drag. Și puțină vopsea. <Heart size={12} />
          </span>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Navigare pe telefon">
        {nav.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? 'active' : ''}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={21} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      {event && (
        <EventDetail
          event={catalog?.events.find((e) => e.id === event.id) || event}
          settings={catalog?.settings}
          onClose={() => setEvent(null)}
          onRefresh={refresh}
        />
      )}
      {artwork && <ArtworkDetail artwork={artwork} onClose={() => setArtwork(null)} />}
      {install && (
        <Modal title="Instalează aplicația" onClose={() => setInstall(false)}>
          <div className="text-modal">
            <Flower />
            <span className="eyebrow">ATELIERUL, MEREU APROAPE</span>
            <h2>
              Ia bucuria <em>cu tine.</em>
            </h2>
            <p>Poți adăuga aplicația pe ecranul telefonului:</p>
            <h3>Pe iPhone</h3>
            <p>Deschide în Safari, apasă Partajare, apoi „Adăugați la ecranul principal”.</p>
            <h3>Pe Android</h3>
            <p>
              Deschide în Chrome, apasă meniul ⋮, apoi „Instalează aplicația” sau „Adaugă pe ecranul
              de pornire”.
            </p>
            <p className="muted">
              Instalarea necesită o adresă HTTPS. Pentru înscrieri și locuri actualizate ai nevoie
              de internet.
            </p>
          </div>
        </Modal>
      )}
      {privacy && (
        <Modal title="Despre datele tale" onClose={() => setPrivacy(false)}>
          <div className="text-modal">
            <h2>
              Datele tale, <em>cu grijă.</em>
            </h2>
            {isStaticPreview ? (
              <p>
                Aceasta este o previzualizare cu date demonstrative. Formularele de înscriere și
                cumpărare sunt închise; nu colectăm nume sau numere de telefon. Aplicația nu
                folosește module de analiză, publicitate sau cookie-uri de autentificare în această
                versiune.
              </p>
            ) : (
              <>
                <p>
                  La înscriere, atelierul salvează numele, telefonul, evenimentul și numărul de
                  locuri. Pentru o cerere de cumpărare, salvează numele, telefonul și tabloul ales.
                </p>
                <p>
                  Datele sunt folosite pentru gestionarea înscrierii sau a cererii și pentru a te
                  contacta în legătură cu aceasta. Nu sunt afișate public și nu sunt folosite pentru
                  marketing în această aplicație.
                </p>
                <p>
                  Nu este creat un cont și numărul de telefon nu este verificat prin SMS. Pentru
                  modificarea, anularea sau ștergerea datelor, contactează atelierul
                  {catalog?.settings.phone
                    ? ` la ${catalog.settings.phone}`
                    : ' folosind datele de contact care vor fi publicate aici'}
                  .
                </p>
                <p>
                  Numai zona de administrare folosește un cookie de sesiune. Nu folosim module de
                  analiză sau publicitate.
                </p>
                {catalog?.settings.demo && (
                  <p className="demo-note">
                    Versiune demonstrativă. Înainte de lansare, administratorul trebuie să
                    completeze identitatea și datele de contact ale operatorului și politica de
                    păstrare a datelor.
                  </p>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
function PageHeading({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow orange-text">{eyebrow}</span>
      <h1>
        {title}
        <br />
        <em>{accent}</em>
      </h1>
      <p>{description}</p>
      <Flower />
    </div>
  );
}
function CategoryFilter({
  value,
  onChange,
}: {
  value: Category | 'all';
  onChange: (category: Category | 'all') => void;
}) {
  return (
    <div className="filters" aria-label="Filtrează atelierele">
      <button className={value === 'all' ? 'selected' : ''} onClick={() => onChange('all')}>
        Toate atelierele
      </button>
      {(['wine', 'kids', 'adults'] as const).map((key) => {
        const Icon = categoryIcons[key];
        return (
          <button
            className={value === key ? 'selected' : ''}
            key={key}
            onClick={() => onChange(key)}
          >
            <Icon size={15} />
            {categories[key].label}
          </button>
        );
      })}
    </div>
  );
}
function Calendar({
  events,
  onSelect,
}: {
  events: AtelierEvent[];
  onSelect: (event: AtelierEvent) => void;
}) {
  const [month, setMonth] = useState(
    () => new Date(`${dateKey(new Date().toISOString()).slice(0, 7)}-01T12:00:00Z`),
  );
  const [day, setDay] = useState<string | null>(null);
  const [format, setFormat] = useState('all');
  const prefix = month.toISOString().slice(0, 7);
  const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (month.getUTCDay() + 6) % 7;
  const monthEvents = events.filter(
    (e) => dateKey(e.starts_at).startsWith(prefix) && (format === 'all' || e.format === format),
  );
  const visible = day ? monthEvents.filter((e) => dateKey(e.starts_at) === day) : monthEvents;
  const changeMonth = (amount: number) => {
    setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + amount, 1, 12)));
    setDay(null);
  };
  return (
    <div className="calendar-layout">
      <aside className="calendar-panel">
        <div className="calendar-title">
          <h3>{dateFormat(month.toISOString(), { month: 'long', year: 'numeric' })}</h3>
          <button
            className="icon-button"
            onClick={() => changeMonth(-1)}
            aria-label="Luna precedentă"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            onClick={() => changeMonth(1)}
            aria-label="Luna următoare"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="calendar-grid">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <span className="weekday" key={`w${i}`}>
              {d}
            </span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`empty${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const key = `${prefix}-${String(i + 1).padStart(2, '0')}`;
            const found = monthEvents.filter((e) => dateKey(e.starts_at) === key);
            return (
              <button
                key={key}
                className={`${day === key ? 'selected' : ''} ${key === dateKey(new Date().toISOString()) ? 'today' : ''}`}
                aria-label={`${i + 1} ${dateFormat(month.toISOString(), { month: 'long' })}, ${found.length} ateliere`}
                aria-pressed={day === key}
                onClick={() => setDay(day === key ? null : key)}
              >
                {i + 1}
                <span className="calendar-dots">
                  {found.slice(0, 3).map((e) => (
                    <i key={e.id} className={categories[e.category].color} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        {day && (
          <button className="text-button" onClick={() => setDay(null)}>
            Vezi toată luna <X size={14} />
          </button>
        )}
        <div className="calendar-legend">
          <i />O zi cu atelier
        </div>
        <label className="field">
          Tipul întâlnirii
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="all">Grup și particular</option>
            <option value="group">Ateliere de grup</option>
            <option value="private">Ședințe particulare</option>
          </select>
        </label>
        <p className="muted">Toate orele sunt afișate pentru România.</p>
      </aside>
      <div>
        <div className="results-heading">
          <span>
            {day
              ? dateFormat(day + 'T12:00:00Z', { day: 'numeric', month: 'long' })
              : 'Atelierele acestei luni'}
          </span>
          <span>{visible.length} întâlniri</span>
        </div>
        <div className="calendar-events">
          {visible.map((e) => (
            <EventCard key={e.id} event={e} onClick={() => onSelect(e)} />
          ))}
        </div>
        {!visible.length && (
          <Empty title="O zi încă nescrisă.">
            Nu sunt ateliere pentru selecția ta. Încearcă altă zi, altă lună sau alt filtru.
          </Empty>
        )}
      </div>
    </div>
  );
}
function EventDetail({
  event,
  settings,
  onClose,
  onRefresh,
}: {
  event: AtelierEvent;
  settings?: Settings;
  onClose: () => void;
  onRefresh: () => Promise<Catalog | null>;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ reference: string; seats: number } | null>(null);
  const past = new Date(event.starts_at) <= new Date();
  const exhibition = event.category === 'exhibition';
  useEffect(() => {
    api<Photo[]>(`/events/${event.id}/photos`)
      .then(setPhotos)
      .catch((e) => setError(e.message));
  }, [event.id]);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await api<{ reference: string; seats: number }>(
        `/events/${event.id}/register`,
        json('POST', {
          name: form.get('name'),
          phone: form.get('phone'),
          seats: Number(form.get('seats')),
          consent: form.get('consent') === 'on',
        }),
      );
      setSuccess(result);
      await onRefresh();
    } catch (e) {
      setError((e as Error).message);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={event.title} onClose={onClose} wide>
      <div className="detail-cover">
        <img src={assetUrl(event.cover)} alt={event.title} />
        <span className={`tag ${categories[event.category].color}`}>
          {categories[event.category].label}
        </span>
      </div>
      <div className="detail-layout">
        <div className="detail-content">
          <span className="eyebrow orange-text">
            {past
              ? 'POVESTEA UNEI ÎNTÂLNIRI'
              : exhibition
                ? 'O ÎNTÂLNIRE CU ARTA'
                : 'FĂ TIMP PENTRU TINE'}
          </span>
          <h2>{event.title}</h2>
          <p className="description">{event.description}</p>
          <EventFacts event={event} />
          {photos.length > 0 ? (
            <div className="gallery">
              <h3>
                Amintiri de aici <span>{photos.length}/10 fotografii</span>
              </h3>
              <div className="photo-grid">
                {photos.map((p, index) => (
                  <button
                    key={p.id}
                    onClick={() => setPhotoIndex(index)}
                    aria-label={`Deschide fotografia ${index + 1}`}
                  >
                    <img
                      src={assetUrl(p.url)}
                      alt={`Fotografia ${index + 1} de la ${event.title}`}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            past && (
              <p className="muted">
                Fotografiile acestei întâlniri vor apărea aici după ce sunt adăugate de atelier.
              </p>
            )
          )}
        </div>
        <aside className="booking-panel">
          {success ? (
            <div className="success" role="status">
              <span className="success-icon">
                <Check />
              </span>
              <h3>Ai un loc în poveste!</h3>
              <p>
                Înscrierea pentru {success.seats} {success.seats === 1 ? 'loc' : 'locuri'} a fost
                salvată.
              </p>
              <span className="eyebrow">CODUL ÎNSCRIERII</span>
              <strong className="reference">{success.reference}</strong>
              <p>
                Păstrează acest cod. Pentru modificări, contactează atelierul
                {settings?.phone && (
                  <>
                    {' '}
                    la <a href={`tel:${settings.phone}`}>{settings.phone}</a>
                  </>
                )}
                .
              </p>
              <button className="button primary" onClick={() => downloadCalendar(event)}>
                <CalendarDays size={17} />
                Adaugă în calendar
              </button>
            </div>
          ) : past ? (
            <>
              <Camera size={30} />
              <h3>O amintire în culori.</h3>
              <p>Acest eveniment s-a încheiat. Ne vedem la următorul atelier!</p>
            </>
          ) : exhibition ? (
            <>
              <Palette size={30} />
              <h3>{event.price === 0 ? 'Intrare liberă' : money(event.price)}</h3>
              <p>Nu este nevoie de înscriere. Păstrează data și vino să descoperi lucrările.</p>
              <button className="button primary" onClick={() => downloadCalendar(event)}>
                Adaugă în calendar <CalendarDays size={17} />
              </button>
            </>
          ) : (
            <>
              <div className="booking-price">
                {money(event.price)}
                <small> / persoană</small>
              </div>
              <p className="availability">
                <i />
                {event.available} {event.available === 1 ? 'loc disponibil' : 'locuri disponibile'}
              </p>
              {isStaticPreview ? (
                <p className="preview-form-note">
                  Acesta este un atelier demonstrativ. Înscrierile vor fi disponibile la lansare;
                  momentan nu colectăm nume sau numere de telefon.
                </p>
              ) : event.available === 0 ? (
                <p>Acest atelier este complet. Alege o altă întâlnire din calendar.</p>
              ) : (
                <form onSubmit={submit}>
                  <h3>Păstrează-ți un loc</h3>
                  <p className="muted">
                    Fără cont, doar câteva detalii.
                    {event.category === 'kids'
                      ? ' Completează datele părintelui sau tutorelui.'
                      : ''}
                  </p>
                  <ContactFields />
                  <label className="field">
                    Număr de locuri
                    <select name="seats" defaultValue="1">
                      {Array.from({ length: Math.min(10, event.available) }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'loc' : 'locuri'} · {money(event.price * (i + 1))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Consent />
                  <ErrorMessage error={error} />
                  <button className="button primary full-width" disabled={busy}>
                    {busy ? 'Se salvează…' : 'Confirmă înscrierea'}
                    <ArrowRight size={17} />
                  </button>
                  <p className="fine-print">
                    Înscrierea rezervă locul. Plata se stabilește cu atelierul. Telefonul nu este
                    verificat prin SMS.
                  </p>
                </form>
              )}
            </>
          )}
        </aside>
      </div>
      {photoIndex !== null && (
        <div className="lightbox" role="region" aria-label="Fotografie mărită">
          <button
            className="icon-button lightbox-close"
            aria-label="Închide fotografia"
            onClick={() => setPhotoIndex(null)}
          >
            <X />
          </button>
          <button
            className="icon-button"
            aria-label="Fotografia precedentă"
            onClick={() => setPhotoIndex((photoIndex + photos.length - 1) % photos.length)}
          >
            <ChevronLeft />
          </button>
          <figure>
            <img
              src={assetUrl(photos[photoIndex].url)}
              alt={`Fotografia ${photoIndex + 1} de la ${event.title}`}
            />
            <figcaption>
              {photoIndex + 1} / {photos.length}
            </figcaption>
          </figure>
          <button
            className="icon-button"
            aria-label="Fotografia următoare"
            onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </Modal>
  );
}
export function ContactFields() {
  return (
    <>
      <label className="field">
        Numele tău
        <input
          name="name"
          placeholder="Prenume și nume"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
        />
      </label>
      <label className="field">
        Număr de telefon
        <input
          name="phone"
          type="tel"
          placeholder="07xx xxx xxx"
          required
          maxLength={24}
          autoComplete="tel"
        />
      </label>
    </>
  );
}
export function Consent() {
  return (
    <label className="checkbox-field">
      <input type="checkbox" name="consent" required />
      <span>
        Sunt de acord ca atelierul să folosească numele și telefonul meu pentru această solicitare
        și pentru a mă contacta în legătură cu ea.
      </span>
    </label>
  );
}
function ArtworkDetail({ artwork, onClose }: { artwork: Artwork; onClose: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api(
        `/artworks/${artwork.id}/inquire`,
        json('POST', {
          name: data.get('name'),
          phone: data.get('phone'),
          consent: data.get('consent') === 'on',
        }),
      );
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={artwork.title} onClose={onClose} wide>
      <div className="art-detail">
        <img className="art-detail-image" src={assetUrl(artwork.image)} alt={artwork.title} />
        <div>
          <span className="eyebrow orange-text">PENTRU SUFLET</span>
          <h2>{artwork.title}</h2>
          <p>{artwork.description}</p>
          <p className="muted">
            {artwork.medium} · {artwork.dimensions}
          </p>
          <h3>{money(artwork.price)}</h3>
          {success ? (
            <div className="success" role="status">
              <Check />
              <h3>Cererea ta a ajuns la atelier.</h3>
              <p>
                Te vom contacta la numărul indicat pentru detalii despre cumpărare și livrare.
                Cererea nu reprezintă o plată sau o rezervare automată.
              </p>
            </div>
          ) : isStaticPreview ? (
            <p className="preview-form-note">
              Aceasta este o lucrare demonstrativă. Cererile de cumpărare vor fi disponibile la
              lansare; momentan nu colectăm date de contact.
            </p>
          ) : artwork.status === 'available' ? (
            <form onSubmit={submit}>
              <h3>Îl vezi la tine acasă?</h3>
              <ContactFields />
              <Consent />
              <ErrorMessage error={error} />
              <button className="button primary full-width" disabled={busy}>
                {busy ? 'Se trimite…' : 'Sunt interesat(ă)'}
                <Heart size={17} />
              </button>
              <p className="fine-print">
                Trimite o cerere, fără plată online. Confirmăm disponibilitatea, plata și livrarea
                direct cu tine.
              </p>
            </form>
          ) : (
            <p className="tag neutral">
              {artwork.status === 'sold'
                ? 'Acest tablou și-a găsit casa.'
                : 'Acest tablou este rezervat.'}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
