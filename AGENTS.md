# AGENTS.md — LA SAMARIA

## Stack
Vanilla HTML/CSS/JS — no bundler, no package.json, no npm, no build step.

## Run the site
Open `index.html` in a browser. VSCode Live Server on port 5501 (see `.vscode/settings.json`).

## Firebase (CDN, v10 compat)
- **Project**: `streetfood-bga` — config is hardcoded in `index.html` and `admin.html`.
- **Collections**: `pedidos` (orders), `contactos` (contact form submissions), `contadores` (order numbering).
- **No `.env` or secrets file** — credentials are inline in source (this is a public frontend-only Firebase project using Firestore security rules for access control).

## Order flow
1. User adds items to cart (in-memory array).
2. Clicks "Finalizar Pedido por WhatsApp" → opens `https://wa.me/573022942381?...` with order summary.
3. Order is also saved to Firestore `pedidos` collection as a backup.
4. Cart & user fields (name, phone, address, delivery type) persisted in localStorage with prefix `streetfood_`.
5. Order number is generated with a Firestore transaction in `contadores/pedidos.ultimo` to avoid duplicates.

## Admin panel
`admin.html` — protected with Firebase Auth; unauthenticated users are redirected to `login.html`. Real-time Firestore listener on `pedidos` ordered by `creado` desc. Status workflow: `nuevo → aceptado → listo → entregado`, with `cancelado` for null/invalid orders. Stats show sales for the selected period using only delivered orders.

## Key files
- `index.html` — customer-facing site (menu, cart, contact form, confirmation modal)
- `admin.html` — order management panel (inline everything)
- `login.html` — admin login page using Firebase Auth email/password
- `assets/js/script.js` — all client logic (products array, cart, Firebase, WhatsApp integration)
- `assets/css/style.css` — dark mode + glassmorphism design (624 lines)

## Firestore document schemas

### pedidos
```
numero: number, cliente: string, telefono: string, direccion: string,
tipo: "domicilio"|"recoger", pago: string, notas: string,
items: [{name, price, quantity, subtotal}], total: number,
estado: "nuevo"|"aceptado"|"listo"|"entregado"|"cancelado", creado: ISO string,
motivoCancelacion?: string, canceladoEn?: ISO string
```

### contactos
```
nombre: string, email: string, asunto: string, mensaje: string, creado: ISO string
```

## Products data
42 products across 7 categories: hamburguesas, perros, pizzas, salchipapas, bebidas, combos. Defined as a static array in `assets/js/script.js:1-49`.
