-- =============================================================================
-- MIGRACIÓN: Agregar columna foto_perfil a eqim_seguridad.usuarios
-- Sprint 7 — Perfiles con foto
-- Ejecutar UNA SOLA VEZ en la base de datos quinta_ines_maria
-- =============================================================================

-- 1. Agregar columna foto_perfil (URL de la imagen guardada en el servidor)
ALTER TABLE eqim_seguridad.usuarios 
  ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

COMMENT ON COLUMN eqim_seguridad.usuarios.foto_perfil IS 
  'URL relativa a la foto de perfil del usuario (ej: /uploads/perfiles/uuid.jpg). NULL = usa iniciales.';

-- 2. Verificar que la columna fue agregada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'eqim_seguridad' 
  AND table_name = 'usuarios' 
  AND column_name = 'foto_perfil';
