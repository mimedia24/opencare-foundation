import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BadgeCheck,
  Download,
  Droplets,
  FileText,
  FolderKanban,
  HeartHandshake,
  LayoutDashboard,
  Printer,
  RefreshCcw,
  ShieldCheck,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function money(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-US')}`
}

function formatDate(date) {
  if (!date) return 'Not found'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return 'Not found'

  return parsedDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function csvSafe(value) {
  const text = String(value ?? '').replace(/"/g, '""')
  return `"${text}"`
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvSafe).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export default function DashboardPage({ API, token, refreshBloodData }) {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState('')

  const monthlyFinance = Array.isArray(stats.monthlyFinance) ? stats.monthlyFinance : []
  const projectWise = Array.isArray(stats.projectWise) ? stats.projectWise : []
  const categoryWiseDonation = Array.isArray(stats.categoryWiseDonation)
    ? stats.categoryWiseDonation
    : []
  const categoryWiseExpense = Array.isArray(stats.categoryWiseExpense)
    ? stats.categoryWiseExpense
    : []
  const paymentMethodWise = Array.isArray(stats.paymentMethodWise) ? stats.paymentMethodWise : []

  const financeCards = [
    {
      title: 'Verified Donation',
      value: money(stats.totalDonation),
      note: `${stats.verifiedDonationCount || 0} verified records`,
      icon: HeartHandshake,
      box: 'from-blue-50 to-white border-blue-100',
      iconBox: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Pending Donation',
      value: money(stats.pendingDonation),
      note: `${stats.pendingDonationCount || 0} pending records`,
      icon: ShieldCheck,
      box: 'from-amber-50 to-white border-amber-100',
      iconBox: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Published Expense',
      value: money(stats.totalExpense),
      note: `${stats.totalExpenseCount || 0} public expense records`,
      icon: Activity,
      box: 'from-rose-50 to-white border-rose-100',
      iconBox: 'bg-rose-100 text-rose-700',
    },
    {
      title: 'Available Fund',
      value: money(stats.availableFund),
      note: 'Verified donation minus published expense',
      icon: LayoutDashboard,
      box: 'from-emerald-50 to-white border-emerald-100',
      iconBox: 'bg-emerald-100 text-emerald-700',
    },
  ]

  const operationCards = [
    {
      title: 'Projects',
      value: stats.totalProjects || 0,
      note: `${stats.activeProjects || 0} active, ${stats.completedProjects || 0} completed`,
      icon: FolderKanban,
      box: 'from-cyan-50 to-white border-cyan-100',
      iconBox: 'bg-cyan-100 text-cyan-700',
    },
    {
      title: 'Users',
      value: stats.totalUsers || 0,
      note: `${stats.totalVolunteers || 0} approved volunteers`,
      icon: Users,
      box: 'from-violet-50 to-white border-violet-100',
      iconBox: 'bg-violet-100 text-violet-700',
    },
    {
      title: 'Blood Donors',
      value: stats.totalBloodDonors || 0,
      note: `${stats.verifiedBloodDonors || 0} verified donors`,
      icon: Droplets,
      box: 'from-red-50 to-white border-red-100',
      iconBox: 'bg-red-100 text-red-700',
    },
    {
      title: 'Fund Categories',
      value: stats.totalCategories || 0,
      note: 'Donation category records',
      icon: BadgeCheck,
      box: 'from-slate-50 to-white border-slate-200',
      iconBox: 'bg-slate-200 text-slate-700',
    },
  ]

  const reportRows = useMemo(() => {
    return [
      ['Open Care Foundation Dashboard Report'],
      ['Generated At', formatDate(new Date())],
      [],
      ['Summary', 'Value'],
      ['Verified Donation', stats.totalDonation || 0],
      ['Pending Donation', stats.pendingDonation || 0],
      ['Rejected Donation', stats.rejectedDonation || 0],
      ['Published Expense', stats.totalExpense || 0],
      ['All Expense', stats.allExpenseAmount || 0],
      ['Available Fund', stats.availableFund || 0],
      ['Total Projects', stats.totalProjects || 0],
      ['Active Projects', stats.activeProjects || 0],
      ['Completed Projects', stats.completedProjects || 0],
      ['Total Users', stats.totalUsers || 0],
      ['Total Volunteers', stats.totalVolunteers || 0],
      ['Total Blood Donors', stats.totalBloodDonors || 0],
      ['Pending Volunteer Applications', stats.pendingVolunteerApplications || 0],
      ['Pending Blood Proof Requests', stats.pendingBloodDonationRequests || 0],
      [],
      ['Monthly Finance'],
      ['Month', 'Donation', 'Expense'],
      ...monthlyFinance.map((item) => [item.name, item.donation || 0, item.expense || 0]),
      [],
      ['Project Wise Fund'],
      ['Project', 'Status', 'Target', 'Collected', 'Remaining', 'Progress %'],
      ...projectWise.map((item) => [
        item.title,
        item.status,
        item.targetAmount || 0,
        item.collectedAmount || 0,
        item.remainingAmount || 0,
        item.progressPercent || 0,
      ]),
    ]
  }, [stats, monthlyFinance, projectWise])

  const loadStats = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API}/api/stats`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load dashboard stats.')
      }

      setStats(data || {})

      if (typeof refreshBloodData === 'function') {
        refreshBloodData()
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [API, token])

  const fetchAdminData = async (path) => {
    if (!token) {
      throw new Error('Please login first.')
    }

    const res = await fetch(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.message || 'Export data load failed.')
    }

    return data
  }

  const exportDashboardCsv = () => {
    downloadCsv(`open-care-dashboard-report-${Date.now()}.csv`, reportRows)
  }

  const exportDonationCsv = async () => {
    try {
      setExportLoading('donations')

      const data = await fetchAdminData('/api/donations/admin/all')
      const donations = Array.isArray(data?.donations) ? data.donations : []

      const rows = [
        ['Donor Name', 'Phone', 'Email', 'Amount', 'Payment Method', 'Transaction ID', 'Project', 'Category', 'Status', 'Created At'],
        ...donations.map((item) => [
          item.donorName || '',
          item.phone || '',
          item.email || '',
          item.amount || 0,
          item.paymentMethod || '',
          item.transactionId || '',
          item.projectTitle || item.project?.title || '',
          item.fundCategoryName || '',
          item.status || '',
          formatDate(item.createdAt),
        ]),
      ]

      downloadCsv(`open-care-donation-report-${Date.now()}.csv`, rows)
    } catch (error) {
      alert(error.message)
    } finally {
      setExportLoading('')
    }
  }

  const exportExpenseCsv = async () => {
    try {
      setExportLoading('expenses')

      const data = await fetchAdminData('/api/expenses/admin/all')
      const expenses = Array.isArray(data?.expenses) ? data.expenses : []

      const rows = [
        ['Title', 'Category', 'Project', 'Amount', 'Status', 'Expense Date', 'Proof Link', 'Created At'],
        ...expenses.map((item) => [
          item.title || '',
          item.category || '',
          item.projectTitle || item.project?.title || '',
          item.amount || 0,
          item.status || '',
          formatDate(item.expenseDate),
          item.proofLink || '',
          formatDate(item.createdAt),
        ]),
      ]

      downloadCsv(`open-care-expense-report-${Date.now()}.csv`, rows)
    } catch (error) {
      alert(error.message)
    } finally {
      setExportLoading('')
    }
  }

  const exportProjectCsv = async () => {
    try {
      setExportLoading('projects')

      const data = await fetchAdminData('/api/projects/admin/all')
      const projects = Array.isArray(data?.projects) ? data.projects : []

      const rows = [
        ['Title', 'Category', 'Target Amount', 'Collected Amount', 'Remaining Amount', 'Progress %', 'Status', 'Location', 'Created At'],
        ...projects.map((item) => [
          item.title || '',
          item.category || '',
          item.targetAmount || 0,
          item.collectedAmount || 0,
          item.remainingAmount || 0,
          item.progressPercent || 0,
          item.status || '',
          item.location || '',
          formatDate(item.createdAt),
        ]),
      ]

      downloadCsv(`open-care-project-report-${Date.now()}.csv`, rows)
    } catch (error) {
      alert(error.message)
    } finally {
      setExportLoading('')
    }
  }

  const printDashboardReport = () => {
    const html = `
      <html>
        <head>
          <title>Open Care Foundation Dashboard Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #0f172a; }
            h1 { margin: 0 0 6px; }
            p { margin: 0 0 20px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #cbd5e1; padding: 9px; font-size: 12px; text-align: left; }
            th { background: #eff6ff; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }
            .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
            .label { color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .value { font-size: 18px; font-weight: bold; margin-top: 8px; }
          </style>
        </head>
        <body>
          <h1>Open Care Foundation Dashboard Report</h1>
          <p>Generated at: ${formatDate(new Date())}</p>

          <div class="grid">
            <div class="card"><div class="label">Verified Donation</div><div class="value">${money(stats.totalDonation)}</div></div>
            <div class="card"><div class="label">Published Expense</div><div class="value">${money(stats.totalExpense)}</div></div>
            <div class="card"><div class="label">Available Fund</div><div class="value">${money(stats.availableFund)}</div></div>
            <div class="card"><div class="label">Projects</div><div class="value">${stats.totalProjects || 0}</div></div>
          </div>

          <h2>Monthly Finance</h2>
          <table>
            <thead>
              <tr><th>Month</th><th>Donation</th><th>Expense</th></tr>
            </thead>
            <tbody>
              ${monthlyFinance
                .map(
                  (item) =>
                    `<tr><td>${item.name}</td><td>${money(item.donation)}</td><td>${money(item.expense)}</td></tr>`
                )
                .join('')}
            </tbody>
          </table>

          <h2>Project Wise Fund</h2>
          <table>
            <thead>
              <tr><th>Project</th><th>Status</th><th>Target</th><th>Collected</th><th>Remaining</th><th>Progress</th></tr>
            </thead>
            <tbody>
              ${projectWise
                .map(
                  (item) =>
                    `<tr><td>${item.title}</td><td>${item.status}</td><td>${money(item.targetAmount)}</td><td>${money(item.collectedAmount)}</td><td>${money(item.remainingAmount)}</td><td>${item.progressPercent}%</td></tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const reportWindow = window.open('', '_blank')
    reportWindow.document.write(html)
    reportWindow.document.close()
    reportWindow.focus()
    reportWindow.print()
  }

  return (
    <section className="mt-4 grid gap-4">
      <div className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-500 sm:text-[11px]">
              Live Dashboard
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
              Finance, Project and Operation Summary
            </h2>

            <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
              Real-time donation, expense, project progress, category and export report overview.
            </p>

            <p className="mt-2 text-xs font-bold text-slate-400">
              Last updated: {formatDate(stats.lastUpdatedAt)}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={loadStats}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg disabled:opacity-60"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              type="button"
              onClick={exportDashboardCsv}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg"
            >
              <Download size={16} />
              CSV Report
            </button>

            <button
              type="button"
              onClick={printDashboardReport}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg sm:col-span-2 xl:col-span-1"
            >
              <Printer size={16} />
              Print / PDF
            </button>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {financeCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.title}
              className={`rounded-[24px] border bg-gradient-to-br ${card.box} p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">
                    {card.title}
                  </p>

                  <h3 className="mt-3 break-words text-xl font-black text-slate-950 sm:text-2xl">
                    {card.value}
                  </h3>

                  <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{card.note}</p>
                </div>

                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${card.iconBox}`}>
                  <Icon size={19} />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {operationCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.title}
              className={`rounded-[24px] border bg-gradient-to-br ${card.box} p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">
                    {card.title}
                  </p>

                  <h3 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
                    {card.value}
                  </h3>

                  <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{card.note}</p>
                </div>

                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${card.iconBox}`}>
                  <Icon size={19} />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
                Monthly Trend
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-2xl">
                Donation vs Expense
              </h3>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700 sm:text-xs">
              Last 12 months
            </span>
          </div>

          <div className="mt-4 h-[280px] sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFinance} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardDonationColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="dashboardExpenseColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="donation"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#dashboardDonationColor)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#e11d48"
                  strokeWidth={3}
                  fill="url(#dashboardExpenseColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
              Export Center
            </p>

            <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-2xl">
              Download Reports
            </h3>

            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              Export donation, expense, project and dashboard reports as CSV. Print dashboard report
              as PDF using browser print.
            </p>
          </div>

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={exportDonationCsv}
              disabled={exportLoading === 'donations'}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-black text-blue-700 disabled:opacity-60"
            >
              <FileText size={16} />
              {exportLoading === 'donations' ? 'Exporting...' : 'Donation CSV'}
            </button>

            <button
              type="button"
              onClick={exportExpenseCsv}
              disabled={exportLoading === 'expenses'}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 text-sm font-black text-rose-700 disabled:opacity-60"
            >
              <FileText size={16} />
              {exportLoading === 'expenses' ? 'Exporting...' : 'Expense CSV'}
            </button>

            <button
              type="button"
              onClick={exportProjectCsv}
              disabled={exportLoading === 'projects'}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-50 px-4 text-sm font-black text-cyan-700 disabled:opacity-60"
            >
              <FileText size={16} />
              {exportLoading === 'projects' ? 'Exporting...' : 'Project CSV'}
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Project Fund
            </p>

            <p className="mt-2 text-sm font-black text-slate-950">
              Target: {money(stats.projectTargetAmount)}
            </p>

            <p className="mt-1 text-sm font-black text-emerald-700">
              Collected: {money(stats.projectCollectedAmount)}
            </p>

            <p className="mt-1 text-sm font-black text-rose-700">
              Remaining: {money(stats.projectRemainingAmount)}
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
            Category Analytics
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-2xl">
            Donation by Category
          </h3>

          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryWiseDonation.slice(0, 8)} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Bar dataKey="amount" fill="#2563eb" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
            Expense Analytics
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-2xl">
            Expense by Category
          </h3>

          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryWiseExpense.slice(0, 8)} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Bar dataKey="amount" fill="#e11d48" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
                Project Wise Fund
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-2xl">
                Project Progress
              </h3>
            </div>

            <span className="rounded-full bg-cyan-50 px-3 py-2 text-[10px] font-black text-cyan-700 sm:text-xs">
              {projectWise.length} projects
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {projectWise.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
                No project data found.
              </div>
            ) : (
              projectWise.slice(0, 8).map((project) => (
                <div key={project._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-black text-slate-950">
                        {project.title}
                      </h4>

                      <p className="mt-1 text-xs font-bold capitalize text-slate-500">
                        {project.status}
                      </p>
                    </div>

                    <p className="text-sm font-black text-blue-700">
                      {project.progressPercent || 0}%
                    </p>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${project.progressPercent || 0}%` }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white p-2">
                      <p className="text-[9px] font-black uppercase text-slate-400">Target</p>
                      <p className="mt-1 truncate text-xs font-black">{money(project.targetAmount)}</p>
                    </div>

                    <div className="rounded-xl bg-white p-2">
                      <p className="text-[9px] font-black uppercase text-emerald-500">Collected</p>
                      <p className="mt-1 truncate text-xs font-black">{money(project.collectedAmount)}</p>
                    </div>

                    <div className="rounded-xl bg-white p-2">
                      <p className="text-[9px] font-black uppercase text-rose-500">Remaining</p>
                      <p className="mt-1 truncate text-xs font-black">{money(project.remainingAmount)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
            Payment Methods
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-2xl">
            Donation Method Summary
          </h3>

          <div className="mt-5 grid gap-3">
            {paymentMethodWise.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
                No payment method data found.
              </div>
            ) : (
              paymentMethodWise.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="text-sm font-black capitalize text-slate-950">{item.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{item.count} records</p>
                  </div>

                  <p className="text-sm font-black text-blue-700">{money(item.amount)}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  )
}