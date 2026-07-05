import { useState } from 'react'
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
    href: '#',
    icon: Share2,
  },
  {
    label: 'Facebook Group',
    href: '#',
    icon: MessageCircle,
  },
  {
    label: 'About Open Care',
    href: '#',
    icon: Info,
  },
]

export default function TopNav({ activePage, navigateToPage, currentUser }) {
  const [open, setOpen] = useState(false)

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
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
        />
      )}

      <header className="fixed left-0 right-0 top-0 z-30 bg-[#f3f7fd]/90 px-3 py-3 backdrop-blur-xl sm:px-4 md:px-6">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-[24px] border border-white/80 bg-white/90 px-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:h-16 sm:px-4">
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-[0_14px_30px_rgba(37,99,235,0.25)] sm:h-11 sm:w-11">
              <HeartHandshake size={21} />
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

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.key)}
                  className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-xs font-black transition ${
                    activePage === item.key
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
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500 text-white shadow-[0_14px_30px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5 hover:bg-sky-600 sm:h-11 sm:w-11"
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[86%] max-w-[390px] transform bg-[#06101f] text-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.35),transparent_30%),linear-gradient(135deg,#0f172a,#172554_55%,#2563eb)] p-5">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-sky-700 shadow-lg">
                  <HeartHandshake size={24} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black tracking-[-0.04em]">
                    Open Care
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">
                    Foundation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-xl"
              >
                <X size={20} />
              </button>
            </div>

            <p className="relative mt-5 text-sm font-semibold leading-6 text-blue-100/85">
              Navigate all public pages, donation projects and transparency records from here.
            </p>
          </div>

          <div className="mt-5 grid gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.key)}
                  className={`group flex items-center gap-3 rounded-[22px] p-3 text-left transition ${
                    activePage === item.key
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 text-slate-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105 ${
                      activePage === item.key ? 'bg-white/20' : 'bg-white/10'
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-black">{item.label}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-300">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-[26px] border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">
              Social Links
            </p>

            <div className="mt-3 grid gap-2">
              {socialLinks.map((item) => {
                const Icon = item.icon

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href === '#' ? '_self' : '_blank'}
                    rel="noreferrer"
                    className="flex h-12 items-center gap-3 rounded-2xl bg-white/5 px-4 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                  >
                    <Icon size={18} />
                    {item.label}
                  </a>
                )
              })}
            </div>
          </div>

          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={() => handleNavigate('donate')}
              className="h-13 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1"
            >
              Donate Now
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}