import { useEffect, useMemo, useState } from 'react'
import donationBg from './assets/hunger-bg.jpg'

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const end = Number(target) || 0
    let startTime = null
    let frameId

    const animate = (time) => {
      if (!startTime) startTime = time
      const progress = Math.min((time - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(end * eased))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    setValue(0)
    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [target, duration])

  return value
}

function maskPhone(phone) {
  const value = String(phone || '')
  if (value.length <= 6) return value
  return `${value.slice(0, 3)}*****${value.slice(-3)}`
}

function App() {
  const [stats, setStats] = useState({
    totalDonation: 0,
    totalExpense: 0,
    availableFund: 0,
  })

  const [topDonors, setTopDonors] = useState([])
  const [donations, setDonations] = useState([])
  const [expenses, setExpenses] = useState([])

  const [phone, setPhone] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)

  const [showDonateModal, setShowDonateModal] = useState(false)
  const [donateLoading, setDonateLoading] = useState(false)
  const [donateForm, setDonateForm] = useState({
    name: '',
    phone: '',
    amount: '',
    trxId: '',
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  const loadDashboardData = async () => {
    try {
      const [statsRes, topRes, donationsRes, expensesRes] = await Promise.all([
        fetch(`${API}/api/stats`),
        fetch(`${API}/api/donations/top`),
        fetch(`${API}/api/donations`),
        fetch(`${API}/api/expenses`),
      ])

      const statsData = await statsRes.json()
      const topData = await topRes.json()
      const donationsData = await donationsRes.json()
      const expensesData = await expensesRes.json()

      setStats(statsData)
      setTopDonors(topData)
      setDonations(donationsData)
      setExpenses(expensesData)
    } catch (error) {
      console.log(error)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return

    try {
      setSearchLoading(true)
      const res = await fetch(`${API}/api/donations/search/${phone}`)
      const data = await res.json()
      setSearchResult(data)
    } catch (error) {
      console.log(error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleDonateInput = (e) => {
    const { name, value } = e.target
    setDonateForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDonateSubmit = async (e) => {
    e.preventDefault()

    if (!donateForm.name || !donateForm.phone || !donateForm.amount || !donateForm.trxId) {
      alert('Please fill all donation fields')
      return
    }

    try {
      setDonateLoading(true)

      const res = await fetch(`${API}/api/donations/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: donateForm.name,
          phone: donateForm.phone,
          amount: Number(donateForm.amount),
          trxId: donateForm.trxId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Donation failed')
      }

      setDonateForm({
        name: '',
        phone: '',
        amount: '',
        trxId: '',
      })

      setShowDonateModal(false)
      await loadDashboardData()
      alert('Donation added successfully')
    } catch (error) {
      console.log(error)
      alert(error.message || 'Something went wrong')
    } finally {
      setDonateLoading(false)
    }
  }

  const animatedDonation = useCountUp(stats.totalDonation, 1700)
  const animatedExpense = useCountUp(stats.totalExpense, 1300)
  const animatedFund = useCountUp(stats.availableFund, 1500)

  const topDonorList = useMemo(() => topDonors.slice(0, 10), [topDonors])
  const topDonorSlides = useMemo(() => [...topDonorList, ...topDonorList], [topDonorList])

  const recentDonations = useMemo(() => donations.slice(0, 10), [donations])
  const recentDonationSlides = useMemo(() => [...recentDonations, ...recentDonations], [recentDonations])

  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses])

  return (
    <div className="min-h-screen bg-[#f3f7fd] text-slate-900">
      <style>{`
        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#2153c9] via-[#1a3d97] to-[#5a4ff0] px-4 py-4 text-white shadow-[0_20px_60px_rgba(37,99,235,0.22)] sm:rounded-[28px] sm:px-5 sm:py-5 md:rounded-[32px] md:px-8 md:py-10">
          <img
            src={donationBg}
            alt="Hungry children"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-slate-950/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17357f]/85 via-[#1a3d97]/72 to-[#5a4ff0]/55" />
          <div className="absolute inset-0 backdrop-[blur(1.5px)]" />

          <div className="relative z-10">
            <p className="text-[14px] font-black uppercase tracking-[0.12em] text-white/90 sm:text-sm md:text-2xl md:tracking-[0.18em]">
              Open Care Foundation
            </p>

            <div className="mt-4 flex items-end justify-between gap-3 sm:gap-4 md:mt-3 md:gap-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-[34px] font-black leading-[0.95] tracking-tight sm:text-4xl md:max-w-4xl md:text-6xl">
                  Total Donation
                </h2>
                <p className="mt-2 max-w-xs text-[11px] leading-4 text-blue-100/85 sm:max-w-sm sm:text-xs md:mt-3 md:max-w-2xl md:text-base md:leading-6">
                  Real-time fund insights
                </p>
              </div>

              <div className="w-[44%] shrink-0 rounded-[18px] border border-white/20 bg-white/12 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl sm:w-[42%] md:w-auto md:rounded-[28px] md:px-6 md:py-5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-blue-100/80 sm:text-[9px] md:text-xs md:tracking-[0.28em]">
                  Live Collected
                </p>
                <div className="mt-2 flex items-end gap-1 sm:gap-1.5 md:mt-3 md:gap-2">
                  <span className="text-[10px] font-bold tracking-wide text-white/90 sm:text-xs md:text-base">
                    BDT
                  </span>
                  <span className="text-2xl font-black leading-none sm:text-5xl md:text-7xl">
                    {animatedDonation}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-[22px] border border-slate-200 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:-translate-y-1 md:rounded-[28px] md:p-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400 sm:text-[11px] md:tracking-[0.32em]">
              Total Expense
            </p>
            <div className="mt-3 flex items-end gap-1.5 md:mt-4 md:gap-2">
              <span className="text-[11px] font-bold tracking-wide text-slate-500 md:text-base">BDT</span>
              <span className="text-xl font-black text-slate-900 sm:text-4xl md:text-5xl">
                {animatedExpense}
              </span>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:-translate-y-1 md:rounded-[28px] md:p-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400 sm:text-[11px] md:tracking-[0.32em]">
              Available Fund
            </p>
            <div className="mt-3 flex items-end gap-1.5 md:mt-4 md:gap-2">
              <span className="text-[11px] font-bold tracking-wide text-slate-500 md:text-base">BDT</span>
              <span className="text-xl font-black text-slate-900 sm:text-4xl md:text-5xl">
                {animatedFund}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-[#eef4ff] via-white to-[#f7fbff] p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:rounded-[30px] md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Donate</h3>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700 md:px-4 md:py-2 md:text-[11px] md:tracking-[0.25em]">
                Support Now
              </span>
            </div>

            <div className="rounded-[20px] border border-white/70 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl md:rounded-[24px] md:p-5">
              <p className="text-sm leading-6 text-slate-600">
                Your small contribution can make a visible difference. Every donation is counted,
                shown publicly, and reflected in the live fund summary.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white">
                  Give
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-[11px] font-semibold text-indigo-700">
                  Impact
                </span>
                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-[11px] font-semibold text-sky-700">
                  Change
                </span>
              </div>

              <button
                onClick={() => setShowDonateModal(true)}
                className="mt-5 h-12 w-full rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-500 to-indigo-500 px-6 text-base font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.18)] transition hover:-translate-y-0.5 md:h-14 md:px-8 md:text-lg"
              >
                Donate Now
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:rounded-[30px] md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Donor Search</h3>
              <span className="hidden rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 backdrop-blur-xl md:block">
                Search History
              </span>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                placeholder="Enter donor phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 py-4 flex-1 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300 md:h-14 md:px-5 md:text-base"
              />

              <button
                type="submit"
                className="h-12 rounded-2xl border border-white/70 bg-white/70 px-6 text-sm font-semibold text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white md:h-14 md:px-8 md:text-base"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchResult && (
              <div className="mt-4">
                <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                  <div className="rounded-[20px] border border-slate-200 bg-[#f8fafc] p-4 md:rounded-[24px] md:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 md:text-[11px] md:tracking-[0.28em]">
                      Phone
                    </p>
                    <p className="mt-2 text-xl font-black md:mt-3 md:text-2xl">{searchResult.phone}</p>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-[#f8fafc] p-4 md:rounded-[24px] md:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 md:text-[11px] md:tracking-[0.28em]">
                      Total Donated
                    </p>
                    <p className="mt-2 text-xl font-black md:mt-3 md:text-2xl">BDT {searchResult.totalDonated}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {searchResult.history?.length > 0 ? (
                    searchResult.history.map((item) => (
                      <div
                        key={item._id}
                        className="flex flex-col gap-2 rounded-[18px] border border-slate-200 bg-[#f8fafc] p-4 transition hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between md:rounded-[22px]"
                      >
                        <div>
                          <h4 className="text-base font-bold md:text-lg">{item.name}</h4>
                          <p className="text-xs text-slate-500 md:text-sm">TRX: {item.trxId}</p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xl font-black md:text-2xl">BDT {item.amount}</p>
                          <p className="text-xs capitalize text-slate-500 md:text-sm">{item.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">No history found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:rounded-[30px] md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black sm:text-2xl">Top Donors</h3>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 backdrop-blur-xl md:px-4 md:py-2 md:text-[11px] md:tracking-[0.25em]">
              Top 10 Live
            </span>
          </div>

          {topDonorSlides.length === 0 ? (
            <p className="text-sm text-slate-500">No donor data found</p>
          ) : (
            <div className="overflow-hidden">
              <div
                className="flex w-max gap-2.5"
                style={{ animation: 'marqueeLeft 22s linear infinite' }}
              >
                {topDonorSlides.map((donor, index) => (
                  <div
                    key={`${donor.phone}-${index}`}
                    className="w-[160px] shrink-0 rounded-[18px] border border-slate-200 bg-gradient-to-br from-[#ffffff] to-[#eef4ff] p-3 shadow-sm sm:w-[180px] sm:rounded-[20px] sm:p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-xl bg-slate-900 px-2.5 py-1 text-[9px] font-bold text-white sm:text-[10px]">
                        #{(index % topDonorList.length) + 1}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-[9px]">
                        Top
                      </span>
                    </div>

                    <h4 className="mt-3 text-sm font-black sm:text-base">{donor.name}</h4>
                    <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{maskPhone(donor.phone)}</p>
                    <p className="mt-3 text-lg font-black text-indigo-600 sm:text-xl">BDT {donor.totalDonated}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:rounded-[30px] md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black sm:text-2xl">Recent Donations</h3>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 backdrop-blur-xl md:px-4 md:py-2 md:text-[11px] md:tracking-[0.25em]">
              Sliding Feed
            </span>
          </div>

          {recentDonationSlides.length === 0 ? (
            <p className="text-sm text-slate-500">No donations found</p>
          ) : (
            <div className="overflow-hidden">
              <div
                className="flex w-max gap-2.5"
                style={{ animation: 'marqueeLeft 26s linear infinite' }}
              >
                {recentDonationSlides.map((donation, index) => (
                  <div
                    key={`${donation._id}-${index}`}
                    className="w-[170px] shrink-0 rounded-[18px] border border-slate-200 bg-gradient-to-br from-[#ffffff] to-[#f3f6ff] p-3 shadow-sm sm:w-[190px] sm:rounded-[20px] sm:p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-[9px]">
                        Recent
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold capitalize text-emerald-600 sm:text-[9px]">
                        {donation.status}
                      </span>
                    </div>

                    <h4 className="mt-3 text-sm font-black sm:text-base">{donation.name}</h4>
                    <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{maskPhone(donation.phone)}</p>
                    <p className="mt-3 text-lg font-black text-sky-600 sm:text-xl">BDT {donation.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:rounded-[30px] md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black sm:text-2xl">Recent Expenses</h3>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 backdrop-blur-xl md:px-4 md:py-2 md:text-[11px] md:tracking-[0.25em]">
              Expense Log
            </span>
          </div>

          <div className="space-y-3">
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses found</p>
            ) : (
              recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex flex-col gap-2 rounded-[18px] border border-slate-200 bg-[#f8fafc] p-4 transition hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between md:rounded-[22px]"
                >
                  <div>
                    <h4 className="text-base font-bold md:text-lg">{expense.title}</h4>
                    <p className="text-xs text-slate-500 md:text-sm">{expense.category}</p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xl font-black text-rose-600 md:text-2xl">BDT {expense.amount}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[24px] border border-white/40 bg-white/80 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl md:rounded-[30px] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900 md:text-2xl">Manual Donate</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Temporary manual donation form. Later we will connect bKash.
                </p>
              </div>

              <button
                onClick={() => setShowDonateModal(false)}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleDonateSubmit} className="grid gap-3 md:grid-cols-2 md:gap-4">
              <input
                type="text"
                name="name"
                placeholder="Donor name"
                value={donateForm.name}
                onChange={handleDonateInput}
                className="h-12 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300 md:h-14 md:px-5 md:text-base"
              />

              <input
                type="text"
                name="phone"
                placeholder="Phone number"
                value={donateForm.phone}
                onChange={handleDonateInput}
                className="h-12 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300 md:h-14 md:px-5 md:text-base"
              />

              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={donateForm.amount}
                onChange={handleDonateInput}
                className="h-12 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300 md:h-14 md:px-5 md:text-base"
              />

              <input
                type="text"
                name="trxId"
                placeholder="Transaction ID"
                value={donateForm.trxId}
                onChange={handleDonateInput}
                className="h-12 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300 md:h-14 md:px-5 md:text-base"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={donateLoading}
                  className="h-12 w-full rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-500 to-indigo-500 px-6 text-base font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.18)] transition hover:-translate-y-0.5 disabled:opacity-70 md:h-14 md:px-8 md:text-lg"
                >
                  {donateLoading ? 'Saving Donation...' : 'Submit Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App