import { useEffect, useMemo, useState } from 'react'
import donationBg from './assets/hunger-bg.jpg'
import BottomNav from './components/BottomNav'
import TopNav from './components/TopNav'
import ProfilePage from './pages/ProfilePage'
import BloodPage from './pages/BloodPage'
import ProjectsPage from './pages/ProjectsPage'
import DonatePage from './pages/DonatePage'
import TransparencyPage from './pages/TransparencyPage'
import ReportPage from './pages/ReportPage'
import AboutPage from './pages/AboutPage'

const quickAmounts = [100, 500, 1000, 2000, 5000, 10000]

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

function useAutoSlider(totalSteps, delay = 2200) {
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

function normalize(value) {
  return String(value || '').trim().toLowerCase()
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


function makeTopDonorsFromDonations(donations) {
  const map = new Map()

  donations.forEach((item) => {
    const phone = item.phone || item.donorPhone || ''
    const name = getDonationName(item)
    const amount = Number(item.amount || 0)
    if (!phone) return

    if (!map.has(phone)) {
      map.set(phone, {
        name,
        phone,
        totalDonated: 0,
      })
    }

    const current = map.get(phone)
    current.totalDonated += amount
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

function SmartSlider({ items, activeIndex, visibleCards, emptyText, children }) {
  if (!items.length) {
    return (
      <div className="rounded-[18px] border border-slate-100 bg-slate-50 p-4 text-center text-[11px] font-bold text-slate-500">
        {emptyText}
      </div>
    )
  }

  const itemWidth = 100 / visibleCards

  return (
    <div className="w-full min-w-0 overflow-hidden">
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

function MiniDonationCard({ item, type = 'top', index = 0 }) {
  const name = item.donorName || item.name || getDonationName(item)
  const amount = type === 'top' ? item.totalDonated || item.amount || 0 : item.amount || 0

  return (
    <div
      className={`group relative min-h-[76px] min-w-0 overflow-hidden rounded-[17px] border py-2.5 pl-5 pr-2.5 shadow-[0_9px_22px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(37,99,235,0.12)] sm:min-h-[84px] sm:py-3 sm:pl-6 sm:pr-3 ${
        type === 'top'
          ? 'border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-blue-50'
          : 'border-violet-100 bg-gradient-to-br from-white via-violet-50/60 to-fuchsia-50'
      }`}
    >
      <div
        className={`pointer-events-none absolute left-2 top-1/2 h-9 w-1 -translate-y-1/2 rounded-full shadow-sm sm:left-2.5 sm:h-10 ${
          type === 'top'
            ? 'bg-gradient-to-b from-sky-400 to-blue-700'
            : 'bg-gradient-to-b from-violet-400 to-fuchsia-600'
        }`}
      />

      <div className="relative flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[6px] font-black uppercase tracking-[0.12em] sm:text-[7px] ${
                type === 'top'
                  ? 'bg-slate-950 text-white'
                  : 'bg-violet-600 text-white'
              }`}
            >
              {type === 'top' ? `Top ${index + 1}` : 'Recent'}
            </span>

            <h4 className="min-w-0 truncate text-[10px] font-black leading-tight text-slate-950 sm:text-xs">
              {name}
            </h4>
          </div>

          <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[7px] font-bold tracking-wide text-slate-500 sm:text-[8px]">
              {maskPhone(item.phone)}
            </p>

            <p
              className={`shrink-0 whitespace-nowrap text-[10px] font-black leading-none sm:text-xs ${
                type === 'top' ? 'text-sky-700' : 'text-violet-700'
              }`}
            >
              {money(amount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


const RECENT_DONATION_KEY = 'ocf_recent_donation'
const DONATION_NOTICE_DURATION = 24 * 60 * 60 * 1000

function RecentDonationNotice({ donation, onClose }) {
  const normalizedStatus = String(
    donation?.status || 'pending'
  ).toLowerCase()

  const isSuccessful = [
    'success',
    'successful',
    'completed',
    'approved',
    'verified',
    'paid',
  ].includes(normalizedStatus)

  const isFailed = [
    'failed',
    'rejected',
    'cancelled',
    'canceled',
  ].includes(normalizedStatus)

  const statusLabel = isSuccessful
    ? 'Success'
    : isFailed
      ? 'Failed'
      : 'Pending'

  const statusClass = isSuccessful
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : isFailed
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-emerald-100 bg-white p-3 shadow-[0_14px_38px_rgba(15,23,42,0.07)] sm:p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100 blur-3xl" />

      <div className="relative flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg font-black text-white shadow-lg">
          ✓
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-emerald-600">
                Recent Donation
              </p>

              <h3 className="mt-1 truncate text-sm font-black text-slate-950 sm:text-base">
                Your donation was submitted
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close donation notice"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500 transition hover:bg-slate-200"
            >
              ×
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="min-w-0 rounded-xl bg-slate-50 px-2.5 py-2">
              <p className="text-[7px] font-black uppercase text-slate-400">
                Name
              </p>
              <p className="mt-1 truncate text-[10px] font-black text-slate-800">
                {donation?.donorName || 'Anonymous Donor'}
              </p>
            </div>

            <div className="min-w-0 rounded-xl bg-slate-50 px-2.5 py-2">
              <p className="text-[7px] font-black uppercase text-slate-400">
                Phone
              </p>
              <p className="mt-1 truncate text-[10px] font-black text-slate-800">
                {maskPhone(donation?.phone)}
              </p>
            </div>

            <div className="min-w-0 rounded-xl bg-slate-50 px-2.5 py-2">
              <p className="text-[7px] font-black uppercase text-slate-400">
                Amount
              </p>
              <p className="mt-1 truncate text-[10px] font-black text-slate-800">
                {money(donation?.amount)}
              </p>
            </div>

            <div className={`min-w-0 rounded-xl border px-2.5 py-2 ${statusClass}`}>
              <p className="text-[7px] font-black uppercase opacity-70">
                Status
              </p>
              <p className="mt-1 truncate text-[10px] font-black">
                {statusLabel}
              </p>
            </div>
          </div>

          <p className="mt-2 text-[8px] font-bold text-slate-400">
            This notice will automatically disappear after 24 hours.
          </p>
        </div>
      </div>
    </section>
  )
}


const SHARE_URL = 'https://opencarefoundation.org/'

function FacebookShareCard() {
  const handleFacebookShare = () => {
    const facebookShareUrl =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        SHARE_URL
      )}`

    const popup = window.open(
      facebookShareUrl,
      'facebook-share',
      'width=720,height=650,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    )

    if (!popup) {
      window.location.href = facebookShareUrl
    }
  }

  return (
    <section className="group relative isolate overflow-hidden rounded-[22px] border border-blue-100 bg-[linear-gradient(120deg,#ffffff_0%,#f4f7ff_52%,#eef4ff_100%)] px-4 py-4 shadow-[0_16px_42px_rgba(37,99,235,0.10)] sm:px-5">
      <div className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full bg-violet-300/25 blur-3xl motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute -bottom-14 right-8 h-32 w-32 rounded-full bg-blue-300/25 blur-3xl motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_15%,rgba(255,255,255,0.85)_45%,transparent_75%)] bg-[length:220%_100%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-safe:group-hover:animate-[shareSweep_1.8s_ease-in-out_infinite]" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-blue-700 sm:text-[9px]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 motion-safe:animate-ping" />
            One Click. More Impact.
          </div>

          <h3 className="mt-2 text-base font-black tracking-[-0.035em] text-slate-950 sm:text-lg">
            Share Open Care Foundation on Facebook
          </h3>

          <p className="mt-1 max-w-2xl text-[10px] font-semibold leading-5 text-slate-500 sm:text-xs">
            Help more people discover transparent giving, live fund updates and our nationwide blood donor network.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFacebookShare}
          className="group/button relative inline-flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#1877F2] px-4 text-xs font-black text-white shadow-[0_16px_34px_rgba(24,119,242,0.34)] transition duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#166fe5] active:scale-[0.96] motion-safe:animate-[facebookPulse_1.9s_ease-in-out_infinite] sm:px-5 sm:text-sm"
        >
          <span className="pointer-events-none absolute -left-12 top-0 h-full w-10 -skew-x-12 bg-white/30 blur-sm motion-safe:animate-[buttonShine_2.1s_ease-in-out_infinite]" />

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="relative h-5 w-5 fill-current transition duration-300 group-hover/button:scale-110"
          >
            <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8v3h2.6v8h3.1Z" />
          </svg>

          <span className="relative whitespace-nowrap">Click to Share</span>
        </button>
      </div>

      <style>{`
        @keyframes facebookPulse {
          0%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 16px 34px rgba(24, 119, 242, 0.30);
          }
          50% {
            transform: translateY(-2px) scale(1.025);
            box-shadow:
              0 20px 44px rgba(24, 119, 242, 0.48),
              0 0 0 7px rgba(24, 119, 242, 0.08);
          }
        }

        @keyframes buttonShine {
          0% { transform: translateX(-90px) skewX(-12deg); }
          55%, 100% { transform: translateX(230px) skewX(-12deg); }
        }

        @keyframes shareSweep {
          0% { background-position: 150% 0; }
          100% { background-position: -100% 0; }
        }

        @media (max-width: 520px) {
          .group > .relative.z-10 {
            align-items: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </section>
  )
}

function App() {
  const API = import.meta.env.VITE_API_BASE_URL || window.location.origin

  const getPageFromPath = () => {
    const path = window.location.pathname.toLowerCase()

    if (path === '/profile') return 'profile'
    if (path === '/blood') return 'blood'
    if (path === '/donate') return 'donate'
    if (path === '/projects') return 'projects'
    if (path === '/transparency') return 'transparency'
    if (path === '/reports') return 'reports'
    if (path === '/about') return 'about'

    return 'home'
  }

  const getPathFromPage = (page) => {
    if (page === 'profile') return '/profile'
    if (page === 'blood') return '/blood'
    if (page === 'donate') return '/donate'
    if (page === 'projects') return '/projects'
    if (page === 'transparency') return '/transparency'
    if (page === 'reports') return '/reports'
    if (page === 'about') return '/about'

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

  const [homeDonate, setHomeDonate] = useState({
    donorName: '',
    phone: '',
    amount: '500',
    fundOrProject: '',
  })

  const [homeDonateErrors, setHomeDonateErrors] = useState({
    donorName: '',
    phone: '',
    amount: '',
    fundOrProject: '',
  })

  const [recentDonationNotice, setRecentDonationNotice] = useState(null)

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
      const [statsData, donationsData, expensesData, projectsData, categoriesData] =
        await Promise.all([
          safeFetchJson(`${API}/api/stats`, {}),
          safeFetchJson(`${API}/api/donations`, []),
          safeFetchJson(`${API}/api/expenses`, []),
          safeFetchJson(`${API}/api/projects`, []),
          safeFetchJson(`${API}/api/categories`, []),
        ])

      const donationList = getArrayPayload(donationsData, 'donations')
      const expenseList = getArrayPayload(expensesData, 'expenses')
      const projectList = getArrayPayload(projectsData, 'projects')
      const categoryList = getArrayPayload(categoriesData, 'categories')

      setStats({
        totalDonation: Number(statsData?.totalDonation || 0),
        totalExpense: Number(statsData?.totalExpense || 0),
        availableFund: Number(statsData?.availableFund || 0),
      })

      setDonations(donationList)
      setExpenses(expenseList)
      setProjects(projectList)
      setCategories(categoryList)
      setTopDonors(makeTopDonorsFromDonations(donationList))
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
    let expiryTimer

    const loadRecentDonationNotice = () => {
      try {
        const saved = localStorage.getItem(
          RECENT_DONATION_KEY
        )

        if (!saved) {
          setRecentDonationNotice(null)
          return
        }

        const parsed = JSON.parse(saved)
        const expiresAt = Number(
          parsed?.expiresAt ||
          Number(parsed?.createdAt || 0) +
            DONATION_NOTICE_DURATION
        )

        if (!expiresAt || Date.now() >= expiresAt) {
          localStorage.removeItem(
            RECENT_DONATION_KEY
          )
          setRecentDonationNotice(null)
          return
        }

        const nextNotice = {
          ...parsed,
          expiresAt,
        }

        setRecentDonationNotice(nextNotice)

        window.clearTimeout(expiryTimer)

        expiryTimer = window.setTimeout(() => {
          localStorage.removeItem(
            RECENT_DONATION_KEY
          )
          setRecentDonationNotice(null)
        }, Math.max(expiresAt - Date.now(), 0))
      } catch {
        localStorage.removeItem(
          RECENT_DONATION_KEY
        )
        setRecentDonationNotice(null)
      }
    }

    const handleStorageChange = (event) => {
      if (
        !event?.key ||
        event.key === RECENT_DONATION_KEY
      ) {
        loadRecentDonationNotice()
      }
    }

    loadRecentDonationNotice()

    window.addEventListener(
      'ocf-donation-success',
      loadRecentDonationNotice
    )

    window.addEventListener(
      'storage',
      handleStorageChange
    )

    return () => {
      window.clearTimeout(expiryTimer)

      window.removeEventListener(
        'ocf-donation-success',
        loadRecentDonationNotice
      )

      window.removeEventListener(
        'storage',
        handleStorageChange
      )
    }
  }, [])

  useEffect(() => {
    const donationId =
      recentDonationNotice?.donationId

    if (!donationId || !donations.length) return

    const latestDonation = donations.find(
      (item) =>
        String(item?._id || item?.id || '') ===
        String(donationId)
    )

    if (!latestDonation?.status) return

    const latestStatus = String(
      latestDonation.status
    )

    if (
      latestStatus ===
      String(recentDonationNotice.status || '')
    ) {
      return
    }

    const updatedNotice = {
      ...recentDonationNotice,
      status: latestStatus,
    }

    localStorage.setItem(
      RECENT_DONATION_KEY,
      JSON.stringify(updatedNotice)
    )

    setRecentDonationNotice(updatedNotice)
  }, [donations, recentDonationNotice])

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

  const activeCategories = useMemo(() => {
    const seen = new Set()

    return categories.filter((category) => {
      const status = String(category.status || 'active').toLowerCase()
      const key = normalize(category.name || category.slug || category._id)

      if (!key || seen.has(key) || status !== 'active') return false

      seen.add(key)
      return true
    })
  }, [categories])

  const generalCategory = useMemo(() => {
    return (
      activeCategories.find((category) => normalize(category.name) === 'general donation') ||
      activeCategories[0] ||
      null
    )
  }, [activeCategories])

  const allProjectCategory = useMemo(() => {
    return (
      activeCategories.find((category) => normalize(category.name) === 'all project') ||
      activeCategories.find((category) => normalize(category.slug) === 'all-project') ||
      generalCategory ||
      null
    )
  }, [activeCategories, generalCategory])

  const activeProjects = useMemo(() => {
    return projects.filter((project) => project.status === 'active' || !project.status)
  }, [projects])

  useEffect(() => {
    if (!generalCategory?._id) return

    setHomeDonate((prev) => ({
      ...prev,
      fundOrProject: prev.fundOrProject || `category:${generalCategory._id}`,
    }))
  }, [generalCategory])

  const handleHomeDonateChange = (field, value) => {
    setHomeDonate((prev) => ({
      ...prev,
      [field]: value,
    }))

    setHomeDonateErrors((prev) => ({
      ...prev,
      [field]: '',
    }))
  }

  const handleHomeQuickAmount = (amount) => {
    setHomeDonate((prev) => ({
      ...prev,
      amount: String(amount),
    }))

    setHomeDonateErrors((prev) => ({
      ...prev,
      amount: '',
    }))
  }

  const handleHomeDonateSubmit = () => {
    const phone = String(homeDonate.phone || '').trim()
    const amount = Number(homeDonate.amount || 0)

    const nextErrors = {
      donorName: '',
      phone: '',
      amount: '',
      fundOrProject: '',
    }

    if (!homeDonate.donorName.trim()) {
      nextErrors.donorName = 'Please enter your name.'
    }

    if (!phone) {
      nextErrors.phone = 'Please enter your mobile number.'
    } else if (!/^01\d{9}$/.test(phone)) {
      nextErrors.phone = 'Enter a valid 11 digit mobile number.'
    }

    if (!homeDonate.amount || !amount || amount <= 0) {
      nextErrors.amount = 'Please enter a valid amount.'
    }

    if (!homeDonate.fundOrProject) {
      nextErrors.fundOrProject = 'Please select a fund or project.'
    }

    const hasError = Object.values(nextErrors).some(Boolean)

    setHomeDonateErrors(nextErrors)

    if (hasError) {
      return
    }

    let selectedCategory = generalCategory
    let selectedProject = null

    if (homeDonate.fundOrProject.startsWith('category:')) {
      const categoryId = homeDonate.fundOrProject.replace('category:', '')
      selectedCategory =
        activeCategories.find((category) => String(category._id) === String(categoryId)) ||
        generalCategory
    }

    if (homeDonate.fundOrProject.startsWith('project:')) {
      const projectId = homeDonate.fundOrProject.replace('project:', '')
      selectedProject = activeProjects.find((project) => String(project._id) === String(projectId))
      selectedCategory = allProjectCategory || generalCategory
    }

    localStorage.setItem(
      'ocf_donate_draft',
      JSON.stringify({
        donorName: homeDonate.donorName.trim(),
        phone,
        amount: String(amount),
        fundCategory: selectedCategory?._id || '',
        project: selectedProject?._id || '',
      })
    )

    const nextPath = selectedProject?._id
      ? `/donate?checkout=1&project=${encodeURIComponent(selectedProject._id)}`
      : selectedCategory?._id
        ? `/donate?checkout=1&category=${encodeURIComponent(selectedCategory._id)}`
        : '/donate?checkout=1'

    setActivePage('donate')
    window.history.pushState({}, '', nextPath)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const dismissRecentDonationNotice = () => {
    localStorage.removeItem(
      RECENT_DONATION_KEY
    )
    setRecentDonationNotice(null)
  }

  const animatedDonation = useCountUp(stats.totalDonation, 1700)
  const animatedExpense = useCountUp(stats.totalExpense, 1300)
  const animatedFund = useCountUp(stats.availableFund, 1500)

  const topDonorList = useMemo(() => topDonors.slice(0, 10), [topDonors])
  const recentDonations = useMemo(() => donations.slice(0, 10), [donations])
  const transparencyPreview = useMemo(() => expenses.slice(0, 4), [expenses])

  const runningProjects = useMemo(() => {
    return activeProjects.slice(0, 8)
  }, [activeProjects])

  const topDonorSteps = Math.max(topDonorList.length - visibleCards + 1, 1)
  const recentDonationSteps = Math.max(recentDonations.length - visibleCards + 1, 1)

  const topDonorIndex = useAutoSlider(topDonorSteps, 2200)
  const recentDonationIndex = useAutoSlider(recentDonationSteps, 2200)

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

      <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.45),transparent_28%),linear-gradient(135deg,#020617,#172554_45%,#2563eb)] px-4 py-4 text-white">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl motion-safe:animate-pulse" />
          <div className="absolute right-8 top-5 h-12 w-12 rounded-full border border-white/15" />
          <div className="absolute right-14 top-12 h-7 w-7 rounded-full border border-white/15" />

          <div className="relative z-10">
            <h3 className="mt-3 text-[26px] font-black leading-none tracking-[-0.05em] sm:text-4xl">
              Donate Now
            </h3>

            <p className="mt-2 text-[11px] font-semibold leading-5 text-blue-100/85 sm:text-sm">
              Choose amount, fund or project, then continue.
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:p-4">
          <div className="rounded-[20px] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
                Quick Amount
              </span>

              <span className="rounded-full bg-white px-2 py-1 text-[8px] font-black text-blue-700">
                Default 500
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleHomeQuickAmount(amount)}
                  className={`h-9 rounded-2xl text-[10px] font-black transition hover:-translate-y-1 ${
                    Number(homeDonate.amount) === amount
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-blue-700'
                  }`}
                >
                  {amount.toLocaleString('en-US')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Donor Name
              </span>

              <input
                type="text"
                value={homeDonate.donorName}
                onChange={(e) => handleHomeDonateChange('donorName', e.target.value)}
                placeholder="Your name"
                className={`h-10 rounded-2xl border bg-slate-50 px-3 text-xs font-bold outline-none transition focus:ring-4 ${
                  homeDonateErrors.donorName
                    ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-blue-100 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />

              {homeDonateErrors.donorName && (
                <span className="text-[9px] font-bold text-rose-600">
                  {homeDonateErrors.donorName}
                </span>
              )}
            </label>

            <label className="grid gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Mobile Number
              </span>

              <input
                type="tel"
                value={homeDonate.phone}
                onChange={(e) =>
                  handleHomeDonateChange('phone', e.target.value.replace(/\D/g, '').slice(0, 11))
                }
                placeholder="11 digit mobile number"
                className={`h-10 rounded-2xl border bg-slate-50 px-3 text-xs font-bold outline-none transition focus:ring-4 ${
                  homeDonateErrors.phone
                    ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-blue-100 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />

              {homeDonateErrors.phone && (
                <span className="text-[9px] font-bold text-rose-600">
                  {homeDonateErrors.phone}
                </span>
              )}
            </label>

            <label className="grid gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Amount
              </span>

              <input
                type="number"
                min="1"
                value={homeDonate.amount}
                onChange={(e) => handleHomeDonateChange('amount', e.target.value)}
                placeholder="500"
                className={`h-10 rounded-2xl border bg-slate-50 px-3 text-xs font-bold outline-none transition focus:ring-4 ${
                  homeDonateErrors.amount
                    ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-blue-100 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />

              {homeDonateErrors.amount && (
                <span className="text-[9px] font-bold text-rose-600">
                  {homeDonateErrors.amount}
                </span>
              )}
            </label>

            <label className="grid gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Fund / Project
              </span>

              <select
                value={homeDonate.fundOrProject}
                onChange={(e) => handleHomeDonateChange('fundOrProject', e.target.value)}
                className={`h-10 rounded-2xl border bg-slate-50 px-3 text-xs font-bold outline-none transition focus:ring-4 ${
                  homeDonateErrors.fundOrProject
                    ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-blue-100 focus:border-blue-500 focus:ring-blue-100'
                }`}
              >
                {activeCategories.length > 0 && (
                  <optgroup label="Fund Categories">
                    {activeCategories
                      .filter((category) => normalize(category.name) !== 'all project')
                      .map((category) => (
                        <option key={category._id || category.slug} value={`category:${category._id}`}>
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                )}

                {activeProjects.length > 0 && (
                  <optgroup label="Active Projects">
                    {activeProjects.map((project) => (
                      <option key={project._id || project.slug} value={`project:${project._id}`}>
                        Project: {project.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {homeDonateErrors.fundOrProject && (
                <span className="text-[9px] font-bold text-rose-600">
                  {homeDonateErrors.fundOrProject}
                </span>
              )}
            </label>
          </div>

          <button
            type="button"
            onClick={handleHomeDonateSubmit}
            className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1"
          >
            Donate Now
          </button>
        </div>
      </section>

      {recentDonationNotice && (
        <RecentDonationNotice
          donation={recentDonationNotice}
          onClose={dismissRecentDonationNotice}
        />
      )}

      <section className="min-w-0 rounded-[22px] border border-slate-100 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h3 className="truncate text-lg font-black tracking-[-0.04em] text-slate-950">
            Top Donors
          </h3>

          <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[9px] font-black text-sky-700">
            Max 10
          </span>
        </div>

        <SmartSlider
          items={topDonorList}
          activeIndex={topDonorIndex}
          visibleCards={visibleCards}
          emptyText="No donor data found"
        >
          {(donor, index) => (
            <MiniDonationCard item={donor} type="top" index={index} />
          )}
        </SmartSlider>
      </section>

      <section className="min-w-0 rounded-[22px] border border-blue-100 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h3 className="truncate text-lg font-black tracking-[-0.04em] text-slate-950">
            Running Projects
          </h3>

          <button
            type="button"
            onClick={() => navigateToPage('projects')}
            className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700 transition hover:bg-blue-100"
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
                  className="group w-[78vw] min-w-[78vw] snap-start overflow-hidden rounded-[20px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(37,99,235,0.14)] sm:w-[310px] sm:min-w-[310px] lg:w-[340px] lg:min-w-[340px]"
                >
                  <div className="relative h-36 overflow-hidden bg-slate-100">
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
                      <span className="inline-flex max-w-full rounded-full bg-white/90 px-3 py-1 text-[8px] font-black text-blue-700 backdrop-blur">
                        <span className="truncate">{project.category || 'General'}</span>
                      </span>

                      <h4 className="mt-2 line-clamp-2 text-base font-black leading-tight text-white">
                        {project.title}
                      </h4>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="min-w-0 rounded-xl bg-white p-2">
                        <p className="text-[7px] font-black uppercase text-slate-400">Target</p>
                        <p className="mt-1 truncate text-[9px] font-black text-slate-950">
                          {money(project.targetAmount)}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-white p-2">
                        <p className="text-[7px] font-black uppercase text-emerald-500">
                          Collected
                        </p>
                        <p className="mt-1 truncate text-[9px] font-black text-emerald-700">
                          {money(project.collectedAmount)}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-white p-2">
                        <p className="text-[7px] font-black uppercase text-rose-500">Left</p>
                        <p className="mt-1 truncate text-[9px] font-black text-rose-700">
                          {money(getRemaining(project))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[9px] font-black text-slate-500">
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

      <section className="min-w-0 rounded-[22px] border border-slate-100 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h3 className="truncate text-lg font-black tracking-[-0.04em] text-slate-950">
            Recent Donations
          </h3>

          <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-black text-violet-700">
            Max 10
          </span>
        </div>

        <SmartSlider
          items={recentDonations}
          activeIndex={recentDonationIndex}
          visibleCards={visibleCards}
          emptyText="No donations found"
        >
          {(donation, index) => (
            <MiniDonationCard item={donation} type="recent" index={index} />
          )}
        </SmartSlider>
      </section>

      <section className="min-w-0 rounded-[22px] border border-rose-100 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h3 className="truncate text-lg font-black tracking-[-0.04em] text-slate-950">
            Transparency
          </h3>

          <button
            type="button"
            onClick={() => navigateToPage('transparency')}
            className="shrink-0 rounded-full bg-rose-50 px-3 py-1.5 text-[9px] font-black text-rose-700 transition hover:bg-rose-100"
          >
            View All
          </button>
        </div>

        {transparencyPreview.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
            No expenses found
          </div>
        ) : (
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {transparencyPreview.map((expense) => {
              const imageUrl = makeImageUrl(API, expense.proofImage)

              return (
                <button
                  key={expense._id || expense.id}
                  type="button"
                  onClick={() => navigateToPage('transparency')}
                  className="group w-[46vw] min-w-[46vw] snap-start overflow-hidden rounded-[18px] border border-rose-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(225,29,72,0.12)] sm:w-[220px] sm:min-w-[220px] md:w-[250px] md:min-w-[250px]"
                >
                  <div className="relative h-24 overflow-hidden bg-slate-100 sm:h-32">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={expense.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-rose-600 to-orange-500 text-2xl font-black text-white">
                        OCF
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

                    <div className="absolute left-2 top-2 max-w-[calc(100%-16px)]">
                      <span className="block truncate rounded-full bg-white/90 px-2 py-1 text-[7px] font-black text-rose-700 backdrop-blur">
                        {expense.category || 'General Expense'}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 text-left">
                      <h4 className="line-clamp-2 text-[10px] font-black leading-tight text-white sm:text-xs">
                        {expense.title}
                      </h4>

                      <p className="mt-0.5 text-[7px] font-bold text-rose-100">
                        {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5">
                    <p className="text-[7px] font-black uppercase tracking-[0.12em] text-rose-500">
                      Amount
                    </p>

                    <h4 className="mt-1 truncate text-[12px] font-black text-slate-950">
                      {money(expense.amount)}
                    </h4>

                    <p className="mt-2 text-[9px] font-black text-slate-400">
                      Details
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <FacebookShareCard />

      <section className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100 blur-3xl" />
  <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-cyan-100 blur-3xl" />

  <div className="relative z-10 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
        Public Report
      </p>

      <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">
        Generate Foundation Report
      </h3>

      <p className="mt-2 text-xs font-bold leading-6 text-slate-500 sm:text-sm">
        View donation, expense, available fund, category summary and blood donation report.
      </p>
    </div>

    <button
      type="button"
      onClick={() => navigateToPage('reports')}
      className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-xs font-black text-white shadow-lg transition hover:-translate-y-1 sm:h-12 sm:text-sm"
    >
      Generate Report
    </button>
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
        {activePage === 'reports' && <ReportPage API={API} />}
        {activePage === 'about' && (<AboutPage navigateToPage={navigateToPage} />)}
      </div>

      <BottomNav activePage={activePage} onChange={navigateToPage} />
    </div>
  )
}

export default App