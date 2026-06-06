# Memoria de Modernización Frontend — EventPlanner QIM
> Generada: 2026-06-06 | Proyecto: Quinta Inés María
> Stack: React 19.2.4 · Vite 8.0.4 · Tailwind CSS 4.2.2 · Framer Motion 12.38.0 · Lucide React 1.11.0 · Zustand 5.0.12

---

## Índice

1. [Decisiones de arquitectura y restricciones](#1-decisiones-de-arquitectura-y-restricciones)
2. [FASE 1 — Tipografía, paleta y Dark Mode](#2-fase-1--tipografía-paleta-y-dark-mode)
3. [FASE 2 — Átomos UI modernizados](#3-fase-2--átomos-ui-modernizados)
4. [FASE 3 — Navbar, Footer y botón WhatsApp](#4-fase-3--navbar-footer-y-botón-whatsapp)
5. [Extras — Transiciones, skeletons, Home, utilidades](#5-extras--transiciones-skeletons-home-utilidades)
6. [Catálogo de clases CSS globales](#6-catálogo-de-clases-css-globales)
7. [Patrones de Dark Mode](#7-patrones-de-dark-mode)
8. [Inventario completo de archivos modificados](#8-inventario-completo-de-archivos-modificados)
9. [Resultado de build](#9-resultado-de-build)
10. [Extra E pendiente — Configurador](#10-extra-e-pendiente--configurador)

---

## 1. Decisiones de arquitectura y restricciones

### Restricciones absolutas (no tocar)
- **Lógica de negocio**: sin cambios en servicios, validaciones o flujos.
- **Estado global Zustand**: `useAuthStore` y `useConfiguradorStore` intactos.
- **Conexiones al backend**: ningún endpoint, fetch ni hook de datos modificado.
- **React Router**: árbol de rutas preservado al 100%.

### Decisiones técnicas clave

| Decisión | Solución adoptada |
|---|---|
| Tailwind 4 sin `tailwind.config.js` | Configuración vía `@theme {}` en `index.css` |
| Dark mode Tailwind 4 | `@custom-variant dark (&:where(.dark, .dark *))` — responde a clase `.dark` en cualquier ancestro incluido `<html>` |
| Anti-flash dark mode | Inline `<script>` en `<head>` de `index.html` que lee `localStorage` y aplica `.dark` ANTES de que React hidrate |
| Fuentes de Google | `<link>` preconnect + variable font Plus Jakarta Sans (200–800) + Cormorant Garamond (400,500,600,700) en `index.html` |
| Persistencia de tema | Hook `useDarkMode` → `localStorage` key `'qim-theme'` → fallback a `prefers-color-scheme` |
| Iconos | Lucide React (tree-shakable SVGs) — reemplaza todos los emojis del codebase |
| Animaciones | Framer Motion — ya instalado; se amplió uso en Navbar, FloatingActionButtons, páginas auth y Home |
| Transiciones de página | `AnimatedOutlet` inner component en `App.jsx` usando `useLocation` como key |

---

## 2. FASE 1 — Tipografía, paleta y Dark Mode

### 2.1 `frontend/index.html` (modificado)

**Qué se añadió:**
```html
<!-- Metadatos -->
<html lang="es">
<title>Quinta Inés María · Eventos & Catering</title>
<meta name="description" content="...">

<!-- Script anti-flash (en <head>, ANTES de cualquier CSS) -->
<script>
  (function () {
    try {
      var stored = localStorage.getItem('qim-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
</script>

<!-- Google Fonts (preconnect + display=swap) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 2.2 `frontend/src/index.css` (reescrito completamente)

**Orden obligatorio Tailwind 4:**
```css
@import "tailwindcss";                           /* DEBE SER LA PRIMERA LÍNEA */
@custom-variant dark (&:where(.dark, .dark *));  /* SEGUNDA — activa dark: classes */
```

**Paleta institucional en `@theme`:**
```css
@theme {
  --color-qim-navy:    #0D2137;   /* azul marino institucional */
  --color-qim-blue:    #1A6BAC;   /* azul medio */
  --color-qim-gold:    #C9A227;   /* dorado refinado (era #B7950B) */
  --color-qim-cream:   #FDF8F0;   /* fondo claro */
  --color-qim-dark:    #1A1A1A;
  --color-qim-surface: #F8F5EF;

  --font-sans:    'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-display: 'Cormorant Garamond', Georgia, serif;
}
```

**Base del dark mode:**
```css
body {
  background-color: #FDF8F0;
  color: #1A1A1A;
  font-family: var(--font-sans);
  transition: background-color 0.35s ease, color 0.35s ease;
}
html.dark body {
  background-color: #060D18;  /* navy muy oscuro, brand-consistent */
  color: #E2DDD6;             /* crema suave */
}
```

### 2.3 `frontend/src/hooks/useDarkMode.js` (nuevo)

```js
import { useState, useEffect } from 'react';
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('qim-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) { root.classList.add('dark'); localStorage.setItem('qim-theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('qim-theme', 'light'); }
  }, [isDark]);
  const toggle = () => setIsDark((prev) => !prev);
  return { isDark, toggle };
}
```

---

## 3. FASE 2 — Átomos UI modernizados

### 3.1 `Navbar.jsx` (reescrito)

**Imports nuevos:**
```js
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
```

**Toggle Dark Mode en Navbar:**
- Botón circular `w-9 h-9` con `bg-slate-100 dark:bg-white/10`
- `AnimatePresence mode="wait"` envuelve Sun/Moon para crossfade animado
- Variantes de animación: `enter: { rotate: 0, opacity: 1 }` / `exit: { rotate: 90, opacity: 0 }`

**Dropdown con AnimatePresence:**
```js
const dropdownVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: -8 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.18, ease: [0.22,1,0.36,1] } },
  exit:    { opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.12 } },
};
```

**Menú mobile:**
- `AnimatePresence` + `motion.div` con `{ height: 0 → 'auto', opacity: 0 → 1 }`
- Ícono hamburguesa/X con `AnimatePresence mode="wait"` para swap animado

**Clases dark mode en Navbar:**
- Fondo: `bg-white/85 dark:bg-[#060D18]/85 backdrop-blur-md`
- Links: `text-slate-700 dark:text-slate-300 hover:text-[#C9A227]`
- Dropdown panel: `bg-white dark:bg-[#0C1829] border border-slate-100 dark:border-white/8`

### 3.2 `TarjetaPaquete.jsx` (modificado)

**Iconos Lucide reemplazando emojis:**
```js
import { CheckCircle2, Eye, ArrowRight, Star } from 'lucide-react';
```
- ✅ → `<CheckCircle2 size={15} className="text-[colorPaquete] mt-0.5 shrink-0" />`
- Badge "Más popular" → `<Star size={12} className="fill-current" />`
- Botón CTA → `<ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />`

**Mejoras visuales:**
- `card-shadow-hover` para elevación en hover (translateY -4px + box-shadow)
- `rounded-3xl` en tarjetas
- `dark:bg-[#0C1829] dark:border-white/8` en modo oscuro

### 3.3 `BadgeEstado.jsx` (modificado)

Mapa completo emoji → Lucide + dark mode por variante de color:
```js
import { Clock, Search, CheckCircle2, XCircle, Ban, PartyPopper } from 'lucide-react';
const CONFIG = {
  amber:   { bg:'bg-amber-50  dark:bg-amber-500/10',  text:'text-amber-700 dark:text-amber-400',  border:'border-amber-200 dark:border-amber-500/20',  Icon: Clock        },
  blue:    { bg:'bg-blue-50   dark:bg-blue-500/10',   text:'text-blue-700  dark:text-blue-400',   border:'border-blue-200  dark:border-blue-500/20',   Icon: Search       },
  green:   { bg:'bg-green-50  dark:bg-green-500/10',  text:'text-green-700 dark:text-green-400',  border:'border-green-200 dark:border-green-500/20',  Icon: CheckCircle2 },
  red:     { bg:'bg-red-50    dark:bg-red-500/10',    text:'text-red-700   dark:text-red-400',    border:'border-red-200   dark:border-red-500/20',    Icon: XCircle      },
  slate:   { bg:'bg-slate-50  dark:bg-slate-500/10',  text:'text-slate-700 dark:text-slate-400',  border:'border-slate-200 dark:border-slate-500/20',  Icon: Ban          },
  purple:  { bg:'bg-purple-50 dark:bg-purple-500/10', text:'text-purple-700 dark:text-purple-400',border:'border-purple-200 dark:border-purple-500/20', Icon: PartyPopper  },
};
```

### 3.4 `WelcomeModal.jsx` (modificado)

```js
import { Sparkles, CalendarDays } from 'lucide-react';
```
- Overlay: `bg-black/60 dark:bg-black/75`
- Modal: `bg-white dark:bg-[#0C1829] border border-white dark:border-white/8`
- Avatar badge: gradiente dorado en lugar de color plano
- Botón CTA en dark: gold gradient

### 3.5 `CompletarTelefonoModal.jsx` (modificado)

- Input usa clase global `.input-field`
- Botón usa clase global `.btn-primary`
- Ícono `<ArrowRight>` en submit
- `dark:` classes en overlay, modal, textos

### 3.6 `Login.jsx` (reescrito)

**Estructura:**
```
<div background-foto + overlay-gradient>
  <motion.div .glass-card entrada animada>
    Logo + título
    <InputField icon={Mail}> email
    <InputField icon={Lock}> password (toggle Eye/EyeOff)
    .btn-primary "Iniciar sesión"
    Separador + OAuthButton Google
    Link a registro
  </motion.div>
</div>
```

**Animación de entrada:**
```js
initial={{ opacity: 0, y: 28, scale: 0.97 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
```

**Sub-componentes internos:**
- `InputField({ icon: Icon, ...props })` — prefix icon en `text-slate-400`, focus anula placeholder
- `OAuthButton` — botón outline con logo SVG de Google

### 3.7 `Register.jsx` (reescrito)

**Añadidos sobre Login:**
- Barra de fortaleza de contraseña: 5 segmentos, colores `red/orange/amber/lime/green`
- Pantalla de éxito con `CheckCircle2` y fade-in de Framer Motion
- Sub-componente `Campo({ icon, label, error, ...props })`
- Todos los campos: nombre, apellido, email, teléfono, contraseña, confirmar contraseña

### 3.8 `RecuperarClave.jsx` (reescrito)

- Mismo glassmorphism de Login/Register
- `AnimatePresence mode="wait"` entre vista de formulario y vista de "email enviado"
- Estado éxito: `CheckCircle2` grande + instrucciones + enlace volver a login
- Iconos: `Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle`

---

## 4. FASE 3 — Navbar, Footer y botón WhatsApp

### 4.1 `Footer.jsx` (modificado)

- Fondo: `bg-[#060D18]` (igual al dark body, consistente en ambos modos)
- Logo title: clase `.gradient-text` (gradiente dorado clip-text)
- `SocialIcon` sub-componente con hover color dinámico (inline style via `onMouseEnter`)
- `dark:` classes en todos los textos secundarios y separadores
- Columnas: Empresa | Servicios | Contacto | Legal

### 4.2 `FloatingActionButtons.jsx` (modificado)

**WhatsApp pulse ring:**
```css
/* index.css */
.animate-pulse-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #25D366;
  animation: pulse-ring 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  z-index: -1;
}
@keyframes pulse-ring {
  0%   { transform: scale(1);    opacity: 0.6; }
  70%  { transform: scale(1.55); opacity: 0; }
  100% { transform: scale(1.55); opacity: 0; }
}
```

**AnimatePresence en ícono:**
- `<AnimatePresence mode="wait">` para swap entre ícono X y WA al abrir/cerrar panel
- Panel de chat: `bg-white dark:bg-[#0C1829]` con dark mode completo
- Burbujas de mensaje renderizadas con `.map()` + animaciones Framer Motion escalonadas

### 4.3 `AdminLayout.jsx` (modificado)

- Sidebar: `w-[72px]` colapsado / `w-[272px]` expandido, `dark:bg-[#060D18]`
- Topbar: `bg-white/85 dark:bg-[#060D18]/85 backdrop-blur-md`
- Items nav activos: gradiente gold `from-[#C9A227] to-[#D4AF37]` con texto oscuro
- Área de contenido: `bg-[#F4F6F8] dark:bg-[#060D18] transition-colors duration-300`
- `.custom-scrollbar` movido de inline `<style>` a `index.css` global

---

## 5. Extras — Transiciones, skeletons, Home, utilidades

### Extra A — Transiciones de página

**`frontend/src/components/shared/PageTransition.jsx`** (nuevo):
```jsx
import { motion } from 'framer-motion';
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

**`App.jsx` — `AnimatedOutlet` inner component:**
```jsx
function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <Outlet />
      </PageTransition>
    </AnimatePresence>
  );
}
// En PublicLayout: <AnimatedOutlet /> en lugar de <Outlet />
```

> **Por qué inner component**: `useLocation` debe estar dentro de `<BrowserRouter>`. `key={location.pathname}` indica a AnimatePresence cuándo un elemento sale/entra.

### Extra B — Skeleton loading cards

**`frontend/src/components/shared/SkeletonCard.jsx`** (nuevo):

4 variantes disponibles:
- `'package'` — tarjeta con cabecera imagen + cuerpo texto + botón CTA
- `'gallery'` — bloque de imagen cuadrado
- `'row'` — ítem de lista horizontal (avatar + textos + badge)
- `default` — tarjeta simple con líneas de texto

Uso del shimmer (desde `index.css`):
```css
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
.skeleton {
  background: linear-gradient(90deg, #f0ebe3 25%, #e8e3dc 50%, #f0ebe3 75%);
  background-size: 600px 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
.dark .skeleton {
  background: linear-gradient(90deg, #0f1a2a 25%, #162030 50%, #0f1a2a 75%);
}
```

Uso en componentes:
```jsx
import SkeletonCard, { SkeletonList } from '../shared/SkeletonCard';

// Individual
<SkeletonCard variant="package" />

// Lista de N skeletons
<SkeletonList count={3} variant="package" className="grid grid-cols-3 gap-6" />
```

### Extra C — Home mejorado

**`frontend/src/pages/Home.jsx`** (modificado):

- **Hero title**: `<span className="gradient-text">Inés María</span>` con clip-text dorado
- **Overlay cinematográfico**: gradiente `from-black/70 via-black/40 to-transparent` + vignette lateral
- **Carousel dots**: indicadores clickables en bottom-right del hero (posición fija)
- **Stats section**: números con `.gradient-text`
- **Values section**: `<StaggerReveal>` con `staggerItem` → entrada escalonada por tarjeta
- **Dark mode en todas las secciones**:
  ```
  bg-white dark:bg-[#060D18]
  bg-[#F8F5EF] dark:bg-[#080F1C]
  text-slate-600 dark:text-slate-400
  ```
- **CTA section**: dot-grid decorativo de fondo, "inolvidable" con `.gradient-text`

### Extra D — ScrollReveal con Stagger

**`frontend/src/components/shared/ScrollReveal.jsx`** (exports añadidos):

```jsx
// Variantes de stagger para listas
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
export const staggerItem = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// Componente wrapper
export function StaggerReveal({ children, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

Uso en Home:
```jsx
<StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-6">
  {valores.map((v) => (
    <motion.div key={v.id} variants={staggerItem}>
      <TarjetaValor {...v} />
    </motion.div>
  ))}
</StaggerReveal>
```

---

## 6. Catálogo de clases CSS globales

Todas definidas en `frontend/src/index.css`. Usar en cualquier componente sin imports.

| Clase | Efecto | Dark mode |
|---|---|---|
| `.glass-card` | `backdrop-blur(20px)` + fondo `rgba(255,255,255,0.74)` + borde sutil | Fondo `rgba(12,22,42,0.78)` + borde `rgba(255,255,255,0.08)` |
| `.gradient-text` | Texto con gradiente dorado clip (`#B7950B → #E8C84A → #C9A227`) | Mismo (funciona en ambos modos) |
| `.gradient-text-blue` | Texto con gradiente azul navy-blue clip | N/A |
| `.input-field` | Input unificado 14px border-radius, gold focus ring | Fondo oscuro, borde blanco/9% |
| `.input-field.error` | Border rojo + ring rojo | Ídem |
| `.btn-primary` | Gradiente navy, text blanco, hover elevación | Se mantiene (navy funciona en dark) |
| `.btn-gold` | Gradiente dorado, text navy oscuro, hover elevación | Se mantiene |
| `.card-shadow` | `box-shadow` 2px 20px navy/7% | Shadow black/35% |
| `.card-shadow-hover` | Hover: `translateY(-4px)` + shadow | Hover: shadow black/45% |
| `.skeleton` | Shimmer left→right en crema | Shimmer en azul marino |
| `.animate-pulse-ring` | Pseudo `::before` con `pulse-ring` keyframe circular | — (verde WhatsApp) |
| `.font-display` | `font-family: Cormorant Garamond` | — |
| `.section-line::after` | Línea dorada decorativa `3px`, `3.5rem`, centrada debajo | — |
| `.spinner` | Círculo giratorio gold `2.5rem` | — |
| `.page-transition` | CSS-only fallback fade+slide 0.38s | — |
| `.custom-scrollbar` | Scrollbar delgado 4px, thumb blanco/10% | — (para sidebar admin) |

**Selección de texto:**
```css
::selection { background: rgba(201,162,39,0.22); color: #0D2137; }
.dark ::selection { background: rgba(201,162,39,0.3); color: #F0D060; }
```

**Focus ring global:**
```css
:focus-visible { outline: 2px solid #C9A227; outline-offset: 2px; border-radius: 4px; }
```

---

## 7. Patrones de Dark Mode

### Patrón de activación

1. `index.html` → inline script aplica `.dark` a `<html>` sincrónicamente
2. `useDarkMode` hook → gestiona estado React + sincroniza `<html>` classList + localStorage
3. `Navbar` → único lugar donde se llama `useDarkMode().toggle`
4. Tailwind `@custom-variant dark` → todas las clases `dark:` se activan cuando `<html>` tiene clase `.dark`

### Recetas de dark mode por tipo de elemento

```
Fondos de página:         bg-white dark:bg-[#060D18]
Fondos de sección alterna: bg-[#F8F5EF] dark:bg-[#080F1C]
Tarjetas / modales:       bg-white dark:bg-[#0C1829]
Borders:                  border-slate-100 dark:border-white/8
Texto principal:          text-[#0D2137] dark:text-white
Texto secundario:         text-slate-600 dark:text-slate-400
Texto muted:              text-slate-400 dark:text-slate-500
Topbar/Navbar fondo:      bg-white/85 dark:bg-[#060D18]/85 backdrop-blur-md
Badge colores:            bg-amber-50 dark:bg-amber-500/10  text-amber-700 dark:text-amber-400
Input:                    usa clase global .input-field (ya incluye dark:)
Botones:                  usa .btn-primary / .btn-gold (ya incluyen dark:)
Glass panels:             usa .glass-card (ya incluye dark:)
```

### Colores de referencia

| Token | Light | Dark |
|---|---|---|
| Fondo body | `#FDF8F0` (crema) | `#060D18` (navy oscuro) |
| Fondo tarjeta | `#FFFFFF` | `#0C1829` |
| Fondo sección alt | `#F8F5EF` | `#080F1C` |
| Texto primario | `#0D2137` | `#FFFFFF` |
| Texto secundario | `#475569` | `#94A3B8` |
| Dorado | `#C9A227` | `#C9A227` (mismo) |
| Navy | `#0D2137` | `#0D2137` (mismo) |

---

## 8. Inventario completo de archivos modificados

### Archivos MODIFICADOS (14)

| Archivo | Tipo de cambio |
|---|---|
| `frontend/index.html` | Script anti-flash, Google Fonts, metadatos |
| `frontend/src/index.css` | Reescrito: Tailwind 4 setup, paleta, tipografías, dark mode, todas las utilidades globales |
| `frontend/src/App.jsx` | `AnimatedOutlet` + `PageTransition` + `AnimatePresence` en rutas públicas |
| `frontend/src/pages/Home.jsx` | gradient-text hero, cinematographic overlay, StaggerReveal, dark mode en todas las secciones |
| `frontend/src/pages/Login.jsx` | Reescrito: glassmorphism, motion entrada, InputField/OAuthButton sub-components, dark mode |
| `frontend/src/pages/Register.jsx` | Reescrito: glassmorphism, barra fortaleza, success screen, dark mode |
| `frontend/src/pages/RecuperarClave.jsx` | Reescrito: glassmorphism, AnimatePresence éxito, dark mode |
| `frontend/src/components/layout/Navbar.jsx` | Reescrito: useDarkMode toggle animado, dropdown AnimatePresence, mobile menu animado |
| `frontend/src/components/layout/Footer.jsx` | gradient-text logo, SocialIcon hover, dark mode |
| `frontend/src/components/admin/AdminLayout.jsx` | Dark mode topbar/sidebar/contenido, `.custom-scrollbar` |
| `frontend/src/components/shared/FloatingActionButtons.jsx` | `.animate-pulse-ring`, AnimatePresence ícono, dark mode panel |
| `frontend/src/components/shared/ScrollReveal.jsx` | `+StaggerReveal` y `+staggerItem` named exports |
| `frontend/src/components/catalogo/TarjetaPaquete.jsx` | Lucide icons (CheckCircle2/Star/ArrowRight), dark mode |
| `frontend/src/components/shared/BadgeEstado.jsx` | Lucide icons × 6 variantes, dark mode |
| `frontend/src/components/shared/WelcomeModal.jsx` | Lucide icons, dark mode |
| `frontend/src/components/shared/CompletarTelefonoModal.jsx` | `.input-field`, `.btn-primary`, dark mode |

### Archivos CREADOS (3)

| Archivo | Descripción |
|---|---|
| `frontend/src/hooks/useDarkMode.js` | Hook React para gestión de dark mode con localStorage |
| `frontend/src/components/shared/PageTransition.jsx` | Wrapper Framer Motion para transiciones entre rutas |
| `frontend/src/components/shared/SkeletonCard.jsx` | Tarjetas skeleton shimmer (4 variantes) + `SkeletonList` |

---

## 9. Resultado de build

```
npm run build   →   SUCCESS ✓   9.02s   0 errores   0 warnings relevantes
npm run dev     →   http://localhost:5174/   (5173 ocupado por sesión previa)
```

El único warning fue chunk size para jsPDF — pre-existente, no relacionado con la modernización.

**Error crítico corregido durante el proceso:**
- `@custom-variant` estaba antes de `@import "tailwindcss"` → Tailwind 4 requiere `@import` primero. Corregido inmediatamente con Edit.

---

## 10. Extra E pendiente — Configurador

### Estado: NO ejecutado

El plan original incluía:
> *Extra E — Modo oscuro en el Configurador: El configurador tiene 8 pasos con mucho UI inline — añadir `dark:` classes a los selectores de color, pasos e indicadores de progreso.*

**Archivos a modificar:**
- `frontend/src/pages/Configurador.jsx` — barra de progreso, pasos, paneles de selección
- `frontend/src/components/configurador/AsistenteIA.jsx` — chat panel, burbujas de mensaje

**Por qué se omitió:**
El Configurador tiene 8 pasos con UI muy densa y estilos inline complejos en `useConfiguradorStore`. Se priorizó completar el resto del plan primero. Build pasó limpio sin este extra.

**Cómo abordarlo en la próxima sesión:**
1. Leer `Configurador.jsx` completo para mapear todos los colores hardcoded
2. Aplicar recetas dark mode de la sección 7 a cada paso
3. `AsistenteIA.jsx`: burbujas propias `bg-[#0D2137]`, burbujas IA `bg-white dark:bg-[#0C1829]`
4. Indicador de progreso: `bg-slate-200 dark:bg-white/10` + fill `bg-[#C9A227]`

---

*Este archivo sirve como contexto base para futuras sesiones de desarrollo. No eliminar.*
