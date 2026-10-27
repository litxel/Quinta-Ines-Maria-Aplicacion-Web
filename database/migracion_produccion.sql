-- ================================================================
--  MIGRACIÓN: Ajustes previos a producción
--  ARCHIVO:   migracion_produccion.sql
--  FECHA:     2026-10-24 (actualizada 2026-10-26)
--  DESCRIPCIÓN:
--    1. Corrige textos guardados con doble codificación (Ã³ → ó) en
--       catálogos internos (estados de solicitud y roles).
--    2. Quita un carácter invisible (guion suave, U+00AD = chr(173))
--       pegado en los nombres de algunos extras ("Fotografí­a").
--    3. Índice para la consulta de reseñas recientes por usuario.
--  Es seguro ejecutarla más de una vez.
-- ================================================================

BEGIN;

-- 1. Textos con doble codificación UTF-8 (p. ej. "aÃºn" → "aún")
UPDATE eqim_solicitudes.estados
SET descripcion = convert_from(convert_to(descripcion, 'LATIN1'), 'UTF8')
WHERE descripcion ~ 'Ã';

UPDATE eqim_solicitudes.estados
SET nombre = convert_from(convert_to(nombre, 'LATIN1'), 'UTF8')
WHERE nombre ~ 'Ã';

UPDATE eqim_seguridad.roles
SET rol_descripcion = convert_from(convert_to(rol_descripcion, 'LATIN1'), 'UTF8')
WHERE rol_descripcion ~ 'Ã';

-- 2. Guion suave invisible en nombres de extras
UPDATE eqim_catalogo.servicios_adicionales
SET nombre = replace(nombre, chr(173), '')
WHERE strpos(nombre, chr(173)) > 0;

UPDATE eqim_solicitudes.solicitud_extras
SET nombre_snapshot = replace(nombre_snapshot, chr(173), '')
WHERE strpos(nombre_snapshot, chr(173)) > 0;

-- 3. Índice para el límite anti-spam de reseñas
CREATE INDEX IF NOT EXISTS idx_resenias_usuario_fecha
  ON eqim_catalogo.resenias (usuario_id, creado_en DESC);

COMMIT;

-- Verificación
SELECT codigo, nombre, descripcion FROM eqim_solicitudes.estados ORDER BY orden;
