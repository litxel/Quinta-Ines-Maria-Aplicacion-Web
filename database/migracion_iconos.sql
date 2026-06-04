-- ================================================================
--  MIGRACIÓN: Sistema de Iconos con Lucide React
--  ARCHIVO:   migracion_iconos.sql
--  FECHA:     2026
--  DESCRIPCIÓN:
--    Migrar el sistema de iconos de eqim_catalogo para usar
--    los nombres de los componentes de Lucide React en lugar de
--    cadenas CSS obsoletas y emojis guardados.
-- ================================================================

-- 1. Actualizar tipos_evento existentes con nombres de Lucide
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Gem' WHERE tipo_codigo = 'MATRIMONIO_CIVIL';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Church' WHERE tipo_codigo = 'MATRIMONIO_ECLESIASTICO';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Crown' WHERE tipo_codigo = 'QUINCEANERA';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Baby' WHERE tipo_codigo = 'BAUTIZO';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Cross' WHERE tipo_codigo = 'PRIMERA_COMUNION';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Cake' WHERE tipo_codigo = 'CUMPLEANOS';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'GraduationCap' WHERE tipo_codigo = 'GRADUACION';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Briefcase' WHERE tipo_codigo = 'CONGRESO_EMPRESARIAL';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Heart' WHERE tipo_codigo = 'PEDIDA_MANO';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Users' WHERE tipo_codigo = 'CENA_FAMILIAR';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'Camera' WHERE tipo_codigo = 'SESION_FOTOGRAFICA';
UPDATE eqim_catalogo.tipos_evento SET tipo_icono = 'BookOpen' WHERE tipo_codigo = 'MISA_CAMPAL';

-- Si algún icono no fue actualizado y sigue teniendo formato 'icon-*' o es un emoji, ponemos 'Sparkles' por defecto
UPDATE eqim_catalogo.tipos_evento 
SET tipo_icono = 'Sparkles' 
WHERE tipo_icono LIKE 'icon-%' OR length(tipo_icono) <= 2;

-- 2. Agregar columna icono a estilos_decoracion y actualizar datos
ALTER TABLE eqim_catalogo.estilos_decoracion ADD COLUMN IF NOT EXISTS icono VARCHAR(100);

UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Columns3' WHERE estilo_codigo = 'CLASICO';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'HeartHandshake' WHERE estilo_codigo = 'ROMANTICO';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Sparkles' WHERE estilo_codigo = 'MODERNO';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'TreePine' WHERE estilo_codigo = 'RUSTICO';
UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Palette' WHERE estilo_codigo = 'TEMATICO';

-- 3. Agregar columna icono a centros_mesa y actualizar datos
ALTER TABLE eqim_catalogo.centros_mesa ADD COLUMN IF NOT EXISTS icono VARCHAR(100);

UPDATE eqim_catalogo.centros_mesa SET icono = 'Flower2' WHERE nombre LIKE '%Flores Naturales%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Flower' WHERE nombre LIKE '%Flores Artificiales%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Flame' WHERE nombre LIKE '%Velas%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Diamond' WHERE nombre LIKE '%Modernos%';
UPDATE eqim_catalogo.centros_mesa SET icono = 'Paintbrush' WHERE nombre LIKE '%Personalizado%';

-- 4. Agregar columna icono a servicios_adicionales y actualizar datos
ALTER TABLE eqim_catalogo.servicios_adicionales ADD COLUMN IF NOT EXISTS icono VARCHAR(100);

UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Camera' WHERE categoria = 'FOTOGRAFIA' AND nombre ILIKE '%foto%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Video' WHERE categoria = 'FOTOGRAFIA' AND nombre ILIKE '%video%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Music' WHERE categoria = 'ENTRETENIMIENTO' AND nombre ILIKE '%dj%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Radio' WHERE categoria = 'TECNOLOGIA';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Palette' WHERE categoria = 'DECORACION';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'UserPlus' WHERE categoria = 'PERSONAL';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Cake' WHERE categoria = 'CATERING' AND nombre ILIKE '%torta%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Wine' WHERE categoria = 'CATERING' AND nombre ILIKE '%bebida%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'ImagePlus' WHERE categoria = 'ENTRETENIMIENTO' AND nombre ILIKE '%photo%';
UPDATE eqim_catalogo.servicios_adicionales SET icono = 'PartyPopper' WHERE categoria = 'ENTRETENIMIENTO' AND nombre ILIKE '%animaci%';
