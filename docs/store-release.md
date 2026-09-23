# Publicare în Google Play și App Store

Aplicațiile din magazine sunt versiunea **live**: evenimentele, înscrierile și cererile pentru tablouri vin din API-ul de producție (Express + MySQL), prin HTTPS. Versiunea demo (`npm run mobile:sync:demo`) rămâne doar pentru teste și CI și nu se publică.

## 1. Înainte de orice build

1. **Serverul este online** pe HTTPS, cu `NODE_ENV=production`, `APP_ORIGIN=https://domeniul-tau.ro` și MySQL privat. `NATIVE_ORIGINS` are implicit originile aplicațiilor (`https://localhost` pentru Android, `capacitor://localhost` pentru iOS); nu îl schimba decât dacă știi de ce.
2. **Setările publice** din Admin → Setări: adresa, telefonul, Instagram și `demo` dezactivat (altfel apar notele „demonstrativ”).
3. **Textele legale:** completează câmpurile `operator` și `rules` din `src/Legal.tsx`. Paginile trebuie să fie publice la `https://domeniul-tau.ro/confidentialitate` și `/termeni`, fără marcaje „de completat”.
4. **Adresa API-ului pentru aplicații** în `.env.mobile.local` (neversionat):

   ```sh
   VITE_API_URL=https://domeniul-tau.ro
   ```

   `npm run build:mobile` refuză build-ul fără această adresă, iar scripturile `release:*` acceptă numai HTTPS public.

## 2. Android → Google Play

### Cheia de încărcare (upload key)

Aplicația folosește **Play App Signing**: Google păstrează cheia finală, noi semnăm doar încărcările.

- Keystore: `~/.atelier-de-vise/upload-keystore.jks` (în afara proiectului).
- Parola și alias-ul: `android/keystore.properties` (ignorat de Git, permisiuni 600).
- **Fă o copie de siguranță** a ambelor fișiere (manager de parole / stocare criptată). Dacă se pierd, cheia de încărcare se poate reseta din Play Console, dar durează câteva zile.

### Build

```sh
npm run release:android
```

Rezultat: `android/app/build/outputs/bundle/release/app-release.aab`, semnat. Pentru fiecare încărcare nouă mărește `versionCode` (și, dacă e cazul, `versionName`) în `android/app/build.gradle`.

### Play Console

1. Cont de dezvoltator Google Play (taxă unică 25 USD). **Conturile personale noi** trebuie să ruleze un **test închis cu cel puțin 12 testeri timp de 14 zile** înainte de a putea publica în producție; un cont de organizație (cu D-U-N-S) nu are această cerință.
2. Creează aplicația: nume „Atelier de vise”, limba implicită română, aplicație (nu joc), gratuită.
3. Încarcă AAB-ul în **Testare internă**, instalează-l pe un telefon și verifică: catalogul, fotografiile, o înscriere reală, cererea pentru un tablou, butonul Back, exportul în calendar.
4. Completează secțiunile de mai jos, apoi test închis → producție.

## 3. iPhone → App Store

1. Cont Apple Developer (99 USD/an). În Xcode: Settings → Accounts, adaugă contul.
2. Acceptă licența Xcode o singură dată: `sudo xcodebuild -license`.
3. În App Store Connect creează aplicația cu bundle ID `ro.atelierdevise.app`, SKU `atelier-de-vise`, limba română.
4. Build:

   ```sh
   npm run release:ios   # verifică adresa API, sincronizează și deschide Xcode
   ```

   În Xcode: target **App** → Signing & Capabilities → alege echipa (Team), „Automatically manage signing”. Apoi destinație **Any iOS Device (arm64)** → Product → **Archive** → Distribute App → App Store Connect → Upload.
5. Versiunea: `MARKETING_VERSION` 1.0.0; mărește `CURRENT_PROJECT_VERSION` (Build) la fiecare încărcare.
6. Testează prin **TestFlight** pe un iPhone real, apoi trimite la review.

Deja configurat în proiect: numai iPhone (rulează și pe iPad în modul compatibil, deci nu sunt necesare capturi iPad), `ITSAppUsesNonExemptEncryption = NO` (doar HTTPS standard), manifest de confidențialitate cu nume + telefon pentru funcționalitatea aplicației, fără tracking.

**Pentru review:** aplicația nu are conturi, deci nu sunt necesare date de autentificare. În notele pentru review scrie că înscrierea se face fără cont, cu nume și telefon, și că pentru test se poate folosi orice eveniment viitor (apoi anulează înscrierea din Admin).

## 4. Texte pentru magazine

| Câmp | Text |
|---|---|
| Nume (ambele) | Atelier de vise |
| Subtitlu App Store (≤ 30) | Seri de pictură și ateliere |
| Descriere scurtă Play (≤ 80) | Seri de pictură, ateliere pentru copii și adulți, tablouri. Rezervă-ți locul. |
| Cuvinte cheie App Store (≤ 100) | pictura,vin si pictez,atelier,arta,copii,desen,tablouri,expozitie,creativitate,paint and sip |
| Categorie | Stil de viață (Lifestyle); secundar: Divertisment |
| URL confidențialitate | https://domeniul-tau.ro/confidentialitate |
| URL suport / marketing | https://domeniul-tau.ro |

**Descriere completă:**

> Fă loc bucuriei. Atelier de vise este locul în care iei o pensulă, un strop de curaj și faci ceva frumos, fără să ai nevoie de experiență.
>
> • Vin și pictez — în fiecare joi seara pictăm pas cu pas, povestim și ne bucurăm de un pahar de vin. Materialele sunt incluse, iar tabloul pleacă acasă cu tine. (18+)
> • Mic, dar desenez — ateliere de grup și ședințe particulare pentru copii, în ritmul fiecăruia.
> • Mare mă distrez — ședințe particulare pentru adulți, doar pentru tine și creativitatea ta.
> • Pentru suflet — tablouri originale; trimite o cerere și te contactăm.
> • Pentru ochi — expoziții și întâlniri cu arta.
>
> În aplicație vezi calendarul atelierelor, locurile disponibile și amintirile fiecărei seri. Te înscrii fără cont, doar cu numele și numărul de telefon, și îți salvezi data direct în calendarul telefonului.
>
> Nu trebuie să știi să pictezi. Doar să ai chef să încerci.

**Imagini** (în `store/`):

- `screenshots/ios/` — 6 capturi 1320 × 2868 (iPhone 6,9"; App Store le scalează pentru celelalte mărimi).
- `screenshots/android/` — 6 capturi 1080 × 1920 pentru telefon.
- `feature-graphic.png` — 1024 × 500 (Play), `icon-512.png` — 512 × 512 (Play).

Capturile sunt făcute din aplicația live pe datele de test; refă-le după ce în producție există evenimentele și adresa reale (vezi „Capturi” mai jos).

## 5. Formulare de confidențialitate

Răspunsuri conforme cu ce face aplicația acum. Dacă adaugi analiză, notificări sau conturi, actualizează-le.

### Google Play — Data safety

- Colectează sau distribuie date? **Da, colectează.** Nu distribuie (partajează) date cu terți.
- Criptate în tranzit: **Da** (HTTPS).
- Utilizatorii pot cere ștergerea: **Da** — prin contact (vezi politica). Nu există conturi, deci nu se aplică cerința de ștergere a contului.
- Tipuri de date:
  - **Informații personale → Nume**: colectat, opțional (doar la înscriere/cerere), scop: *Funcționalitatea aplicației*.
  - **Informații personale → Număr de telefon**: colectat, opțional, scop: *Funcționalitatea aplicației*.
- Nu: locație, identificatori de dispozitiv, analiză, publicitate, rapoarte de erori, fotografii ale utilizatorului.

### Google Play — alte declarații

- **Public țintă:** 18+ (aplicația este folosită de adulți și de părinți; copiii nu o folosesc). Nu înscrie aplicația în „Designed for Families”.
- **Clasificare conținut (IARC):** răspunde „Da” la referiri la alcool (serile „Vin și pictez”), „Nu” la restul.
- **Reclame:** Nu. **Acces aplicație:** toate funcțiile sunt disponibile fără autentificare.

### App Store — App Privacy

- Date colectate: **Contact Info → Name** și **Contact Info → Phone Number**.
- Pentru fiecare: legate de identitatea utilizatorului (*Linked to the user*): **Da**; folosite pentru tracking: **Nu**; scop: **App Functionality**.
- Age rating: „Alcohol, Tobacco, or Drug Use or References” → **Infrequent/Mild**; restul „None”.

## Capturi

Capturile se generează din build-ul live, cu serverul local (`npm run dev` sau o instanță separată pe alt port cu `NATIVE_ORIGINS` = originea previzualizării) și Playwright, la 440 × 956 @3x (iOS) și 360 × 640 @3x (Android). Notele „demonstrativ” sunt ascunse numai în browserul de captură; baza de date nu se modifică.
