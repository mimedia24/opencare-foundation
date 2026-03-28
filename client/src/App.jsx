import { useEffect, useMemo, useState } from 'react'

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

  const loadDashboardData = async () => {
    try {
      const [statsRes, topRes, donationsRes, expensesRes] = await Promise.all([
        fetch('http://localhost:5000/api/stats'),
        fetch('http://localhost:5000/api/donations/top'),
        fetch('http://localhost:5000/api/donations'),
        fetch('http://localhost:5000/api/expenses'),
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
      const res = await fetch(`http://localhost:5000/api/donations/search/${phone}`)
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

      const res = await fetch('http://localhost:5000/api/donations/add', {
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

      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 lg:px-8">
        <section className="rounded-[28px] bg-gradient-to-r from-[#2153c9] via-[#1a3d97] to-[#5a4ff0] px-4 py-5 text-white shadow-[0_20px_60px_rgba(37,99,235,0.22)] md:rounded-[32px] md:px-8 md:py-10">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-white/90 md:text-2xl md:tracking-[0.18em]">
            Open Care Foundation
          </p>

          <div className="mt-4 flex flex-row items-end justify-between gap-3 md:mt-3 md:gap-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black leading-none tracking-tight md:max-w-4xl md:text-6xl">
                Total Donation
              </h2>
              <p className="mt-2 max-w-xl text-[11px] leading-4 text-blue-100/80 md:mt-3 md:max-w-2xl md:text-base md:leading-6">
                Publicly visible total collection with live animated count.
              </p>
            </div>

            <div className="w-[45%] shrink-0 rounded-[20px] border border-white/15 bg-white/10 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl md:w-auto md:rounded-[28px] md:px-6 md:py-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-100/70 md:text-xs md:tracking-[0.28em]">
                Live Collected
              </p>
              <div className="mt-2 flex items-end gap-1.5 md:mt-3 md:gap-2">
                <span className="text-xl font-black md:text-4xl">৳</span>
                <span className="text-3xl font-black leading-none md:text-7xl">
                  {animatedDonation}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 md:mt-6">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90 backdrop-blur-xl md:px-4 md:py-2 md:text-xs">
              Public Fund View
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90 backdrop-blur-xl md:px-4 md:py-2 md:text-xs">
              Real-time Summary
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90 backdrop-blur-xl md:px-4 md:py-2 md:text-xs">
              Glass UI
            </span>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-[28px] border border-slate-200 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:-translate-y-1 md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
              Total Expense
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-2xl font-black text-slate-500 md:text-3xl">৳</span>
              <span className="text-3xl font-black text-slate-900 md:text-5xl">
                {animatedExpense}
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:-translate-y-1 md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
              Available Fund
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-2xl font-black text-slate-500 md:text-3xl">৳</span>
              <span className="text-3xl font-black text-slate-900 md:text-5xl">
                {animatedFund}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">

          <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-[#eef4ff] via-white to-[#f7fbff] p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">Donate</h3>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-sky-700">
                Support Now
              </span>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <p className="text-sm leading-6 text-slate-600">
                Your small contribution can make a visible difference. Every donation is counted,
                shown publicly, and reflected in the live fund summary.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white">
                  Give
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-[11px] font-semibold text-indigo-700">
                  impact
                </span>
                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-[11px] font-semibold text-sky-700">
                  Change
                </span>
              </div>

              <button
                onClick={() => setShowDonateModal(true)}
                className="mt-5 h-14 w-full rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-500 to-indigo-500 px-8 font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.18)] transition hover:-translate-y-0.5"
              >
                Donate Now
              </button>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white/75 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">Donor Search</h3>
              <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 backdrop-blur-xl">
                Search History
              </span>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                placeholder="Enter donor phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 py-4 flex-1 rounded-2xl border border-slate-200 bg-white/80 px-5 text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300"
              />

              <button
                type="submit"
                className="h-14 rounded-2xl border border-white/70 bg-white/70 px-8 font-semibold text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchResult && (
              <div className="mt-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                      Phone
                    </p>
                    <p className="mt-3 text-2xl font-black">{searchResult.phone}</p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                      Total Donated
                    </p>
                    <p className="mt-3 text-2xl font-black">৳ {searchResult.totalDonated}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {searchResult.history?.length > 0 ? (
                    searchResult.history.map((item) => (
                      <div
                        key={item._id}
                        className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-[#f8fafc] p-4 transition hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <h4 className="text-lg font-bold">{item.name}</h4>
                          <p className="text-sm text-slate-500">TRX: {item.trxId}</p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-2xl font-black">৳ {item.amount}</p>
                          <p className="text-sm capitalize text-slate-500">{item.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="mt-4 text-slate-500">No history found</p>
                  )}
                </div>
              </div>
            )}
          </div>
                    
        </section>

        <section className="mt-5 rounded-[30px] border border-slate-200 bg-white/75 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-black">Top Donors</h3>
            <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 backdrop-blur-xl">
              Top 10 Live
            </span>
          </div>

          {topDonorSlides.length === 0 ? (
            <p className="text-slate-500">No donor data found</p>
          ) : (
            <div className="overflow-hidden">
              <div
                className="flex w-max gap-2.5"
                style={{ animation: 'marqueeLeft 22s linear infinite' }}
              >
                {topDonorSlides.map((donor, index) => (
                  <div
                    key={`${donor.phone}-${index}`}
                    className="w-[180px] shrink-0 rounded-[20px] border border-slate-200 bg-gradient-to-br from-[#ffffff] to-[#eef4ff] p-3.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-xl bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">
                        #{(index % topDonorList.length) + 1}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Top
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-black">{donor.name}</h4>
                    <p className="mt-1 text-xs text-slate-500">{maskPhone(donor.phone)}</p>
                    <p className="mt-3 text-xl font-black text-indigo-600">৳ {donor.totalDonated}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[30px] border border-slate-200 bg-white/75 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-black">Recent Donations</h3>
            <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 backdrop-blur-xl">
              Sliding Feed
            </span>
          </div>

          {recentDonationSlides.length === 0 ? (
            <p className="text-slate-500">No donations found</p>
          ) : (
            <div className="overflow-hidden">
              <div
                className="flex w-max gap-2.5"
                style={{ animation: 'marqueeLeft 26s linear infinite' }}
              >
                {recentDonationSlides.map((donation, index) => (
                  <div
                    key={`${donation._id}-${index}`}
                    className="w-[190px] shrink-0 rounded-[20px] border border-slate-200 bg-gradient-to-br from-[#ffffff] to-[#f3f6ff] p-3.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        Recent
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold capitalize text-emerald-600">
                        {donation.status}
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-black">{donation.name}</h4>
                    <p className="mt-1 text-xs text-slate-500">{maskPhone(donation.phone)}</p>
                    <p className="mt-3 text-xl font-black text-sky-600">৳ {donation.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[30px] border border-slate-200 bg-white/75 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-black">Recent Expenses</h3>
            <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 backdrop-blur-xl">
              Expense Log
            </span>
          </div>

          <div className="space-y-3">
            {recentExpenses.length === 0 ? (
              <p className="text-slate-500">No expenses found</p>
            ) : (
              recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-[#f8fafc] p-4 transition hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h4 className="text-lg font-bold">{expense.title}</h4>
                    <p className="text-sm text-slate-500">{expense.category}</p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-2xl font-black text-rose-600">৳ {expense.amount}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[30px] border border-white/40 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Manual Donate</h3>
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

            <form onSubmit={handleDonateSubmit} className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                name="name"
                placeholder="Donor name"
                value={donateForm.name}
                onChange={handleDonateInput}
                className="h-14 rounded-2xl border border-slate-200 bg-white/80 px-5 text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300"
              />

              <input
                type="text"
                name="phone"
                placeholder="Phone number"
                value={donateForm.phone}
                onChange={handleDonateInput}
                className="h-14 rounded-2xl border border-slate-200 bg-white/80 px-5 text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300"
              />

              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={donateForm.amount}
                onChange={handleDonateInput}
                className="h-14 rounded-2xl border border-slate-200 bg-white/80 px-5 text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300"
              />

              <input
                type="text"
                name="trxId"
                placeholder="Transaction ID"
                value={donateForm.trxId}
                onChange={handleDonateInput}
                className="h-14 rounded-2xl border border-slate-200 bg-white/80 px-5 text-slate-900 outline-none shadow-inner placeholder:text-slate-400 focus:border-indigo-300"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={donateLoading}
                  className="h-14 w-full rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-500 to-indigo-500 px-8 font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.18)] transition hover:-translate-y-0.5 disabled:opacity-70"
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