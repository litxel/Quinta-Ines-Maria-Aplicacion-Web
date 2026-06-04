-- ================================================================
--  MIGRACIÓN: Agregar datos del configurador a eqim_solicitudes
--  ARCHIVO:   migracion_solicitudes_config.sql
--  FECHA:     2026
--  DESCRIPCIÓN:
--    Agrega columnas de configuración estética directamente en la
--    tabla de solicitudes y crea la tabla de extras por solicitud.
--    Esto elimina la dependencia del JOIN con eqim_cotizacion_id
--    (que siempre era NULL) y permite al admin ver:
--      - Paleta de colores elegida
--      - Centro de mesa seleccionado
--      - Estilo de decoración
--      - Extras/servicios adicionales
--      - Teléfono del cliente
-- ================================================================

-- 1. Agregar columnas de configuración estética a eqim_solicitudes
ALTER TABLE eqim_solicitudes.eqim_solicitudes
  ADD COLUMN IF NOT EXISTS color_primario    VARCHAR(7),
  ADD COLUMN IF NOT EXISTS color_secundario  VARCHAR(7),
  ADD COLUMN IF NOT EXISTS estilo_deco_id    INTEGER REFERENCES eqim_catalogo.estilos_decoracion(estilo_id),
  ADD COLUMN IF NOT EXISTS centro_mesa_id    INTEGER REFERENCES eqim_catalogo.centros_mesa(centro_id);

-- 2. Crear tabla de extras por solicitud
CREATE TABLE IF NOT EXISTS eqim_solicitudes.solicitud_extras (
    id              SERIAL          PRIMARY KEY,
    solicitud_id    INTEGER         NOT NULL REFERENCES eqim_solicitudes.eqim_solicitudes(solicitud_id) ON DELETE CASCADE,
    adicional_id    INTEGER         REFERENCES eqim_catalogo.servicios_adicionales(adicional_id),
    nombre_snapshot VARCHAR(150)    NOT NULL,
    cantidad        SMALLINT        NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_snapshot NUMERIC(10,2)   NOT NULL DEFAULT 0
);

COMMENT ON TABLE eqim_solicitudes.solicitud_extras 
  IS 'Extras/servicios adicionales seleccionados por el cliente al enviar la solicitud';

CREATE INDEX IF NOT EXISTS idx_sol_extras_solicitud 
  ON eqim_solicitudes.solicitud_extras(solicitud_id);

-- 3. Eliminar el UNIQUE constraint en (solicitud_id, adicional_id)
--    ya que adicional_id puede ser NULL lo que causa problemas con Postgres
ALTER TABLE eqim_solicitudes.solicitud_extras 
  DROP CONSTRAINT IF EXISTS solicitud_extras_solicitud_id_adicional_id_key;

-- 4. Verificar estructura resultante de eqim_solicitudes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'eqim_solicitudes' 
  AND table_name = 'eqim_solicitudes'
ORDER BY ordinal_position;

-- 5. Verificar que se creó la tabla solicitud_extras
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'eqim_solicitudes';
