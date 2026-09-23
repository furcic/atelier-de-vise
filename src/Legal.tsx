import type { ReactNode } from 'react';
import type { Catalog } from './types';

export type LegalKind = 'privacy' | 'terms';
export const legalPaths: Record<LegalKind, string> = {
  privacy: 'confidentialitate',
  terms: 'termeni',
};
export const legalTitles: Record<LegalKind, string> = {
  privacy: 'Politica de confidențialitate',
  terms: 'Termeni și condiții',
};
const updatedAt = '23 septembrie 2026';

/**
 * Operator details that are not stored in settings. Fill these in before publishing
 * the apps; empty values are shown as highlighted placeholders on both pages.
 */
const operator = {
  legalName: 'Asociația Atelier de vise',
  registration: 'CIF 50488901, nr. 2197/A/2024 în Registrul asociațiilor și fundațiilor',
  seat: 'Str. Aluminei nr. 70/A, bl. D4, ap. 73, Oradea, jud. Bihor',
  email: 'mireladobrescu79@gmail.com',
  hosting: 'Hetzner Online GmbH, în Germania',
};
// Retention and booking rules the operator must decide; shown as placeholders until set.
const rules = {
  bookingRetention: '12 luni de la data evenimentului',
  inquiryRetention: '6 luni de la ultima discuție',
  payment: 'numerar la atelier sau transfer bancar în contul asociației, în avans, la alegerea ta',
  cancelNotice: '48 de ore',
  refund: 'În acest caz îți restituim integral suma achitată sau îți mutăm locul la altă dată',
  hostingLogs:
    'Serverul păstrează jurnale de acces (adresa IP, pagina accesată, data și ora) timp de 14 zile, pentru securitate și depanare, după care sunt șterse automat',
  dataLocation: 'Serverul se află în Germania.',
  kidsPickup: 'Un părinte sau tutore rămâne la atelier pe toată durata activității',
};

function Fill({ value, hint }: { value?: string; hint: string }) {
  return value ? <>{value}</> : <mark className="legal-todo">[de completat: {hint}]</mark>;
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function LegalContent({
  kind,
  settings,
  onOpen,
}: {
  kind: LegalKind;
  settings?: Catalog['settings'];
  onOpen: (kind: LegalKind) => void;
}) {
  const incomplete = [...Object.values(operator), ...Object.values(rules)].some((v) => !v);
  const name = <Fill value={operator.legalName} hint="denumirea operatorului" />;
  const contact = (
    <ul>
      <li>
        Operator: {name}, <Fill value={operator.registration} hint="CIF și nr. de înregistrare" />
      </li>
      <li>Sediu: {operator.seat}</li>
      {settings?.address && !settings.demo && <li>Adresa atelierului: {settings.address}</li>}
      <li>
        E-mail: <Fill value={operator.email} hint="adresa de e-mail" />
      </li>
      {settings?.phone && <li>Telefon: {settings.phone}</li>}
    </ul>
  );
  const link = (target: LegalKind) => (
    <a
      href={`#${target}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen(target);
      }}
    >
      {legalTitles[target]}
    </a>
  );
  return (
    <article className="legal-content">
      <p className="legal-updated">Ultima actualizare: {updatedAt}</p>
      {incomplete && (
        <p className="demo-note">
          Text în curs de finalizare. Câmpurile marcate trebuie completate de atelier, iar textul
          final verificat de un specialist, înainte de lansare.
        </p>
      )}
      {kind === 'privacy' ? (
        <>
          <p className="legal-lead">
            Atelier de vise colectează cât mai puține date: doar ce ne trebuie ca să îți păstrăm
            locul la un atelier sau să îți răspundem despre un tablou. Nu ai nevoie de cont, nu
            folosim publicitate și nu îți urmărim activitatea.
          </p>
          <Section title="1. Cine se ocupă de datele tale">
            <p>Operatorul datelor, în sensul Regulamentului (UE) 2016/679 (GDPR), este:</p>
            {contact}
          </Section>
          <Section title="2. Ce date colectăm">
            <p>
              <strong>Când te înscrii la un eveniment:</strong> numele, numărul de telefon,
              evenimentul ales, numărul de locuri, codul de confirmare și momentul înscrierii.
            </p>
            <p>
              <strong>Când trimiți o cerere pentru un tablou:</strong> numele, numărul de telefon,
              tabloul ales și momentul cererii.
            </p>
            <p>
              <strong>Pentru atelierele copiilor</strong>, înscrierea este făcută de părinte sau
              tutore, cu propriile date de contact. Nu cerem numele sau alte date despre copil.
            </p>
            <p>
              <strong>Date tehnice:</strong> pentru a proteja formularele de abuz, adresa IP este
              folosită temporar, în memoria serverului, pentru limitarea numărului de cereri (cel
              mult 15 minute), fără a fi salvată în baza de date.{' '}
              <Fill
                value={rules.hostingLogs}
                hint="dacă furnizorul de hosting păstrează jurnale de acces și cât timp"
              />
              .
            </p>
            <p>
              <strong>Fotografii de la evenimente:</strong> atelierul poate publica în secțiunea
              „Amintiri” fotografii cu lucrările și atmosfera serilor. La încărcare, datele ascunse
              ale fotografiilor (de exemplu locația GPS) sunt eliminate automat.
            </p>
          </Section>
          <Section title="3. De ce le folosim și pe ce temei">
            <ul>
              <li>
                <strong>Gestionarea înscrierii sau a cererii</strong> și contactarea ta în legătură
                cu ea (confirmări, modificări de program, anulări) — pentru încheierea și executarea
                contractului, art. 6 alin. (1) lit. b) GDPR.
              </li>
              <li>
                <strong>Evidențe contabile și fiscale</strong>, dacă plătești un atelier sau un
                tablou — obligație legală, art. 6 alin. (1) lit. c) GDPR.
              </li>
              <li>
                <strong>Securitatea serviciului</strong> (limitarea cererilor, protejarea zonei de
                administrare) — interes legitim, art. 6 alin. (1) lit. f) GDPR.
              </li>
              <li>
                <strong>Fotografii de la evenimente</strong> — interesul legitim al atelierului de
                a-și prezenta activitatea. Dacă nu vrei să apari, spune-ne la eveniment sau ulterior
                și eliminăm fotografia.
              </li>
            </ul>
            <p>
              Nu folosim datele pentru marketing, nu le vindem și nu creăm profiluri. Nu luăm
              decizii automate care să te afecteze.
            </p>
          </Section>
          <Section title="4. Cine are acces la date">
            <p>
              Datele sunt văzute doar de persoanele care administrează atelierul. Serverul și baza
              de date sunt găzduite de{' '}
              <Fill value={operator.hosting} hint="furnizorul de hosting și țara" />, care
              acționează ca persoană împuternicită și nu folosește datele în scop propriu. Traficul
              către site și aplicații trece prin rețeaua Cloudflare (Cloudflare, Inc.), care
              protejează serverul și asigură conexiunea HTTPS; Cloudflare poate prelucra adresa IP
              și în afara Spațiului Economic European, pe baza clauzelor contractuale standard ale
              Comisiei Europene. Putem divulga date autorităților doar când legea ne obligă.
            </p>
            <p>
              Datele sunt păstrate în Spațiul Economic European.{' '}
              <Fill value={rules.dataLocation} hint="confirmă țara serverului" />
            </p>
          </Section>
          <Section title="5. Cât timp le păstrăm">
            <ul>
              <li>
                Înscrieri: <Fill value={rules.bookingRetention} hint="perioada de păstrare" />.
              </li>
              <li>
                Cereri pentru tablouri:{' '}
                <Fill value={rules.inquiryRetention} hint="perioada de păstrare" />.
              </li>
              <li>Documentele contabile: cât prevede legislația financiar-contabilă.</li>
              <li>Sesiunea de administrare: cel mult 12 ore.</li>
            </ul>
          </Section>
          <Section title="6. Cookie-uri și aplicațiile mobile">
            <p>
              Site-ul nu folosește cookie-uri pentru vizitatori. Singurul cookie este cel de sesiune
              al zonei de administrare, strict necesar autentificării. Nu folosim module de analiză,
              publicitate sau urmărire, nici pe site, nici în aplicațiile pentru iPhone și Android.
            </p>
            <p>
              Aplicațiile nu cer acces la locație, contacte, cameră sau galerie foto. Când salvezi
              un eveniment în calendar, fișierul este creat pe telefonul tău și este trimis doar
              unde alegi tu.
            </p>
          </Section>
          <Section title="7. Drepturile tale">
            <p>Ai dreptul să ceri, gratuit:</p>
            <ul>
              <li>acces la datele tale și o copie a lor;</li>
              <li>corectarea datelor greșite;</li>
              <li>ștergerea datelor, când nu mai avem un motiv legal să le păstrăm;</li>
              <li>restricționarea prelucrării sau portabilitatea datelor;</li>
              <li>opoziția la prelucrările bazate pe interes legitim (de exemplu fotografiile).</li>
            </ul>
            <p>
              Scrie-ne sau sună-ne folosind datele de la punctul 1; îți răspundem în cel mult o
              lună. Poți depune și o plângere la Autoritatea Națională de Supraveghere a Prelucrării
              Datelor cu Caracter Personal (ANSPDCP), www.dataprotection.ro.
            </p>
          </Section>
          <Section title="8. Cum protejăm datele">
            <p>
              Comunicarea cu serverul este criptată (HTTPS). Parolele de administrare sunt salvate
              doar sub formă criptată, sesiunile folosesc cookie-uri HttpOnly, iar accesul la datele
              participanților este limitat la administratori.
            </p>
          </Section>
          <Section title="9. Modificări">
            <p>
              Dacă schimbăm această politică, publicăm aici versiunea nouă și data actualizării.
              Vezi și {link('terms')}.
            </p>
          </Section>
        </>
      ) : (
        <>
          <p className="legal-lead">
            Acești termeni se aplică înscrierilor la ateliere și evenimente și cererilor pentru
            tablouri făcute pe site-ul și în aplicațiile Atelier de vise. Folosind serviciul, ești
            de acord cu ei.
          </p>
          <Section title="1. Cine suntem">{contact}</Section>
          <Section title="2. Ce oferim">
            <ul>
              <li>
                <strong>Vin și pictez</strong> — seri de pictură în grup, pentru adulți.
              </li>
              <li>
                <strong>Mic, dar desenez</strong> — ateliere de grup și ședințe particulare pentru
                copii.
              </li>
              <li>
                <strong>Mare, mă distrez</strong> — ședințe particulare pentru adulți.
              </li>
              <li>
                <strong>Pentru ochi</strong> — expoziții.
              </li>
              <li>
                <strong>Pentru suflet</strong> — tablouri originale disponibile la cerere.
              </li>
            </ul>
            <p>
              Descrierea, data, ora, locul și prețul fiecărui eveniment sunt afișate pe pagina lui.
            </p>
          </Section>
          <Section title="3. Înscrierea">
            <p>
              Te poți înscrie fără cont, cu numele și numărul de telefon. Locul este rezervat după
              ce primești codul de confirmare, în limita locurilor disponibile. Te rugăm să
              folosești date reale: numărul de telefon este singura cale prin care te putem anunța
              de modificări.
            </p>
            <p>
              Numărul de telefon nu este verificat prin SMS. O înscriere făcută cu datele altei
              persoane, fără acordul ei, poate fi anulată.
            </p>
          </Section>
          <Section title="4. Prețul și plata">
            <p>
              Prețurile sunt în lei și includ materialele, dacă nu se precizează altfel. Plata nu se
              face în aplicație. Modalitatea de plată:{' '}
              <Fill value={rules.payment} hint="cum și când se plătește" />.
            </p>
          </Section>
          <Section title="5. Anulări și modificări">
            <p>
              <strong>Dacă nu mai poți ajunge</strong>, anunță atelierul cu cel puțin{' '}
              <Fill value={rules.cancelNotice} hint="termenul de anunțare" /> înainte, ca să putem
              oferi locul altcuiva.{' '}
              <Fill value={rules.refund} hint="ce se întâmplă cu suma plătită" />.
            </p>
            <p>
              <strong>Dacă atelierul modifică sau anulează un eveniment</strong>, te contactăm la
              numărul de telefon lăsat la înscriere. Aplicația nu trimite notificări automate. Dacă
              ai plătit deja și nu îți convine noua dată, îți restituim integral suma.
            </p>
            <p>
              Participarea la evenimente de agrement programate la o dată fixă nu intră sub dreptul
              de retragere de 14 zile, conform art. 16 lit. l) din OUG nr. 34/2014.
            </p>
          </Section>
          <Section title="6. Vin și pictez">
            <p>
              Serile „Vin și pictez” sunt doar pentru persoane de cel puțin 18 ani; putem cere un
              act de identitate. Sunt disponibile și băuturi fără alcool. Te rugăm să consumi
              responsabil; atelierul poate refuza servirea alcoolului sau participarea unei persoane
              care pune în pericol siguranța celorlalți.
            </p>
          </Section>
          <Section title="7. Atelierele pentru copii">
            <p>
              Înscrierea se face doar de părinte sau tutore, care răspunde de exactitatea datelor și
              de informarea atelierului despre orice nevoie specială a copilului (alergii, nevoi
              medicale).{' '}
              <Fill
                value={rules.kidsPickup}
                hint="dacă părintele rămâne la atelier și cine preia copilul la final"
              />
              .
            </p>
          </Section>
          <Section title="8. La atelier">
            <p>
              Lucrăm cu vopsele care pot păta; îți recomandăm haine comode. Lucrarea pe care o
              pictezi este a ta și o iei acasă. Te rugăm să respecți spațiul, materialele și
              ceilalți participanți.
            </p>
            <p>
              Atelierul poate fotografia lucrările și atmosfera pentru secțiunea „Amintiri”. Dacă nu
              vrei să apari în fotografii, spune-ne. Detalii în {link('privacy')}.
            </p>
          </Section>
          <Section title="9. Tablourile">
            <p>
              O cerere pentru un tablou este o solicitare de contact, nu o comandă: nu implică plată
              și nu rezervă automat lucrarea. Te contactăm pentru a confirma disponibilitatea,
              prețul, plata și livrarea sau ridicarea. Vânzarea are loc doar după confirmarea
              ambelor părți.
            </p>
            <p>
              Culorile din fotografii pot diferi ușor de lucrarea reală, în funcție de ecran. Dacă
              tabloul este cumpărat la distanță, ai dreptul de retragere în 14 zile de la primire,
              conform OUG nr. 34/2014. Drepturile de autor asupra lucrărilor rămân ale artistului.
            </p>
          </Section>
          <Section title="10. Conținutul site-ului">
            <p>
              Textele, fotografiile și imaginile lucrărilor aparțin atelierului sau autorilor lor și
              nu pot fi copiate sau folosite comercial fără acord.
            </p>
          </Section>
          <Section title="11. Răspundere">
            <p>
              Ne străduim ca informațiile din aplicație să fie corecte și actualizate, dar programul
              se poate schimba. Nu răspundem pentru pagube cauzate de folosirea necorespunzătoare a
              materialelor sau de nerespectarea indicațiilor de la atelier, în limitele permise de
              lege. Nimic din acești termeni nu îți limitează drepturile de consumator.
            </p>
          </Section>
          <Section title="12. Reclamații și legea aplicabilă">
            <p>
              Pentru orice nemulțumire, contactează-ne mai întâi folosind datele de la punctul 1;
              îți răspundem în cel mult 30 de zile. Te poți adresa și Autorității Naționale pentru
              Protecția Consumatorilor (ANPC), anpc.ro, inclusiv pentru soluționarea alternativă a
              litigiilor. Se aplică legea română.
            </p>
          </Section>
          <Section title="13. Modificări">
            <p>
              Putem actualiza acești termeni; versiunea nouă se aplică înscrierilor făcute după
              publicarea ei.
            </p>
          </Section>
        </>
      )}
    </article>
  );
}
