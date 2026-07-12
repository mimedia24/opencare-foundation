import {
  ArrowRight,
  BadgeCheck,
  Droplets,
  CheckCircle2,
  FileBarChart,
  FolderHeart,
  HandHeart,
  HeartHandshake,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  Users,
  WalletCards,
} from 'lucide-react'

const features = [
  {
    icon: FolderHeart,
    title: 'Project-based support',
    text: 'চলমান মানবিক প্রকল্প দেখুন, লক্ষ্য ও সংগৃহীত অর্থের অগ্রগতি বুঝুন এবং নির্দিষ্ট প্রকল্পে সরাসরি সহায়তা দিন।',
    accent: 'from-blue-500 to-cyan-400',
  },
  {
    icon: HandHeart,
    title: 'Simple donation flow',
    text: 'সাধারণ ফান্ড অথবা নির্দিষ্ট প্রকল্প নির্বাচন করে অনুদানের তথ্য ও প্রমাণ সহজভাবে জমা দেওয়া যায়।',
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    icon: ReceiptText,
    title: 'Public transparency',
    text: 'ফাউন্ডেশনের প্রকাশিত ব্যয়, ব্যয়ের ধরন, তারিখ, পরিমাণ ও প্রমাণ জনসম্মুখে দেখার ব্যবস্থা রয়েছে।',
    accent: 'from-rose-500 to-orange-400',
  },
  {
    icon: Droplets,
    title: 'Blood donor network',
    text: 'রক্তের গ্রুপ ও জেলা অনুযায়ী সম্ভাব্য রক্তদাতা খুঁজে মানবিক জরুরি প্রয়োজনে দ্রুত যোগাযোগ করা যায়।',
    accent: 'from-red-500 to-rose-500',
  },
  {
    icon: UserRoundCheck,
    title: 'Member profile',
    text: 'ব্যবহারকারী নিজের প্রোফাইল, যোগাযোগের তথ্য এবং স্বেচ্ছাসেবক বা রক্তদাতা-সংক্রান্ত তথ্য পরিচালনা করতে পারেন।',
    accent: 'from-emerald-500 to-teal-400',
  },
  {
    icon: FileBarChart,
    title: 'Public reports',
    text: 'অনুদান, ব্যয়, অবশিষ্ট ফান্ড, ক্যাটাগরি এবং রক্তদান-সংক্রান্ত সারসংক্ষেপ রিপোর্ট দেখার সুবিধা রয়েছে।',
    accent: 'from-indigo-500 to-blue-500',
  },
]

const principles = [
  {
    icon: ShieldCheck,
    title: 'বিশ্বাস',
    text: 'প্রকাশ্য তথ্য ও পরিষ্কার হিসাবের মাধ্যমে মানুষের আস্থা তৈরি করা।',
  },
  {
    icon: Target,
    title: 'লক্ষ্যভিত্তিক সহায়তা',
    text: 'সঠিক প্রকল্প ও প্রয়োজনের কাছে সহায়তা পৌঁছে দেওয়ার একটি গোছানো পথ তৈরি করা।',
  },
  {
    icon: Users,
    title: 'মানুষের সংযোগ',
    text: 'দাতা, স্বেচ্ছাসেবক, রক্তদাতা ও সহায়তা-প্রত্যাশীদের একই মানবিক প্ল্যাটফর্মে যুক্ত করা।',
  },
]

const donationFlow = [
  'চলমান প্রকল্প অথবা সাধারণ ফান্ড নির্বাচন করুন',
  'নিজের তথ্য ও অনুদানের পরিমাণ প্রদান করুন',
  'প্রয়োজনীয় লেনদেনের প্রমাণ জমা দিন',
  'যাচাই শেষে তথ্য সংশ্লিষ্ট ফান্ড বা প্রকল্পে যুক্ত হয়',
  'প্রকাশিত ব্যয় ও রিপোর্ট থেকে কার্যক্রম অনুসরণ করুন',
]

export default function AboutPage({ navigateToPage }) {
  return (
    <main className="relative isolate overflow-hidden rounded-[28px] bg-[#07111f] text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:rounded-[36px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-20 h-72 w-72 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-cyan-400/20 blur-[90px]" />

        <div className="absolute -right-24 top-36 h-80 w-80 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-violet-500/20 blur-[100px] [animation-delay:1s]" />

        <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-blue-500/15 blur-[100px] [animation-delay:2s]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <section className="relative px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:px-14 lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
            <div className="animate-[fadeInUp_.8s_ease-out_both]">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200 backdrop-blur-xl sm:text-xs">
                <Sparkles size={15} />
                About Open Care Foundation
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                মানবিক সহায়তাকে

                <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                  আরও স্বচ্ছ ও সহজ
                </span>

                করার ডিজিটাল উদ্যোগ
              </h1>

              <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-slate-300 sm:text-base sm:leading-8">
                Open Care Foundation একটি মানবিক ডিজিটাল প্ল্যাটফর্ম।
                এখানে অনুদান, প্রকল্প পরিচালনা, প্রকাশ্য ব্যয়ের হিসাব,
                রক্তদাতা খোঁজা, সদস্য প্রোফাইল এবং জনসাধারণের জন্য
                রিপোর্ট—সবকিছু একটি সংগঠিত ব্যবস্থার মধ্যে রাখা হয়েছে।
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigateToPage?.('donate')}
                  className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 text-sm font-black text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.22)] transition hover:-translate-y-1"
                >
                  Donate Now

                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigateToPage?.('projects')}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 text-sm font-black text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Explore Projects
                </button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[470px] animate-[fadeInUp_.9s_.15s_ease-out_both]">
              <div className="absolute -inset-5 animate-[pulse_5s_ease-in-out_infinite] rounded-[40px] bg-gradient-to-br from-cyan-400/20 to-violet-500/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[34px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-xl">
                      <HeartHandshake size={28} />
                    </div>

                    <div>
                      <p className="text-xl font-black tracking-[-0.04em]">
                        Open Care
                      </p>

                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                        Foundation
                      </p>
                    </div>
                  </div>

                  <BadgeCheck
                    className="text-cyan-300"
                    size={28}
                  />
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  {[
                    ['Donation', WalletCards],
                    ['Projects', FolderHeart],
                    ['Transparency', ReceiptText],
                    ['Blood Network', Droplets],
                  ].map(([label, Icon]) => (
                    <div
                      key={label}
                      className="group rounded-[22px] border border-white/10 bg-slate-950/30 p-4 transition duration-500 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
                    >
                      <Icon
                        size={21}
                        className="text-cyan-300 transition group-hover:scale-110"
                      />

                      <p className="mt-3 text-xs font-black text-white">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-[22px] bg-gradient-to-r from-blue-500/20 to-violet-500/20 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <CheckCircle2 size={20} />
                  </div>

                  <p className="text-xs font-bold leading-5 text-slate-200">
                    One platform for giving, tracking,
                    transparency and community service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/10 bg-white/[0.035] px-5 py-14 sm:px-8 sm:py-20 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300 sm:text-xs">
              Platform Systems
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
              এই প্ল্যাটফর্মে কী কী রয়েছে
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-400 sm:text-base">
              প্রতিটি অংশ এমনভাবে সাজানো হয়েছে যেন সাধারণ ব্যবহারকারী
              দ্রুত বুঝতে পারেন, সহজে কাজ সম্পন্ন করতে পারেন এবং
              প্রকাশিত তথ্য অনুসরণ করতে পারেন।
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl transition duration-500 hover:-translate-y-2 hover:border-white/20 hover:bg-white/[0.09]"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.accent}`}
                  />

                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-lg transition duration-500 group-hover:rotate-3 group-hover:scale-110`}
                  >
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-lg font-black tracking-[-0.03em]">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">
                    {feature.text}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative px-5 py-14 sm:px-8 sm:py-20 lg:px-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300 sm:text-xs">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
              অনুদানের পরিষ্কার কার্যপ্রবাহ
            </h2>

            <div className="mt-8 space-y-3">
              {donationFlow.map((item, index) => (
                <div
                  key={item}
                  className="group flex gap-4 rounded-[22px] border border-white/10 bg-white/[0.045] p-4 transition hover:translate-x-1 hover:bg-white/[0.08]"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-black shadow-lg">
                    {index + 1}
                  </div>

                  <p className="self-center text-sm font-bold leading-6 text-slate-300">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300 sm:text-xs">
              Our principles
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
              যে মূল্যবোধে আমরা কাজ করি
            </h2>

            <div className="mt-8 grid gap-4">
              {principles.map((item) => {
                const Icon = item.icon

                return (
                  <article
                    key={item.title}
                    className="group rounded-[26px] border border-white/10 bg-gradient-to-r from-white/[0.07] to-transparent p-5 transition duration-500 hover:-translate-y-1 hover:border-emerald-300/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300 transition group-hover:scale-110">
                        <Icon size={23} />
                      </div>

                      <div>
                        <h3 className="text-lg font-black">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-blue-300/15 bg-blue-400/10 p-5">
              <LockKeyhole
                className="mt-0.5 shrink-0 text-blue-300"
                size={21}
              />

              <p className="text-xs font-semibold leading-6 text-blue-100/80">
                ব্যবহারকারীর তথ্য ব্যবহারের ক্ষেত্রে প্রয়োজনীয়
                গোপনীয়তা ও নিরাপত্তা বজায় রাখা গুরুত্বপূর্ণ।
                প্রকাশ্য অংশে কেবল সেবার জন্য প্রয়োজনীয় তথ্য
                দেখানো উচিত।
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 pb-8 sm:px-8 sm:pb-12 lg:px-14">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 shadow-2xl sm:p-9">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">
                Be a part of the care
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-4xl">
                মানবিক কাজে আপনার অংশগ্রহণ গুরুত্বপূর্ণ
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-blue-100/80">
                একটি অনুদান, একটি শেয়ার অথবা একজন রক্তদাতার
                তথ্য—প্রতিটি ছোট উদ্যোগ কারও জীবনে বড় পরিবর্তন
                আনতে পারে।
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigateToPage?.('donate')}
              className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-indigo-700 shadow-xl transition hover:-translate-y-1"
            >
              Start Helping

              <ArrowRight
                size={17}
                className="transition group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  )
}