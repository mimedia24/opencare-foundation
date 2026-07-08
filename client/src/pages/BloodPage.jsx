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

function makeImageUrl(url) {
  if (!url) return ''

  if (
    String(url).startsWith('http://') ||
    String(url).startsWith('https://') ||
    String(url).startsWith('blob:') ||
    String(url).startsWith('data:')
  ) {
    return url
  }

  return url
}

function getDonorAvailability(nextEligibleDate) {
  if (!nextEligibleDate) {
    return {
      available: true,
      label: 'Available',
      shortLabel: 'Available',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const nextDate = new Date(nextEligibleDate)

  if (Number.isNaN(nextDate.getTime())) {
    return {
      available: true,
      label: 'Available',
      shortLabel: 'Available',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const today = new Date()

  if (nextDate <= today) {
    return {
      available: true,
      label: 'Available',
      shortLabel: 'Available',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return {
    available: false,
    label: `${daysLeft} days left`,
    shortLabel: `${daysLeft}d left`,
    className: 'border-amber-100 bg-amber-50 text-amber-700',
  }
}

const bangladeshDistricts = [
  'Bagerhat',
  'Bandarban',
  'Barguna',
  'Barishal',
  'Bhola',
  'Bogura',
  'Brahmanbaria',
  'Chandpur',
  'Chapai Nawabganj',
  'Chattogram',
  'Chuadanga',
  'Cox’s Bazar',
  'Cumilla',
  'Dhaka',
  'Dinajpur',
  'Faridpur',
  'Feni',
  'Gaibandha',
  'Gazipur',
  'Gopalganj',
  'Habiganj',
  'Jamalpur',
  'Jashore',
  'Jhalokathi',
  'Jhenaidah',
  'Joypurhat',
  'Khagrachhari',
  'Khulna',
  'Kishoreganj',
  'Kurigram',
  'Kushtia',
  'Lakshmipur',
  'Lalmonirhat',
  'Madaripur',
  'Magura',
  'Manikganj',
  'Meherpur',
  'Moulvibazar',
  'Munshiganj',
  'Mymensingh',
  'Naogaon',
  'Narail',
  'Narayanganj',
  'Narsingdi',
  'Natore',
  'Netrokona',
  'Nilphamari',
  'Noakhali',
  'Pabna',
  'Panchagarh',
  'Patuakhali',
  'Pirojpur',
  'Rajbari',
  'Rajshahi',
  'Rangamati',
  'Rangpur',
  'Satkhira',
  'Shariatpur',
  'Sherpur',
  'Sirajganj',
  'Sunamganj',
  'Sylhet',
  'Tangail',
  'Thakurgaon',
]

function BloodPage({ bloodGroups, bloodDonors, bloodLoading, bloodFilter, setBloodFilter }) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-red-100 bg-white/90 p-3 shadow-[0_20px_55px_rgba(190,18,60,0.10)] backdrop-blur-xl sm:rounded-[30px] sm:p-5">
      <style>{`
        @keyframes bloodSweep {
          0% { transform: translateX(-130%) skewX(-14deg); }
          100% { transform: translateX(180%) skewX(-14deg); }
        }

        .blood-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 45%, transparent 70%);
          animation: bloodSweep 5.8s linear infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl" />

      <div className="blood-hero relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(135deg,#7f0008,#e0001b_55%,#ff2f5f)] p-4 text-white shadow-[0_18px_45px_rgba(225,29,72,0.22)] sm:rounded-[28px] sm:p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />

        <div className="relative z-10 min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur-xl sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.95)]" />
            Blood Support
          </div>

          <h2 className="mt-3 text-[24px] font-black leading-[0.95] tracking-tight sm:text-5xl">
            Find Blood Donors
          </h2>

          <p className="mt-2 max-w-2xl text-[10px] font-semibold leading-4 text-white/85 sm:text-sm sm:leading-6">
            Search available donors by district and blood group.
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4 rounded-[22px] border border-red-100 bg-gradient-to-br from-white via-rose-50/60 to-white p-3 shadow-[0_14px_34px_rgba(225,29,72,0.07)] sm:rounded-[28px] sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🩸</span>

            <input
              type="text"
              placeholder="Search district"
              value={bloodFilter.district}
              onChange={(e) =>
                setBloodFilter((prev) => ({
                  ...prev,
                  district: e.target.value,
                }))
              }
              className="h-10 w-full rounded-2xl border border-red-100 bg-white px-8 pr-9 text-[11px] font-bold text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-100 sm:h-12 sm:text-sm"
            />

            {bloodFilter.district && (
              <button
                type="button"
                onClick={() =>
                  setBloodFilter((prev) => ({
                    ...prev,
                    district: '',
                  }))
                }
                className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500"
              >
                ×
              </button>
            )}
          </div>

          <div className="relative min-w-0">
            <select
              value={bloodFilter.district}
              onChange={(e) =>
                setBloodFilter((prev) => ({
                  ...prev,
                  district: e.target.value,
                }))
              }
              className="h-10 w-full appearance-none rounded-2xl border border-red-100 bg-white px-3 pr-9 text-[11px] font-black text-slate-800 outline-none shadow-inner focus:border-red-400 focus:ring-4 focus:ring-red-100 sm:h-12 sm:text-sm"
            >
              <option value="">Select District</option>
              {bangladeshDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
              ▼
            </span>
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setBloodFilter((prev) => ({ ...prev, bloodGroup: '' }))}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black transition sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm ${
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
              type="button"
              onClick={() => setBloodFilter((prev) => ({ ...prev, bloodGroup: group }))}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black transition sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm ${
                bloodFilter.bloodGroup === group
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        <div className="mt-2 rounded-[16px] border border-red-100 bg-white/75 px-3 py-2 text-[10px] font-bold leading-4 text-slate-600 sm:text-sm sm:leading-5">
          {bloodLoading
            ? 'Searching donors...'
            : bloodDonors.length > 0
              ? `${bloodDonors.length} donor${bloodDonors.length > 1 ? 's' : ''} found`
              : 'No matching donor found.'}
        </div>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bloodLoading ? (
          <div className="col-span-2 rounded-[20px] border border-red-100 bg-white p-5 text-xs font-bold text-slate-500 shadow-sm sm:text-sm">
            Loading blood donors...
          </div>
        ) : bloodDonors.length === 0 ? (
          <div className="col-span-2 rounded-[20px] border border-red-100 bg-white p-5 text-xs font-bold text-slate-500 shadow-sm sm:text-sm">
            No blood donors found
          </div>
        ) : (
          bloodDonors.map((donor) => {
            const availability = getDonorAvailability(donor.nextEligibleDate)
            const isAvailable = availability.available
            const photo = makeImageUrl(donor.profilePhoto)

            return (
              <article
                key={donor._id}
                className="relative min-w-0 overflow-hidden rounded-[18px] border border-red-100 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(225,29,72,0.13)] sm:rounded-[26px]"
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-500/10 blur-2xl" />
                <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-rose-500/10 blur-2xl" />

                <div className="relative bg-gradient-to-br from-[#fff7f7] via-white to-[#fff1f2] p-2 sm:p-4">
                  <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-3">
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[14px] border-2 border-white bg-gradient-to-br from-red-600 to-rose-600 shadow-lg sm:h-16 sm:w-16 sm:rounded-[22px]">
                        {photo ? (
                          <img src={photo} alt={donor.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-sm font-black text-white sm:text-2xl">
                            {donor.name?.charAt(0)?.toUpperCase() || 'D'}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-[9px] font-black leading-tight text-slate-950 sm:text-lg">
                          {donor.name || 'Donor'}
                        </h3>

                        <p className="mt-0.5 truncate text-[6.5px] font-bold text-slate-500 sm:text-xs">
                          {donor.district || 'District not added'}
                        </p>

                        {donor.isBloodDonorVerified && (
                          <span className="mt-1 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-1 py-0.5 text-[5.5px] font-black uppercase tracking-[0.06em] text-emerald-700 sm:px-2 sm:py-1 sm:text-[8px]">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-1.5 py-1 text-[8px] font-black text-white shadow-[0_8px_18px_rgba(225,29,72,0.22)] sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm">
                      {donor.bloodGroup || '--'}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-3">
                    <div className="rounded-[14px] border border-red-100 bg-white/90 p-1.5 sm:rounded-[20px] sm:p-3">
                      <p className="text-[5.5px] font-black uppercase tracking-[0.08em] text-red-400 sm:text-[9px]">
                        Given
                      </p>
                      <p className="mt-0.5 text-sm font-black text-slate-950 sm:text-2xl">
                        {donor.totalBloodDonations || 0}
                      </p>
                    </div>

                    <div
                      className={`rounded-[14px] border p-1.5 sm:rounded-[20px] sm:p-3 ${availability.className}`}
                    >
                      <p className="text-[5.5px] font-black uppercase tracking-[0.08em] sm:text-[9px]">
                        Status
                      </p>
                      <p className="mt-0.5 truncate text-[8px] font-black sm:text-sm">
                        {availability.shortLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
                    <div className="rounded-[14px] border border-red-100 bg-white/90 p-1.5 sm:rounded-[20px] sm:p-3">
                      <p className="text-[5.5px] font-black uppercase tracking-[0.08em] text-red-400 sm:text-[9px]">
                        Last Donation
                      </p>
                      <p className="mt-0.5 truncate text-[7.5px] font-black text-slate-900 sm:text-sm">
                        {formatBloodDate(donor.lastBloodDonationDate)}
                      </p>
                    </div>

                    <div className="rounded-[14px] border border-red-100 bg-white/90 p-1.5 sm:rounded-[20px] sm:p-3">
                      <p className="text-[5.5px] font-black uppercase tracking-[0.08em] text-red-400 sm:text-[9px]">
                        Next Date
                      </p>
                      <p className="mt-0.5 truncate text-[7.5px] font-black text-slate-900 sm:text-sm">
                        {formatBloodDate(donor.nextEligibleDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1.5 rounded-[14px] border border-red-100 bg-white/90 p-1.5 sm:mt-3 sm:rounded-[20px] sm:p-3">
                    <p className="text-[5.5px] font-black uppercase tracking-[0.08em] text-red-400 sm:text-[9px]">
                      Phone
                    </p>
                    <p className="mt-0.5 truncate text-[7.5px] font-black text-slate-900 sm:text-sm">
                      {isAvailable ? donor.phone : 'Hidden'}
                    </p>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2">
                    {isAvailable ? (
                      <>
                        <a
                          href={`tel:${donor.phone}`}
                          className="flex h-8 items-center justify-center rounded-xl bg-slate-950 text-[8px] font-black text-white shadow-lg transition hover:-translate-y-0.5 sm:h-11 sm:rounded-2xl sm:text-sm"
                        >
                          Call
                        </a>

                        <a
                          href={getWhatsAppLink(donor.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 items-center justify-center rounded-xl bg-[#19b35b] text-[8px] font-black text-white shadow-[0_14px_30px_rgba(25,179,91,0.22)] transition hover:-translate-y-0.5 sm:h-11 sm:rounded-2xl sm:text-sm"
                        >
                          WhatsApp
                        </a>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled
                          className="flex h-8 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 text-[8px] font-black text-slate-400 sm:h-11 sm:rounded-2xl sm:text-sm"
                        >
                          Call Off
                        </button>

                        <button
                          type="button"
                          disabled
                          className="flex h-8 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 text-[8px] font-black text-slate-400 sm:h-11 sm:rounded-2xl sm:text-sm"
                        >
                          WA Off
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default BloodPage