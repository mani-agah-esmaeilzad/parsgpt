import Image from 'next/image'
import Link from 'next/link'

import AboutScrollManager from './scroll-to-footer'

export const revalidate = 60

export const metadata = {
  title: 'معرفی چت‌پارس',
}

export default async function AboutPage() {

  return (
    <>
      <AboutScrollManager />

      <div className="items-center justify-center" dir="auto">
        <div className='fixed top-1.5 w-full'>
          <div className="flex items-center justify-between h-14 w-full sticky top-1.5 px-3.5 sm:px-14 sm:pt-12 pt-safe-20 z-40">
            <Link href="/" className="w-9 aspect-square ms-1">
              <Image
                className="size-9 scale-[135%] hover:scale-125 active:scale-110 transition-transform"
                src="/logo.png"
                alt={`chatpars logo`}
                width={180}
                height={38}
                priority
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/chat"
                className="rounded-full transition-colors flex items-center justify-center text-white dark:text-black bg-[#9138C9] gap-2 hover:bg-[#9138C9]/75 active:bg-[#9138C9]/75 font-medium text-xs sm:text-sm h-9 px-4 sm:w-auto"
              >
                شروع گفتگو
              </Link>
            </div>
          </div>
        </div>

        <div className="font-sans p-3 sm:p-20 pb-10 pt-safe-20">
          <main className="flex flex-col gap-[32px] row-start-2 items-center">
            <div className="min-h-screen space-y-4 py-10">
              <h1 className="text-4xl md:text-5xl font-bold text-center pt-10 md:-mt-5 md:pt-0 pb-10">
                معرفی چت‌پارس:
              </h1>

            </div>

          </main>
        </div>
      </div>
    </>
  )
}