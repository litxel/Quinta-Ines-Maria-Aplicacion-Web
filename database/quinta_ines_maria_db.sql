-- ================================================================
--  BASE DE DATOS: quinta_ines_maria
--  PROYECTO : Aplicación Web Interactiva para Planificación y
--             Personalización de Eventos - Quinta Inés María
--  AUTOR    : Gerardo Jesus Barreno Flores
--  VERSIÓN  : 1.0
--  FECHA    : 2026
--  ESTÁNDAR : ISO/IEC 25010:2023 | IEEE Std 830-1998
-- ================================================================
--
--  ARQUITECTURA DE ESQUEMAS (sin tablas en schema public):
--
--   EQIM_seguridad     → Usuarios, roles, sesiones, permisos
--   EQIM_catalogo      → Paquetes, servicios, tipos de evento, decoración
--   EQIM_galeria       → Imágenes, videos, categorías multimedia
--   EQIM_configurador  → Configuraciones de evento, sugerencias IA
--   EQIM_cotizacion    → EQIM_cotizaciones generadas y detalles
--   EQIM_solicitudes   → EQIM_solicitudes de reserva, disponibilidad, estados
--   EQIM_notificaciones→ Log de correos enviados, plantillas
--   EQIM_auditoria     → Registro de todas las operaciones del sistema
--
-- ================================================================

-- ================================================================
-- 0. PREPARACIÓN – EXTENSIONES Y BASE
-- ================================================================
-- Ejecutar como superusuario de PostgreSQL
-- \c postgres   (conectar a postgres si aún no estás)

-- Crear base de datos
CREATE DATABASE quinta_ines_maria
    WITH ENCODING      = 'UTF8'
         LC_COLLATE    = 'es_EC.UTF-8'
         LC_CTYPE      = 'es_EC.UTF-8'
         TEMPLATE      = template0
         CONNECTION LIMIT = 100;

-- Conectar a la base
\c quinta_ines_maria

-- Habilitar extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUIDs seguros
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- Funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Búsqueda de texto difuso

-- ================================================================
-- 1. EQIM_seguridad: REVOCAR PERMISOS DEL SCHEMA PUBLIC
-- ================================================================
-- Nadie puede crear objetos en public ni conectarse sin permiso explícito
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL    ON DATABASE quinta_ines_maria FROM PUBLIC;

-- ================================================================
-- 2. ROLES DE APLICACIÓN (principio de mínimo privilegio)
-- ================================================================

-- Rol de solo lectura para reportes / BI
CREATE ROLE qim_readonly NOLOGIN;

-- Rol del backend de la aplicación (API Node.js)
CREATE ROLE qim_app NOLOGIN;

-- Rol del administrador de la base de datos (DBA)
CREATE ROLE qim_dba NOLOGIN;

-- Usuarios de login (con contraseña cifrada con scram-sha-256)
CREATE USER app_backend     WITH PASSWORD 'App_B@ck3nd_2026!' NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 50;
CREATE USER app_readonly_bi WITH PASSWORD 'R3@dOnly_BI_2026!' NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 10;
CREATE USER app_dba_gerardo WITH PASSWORD 'DB@_G3r@rd0_2026!' NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 5;

-- Asignar roles a usuarios
GRANT qim_app      TO app_backend;
GRANT qim_readonly TO app_readonly_bi;
GRANT qim_dba      TO app_dba_gerardo;

-- Permiso de conexión
GRANT CONNECT ON DATABASE quinta_ines_maria TO qim_app, qim_readonly, qim_dba;

-- ================================================================
-- 3. CREACIÓN DE SCHEMAS
-- ================================================================

CREATE SCHEMA EQIM_seguridad;
CREATE SCHEMA EQIM_catalogo;
CREATE SCHEMA EQIM_galeria;
CREATE SCHEMA EQIM_configurador;
CREATE SCHEMA EQIM_cotizacion;
CREATE SCHEMA EQIM_solicitudes;
CREATE SCHEMA EQIM_notificaciones;
CREATE SCHEMA EQIM_auditoria;

-- Comentarios de schemas
COMMENT ON SCHEMA EQIM_seguridad      IS 'Usuarios, roles, sesiones y autenticación';
COMMENT ON SCHEMA EQIM_catalogo       IS 'Paquetes, servicios adicionales y tipos de evento';
COMMENT ON SCHEMA EQIM_galeria        IS 'Imágenes y videos de la galería multimedia';
COMMENT ON SCHEMA EQIM_configurador   IS 'Configuraciones de eventos y componente IA';
COMMENT ON SCHEMA EQIM_cotizacion     IS 'EQIM_cotizaciones generadas y su detalle';
COMMENT ON SCHEMA EQIM_solicitudes    IS 'EQIM_solicitudes de reserva y disponibilidad';
COMMENT ON SCHEMA EQIM_notificaciones IS 'Log de EQIM_notificaciones y plantillas de correo';
COMMENT ON SCHEMA EQIM_auditoria      IS 'Registro de auditoría de todas las operaciones';

-- ================================================================
-- 4. PERMISOS POR SCHEMA
-- ================================================================

-- qim_app: acceso total a todos los schemas operacionales
GRANT USAGE ON SCHEMA EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador,
                      EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria
      TO qim_app;

-- qim_readonly: solo lectura en schemas de negocio
GRANT USAGE ON SCHEMA EQIM_catalogo, EQIM_galeria, EQIM_cotizacion, EQIM_solicitudes, EQIM_auditoria
      TO qim_readonly;

-- qim_dba: acceso completo
GRANT ALL ON SCHEMA EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador, 
                      EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria 
      TO qim_dba;

-- ================================================================
-- 5. SCHEMA: EQIM_seguridad
-- ================================================================

-- ----------------------------------------------------
-- 5.1 Roles del sistema (no confundir con roles de DB)
-- ----------------------------------------------------
CREATE TABLE EQIM_seguridad.roles (
    rol_id          SERIAL          PRIMARY KEY,
    rol_codigo      VARCHAR(50)     NOT NULL UNIQUE,        -- 'ADMIN', 'CLIENTE', 'VISITANTE'
    rol_nombre      VARCHAR(100)    NOT NULL,
    rol_descripcion TEXT,
    rol_activo      BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_seguridad.roles IS 'Roles del sistema: ADMIN, CLIENTE';

-- ----------------------------------------------------
-- 5.2 Usuarios del sistema
-- ----------------------------------------------------
CREATE TABLE EQIM_seguridad.usuarios (
    usuario_id          SERIAL          PRIMARY KEY,
    usuario_uuid        UUID            NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    nombre_completo     VARCHAR(150)    NOT NULL,
    correo              VARCHAR(255)    NOT NULL UNIQUE,
    correo_verificado   BOOLEAN         NOT NULL DEFAULT FALSE,
    telefono            VARCHAR(20),
    password_hash       TEXT            NOT NULL,     -- bcrypt hash (cost >= 12)
    rol_id              INTEGER         NOT NULL REFERENCES EQIM_seguridad.roles(rol_id),
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    intentos_fallidos   SMALLINT        NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
    bloqueado_hasta     TIMESTAMPTZ,                  -- NULL = no bloqueado
    ultimo_login        TIMESTAMPTZ,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_seguridad.usuarios IS 'Usuarios registrados: clientes y administradores';
COMMENT ON COLUMN EQIM_seguridad.usuarios.password_hash IS 'Hash bcrypt con cost factor >= 12. Nunca almacenar texto plano';
COMMENT ON COLUMN EQIM_seguridad.usuarios.usuario_uuid  IS 'UUID público expuesto en la API, nunca el ID interno';

-- ----------------------------------------------------
-- 5.3 Tokens de verificación y recuperación
-- ----------------------------------------------------
CREATE TABLE EQIM_seguridad.tokens (
    token_id        SERIAL          PRIMARY KEY,
    usuario_id      INTEGER         NOT NULL REFERENCES EQIM_seguridad.usuarios(usuario_id) ON DELETE CASCADE,
    token_hash      TEXT            NOT NULL UNIQUE,   -- SHA-256 del token enviado al usuario
    tipo            VARCHAR(30)     NOT NULL
                        CHECK (tipo IN ('VERIFICACION_CORREO', 'RESET_PASSWORD', 'REFRESH_JWT')),
    expira_en       TIMESTAMPTZ     NOT NULL,
    usado           BOOLEAN         NOT NULL DEFAULT FALSE,
    ip_origen       INET,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_seguridad.tokens IS 'Tokens de verificación de correo, reset de contraseña y refresh JWT';
COMMENT ON COLUMN EQIM_seguridad.tokens.token_hash IS 'Se almacena el hash del token, nunca el token en texto claro';

-- Index para buscar token activo rápidamente
CREATE INDEX idx_tokens_hash_tipo ON EQIM_seguridad.tokens(token_hash, tipo) WHERE NOT usado;
CREATE INDEX idx_tokens_usuario    ON EQIM_seguridad.tokens(usuario_id);

-- ----------------------------------------------------
-- 5.4 Sesiones activas (blacklist de JWTs revocados)
-- ----------------------------------------------------
CREATE TABLE EQIM_seguridad.sesiones_revocadas (
    jti             UUID            PRIMARY KEY,          -- JWT ID (claim 'jti')
    usuario_id      INTEGER         NOT NULL REFERENCES EQIM_seguridad.usuarios(usuario_id),
    revocado_en     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expira_en       TIMESTAMPTZ     NOT NULL,             -- Para limpieza automática
    motivo          VARCHAR(50)     CHECK (motivo IN ('LOGOUT', 'CAMBIO_PASSWORD', 'ADMIN_REVOKE'))
);
COMMENT ON TABLE EQIM_seguridad.sesiones_revocadas IS 'Blacklist de JWTs revocados antes de su expiración natural';
CREATE INDEX idx_sesiones_jti     ON EQIM_seguridad.sesiones_revocadas(jti);
CREATE INDEX idx_sesiones_expira  ON EQIM_seguridad.sesiones_revocadas(expira_en);

-- ================================================================
-- 6. SCHEMA: EQIM_catalogo
-- ================================================================

-- ----------------------------------------------------
-- 6.1 Tipos de evento
-- ----------------------------------------------------
CREATE TABLE EQIM_catalogo.tipos_evento (
    tipo_id         SERIAL          PRIMARY KEY,
    tipo_codigo     VARCHAR(50)     NOT NULL UNIQUE,
    tipo_nombre     VARCHAR(100)    NOT NULL,
    tipo_icono      VARCHAR(100),                   -- Nombre del icono / clase CSS
    descripcion     TEXT,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    orden_display   SMALLINT        NOT NULL DEFAULT 0,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_catalogo.tipos_evento IS 'Tipos de evento: Matrimonio, Quinceañera, Bautizo, etc.';

-- Datos iniciales tipos de evento
INSERT INTO EQIM_catalogo.tipos_evento (tipo_codigo, tipo_nombre, tipo_icono, orden_display) VALUES
    ('MATRIMONIO_CIVIL',       'Matrimonio Civil',         'icon-rings',      1),
    ('MATRIMONIO_ECLESIASTICO','Matrimonio Eclesiástico',  'icon-church',     2),
    ('QUINCEANERA',            'Quinceañera',              'icon-tiara',      3),
    ('BAUTIZO',                'Bautizo',                  'icon-baby',       4),
    ('PRIMERA_COMUNION',       'Primera Comunión',         'icon-cross',      5),
    ('CUMPLEANOS',             'Cumpleaños',               'icon-cake',       6),
    ('GRADUACION',             'Graduación',               'icon-graduation', 7),
    ('CONGRESO_EMPRESARIAL',   'Congreso Empresarial',     'icon-business',   8),
    ('PEDIDA_MANO',            'Pedida de Mano',           'icon-ring',       9),
    ('CENA_FAMILIAR',          'Cena Familiar',            'icon-family',    10),
    ('SESION_FOTOGRAFICA',     'Sesión Fotográfica',       'icon-camera',    11),
    ('MISA_CAMPAL',            'Misa Campal',              'icon-altar',     12);

-- ----------------------------------------------------
-- 6.2 Paquetes de servicio
-- ----------------------------------------------------
CREATE TABLE EQIM_catalogo.paquetes (
    paquete_id          SERIAL          PRIMARY KEY,
    paquete_codigo      VARCHAR(30)     NOT NULL UNIQUE,   -- 'BRONCE', 'SILVER', etc.
    paquete_nombre      VARCHAR(100)    NOT NULL,
    descripcion         TEXT            NOT NULL,
    precio_persona      NUMERIC(10,2)   NOT NULL CHECK (precio_persona > 0),
    minimo_invitados    INTEGER         NOT NULL DEFAULT 100 CHECK (minimo_invitados >= 100),
    maximo_invitados    INTEGER         CHECK (maximo_invitados IS NULL OR maximo_invitados >= minimo_invitados),
    color_principal     VARCHAR(7),                        -- HEX color para UI
    imagen_url          VARCHAR(500),
    destacado           BOOLEAN         NOT NULL DEFAULT FALSE,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    orden_display       SMALLINT        NOT NULL DEFAULT 0,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_catalogo.paquetes IS 'Paquetes de servicio: Bronce, Silver, Gold, Promo Corporativa, Alfombra Roja';

-- Datos iniciales paquetes
INSERT INTO EQIM_catalogo.paquetes (paquete_codigo, paquete_nombre, descripcion, precio_persona, color_principal, orden_display) VALUES
    ('BRONCE',     'Bronce',           'Paquete básico con servicios esenciales para eventos íntimos.', 15.00, '#CD7F32', 1),
    ('SILVER',     'Silver',           'Paquete intermedio con decoración mejorada y servicios ampliados.', 22.00, '#C0C0C0', 2),
    ('GOLD',       'Gold',             'Paquete premium con todos los servicios incluidos y decoración de lujo.', 35.00, '#FFD700', 3),
    ('CORPORATIVO','Promo Corporativa','Diseñado para congresos, reuniones y eventos empresariales.', 28.00, '#1F3864', 4),
    ('ALFOMBRA',   'Alfombra Roja',    'Paquete exclusivo de máximo lujo para celebraciones únicas e irrepetibles.', 55.00, '#8B0000', 5);

-- ----------------------------------------------------
-- 6.3 Servicios incluidos en cada paquete
-- ----------------------------------------------------
CREATE TABLE EQIM_catalogo.paquete_servicios (
    servicio_id     SERIAL          PRIMARY KEY,
    paquete_id      INTEGER         NOT NULL REFERENCES EQIM_catalogo.paquetes(paquete_id) ON DELETE CASCADE,
    nombre_servicio VARCHAR(200)    NOT NULL,
    descripcion     TEXT,
    icono           VARCHAR(100),
    orden_display   SMALLINT        NOT NULL DEFAULT 0
);
COMMENT ON TABLE EQIM_catalogo.paquete_servicios IS 'Servicios incluidos en cada paquete (uso de instalaciones, audio, etc.)';
CREATE INDEX idx_pqservicio_paquete ON EQIM_catalogo.paquete_servicios(paquete_id);

-- ----------------------------------------------------
-- 6.4 Servicios adicionales (del EQIM_configurador)
-- ----------------------------------------------------
CREATE TABLE EQIM_catalogo.servicios_adicionales (
    adicional_id    SERIAL          PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    descripcion     TEXT,
    precio_unitario NUMERIC(10,2)   NOT NULL CHECK (precio_unitario >= 0),
    unidad          VARCHAR(30)     NOT NULL DEFAULT 'evento'
                        CHECK (unidad IN ('evento', 'persona', 'hora', 'unidad')),
    categoria       VARCHAR(50),                           -- 'ENTRETENIMIENTO', 'FOTOGRAFIA', etc.
    imagen_url      VARCHAR(500),
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_catalogo.servicios_adicionales IS 'Servicios opcionales del EQIM_configurador: DJ, fotografía, transmisión, etc.';

INSERT INTO EQIM_catalogo.servicios_adicionales (nombre, descripcion, precio_unitario, unidad, categoria) VALUES
    ('Fotografía Profesional',    'Fotógrafo profesional con equipo y álbum digital.',     250.00, 'evento',    'FOTOGRAFIA'),
    ('Videografía Profesional',   'Video completo del evento con edición incluida.',        350.00, 'evento',    'FOTOGRAFIA'),
    ('DJ Profesional',            'DJ con equipo de sonido y luz por 6 horas.',             200.00, 'evento',    'ENTRETENIMIENTO'),
    ('Transmisión en Vivo',       'Transmisión en tiempo real por plataforma digital.',     180.00, 'evento',    'TECNOLOGIA'),
    ('Ambientación Especial',     'Decoración temática personalizada adicional.',            150.00, 'evento',    'DECORACION'),
    ('Mesero Adicional',          'Mesero adicional por evento.',                            80.00, 'unidad',    'PERSONAL'),
    ('Torta Personalizada',       'Torta artística personalizada hasta 100 porciones.',     120.00, 'evento',    'CATERING'),
    ('Barra de Bebidas Premium',  'Barra libre con bebidas premium por 4 horas.',           300.00, 'evento',    'CATERING'),
    ('Photobooth',                'Cabina fotográfica con accesorios y impresión.',          100.00, 'evento',    'ENTRETENIMIENTO'),
    ('Animación Infantil',        'Animador para niños con juegos y actividades.',           120.00, 'evento',    'ENTRETENIMIENTO');

-- ----------------------------------------------------
-- 6.5 Estilos de decoración
-- ----------------------------------------------------
CREATE TABLE EQIM_catalogo.estilos_decoracion (
    estilo_id       SERIAL          PRIMARY KEY,
    estilo_codigo   VARCHAR(50)     NOT NULL UNIQUE,
    nombre          VARCHAR(100)    NOT NULL,
    descripcion     TEXT,
    imagen_url      VARCHAR(500),
    costo_adicional NUMERIC(10,2)   NOT NULL DEFAULT 0.00, -- Por persona
    activo          BOOLEAN         NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE EQIM_catalogo.estilos_decoracion IS 'Estilos de decoración disponibles en el EQIM_configurador';

INSERT INTO EQIM_catalogo.estilos_decoracion (estilo_codigo, nombre, descripcion, costo_adicional) VALUES
    ('CLASICO',     'Clásico',              'Elegante y atemporal con líneas limpias y colores neutros.',        0.00),
    ('ROMANTICO',   'Romántico',            'Flores, velas y detalles suaves en tonos pastel y dorados.',        2.00),
    ('MODERNO',     'Moderno',              'Diseño contemporáneo con materiales actuales y colores vibrantes.',  3.00),
    ('RUSTICO',     'Rústico',              'Naturaleza, madera y elementos orgánicos con calidez campestre.',   2.50),
    ('TEMATICO',    'Temático Personalizado','Decoración completamente adaptada al tema elegido por el cliente.', 5.00);

-- ----------------------------------------------------
-- 6.6 Tipos de centros de mesa
-- ----------------------------------------------------
CREATE TABLE EQIM_catalogo.centros_mesa (
    centro_id       SERIAL          PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    descripcion     TEXT,
    imagen_url      VARCHAR(500),
    costo_por_mesa  NUMERIC(10,2)   NOT NULL DEFAULT 0.00,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE EQIM_catalogo.centros_mesa IS 'Tipos de centros de mesa para el EQIM_configurador';

INSERT INTO EQIM_catalogo.centros_mesa (nombre, descripcion, costo_por_mesa) VALUES
    ('Flores Naturales',     'Arreglo de flores naturales de temporada.',                   15.00),
    ('Flores Artificiales',  'Arreglo de flores artificiales de alta calidad.',              8.00),
    ('Arreglos con Velas',   'Composición elegante con velas y elementos decorativos.',     12.00),
    ('Arreglos Modernos',    'Diseño moderno con cristales, ramas y elementos geométricos.',18.00),
    ('Personalizado',        'Centro de mesa completamente personalizado según el cliente.', 25.00);

-- ================================================================
-- 7. SCHEMA: EQIM_galeria
-- ================================================================

-- ----------------------------------------------------
-- 7.1 Categorías de la galería
-- ----------------------------------------------------
CREATE TABLE EQIM_galeria.categorias (
    categoria_id    SERIAL          PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL UNIQUE,
    slug            VARCHAR(100)    NOT NULL UNIQUE,
    descripcion     TEXT,
    orden_display   SMALLINT        NOT NULL DEFAULT 0,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE EQIM_galeria.categorias IS 'Categorías de filtrado de la galería multimedia';

INSERT INTO EQIM_galeria.categorias (nombre, slug, orden_display) VALUES
    ('Todos',               'todos',          0),
    ('Matrimonios',         'matrimonios',    1),
    ('Quinceañeras',        'quinceaneras',   2),
    ('Bautizos',            'bautizos',       3),
    ('Graduaciones',        'graduaciones',   4),
    ('Empresariales',       'empresariales',  5),
    ('Otros',               'otros',          6);

-- ----------------------------------------------------
-- 7.2 Imágenes de la galería
-- ----------------------------------------------------
CREATE TABLE EQIM_galeria.imagenes (
    imagen_id       SERIAL          PRIMARY KEY,
    categoria_id    INTEGER         NOT NULL REFERENCES EQIM_galeria.categorias(categoria_id),
    titulo          VARCHAR(200),
    descripcion     TEXT,
    url_original    VARCHAR(500)    NOT NULL,
    url_thumbnail   VARCHAR(500)    NOT NULL,
    url_webp        VARCHAR(500),                          -- Versión optimizada WebP
    alt_text        VARCHAR(300),                          -- Accesibilidad
    tamanio_bytes   INTEGER         CHECK (tamanio_bytes > 0),
    ancho_px        SMALLINT,
    alto_px         SMALLINT,
    formato         VARCHAR(10)     CHECK (formato IN ('JPG','PNG','WEBP','GIF')),
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    destacada       BOOLEAN         NOT NULL DEFAULT FALSE,
    orden_display   INTEGER         NOT NULL DEFAULT 0,
    subido_por      INTEGER         REFERENCES EQIM_seguridad.usuarios(usuario_id),
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_galeria.imagenes IS 'Fotografías de la galería de eventos';
CREATE INDEX idx_EQIM_galeria_categoria ON EQIM_galeria.imagenes(categoria_id) WHERE activo = TRUE;
CREATE INDEX idx_EQIM_galeria_destacada  ON EQIM_galeria.imagenes(destacada) WHERE activo = TRUE;

-- ----------------------------------------------------
-- 7.3 Videos de la galería
-- ----------------------------------------------------
CREATE TABLE EQIM_galeria.videos (
    video_id        SERIAL          PRIMARY KEY,
    categoria_id    INTEGER         NOT NULL REFERENCES EQIM_galeria.categorias(categoria_id),
    titulo          VARCHAR(200)    NOT NULL,
    descripcion     TEXT,
    tipo_fuente     VARCHAR(20)     NOT NULL
                        CHECK (tipo_fuente IN ('YOUTUBE', 'VIMEO', 'HTML5')),
    url_video       VARCHAR(500)    NOT NULL,
    url_thumbnail   VARCHAR(500),
    duracion_seg    INTEGER         CHECK (duracion_seg > 0),
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    orden_display   INTEGER         NOT NULL DEFAULT 0,
    subido_por      INTEGER         REFERENCES EQIM_seguridad.usuarios(usuario_id),
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_galeria.videos IS 'Videos de eventos (YouTube, Vimeo o HTML5 nativo)';
CREATE INDEX idx_videos_categoria ON EQIM_galeria.videos(categoria_id) WHERE activo = TRUE;

-- ================================================================
-- 8. SCHEMA: EQIM_configurador
-- ================================================================

-- ----------------------------------------------------
-- 8.1 Sesiones del EQIM_configurador
-- ----------------------------------------------------
CREATE TABLE EQIM_configurador.sesiones (
    sesion_id           SERIAL          PRIMARY KEY,
    sesion_uuid         UUID            NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    usuario_id          INTEGER         REFERENCES EQIM_seguridad.usuarios(usuario_id),  -- NULL si es visitante
    ip_origen           INET,
    user_agent          TEXT,
    tipo_evento_id      INTEGER         REFERENCES EQIM_catalogo.tipos_evento(tipo_id),
    paquete_id          INTEGER         REFERENCES EQIM_catalogo.paquetes(paquete_id),
    num_invitados       INTEGER         CHECK (num_invitados IS NULL OR num_invitados >= 100),
    color_primario      VARCHAR(7),      -- HEX
    color_secundario    VARCHAR(7),      -- HEX
    estilo_deco_id      INTEGER         REFERENCES EQIM_catalogo.estilos_decoracion(estilo_id),
    centro_mesa_id      INTEGER         REFERENCES EQIM_catalogo.centros_mesa(centro_id),
    num_mesas           SMALLINT        CHECK (num_mesas IS NULL OR num_mesas > 0),
    num_meseros         SMALLINT        CHECK (num_meseros IS NULL OR num_meseros > 0),
    paso_actual         SMALLINT        NOT NULL DEFAULT 1 CHECK (paso_actual BETWEEN 1 AND 9),
    completada          BOOLEAN         NOT NULL DEFAULT FALSE,
    precio_estimado     NUMERIC(12,2),
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expira_en           TIMESTAMPTZ     NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);
COMMENT ON TABLE EQIM_configurador.sesiones IS 'Sesiones activas del EQIM_configurador interactivo de eventos';
CREATE INDEX idx_conf_sesion_uuid    ON EQIM_configurador.sesiones(sesion_uuid);
CREATE INDEX idx_conf_sesion_usuario ON EQIM_configurador.sesiones(usuario_id) WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_conf_sesion_expira  ON EQIM_configurador.sesiones(expira_en) WHERE NOT completada;

-- ----------------------------------------------------
-- 8.2 Servicios adicionales seleccionados en la sesión
-- ----------------------------------------------------
CREATE TABLE EQIM_configurador.sesion_servicios (
    sesion_id       INTEGER         NOT NULL REFERENCES EQIM_configurador.sesiones(sesion_id) ON DELETE CASCADE,
    adicional_id    INTEGER         NOT NULL REFERENCES EQIM_catalogo.servicios_adicionales(adicional_id),
    cantidad        SMALLINT        NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_snapshot NUMERIC(10,2)   NOT NULL,              -- Precio en el momento de selección
    PRIMARY KEY (sesion_id, adicional_id)
);
COMMENT ON TABLE EQIM_configurador.sesion_servicios IS 'Servicios adicionales seleccionados en cada sesión del EQIM_configurador';

-- ----------------------------------------------------
-- 8.3 Sugerencias del Asistente IA (RF-43, RF-44) ✦
-- ----------------------------------------------------
CREATE TABLE EQIM_configurador.sugerencias_ia (
    sugerencia_id   SERIAL          PRIMARY KEY,
    sesion_id       INTEGER         NOT NULL REFERENCES EQIM_configurador.sesiones(sesion_id) ON DELETE CASCADE,
    paso_EQIM_configurador SMALLINT      NOT NULL CHECK (paso_EQIM_configurador BETWEEN 1 AND 9),
    campo_objetivo  VARCHAR(50)     NOT NULL,    -- 'COLORES', 'DECORACION', 'CENTRO_MESA', etc.
    prompt_enviado  TEXT,                        -- Prompt que se envió a la API (sin datos personales)
    respuesta_ia    JSONB,                       -- JSON completo retornado por la API
    sugerencia_1    TEXT,                        -- Opción sugerida 1
    razon_1         TEXT,                        -- Razón de la sugerencia 1
    compatibilidad_1 VARCHAR(10)    CHECK (compatibilidad_1 IN ('alta','media','baja')),
    sugerencia_2    TEXT,
    razon_2         TEXT,
    compatibilidad_2 VARCHAR(10)    CHECK (compatibilidad_2 IN ('alta','media','baja')),
    sugerencia_3    TEXT,
    razon_3         TEXT,
    compatibilidad_3 VARCHAR(10)    CHECK (compatibilidad_3 IN ('alta','media','baja')),
    aplicada        BOOLEAN         NOT NULL DEFAULT FALSE,
    sugerencia_aplicada VARCHAR(10) CHECK (sugerencia_aplicada IN ('1','2','3')),
    tiempo_respuesta_ms INTEGER,               -- Para monitoreo de rendimiento RNF-19
    modelo_ia       VARCHAR(100),              -- claude-sonnet-4 / gpt-4o
    tokens_usados   INTEGER,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_configurador.sugerencias_ia IS '✦ IA – Sugerencias generadas por el Asistente IA para cada paso del EQIM_configurador (RF-43, RF-44)';
COMMENT ON COLUMN EQIM_configurador.sugerencias_ia.prompt_enviado IS 'NUNCA contiene datos personales del usuario (RNF-20)';
CREATE INDEX idx_ia_sesion_paso ON EQIM_configurador.sugerencias_ia(sesion_id, paso_EQIM_configurador);

-- ----------------------------------------------------
-- 8.4 Descripciones narrativas generadas por IA (RF-45) ✦
-- ----------------------------------------------------
CREATE TABLE EQIM_configurador.descripciones_ia (
    descripcion_id      SERIAL          PRIMARY KEY,
    sesion_id           INTEGER         NOT NULL REFERENCES EQIM_configurador.sesiones(sesion_id) ON DELETE CASCADE,
    descripcion_texto   TEXT            NOT NULL,
    regeneracion_num    SMALLINT        NOT NULL DEFAULT 1 CHECK (regeneracion_num BETWEEN 1 AND 3),
    aceptada            BOOLEAN         NOT NULL DEFAULT FALSE,
    editada_por_usuario BOOLEAN         NOT NULL DEFAULT FALSE,
    texto_editado       TEXT,                    -- Si el usuario modificó la descripción
    modelo_ia           VARCHAR(100),
    tokens_usados       INTEGER,
    tiempo_respuesta_ms INTEGER,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_configurador.descripciones_ia IS '✦ IA – Descripciones narrativas generadas por IA para el resumen del evento (RF-45)';
CREATE INDEX idx_desc_ia_sesion ON EQIM_configurador.descripciones_ia(sesion_id);

-- ================================================================
-- 9. SCHEMA: EQIM_cotizacion
-- ================================================================

-- ----------------------------------------------------
-- 9.1 EQIM_cotizaciones
-- ----------------------------------------------------
CREATE TABLE EQIM_cotizacion.EQIM_cotizaciones (
    EQIM_cotizacion_id       SERIAL          PRIMARY KEY,
    EQIM_cotizacion_uuid     UUID            NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    numero_EQIM_cotizacion   VARCHAR(20)     NOT NULL UNIQUE,   -- QIM-2026-000001
    sesion_id           INTEGER         NOT NULL REFERENCES EQIM_configurador.sesiones(sesion_id),
    usuario_id          INTEGER         REFERENCES EQIM_seguridad.usuarios(usuario_id),
    correo_envio        VARCHAR(255),                      -- Correo donde se envió

    -- Snapshot del evento
    tipo_evento_id      INTEGER         REFERENCES EQIM_catalogo.tipos_evento(tipo_id),
    paquete_id          INTEGER         REFERENCES EQIM_catalogo.paquetes(paquete_id),
    num_invitados       INTEGER         NOT NULL CHECK (num_invitados >= 100),
    num_mesas           SMALLINT,
    num_meseros         SMALLINT,
    color_primario      VARCHAR(7),
    color_secundario    VARCHAR(7),
    estilo_deco_id      INTEGER         REFERENCES EQIM_catalogo.estilos_decoracion(estilo_id),
    centro_mesa_id      INTEGER         REFERENCES EQIM_catalogo.centros_mesa(centro_id),

    -- Descripción IA
    descripcion_narrativa TEXT,                           -- Generada por IA (RF-45)

    -- Precios
    precio_paquete_persona NUMERIC(10,2) NOT NULL,
    subtotal_paquete    NUMERIC(12,2)   NOT NULL,
    subtotal_adicionales NUMERIC(12,2)  NOT NULL DEFAULT 0.00,
    subtotal_mesas      NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    descuento           NUMERIC(10,2)   NOT NULL DEFAULT 0.00,
    subtotal            NUMERIC(12,2)   NOT NULL,
    impuesto_pct        NUMERIC(5,2)    NOT NULL DEFAULT 0.00,
    impuesto_valor      NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    total               NUMERIC(12,2)   NOT NULL,

    -- Estado
    estado              VARCHAR(20)     NOT NULL DEFAULT 'GENERADA'
                            CHECK (estado IN ('GENERADA','ENVIADA','CONVERTIDA','EXPIRADA')),
    valida_hasta        TIMESTAMPTZ     NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
    pdf_url             VARCHAR(500),                      -- URL del PDF generado
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_cotizacion.EQIM_cotizaciones IS 'EQIM_cotizaciones generadas en el EQIM_configurador (RF-17)';
CREATE INDEX idx_cot_usuario   ON EQIM_cotizacion.EQIM_cotizaciones(usuario_id) WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_cot_estado    ON EQIM_cotizacion.EQIM_cotizaciones(estado);
CREATE INDEX idx_cot_numero    ON EQIM_cotizacion.EQIM_cotizaciones(numero_EQIM_cotizacion);

-- Secuencia para número de cotización
CREATE SEQUENCE EQIM_cotizacion.seq_numero_EQIM_cotizacion START 1 INCREMENT 1 MINVALUE 1 NO CYCLE;

-- Función para generar número de cotización
CREATE OR REPLACE FUNCTION EQIM_cotizacion.generar_numero()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_EQIM_cotizacion := 'QIM-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                              LPAD(NEXTVAL('EQIM_cotizacion.seq_numero_EQIM_cotizacion')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_EQIM_cotizacion_numero
    BEFORE INSERT ON EQIM_cotizacion.EQIM_cotizaciones
    FOR EACH ROW EXECUTE FUNCTION EQIM_cotizacion.generar_numero();

-- ----------------------------------------------------
-- 9.2 Detalle de servicios adicionales de la cotización
-- ----------------------------------------------------
CREATE TABLE EQIM_cotizacion.EQIM_cotizacion_adicionales (
    id              SERIAL          PRIMARY KEY,
    EQIM_cotizacion_id   INTEGER         NOT NULL REFERENCES EQIM_cotizacion.EQIM_cotizaciones(EQIM_cotizacion_id) ON DELETE CASCADE,
    adicional_id    INTEGER         NOT NULL REFERENCES EQIM_catalogo.servicios_adicionales(adicional_id),
    nombre_snapshot VARCHAR(150)    NOT NULL,    -- Snapshot del nombre en el momento
    cantidad        SMALLINT        NOT NULL DEFAULT 1,
    precio_snapshot NUMERIC(10,2)   NOT NULL,
    subtotal        NUMERIC(12,2)   NOT NULL
);
COMMENT ON TABLE EQIM_cotizacion.EQIM_cotizacion_adicionales IS 'Detalle de servicios adicionales incluidos en cada cotización';
CREATE INDEX idx_cotadic_EQIM_cotizacion ON EQIM_cotizacion.EQIM_cotizacion_adicionales(EQIM_cotizacion_id);

-- ================================================================
-- 10. SCHEMA: EQIM_solicitudes
-- ================================================================

-- ----------------------------------------------------
-- 10.1 Disponibilidad de fechas
-- ----------------------------------------------------
CREATE TABLE EQIM_solicitudes.disponibilidad (
    disponibilidad_id   SERIAL          PRIMARY KEY,
    fecha               DATE            NOT NULL UNIQUE,
    estado              VARCHAR(20)     NOT NULL DEFAULT 'DISPONIBLE'
                            CHECK (estado IN ('DISPONIBLE','OCUPADA','BLOQUEADA')),
    nota_interna        TEXT,
    configurado_por     INTEGER         REFERENCES EQIM_seguridad.usuarios(usuario_id),
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_solicitudes.disponibilidad IS 'Calendario de disponibilidad de fechas para eventos (RF-24, RF-34)';
CREATE INDEX idx_disp_fecha  ON EQIM_solicitudes.disponibilidad(fecha);
CREATE INDEX idx_disp_estado ON EQIM_solicitudes.disponibilidad(estado);

-- ----------------------------------------------------
-- 10.2 Estados de solicitud
-- ----------------------------------------------------
CREATE TABLE EQIM_solicitudes.estados (
    estado_id       SERIAL          PRIMARY KEY,
    codigo          VARCHAR(30)     NOT NULL UNIQUE,
    nombre          VARCHAR(80)     NOT NULL,
    descripcion     TEXT,
    color_hex       VARCHAR(7),
    es_terminal     BOOLEAN         NOT NULL DEFAULT FALSE,
    orden           SMALLINT        NOT NULL DEFAULT 0
);
COMMENT ON TABLE EQIM_solicitudes.estados IS 'Catálogo de estados del ciclo de vida de las EQIM_solicitudes';

INSERT INTO EQIM_solicitudes.estados (codigo, nombre, descripcion, color_hex, es_terminal, orden) VALUES
    ('PENDIENTE',    'Pendiente',     'Solicitud recibida, aún sin revisar por el administrador.', '#FFA500', FALSE, 1),
    ('EN_REVISION',  'En Revisión',   'El administrador está analizando la solicitud.',            '#1E90FF', FALSE, 2),
    ('CONFIRMADA',   'Confirmada',    'Reserva confirmada por el administrador.',                  '#228B22', TRUE,  3),
    ('RECHAZADA',    'Rechazada',     'Solicitud rechazada por el administrador con motivo.',      '#DC143C', TRUE,  4),
    ('CANCELADA',    'Cancelada',     'Solicitud cancelada por el cliente.',                       '#808080', TRUE,  5),
    ('COMPLETADA',   'Completada',    'Evento realizado satisfactoriamente.',                      '#2F4F4F', TRUE,  6);

-- ----------------------------------------------------
-- 10.3 EQIM_solicitudes de reserva
-- ----------------------------------------------------
CREATE TABLE EQIM_solicitudes.EQIM_solicitudes (
    solicitud_id        SERIAL          PRIMARY KEY,
    solicitud_uuid      UUID            NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    numero_solicitud    VARCHAR(20)     NOT NULL UNIQUE,   -- SOL-2026-000001
    usuario_id          INTEGER         NOT NULL REFERENCES EQIM_seguridad.usuarios(usuario_id),
    EQIM_cotizacion_id       INTEGER         REFERENCES EQIM_cotizacion.EQIM_cotizaciones(EQIM_cotizacion_id),
    fecha_evento        DATE            NOT NULL,
    estado_id           INTEGER         NOT NULL REFERENCES EQIM_solicitudes.estados(estado_id),

    -- Datos del evento solicitado (snapshot)
    tipo_evento_id      INTEGER         REFERENCES EQIM_catalogo.tipos_evento(tipo_id),
    paquete_id          INTEGER         REFERENCES EQIM_catalogo.paquetes(paquete_id),
    num_invitados       INTEGER         NOT NULL CHECK (num_invitados >= 100),

    -- Contacto
    telefono_contacto   VARCHAR(20)     NOT NULL,
    mensaje_cliente     TEXT,

    -- Administración
    comentario_admin    TEXT,           -- Razón de rechazo u observaciones
    atendido_por        INTEGER         REFERENCES EQIM_seguridad.usuarios(usuario_id),

    -- Precio estimado
    precio_estimado     NUMERIC(12,2),

    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_solicitudes.EQIM_solicitudes IS 'EQIM_solicitudes de reserva de eventos enviadas por clientes registrados (RF-21)';
CREATE INDEX idx_sol_usuario ON EQIM_solicitudes.EQIM_solicitudes(usuario_id);
CREATE INDEX idx_sol_estado  ON EQIM_solicitudes.EQIM_solicitudes(estado_id);
CREATE INDEX idx_sol_fecha   ON EQIM_solicitudes.EQIM_solicitudes(fecha_evento);
CREATE INDEX idx_sol_numero  ON EQIM_solicitudes.EQIM_solicitudes(numero_solicitud);

-- Secuencia para número de solicitud
CREATE SEQUENCE EQIM_solicitudes.seq_numero_solicitud START 1 INCREMENT 1 MINVALUE 1 NO CYCLE;

CREATE OR REPLACE FUNCTION EQIM_solicitudes.generar_numero()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_solicitud := 'SOL-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                             LPAD(NEXTVAL('EQIM_solicitudes.seq_numero_solicitud')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_solicitud_numero
    BEFORE INSERT ON EQIM_solicitudes.EQIM_solicitudes
    FOR EACH ROW EXECUTE FUNCTION EQIM_solicitudes.generar_numero();

-- ----------------------------------------------------
-- 10.4 Historial de cambios de estado de EQIM_solicitudes
-- ----------------------------------------------------
CREATE TABLE EQIM_solicitudes.historial_estados (
    historial_id        SERIAL          PRIMARY KEY,
    solicitud_id        INTEGER         NOT NULL REFERENCES EQIM_solicitudes.EQIM_solicitudes(solicitud_id) ON DELETE CASCADE,
    estado_anterior_id  INTEGER         REFERENCES EQIM_solicitudes.estados(estado_id),
    estado_nuevo_id     INTEGER         NOT NULL REFERENCES EQIM_solicitudes.estados(estado_id),
    comentario          TEXT,
    cambiado_por        INTEGER         REFERENCES EQIM_seguridad.usuarios(usuario_id),
    cambiado_en         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_solicitudes.historial_estados IS 'Historial de todos los cambios de estado de cada solicitud';
CREATE INDEX idx_histest_solicitud ON EQIM_solicitudes.historial_estados(solicitud_id);

-- ================================================================
-- 11. SCHEMA: EQIM_notificaciones
-- ================================================================

-- ----------------------------------------------------
-- 11.1 Plantillas de correo
-- ----------------------------------------------------
CREATE TABLE EQIM_notificaciones.plantillas (
    plantilla_id    SERIAL          PRIMARY KEY,
    codigo          VARCHAR(50)     NOT NULL UNIQUE,
    nombre          VARCHAR(150)    NOT NULL,
    asunto          VARCHAR(255)    NOT NULL,
    cuerpo_html     TEXT            NOT NULL,
    variables       TEXT[],                  -- Variables disponibles: {{nombre}}, {{fecha}}, etc.
    activa          BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_notificaciones.plantillas IS 'Plantillas HTML para correos automáticos del sistema';

INSERT INTO EQIM_notificaciones.plantillas (codigo, nombre, asunto, cuerpo_html, variables) VALUES
    ('VERIFICACION_CORREO',  'Verificación de Correo',   'Verifica tu cuenta – Quinta Inés María',       '<p>Hola {{nombre}}, <a href="{{enlace}}">haz clic aquí</a> para verificar tu cuenta.</p>', ARRAY['nombre','enlace']),
    ('RESET_PASSWORD',       'Recuperar Contraseña',     'Recupera tu contraseña – Quinta Inés María',   '<p>Hola {{nombre}}, <a href="{{enlace}}">haz clic aquí</a> para restablecer tu contraseña. Válido por 1 hora.</p>', ARRAY['nombre','enlace']),
    ('NUEVA_SOLICITUD_ADM',  'Nueva Solicitud (Admin)',  'Nueva solicitud de reserva #{{numero}}',        '<p>Se ha recibido una nueva solicitud de reserva para el <strong>{{fecha_evento}}</strong>.</p>', ARRAY['numero','fecha_evento','paquete']),
    ('SOLICITUD_RECIBIDA',   'Solicitud Recibida',       'Tu solicitud #{{numero}} fue recibida',         '<p>Hola {{nombre}}, tu solicitud #{{numero}} fue registrada exitosamente.</p>', ARRAY['nombre','numero','fecha_evento']),
    ('ESTADO_CONFIRMADA',    'Solicitud Confirmada',     '¡Tu evento está confirmado! #{{numero}}',       '<p>Hola {{nombre}}, tu evento del <strong>{{fecha_evento}}</strong> está confirmado.</p>', ARRAY['nombre','numero','fecha_evento']),
    ('ESTADO_RECHAZADA',     'Solicitud Rechazada',      'Información sobre tu solicitud #{{numero}}',    '<p>Hola {{nombre}}, lamentablemente tu solicitud no pudo ser procesada. Motivo: {{motivo}}</p>', ARRAY['nombre','numero','motivo']),
    ('EQIM_cotizacion_ENVIADA',   'Cotización Enviada',       'Tu cotización #{{numero}} – Quinta Inés María', '<p>Hola {{nombre}}, adjunto encontrarás tu cotización por {{total}} USD. Válida hasta {{valida_hasta}}.</p>', ARRAY['nombre','numero','total','valida_hasta']),
    ('RECORDATORIO_EVENTO',  'Recordatorio de Evento',  'Tu evento es en 7 días – Quinta Inés María',   '<p>Hola {{nombre}}, te recordamos que tu evento del <strong>{{fecha_evento}}</strong> se acerca. ¡Estamos listos para recibirte!</p>', ARRAY['nombre','fecha_evento']);

-- ----------------------------------------------------
-- 11.2 Log de correos enviados
-- ----------------------------------------------------
CREATE TABLE EQIM_notificaciones.log_correos (
    log_id          SERIAL          PRIMARY KEY,
    plantilla_id    INTEGER         REFERENCES EQIM_notificaciones.plantillas(plantilla_id),
    tipo            VARCHAR(50)     NOT NULL,               -- Código de plantilla
    destinatario    VARCHAR(255)    NOT NULL,
    asunto          VARCHAR(300)    NOT NULL,
    estado          VARCHAR(20)     NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (estado IN ('PENDIENTE','ENVIADO','FALLIDO','REBOTADO')),
    intentos        SMALLINT        NOT NULL DEFAULT 0,
    proximo_reintento TIMESTAMPTZ,
    error_detalle   TEXT,
    referencia_id   INTEGER,                                -- ID de solicitud, cotización, etc.
    referencia_tipo VARCHAR(30),                            -- 'SOLICITUD', 'EQIM_cotizacion', 'USUARIO'
    enviado_en      TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_notificaciones.log_correos IS 'Registro de todos los correos enviados y su estado (RF-38 al RF-42)';
CREATE INDEX idx_log_estado     ON EQIM_notificaciones.log_correos(estado) WHERE estado IN ('PENDIENTE','FALLIDO');
CREATE INDEX idx_log_destinat   ON EQIM_notificaciones.log_correos(destinatario);
CREATE INDEX idx_log_referencia ON EQIM_notificaciones.log_correos(referencia_tipo, referencia_id);

-- ================================================================
-- 12. SCHEMA: EQIM_auditoria
-- ================================================================

-- ----------------------------------------------------
-- 12.1 Log de operaciones del sistema
-- ----------------------------------------------------
CREATE TABLE EQIM_auditoria.log_operaciones (
    log_id          BIGSERIAL       PRIMARY KEY,
    schema_tabla    VARCHAR(100),                           -- 'EQIM_seguridad.usuarios'
    operacion       VARCHAR(10)     NOT NULL
                        CHECK (operacion IN ('INSERT','UPDATE','DELETE','SELECT','LOGIN','LOGOUT')),
    usuario_id      INTEGER,                                -- NULL para operaciones del sistema
    usuario_uuid    UUID,
    datos_anteriores JSONB,                                 -- Estado antes del cambio
    datos_nuevos    JSONB,                                  -- Estado después del cambio
    ip_origen       INET,
    user_agent      TEXT,
    descripcion     TEXT,
    exitoso         BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_auditoria.log_operaciones IS 'Registro de auditoría de todas las operaciones críticas del sistema';

-- Particionar por mes para rendimiento (opcional en producción)
CREATE INDEX idx_audit_usuario   ON EQIM_auditoria.log_operaciones(usuario_id) WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_audit_operacion ON EQIM_auditoria.log_operaciones(operacion);
CREATE INDEX idx_audit_tabla     ON EQIM_auditoria.log_operaciones(schema_tabla);
CREATE INDEX idx_audit_fecha     ON EQIM_auditoria.log_operaciones(creado_en DESC);

-- ----------------------------------------------------
-- 12.2 Log de intentos de autenticación
-- ----------------------------------------------------
CREATE TABLE EQIM_auditoria.log_autenticacion (
    log_id          BIGSERIAL       PRIMARY KEY,
    correo          VARCHAR(255)    NOT NULL,
    exitoso         BOOLEAN         NOT NULL,
    ip_origen       INET,
    user_agent      TEXT,
    motivo_fallo    VARCHAR(100),                           -- 'CREDENCIALES_INVALIDAS', 'CUENTA_BLOQUEADA', etc.
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE EQIM_auditoria.log_autenticacion IS 'Registro de todos los intentos de inicio de sesión (exitosos y fallidos)';
CREATE INDEX idx_auauth_correo  ON EQIM_auditoria.log_autenticacion(correo);
CREATE INDEX idx_auauth_ip      ON EQIM_auditoria.log_autenticacion(ip_origen);
CREATE INDEX idx_auauth_fecha   ON EQIM_auditoria.log_autenticacion(creado_en DESC);

-- ================================================================
-- 13. FUNCIONES Y TRIGGERS DE AUDITORÍA Y ACTUALIZACIÓN
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 13.1 Función para actualizar columna 'actualizado_en' automáticamente
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public_fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con 'actualizado_en'
CREATE TRIGGER trg_ts_EQIM_seguridad_usuarios
    BEFORE UPDATE ON EQIM_seguridad.usuarios
    FOR EACH ROW EXECUTE FUNCTION public_fn_actualizar_timestamp();

CREATE TRIGGER trg_ts_EQIM_catalogo_paquetes
    BEFORE UPDATE ON EQIM_catalogo.paquetes
    FOR EACH ROW EXECUTE FUNCTION public_fn_actualizar_timestamp();

CREATE TRIGGER trg_ts_EQIM_catalogo_servicios
    BEFORE UPDATE ON EQIM_catalogo.servicios_adicionales
    FOR EACH ROW EXECUTE FUNCTION public_fn_actualizar_timestamp();

CREATE TRIGGER trg_ts_conf_sesiones
    BEFORE UPDATE ON EQIM_configurador.sesiones
    FOR EACH ROW EXECUTE FUNCTION public_fn_actualizar_timestamp();

CREATE TRIGGER trg_ts_cot_EQIM_cotizaciones
    BEFORE UPDATE ON EQIM_cotizacion.EQIM_cotizaciones
    FOR EACH ROW EXECUTE FUNCTION public_fn_actualizar_timestamp();

CREATE TRIGGER trg_ts_sol_EQIM_solicitudes
    BEFORE UPDATE ON EQIM_solicitudes.EQIM_solicitudes
    FOR EACH ROW EXECUTE FUNCTION public_fn_actualizar_timestamp();

CREATE TRIGGER trg_ts_sol_disponibilidad
    BEFORE UPDATE ON EQIM_solicitudes.disponibilidad
    FOR EACH ROW EXECUTE FUNCTION public_fn_actualizar_timestamp();

CREATE TRIGGER trg_ts_notif_plantillas
    BEFORE UPDATE ON EQIM_notificaciones.plantillas
    FOR EACH ROW EXECUTE FUNCTION public_fn_actualizar_timestamp();

-- ────────────────────────────────────────────────────────────────
-- 13.2 Trigger: registrar cambios de estado en EQIM_solicitudes
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION EQIM_solicitudes.fn_registrar_cambio_estado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_id IS DISTINCT FROM NEW.estado_id THEN
        INSERT INTO EQIM_solicitudes.historial_estados
            (solicitud_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
        VALUES (NEW.solicitud_id, OLD.estado_id, NEW.estado_id, NEW.atendido_por);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sol_cambio_estado
    AFTER UPDATE OF estado_id ON EQIM_solicitudes.EQIM_solicitudes
    FOR EACH ROW EXECUTE FUNCTION EQIM_solicitudes.fn_registrar_cambio_estado();

-- ────────────────────────────────────────────────────────────────
-- 13.3 Trigger: audit log automático para tablas críticas
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION EQIM_auditoria.fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_datos_ant JSONB := NULL;
    v_datos_nue JSONB := NULL;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_datos_ant := to_jsonb(OLD);
    ELSIF TG_OP = 'INSERT' THEN
        v_datos_nue := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_datos_ant := to_jsonb(OLD);
        v_datos_nue := to_jsonb(NEW);
    END IF;

    INSERT INTO EQIM_auditoria.log_operaciones
        (schema_tabla, operacion, datos_anteriores, datos_nuevos)
    VALUES
        (TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, TG_OP, v_datos_ant, v_datos_nue);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar audit log a tablas críticas
CREATE TRIGGER trg_audit_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON EQIM_seguridad.usuarios
    FOR EACH ROW EXECUTE FUNCTION EQIM_auditoria.fn_audit_log();

CREATE TRIGGER trg_audit_EQIM_solicitudes
    AFTER INSERT OR UPDATE OR DELETE ON EQIM_solicitudes.EQIM_solicitudes
    FOR EACH ROW EXECUTE FUNCTION EQIM_auditoria.fn_audit_log();

CREATE TRIGGER trg_audit_disponibilidad
    AFTER INSERT OR UPDATE OR DELETE ON EQIM_solicitudes.disponibilidad
    FOR EACH ROW EXECUTE FUNCTION EQIM_auditoria.fn_audit_log();

CREATE TRIGGER trg_audit_paquetes
    AFTER INSERT OR UPDATE OR DELETE ON EQIM_catalogo.paquetes
    FOR EACH ROW EXECUTE FUNCTION EQIM_auditoria.fn_audit_log();

CREATE TRIGGER trg_audit_EQIM_cotizaciones
    AFTER INSERT ON EQIM_cotizacion.EQIM_cotizaciones
    FOR EACH ROW EXECUTE FUNCTION EQIM_auditoria.fn_audit_log();

-- ================================================================
-- 14. VISTAS ÚTILES PARA LA APLICACIÓN
-- ================================================================

-- Vista: resumen de EQIM_solicitudes con datos relacionados
CREATE OR REPLACE VIEW EQIM_solicitudes.v_EQIM_solicitudes_detalle AS
SELECT
    s.solicitud_id,
    s.solicitud_uuid,
    s.numero_solicitud,
    u.nombre_completo       AS cliente_nombre,
    u.correo                AS cliente_correo,
    u.telefono              AS cliente_telefono,
    s.fecha_evento,
    te.tipo_nombre          AS tipo_evento,
    p.paquete_nombre        AS paquete,
    s.num_invitados,
    est.nombre              AS estado,
    est.color_hex           AS estado_color,
    s.telefono_contacto,
    s.mensaje_cliente,
    s.comentario_admin,
    s.precio_estimado,
    s.creado_en,
    s.actualizado_en
FROM EQIM_solicitudes.EQIM_solicitudes s
JOIN EQIM_seguridad.usuarios    u   ON u.usuario_id      = s.usuario_id
JOIN EQIM_solicitudes.estados   est ON est.estado_id     = s.estado_id
LEFT JOIN EQIM_catalogo.tipos_evento te ON te.tipo_id    = s.tipo_evento_id
LEFT JOIN EQIM_catalogo.paquetes     p  ON p.paquete_id  = s.paquete_id;

COMMENT ON VIEW EQIM_solicitudes.v_EQIM_solicitudes_detalle IS 'Vista de EQIM_solicitudes con todos los datos relacionados para el panel de administración';

-- Vista: EQIM_cotizaciones con datos de cliente y evento
CREATE OR REPLACE VIEW EQIM_cotizacion.v_EQIM_cotizaciones_detalle AS
SELECT
    c.EQIM_cotizacion_id,
    c.EQIM_cotizacion_uuid,
    c.numero_EQIM_cotizacion,
    u.nombre_completo   AS cliente_nombre,
    u.correo            AS cliente_correo,
    te.tipo_nombre      AS tipo_evento,
    p.paquete_nombre    AS paquete,
    c.num_invitados,
    c.subtotal,
    c.total,
    c.estado,
    c.valida_hasta,
    c.pdf_url,
    c.creado_en
FROM EQIM_cotizacion.EQIM_cotizaciones c
LEFT JOIN EQIM_seguridad.usuarios    u  ON u.usuario_id  = c.usuario_id
LEFT JOIN EQIM_catalogo.tipos_evento te ON te.tipo_id    = c.tipo_evento_id
LEFT JOIN EQIM_catalogo.paquetes     p  ON p.paquete_id  = c.paquete_id;

COMMENT ON VIEW EQIM_cotizacion.v_EQIM_cotizaciones_detalle IS 'Vista de EQIM_cotizaciones con datos de cliente y configuración';

-- Vista: sugerencias IA con métricas de rendimiento (RNF-19)
CREATE OR REPLACE VIEW EQIM_configurador.v_metricas_ia AS
SELECT
    DATE_TRUNC('day', creado_en)    AS dia,
    campo_objetivo,
    modelo_ia,
    COUNT(*)                        AS total_EQIM_solicitudes,
    AVG(tiempo_respuesta_ms)        AS tiempo_promedio_ms,
    MAX(tiempo_respuesta_ms)        AS tiempo_maximo_ms,
    MIN(tiempo_respuesta_ms)        AS tiempo_minimo_ms,
    SUM(tokens_usados)              AS tokens_totales,
    SUM(CASE WHEN aplicada THEN 1 ELSE 0 END) AS veces_aplicada,
    ROUND(100.0 * SUM(CASE WHEN aplicada THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 2) AS tasa_aplicacion_pct
FROM EQIM_configurador.sugerencias_ia
GROUP BY DATE_TRUNC('day', creado_en), campo_objetivo, modelo_ia;

COMMENT ON VIEW EQIM_configurador.v_metricas_ia IS '✦ Métricas de rendimiento del Asistente IA para monitoreo de RNF-19';

-- ================================================================
-- 15. DATOS INICIALES DE ROLES DEL SISTEMA
-- ================================================================
INSERT INTO EQIM_seguridad.roles (rol_codigo, rol_nombre, rol_descripcion) VALUES
    ('ADMIN',   'Administrador',   'Acceso completo al panel de administración del sistema'),
    ('CLIENTE', 'Cliente',         'Cliente registrado con acceso a EQIM_solicitudes e historial');

-- ================================================================
-- 16. PERMISOS GRANULARES POR ROL DE BASE DE DATOS
-- ================================================================

-- qim_app (backend Node.js): SELECT, INSERT, UPDATE en todo
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA
    EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador, EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria
    TO qim_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA
    EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador, EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria
    TO qim_app;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA
    EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador, EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria
    TO qim_app;

-- qim_readonly (reportes/BI): solo SELECT
GRANT SELECT ON ALL TABLES IN SCHEMA
    EQIM_catalogo, EQIM_galeria, EQIM_cotizacion, EQIM_solicitudes, EQIM_auditoria
    TO qim_readonly;

GRANT SELECT ON EQIM_cotizacion.v_EQIM_cotizaciones_detalle   TO qim_readonly;
GRANT SELECT ON EQIM_solicitudes.v_EQIM_solicitudes_detalle   TO qim_readonly;
GRANT SELECT ON EQIM_configurador.v_metricas_ia          TO qim_readonly;

-- qim_dba: todo
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA
    EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador, EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria
    TO qim_dba;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA
    EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador, EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria
    TO qim_dba;

-- Privilegios futuros automáticos
ALTER DEFAULT PRIVILEGES IN SCHEMA
    EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador, EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO qim_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA
    EQIM_seguridad, EQIM_catalogo, EQIM_galeria, EQIM_configurador, EQIM_cotizacion, EQIM_solicitudes, EQIM_notificaciones, EQIM_auditoria
    GRANT USAGE, SELECT ON SEQUENCES TO qim_app;

-- ================================================================
-- 17. CONFIGURACIÓN DE EQIM_seguridad A NIVEL DE FILA (Row Level Security)
-- ================================================================

-- RLS en usuarios: solo el propio usuario puede ver/modificar su registro
ALTER TABLE EQIM_seguridad.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_usuario_propio ON EQIM_seguridad.usuarios
    USING (usuario_uuid::TEXT = current_setting('app.current_user_uuid', TRUE))
    WITH CHECK (usuario_uuid::TEXT = current_setting('app.current_user_uuid', TRUE));

-- Los admins pueden ver todo (bypass RLS)
CREATE POLICY pol_admin_full ON EQIM_seguridad.usuarios
    USING (current_setting('app.current_user_role', TRUE) = 'ADMIN');

-- RLS en EQIM_cotizaciones: el cliente solo ve sus propias EQIM_cotizaciones
ALTER TABLE EQIM_cotizacion.EQIM_cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_EQIM_cotizacion_propia ON EQIM_cotizacion.EQIM_cotizaciones
    USING (
        usuario_id IN (
            SELECT usuario_id FROM EQIM_seguridad.usuarios
            WHERE usuario_uuid::TEXT = current_setting('app.current_user_uuid', TRUE)
        )
        OR usuario_id IS NULL
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

-- RLS en EQIM_solicitudes: el cliente solo ve sus propias EQIM_solicitudes
ALTER TABLE EQIM_solicitudes.EQIM_solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_solicitud_propia ON EQIM_solicitudes.EQIM_solicitudes
    USING (
        usuario_id IN (
            SELECT usuario_id FROM EQIM_seguridad.usuarios
            WHERE usuario_uuid::TEXT = current_setting('app.current_user_uuid', TRUE)
        )
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

-- ================================================================
-- 18. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ================================================================

-- Búsqueda de texto en usuarios
CREATE INDEX idx_usuarios_correo_lower  ON EQIM_seguridad.usuarios(LOWER(correo));
CREATE INDEX idx_usuarios_nombre_trgm   ON EQIM_seguridad.usuarios USING GIN (nombre_completo gin_trgm_ops);

-- Búsqueda full-text en paquetes
CREATE INDEX idx_paquetes_nombre_trgm   ON EQIM_catalogo.paquetes USING GIN (paquete_nombre gin_trgm_ops);

-- Índices para galería
CREATE INDEX idx_EQIM_galeria_orden ON EQIM_galeria.imagenes(orden_display) WHERE activo = TRUE;

-- Índice compuesto para verificación de tokens válidos
CREATE INDEX idx_tokens_validos ON EQIM_seguridad.tokens(usuario_id, tipo, expira_en)
    WHERE NOT usado;

-- Índice para limpieza de sesiones JWT expiradas
CREATE INDEX idx_sesiones_limpiar ON EQIM_seguridad.sesiones_revocadas(expira_en);
    

-- ================================================================
-- 19. POLÍTICAS DE EXPIRACIÓN Y LIMPIEZA (función auxiliar)
-- ================================================================

-- Función para limpiar datos expirados (ejecutar con pg_cron o cron del SO)
CREATE OR REPLACE FUNCTION EQIM_auditoria.fn_limpiar_expirados()
RETURNS VOID AS $$
BEGIN
    -- Eliminar tokens expirados hace más de 7 días
    DELETE FROM EQIM_seguridad.tokens
    WHERE expira_en < NOW() - INTERVAL '7 days';

    -- Eliminar sesiones JWT revocadas y ya expiradas
    DELETE FROM EQIM_seguridad.sesiones_revocadas
    WHERE expira_en < NOW();

    -- Marcar EQIM_cotizaciones expiradas
    UPDATE EQIM_cotizacion.EQIM_cotizaciones
    SET estado = 'EXPIRADA'
    WHERE estado = 'GENERADA'
      AND valida_hasta < NOW();

    -- Expirar sesiones del EQIM_configurador
    DELETE FROM EQIM_configurador.sesiones
    WHERE NOT completada
      AND expira_en < NOW() - INTERVAL '7 days';

    RAISE NOTICE 'Limpieza de datos expirados completada: %', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION EQIM_auditoria.fn_limpiar_expirados IS
    'Función de mantenimiento. Ejecutar periódicamente con pg_cron o cron del sistema operativo.';

-- ================================================================
-- 20. VERIFICACIÓN FINAL
-- ================================================================

-- Verificar que no haya tablas en el schema public
DO $$
DECLARE v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    IF v_count > 0 THEN
        RAISE WARNING '⚠ Hay % tabla(s) en el schema public. Revisar.', v_count;
    ELSE
        RAISE NOTICE '✅ Schema public limpio – sin tablas de usuario.';
    END IF;
END;
$$;

-- Mostrar resumen de lo creado
SELECT 
    table_schema AS esquema, 
    COUNT(*) AS num_tablas 
FROM information_schema.tables 
WHERE table_schema IN (
    'eqim_seguridad', 'eqim_catalogo', 'eqim_galeria', 'eqim_configurador',
    'eqim_cotizacion', 'eqim_solicitudes', 'eqim_notificaciones', 'eqim_auditoria'
)
AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- ================================================================
-- FIN DEL SCRIPT
-- Autor : Gerardo Jesus Barreno Flores
-- ESPOCH – Carrera Software – 2026
-- ================================================================
