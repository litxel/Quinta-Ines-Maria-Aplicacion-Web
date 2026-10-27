# Plan de despliegue — EventPlanner QIM (Quinta Inés María)

- **Fecha del análisis:** sábado 24 de octubre de 2026
- **Fecha límite:** martes 27 de octubre de 2026
- **Alcance revisado:** todo el backend (`backend/src`, 38 archivos), el frontend (`frontend/src`, ~12.000 líneas), la base de datos local (esquema y datos reales, solo lectura) y la app corriendo en local en vista de celular (375 px) y de computadora.

---

## 0. Resumen

La app está bien construida en lo general (SQL parametrizado, bcrypt, tokens de recuperación con hash, diseño público responsive). Pero **hay 9 problemas que bloquean el despliegue**. Algunos son de seguridad, otros hacen que funciones clave fallen sin avisar (la fecha del evento, los recordatorios, los correos a usuarios de Google). Además, en hosting gratuito, **los correos por SMTP y las imágenes subidas dejan de funcionar** si no se adapta el código.

Todo se puede desplegar **gratis y sin tarjeta de crédito** con: **Cloudflare Pages** (frontend) + **Render** (backend) + **Neon** (PostgreSQL) + **Cloudinary** (imágenes) + **Brevo** (correos) + **cron-job.org** (mantener despierto el servidor).

### ✅ Estado al sábado 24-oct (noche): correcciones hechas en la rama `deploy/produccion`

- **Corregidos y probados de punta a punta** (con una copia temporal de la BD y un servidor de correo falso): los 9 críticos, los altos 10–22 y casi todos los medios/bajos. Detalle en la sección 9.
- **Imágenes y video optimizados:** el build pasó de 116 MB a 25 MB; el inicio en celular de 41 MB a 3,7 MB.
- **Pendiente para el despliegue:** crear las cuentas (Neon, Cloudinary, Brevo, Render, Cloudflare), migrar la BD y las imágenes, configurar Google OAuth. Microsoft OAuth queda desactivado a propósito.

---

## 1. Hallazgos del análisis

> Los marcados con ✅**probado** los verifiqué ejecutando la app en local.

### 🔴 Críticos: hay que corregirlos antes de desplegar

| # | Problema | Dónde | Impacto |
|---|----------|-------|---------|
| 1 | **Cualquier cliente puede usar el calendario de admin** (ver, bloquear y desbloquear fechas). Las rutas solo verifican sesión, no rol ADMIN. ✅**probado**: un token CLIENTE recibe HTTP 200 con nombres de clientes. | `backend/src/modules/configurador/configurador.routes.js:46-48` | Fuga de datos de clientes, sabotaje del calendario |
| 2 | **`POST /api/configurador/enviar-solicitud` es pública**: cualquiera, sin sesión, puede mandar un correo con un PDF adjunto a cualquier dirección **desde la cuenta oficial de la Quinta**. ✅**probado** | `configurador.routes.js:51` | Spam o phishing en nombre de la empresa, y bloqueo de la cuenta de correo |
| 3 | **La fecha del evento que elige el cliente se pierde.** El configurador la pide (paso 4), pero `Solicitar.jsx` no la envía y el backend guarda `CURRENT_DATE` (el día en que se crea la solicitud). ✅**probado en BD**: `fecha_evento` = `creado_en` en todas. | `frontend/src/pages/Solicitar.jsx:316` · `backend/src/modules/solicitudes/solicitudes.service.js:29` | Calendario admin, "fechas ocupadas", reportes de ingresos por mes y recordatorios **todos con fechas equivocadas** |
| 4 | **Los recordatorios de 7 días nunca se envían**: la consulta usa la columna `est.estado_codigo`, que no existe (se llama `codigo`). ✅**probado**: `no existe la columna est.estado_codigo` | `backend/src/utils/cron.jobs.js:23` | El correo de recordatorio nunca sale |
| 5 | **Bucle infinito cuando expira la sesión** (a los 7 días): el interceptor borra `qim_token` pero no el estado persistido de Zustand (`qim-auth`), así que la app rebota entre `/admin` y `/login` sin parar. ✅**probado**: decenas de peticiones 401 por segundo | `frontend/src/services/api.js:43` | Admin y clientes no pueden usar la app y el servidor gratuito recibe miles de peticiones |
| 6 | **Usuarios de Google no reciben el correo de confirmación**: el JWT de OAuth solo lleva `{id, rol}` y el correo se envía a `req.user.correo` (= `undefined`). | `backend/src/modules/auth/oauth.controller.js:99` · `solicitudes.controller.js:46-47` | Falla silenciosa del correo a cada usuario que entra con Google |
| 7 | **Las imágenes de la galería apuntan a `http://localhost:5000`** (escrito a mano en el código). | `frontend/src/pages/Galeria.jsx:56` · `frontend/src/pages/admin/GestionGaleria.jsx:127` | En producción la galería sale vacía |
| 8 | **Las imágenes subidas se borran en hosting gratuito**: se guardan en el disco del servidor (`backend/public/uploads`, 136 MB). En Render gratis el disco se borra en cada reinicio o suspensión. | `galeria.controller.js`, `catalogo.service.js`, `usuarios.service.js` | Fotos de perfil, paquetes y galería nuevas desaparecen |
| 9 | **Render gratis bloquea SMTP** (puertos 25/465/587) desde sept. 2025. `nodemailer` con Gmail SMTP no funcionará. | `backend/src/utils/email.service.js` · `cron.jobs.js` | No sale ningún correo: verificación, recuperación, confirmaciones |

### 🟠 Altos: corregirlos esta semana

| # | Problema | Dónde |
|---|----------|-------|
| 10 | **Sin límite de intentos** (rate limiting) en login, registro, recuperar clave y asistente IA. `express-rate-limit` está instalado pero nunca se usa. El asistente IA es público y gastaría la cuota gratuita de Gemini (~15 req/min). | `backend/src/app.js` |
| 11 | **Registro:** si el correo de verificación falla → error 500, pero el usuario **ya quedó creado** y no hay forma de reenviar la verificación ("correo ya registrado"). | `backend/src/modules/auth/auth.controller.js:33` |
| 12 | **El login no exige correo verificado** (10 de 16 usuarios en la BD no lo han verificado). La verificación no sirve para nada hoy. | `backend/src/modules/auth/auth.service.js` |
| 13 | **Tres números de solicitud distintos para la misma solicitud:** el cliente ve `QIM-2026-xxxxxx` en pantalla y en el PDF, la BD guarda `SOL-2026-0000xx` (el trigger lo sobrescribe), y el correo con PDF trae otro `QIM-2026-yyyyyy` aleatorio. Además el cliente recibe **2 correos**. | `Solicitar.jsx` · `configurador.controller.js` (enviarSolicitudFinal) · trigger `trg_solicitud_numero` |
| 14 | **Path traversal al subir imagen de galería**: el título se usa en el nombre del archivo sin limpiar (`../`) y la extensión no se valida. Un admin (o quien robe su sesión) puede escribir archivos fuera de la carpeta. | `backend/src/modules/galeria/galeria.controller.js:53` |
| 15 | **Usuario desactivado sigue entrando hasta 7 días**: el JWT no se vuelve a comprobar contra la BD. | `backend/src/middlewares/auth.js` |
| 16 | **El precio lo calcula el navegador**: `precio_estimado` y `precio_snapshot` de extras vienen del cliente y se guardan tal cual. Ya existe `calcularPrecioTotal` en el servidor: hay que usarlo al crear la solicitud. | `solicitudes.controller.js` |
| 17 | **Dependencias con vulnerabilidades conocidas**: backend 8 (1 crítica en `proxy-addr`, altas en `nodemailer`, `body-parser`, `compression`); frontend 10+ (`axios`, `react-router`, `vite`, `dompurify`…). | `npm audit` |
| 18 | **OAuth:** vincula cuentas solo por correo. Con Microsoft (`common`) eso permite suplantar cuentas (ataque "nOAuth"). **No configurar Microsoft en producción.** En Google, falta pasar el correo a minúsculas y comprobar que esté verificado. | `oauth.controller.js:12-60` |
| 19 | **Panel admin inutilizable en celular**: el menú lateral ocupa 272 px fijos y deja ~100 px para el contenido. ✅**probado** | `frontend/src/components/admin/AdminLayout.jsx:242` |
| 20 | **La página de inicio descarga 41 MB de imágenes en celular** ✅**probado**. El build pesa 116 MB: hay fotos de 4–9 MB y un video de **52 MB** (supera el límite de 25 MB por archivo de Cloudflare Pages). JS principal de 1,8 MB sin dividir. | `frontend/src/pages/Home.jsx:7-32` · `frontend/src/assets/FotosQuintaInes` |
| 21 | **Los errores 500 muestran mensajes internos de la BD** al usuario (p. ej. nombres de columnas). | `backend/src/middlewares/errorHandler.js:5` · `configurador.controller.js` (bloquearFecha/desbloquearFecha) |
| 22 | **Eliminar paquete sin transacción**: borra sus servicios y, si el paquete está en uso, el borrado falla pero los servicios ya se perdieron. | `backend/src/modules/catalogo/catalogo.service.js:369` |

### 🟡 Medios y bajos (si alcanza el tiempo)

- `tls: { rejectUnauthorized: false }` en correo (`email.service.js:26`, `cron.jobs.js:60`): desactiva la verificación del certificado.
- Límite de cuerpo de 50 MB (`app.js:36`): con 512 MB de RAM en Render conviene bajarlo a ~10 MB.
- `AuthCallback.jsx:45` fija el token en `api.defaults` y queda pegado tras cerrar sesión (hasta recargar).
- Sesiones del configurador: cualquiera puede leer o modificar una sesión ajena por ID (`configurador.routes.js:41-42`).
- Enlaces del asistente IA sin validar (`AsistenteIA.jsx:58`): permitir solo rutas que empiecen con `/configurador`.
- Al iniciar sesión con correo, el admin cae en `/paquetes` en vez de `/admin`.
- Cambiar contraseña no exige mayúscula/número (el registro sí).
- 2 estados de solicitud con texto mal codificado en la BD (`Ã³`).
- Archivos sobrantes: `frontend/src/service` (vacío), `frontend/src/pages/App.jsx` (versión vieja), scripts `backend/migrate_*.js`, `update.js`.
- `cancelarMiSolicitud` responde 500 en vez de 404 si no existe.
- SDK `@google/generative-ai` está descontinuado (migrar a `@google/genai` más adelante).

### ✅ Lo que ya está bien

- Todas las consultas SQL usan parámetros (`$1`) → sin inyección SQL.
- Contraseñas con bcrypt (12 rondas); tokens de verificación y recuperación guardados como hash SHA-256 con expiración; recuperar clave no revela si el correo existe.
- Bloqueo de cuenta tras 5 intentos fallidos; `helmet` y CORS restringido.
- `.env` nunca se subió a GitHub (revisé el historial).
- Páginas públicas responsive: sin desbordes horizontales a 375 px; el menú móvil y el configurador funcionan bien.
- Máquina de estados de solicitudes (no deja retroceder ni reabrir canceladas).

---

## 2. Tecnologías recomendadas (100 % gratis, sin tarjeta)

```
   Celular / PC
        │
        ▼
 ┌────────────────────┐   API (JSON)    ┌──────────────────────┐   SQL (SSL)   ┌──────────────┐
 │ Cloudflare Pages   │ ──────────────▶ │ Render (Node/Express)│ ────────────▶ │ Neon Postgres│
 │ React + Vite       │                 │ backend/             │               │ 0,5 GB       │
 └────────────────────┘                 └──────────┬───────────┘               └──────────────┘
        │ imágenes                                 │ HTTPS
        ▼                                          ├──▶ Brevo (correos, 300/día)
 ┌────────────────────┐                            ├──▶ Gemini 2.5 Flash-Lite (IA)
 │ Cloudinary (CDN)   │ ◀── subidas ───────────────┘
 └────────────────────┘          cron-job.org ──(cada 10 min)──▶ /api/health
```

| Pieza | Servicio | Qué da gratis | Por qué este |
|-------|----------|---------------|--------------|
| Frontend | **Cloudflare Pages** | Ancho de banda ilimitado, 500 builds/mes, uso comercial permitido, archivos ≤ 25 MiB | Es el único popular sin límite de tráfico; ideal para una web con muchas fotos |
| Backend | **Render** (Web Service Free) | 750 h/mes, 512 MB RAM, 5 GB de salida/mes | El más fácil para Node la primera vez; despliega solo al hacer `git push` |
| Base de datos | **Neon** | 0,5 GB, 100 CU-h/mes, se suspende sola a los 5 min | Tu BD pesa 12 MB; PostgreSQL 17 igual que en local; no expira |
| Imágenes | **Cloudinary** | 25 créditos/mes (≈ 25 GB de tráfico o almacenamiento) | Saca las fotos del disco de Render (que se borra) y las optimiza solas (`f_auto,q_auto`) |
| Correo | **Brevo** (API HTTP) | 300 correos/día | Funciona por HTTPS (Render bloquea SMTP); permite remitente verificado sin dominio propio |
| Despertador | **cron-job.org** | Tareas programadas gratis | Evita que Render se duerma, así los recordatorios de las 08:00 sí corren |
| IA | **Gemini 2.5 Flash-Lite** | ~15 req/min | Ya lo usan; sigue en el plan gratis |
| Código | **GitHub** | Ya lo tienen | Render y Cloudflare despliegan desde ahí |

**Descartados y por qué:**
- **Vercel Hobby:** sus términos prohíben uso comercial (y la app es de una empresa).
- **Render Postgres gratis:** se borra a los 30 días.
- **Render Static Site para el frontend:** desde agosto 2026 el plan gratis solo incluye 5 GB de salida al mes; con 41 MB por visita al inicio se acaba en ~120 visitas.
- **Railway, Fly.io, Koyeb:** ya piden tarjeta o no tienen plan gratis real.
- **Resend:** obliga a tener dominio propio. **SendGrid:** ya no tiene plan gratis permanente.

**Limitaciones que hay que aceptar (y cómo se mitigan):**
- Render gratis "duerme" tras 15 min sin visitas → primera carga de 30–60 s. *Mitigación:* cron-job.org hace ping cada 10 min (24/7 ≈ 744 h < 750 h).
- Sin dominio propio, Brevo envía los correos "vía brevosend.com" y algunos pueden caer en spam. *Opcional a futuro:* un dominio (~10 USD/año) lo resuelve.
- Las direcciones serán del tipo `quinta-ines-maria.pages.dev` y `qim-api.onrender.com`.

---

## 3. Cambios de código para producción — ✅ hechos el 24-oct

1. **`backend/src/config/db.js`**: aceptar `DATABASE_URL` con SSL (Neon lo exige); quitar `options: '-c client_encoding=UTF8'` (Neon ya usa UTF-8 y ese parámetro da problemas con su pooler); subir `connectionTimeoutMillis` a 10 s para tolerar que Neon despierte.
2. **`backend/src/app.js`**: `app.set('trust proxy', 1)` (Render está detrás de un proxy; sin esto, `req.ip` y el rate limiting no sirven); agregar límites de peticiones; bajar el límite del body.
3. **Correo**: cambiar `nodemailer`/SMTP por la API HTTP de Brevo en un único helper (verificación, recuperación, confirmación con PDF, cancelación, recordatorio).
4. **Imágenes**: un helper `subirImagen()` que suba a Cloudinary; script único para migrar los 103 archivos actuales y actualizar las URLs en la BD.
5. **Frontend**: una sola función `urlImagen()` que use `VITE_API_URL` o devuelva la URL de Cloudinary tal cual; eliminar todos los `localhost:5000`.
6. **Peso**: convertir las fotos de `src/assets` a WebP (máx. 1920 px) y subir el video a YouTube (no listado) o comprimirlo bajo 20 MB; cargar las páginas de admin con `React.lazy` para dividir el JS.
7. `npm audit fix` en `backend/` y `frontend/` (y revisar que todo siga funcionando).

---

## 4. Cronograma (sábado → martes)

| Día | Bloque | Quién | Tiempo aprox. |
|-----|--------|-------|---------------|
| **Sáb 24** ✅ | **A. Corregir hallazgos + adaptar a producción** (secciones 1 y 3) | Hecho y probado | — |
| **Dom 25** | **B. Revisar los cambios** (tú, en local) + **crear cuentas**: GitHub ✔, Neon, Cloudinary, Brevo, Render, Cloudflare, cron-job.org + migrar la BD a Neon | Claude el código; tú las cuentas (con guía) | 3–4 h |
| **Lun 26** | **C. Desplegar** (sección 5) + configurar Google OAuth + **pruebas en celular y PC** (sección 7) | Juntos, paso a paso | 3 h |
| **Mar 27** | **D. Margen**: arreglar lo que salga en las pruebas, crear/confirmar el admin real, cambiar contraseñas, entregar | Juntos | 1–2 h |

> Regla: **no se despliega nada el martes que no se haya probado el lunes.**

---

## 5. Guía de despliegue paso a paso (primera vez)

### Paso 1. Subir el código a GitHub
- Confirmar que `.env` **no** aparece en `git status` (ya está en `.gitignore`).
- Hacer commit en una rama (`deploy/produccion`), probar y luego unir a `main`.

### Paso 2. Base de datos en Neon
1. Crear cuenta en neon.tech → **New project** → PostgreSQL 17 → región **AWS US East 1 (N. Virginia)**.
2. Copiar el *connection string* (el que termina en `?sslmode=require`).
3. Exportar la BD local y restaurarla en Neon (PowerShell):
   ```powershell
   & "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -d quinta_ines_maria -Fc --no-owner --no-privileges -f qim.dump
   & "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" --no-owner --no-privileges -d "<CONNECTION_STRING_DE_NEON>" qim.dump
   ```
   (Los avisos sobre la extensión `plpgsql` o roles `qim_*` se pueden ignorar.)
4. Ejecutar en Neon `database/migracion_produccion.sql` (corrige textos `Ã³`; ya se aplicó en local, así que si exportas después del 24-oct ya viene corregido).
5. ⚠ Las solicitudes creadas antes de la corrección tienen como fecha del evento la fecha en que se crearon (no se puede recuperar la fecha real). Revísalas o archívalas desde el panel.

### Paso 3. Cloudinary
- Crear cuenta → copiar la variable `CLOUDINARY_URL` del panel.
- Migrar las 103 imágenes actuales (galería, catálogo, fotos de perfil) y actualizar sus URLs en Neon. Desde `backend/`, con `DATABASE_URL` (Neon) y `CLOUDINARY_URL` puestas temporalmente en tu `.env` local:
  ```powershell
  node scripts/migrar-imagenes-cloudinary.js --dry-run   # solo muestra qué haría
  node scripts/migrar-imagenes-cloudinary.js             # migra de verdad
  ```
  Luego quita `DATABASE_URL` de tu `.env` local para volver a trabajar con la BD de tu PC.

### Paso 4. Brevo
- Crear cuenta → **Senders** → agregar y verificar el correo de la Quinta → **SMTP & API → API Keys** → crear una clave.
- Probar el envío antes de desplegar (desde `backend/`, con `BREVO_API_KEY` y `MAIL_FROM_EMAIL` en tu `.env`):
  ```powershell
  node scripts/probar-correo.js tu-correo@gmail.com
  ```
  Si falla, el script explica la causa (clave inválida, remitente sin verificar, etc.). Sirve igual para probar Gmail/SMTP en local.

### Paso 5. Backend en Render
1. render.com → **New → Web Service** → conectar el repo de GitHub.
2. **Root Directory:** `backend` · **Build:** `npm ci` · **Start:** `node server.js` · **Instance:** Free · **Región:** Virginia (US East).
3. **Health Check Path:** `/api/health`.
4. Cargar las variables de entorno (sección 6) → **Deploy**.
5. Abrir `https://<tu-servicio>.onrender.com/api/health` → debe responder `success: true`.

### Paso 6. Frontend en Cloudflare Pages
1. dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → elegir el repo.
2. **Root directory:** `frontend` · **Build command:** `npm run build` · **Output:** `dist`.
3. Variables: `VITE_API_URL=https://<tu-servicio>.onrender.com/api` y `NODE_VERSION=22`.
4. Deploy. Las rutas de React (`/admin`, `/login`…) funcionan solas: Pages detecta que es una SPA al no haber `404.html`.

### Paso 7. Conectar todo
- En Render, poner `FRONTEND_URL=https://<tu-proyecto>.pages.dev` (sin `/` al final) → redeploy.
- **Google Cloud Console → Credenciales → tu cliente OAuth:**
  - Orígenes JS autorizados: `https://<tu-proyecto>.pages.dev`
  - URI de redirección: `https://<tu-servicio>.onrender.com/api/auth/google/callback`
  - **Pantalla de consentimiento → "Publicar app" (En producción)**. Si se queda en "Prueba", solo los usuarios de prueba podrán entrar con Google.

### Paso 8. cron-job.org
- Nueva tarea: `GET https://<tu-servicio>.onrender.com/api/health` cada **10 minutos**.

---

## 6. Variables de entorno de producción

**Render (backend)**

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `TZ` | `America/Guayaquil` |
| `DATABASE_URL` | connection string de Neon |
| `JWT_SECRET` | **nuevo**, generado con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` (no reutilizar el de desarrollo) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://<tu-proyecto>.pages.dev` |
| `BACKEND_URL` | `https://<tu-servicio>.onrender.com` |
| `BREVO_API_KEY` | clave de Brevo |
| `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME` | correo verificado en Brevo / `Quinta Inés María` |
| `CLOUDINARY_URL` | de Cloudinary |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | la actual / `gemini-2.5-flash-lite` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | los actuales |
| `GOOGLE_PLACES_API_KEY` / `GOOGLE_PLACE_ID` | opcional (requiere facturación activa en Google Cloud; sin ellas la web usa las reseñas propias) |
| ~~`MICROSOFT_*`~~ | **no configurar** (ver hallazgo 18) |

**Cloudflare Pages (frontend):** `VITE_API_URL`, `NODE_VERSION=22` y, opcional, `VITE_WHATSAPP_NUMERO`.

---

## 7. Checklist de pruebas (lunes)

Probar en **Android (Chrome)**, **iPhone (Safari)** y **PC (Chrome/Edge)**, en modo claro y oscuro:

- [ ] Registro con correo → llega el correo de verificación → el enlace verifica la cuenta
- [ ] Login con correo y con Google (con una cuenta que **no** sea de prueba)
- [ ] Recuperar contraseña → llega el correo → el enlace funciona
- [ ] Configurador completo en celular → Solicitar → llega **un** correo con PDF; el **número** y la **fecha del evento** coinciden en pantalla, PDF, correo y panel admin
- [ ] Admin: ver la solicitud, cambiar estado, ver el evento **en la fecha correcta** del calendario, bloquear una fecha
- [ ] Un cliente que llama a `/api/configurador/admin/calendario` recibe **403**
- [ ] Subir foto de perfil e imagen de galería → **reiniciar el servicio en Render** → las imágenes siguen ahí
- [ ] Sesión vencida → vuelve al login **una sola vez** (sin bucle)
- [ ] 6 intentos de login fallidos → bloqueo; muchas consultas seguidas a la IA → límite
- [ ] Panel admin usable en celular
- [ ] Inicio carga en < 5 s con 4G (DevTools → Network → "Fast 4G")
- [ ] Abrir la web tras 30 min sin uso → carga normal (cron-job.org funcionando)

---

## 8. Después de la entrega (recomendado, no urgente)

- Dominio propio (~10 USD/año) para que los correos no caigan en spam y para una URL profesional.
- Copia de seguridad semanal con `pg_dump` contra Neon.
- Alertas de caída (UptimeRobot, gratis).
- Migrar a `@google/genai` (SDK nuevo de Gemini).

---

### Fuentes de los límites gratuitos (consultadas el 24-oct-2026)

- Render — bloqueo de SMTP en plan gratis: https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports
- Render — límites del plan gratis: https://render.com/docs/free
- Render — nuevos planes (Hobby con 5 GB de salida): https://render.com/docs/new-workspace-plans
- Neon — plan gratis: https://www.jetadmin.io/blog/neon-pricing/amp/
- Cloudinary — créditos del plan gratis: https://cloudinary.com/documentation/developer_onboarding_faq_credits
- Brevo — API gratis (300/día): https://www.brevo.com/features/email-api/
- Brevo y remitentes gmail.com: https://www.suped.com/learn/dmarc/how-to-set-up-dmarc-dkim-spf-for-brevo
- Cloudflare Pages — límites: https://developers.cloudflare.com/pages/platform/limits
- Vercel Hobby — solo uso no comercial: https://examples.vercel.com/docs/plans/hobby
- Koyeb — cambios 2026: https://agentdeals.dev/vendor/koyeb
- Resend — requiere dominio: https://automationatlas.io/answers/resend-free-tier-explained-2026/
- Gemini API — plan gratis 2026: https://agentdeals.dev/gemini-api-pricing-2026

---

## 9. Registro de correcciones (24-oct-2026)

| # | Corrección | Archivos principales | Verificado |
|---|-----------|----------------------|-----------|
| 1 | Calendario admin exige rol ADMIN | `configurador.routes.js` | Cliente → 403 |
| 2 | Eliminada la ruta pública de envío de correos; la cotización se envía con `POST /api/solicitudes/:id/cotizacion` (con sesión, solo al correo del dueño, valida que sea un PDF real) | `configurador.*`, `solicitudes.*` | Sin sesión → 401; solicitud ajena → 404; archivo no-PDF → 400 |
| 3 | Se guarda la fecha real del evento; se valida que no esté en el pasado, ocupada ni bloqueada; no se pueden confirmar dos eventos el mismo día | `Solicitar.jsx`, `solicitudes.service.js` | Fecha 2027-01-07 guardada; misma fecha → 409 |
| 4 | Cron de recordatorios con la columna correcta y zona horaria de Ecuador | `cron.jobs.js` | Consulta ejecuta sin error |
| 5 | Sin bucle al vencer la sesión; aviso "Tu sesión expiró"; el error de contraseña incorrecta ya se ve | `api.js`, `useAuthStore.js`, `Login.jsx` | 1 sola petición 401 y 1 redirección |
| 6 | `verifyToken` lee usuario, rol y correo de la BD (usuarios de Google reciben sus correos; desactivar una cuenta corta el acceso al instante) | `middlewares/auth.js` | Usuario inexistente → 401 |
| 7 | Una sola función `urlImagen()` para todas las imágenes; adiós `localhost:5000` | `frontend/src/utils/urls.js` + 15 archivos | Galería: 71 imágenes, 0 rotas |
| 8 | Imágenes a Cloudinary (o disco en local), con validación del tipo real y nombre generado en el servidor (cierra el path traversal) + script de migración | `utils/almacenamiento.service.js`, `scripts/migrar-imagenes-cloudinary.js` | Script revisado; las 103 imágenes existen |
| 9 | Correos por la API HTTP de Brevo (SMTP solo en local); texto de usuarios escapado en el HTML | `utils/email.service.js` | 8 correos capturados con el SMTP falso |
| 10 | Límites de peticiones (login, correos, IA, solicitudes) + `trust proxy` | `middlewares/rateLimit.js`, `app.js` | Cabeceras RateLimit presentes; 429 al exceder |
| 11–12 | Login exige correo verificado (admins exentos); registro tolera fallos de correo; botón "Reenviar correo de verificación" | `auth.*`, `Login.jsx`, `Register.jsx` | Sin verificar → 403; enlace viejo invalidado al reenviar |
| 13 | Un solo número (`SOL-AAAA-NNNNNN`) en pantalla, PDF, correo y panel; un solo correo con el PDF | `Solicitar.jsx`, `solicitudes.*` | SOL-2026-000054 en los 4 lugares |
| 16 | Precio y extras recalculados en el servidor | `solicitudes.service.js` | Precio falso de $1 ignorado |
| 17 | `npm audit fix`: 0 vulnerabilidades en backend y frontend | `package*.json` | `npm audit` |
| 18 | OAuth: correo en minúsculas, solo correos verificados por Google, token por `#fragmento` | `oauth.controller.js`, `AuthCallback.jsx` | — (requiere probar con Google real el lunes) |
| 19 | Panel admin en celular: menú tipo cajón | `AdminLayout.jsx` | Contenido usa los 375 px |
| 20 | Fotos 62,6 → 8,6 MB (sin datos GPS EXIF); video 52 → 13 MB; páginas con carga diferida | `assets/`, `App.jsx` | Build 116 → 25 MB; JS inicial 1,84 MB → 307 KB |
| 21 | Errores 500 sin detalles internos en producción | `errorHandler.js` | JSON inválido → 400 claro |
| 22 | Eliminar paquete en transacción | `catalogo.service.js` | — |
| extra | Avisos por correo al cliente cuando el admin cambia el estado (en revisión, confirmada, rechazada, completada) | `email.service.js`, `solicitudes.controller.js` | Correos capturados |
| extra | El asistente IA cotiza con los precios reales de la BD (antes tenía $22 para Silver; la BD dice $17,50) y la fecha de hoy siempre actualizada | `utils/gemini.js` | — |
| extra | Zona horaria del servidor fija en `America/Guayaquil` y helper de fechas en el frontend (evita fechas un día antes) | `server.js`, `frontend/src/utils/fechas.js` | — |
| extra | Sesiones del configurador protegidas por dueño; enlaces del asistente IA solo internos; un admin no puede desactivarse; anti-spam de reseñas; textos `Ã³` corregidos | varios | — |

