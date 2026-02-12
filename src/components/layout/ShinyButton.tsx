'use client'

import { useState } from "react"
import { motion } from "framer-motion"

export default function ShinyButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="fixed bottom-safe mb-8 left-1/2 -translate-x-1/2 z-40" >
      <motion.button
        onClick={onClick}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="relative overflow-hidden px-8 py-3.5 rounded-full font-medium text-sm shadow-2xl shadow-purple-300/75"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-black dark:bg-white rounded-full" />

        {/* Shine Effect */}
        <motion.div
          className="absolute top-0 left-[-50%] w-1/4 h-32 bg-gradient-to-r from-transparent dark:via-neutral-400/10 via-white/25 transform rotate-12 -mt-20"
          animate={{ x: hovered ? ["-500%", "750%"] : ["-250%", "750%"] }}
          transition={{ repeat: Infinity, duration: 0.5, ease: "linear", repeatDelay: 1, }}
        />

        {/* Text */}
        <span className="relative z-10 whitespace-nowrap text-white dark:text-black">{children}</span>
      </motion.button>
    </div>
  )
}
