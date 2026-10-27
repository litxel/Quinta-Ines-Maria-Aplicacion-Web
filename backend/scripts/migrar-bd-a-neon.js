'use strict';
/**
 * Copia la base de datos LOCAL a Neon (producción) en un solo paso:
 *   1. Respaldo de la BD local con pg_dump  → backend/respaldos/qim_<fecha>.dump
 *   2. Comprueba que la BD de Neon esté vacía (para no pisar datos reales)
 *   3. Restaura el respaldo en Neon con pg_restore
 *   4. Aplica database/migracion_produccion.sql
 *   5. Compara la cantidad de registros local vs. Neon
 *
 * Uso (desde la carpeta backend):
 *   1. En backend/.env agrega:  NEON_DATABASE_URL=<connection string de Neon>
 *      (NO uses DATABASE_URL en local: eso haría que tu backend local use Neon)
 *   2. node scripts/migrar-bd-a-neon.js
 *   3. Cuando termine, borra NEON_DATABASE_URL de tu .env
 *
 * Opción --forzar: restaura aunque Neon ya tenga tablas (borra y recrea objetos).
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../.env') });
const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const FORZAR  = process.argv.includes('--forzar');
const DESTINO = process.env.NEON_DATABASE_URL;

const fallar = (msg) => { console.error(`\n❌ ${msg}\n`); process.exit(1); };

if (!DESTINO) fallar('Falta NEON_DATABASE_URL en backend/.env (copia el "Connection string" de Neon).');
if (!/neon\.tech/.test(DESTINO)) console.warn('⚠  NEON_DATABASE_URL no parece de Neon; se continúa igual.');

// Binarios de PostgreSQL instalados (se prefiere la versión más nueva)
const binario = (nombre) => {
  for (const v of ['18', '17', '16']) {
    const ruta = `C:\\Program Files\\PostgreSQL\\${v}\\bin\\${nombre}.exe`;
    if (fs.existsSync(ruta)) return ruta;
  }
  return nombre; // que lo busque en el PATH (Linux/macOS)
};

const ejecutar = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, ...env } });
  if (r.error) fallar(`No se pudo ejecutar ${path.basename(cmd)}: ${r.error.message}`);
  return r;
};

const TABLAS = [
  'eqim_seguridad.usuarios', 'eqim_catalogo.paquetes', 'eqim_catalogo.paquete_servicios',
  'eqim_catalogo.tipos_evento', 'eqim_catalogo.estilos_decoracion', 'eqim_catalogo.centros_mesa',
  'eqim_catalogo.servicios_adicionales', 'eqim_catalogo.resenias', 'eqim_galeria.imagenes',
  'eqim_solicitudes.eqim_solicitudes', 'eqim_solicitudes.disponibilidad',
];

const contar = async (pool) => {
  const res = {};
  for (const t of TABLAS) {
    try { res[t] = Number((await pool.query(`SELECT COUNT(*) FROM ${t}`)).rows[0].count); }
    catch { res[t] = '—'; }
  }
  return res;
};

(async () => {
  const local = new Pool({
    host: process.env.DB_HOST, port: +process.env.DB_PORT, database: process.env.DB_NAME,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  });
  const neon = new Pool({ connectionString: DESTINO, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 20000 });

  // ── 1. Respaldo local ──────────────────────────────────────────────────────
  const dir = path.join(__dirname, '../respaldos');
  fs.mkdirSync(dir, { recursive: true });
  const archivo = path.join(dir, `qim_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.dump`);
  console.log(`\n1/5 Respaldando la BD local "${process.env.DB_NAME}"…`);
  const dump = ejecutar(binario('pg_dump'), [
    '-h', process.env.DB_HOST, '-p', String(process.env.DB_PORT), '-U', process.env.DB_USER,
    '-d', process.env.DB_NAME, '-Fc', '--no-owner', '--no-privileges', '-f', archivo,
  ], { PGPASSWORD: process.env.DB_PASSWORD });
  if (dump.status !== 0) fallar(`pg_dump falló:\n${dump.stderr}`);
  console.log(`    ✔ ${archivo} (${(fs.statSync(archivo).size / 1024 / 1024).toFixed(1)} MB)`);

  // ── 2. ¿Neon está vacío? ───────────────────────────────────────────────────
  console.log('2/5 Revisando la BD de Neon…');
  const { rows } = await neon.query(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema LIKE 'eqim_%'`
  ).catch((e) => fallar(`No se pudo conectar a Neon: ${e.message}`));
  if (rows[0].n > 0 && !FORZAR) {
    fallar(`Neon ya tiene ${rows[0].n} tablas del sistema. Si quieres reemplazarlas, ejecuta de nuevo con --forzar.`);
  }
  console.log(`    ✔ ${rows[0].n === 0 ? 'Vacía, lista para restaurar' : 'Con datos: se reemplazarán (--forzar)'}`);

  // ── 3. Restaurar ───────────────────────────────────────────────────────────
  console.log('3/5 Restaurando en Neon (puede tardar 1–2 minutos)…');
  const restore = ejecutar(binario('pg_restore'), [
    '--no-owner', '--no-privileges', ...(FORZAR ? ['--clean', '--if-exists'] : []),
    '-d', DESTINO, archivo,
  ]);
  // Avisos normales al restaurar en un servicio administrado (no son fallas reales)
  const IGNORAR = /(extension "plpgsql"|COMMENT ON EXTENSION|must be owner of extension|role "qim_|schema "public" already exists|errors ignored on restore)/i;
  const errores = (restore.stderr || '').split('\n')
    .filter((l) => /error/i.test(l) && !IGNORAR.test(l));
  if (errores.length) {
    console.warn(`    ⚠ pg_restore reportó ${errores.length} error(es):\n      ${errores.slice(0, 8).join('\n      ')}`);
  } else {
    console.log('    ✔ Restauración completa');
  }

  // ── 4. Migración de producción ─────────────────────────────────────────────
  console.log('4/5 Aplicando database/migracion_produccion.sql…');
  const sql = fs.readFileSync(path.join(__dirname, '../../database/migracion_produccion.sql'), 'utf8');
  await neon.query(sql).catch((e) => fallar(`La migración falló: ${e.message}`));
  console.log('    ✔ Migración aplicada');

  // ── 5. Verificación ────────────────────────────────────────────────────────
  console.log('5/5 Comparando registros (local → Neon)…');
  const [a, b] = await Promise.all([contar(local), contar(neon)]);
  let iguales = true;
  for (const t of TABLAS) {
    const ok = a[t] === b[t];
    if (!ok) iguales = false;
    console.log(`    ${ok ? '✔' : '✖'} ${t.padEnd(36)} ${String(a[t]).padStart(5)} → ${String(b[t]).padStart(5)}`);
  }
  console.log(iguales
    ? '\n✅ Base de datos copiada a Neon correctamente.\n'
    : '\n⚠ Hay diferencias en algunas tablas: revisa los mensajes de arriba.\n');

  await Promise.all([local.end(), neon.end()]);
})().catch((e) => fallar(e.message));
