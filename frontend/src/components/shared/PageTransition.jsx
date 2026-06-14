import { motion } from 'framer-motion';

// Transición de entrada solo-opacidad (sin desplazamiento) para evitar cualquier
// salto de layout que pueda interferir con el primer clic de navegación.
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'opacity' }}
    >
      {children}
    </motion.div>
  );
}
