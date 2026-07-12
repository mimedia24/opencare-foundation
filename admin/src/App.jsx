import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Eye,
  FolderKanban,
  Hash,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  MapPin,
  MoreVertical,
  Phone,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react'

import DashboardPage from './pages/DashboardPage'
import VolunteersPage from './pages/VolunteersPage'
import UsersPage from './pages/UsersPage'
import ProjectsPage from './pages/ProjectsPage'
import DonationsPage from './pages/DonationsPage'
import ExpensesPage from './pages/ExpensesPage'
import CategoriesPage from './pages/CategoriesPage'
import SettingsPage from './pages/SettingsPage'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function formatDate(date) {
  if (!date) return 'Not found'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not found'
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getPageFromPath() {
  const path = window.location.pathname.toLowerCase()

  if (path === '/projects') return 'projects'
  if (path === '/donations') return 'donations'
  if (path === '/categories') return 'categories'
  if (path === '/expenses') return 'expenses'
  if (path === '/blood-proof') return 'blood-proof'
  if (path === '/volunteers') return 'volunteers'
  if (path === '/users') return 'users'
  if (path === '/blood-donors') return 'blood-donors'
  if (path === '/settings') return 'settings'

  return 'dashboard'
}

function getPathFromPage(page) {
  if (page === 'projects') return '/projects'
  if (page === 'donations') return '/donations'
  if (page === 'categories') return '/categories'
  if (page === 'expenses') return '/expenses'
  if (page === 'blood-proof') return '/blood-proof'
  if (page === 'volunteers') return '/volunteers'
  if (page === 'users') return '/users'
  if (page === 'blood-donors') return '/blood-donors'
  if (page === 'settings') return '/settings'

  return '/'
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ocf_admin_token') || '')

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ocf_admin_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [activePage, setActivePage] = useState(() => getPageFromPath())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [selectedProofImage, setSelectedProofImage] = useState('')
  const [loginError, setLoginError] = useState('')

  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
  })

  const [bloodDonors, setBloodDonors] = useState([])
  const [bloodRequests, setBloodRequests] = useState([])

  const navigateToPage = (page) => {
    setActivePage(page)
    setIsSidebarOpen(false)

    const nextPath = getPathFromPage(page)

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromPath())
      setIsSidebarOpen(false)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const pageMeta = useMemo(() => {
    if (activePage === 'projects') {
      return {
        kicker: 'Project Management',
        title: 'Projects Control',
        subtitle: 'Create, edit, pause, complete and manage foundation donation projects.',
      }
    }

    if (activePage === 'donations') {
      return {
        kicker: 'Donation Management',
        title: 'Donations Control',
        subtitle: 'Add, verify, reject, edit and manage project-wise donations.',
      }
    }

    if (activePage === 'categories') {
      return {
        kicker: 'Fund Category Management',
        title: 'Categories Control',
        subtitle: 'Create, edit, activate and manage donation fund categories.',
      }
    }

    if (activePage === 'expenses') {
      return {
        kicker: 'Transparency Management',
        title: 'Expenses Control',
        subtitle: 'Add, publish, hide, edit and manage foundation expense transparency records.',
      }
    }

    if (activePage === 'blood-proof') {
      return {
        kicker: 'Blood Approval',
        title: 'Blood Proof Requests',
        subtitle: 'Approve or reject donor blood donation proof requests.',
      }
    }

    if (activePage === 'volunteers') {
      return {
        kicker: 'Volunteer Approval',
        title: 'Volunteer Applications',
        subtitle: 'Manage volunteer applications and profile related approvals.',
      }
    }

    if (activePage === 'users') {
      return {
        kicker: 'User Management',
        title: 'Users Page',
        subtitle: 'View and manage registered foundation users.',
      }
    }

    if (activePage === 'blood-donors') {
      return {
        kicker: 'Blood Network',
        title: 'Blood Donors',
        subtitle: 'View public blood donors, verified status and donation count.',
      }
    }

    if (activePage === 'settings') {
      return {
        kicker: 'Admin Settings',
        title: 'Settings',
        subtitle: 'Admin settings and login system will be connected later.',
      }
    }

    return {
      kicker: 'Open Care Foundation Admin Panel',
      title: 'Foundation Control Dashboard',
      subtitle:
        'Manage dashboard stats, export reports, projects, donations, categories, expenses, users and approvals.',
    }
  }, [activePage])

  const loadDashboard = async (authToken = token) => {
    if (!authToken) return

    try {
      setDashboardLoading(true)

      const [donorsRes, bloodReqRes] = await Promise.all([
        fetch(`${API}/api/users/blood-donors`),
        fetch(`${API}/api/blood-donations/admin/requests`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      ])

      const donorsData = await donorsRes.json()
      const bloodReqData = await bloodReqRes.json()

      setBloodDonors(Array.isArray(donorsData?.donors) ? donorsData.donors : [])

      if (bloodReqRes.ok) {
        setBloodRequests(Array.isArray(bloodReqData?.requests) ? bloodReqData.requests : [])
      } else {
        setBloodRequests([])
      }
    } catch (err) {
      console.log(err.message)
    } finally {
      setDashboardLoading(false)
    }
  }

  useEffect(() => {
    if (token && adminUser?.role === 'admin') {
      loadDashboard(token)
    }
  }, [token, adminUser?.role])

  const handleLoginInput = (e) => {
    const { name, value } = e.target

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')

    if (!loginForm.identifier || !loginForm.password) {
      setLoginError('Email and password are required.')
      return
    }

    try {
      setLoginLoading(true)

      const res = await fetch(`${API}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Login failed.')
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Only admin users can access this panel.')
      }

      localStorage.setItem('ocf_admin_token', data.token)
      localStorage.setItem('ocf_admin_user', JSON.stringify(data.user))

      setToken(data.token)
      setAdminUser(data.user)
      setLoginForm({
        identifier: '',
        password: '',
      })

      await loadDashboard(data.token)
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('ocf_admin_token')
    localStorage.removeItem('ocf_admin_user')
    setToken('')
    setAdminUser(null)
    setActivePage('dashboard')
    setBloodDonors([])
    setBloodRequests([])

    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
    }
  }

  const handleApproveBloodProof = async (requestId) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    const confirmApprove = window.confirm('Approve this blood donation proof?')

    if (!confirmApprove) return

    const adminNote = window.prompt('Admin note optional:', '') || ''

    try {
      setActionLoadingId(requestId)

      const res = await fetch(`${API}/api/blood-donations/admin/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminNote,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Approval failed.')
      }

      alert(data.message || 'Blood donation proof approved successfully.')
      await loadDashboard(token)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const handleRejectBloodProof = async (requestId) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    const adminNote = window.prompt('Write rejection note:', '')

    if (adminNote === null) return

    const confirmReject = window.confirm('Reject this blood donation proof?')

    if (!confirmReject) return

    try {
      setActionLoadingId(requestId)

      const res = await fetch(`${API}/api/blood-donations/admin/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminNote,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Rejection failed.')
      }

      alert(data.message || 'Blood donation proof rejected successfully.')
      await loadDashboard(token)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      activeClass: 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg',
    },
    {
      key: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      activeClass: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg',
    },
    {
      key: 'donations',
      label: 'Donations',
      icon: HeartHandshake,
      activeClass: 'bg-gradient-to-r from-emerald-600 to-cyan-500 text-white shadow-lg',
    },
    {
      key: 'categories',
      label: 'Categories',
      icon: Hash,
      activeClass: 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-lg',
    },
    {
      key: 'expenses',
      label: 'Expenses',
      icon: Activity,
      activeClass: 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-lg',
    },
    {
      key: 'blood-proof',
      label: 'Blood Proof',
      icon: Droplets,
      activeClass: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg',
    },
    {
      key: 'volunteers',
      label: 'Volunteers',
      icon: Users,
      activeClass: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg',
    },
    {
      key: 'users',
      label: 'Users',
      icon: Users,
      activeClass: 'bg-gradient-to-r from-slate-700 to-slate-950 text-white shadow-lg',
    },
    {
      key: 'blood-donors',
      label: 'Blood Donors',
      icon: Droplets,
      activeClass: 'bg-gradient-to-r from-red-700 to-red-500 text-white shadow-lg',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      activeClass: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg',
    },
  ]

  const SidebarContent = (
    <>
      <div className="flex items-center gap-3 rounded-[24px] bg-white/10 p-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 sm:h-12 sm:w-12">
          <HeartHandshake size={22} />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-base font-black leading-5 sm:text-lg">Open Care</h3>
          <p className="text-xs font-bold text-blue-200">Admin Panel</p>
        </div>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white lg:hidden"
        >
          <X size={17} />
        </button>
      </div>

      <nav className="mt-6 grid gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigateToPage(item.key)}
              className={`flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-black transition sm:h-12 ${
                activePage === item.key
                  ? item.activeClass
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 flex h-11 w-full items-center gap-3 rounded-2xl bg-rose-500/10 px-4 text-sm font-black text-rose-200 transition hover:bg-rose-500/20 sm:h-12 lg:absolute lg:bottom-6 lg:left-6 lg:w-[calc(100%-48px)]"
      >
        <LogOut size={18} />
        Logout
      </button>
    </>
  )

  if (!token || adminUser?.role !== 'admin') {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-4">
        <div className="absolute left-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-160px] h-[460px] w-[460px] rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />

        <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/15 bg-white shadow-[0_45px_120px_rgba(0,0,0,0.45)] lg:grid-cols-2">
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#172554] via-[#0f172a] to-[#312e81] p-10 text-white lg:block">
            <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-100">
                <ShieldCheck size={14} />
                Open Care Main Admin
              </div>

              <h1 className="mt-10 max-w-md text-5xl font-black leading-[0.98] tracking-[-0.05em]">
                Smart control for foundation operations.
              </h1>

              <p className="mt-6 max-w-md text-sm font-semibold leading-7 text-blue-100/80">
                Manage dashboard stats, export reports, projects, donations, categories, expenses,
                blood donation proof, volunteer applications, donor information and foundation
                activity from one secure admin panel.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {['Secure Access', 'Export Reports', 'Transparency'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
            <div className="mx-auto grid h-18 w-18 place-items-center rounded-[24px] bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white shadow-[0_18px_44px_rgba(37,99,235,0.28)]">
              <ShieldCheck size={34} />
            </div>

            <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.26em] text-blue-600">
              Secure Admin Access
            </p>

            <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Welcome Back
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-center text-sm font-semibold leading-6 text-slate-500">
              Login with your admin email and password.
            </p>

            {loginError && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {loginError}
              </div>
            )}

            <label className="mt-6 grid gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              Email
              <input
                type="email"
                name="identifier"
                placeholder="opencarefoundation2026@gmail.com"
                value={loginForm.identifier}
                onChange={handleLoginInput}
                className="h-13 rounded-2xl border border-blue-100 bg-slate-50 px-4 py-4 text-sm font-bold normal-case tracking-normal text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="mt-4 grid gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              Password
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={handleLoginInput}
                className="h-13 rounded-2xl border border-blue-100 bg-slate-50 px-4 py-4 text-sm font-bold normal-case tracking-normal text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-6 h-13 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loginLoading ? 'Checking...' : 'Log In'}
            </button>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-xs font-bold leading-5 text-slate-500">
              Authorized admin access only.
            </div>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#eef4ff] text-slate-950 lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[290px_1fr]">
      {selectedProofImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white p-3 shadow-2xl sm:rounded-[30px] sm:p-4">
            <button
              type="button"
              onClick={() => setSelectedProofImage('')}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white sm:h-10 sm:w-10"
            >
              <X size={18} />
            </button>

            <img
              src={selectedProofImage}
              alt="Blood proof"
              className="max-h-[78vh] w-full rounded-[20px] object-contain sm:rounded-[22px]"
            />
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-[#06101f] p-4 text-white shadow-2xl transition-transform duration-300 sm:w-[300px] lg:sticky lg:top-0 lg:z-20 lg:min-h-screen lg:w-auto lg:translate-x-0 lg:p-6 lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {SidebarContent}
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/70 bg-white/85 px-4 shadow-sm backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg"
          >
            <MoreVertical size={22} />
          </button>

          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              Open Care
            </p>
            <h1 className="text-sm font-black text-slate-950">Admin Panel</h1>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(token)}
            disabled={dashboardLoading}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"
          >
            <RefreshCcw size={18} className={dashboardLoading ? 'animate-spin' : ''} />
          </button>
        </header>

        <div className="p-3 sm:p-4 md:p-6 lg:p-7">
          <section className="flex min-h-[165px] flex-col justify-end gap-4 rounded-[28px] bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.45),transparent_28%),linear-gradient(135deg,#020617,#172554_45%,#2563eb)] p-5 text-white shadow-[0_22px_55px_rgba(37,99,235,0.20)] sm:min-h-[190px] sm:rounded-[32px] sm:p-7 md:min-h-[220px] md:flex-row md:items-end md:justify-between md:rounded-[36px] md:p-9">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 sm:text-[10px] md:text-[11px] md:tracking-[0.25em]">
                {pageMeta.kicker}
              </p>

              <h1 className="mt-2 max-w-3xl text-[28px] font-black leading-[0.96] tracking-[-0.05em] sm:text-4xl md:mt-3 md:text-5xl xl:text-6xl">
                {pageMeta.title}
              </h1>

              <p className="mt-3 max-w-2xl text-xs font-semibold leading-5 text-blue-100/80 sm:text-sm sm:leading-6">
                {pageMeta.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(token)}
              disabled={dashboardLoading}
              className="hidden h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 md:flex"
            >
              <RefreshCcw size={16} className={dashboardLoading ? 'animate-spin' : ''} />
              {dashboardLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </section>

          {activePage === 'dashboard' && (
            <DashboardPage API={API} token={token} refreshBloodData={() => loadDashboard(token)} />
          )}

          {activePage === 'projects' && <ProjectsPage API={API} token={token} />}

          {activePage === 'donations' && <DonationsPage API={API} token={token} />}

          {activePage === 'categories' && <CategoriesPage API={API} token={token} />}

          {activePage === 'expenses' && <ExpensesPage API={API} token={token} />}

          {activePage === 'blood-proof' && (
            <section className="mt-4 rounded-[28px] border border-red-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-500 sm:text-[11px]">
                    Blood Approval
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
                    Blood Donation Proof Requests
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
                    Approve or reject donor blood donation proof requests.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadDashboard(token)}
                  disabled={dashboardLoading}
                  className="h-11 rounded-2xl bg-red-600 px-4 text-sm font-black text-white disabled:opacity-60"
                >
                  {dashboardLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {bloodRequests.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                    No blood proof request found.
                  </div>
                ) : (
                  bloodRequests.map((item) => (
                    <div
                      key={item._id}
                      className="grid gap-4 rounded-[24px] border border-red-100 bg-gradient-to-br from-white to-red-50 p-3 sm:rounded-[28px] sm:p-4 lg:grid-cols-[110px_1fr_220px]"
                    >
                      <button
                        type="button"
                        onClick={() => item.proofImage && setSelectedProofImage(item.proofImage)}
                        className="relative h-24 w-24 overflow-hidden rounded-[24px] bg-red-100 shadow-lg"
                      >
                        {item.proofImage ? (
                          <img
                            src={item.proofImage}
                            alt="Proof"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-sm font-black text-red-600">
                            Proof
                          </div>
                        )}

                        <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/80 text-white">
                          <Eye size={15} />
                        </span>
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-slate-950 sm:text-xl">
                            {item.name}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                              item.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2 sm:text-sm">
                          <p className="flex items-center gap-2">
                            <Phone size={15} />
                            {item.phone}
                          </p>

                          <p className="flex items-center gap-2">
                            <Droplets size={15} />
                            {item.bloodGroup}
                          </p>

                          <p className="flex items-center gap-2">
                            <MapPin size={15} />
                            {item.district || 'No district'}
                          </p>

                          <p className="flex items-center gap-2">
                            <CalendarDays size={15} />
                            {formatDate(item.donationDate)}
                          </p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-red-100 bg-white/80 p-3 sm:p-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-400 sm:text-[10px]">
                            Donor Note
                          </p>
                          <p className="mt-2 text-xs font-semibold leading-5 text-slate-700 sm:text-sm sm:leading-6">
                            {item.note || 'No note added'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:justify-between">
                        <div className="rounded-[22px] bg-white p-3 shadow-sm sm:rounded-[24px] sm:p-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
                            Request Date
                          </p>
                          <p className="mt-2 text-sm font-black text-slate-900">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>

                        {item.status === 'pending' ? (
                          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                            <button
                              type="button"
                              onClick={() => handleApproveBloodProof(item._id)}
                              disabled={actionLoadingId === item._id}
                              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 sm:text-sm"
                            >
                              <CheckCircle2 size={16} />
                              {actionLoadingId === item._id ? 'Working...' : 'Approve'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRejectBloodProof(item._id)}
                              disabled={actionLoadingId === item._id}
                              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 sm:text-sm"
                            >
                              <XCircle size={16} />
                              {actionLoadingId === item._id ? 'Working...' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-slate-100 p-4 text-center text-sm font-black capitalize text-slate-600">
                            Already {item.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activePage === 'volunteers' && <VolunteersPage API={API} token={token} />}

          {activePage === 'users' && <UsersPage API={API} token={token} />}

          {activePage === 'blood-donors' && (
            <section className="mt-4 rounded-[28px] border border-red-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-500 sm:text-[11px]">
                  Blood Network
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
                  Blood Donors
                </h2>
                <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
                  Public donor list from the main website.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {bloodDonors.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                    No blood donor found.
                  </div>
                ) : (
                  bloodDonors.map((donor) => (
                    <div
                      key={donor._id}
                      className="rounded-[24px] border border-red-100 bg-gradient-to-br from-white to-red-50 p-4 sm:rounded-[26px]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-red-600 text-xl font-black text-white">
                          {donor.profilePhoto ? (
                            <img
                              src={donor.profilePhoto}
                              alt={donor.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            donor.name?.charAt(0)?.toUpperCase() || 'D'
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-black text-slate-950">{donor.name}</h3>
                          <p className="truncate text-sm font-bold text-slate-500">
                            {donor.phone}
                          </p>
                        </div>

                        <span className="ml-auto rounded-2xl bg-red-600 px-3 py-2 text-sm font-black text-white">
                          {donor.bloodGroup}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-400">
                            Total Given
                          </p>
                          <p className="mt-1 text-xl font-black">
                            {donor.totalBloodDonations || 0}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-400">
                            Verified
                          </p>
                          <p className="mt-1 text-xl font-black">
                            {donor.isBloodDonorVerified ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activePage === 'settings' && <SettingsPage />}
        </div>
      </section>
    </main>
  )
}