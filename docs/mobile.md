# Android și iPhone

Ambele aplicații folosesc interfața React existentă, împachetată local cu Capacitor 8. Nu sunt o rescriere în Swift/Kotlin și nu încarcă site-ul GitHub Pages într-o fereastră: HTML-ul, fotografiile și fonturile sunt incluse în fiecare aplicație; datele vin din API (varianta live) sau din catalogul demo inclus.

## Două variante

- **Live** (`--mode mobile`, folosită de `npm run mobile:*` și `release:*`): evenimentele, fotografiile încărcate, înscrierile și cererile pentru tablouri vin din API-ul de producție prin HTTPS. Necesită `VITE_API_URL` în `.env.mobile.local`, de ex. `VITE_API_URL=https://atelierdevise.ro`. Fără conturi și fără cookie-uri; zona Admin rămâne numai pe web.
- **Demo** (`--mode mobile-demo`, `npm run mobile:sync:demo`): catalogul demonstrativ inclus, fără internet și fără colectare de date. Folosită de testele Playwright și de workflow-ul CI. Nu se publică în magazine.

Ambele includ: navigare adaptată telefonului, spațiere pentru notch și zona de gesturi, Android Back (fotografie → fereastra de deasupra → meniu → Acasă → minimizare), export `.ics` prin meniul nativ de distribuire, iconuri și ecrane de pornire din `public/logo.svg`, paginile Confidențialitate și Termeni. Nu este înregistrat service worker-ul web.

Serverul acceptă originile aplicațiilor (`https://localhost` Android, `capacitor://localhost` iOS; variabila `NATIVE_ORIGINS`) numai pe rutele publice ale API-ului, fără cookie-uri. Rutele `/api/admin` rămân accesibile doar de pe originea site-ului.

Publicarea în magazine: [docs/store-release.md](store-release.md).

## Pornire

Necesită Node.js 22+, Xcode 26+ pentru iOS și Android SDK 36 cu JDK 21 pentru Android. Pentru lucrul din IDE, folosește Android Studio 2025.2.1+; APK-ul se poate compila și numai cu instrumentele command-line. [Cerințe Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup).

```sh
npm ci
# o singură dată: adresa API-ului în .env.mobile.local (VITE_API_URL=https://...)
npm run mobile:ios        # build live + sync + deschide Xcode
npm run mobile:android    # build live + sync + deschide Android Studio
npm run mobile:sync:demo  # varianta demo, fără server
```

În Xcode alege schema **App** și un simulator iPhone, apoi Run. Pentru un iPhone fizic, alege echipa Apple în Signing & Capabilities și conectează telefonul. În Android Studio așteaptă sincronizarea Gradle și alege un emulator sau un telefon cu USB debugging.

Alternativ, cu emulatorul/telefonul deja configurat:

```sh
npm run mobile:run:ios
npm run mobile:run:android
```

După modificări în React, rulează `npm run mobile:sync` înainte de a reconstrui aplicația din IDE. După schimbarea logo-ului rulează `npm run mobile:assets`. Proiectele `ios/` și `android/` sunt surse versionate, nu directoare de șters/regenerat; conțin personalizările native și manifestul de confidențialitate.

Identificator confirmat: **ro.atelierdevise.app** (definitiv după prima încărcare în magazine). Pentru schimbare, înainte de prima încărcare, trebuie actualizate `capacitor.config.ts`, bundle identifier în Xcode, applicationId/namespace în Gradle, numele pachetului Java și URL scheme din resursele Android. Versiunile se modifică separat în Xcode și `android/app/build.gradle`.

## Testare și build-uri

```sh
npm run test:mobile      # construiește varianta demo și rulează testele
npm run preview:mobile   # localhost:4175, previzualizare UI fără bridge nativ
npm run mobile:sync
```

Testele Playwright verifică UI-ul compilat al variantei demo, toate secțiunile, lipsa API-ului/service worker-ului, prioritățile Back, spațierea safe-area și fallback-ul web pentru ICS. Nu înlocuiesc testarea pluginurilor pe telefoane.

Build iOS Simulator, fără certificate:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath .local/ios-build CODE_SIGNING_ALLOWED=NO build
```

Build APK Android, după configurarea SDK-ului în Android Studio sau `ANDROID_HOME`:

```sh
cd android
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. App simulator: `.local/ios-build/Build/Products/Debug-iphonesimulator/App.app`. App-ul simulator nu poate fi instalat pe un iPhone fizic.

### SDK instalat pe acest Mac

SDK-ul este în `/Users/marius/Library/Android/sdk`, cu platforma Android 36, build-tools 35.0.0 și 36.0.0, platform-tools (`adb`) și command-line tools. `android/local.properties` indică această locație și este exclus din Git. Licența standard necesară pachetelor SDK a fost acceptată la instalare.

JDK 21 este instalat prin Homebrew (`openjdk@21`) și înregistrat pentru utilizator în `Library/Java/JavaVirtualMachines`, astfel încât Gradle îl detectează automat. Java 23 existent nu a fost înlocuit.

Android Studio este instalat în `/Applications/Android Studio.app`. Emulatorul are un dispozitiv **Atelier_Pixel_9_API_36**: Pixel 9, Android 16 / API 36, imagine Google APIs ARM64. Poate fi pornit din Device Manager în Android Studio sau din terminal:

```sh
/Users/marius/Library/Android/sdk/emulator/emulator -avd Atelier_Pixel_9_API_36
```

Pentru proiect, rulează `npm run mobile:android`, apoi selectează acest dispozitiv și Run în Android Studio. Dacă prima pornire a IDE-ului afișează asistentul de configurare, folosește SDK-ul existent din `/Users/marius/Library/Android/sdk`. Nu este necesar un cont Google pentru acest demo.

Pentru a folosi comenzile SDK direct într-un terminal, opțional:

```sh
export ANDROID_HOME=/Users/marius/Library/Android/sdk
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Aceste exporturi afectează numai terminalul curent; configurarea globală a shell-ului nu a fost modificată.

Workflow-ul manual **Mobile demo builds** (`.github/workflows/mobile.yml`), odată împins pe GitHub, produce un APK debug și o arhivă iOS Simulator. Nu publică nimic în magazine și nu folosește secrete de semnare. Artefactele sunt păstrate 14 zile; într-un repository public sunt accesibile publicului. Nu include date sau credențiale reale.

## Conectarea la server

Telefonul nu se conectează direct la MySQL: **aplicație → API HTTPS → MySQL**. Parolele bazei de date rămân exclusiv pe server. Pentru un test local al variantei live în browser, pornește API-ul cu `NATIVE_ORIGINS` = originea previzualizării și construiește cu `VITE_API_URL=http://127.0.0.1:<port>` (HTTP este acceptat numai pentru localhost și niciodată de scripturile `release:*`).

Build-urile web (`npm run build`) și GitHub Pages (`npm run build:pages`) rămân separate de `dist-mobile/`.
