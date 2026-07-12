import {
  BadgeCheck,
  Crown,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <section className="mt-4 grid gap-4">
      <div className="group relative overflow-hidden rounded-[34px] border border-blue-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition duration-500 hover:shadow-[0_28px_80px_rgba(37,99,235,0.16)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.10),transparent_28%),radial-gradient(circle_at_85%_45%,rgba(139,92,246,0.10),transparent_30%)]" />

        <div className="relative min-h-[250px] overflow-hidden bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.35),transparent_28%),radial-gradient(circle_at_85%_30%,rgba(168,85,247,0.35),transparent_30%),linear-gradient(135deg,#020617,#172554_45%,#2563eb)] p-5 text-white sm:p-7 md:p-9">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl motion-safe:animate-pulse" />
          <div className="absolute -bottom-20 left-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl motion-safe:animate-pulse" />
          <div className="absolute left-12 top-12 hidden h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_30px_rgba(103,232,249,0.9)] md:block motion-safe:animate-bounce" />
          <div className="absolute right-1/3 top-16 hidden h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_28px_rgba(196,181,253,0.9)] md:block motion-safe:animate-ping" />
          <div className="absolute bottom-14 right-20 hidden h-3 w-3 rounded-full bg-blue-200 shadow-[0_0_30px_rgba(191,219,254,0.9)] md:block motion-safe:animate-pulse" />
          <div className="absolute right-12 top-12 hidden h-32 w-32 rounded-full border border-white/10 lg:block motion-safe:animate-[spin_18s_linear_infinite]" />
          <div className="absolute right-20 top-20 hidden h-20 w-20 rounded-full border border-cyan-300/20 lg:block motion-safe:animate-[spin_10s_linear_infinite_reverse]" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-100 shadow-lg backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                <ShieldCheck size={14} className="motion-safe:animate-pulse" />
                Executive Profile
              </div>

              <h2 className="mt-6 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl md:text-6xl">
                Foundation Leadership
              </h2>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-blue-100/85">
                A clean profile section for the chairman of Open Care Foundation.
              </p>
            </div>

            <div className="grid gap-2 rounded-[24px] border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
                Role
              </p>

              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Crown size={18} className="text-amber-300 motion-safe:animate-pulse" />
                Chairman
              </div>
            </div>
          </div>
        </div>

        <div className="relative -mt-16 px-4 pb-5 sm:px-6 sm:pb-7 md:px-8 md:pb-8">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="group/card relative overflow-hidden rounded-[32px] border border-blue-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(37,99,235,0.18)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.10),transparent_35%)] opacity-0 transition duration-500 group-hover/card:opacity-100" />
              <div className="absolute right-5 top-5 h-12 w-12 rounded-2xl bg-blue-50 opacity-80 transition duration-500 group-hover/card:rotate-12 group-hover/card:scale-110" />

              <div className="relative flex flex-col items-center text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-blue-400 to-violet-500 opacity-70 blur-xl motion-safe:animate-pulse" />

                  <div className="relative grid h-32 w-32 place-items-center rounded-[38px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-[0_22px_55px_rgba(37,99,235,0.32)] transition duration-500 group-hover/card:scale-105">
                    <UserRound size={58} />
                  </div>

                  <div className="absolute -bottom-3 -right-3 grid h-12 w-12 place-items-center rounded-2xl border-4 border-white bg-emerald-500 text-white shadow-lg transition duration-300 group-hover/card:scale-110">
                    <BadgeCheck size={22} />
                  </div>
                </div>

                <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                  Open Care Foundation
                </p>

                <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Mr. Ibrahim
                </h3>

                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition duration-300 hover:-translate-y-1 hover:bg-blue-100">
                  <Crown size={16} className="text-amber-500" />
                  Chairman
                </p>

                <p className="mt-4 max-w-xs text-sm font-semibold leading-7 text-slate-500">
                  Leading the vision, governance and humanitarian commitment of Open Care Foundation.
                </p>

                <div className="mt-5 grid w-full gap-2">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition duration-300 hover:-translate-y-1 hover:bg-blue-50">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 shadow-sm transition duration-300 hover:scale-110">
                      <HeartHandshake size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Organization
                      </p>
                      <p className="truncate text-sm font-black text-slate-950">
                        Open Care Foundation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition duration-300 hover:-translate-y-1 hover:bg-violet-50">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 shadow-sm transition duration-300 hover:scale-110">
                      <ShieldCheck size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Position
                      </p>
                      <p className="truncate text-sm font-black text-slate-950">
                        Chairman
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(37,99,235,0.12)] sm:p-6">
                <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-100 blur-3xl motion-safe:animate-pulse" />
                <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-violet-100 blur-3xl" />

                <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                      Profile Overview
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                      Chairman Profile
                    </h3>

                    <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
                      Mr. Ibrahim serves as the Chairman of Open Care Foundation. This profile section
                      presents the leadership identity of the foundation in a professional and clean
                      admin panel format.
                    </p>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg transition duration-500 hover:rotate-12 hover:scale-110">
                    <Sparkles size={24} className="motion-safe:animate-pulse" />
                  </div>
                </div>

                <div className="relative mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-blue-50 p-4 transition duration-300 hover:-translate-y-2 hover:bg-blue-100 hover:shadow-[0_18px_40px_rgba(37,99,235,0.12)]">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Crown size={18} className="text-amber-500" />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Leadership
                      </p>
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                      Strategic guidance and organizational direction.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-4 transition duration-300 hover:-translate-y-2 hover:bg-emerald-100 hover:shadow-[0_18px_40px_rgba(16,185,129,0.12)]">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <HeartHandshake size={18} />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Service
                      </p>
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                      Humanitarian support and community care commitment.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-violet-50 p-4 transition duration-300 hover:-translate-y-2 hover:bg-violet-100 hover:shadow-[0_18px_40px_rgba(139,92,246,0.12)]">
                    <div className="flex items-center gap-2 text-violet-700">
                      <Star size={18} className="motion-safe:animate-pulse" />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Vision
                      </p>
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                      Building transparent and trusted foundation operations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)]">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-50 blur-2xl" />

                  <p className="relative text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Identity
                  </p>

                  <div className="relative mt-4 grid gap-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition duration-300 hover:-translate-y-1 hover:bg-blue-50">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700 transition duration-300 hover:scale-110">
                        <UserRound size={18} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400">Name</p>
                        <p className="text-sm font-black text-slate-950">Mr. Ibrahim</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition duration-300 hover:-translate-y-1 hover:bg-amber-50">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 transition duration-300 hover:scale-110">
                        <Crown size={18} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400">Designation</p>
                        <p className="text-sm font-black text-slate-950">
                          Chairman, Open Care Foundation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)]">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-50 blur-2xl" />

                  <p className="relative text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Contact Preview
                  </p>

                  <div className="relative mt-4 grid gap-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition duration-300 hover:-translate-y-1 hover:bg-emerald-50">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 transition duration-300 hover:scale-110">
                        <Phone size={18} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400">Phone</p>
                        <p className="text-sm font-black text-slate-950">Not added</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition duration-300 hover:-translate-y-1 hover:bg-rose-50">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700 transition duration-300 hover:scale-110">
                        <Mail size={18} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400">Email</p>
                        <p className="text-sm font-black text-slate-950">Not added</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)]">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-600 via-cyan-400 to-violet-500" />

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Foundation Address
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm font-black text-slate-950">
                      <MapPin size={17} className="text-blue-600" />
                      Location will be added later
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 transition duration-300 hover:-translate-y-1 hover:bg-blue-100">
                    Display Only Profile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}