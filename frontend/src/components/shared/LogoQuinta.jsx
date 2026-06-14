import logoQuinta from '../../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

/**
 * Logo de la Quinta con efecto "ARGB backlight": un resplandor degradado y
 * desenfocado detrás de la imagen que la hace resaltar SIN alterar sus colores.
 * - Modo claro  → tonos profundos (púrpura/dorado).
 * - Modo oscuro → tonos luminosos (púrpura/fucsia/ámbar).
 *
 * No aplica `filter: invert` (eso rompía el logo mostrando un cuadro blanco).
 */
export default function LogoQuinta({
  imgClassName = 'h-13 w-auto',
  wrapperClassName = '',
  glowClassName = '-inset-5',
  alt = 'Quinta Inés María',
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${wrapperClassName}`}>
      {/* Resplandor trasero ARGB fuerte y expansivo (sobresale del cuadro del logo) */}
      <span
        aria-hidden
        className={`absolute ${glowClassName} rounded-full blur-2xl opacity-90 scale-125 animate-pulse
          bg-gradient-to-r from-purple-900 via-amber-700 to-purple-800
          dark:from-purple-400 dark:via-fuchsia-300 dark:to-amber-300`}
      />
      {/* Segunda capa para intensificar el halo */}
      <span
        aria-hidden
        className={`absolute ${glowClassName} rounded-full blur-xl opacity-70 animate-pulse
          bg-gradient-to-tr from-fuchsia-600 via-amber-500 to-purple-600
          dark:from-fuchsia-300 dark:via-amber-200 dark:to-purple-300`}
        style={{ animationDelay: '0.6s' }}
      />
      <img src={logoQuinta} alt={alt} className={`relative z-10 ${imgClassName}`} />
    </div>
  );
}
