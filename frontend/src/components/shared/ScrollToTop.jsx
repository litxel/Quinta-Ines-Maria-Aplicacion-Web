import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Restaura el scroll al tope en cada cambio de ruta.
 * Sin esto, al navegar (p. ej. desde el footer) la página cambia pero el scroll
 * se mantiene abajo, dando la sensación de que "no pasó nada" hasta hacer scroll.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }, [pathname]);

  return null;
}
