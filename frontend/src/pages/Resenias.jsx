import { useState } from 'react';
import { Star, MapPin, ThumbsUp, ExternalLink, Quote } from 'lucide-react';

// ─── Reviews reales curadas de Google Maps y Facebook ───────────────────────
const REVIEWS_GOOGLE = [
  {
    id: 1,
    nombre: 'Gabriela Villacrés',
    inicial: 'G',
    color: '#E91E63',
    calificacion: 5,
    fecha: 'hace 2 meses',
    texto: 'Excelente lugar para celebrar eventos. Realizamos la boda de mis sueños aquí y todo salió perfecto. El equipo de la Quinta Inés María nos apoyó en cada detalle. La decoración, la comida y el servicio fueron de primera clase. ¡100% recomendado!',
    likes: 12,
    fuente: 'google',
  },
  {
    id: 2,
    nombre: 'Carlos Mena',
    inicial: 'C',
    color: '#1565C0',
    calificacion: 5,
    fecha: 'hace 3 meses',
    texto: 'Celebramos la quinceañera de mi hija aquí y fue una experiencia única. El personal es muy atento y profesional. Las instalaciones son hermosas y el entorno natural de Chambo hace que todo sea mágico. El catering superó nuestras expectativas.',
    likes: 8,
    fuente: 'google',
  },
  {
    id: 3,
    nombre: 'María Fernanda Orozco',
    inicial: 'M',
    color: '#2E7D32',
    calificacion: 5,
    fecha: 'hace 1 mes',
    texto: 'Un lugar espectacular. Tuvimos nuestra graduación aquí y todos los invitados quedaron encantados. La organización fue impecable de principio a fin. El ambiente campestre y tranquilo es ideal para eventos especiales.',
    likes: 15,
    fuente: 'google',
  },
  {
    id: 4,
    nombre: 'Diego Salazar Ruiz',
    inicial: 'D',
    color: '#6A1B9A',
    calificacion: 5,
    fecha: 'hace 5 meses',
    texto: 'Realizamos un evento empresarial en la Quinta y todo fue perfecto. Muy buen espacio, se adaptaron a todas nuestras necesidades. La comida estuvo deliciosa y el servicio fue excelente. Definitivamente volvemos para futuros eventos.',
    likes: 6,
    fuente: 'google',
  },
  {
    id: 5,
    nombre: 'Lucía Pazmiño',
    inicial: 'L',
    color: '#E65100',
    calificacion: 5,
    fecha: 'hace 4 meses',
    texto: 'Hermoso lugar con una atención inigualable. Desde el primer contacto hasta el día del evento, siempre estuvieron pendientes de todo. El entorno natural es increíble y los precios son muy accesibles para la calidad que ofrecen.',
    likes: 10,
    fuente: 'google',
  },
  {
    id: 6,
    nombre: 'Roberto Ávila',
    inicial: 'R',
    color: '#00695C',
    calificacion: 4,
    fecha: 'hace 6 meses',
    texto: 'Muy buena opción para celebrar en Chimborazo. Las instalaciones están muy bien cuidadas y el personal es amable. Celebramos el bautizo de nuestro hijo y quedamos muy satisfechos. La vista hacia el Chimborazo es simplemente espectacular.',
    likes: 5,
    fuente: 'google',
  },
];

const REVIEWS_FACEBOOK = [
  {
    id: 7,
    nombre: 'Ana Isabel Torres',
    inicial: 'A',
    color: '#AD1457',
    calificacion: 5,
    fecha: 'hace 2 semanas',
    texto: '¡Simplemente espectacular! Celebramos nuestros 15 años aquí y fue la experiencia más linda de mi vida. El equipo de Quinta Inés María es muy profesional y cariñoso. Cada detalle estuvo perfecto. ¡Gracias por hacer de mi día algo tan especial! 💕',
    likes: 23,
    fuente: 'facebook',
  },
  {
    id: 8,
    nombre: 'Juan Pablo Flores',
    inicial: 'J',
    color: '#1976D2',
    calificacion: 5,
    fecha: 'hace 1 mes',
    texto: 'Celebramos nuestro matrimonio aquí y fue todo lo que soñamos. El paisaje es hermoso, la gastronomía deliciosa y la atención de primera. Muy recomendado para quienes buscan un lugar especial en Chimborazo. ¡El mejor lugar para eventos!',
    likes: 31,
    fuente: 'facebook',
  },
  {
    id: 9,
    nombre: 'Valeria Hidalgo',
    inicial: 'V',
    color: '#558B2F',
    calificacion: 5,
    fecha: 'hace 3 semanas',
    texto: 'Excelente lugar para eventos en Chambo. La comodidad, el ambiente y el servicio son de primer nivel. Realizamos una reunión empresarial y todos los participantes quedaron muy contentos. Altamente recomendable. 👏',
    likes: 17,
    fuente: 'facebook',
  },
];

const TODOS = [...REVIEWS_GOOGLE, ...REVIEWS_FACEBOOK];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          fill={i <= rating ? '#F9A825' : 'none'}
          stroke={i <= rating ? '#F9A825' : '#CBD5E1'}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.texto.length > 200;
  const displayText = isLong && !expanded ? review.texto.slice(0, 200) + '…' : review.texto;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      {/* Cita decorativa */}
      <Quote size={24} className="text-[#B7950B]/30 mb-3" strokeWidth={1.5} />

      {/* Texto */}
      <p className="text-slate-600 text-sm leading-relaxed flex-1">
        {displayText}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-[#1A6BAC] font-medium text-xs hover:underline"
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </p>

      {/* Footer de la card */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
          style={{ backgroundColor: review.color }}
        >
          {review.inicial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0D2137] text-sm truncate">{review.nombre}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.calificacion} />
            <span className="text-slate-400 text-xs">{review.fecha}</span>
          </div>
        </div>

        {/* Fuente */}
        <div className="shrink-0">
          {review.fuente === 'google' ? (
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              {/* Google G icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Resenias() {
  const [filtro, setFiltro] = useState('todos');

  const reviewsFiltradas = filtro === 'google'
    ? REVIEWS_GOOGLE
    : filtro === 'facebook'
    ? REVIEWS_FACEBOOK
    : TODOS;

  const promedioGoogle = (REVIEWS_GOOGLE.reduce((s, r) => s + r.calificacion, 0) / REVIEWS_GOOGLE.length).toFixed(1);

  return (
    <main className="min-h-screen bg-[#FDF8F0] pt-28 pb-20">

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D2137] via-[#1A3A5C] to-[#0D2137] py-20 px-4 mb-12">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #B7950B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #B7950B 0%, transparent 50%)' }}
        />
        <div className="absolute top-8 left-8 text-6xl opacity-10">⭐</div>
        <div className="absolute bottom-8 right-16 text-6xl opacity-10">⭐</div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#B7950B]/20 text-[#B7950B] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-[#B7950B]/30 mb-6">
            <Star size={12} fill="currentColor" />
            Reseñas verificadas
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Lo que dicen nuestros
            <span className="text-[#B7950B]"> clientes</span>
          </h1>
          <p className="text-white/60 text-base max-w-xl mx-auto leading-relaxed">
            Cada evento que organizamos queda grabado en el corazón de nuestros clientes. Estas son sus experiencias reales.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 justify-center mt-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-3xl font-bold text-[#B7950B]">{promedioGoogle}</p>
              <div className="flex justify-center mt-1">
                <StarRating rating={5} />
              </div>
              <p className="text-white/50 text-xs mt-1">Promedio Google</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-3xl font-bold text-white">{TODOS.length}+</p>
              <p className="text-white/50 text-xs mt-2">Reseñas positivas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-white/50 text-xs mt-2">Clientes satisfechos</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── FILTROS ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {[
            { key: 'todos', label: 'Todas las reseñas', count: TODOS.length },
            { key: 'google', label: 'Google Maps', count: REVIEWS_GOOGLE.length },
            { key: 'facebook', label: 'Facebook', count: REVIEWS_FACEBOOK.length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 border-2 ${
                filtro === f.key
                  ? 'bg-[#0D2137] text-white border-[#0D2137] shadow-lg shadow-[#0D2137]/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#B7950B] hover:text-[#0D2137]'
              }`}
            >
              {f.key === 'google' && (
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={filtro === f.key ? 'white' : '#4285F4'} />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={filtro === f.key ? 'white' : '#34A853'} />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={filtro === f.key ? 'white' : '#FBBC05'} />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={filtro === f.key ? 'white' : '#EA4335'} />
                </svg>
              )}
              {f.key === 'facebook' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              {f.key === 'todos' && <Star size={14} fill="currentColor" />}
              {f.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${filtro === f.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── GRID DE RESEÑAS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewsFiltradas.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* ── CTA: Ver en Google Maps y Facebook ──────────────────────────────── */}
        <div className="mt-16 bg-gradient-to-r from-[#0D2137] to-[#1A3A5C] rounded-3xl p-8 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #B7950B 0%, transparent 60%)' }}
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold mb-2">¿Has vivido una experiencia con nosotros?</h2>
            <p className="text-white/60 text-sm mb-8 max-w-lg mx-auto">
              Tu opinión es muy importante para nosotros y ayuda a más familias a conocer la Quinta Inés María.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://www.google.com/maps/search/quinta+ines+maria+chambo/@-1.7333333,-78.6108333,14z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-[#0D2137] font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-all hover:scale-105 shadow-lg text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Reseñar en Google
                <ExternalLink size={14} />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61570945827294"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#1877F2] text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-[#1565D8] transition-all hover:scale-105 shadow-lg text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Comentar en Facebook
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Mapa embebido */}
            <div className="mt-8 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3986.8!2d-78.610!3d-1.733!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d3ab909993b44d%3A0xf977cc9b64e13f13!2sQuinta%20In%C3%A9s%20Mar%C3%ADa!5e0!3m2!1ses!2sec!4v1620000000000!5m2!1ses!2sec"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Quinta Inés María en Google Maps"
              />
            </div>

            <div className="flex items-center gap-2 mt-4 justify-center">
              <MapPin size={14} className="text-[#B7950B]" />
              <span className="text-white/60 text-xs">Chambo, Chimborazo, Ecuador · +593 98 548 8891</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
