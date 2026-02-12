'use client'

import { useEffect, useState } from "react"
import Link from "next/link"

interface Gpt {
  id: string
  name: string
  tags: string[]
  starterPrompts: string[]
  color?: string
}

const colors = [
  "bg-purple-600",
  "bg-green-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-yellow-500",
]

export default function AssistantsList() {
  const [assistants, setAssistants] = useState<Gpt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/gpts")
      .then(res => res.json())
      .then(data => {
        const colored = data.gpts.map((gpt: Gpt, i: number) => ({
          ...gpt,
          color: colors[i % colors.length],
        }))
        setAssistants(colored)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-neutral-400/25 animate-pulse h-14"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {assistants.map((gpt) => (
        <Link
          key={gpt.id}
          href={`/gpt/${gpt.id}`}
          className={`p-4 rounded-3xl text-white font-medium shadow-lg ${gpt.color} hover:opacity-85 active:opacity-75 transition last:mb-20`}
        >
          {gpt.name}
        </Link>
      ))}
    </div>
  )
}
