/** Número WhatsApp Quinta Inés María (Ecuador, sin +) */
export const WHATSAPP_NUMERO =
  import.meta.env.VITE_WHATSAPP_NUMERO || '593985488891';

export const whatsappUrl = (mensaje = '') => {
  const base = `https://wa.me/${WHATSAPP_NUMERO}`;
  if (!mensaje) return base;
  return `${base}?text=${encodeURIComponent(mensaje)}`;
};

export const telefonoAWa = (telefono) => {
  if (!telefono) return null;
  const digits = String(telefono).replace(/\D/g, '');
  if (!digits) return null;
  const num = digits.startsWith('593') ? digits : `593${digits.replace(/^0/, '')}`;
  return `https://wa.me/${num}`;
};
