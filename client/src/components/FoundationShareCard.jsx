import { useState } from 'react'
import {
  Check,
  Copy,
  HeartHandshake,
  Share2,
  Sparkles,
} from 'lucide-react'

const SHARE_URL = 'https://opencarefoundation.org/'

const SHARE_TITLE = 'Support Open Care Foundation'

const SHARE_TEXT = `কেন Open Care Foundation-এর সঙ্গে যুক্ত হবেন?

আমরা প্রতিটি অনুদান, ব্যয় এবং অবশিষ্ট ফান্ডের তথ্য মানুষের সামনে রিয়েল টাইমে স্বচ্ছভাবে তুলে ধরি। কত টাকা এসেছে, কোথায় ব্যয় হয়েছে এবং বর্তমানে কত টাকা ফান্ডে আছে—সব তথ্য সহজেই দেখা যায়।

বাংলাদেশের বিভিন্ন জেলা থেকে রক্তদাতাদের যুক্ত করে আমরা একটি মানবিক Blood Donor Network গড়ে তুলছি। আপনিও একজন রক্তদাতা, স্বেচ্ছাসেবক বা সহযোগী হিসেবে আমাদের সঙ্গে যুক্ত হতে পারেন।

মানবিক কার্যক্রম আরও মানুষের কাছে পৌঁছে দিতে Open Care Foundation-কে Facebook-এ শেয়ার করুন।

#OpenCareFoundation #BloodDonorBangladesh #DonateForHumanity #VolunteerBangladesh #SupportOpenCare #Bangladesh #OCF`

function FacebookIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8v3h2.6v8h3.1Z" />
    </svg>
  )
}

export default function FoundationShareCard() {
  const [copied, setCopied] = useState(false)

  const getFullCaption = () => {
    return `${SHARE_TITLE}

${SHARE_TEXT}

${SHARE_URL}`
  }

  const showCopiedMessage = () => {
    setCopied(true)

    window.setTimeout(() => {
      setCopied(false)
    }, 2200)
  }

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea')

    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'

    document.body.appendChild(textarea)

    textarea.focus()
    textarea.select()

    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  const handleCopyCaption = async () => {
    const caption = getFullCaption()

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(caption)
      } else {
        fallbackCopy(caption)
      }

      showCopiedMessage()
    } catch (error) {
      console.error('Caption copy failed:', error)

      try {
        fallbackCopy(caption)
        showCopiedMessage()
      } catch (fallbackError) {
        console.error(
          'Fallback copy failed:',
          fallbackError
        )

        alert(
          'Caption copy করা যায়নি। অনুগ্রহ করে manually copy করুন।'
        )
      }
    }
  }

  const handleFacebookShare = () => {
    const facebookShareUrl =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        SHARE_URL
      )}`

    const popup = window.open(
      facebookShareUrl,
      'facebook-share',
      'width=720,height=650,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    )

    if (!popup) {
      window.location.href = facebookShareUrl
    }
  }

  const handleNativeShare = async () => {
    const shareData = {
      title: SHARE_TITLE,
      text: SHARE_TEXT,
      url: SHARE_URL,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        if (error?.name === 'AbortError') {
          return
        }

        console.error('Native share failed:', error)
      }
    }

    await handleCopyCaption()
  }

  return (
    <section className="group relative isolate overflow-hidden rounded-[24px] border border-violet-200/80 bg-gradient-to-r from-white via-violet-50/80 to-blue-50/90 p-4 shadow-[0_16px_45px_rgba(79,70,229,0.12)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(79,70,229,0.18)] sm:rounded-[28px] sm:p-5">
      <div className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-fuchsia-300/30 blur-3xl motion-safe:animate-pulse" />

      <div className="pointer-events-none absolute -bottom-14 right-0 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl motion-safe:animate-pulse" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.75)_45%,transparent_70%)] bg-[length:220%_100%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-safe:group-hover:animate-[shareShine_1.8s_ease-in-out_infinite]" />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-blue-500 text-white shadow-[0_14px_32px_rgba(124,58,237,0.30)] sm:h-14 sm:w-14">
            <span className="pointer-events-none absolute inset-0 rounded-[18px] ring-4 ring-violet-400/15 motion-safe:animate-ping" />

            <HeartHandshake
              size={24}
              className="relative z-10 motion-safe:animate-[shareFloat_2.4s_ease-in-out_infinite]"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-violet-700 sm:text-[9px]">
              <Sparkles size={12} />
              One click can inspire many
            </div>

            <h3 className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-950 sm:text-xl">
              আমাদের মানবিক কার্যক্রম Facebook-এ শেয়ার করুন
            </h3>

            <p className="mt-2 max-w-3xl text-[11px] font-semibold leading-5 text-slate-600 sm:text-xs sm:leading-6">
              আমরা অনুদান, ব্যয় ও অবশিষ্ট ফান্ডের তথ্য
              রিয়েল টাইমে স্বচ্ছভাবে প্রকাশ করি। বাংলাদেশের
              বিভিন্ন জেলার রক্তদাতাদের নিয়ে আমাদের Blood
              Donor Network তৈরি হচ্ছে। আপনার একটি শেয়ার
              নতুন একজন দাতা, স্বেচ্ছাসেবক বা রক্তদাতাকে
              আমাদের সঙ্গে যুক্ত করতে পারে।
            </p>
          </div>
        </div>

        <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[320px]">
          <button
            type="button"
            onClick={handleFacebookShare}
            className="group/facebook relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#1877F2] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(24,119,242,0.32)] transition duration-300 hover:-translate-y-1 hover:bg-[#166fe5] active:scale-[0.97] motion-safe:animate-[facebookGlow_2.2s_ease-in-out_infinite]"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition duration-500 group-hover/facebook:translate-x-full group-hover/facebook:opacity-100" />

            <FacebookIcon className="relative h-5 w-5 transition duration-300 group-hover/facebook:scale-110" />

            <span className="relative">
              Share on Facebook
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyCaption}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-xs font-black transition duration-300 hover:-translate-y-1 active:scale-[0.97] ${
              copied
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-violet-200 bg-white/90 text-violet-700 hover:bg-violet-50'
            }`}
          >
            {copied ? (
              <>
                <Check size={17} />
                Caption Copied
              </>
            ) : (
              <>
                <Copy size={17} />
                Copy Caption
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-slate-800 active:scale-[0.97] sm:col-span-2"
          >
            <Share2 size={16} />
            Share with Other Apps
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-4 rounded-[18px] border border-violet-100 bg-white/75 p-3 backdrop-blur-xl sm:p-4">
        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-violet-600 sm:text-[9px]">
          Share Caption
        </p>

        <p className="mt-2 whitespace-pre-line text-[10px] font-semibold leading-5 text-slate-600 sm:text-[11px] sm:leading-6">
          {SHARE_TEXT}
        </p>
      </div>

      <style>{`
        @keyframes shareFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes facebookGlow {
          0%,
          100% {
            box-shadow: 0 16px 34px rgba(24, 119, 242, 0.28);
          }

          50% {
            box-shadow:
              0 18px 42px rgba(24, 119, 242, 0.48),
              0 0 0 7px rgba(24, 119, 242, 0.08);
          }
        }

        @keyframes shareShine {
          0% {
            background-position: 150% 0;
          }

          100% {
            background-position: -100% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </section>
  )
} 