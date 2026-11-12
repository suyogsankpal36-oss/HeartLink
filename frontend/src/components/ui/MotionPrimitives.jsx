import { motion } from "framer-motion";

const EASE_ENTERPRISE = [0.22, 1, 0.36, 1];

export function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_ENTERPRISE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInView({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: EASE_ENTERPRISE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerList({ children, className = "" }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.04,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.2, ease: EASE_ENTERPRISE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
