import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onComplete?: () => void
}

export default function LoadingScreen({ onComplete }: Props) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      <motion.div
        key="loading"
        className="fixed inset-0 bg-terminal-bg flex flex-col items-center justify-center z-50 font-mono"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.p
          className="text-terminal-green text-sm tracking-widest mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          procko@portfolio ~ bash
        </motion.p>
        <motion.p
          className="text-terminal-muted text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          loading portfolio data...
        </motion.p>
        <motion.span
          className="inline-block w-2 h-4 bg-terminal-green mt-4 animate-blink"
        />
      </motion.div>
    </AnimatePresence>
  )
}
