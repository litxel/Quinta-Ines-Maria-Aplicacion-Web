'use strict';
/**
 * Migra las imágenes guardadas en backend/public/uploads a Cloudinary y
 * actualiza sus URLs en la base de datos. Se ejecuta UNA vez, contra la BD de
 * producción (Neon), después de restaurar el respaldo.
 *
 * Uso (desde la carpeta backend):
 *   1. Poner en .env (temporalmente) NEON_DATABASE_URL (de Neon) y CLOUDINARY_URL
 *   2. node scripts/migrar-imagenes-cloudinary.js --dry-run   (solo muestra qué haría)
 *   3. node scripts/migrar-imagenes-cloudinary.js             (migra de verdad)
 *
 * Es seguro ejecutarlo varias veces: solo procesa URLs que aún empiezan con /uploads/.
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs   = require('fs');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;

const DRY_RUN     = process.argv.includes('--dry-run');
const PUBLIC_DIR  = path.join(__dirname, '../public');

// Tabla, columna de ID y columnas con URL de imagen
const TABLAS = [
  { tabla: 'eqim_galeria.imagenes',               id: 'imagen_id',    columnas: ['url_original', 'url_thumbnail'] },
  { tabla: 'eqim_catalogo.paquetes',              id: 'paquete_id',   columnas: ['imagen_url'] },
  { tabla: 'eqim_catalogo.tipos_evento',          id: 'tipo_id',      columnas: ['imagen_url'] },
  { tabla: 'eqim_catalogo.estilos_decoracion',    id: 'estilo_id',    columnas: ['imagen_url'] },
  { tabla: 'eqim_catalogo.centros_mesa',          id: 'centro_id',    columnas: ['imagen_url'] },
  { tabla: 'eqim_catalogo.servicios_adicionales', id: 'adicional_id', columnas: ['imagen_url'] },
  { tabla: 'eqim_seguridad.usuarios',             id: 'usuario_id',   columnas: ['foto_perfil'] },
];

const main = async () => {
  if (!process.env.CLOUDINARY_URL) throw new Error('Falta CLOUDINARY_URL en .env');

  // Destino: Neon (NEON_DATABASE_URL o DATABASE_URL); si no hay, la BD local
  const urlDestino = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  const pool = new Pool(urlDestino
    ? { connectionString: urlDestino, ssl: { rejectUnauthorized: true } }
    : { host: process.env.DB_HOST, port: +process.env.DB_PORT, database: process.env.DB_NAME,
        user: process.env.DB_USER, password: process.env.DB_PASSWORD });

  console.log(`\n${DRY_RUN ? '🔎 MODO PRUEBA (no cambia nada)' : '🚀 MIGRANDO'} — BD: ${urlDestino ? 'Neon (remota)' : process.env.DB_NAME}\n`);

  const subidas = new Map();  // url local → url Cloudinary (evita subir dos veces la misma)
  let migradas = 0, faltantes = 0;

  for (const { tabla, id, columnas } of TABLAS) {
    for (const col of columnas) {
      const { rows } = await pool.query(
        `SELECT ${id} AS id, ${col} AS url FROM ${tabla} WHERE ${col} LIKE '/uploads/%'`
      );
      for (const fila of rows) {
        const archivo = path.join(PUBLIC_DIR, fila.url);
        if (!subidas.has(fila.url)) {
          if (!fs.existsSync(archivo)) {
            console.warn(`  ⚠ No existe el archivo ${fila.url} (${tabla} #${fila.id}) — se deja igual`);
            faltantes++;
            continue;
          }
          if (DRY_RUN) {
            subidas.set(fila.url, '(se subiría a Cloudinary)');
          } else {
            const carpeta = fila.url.split('/')[2] || 'varios';   // /uploads/<carpeta>/archivo
            const r = await cloudinary.uploader.upload(archivo, { folder: `qim/${carpeta}`, resource_type: 'image' });
            subidas.set(fila.url, r.secure_url);
          }
        }
        const nueva = subidas.get(fila.url);
        if (!DRY_RUN) {
          await pool.query(`UPDATE ${tabla} SET ${col} = $1 WHERE ${id} = $2`, [nueva, fila.id]);
        }
        migradas++;
        console.log(`  ✔ ${tabla}.${col} #${fila.id}: ${fila.url} → ${nueva}`);
      }
    }
  }

  console.log(`\nListo: ${migradas} URL(s) ${DRY_RUN ? 'por migrar' : 'migradas'}, ${subidas.size} archivo(s) distintos, ${faltantes} faltante(s).\n`);
  await pool.end();
};

main().catch((err) => { console.error('❌', err.message); process.exit(1); });
