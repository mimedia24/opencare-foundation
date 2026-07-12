import { useEffect, useRef, useState } from 'react'
import {
  Droplets,
  HeartHandshake,
  Home,
  Info,
  LayoutGrid,
  Menu,
  MessageCircle,
  ReceiptText,
  Share2,
  UserRound,
  X,
} from 'lucide-react'

import logo from '../assets/icon.png'

const FACEBOOK_PAGE =
  'https://www.facebook.com/profile.php?id=61576501487677'

const menuItems = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    subtitle: 'Foundation overview',
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: LayoutGrid,
    subtitle: 'See active projects',
  },
  {
    key: 'donate',
    label: 'Donate',
    icon: HeartHandshake,
    subtitle: 'Submit donation proof',
  },
  {
    key: 'transparency',
    label: 'Transparency',
    icon: ReceiptText,
    subtitle: 'View public expenses',
  },
  {
    key: 'blood',
    label: 'Blood',
    icon: Droplets,
    subtitle: 'Find blood donors',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: UserRound,
    subtitle: 'Account and volunteer',
  },
]

const socialLinks = [
  {
    label: 'Facebook Page',
    href: FACEBOOK_PAGE,
    icon: Share2,
  },
  {
    label: 'Facebook Group',
    href: FACEBOOK_PAGE,
    icon: MessageCircle,
  },
]

export default function TopNav({
  activePage,
  navigateToPage,
  currentUser,
}) {
  const [open, setOpen] = useState(false)
  const sidebarContentRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    sidebarContentRef.current?.scrollTo({
      top: 0,
    })

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const handleNavigate = (page) => {
    if (typeof navigateToPage === 'function') {
      navigateToPage(page)
    }

    setOpen(false)
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[10000] cursor-default bg-slate-950/65 backdrop-blur-sm"
        />
      )}

      <header className="fixed left-0 right-0 top-0 z-30 bg-[#f3f7fd]/90 px-3 py-3 backdrop-blur-xl sm:px-4 md:px-6">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-[24px] border border-white/80 bg-white/90 px-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:h-16 sm:px-4">
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_25px_rgba(37,99,235,0.18)] sm:h-11 sm:w-11">
              <img
                src={logo}
                alt="Open Care logo"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-black tracking-[-0.04em] text-slate-950 sm:text-xl">
                Open Care
              </p>

              <p className="truncate text-[8px] font-black uppercase tracking-[0.18em] text-sky-600 sm:text-[10px]">
                Foundation
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            {menuItems.slice(0, 4).map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.key)}
                  className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-xs font-black transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-lg'
                      : 'bg-slate-50 text-slate-600 hover:-translate-y-0.5 hover:bg-sky-50 hover:text-sky-700'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavigate('profile')}
              className="hidden h-11 items-center gap-2 rounded-2xl bg-sky-50 px-4 text-xs font-black text-sky-700 sm:flex"
            >
              <UserRound size={16} />
              {currentUser?.name || 'Login'}
            </button>

            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500 text-white shadow-[0_14px_30px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5 hover:bg-sky-600 sm:h-11 sm:w-11"
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[10001] w-[88%] max-w-[390px] transform overflow-hidden bg-[#06101f] text-white transition-[transform,visibility,box-shadow] duration-300 ease-out ${
          open
            ? 'visible translate-x-0 shadow-[-20px_0_60px_rgba(2,6,23,0.45)]'
            : 'invisible pointer-events-none translate-x-full shadow-none'
        }`}
      >
        <div
          ref={sidebarContentRef}
          className="h-full overflow-y-auto overscroll-contain px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))] sm:px-5"
        >
          <div className="flex min-h-full flex-col">
            <div className="relative shrink-0 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.35),transparent_30%),linear-gradient(135deg,#0f172a,#172554_55%,#2563eb)] p-4 sm:p-5">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />

              <div className="relative flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleNavigate('home')}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg">
                    <img
                      src={logo}
                      alt="Open Care logo"
                      className="h-full w-full object-contain p-1"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black tracking-[-0.04em] sm:text-xl">
                      Open Care
                    </h3>

                    <p className="truncate text-[9px] font-black uppercase tracking-[0.20em] text-blue-100 sm:text-[10px]">
                      Foundation
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="relative mt-4 text-xs font-semibold leading-5 text-blue-100/85 sm:mt-5 sm:text-sm sm:leading-6">
                Navigate all public pages, donation projects and transparency
                records from here.
              </p>
            </div>

            <div className="mt-4 grid shrink-0 gap-2 sm:mt-5">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activePage === item.key

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavigate(item.key)}
                    className={`group flex min-h-[68px] w-full items-center gap-3 rounded-[22px] px-3 py-2.5 text-left transition ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]'
                        : 'bg-white/[0.06] text-slate-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105 ${
                        isActive ? 'bg-white/20' : 'bg-white/10'
                      }`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">
                        {item.label}
                      </p>

                      <p
                        className={`mt-0.5 truncate text-[11px] font-semibold sm:text-xs ${
                          isActive
                            ? 'text-white/80'
                            : 'text-slate-300'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 shrink-0 rounded-[26px] border border-white/10 bg-white/[0.06] p-4 sm:mt-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">
                Social & Information
              </p>

              <div className="mt-3 grid gap-2">
                {socialLinks.map((item) => {
                  const Icon = item.icon

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex min-h-12 items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                    >
                      <Icon size={18} />
                      <span className="truncate">
                        {item.label}
                      </span>
                    </a>
                  )
                })}

                <button
                  type="button"
                  onClick={() => handleNavigate('about')}
                  className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition hover:-translate-y-0.5 ${
                    activePage === 'about'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
                      : 'bg-white/[0.06] text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Info size={18} />
                  <span className="truncate">
                    About Open Care
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-auto shrink-0 pt-5">
              <button
                type="button"
                onClick={() => handleNavigate('donate')}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1"
              >
                Donate Now
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}