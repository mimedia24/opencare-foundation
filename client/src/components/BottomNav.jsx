const navItems = [
  {
    id: 'home',
    label: 'Home',
    color: 'from-blue-600 to-cyan-500',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current">
        <path d="M3 10.8 12 3l9 7.8v9.7a.9.9 0 0 1-.9.9h-5.2v-6.2H9.1v6.2H3.9a.9.9 0 0 1-.9-.9v-9.7Z" />
      </svg>
    ),
  },
  {
    id: 'blood',
    label: 'Blood',
    color: 'from-rose-600 to-red-500',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current">
        <path d="M12 2.5s6.2 6.7 6.2 12.1A6.2 6.2 0 0 1 5.8 14.6C5.8 9.2 12 2.5 12 2.5Zm-2.7 12.8c0 1.7 1.3 3 3 3 .5 0 .9-.4.9-.9s-.4-.9-.9-.9c-.7 0-1.2-.5-1.2-1.2 0-.5-.4-.9-.9-.9s-.9.4-.9.9Z" />
      </svg>
    ),
  },
  {
    id: 'donate',
    label: 'Donate',
    color: 'from-violet-600 to-fuchsia-500',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current">
        <path d="M12 21s-7.2-4.4-9.4-9.4C1.1 8.1 3 4.8 6.4 4.4c2-.2 3.6.8 4.5 2.1.3.4.9.4 1.2 0 .9-1.3 2.5-2.3 4.5-2.1 3.4.4 5.3 3.7 3.8 7.2C19.2 16.6 12 21 12 21Z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    color: 'from-slate-800 to-slate-950',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current">
        <path d="M12 12.2a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4Zm0 2.2c-4.2 0-7.7 2.2-7.7 4.9 0 1 .8 1.9 1.9 1.9h11.6c1.1 0 1.9-.8 1.9-1.9 0-2.7-3.5-4.9-7.7-4.9Z" />
      </svg>
    ),
  },
]

export default function BottomNav({ activePage = 'home', onChange }) {
  return (
    <nav className="pointer-events-none fixed bottom-3 left-0 right-0 z-[9999] flex justify-center px-3 sm:bottom-5">
      <div className="pointer-events-auto relative grid h-[76px] w-full max-w-[500px] grid-cols-4 gap-2 rounded-[28px] border border-white/80 bg-white/85 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-8 -top-3 h-6 rounded-full bg-blue-400/20 blur-2xl" />

        {navItems.map((item) => {
          const isActive = activePage === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange && onChange(item.id)}
              className={`group relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-[22px] transition-all duration-300 ease-out active:scale-95 ${
                isActive
                  ? `bg-gradient-to-br ${item.color} text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)]`
                  : 'text-slate-400 hover:-translate-y-1 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <>
                  <span className="absolute inset-0 bg-white/10" />
                  <span className="absolute -top-8 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full bg-white/20 blur-xl motion-safe:animate-pulse" />
                  
                </>
              )}

              <span
                className={`relative grid h-8 w-8 place-items-center rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'scale-110 text-white'
                    : 'text-slate-400 group-hover:scale-110 group-hover:text-slate-800'
                }`}
              >
                {item.icon}
              </span>

              <span
                className={`relative mt-1 text-[10px] font-black leading-none transition-all duration-300 sm:text-[11px] ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <span className="absolute bottom-1.5 h-1 w-7 rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.85)]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}