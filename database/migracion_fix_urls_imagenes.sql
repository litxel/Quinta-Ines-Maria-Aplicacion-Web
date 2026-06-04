-- =============================================================================
-- MIGRACIÓN: Corregir URLs de imágenes (foto_perfil e imagen_url del catálogo)
-- Ejecutar UNA SOLA VEZ en la base de datos quinta_ines_maria
--
-- Problema: algunas rutas se guardaron sin la barra inicial (/), lo que rompe
-- la URL final (ej: http://localhost:5000uploads/... en lugar de ...5000/uploads/...)
-- La estructura de tablas NO cambia; solo se normalizan los datos existentes.
-- =============================================================================

-- 1. Foto de perfil de usuarios
UPDATE eqim_seguridad.usuarios
SET foto_perfil = '/' || foto_perfil
WHERE foto_perfil IS NOT NULL
  AND foto_perfil <> ''
  AND LEFT(foto_perfil, 1) <> '/';

-- 2. Imágenes del catálogo — estilos de decoración
UPDATE eqim_catalogo.estilos_decoracion
SET imagen_url = '/' || imagen_url
WHERE imagen_url IS NOT NULL
  AND imagen_url <> ''
  AND LEFT(imagen_url, 1) <> '/';

-- 3. Centros de mesa
UPDATE eqim_catalogo.centros_mesa
SET imagen_url = '/' || imagen_url
WHERE imagen_url IS NOT NULL
  AND imagen_url <> ''
  AND LEFT(imagen_url, 1) <> '/';

-- 4. Servicios adicionales / extras
UPDATE eqim_catalogo.servicios_adicionales
SET imagen_url = '/' || imagen_url
WHERE imagen_url IS NOT NULL
  AND imagen_url <> ''
  AND LEFT(imagen_url, 1) <> '/';

-- 5. Verificación
SELECT 'usuarios' AS tabla, COUNT(*) AS urls_sin_barra
FROM eqim_seguridad.usuarios
WHERE foto_perfil IS NOT NULL AND foto_perfil <> '' AND LEFT(foto_perfil, 1) <> '/'
UNION ALL
SELECT 'estilos_decoracion', COUNT(*)
FROM eqim_catalogo.estilos_decoracion
WHERE imagen_url IS NOT NULL AND imagen_url <> '' AND LEFT(imagen_url, 1) <> '/'
UNION ALL
SELECT 'centros_mesa', COUNT(*)
FROM eqim_catalogo.centros_mesa
WHERE imagen_url IS NOT NULL AND imagen_url <> '' AND LEFT(imagen_url, 1) <> '/'
UNION ALL
SELECT 'servicios_adicionales', COUNT(*)
FROM eqim_catalogo.servicios_adicionales
WHERE imagen_url IS NOT NULL AND imagen_url <> '' AND LEFT(imagen_url, 1) <> '/';
