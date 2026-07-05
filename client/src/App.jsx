import { useEffect, useMemo, useState } from 'react'
import donationBg from './assets/hunger-bg.jpg'
import BottomNav from './components/BottomNav'
import TopNav from './components/TopNav'
import ProfilePage from './pages/ProfilePage'
import BloodPage from './pages/BloodPage'
import ProjectsPage from './pages/ProjectsPage'
import DonatePage from './pages/DonatePage'
import TransparencyPage from './pages/TransparencyPage'

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

function useVisibleCards() {
  const [visibleCards, setVisibleCards] = useState(2)

  useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth >= 1280) {
        setVisibleCards(4)
      } else if (window.innerWidth >= 768) {
        setVisibleCards(3)
      } else {
        setVisibleCards(2)
      }
    }

    updateVisibleCards()
    window.addEventListener('resize', updateVisibleCards)

    return () => {
      window.removeEventListener('resize', updateVisibleCards)
    }
  }, [])

  return visibleCards
}

function useAutoSlider(totalSteps, delay = 2000) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!totalSteps || totalSteps <= 1) {
      setIndex(0)
      return undefined
    }

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % totalSteps)
    }, delay)

    return () => clearInterval(timer)
  }, [totalSteps, delay])

  return index
}

function maskPhone(phone) {
  const value = String(phone || '')
  if (value.length <= 6) return value
  return `${value.slice(0, 3)}*****${value.slice(-3)}`
}

function money(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-US')}`
}

function getArrayPayload(data, key) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  return []
}

function makeImageUrl(apiBase, url) {
  if (!url) return ''

  if (
    String(url).startsWith('http://') ||
    String(url).startsWith('https://') ||
    String(url).startsWith('blob:') ||
    String(url).startsWith('data:')
  ) {
    return url
  }

  if (String(url).startsWith('/')) {
    return `${apiBase}${url}`
  }

  return `${apiBase}/${url}`
}

function getDonationName(item) {
  return item?.donorName || item?.name || 'Anonymous Donor'
}

function getDonationImage(item) {
  return item?.profilePhoto || item?.donorPhoto || item?.photo || item?.image || item?.avatar || ''
}

function makeTopDonorsFromDonations(donations) {
  const map = new Map()

  donations.forEach((item) => {
    const phone = item.phone || item.donorPhone || ''
    const name = getDonationName(item)
    const amount = Number(item.amount || 0)
    const image = getDonationImage(item)

    if (!phone) return

    if (!map.has(phone)) {
      map.set(phone, {
        name,
        phone,
        totalDonated: 0,
        profilePhoto: image,
      })
    }

    const current = map.get(phone)
    current.totalDonated += amount

    if (!current.profilePhoto && image) {
      current.profilePhoto = image
    }
  })

  return Array.from(map.values()).sort((a, b) => b.totalDonated - a.totalDonated)
}

function getProgress(project) {
  if (!project) return 0

  if (typeof project.progressPercent === 'number') {
    return Math.min(Math.max(project.progressPercent, 0), 100)
  }

  const target = Number(project.targetAmount || 0)
  const collected = Number(project.collectedAmount || 0)

  if (target <= 0) return 0

  return Math.min(Math.round((collected / target) * 100), 100)
}

function getRemaining(project) {
  if (!project) return 0

  if (typeof project.remainingAmount === 'number') {
    return Math.max(project.remainingAmount, 0)
  }

  return Math.max(Number(project.targetAmount || 0) - Number(project.collectedAmount || 0), 0)
}

function formatDate(date) {
  if (!date) return 'Not added'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not added'
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Avatar({ src, name, apiBase, className = 'h-12 w-12' }) {
  const imageUrl = makeImageUrl(apiBase, src)
  const initial = String(name || 'O').charAt(0).toUpperCase()

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-black text-white shadow-lg ${className}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name || 'Profile'} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  )
}

function SmartSlider({ items, activeIndex, visibleCards, emptyText, children }) {
  if (!items.length) {
    return (
      <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500 sm:p-5 sm:text-sm">
        {emptyText}
      </div>
    )
  }

  const itemWidth = 100 / visibleCards

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[24px]">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${activeIndex * itemWidth}%)` }}
      >
        {items.map((item, index) => (
          <div
            key={item._id || item.id || item.phone || index}
            className="min-w-0 shrink-0 px-1"
            style={{ width: `${itemWidth}%` }}
          >
            {children(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  const getPageFromPath = () => {
    const path = window.location.pathname.toLowerCase()

    if (path === '/profile') return 'profile'
    if (path === '/blood') return 'blood'
    if (path === '/donate') return 'donate'
    if (path === '/projects') return 'projects'
    if (path === '/transparency') return 'transparency'

    return 'home'
  }

  const getPathFromPage = (page) => {
    if (page === 'profile') return '/profile'
    if (page === 'blood') return '/blood'
    if (page === 'donate') return '/donate'
    if (page === 'projects') return '/projects'
    if (page === 'transparency') return '/transparency'

    return '/'
  }

  const [activePage, setActivePage] = useState(() => getPageFromPath())

  const [stats, setStats] = useState({
    totalDonation: 0,
    totalExpense: 0,
    availableFund: 0,
  })

  const [topDonors, setTopDonors] = useState([])
  const [donations, setDonations] = useState([])
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])

  const [bloodDonors, setBloodDonors] = useState([])
  const [bloodLoading, setBloodLoading] = useState(false)
  const [bloodFilter, setBloodFilter] = useState({
    district: '',
    bloodGroup: '',
  })

  const [token, setToken] = useState(() => localStorage.getItem('ocf_token') || '')
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ocf_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const visibleCards = useVisibleCards()

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

  const navigateToPage = (page) => {
    setActivePage(page)

    const nextPath = getPathFromPage(page)

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const goToDonateProject = (project) => {
    const projectId = project?._id || project?.id || project?.slug || ''
    const nextPath = projectId ? `/donate?project=${encodeURIComponent(projectId)}` : '/donate'

    setActivePage('donate')
    window.history.pushState({}, '', nextPath)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const safeFetchJson = async (url, fallback = {}) => {
    try {
      const res = await fetch(url)
      const data = await res.json().catch(() => fallback)

      if (!res.ok) return fallback

      return data
    } catch {
      return fallback
    }
  }

  const loadDashboardData = async () => {
    try {
      const [statsData, topData, donationsData, expensesData, projectsData, categoriesData] =
        await Promise.all([
          safeFetchJson(`${API}/api/stats`, {}),
          safeFetchJson(`${API}/api/donations/top`, []),
          safeFetchJson(`${API}/api/donations`, []),
          safeFetchJson(`${API}/api/expenses`, []),
          safeFetchJson(`${API}/api/projects`, []),
          safeFetchJson(`${API}/api/categories`, []),
        ])

      const donationList = getArrayPayload(donationsData, 'donations')
      const expenseList = getArrayPayload(expensesData, 'expenses')
      const projectList = getArrayPayload(projectsData, 'projects')
      const categoryList = getArrayPayload(categoriesData, 'categories')

      const topList = Array.isArray(topData)
        ? topData
        : Array.isArray(topData?.donors)
          ? topData.donors
          : []

      setStats({
        totalDonation: Number(statsData?.totalDonation || 0),
        totalExpense: Number(statsData?.totalExpense || 0),
        availableFund: Number(statsData?.availableFund || 0),
      })

      setDonations(donationList)
      setExpenses(expenseList)
      setProjects(projectList)
      setCategories(categoryList)
      setTopDonors(topList.length > 0 ? topList : makeTopDonorsFromDonations(donationList))
    } catch (error) {
      console.log(error.message)
    }
  }

  const loadBloodDonors = async () => {
    try {
      setBloodLoading(true)

      const params = new URLSearchParams()

      if (bloodFilter.district.trim()) {
        params.append('district', bloodFilter.district.trim())
      }

      if (bloodFilter.bloodGroup) {
        params.append('bloodGroup', bloodFilter.bloodGroup)
      }

      const query = params.toString()
      const res = await fetch(`${API}/api/users/blood-donors${query ? `?${query}` : ''}`)
      const data = await res.json()

      setBloodDonors(data?.donors || [])
    } catch (error) {
      console.log(error.message)
    } finally {
      setBloodLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    const handleBrowserBackForward = () => {
      setActivePage(getPageFromPath())
    }

    window.addEventListener('popstate', handleBrowserBackForward)

    return () => {
      window.removeEventListener('popstate', handleBrowserBackForward)
    }
  }, [])

  useEffect(() => {
    if (!token) return

    const loadMyProfile = async () => {
      try {
        const res = await fetch(`${API}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || 'Profile loading failed')
        }

        const updatedUser = {
          ...(data.user || {}),
          id: data.user?.id || data.user?._id,
        }

        localStorage.setItem('ocf_user', JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)
      } catch (error) {
        console.log(error.message)

        localStorage.removeItem('ocf_token')
        localStorage.removeItem('ocf_user')
        setToken('')
        setCurrentUser(null)
      }
    }

    loadMyProfile()
  }, [API, token])

  useEffect(() => {
    loadBloodDonors()
  }, [bloodFilter.district, bloodFilter.bloodGroup])

  const animatedDonation = useCountUp(stats.totalDonation, 1700)
  const animatedExpense = useCountUp(stats.totalExpense, 1300)
  const animatedFund = useCountUp(stats.availableFund, 1500)

  const topDonorList = useMemo(() => topDonors.slice(0, 10), [topDonors])
  const recentDonations = useMemo(() => donations.slice(0, 10), [donations])
  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses])

  const runningProjects = useMemo(() => {
    return projects.filter((project) => project.status === 'active' || !project.status).slice(0, 8)
  }, [projects])

  const topDonorSteps = Math.max(topDonorList.length - visibleCards + 1, 1)
  const recentDonationSteps = Math.max(recentDonations.length - visibleCards + 1, 1)

  const topDonorIndex = useAutoSlider(topDonorSteps, 2000)
  const recentDonationIndex = useAutoSlider(recentDonationSteps, 2000)

  const categoryExpenseSummary = useMemo(() => {
    const map = new Map()

    categories.forEach((category) => {
      const name = category.name || category.title || category.category || ''
      if (!name) return

      map.set(name, {
        name,
        amount: 0,
        count: 0,
      })
    })

    expenses.forEach((expense) => {
      const name = expense.category || 'General Expense'

      if (!map.has(name)) {
        map.set(name, {
          name,
          amount: 0,
          count: 0,
        })
      }

      const current = map.get(name)
      current.amount += Number(expense.amount || 0)
      current.count += 1
    })

    if (map.size === 0) {
      map.set('General Expense', {
        name: 'General Expense',
        amount: 0,
        count: 0,
      })
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount
      return a.name.localeCompare(b.name)
    })
  }, [categories, expenses])

  const maxCategoryExpense = useMemo(() => {
    return Math.max(...categoryExpenseSummary.map((item) => item.amount), 1)
  }, [categoryExpenseSummary])

  const homePage = (
    <div className="grid w-full min-w-0 gap-4 overflow-hidden">
      <section className="relative w-full min-w-0 overflow-hidden rounded-[22px] bg-gradient-to-r from-[#2153c9] via-[#1a3d97] to-[#5a4ff0] px-4 py-5 text-white shadow-[0_20px_60px_rgba(37,99,235,0.22)] sm:rounded-[30px] sm:px-6 sm:py-7 md:rounded-[34px] md:px-8 md:py-10">
        <img
          src={donationBg}
          alt="Hungry children"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17357f]/88 via-[#1a3d97]/76 to-[#5a4ff0]/58" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />

        <div className="relative z-10 grid min-w-0 gap-4 md:grid-cols-[1fr_auto] md:items-end md:gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/90 sm:text-xs md:text-sm">
              Open Care Foundation
            </p>

            <h2 className="mt-4 break-words text-[30px] font-black leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
              Total Donation
            </h2>

            <p className="mt-2 max-w-xs text-[11px] leading-5 text-blue-100/85 sm:max-w-sm sm:text-xs md:mt-3 md:max-w-2xl md:text-base md:leading-6">
              Real-time fund insights
            </p>
          </div>

          <div className="w-full min-w-0 rounded-[20px] border border-white/20 bg-white/12 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl sm:max-w-[320px] md:w-[330px] md:rounded-[28px] md:px-6 md:py-5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-blue-100/80 sm:text-[9px] md:text-xs md:tracking-[0.28em]">
              Live Collected
            </p>

            <div className="mt-2 flex min-w-0 items-end gap-1.5 md:mt-3 md:gap-2">
              <span className="shrink-0 text-[9px] font-bold tracking-wide text-white/90 sm:text-[10px] md:text-sm">
                BDT
              </span>
              <span className="min-w-0 break-all text-[32px] font-black leading-none sm:text-4xl md:text-6xl">
                {animatedDonation}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid w-full min-w-0 grid-cols-2 gap-3 sm:gap-4">
        <div className="relative min-w-0 overflow-hidden rounded-[22px] border border-rose-100 bg-white p-3 shadow-[0_15px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 sm:p-4 md:rounded-[30px] md:p-5">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-100 blur-2xl" />

          <p className="relative text-[8px] font-black uppercase tracking-[0.14em] text-rose-500 sm:text-[10px]">
            Total Expense
          </p>

          <div className="relative mt-3 flex min-w-0 items-end gap-1">
            <span className="shrink-0 text-[8px] font-black tracking-wide text-slate-500 sm:text-[10px]">
              BDT
            </span>
            <span className="min-w-0 break-all text-[20px] font-black leading-none text-slate-950 sm:text-3xl md:text-4xl">
              {animatedExpense}
            </span>
          </div>
        </div>

        <div className="relative min-w-0 overflow-hidden rounded-[22px] border border-emerald-100 bg-white p-3 shadow-[0_15px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 sm:p-4 md:rounded-[30px] md:p-5">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100 blur-2xl" />

          <p className="relative text-[8px] font-black uppercase tracking-[0.14em] text-emerald-500 sm:text-[10px]">
            Available Fund
          </p>

          <div className="relative mt-3 flex min-w-0 items-end gap-1">
            <span className="shrink-0 text-[8px] font-black tracking-wide text-slate-500 sm:text-[10px]">
              BDT
            </span>
            <span className="min-w-0 break-all text-[20px] font-black leading-none text-slate-950 sm:text-3xl md:text-4xl">
              {animatedFund}
            </span>
          </div>
        </div>
      </section>

      <section className="relative min-w-0 overflow-hidden rounded-[28px] border border-sky-100 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] md:rounded-[34px] md:p-6">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-indigo-100 blur-3xl" />

        <div className="relative grid min-w-0 gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-sky-700">
              Support Now
            </div>

            <h3 className="mt-3 break-words text-2xl font-black tracking-[-0.04em] text-slate-950 md:text-3xl">
              Give Hope Today
            </h3>

            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
              Small help. Big impact.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateToPage('donate')}
            className="group relative h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-7 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1 md:h-13 md:w-auto"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-full" />
            <span className="relative">Donate Now</span>
          </button>
        </div>
      </section>

      <section className="grid min-w-0 gap-4">
        <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] md:rounded-[34px] md:p-5">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-600">
                Donor Wall
              </p>
              <h3 className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
                Top Donors
              </h3>
            </div>

            <span className="shrink-0 rounded-full bg-sky-50 px-3 py-2 text-[10px] font-black text-sky-700">
              Max 10
            </span>
          </div>

          <SmartSlider
            items={topDonorList}
            activeIndex={topDonorIndex}
            visibleCards={visibleCards}
            emptyText="No donor data found"
          >
            {(donor, index) => {
              const name = donor.donorName || donor.name || 'Donor'
              const image = donor.profilePhoto || getDonationImage(donor)

              return (
                <div className="h-full min-w-0 rounded-[22px] border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-3 shadow-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      src={image}
                      name={name}
                      apiBase={API}
                      className="h-11 w-11 sm:h-14 sm:w-14"
                    />

                    <div className="min-w-0 flex-1">
                      <span className="rounded-lg bg-slate-950 px-2 py-0.5 text-[8px] font-black text-white">
                        #{index + 1}
                      </span>

                      <h4 className="mt-1 truncate text-xs font-black text-slate-950 sm:text-sm">
                        {name}
                      </h4>

                      <p className="truncate text-[10px] font-bold text-slate-500">
                        {maskPhone(donor.phone)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-[8px] font-black uppercase text-slate-400">Donated</p>
                    <p className="mt-1 break-words text-sm font-black text-sky-600 sm:text-lg">
                      {money(donor.totalDonated || donor.amount || 0)}
                    </p>
                  </div>
                </div>
              )
            }}
          </SmartSlider>
        </div>

        <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] md:rounded-[34px] md:p-5">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-600">
                Live Feed
              </p>
              <h3 className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
                Recent Donations
              </h3>
            </div>

            <span className="shrink-0 rounded-full bg-violet-50 px-3 py-2 text-[10px] font-black text-violet-700">
              Max 10
            </span>
          </div>

          <SmartSlider
            items={recentDonations}
            activeIndex={recentDonationIndex}
            visibleCards={visibleCards}
            emptyText="No donations found"
          >
            {(donation) => {
              const name = getDonationName(donation)
              const image = getDonationImage(donation)

              return (
                <div className="h-full min-w-0 rounded-[22px] border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-3 shadow-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      src={image}
                      name={name}
                      apiBase={API}
                      className="h-11 w-11 sm:h-14 sm:w-14"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-black uppercase text-violet-500">
                        Recent
                      </p>

                      <h4 className="mt-1 truncate text-xs font-black text-slate-950 sm:text-sm">
                        {name}
                      </h4>

                      <p className="truncate text-[10px] font-bold text-slate-500">
                        {maskPhone(donation.phone)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-[8px] font-black uppercase text-slate-400">Amount</p>
                    <p className="mt-1 break-words text-sm font-black text-violet-600 sm:text-lg">
                      {money(donation.amount)}
                    </p>
                  </div>
                </div>
              )
            }}
          </SmartSlider>
        </div>
      </section>

      <section className="min-w-0 rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] md:rounded-[34px] md:p-5">
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
              Running Projects
            </p>
            <h3 className="mt-1 line-clamp-2 text-xl font-black text-slate-950 sm:text-2xl">
              Active Foundation Projects
            </h3>
          </div>

          <button
            type="button"
            onClick={() => navigateToPage('projects')}
            className="shrink-0 rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black text-blue-700 transition hover:bg-blue-100"
          >
            View All
          </button>
        </div>

        {runningProjects.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
            No running project found
          </div>
        ) : (
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {runningProjects.map((project) => {
              const progress = getProgress(project)
              const coverImage = makeImageUrl(API, project.coverImage)

              return (
                <article
                  key={project._id || project.id || project.slug}
                  className="group w-[82vw] min-w-[82vw] snap-start overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(37,99,235,0.14)] sm:w-[310px] sm:min-w-[310px] lg:w-[340px] lg:min-w-[340px]"
                >
                  <div className="relative h-36 overflow-hidden bg-slate-100 sm:h-40">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={project.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 text-3xl font-black text-white">
                        OCF
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

                    <div className="absolute bottom-3 left-3 right-3 min-w-0">
                      <span className="inline-flex max-w-full rounded-full bg-white/90 px-3 py-1 text-[9px] font-black text-blue-700 backdrop-blur">
                        <span className="truncate">{project.category || 'General'}</span>
                      </span>

                      <h4 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-white">
                        {project.title}
                      </h4>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="min-w-0 rounded-xl bg-white p-2">
                        <p className="text-[8px] font-black uppercase text-slate-400">Target</p>
                        <p className="mt-1 truncate text-[10px] font-black text-slate-950">
                          {money(project.targetAmount)}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-white p-2">
                        <p className="text-[8px] font-black uppercase text-emerald-500">
                          Collected
                        </p>
                        <p className="mt-1 truncate text-[10px] font-black text-emerald-700">
                          {money(project.collectedAmount)}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-white p-2">
                        <p className="text-[8px] font-black uppercase text-rose-500">
                          Left
                        </p>
                        <p className="mt-1 truncate text-[10px] font-black text-rose-700">
                          {money(getRemaining(project))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-500">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>

                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => goToDonateProject(project)}
                      className="mt-3 h-10 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black text-white shadow-lg transition hover:-translate-y-1"
                    >
                      Donate This Project
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] md:rounded-[34px] md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">
              Expense Category
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
              Where Funds Are Used
            </h3>
          </div>

          <span className="rounded-full bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-700">
            Real
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categoryExpenseSummary.map((item) => {
            const width = Math.max((item.amount / maxCategoryExpense) * 100, 5)

            return (
              <div key={item.name} className="min-w-0 rounded-[20px] bg-slate-50 p-3">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs font-black text-slate-950">
                    {item.name}
                  </p>

                  <p className="shrink-0 text-[11px] font-black text-rose-600">
                    {money(item.amount)}
                  </p>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-700"
                    style={{ width: `${width}%` }}
                  />
                </div>

                <p className="mt-1.5 text-[10px] font-bold text-slate-400">
                  {item.count} records
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="min-w-0 rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] md:rounded-[34px] md:p-5">
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">
              Transparency
            </p>
            <h3 className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
              Recent Expenses
            </h3>
          </div>

          <button
            type="button"
            onClick={() => navigateToPage('transparency')}
            className="shrink-0 rounded-full bg-rose-50 px-4 py-2 text-[10px] font-black text-rose-700 transition hover:bg-rose-100"
          >
            View All
          </button>
        </div>

        <div className="grid gap-3">
          {recentExpenses.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
              No expenses found
            </p>
          ) : (
            recentExpenses.map((expense) => (
              <button
                key={expense._id}
                type="button"
                onClick={() => navigateToPage('transparency')}
                className="grid min-w-0 gap-3 rounded-[22px] border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-1 hover:bg-rose-50 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-black text-slate-950">{expense.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">
                    {expense.category || 'General Expense'} · {formatDate(expense.expenseDate)}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <p className="break-words text-sm font-black text-rose-600">
                    {money(expense.amount)}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Details
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  )

  const bloodPage = (
    <BloodPage
      bloodGroups={bloodGroups}
      bloodDonors={bloodDonors}
      bloodLoading={bloodLoading}
      bloodFilter={bloodFilter}
      setBloodFilter={setBloodFilter}
    />
  )

  const profilePage = (
    <ProfilePage
      API={API}
      bloodGroups={bloodGroups}
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      token={token}
      setToken={setToken}
      onDonorUpdated={loadBloodDonors}
    />
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f7fd] pb-36 pt-[86px] text-slate-900 sm:pb-44 lg:pb-48">
      <TopNav
        activePage={activePage}
        navigateToPage={navigateToPage}
        currentUser={currentUser}
      />

      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        {activePage === 'home' && homePage}
        {activePage === 'projects' && <ProjectsPage API={API} />}
        {activePage === 'donate' && <DonatePage API={API} />}
        {activePage === 'transparency' && <TransparencyPage API={API} />}
        {activePage === 'blood' && bloodPage}
        {activePage === 'profile' && profilePage}
      </div>

      <BottomNav activePage={activePage} onChange={navigateToPage} />
    </div>
  )
}

export default App