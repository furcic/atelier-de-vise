# Atelier de vise

Aplicație în limba română, optimizată pentru telefon, realizată cu React + TypeScript, Node.js / Express și **MySQL**. Prima versiune este o **PWA**: funcționează în browser și poate fi instalată pe ecranul principal pe Android și iPhone, de pe un domeniu HTTPS. Nu este încă un pachet nativ publicat în App Store sau Google Play.

## Ce include

- **Vin și pictez:** evenimente individuale sau serii săptămânale de până la 26 de întâlniri; fiecare joi are înscrieri și galerie proprie.
- **Mic, dar desenez:** ateliere de grup și ședințe particulare; înscriere cu datele părintelui/tutorelui.
- **Mare mă distrez:** ședințe particulare pentru adulți.
- **Pentru suflet:** catalog de tablouri, imagini proprii, preț, dimensiuni, tehnică, disponibilitate și cereri de cumpărare.
- **Pentru ochi:** expoziții cu descriere, loc, dată și export în calendar.
- Calendar cu filtre pe activitate, zi și format; orele sunt afișate în **Europe/Bucharest**, iar în MySQL sunt stocate în UTC.
- Înscrieri fără cont, cu nume, telefon, acord și număr de locuri; cod de confirmare și export `.ics`.
- Arhivă de evenimente și maximum **10 fotografii per eveniment**, inclusiv pentru încărcări simultane. JPG/PNG/WebP, maximum 5 MB fiecare; redimensionare, eliminarea metadatelor și conversie WebP pe server. Imaginile încărcate sunt salvate în MySQL.
- Administrare protejată prin parolă: creare/editare/publicare/anulare evenimente, fotografii și coperți, lista înscrierilor, anulări, export CSV, tablouri, cereri și date publice.
- Protecție la suprarezervare prin tranzacții și blocarea rândului evenimentului; normalizarea telefoanelor; sesiuni HttpOnly; limitare de cereri și verificarea originii.

Numărul de telefon este o informație de contact, **nu autentificare** și nu este verificat prin SMS. Cumpărarea este o cerere de contact, fără plată online și fără rezervarea automată a tabloului. Modificările de program și anulările nu trimit notificări automate; administratorul contactează participanții.

## Previzualizare pe GitHub Pages

Workflow-ul `.github/workflows/pages.yml` publică automat o previzualizare la fiecare push pe `main`. În GitHub, sursa Pages este **GitHub Actions**. Adresa standard: `https://furcic.github.io/atelier-de-vise/`.

```sh
npm ci
npm run build:pages
npm run test:pages
npm run preview:pages
```

Previzualizarea locală este la `http://127.0.0.1:4174/atelier-de-vise/`. Build-ul este separat în `dist-pages/`, cu baza URL `/atelier-de-vise/`. Fișierul `.env.pages` conține doar indicatori publici de compilare; `.env` și bazele locale nu sunt versionate sau încărcate în Pages.

Catalogul demonstrativ din `src/demo.ts` este independent de MySQL și își generează datele în raport cu ziua vizitei. Nu exportă participanți, cereri, setări private sau credențiale. Înscrierile, cumpărăturile și administrarea sunt închise în acest mod. Calendarul, imaginile, arhiva și instalarea PWA pot fi previzualizate.

Pentru versiunea live cu baza de date, folosește `npm run build` și serverul Express, conform instrucțiunilor de mai jos. Acest build nu activează modul de previzualizare și păstrează API-ul MySQL.

## Pornire locală cu MySQL

Necesită Node.js 22 și MySQL 8.4+.

1. `npm ci`
2. Copiază `.env.example` în `.env` și configurează accesul MySQL. Creează o bază `atelier_de_vise`, cu `utf8mb4`, și un utilizator care are acces numai la această bază.
3. `npm run db:migrate`
4. Opțional, `npm run db:seed` pentru catalogul demonstrativ. Seed-ul se oprește dacă există deja evenimente și nu creează înscrieri fictive.
5. Configurează `ADMIN_EMAIL` și o parolă de cel puțin 12 caractere, apoi rulează `npm run admin:create`. Rularea din nou actualizează parola și invalidează sesiunile administratorului respectiv.
6. `npm run dev`

Aplicație: **http://localhost:5174**. Administrare: **http://localhost:5174/admin**. API: portul **3101**. Proxy-ul Vite trebuie să corespundă portului API dacă îl modifici.

În workspace-ul pregătit, `.env` conține configurația locală și contul de demonstrație. Fișierul este exclus din versionare. Instanța MySQL de dezvoltare este izolată în `.local/mysql-dev`, pe portul **3307**, și nu modifică serverul MySQL existent pe 3306. Pentru repornirea acelei instanțe pe acest Mac:

```sh
/opt/homebrew/opt/mysql/bin/mysqld --no-defaults \
  --datadir=/Users/marius/code/atelier_de_vise/.local/mysql-dev \
  --port=3307 --bind-address=127.0.0.1 \
  --socket=/Users/marius/code/atelier_de_vise/.local/mysql-dev.sock \
  --pid-file=/Users/marius/code/atelier_de_vise/.local/mysql-dev.pid \
  --mysqlx=OFF \
  --log-error=/Users/marius/code/atelier_de_vise/.local/mysql-dev.log
```

Această instanță este numai pentru dezvoltare; contul root a fost inițializat fără parolă și ascultă doar local. Pentru producție folosește un server configurat separat, parole proprii și un utilizator limitat la baza aplicației.

Pentru acces de pe un telefon din aceeași rețea, deschide `http://IP-UL-CALCULATORULUI:5174` și schimbă `APP_ORIGIN` la exact acea adresă înainte de a reporni API-ul. Instalarea PWA pe telefon necesită HTTPS. `APP_ORIGIN` acceptă intenționat o singură origine, fără `/` la sfârșit.

## Verificare

```sh
npm run build
npm test
npm run test:browser
```

Testele API folosesc exclusiv `atelier_de_vise_test` (sau `TEST_DB_NAME` care se termină în `_test`), o bază separată pe care trebuie să o creezi în prealabil. Acoperă înscrieri concurente, anulare și reînscriere, validare, acces admin, cereri pentru lucrări, serii de evenimente, încărcări concurente de fotografii și limita de 10. Șterg numai înregistrările proprii.

Testele Browser folosesc Chrome instalat local, aplicația pornită și catalogul demonstrativ nemodificat. Nu trimit înscrieri din UI; testele API verifică scrierile în baza separată. Capturile sunt în `.local/screenshots`.

## Publicare cu MySQL

`npm run build` produce `dist`. Cu `NODE_ENV=production`, serverul Express livrează și aplicația, și API-ul de pe aceeași origine. Pune un reverse proxy HTTPS în față și configurează `APP_ORIGIN=https://domeniul-tau.ro`. Cookie-urile de administrator sunt `Secure` în producție, deci autentificarea necesită HTTPS.

Nu pune `NODE_ENV=development` în `.env`: acel fișier este citit și de Vite la compilare și ar dezactiva modul de producție și înregistrarea PWA. Setează `NODE_ENV=production` numai în mediul procesului de producție, așa cum face configurația Docker inclusă.

Este inclusă o configurație Docker Compose cu MySQL 8.4. Configurează în `.env` parole reale, `MYSQL_ROOT_PASSWORD`, emailul administratorului și originea HTTPS, apoi:

```sh
docker compose build
docker compose up -d db
docker compose run --rm app node server/migrate.js
docker compose run --rm app node server/create-admin.js
docker compose up -d app
```

Proxy-ul HTTPS local trebuie să trimită cererile către `127.0.0.1:3101`. MySQL nu este expus pe un port public. Nu activa `trust proxy` global fără să configurezi exact proxy-ul; implicit, limitarea cererilor va vedea IP-ul proxy-ului. Pentru trafic public, configurează explicit proxy-ul de încredere și verifică păstrarea adreselor clienților. Containerizarea este pregătită, dar nu a fost rulată în această sesiune.

Păstrează backup-uri MySQL: acestea includ și fotografiile încărcate. Fișierele din `public/` fac parte din aplicație. Service worker-ul afișează o pagină offline și **nu salvează în cache API-ul, datele personale sau disponibilitatea locurilor**.

## Înainte de lansarea publică

Înlocuiește conținutul demonstrativ cu programul, fotografiile și prețurile reale. Completează identitatea artistului, adresa și telefonul în Setări; înlocuiește textul provizoriu despre date cu politica operatorului și perioada de păstrare. Configurează parolele de producție și backup-urile. Publicarea pe domeniu, conturile viitoare, SMS-urile, plățile și distribuția în magazinele de aplicații sunt etape separate.

## Structură

```text
src/             Interfața publică, administrare și stiluri responsive
server/          API, autentificare, validări, schema și scripturile MySQL
public/          Imagini, fonturi locale, iconuri și fișiere PWA
tests/           Integrare API/MySQL și verificări Browser
```

Fonturi: DM Sans și DM Serif Display, SIL Open Font License; licențele sunt în `public/fonts`. Fotografii demonstrative Unsplash, salvate local: [pensule](https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b), [culori](https://images.unsplash.com/photo-1513364776144-60967b0f800f), [pictură](https://images.unsplash.com/photo-1541961017774-22349e4a1262), [galerie](https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5). Nu sunt prezentate ca fotografii ale atelierului real.
