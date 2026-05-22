# Buenas Prácticas para HTML y CSS

## HTML

1. **Usar HTML semántico**
   Emplea etiquetas como `<header>`, `<nav>`, `<main>`, `<article>`, `<section>` y `<footer>` en lugar de abusar de `<div>`. Esto mejora el SEO y la accesibilidad.

2. **Priorizar la accesibilidad (a11y)**
   - Usa siempre el atributo `alt` descriptivo en las imágenes (`<img>`).
   - Mantén una jerarquía lógica de encabezados (`<h1>` a `<h6>`) sin saltarse niveles.
   - Asegura suficiente contraste de color y soporte para navegación por teclado.

3. **Declarar el idioma**
   Define el atributo `lang` en la etiqueta `<html>` (ej. `<html lang="es">`).

4. **Estructura limpia**
   Mantén el código bien indentado y cierra siempre todas las etiquetas.

---

## CSS

1. **Separación de conceptos**
   Evita los estilos en línea (`style="..."`). Mantén todo el diseño en hojas de estilo externas (`.css`).

2. **Diseño adaptable (Responsive Design)**
   - Adopta el enfoque *Mobile-First* (diseñar primero para pantallas móviles y añadir media queries para pantallas más grandes).
   - Usa unidades relativas (`rem`, `em`, `%`, `vw`, `vh`) en lugar de unidades fijas (`px`) para textos y contenedores.

3. **Usar metodologías de organización**
   Adopta sistemas como **BEM** (Block, Element, Modifier) o arquitecturas similares para nombrar clases de forma consistente y evitar conflictos de especificidad.

4. **Aprovechar Flexbox y CSS Grid**
   Usa estas herramientas modernas para layouts en lugar de técnicas antiguas como `float` o posicionamientos absolutos innecesarios.

5. **Variables CSS (Custom Properties)**
   Define colores, fuentes y espaciados repetitivos en `:root` para facilitar el mantenimiento.

```css
:root {
  --color-primary: #007bff;
  --font-main: 'Helvetica Neue', sans-serif;
  --spacing-md: 1rem;
}

body {
  font-family: var(--font-main);
  padding: var(--spacing-md);
}
```

6. **Optimizar el rendimiento**
   Minimiza el uso de selectores excesivamente específicos (ej. `div ul li a`) y agrupa/minimiza tus archivos CSS en producción.
