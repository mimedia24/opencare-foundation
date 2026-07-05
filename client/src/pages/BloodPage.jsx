function formatBloodDate(date) {
  if (!date) return 'Not yet'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not yet'
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getWhatsAppLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '')

  if (!digits) return '#'

  if (digits.startsWith('880')) {
    return `https://wa.me/${digits}`
  }

  if (digits.startsWith('0')) {
    return `https://wa.me/88${digits}`
  }

  if (digits.startsWith('1')) {
    return `https://wa.me/880${digits}`
  }

  return `https://wa.me/${digits}`
}

function getDonorAvailability(nextEligibleDate) {
  if (!nextEligibleDate) {
    return {
      label: 'Available',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const nextDate = new Date(nextEligibleDate)

  if (Number.isNaN(nextDate.getTime())) {
    return {
      label: 'Available',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const today = new Date()

  if (nextDate <= today) {
    return {
      label: 'Available',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return {
    label: `${daysLeft} days left`,
    className: 'border-amber-100 bg-amber-50 text-amber-700',
  }
}

function BloodPage({ bloodGroups, bloodDonors, bloodLoading, bloodFilter, setBloodFilter }) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-red-100 bg-white/85 p-4 shadow-[0_28px_90px_rgba(190,18,60,0.12)] backdrop-blur-xl md:p-6">
      <style>{`
        @keyframes bloodFloat {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.55; }
          50% { transform: translateY(-18px) scale(1.08); opacity: 0.95; }
        }

        @keyframes bloodPulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.18); opacity: 1; }
        }

        @keyframes bloodSweep {
          0% { transform: translateX(-130%) skewX(-14deg); }
          100% { transform: translateX(180%) skewX(-14deg); }
        }

        .blood-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.24) 45%, transparent 70%);
          animation: bloodSweep 5.5s linear infinite;
          pointer-events: none;
        }

        .blood-drop {
          position: absolute;
          width: 18px;
          height: 24px;
          border-radius: 70% 70% 70% 0;
          transform: rotate(-45deg);
          background: rgba(255,255,255,0.18);
          animation: bloodFloat 5s ease-in-out infinite;
        }

        .blood-card-glow {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .blood-card-glow:hover {
          transform: translateY(-6px);
          border-color: rgba(225,29,72,0.35);
          box-shadow: 0 24px 60px rgba(225,29,72,0.18);
        }

        .blood-avatar-ring {
          animation: bloodPulse 3.4s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute -left-20 top-28 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />

      <div className="blood-hero relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#7f0008] via-[#e0001b] to-[#ff2f5f] p-5 text-white shadow-[0_26px_70px_rgba(225,29,72,0.32)] md:p-8">
        <span className="blood-drop left-[70%] top-10" />
        <span className="blood-drop right-12 top-20" style={{ animationDelay: '1.2s' }} />
        <span className="blood-drop bottom-8 left-[58%]" style={{ animationDelay: '2s' }} />

        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-20 left-20 h-72 w-72 rounded-full bg-red-950/25 blur-3xl" />

        <div className="relative z-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-white/90 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.95)]" />
              Blood Support
            </div>

            <h2 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
              Find Blood
              <span className="block text-white/90">Donors Fast</span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              Verified donors, last donation date, donation count and direct WhatsApp support in
              one smart blood support panel.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur-xl">
              <p className="text-3xl font-black">{bloodDonors.length}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                Donors
              </p>
            </div>

            <div className="rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur-xl">
              <p className="text-3xl font-black">{bloodFilter.bloodGroup || 'All'}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                Group
              </p>
            </div>

            <div className="rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur-xl">
              <p className="text-3xl font-black">90</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                Days Gap
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-5 rounded-[30px] border border-red-100 bg-gradient-to-br from-white via-rose-50/60 to-white p-4 shadow-[0_18px_50px_rgba(225,29,72,0.08)] md:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🩸</span>

            <input
              type="text"
              placeholder="Search district donors"
              value={bloodFilter.district}
              onChange={(e) =>
                setBloodFilter((prev) => ({
                  ...prev,
                  district: e.target.value,
                }))
              }
              className="h-14 w-full rounded-2xl border border-red-100 bg-white px-12 text-sm font-bold text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
          </div>

          <button
            onClick={() => setBloodFilter({ district: '', bloodGroup: '' })}
            className="h-14 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5"
          >
            Clear Search
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setBloodFilter((prev) => ({ ...prev, bloodGroup: '' }))}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${
              bloodFilter.bloodGroup === ''
                ? 'bg-slate-950 text-white shadow-lg'
                : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50'
            }`}
          >
            All
          </button>

          {bloodGroups.map((group) => (
            <button
              key={group}
              onClick={() => setBloodFilter((prev) => ({ ...prev, bloodGroup: group }))}
              className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${
                bloodFilter.bloodGroup === group
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-[22px] border border-red-100 bg-white/75 px-4 py-3 text-sm font-bold text-slate-600">
          {bloodLoading
            ? 'Searching donors...'
            : bloodDonors.length > 0
              ? `${bloodDonors.length} donor${bloodDonors.length > 1 ? 's' : ''} found ${
                  bloodFilter.district ? `in ${bloodFilter.district}` : ''
                } ${bloodFilter.bloodGroup ? `for ${bloodFilter.bloodGroup}` : ''}`
              : 'No matching donor found. Try another district or blood group.'}
        </div>
      </div>

      <div className="relative z-10 mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bloodLoading ? (
          <div className="rounded-[28px] border border-red-100 bg-white p-6 text-sm font-bold text-slate-500 shadow-sm">
            Loading blood donors...
          </div>
        ) : bloodDonors.length === 0 ? (
          <div className="rounded-[28px] border border-red-100 bg-white p-6 text-sm font-bold text-slate-500 shadow-sm">
            No blood donors found
          </div>
        ) : (
          bloodDonors.map((donor) => {
            const availability = getDonorAvailability(donor.nextEligibleDate)

            return (
              <div
                key={donor._id}
                className="blood-card-glow relative overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)]"
              >
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-red-500/10 blur-2xl" />
                <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-rose-500/10 blur-2xl" />

                <div className="relative bg-gradient-to-br from-[#fff5f5] via-white to-[#fff1f2] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative">
                        <div className="blood-avatar-ring absolute -inset-1 rounded-[24px] bg-gradient-to-r from-red-500 to-rose-500 opacity-40 blur-sm" />

                        <div className="relative h-16 w-16 overflow-hidden rounded-[22px] border-2 border-white bg-gradient-to-br from-red-600 to-rose-600 shadow-xl">
                          {donor.profilePhoto ? (
                            <img
                              src={donor.profilePhoto}
                              alt={donor.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-2xl font-black text-white">
                              {donor.name?.charAt(0)?.toUpperCase() || 'D'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-xl font-black text-slate-950">
                            {donor.name}
                          </h3>

                          {donor.isBloodDonorVerified && (
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                              Verified
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {donor.district || 'District not added'}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-3 py-2 text-sm font-black text-white shadow-[0_12px_26px_rgba(225,29,72,0.28)]">
                      {donor.bloodGroup}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[22px] border border-red-100 bg-white/85 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
                        Total Given
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {donor.totalBloodDonations || 0}
                      </p>
                    </div>

                    <div className={`rounded-[22px] border p-3 ${availability.className}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-black">{availability.label}</p>
                    </div>

                    <div className="rounded-[22px] border border-red-100 bg-white/85 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
                        Last Date
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {formatBloodDate(donor.lastBloodDonationDate)}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-red-100 bg-white/85 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
                        Next Date
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {formatBloodDate(donor.nextEligibleDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-[22px] border border-red-100 bg-white/85 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">{donor.phone}</p>
                  </div>

                  <div className="mt-3 rounded-[22px] border border-red-100 bg-white/85 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
                      Address
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-slate-700">
                      {donor.address || 'Address not added'}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <a
                      href={`tel:${donor.phone}`}
                      className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
                    >
                      Call Now
                    </a>

                    <a
                      href={getWhatsAppLink(donor.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-[#19b35b] text-sm font-black text-white shadow-[0_14px_30px_rgba(25,179,91,0.22)] transition hover:-translate-y-0.5"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

export default BloodPage