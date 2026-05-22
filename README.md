# LA SAMARIA

**LA SAMARIA** es una plataforma web moderna para un restaurante de comidas rápidas con sabor costeño. Diseñada con un enfoque en la estética visual, la interactividad y la experiencia del usuario.

## Características
- **Diseño Premium:** Interfaz oscura (Dark Mode) con efectos de glassmorphism.
- **Menú Interactivo:** 42 productos distribuidos en 7 categorías.
- **Filtrado Dinámico:** Navegación fluida entre categorías y búsqueda en vivo.
- **Carrito de Compras:** Sistema funcional con persistencia en localStorage.
- **Pedidos por WhatsApp:** Integración directa con WhatsApp Business.
- **Panel Admin:** Gestión de pedidos en tiempo real con Firestore.
- **Responsive Design:** Totalmente optimizado para dispositivos móviles y escritorio.

## Tecnologías
- **HTML5:** Estructura semántica con landmarks de accesibilidad.
- **CSS3:** Flexbox, Grid, Animaciones, Variables y metodología BEM.
- **JavaScript (Vanilla):** Gestión del estado del carrito, Firebase y manipulación del DOM.
- **Firebase (v10 compat):** Firestore para persistencia de pedidos y contactos.

## Instalación y Uso
No requiere dependencias externas. Simplemente descarga o clona el repositorio y abre `index.html` en tu navegador.

```bash
git clone https://github.com/[TU-USUARIO]/la-samaria.git
cd la-samaria
# Abre index.html con Live Server o directamente en el navegador
```

## Estructura del Proyecto
```
la-samaria/
├── index.html          # Sitio principal (cliente)
├── admin.html          # Panel de administración
├── assets/
│   ├── css/
│   │   ├── style.css   # Estilos del sitio principal (BEM)
│   │   └── admin.css   # Estilos del panel admin (BEM)
│   ├── js/
│   │   ├── script.js   # Lógica del cliente
│   │   └── admin.js    # Lógica del panel admin
│   └── img/            # Imágenes del sitio
└── AGENTS.md           # Documentación técnica del proyecto
```

## Créditos
Diseñado para LA SAMARIA.
