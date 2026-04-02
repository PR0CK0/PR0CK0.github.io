import { motion } from 'framer-motion'

type Accent = 'green' | 'blue' | 'amber' | 'purple'

interface Props {
  prompt: string
  title: string
  accent?: Accent
}

const accentClasses: Record<Accent, string> = {
  green:  'text-terminal-green text-glow-green',
  blue:   'text-terminal-blue text-glow-blue',
  amber:  'text-terminal-amber text-glow-amber',
  purple: 'text-terminal-purple text-glow-purple',
}

export default function SectionHeader({ prompt, title, accent = 'green' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-2"
    >
      <p className={`text-xs font-mono mb-1 ${accentClasses[accent]}`}>
        $ {prompt}
      </p>
      <h2 className="text-2xl font-bold font-mono text-terminal-text tracking-tight">
        {title}
      </h2>
    </motion.div>
  )
}
