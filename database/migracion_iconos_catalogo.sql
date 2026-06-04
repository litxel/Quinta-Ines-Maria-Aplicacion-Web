-- =============================================================================
-- MIGRACIÓN: Agregar columna 'icono' a tablas de catálogo de decoración
-- Sprint 7 — Soporte para imágenes y íconos separados en el configurador
-- Ejecutar UNA SOLA VEZ en la base de datos quinta_ines_maria
-- =============================================================================

-- 1. estilos_decoracion: agregar columna icono (nombre del ícono Lucide)
ALTER TABLE eqim_catalogo.estilos_decoracion
  ADD COLUMN IF NOT EXISTS icono VARCHAR(100) DEFAULT 'Sparkles';

-- 2. centros_mesa: agregar columna icono
ALTER TABLE eqim_catalogo.centros_mesa
  ADD COLUMN IF NOT EXISTS icono VARCHAR(100) DEFAULT 'Flower2';

-- 3. servicios_adicionales: agregar columna icono
-- (ya tiene imagen_url, ahora separamos el ícono Lucide)
ALTER TABLE eqim_catalogo.servicios_adicionales
  ADD COLUMN IF NOT EXISTS icono VARCHAR(100) DEFAULT 'Star';

-- 4. Actualizar estilos con íconos Lucide apropiados
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Sparkles'   WHERE estilo_codigo = 'CLASICO';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Heart'      WHERE estilo_codigo = 'ROMANTICO';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Zap'        WHERE estilo_codigo = 'MODERNO';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Leaf'       WHERE estilo_codigo = 'RUSTICO';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Crown'      WHERE estilo_codigo = 'TROPICAL' OR estilo_codigo = 'REAL';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Star'       WHERE icono IS NULL OR icono = 'Sparkles';

-- 5. Actualizar centros_mesa con íconos Lucide apropiados
UPDATE eqim_catalogo.centros_mesa SET icono = 'Flower2'         WHERE nombre ILIKE '%flor%natural%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Flower'          WHERE nombre ILIKE '%flor%artif%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Flame'           WHERE nombre ILIKE '%vela%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Hexagon'         WHERE nombre ILIKE '%modern%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Settings'        WHERE nombre ILIKE '%personaliz%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Flower2'         WHERE icono IS NULL OR icono = '';

-- 6. Actualizar servicios_adicionales con íconos Lucide apropiados
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Camera'          WHERE nombre ILIKE '%fotograf%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Video'           WHERE nombre ILIKE '%video%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Music'           WHERE nombre ILIKE '%DJ%' OR nombre ILIKE '%musica%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Wifi'            WHERE nombre ILIKE '%transmis%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Wand2'           WHERE nombre ILIKE '%ambient%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'UserPlus'        WHERE nombre ILIKE '%mesero%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Cake'            WHERE nombre ILIKE '%torta%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Wine'            WHERE nombre ILIKE '%barra%' OR nombre ILIKE '%bebida%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'CameraIcon'      WHERE nombre ILIKE '%photobooth%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'SmilePlus'       WHERE nombre ILIKE '%animac%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Star'            WHERE icono IS NULL OR icono = '';

-- 7. Verificar las columnas añadidas
SELECT 'estilos_decoracion' AS tabla, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'eqim_catalogo' AND table_name = 'estilos_decoracion' AND column_name IN ('icono', 'imagen_url')
UNION ALL
SELECT 'centros_mesa', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'eqim_catalogo' AND table_name = 'centros_mesa' AND column_name IN ('icono', 'imagen_url')
UNION ALL
SELECT 'servicios_adicionales', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'eqim_catalogo' AND table_name = 'servicios_adicionales' AND column_name IN ('icono', 'imagen_url');
