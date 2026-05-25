import { Link } from 'react-router-dom';

export default function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="bg-[#FDF8F0] text-[#0D2137] pt-16 pb-8 border-t border-[#B7950B]/20 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Columna 1: Marca */}
          <div>
            <h3 className="font-display text-2xl font-bold text-[#0D2137] mb-4">
              Quinta Inés María
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm max-w-sm font-medium">
              Creamos eventos únicos e irrepetibles. Desde bodas íntimas hasta congresos empresariales, con el calor del campo ecuatoriano.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-lg font-bold text-[#B7950B] mb-4 uppercase tracking-wider text-sm">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-slate-600 hover:text-[#B7950B] transition-colors font-medium">Inicio</Link></li>
              <li><Link to="/paquetes" className="text-slate-600 hover:text-[#B7950B] transition-colors font-medium">Ver Paquetes</Link></li>
              <li><Link to="/galeria" className="text-slate-600 hover:text-[#B7950B] transition-colors font-medium">Nuestra Galería</Link></li>
              <li><Link to="/configurador" className="text-[#0D2137] hover:text-[#B7950B] transition-colors font-bold">Cotizar Evento</Link></li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h4 className="text-lg font-bold text-[#B7950B] mb-4 uppercase tracking-wider text-sm">
              Contacto
            </h4>
            <ul className="space-y-3 text-slate-600 text-sm font-medium">
              <li className="flex items-start gap-3">
                <span className="text-[#B7950B] text-lg leading-none">📍</span>
                <span>Chambo, Chimborazo<br />Ecuador</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#B7950B] text-lg leading-none">📞</span>
                <span>+593 99 999 9999</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#B7950B] text-lg leading-none">✉️</span>
                <span>eventos@quintainesmaria.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria y Copyright */}
        <div className="pt-8 border-t border-[#B7950B]/20 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs font-medium">
            &copy; {anioActual} Quinta Inés María. Todos los derechos reservados.
          </p>
          <p className="text-slate-500 text-xs font-medium">
            Desarrollado por Gerardo Barreno - ESPOCH
          </p>
        </div>
      </div>
    </footer>
  );
}