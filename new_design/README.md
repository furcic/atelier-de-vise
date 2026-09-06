# Atelier de vise — tema pastel

Nu pot scrie direct în folderul tău, dar aplicarea durează câteva minute:

1. Copiază `pastel-theme.css` în `src/` și adaugă în `src/main.tsx`, imediat după `import './styles.css'`:
   ```ts
   import './pastel-theme.css';
   ```
2. Copiază `portret.png` în `public/images/` (fundalul estompat + imaginea din hero).
   În `App.tsx` schimbă `src="/images/workshop.jpg"` (hero-main-image) în `src="/images/portret.png"`.
3. Logo: copiază `logo.svg` în `public/`. În `components.tsx` înlocuiește conținutul funcției `Flower` cu:
   ```tsx
   export function Flower({ className = '' }: { className?: string }) {
     return <img className={`flower ${className}`} src="/logo.svg" alt="" aria-hidden="true" />;
   }
   ```
4. Cardurile de categorii (App.tsx, în `category-grid`): înlocuiește conținutul butonului cu
   ```tsx
   <span className="category-tag">{item.short}</span>
   <span className="category-body">
     <span className="category-kicker">{kicker[key]}<ArrowUpRight className="category-arrow" size={17} /></span>
     <h3>{item.label}</h3>
   </span>
   ```
   și adaugă deasupra componentei:
   ```ts
   const kicker = { wine: 'joi seara', kids: 'pentru copii', adults: 'pentru adulți', art: 'tablouri', exhibition: 'expoziții' };
   ```
   Opțional, în `lib.ts` scurtează `short` la: 'o seară specială', 'imaginație fără limite', 'timp pentru tine', 'artă de văzut'.

Fundalul estompat este setat la intensitatea „strong” (opacity .24); scade la .14 pentru varianta „soft”.

Culorile principale: fundal #f8f2eb · text #2e2a27 · accent teracotă #c0483a · argilă #b06a5c · caramel #9a6a3c.
