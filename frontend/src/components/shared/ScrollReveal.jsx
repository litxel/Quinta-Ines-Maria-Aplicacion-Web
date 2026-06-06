import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 38,
  duration = 0.62,
  once = true,
}) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once, margin: '-55px' });

  const offsets = {
    up:    { y: distance,  x: 0         },
    down:  { y: -distance, x: 0         },
    left:  { y: 0,         x: distance  },
    right: { y: 0,         x: -distance },
    none:  { y: 0,         x: 0         },
  };
  const { x, y } = offsets[direction] ?? offsets.up;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x, y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Variante para listas con stagger automático */
export function StaggerReveal({ children, className = '', stagger = 0.1, parentDelay = 0 }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-55px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden:  {},
        visible: { transition: { staggerChildren: stagger, delayChildren: parentDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } },
};
