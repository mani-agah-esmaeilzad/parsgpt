'use client'

import Link from "next/link"
import Image from "next/image"

import { ArrowUp } from "lucide-react"
import { motion, AnimatePresence, useMotionValue } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import AssistantsList from "@/components/layout/AssistantsList"
import ShinyButton from "@/components/layout/ShinyButton"

const websiteName = "چت‌پارس"
const websiteTaglines = "Domain-Specific LLM"
const websiteDescription = "دستیارهای هوش مصنوعی فارسی"

const typingAnimationQueries: string[] = [
  "استراتژی رشد برای کسب‌وکارهای کوچک صنعتی", // صنعتی
  "نکات مهم در تنظیم وصیت‌نامه",             // حقوقی
  "پیامدهای تصمیمات سیاسی بر زندگی روزمره",   // سیاسی
  "روش یادگیری سریع ریاضیات",               // درسی
  "چگونه داستان کوتاه بنویسیم؟",             // هنری
  "بهترین بازی‌های آنلاین رایگان"          // تفریحی
]

const TYPING_SPEED = 70
const DELETING_SPEED = 30
const PAUSE_DURATION = 1000

export default function Home() {
  const router = useRouter()

  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const [displayedValue, setDisplayedValue] = useState("")
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const y = useMotionValue(0)

  const adjustTextareaHeight = useCallback(() => {
    if (!inputRef.current) return
    inputRef.current.style.height = "auto"
    inputRef.current.style.height =
      Math.min(inputRef.current.scrollHeight, 120) + "px"
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue, adjustTextareaHeight])

  const handleStartChat = () => {
    if (!inputValue.trim()) return
    router.push(`/chat?query=${encodeURIComponent(inputValue.trim())}`)
  }

  useEffect(() => {
    if (inputValue) {
      setDisplayedValue("")
      setCharIndex(0)
      setIsTyping(true)
      return
    }

    const currentQuery = typingAnimationQueries[currentQueryIndex]

    if (isTyping) {
      if (charIndex < currentQuery.length) {
        const timeout = setTimeout(() => {
          setDisplayedValue(currentQuery.substring(0, charIndex + 1))
          setCharIndex(prev => prev + 1)
        }, TYPING_SPEED)
        return () => clearTimeout(timeout)
      } else {
        const pause = setTimeout(() => setIsTyping(false), PAUSE_DURATION)
        return () => clearTimeout(pause)
      }
    } else {
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setDisplayedValue(currentQuery.substring(0, charIndex - 1))
          setCharIndex(prev => prev - 1)
        }, DELETING_SPEED)
        return () => clearTimeout(timeout)
      } else {
        setIsTyping(true)
        setCurrentQueryIndex(prev => (prev + 1) % typingAnimationQueries.length)
      }
    }
  }, [charIndex, isTyping, currentQueryIndex, inputValue])

  return (
    <div className="h-screen grid grid-rows-[20px_1fr_20px] items-center justify-items-center gap-5" dir="auto">
      <div className="flex items-center justify-between h-14 w-full sticky top-1.5 px-3.5 sm:px-14 sm:pt-12 pt-safe-20 z-40">
        <Link href="/" className="w-9 aspect-square ms-1">
          <Image
            className="size-9 scale-[135%] hover:scale-125 active:scale-110 transition-transform"
            src="/logo.png"
            alt={`${websiteName} logo`}
            width={180}
            height={38}
            priority
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="rounded-full transition-colors flex items-center justify-center text-white dark:text-black bg-purple-600 gap-2 hover:bg-purple-600/75 active:bg-purple-600/75 font-medium text-xs sm:text-sm h-9 px-4 sm:w-auto"
          >
            شروع گفتگو
          </Link>
        </div>
      </div>
      <div className="px-3 sm:p-20 w-full overflow-hidden">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-fit mx-auto">
          <h1 className="text-6xl md:text-8xl font-black">{websiteName}</h1>
          <ol className="font-medium list-inside list-disc text-sm md:text-md text-center sm:text-right">
            <li className="mb-2 tracking-[-.01em]">{websiteDescription}</li>
            <li className="tracking-[-.01em]">{websiteTaglines}</li>
          </ol>

          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="rounded-full whitespace-nowrap border border-solid border-transparent transition-colors flex items-center justify-center bg-black dark:bg-white text-white dark:text-black gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] active:bg-[#383838] dark:active:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto cursor-pointer"
            >
              خرید اشتراک
            </Link>

            <Link
              href="/about"
              className="rounded-full cursor-pointer whitespace-nowrap border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2]/25 dark:hover:bg-[#1a1a1a] hover:border-transparent active:bg-[#f2f2f2] dark:active:bg-[#1a1a1a] active:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            >
              درباره {websiteName}
            </Link>
          </div>
        </main>

        <section className="flex items-start gap-2 mt-10 max-w-3xl mx-auto">
          <button
            onClick={handleStartChat}
            disabled={!inputValue.trim()}
            className="bg-purple-600/75 p-2.5 text-white rounded-full disabled:opacity-25"
          >
            <ArrowUp className="size-6" />
          </button>

          <div className="relative flex items-center size-full dark:bg-[#202020] border-neutral-300 dark:border-0 rounded-3xl border sm:pl-5 shadow-2xs overflow-hidden">
            <textarea
              rows={1}
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleStartChat()
                }
              }}
              placeholder={displayedValue}
              className="w-full flex placeholder:py-1 scrollbar scrollbar-textarea bg-transparent px-5 font-medium placeholder:text-neutral-500/75 dark:placeholder:text-white/75 placeholder:text-xs focus:outline-none resize-none py-2.5 sm:py-2.5 text-right"
            />
          </div>
        </section>
      </div>

      {/* Bottom Button */}
      <ShinyButton onClick={() => setIsSheetOpen(true)}>
        مشاهده دستیارها
      </ShinyButton>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
            />

            <motion.div
              drag="y"
              dragConstraints={{ top: 50, bottom: 50 }}
              dragElastic={0.15}
              style={{ y }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 50) setIsSheetOpen(false);
              }}
              initial={{ y: "100%" }}
              animate={{ y: 50 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 h-[75vh] md:h-[85vh] bg-white dark:bg-neutral-900 max-w-4xl mx-auto rounded-t-4xl z-50 shadow-2xl flex flex-col"
            >
              <div className="flex justify-center py-3 cursor-grab">
                <div className="w-12 h-1.5 bg-neutral-400 rounded-full" />
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <h2 className="text-lg font-bold sticky top-0 h-12 bg-white dark:bg-neutral-900 flex items-center pb-3 z-20">انتخاب دستیار</h2>
                <div className="bg-linear-to-b from-white dark:from-neutral-900 h-4 sticky top-12 mb-1" />

                <AssistantsList />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}