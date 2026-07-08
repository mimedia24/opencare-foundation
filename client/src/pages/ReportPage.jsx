import { useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function money(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-US')}`
}

function today() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function firstDayOfCurrentMonth() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}-01`
}

function toDateOnly(value) {
  if (!value) return ''

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return ''

  return value
}

function formatDisplayDate(date) {
  if (!date) return 'Not added'

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return String(date)

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isFutureDate(value) {
  if (!value) return false

  const selected = new Date(`${value}T00:00:00`)
  const current = new Date(`${today()}T00:00:00`)

  return selected > current
}

function StatCard({ title, value, subtitle, color = 'blue' }) {
  const colorClass = {
    blue: 'from-blue-50 to-cyan-50 border-blue-100 text-blue-700',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700',
    rose: 'from-rose-50 to-orange-50 border-rose-100 text-rose-700',
    violet: 'from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700',
  }

  return (
    <div
      className={`min-w-0 rounded-[22px] border bg-gradient-to-br p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] ${
        colorClass[color] || colorClass.blue
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-80">
        {title}
      </p>

      <h3 className="mt-2 truncate text-xl font-black text-slate-950 sm:text-2xl">
        {value}
      </h3>

      {subtitle && (
        <p className="mt-1 truncate text-[10px] font-bold text-slate-500 sm:text-xs">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default function ReportPage({ API }) {
  const apiBase = API || import.meta.env.VITE_API_BASE_URL || window.location.origin
  const maxDate = today()

  const [dateFrom, setDateFrom] = useState(firstDayOfCurrentMonth())
  const [dateTo, setDateTo] = useState(today())
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState({
    dateFrom: firstDayOfCurrentMonth(),
    dateTo: today(),
  })

  const queryData = useMemo(() => {
    const from = toDateOnly(dateFrom) || today()
    const to = toDateOnly(dateTo) || from

    const params = new URLSearchParams()
    params.append('dateFrom', from)
    params.append('dateTo', to)

    return {
      url: `${apiBase}/api/reports?${params.toString()}`,
      period: {
        dateFrom: from,
        dateTo: to,
      },
    }
  }, [apiBase, dateFrom, dateTo])

  const validateDates = () => {
    if (!dateFrom || !dateTo) {
      alert('Please select Date From and Date To.')
      return false
    }

    if (isFutureDate(dateFrom)) {
      alert('Date From cannot be a future date.')
      return false
    }

    if (isFutureDate(dateTo)) {
      alert('Date To cannot be a future date.')
      return false
    }

    if (new Date(`${dateFrom}T00:00:00`) > new Date(`${dateTo}T00:00:00`)) {
      alert('Date From cannot be greater than Date To.')
      return false
    }

    return true
  }

  const loadReport = async () => {
    try {
      if (!validateDates()) return

      setLoading(true)
      setReport(null)

      const res = await fetch(queryData.url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to generate report.')
      }

      if (!data?.report) {
        throw new Error('Report data not found.')
      }

      setReport(data.report)
      setSelectedPeriod(queryData.period)
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const drawRoundedCard = (doc, x, y, w, h, fillColor, strokeColor) => {
    doc.setFillColor(...fillColor)
    doc.setDrawColor(...strokeColor)
    doc.roundedRect(x, y, w, h, 5, 5, 'FD')
  }

  const addPdfHeader = (doc, periodText) => {
    doc.setFillColor(7, 15, 35)
    doc.rect(0, 0, 210, 55, 'F')

    doc.setFillColor(37, 99, 235)
    doc.circle(21, 23, 9, 'F')

    doc.setFillColor(14, 165, 233)
    doc.circle(25, 18, 5, 'F')

    doc.setFillColor(255, 255, 255)
    doc.circle(21, 23, 3, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(25)
    doc.text('OPEN CARE', 36, 21)

    doc.setFontSize(18)
    doc.setTextColor(125, 211, 252)
    doc.text('FOUNDATION', 36, 31)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(203, 213, 225)
    doc.text('Financial, Project & Blood Donation Activity Report', 36, 39)

    doc.setFillColor(255, 255, 255)
    doc.roundedRect(14, 43, 102, 8, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(37, 99, 235)
    doc.text(`REPORT PERIOD: ${periodText}`, 18, 48.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(203, 213, 225)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 137, 48.5)

    doc.setFillColor(37, 99, 235)
    doc.rect(0, 54, 210, 1.5, 'F')
  }

  const addPdfFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i)

      doc.setDrawColor(226, 232, 240)
      doc.line(14, 285, 196, 285)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(37, 99, 235)
      doc.text('Open Care Foundation', 14, 291)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(`Page ${i} of ${pageCount}`, 178, 291)
    }
  }

  const addSectionTitle = (doc, text, y, color = [15, 23, 42]) => {
    doc.setFillColor(...color)
    doc.roundedRect(14, y - 5, 4, 7, 1, 1, 'F')

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(text, 22, y)
  }

  const checkPage = (doc, y, needed = 60) => {
    if (y + needed > 280) {
      doc.addPage()
      return 18
    }

    return y
  }

  const addSummaryCards = (doc, y, reportData) => {
    const periodDonation = reportData?.periodSummary?.totalDonation || 0
    const periodExpense = reportData?.periodSummary?.totalExpense || 0
    const periodFund = reportData?.periodSummary?.availableFund || 0
    const bloodBags = reportData?.bloodSummary?.periodBloodBags || 0

    drawRoundedCard(doc, 14, y, 43, 24, [239, 246, 255], [191, 219, 254])
    drawRoundedCard(doc, 61, y, 43, 24, [255, 241, 242], [254, 205, 211])
    drawRoundedCard(doc, 108, y, 43, 24, [236, 253, 245], [167, 243, 208])
    drawRoundedCard(doc, 155, y, 41, 24, [245, 243, 255], [221, 214, 254])

    const cards = [
      {
        x: 18,
        title: 'COLLECTED',
        value: money(periodDonation),
        color: [37, 99, 235],
      },
      {
        x: 65,
        title: 'EXPENSE',
        value: money(periodExpense),
        color: [225, 29, 72],
      },
      {
        x: 112,
        title: 'AVAILABLE',
        value: money(periodFund),
        color: [5, 150, 105],
      },
      {
        x: 159,
        title: 'BLOOD BAGS',
        value: String(bloodBags),
        color: [124, 58, 237],
      },
    ]

    cards.forEach((card) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...card.color)
      doc.text(card.title, card.x, y + 8)

      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      const value = String(card.value)
      doc.text(value.length > 17 ? `${value.slice(0, 17)}...` : value, card.x, y + 17)
    })

    return y + 34
  }

  const tableTheme = (headColor) => ({
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: headColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: {
      left: 14,
      right: 14,
    },
  })

  const downloadPdf = () => {
    try {
      if (!report) {
        alert('Please generate report first.')
        return
      }

      if (!validateDates()) return

      const reportData = report
      const periodText = `${formatDisplayDate(selectedPeriod.dateFrom)} to ${formatDisplayDate(
        selectedPeriod.dateTo
      )}`

      const doc = new jsPDF('p', 'mm', 'a4')

      addPdfHeader(doc, periodText)

      let y = 66

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(15, 23, 42)
      doc.text('Report Overview', 14, y)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Selected report period: ${periodText}`, 14, y + 7)

      y += 15
      y = addSummaryCards(doc, y, reportData)

      addSectionTitle(doc, 'Financial Summary', y, [37, 99, 235])

      autoTable(doc, {
        startY: y + 6,
        ...tableTheme([37, 99, 235]),
        head: [['Metric', 'Selected Period', 'Lifetime']],
        body: [
          [
            'Total Donation',
            money(reportData.periodSummary.totalDonation),
            money(reportData.lifetimeSummary.totalDonation),
          ],
          [
            'Total Expense',
            money(reportData.periodSummary.totalExpense),
            money(reportData.lifetimeSummary.totalExpense),
          ],
          [
            'Available Fund',
            money(reportData.periodSummary.availableFund),
            money(reportData.lifetimeSummary.availableFund),
          ],
          ['Donation Count', reportData.periodSummary.donationCount, '-'],
          ['Expense Count', reportData.periodSummary.expenseCount, '-'],
        ],
      })

      y = doc.lastAutoTable.finalY + 12
      y = checkPage(doc, y, 60)

      addSectionTitle(doc, 'Income by Fund Category', y, [16, 185, 129])

      autoTable(doc, {
        startY: y + 6,
        ...tableTheme([16, 185, 129]),
        head: [['Fund Category', 'Donation Count', 'Amount']],
        body:
          reportData.incomeByCategory?.length > 0
            ? reportData.incomeByCategory.map((item) => [
                item.name,
                item.count,
                money(item.amount),
              ])
            : [['No income found', '-', money(0)]],
      })

      y = doc.lastAutoTable.finalY + 12
      y = checkPage(doc, y, 60)

      addSectionTitle(doc, 'Expense by Category', y, [225, 29, 72])

      autoTable(doc, {
        startY: y + 6,
        ...tableTheme([225, 29, 72]),
        head: [['Expense Category', 'Expense Count', 'Amount']],
        body:
          reportData.expenseByCategory?.length > 0
            ? reportData.expenseByCategory.map((item) => [
                item.name,
                item.count,
                money(item.amount),
              ])
            : [['No expense found', '-', money(0)]],
      })

      y = doc.lastAutoTable.finalY + 12
      y = checkPage(doc, y, 60)

      addSectionTitle(doc, 'Blood Donation Summary', y, [220, 38, 38])

      autoTable(doc, {
        startY: y + 6,
        ...tableTheme([220, 38, 38]),
        head: [['Metric', 'Value']],
        body: [
          ['Total Blood Donors', reportData.bloodSummary.totalBloodDonors],
          ['Verified Blood Donors', reportData.bloodSummary.verifiedBloodDonors],
          ['Total Blood Bags', reportData.bloodSummary.totalBloodBags],
          ['Blood Bags in Selected Period', reportData.bloodSummary.periodBloodBags],
        ],
      })

      y = doc.lastAutoTable.finalY + 12
      y = checkPage(doc, y, 50)

      addSectionTitle(doc, 'Blood Bags by Group', y, [239, 68, 68])

      autoTable(doc, {
        startY: y + 6,
        ...tableTheme([239, 68, 68]),
        head: [['Blood Group', 'Bags']],
        body:
          reportData.bloodSummary.bloodByGroup?.length > 0
            ? reportData.bloodSummary.bloodByGroup.map((item) => [item.name, item.bags])
            : [['No blood donation found', 0]],
      })

      y = doc.lastAutoTable.finalY + 12
      y = checkPage(doc, y, 70)

      addSectionTitle(doc, 'Active Projects', y, [59, 130, 246])

      autoTable(doc, {
        startY: y + 6,
        ...tableTheme([59, 130, 246]),
        styles: {
          ...tableTheme([59, 130, 246]).styles,
          fontSize: 7.3,
        },
        head: [['Project', 'Category', 'Target', 'Collected', 'Remaining']],
        body:
          reportData.projects?.active?.length > 0
            ? reportData.projects.active.map((project) => [
                project.title,
                project.category || 'General',
                money(project.targetAmount),
                money(project.collectedAmount),
                money(project.remainingAmount),
              ])
            : [['No active project found', '-', '-', '-', '-']],
      })

      y = doc.lastAutoTable.finalY + 12
      y = checkPage(doc, y, 70)

      addSectionTitle(doc, 'Recent Donations', y, [124, 58, 237])

      autoTable(doc, {
        startY: y + 6,
        ...tableTheme([124, 58, 237]),
        styles: {
          ...tableTheme([124, 58, 237]).styles,
          fontSize: 7,
        },
        head: [['Date', 'Donor', 'Category', 'Project', 'Amount']],
        body:
          reportData.recentDonations?.length > 0
            ? reportData.recentDonations.map((item) => [
                item.date,
                item.donorName,
                item.category,
                item.project || '-',
                money(item.amount),
              ])
            : [['No donation found', '-', '-', '-', '-']],
      })

      y = doc.lastAutoTable.finalY + 12
      y = checkPage(doc, y, 70)

      addSectionTitle(doc, 'Recent Expenses', y, [244, 63, 94])

      autoTable(doc, {
        startY: y + 6,
        ...tableTheme([244, 63, 94]),
        styles: {
          ...tableTheme([244, 63, 94]).styles,
          fontSize: 7,
        },
        head: [['Date', 'Title', 'Category', 'Project', 'Amount']],
        body:
          reportData.recentExpenses?.length > 0
            ? reportData.recentExpenses.map((item) => [
                item.date,
                item.title,
                item.category,
                item.project || '-',
                money(item.amount),
              ])
            : [['No expense found', '-', '-', '-', '-']],
      })

      addPdfFooter(doc)

      doc.save(`open-care-report-${selectedPeriod.dateFrom}-to-${selectedPeriod.dateTo}.pdf`)
    } catch (error) {
      alert(error.message || 'PDF download failed.')
    }
  }

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#eef4ff] px-2 pb-36 pt-3 text-slate-950 sm:px-5 md:px-6">
      <div className="relative overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.45),transparent_28%),linear-gradient(135deg,#020617,#172554_45%,#2563eb)] p-4 text-white shadow-[0_18px_45px_rgba(37,99,235,0.20)] sm:rounded-[32px] sm:p-7">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-blue-100 backdrop-blur-xl sm:text-[10px]">
            Open Care Foundation
          </div>

          <h1 className="mt-4 text-[30px] font-black leading-[0.95] tracking-[-0.06em] sm:text-5xl">
            Generate Report
          </h1>

          <p className="mt-3 max-w-2xl text-[11px] font-semibold leading-5 text-blue-100/85 sm:text-sm sm:leading-7">
            Select a date range and download a modern PDF report with donation, expense, fund,
            category and blood donation summary.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-blue-100 bg-white p-3 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <label className="grid gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Date From
            </span>

            <input
              type="date"
              value={dateFrom}
              max={maxDate}
              onChange={(e) => {
                const value = e.target.value

                if (isFutureDate(value)) {
                  alert('Future date report is not allowed.')
                  return
                }

                setDateFrom(value)
                setReport(null)
              }}
              className="h-11 rounded-2xl border border-blue-100 bg-slate-50 px-3 text-xs font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Date To
            </span>

            <input
              type="date"
              value={dateTo}
              max={maxDate}
              onChange={(e) => {
                const value = e.target.value

                if (isFutureDate(value)) {
                  alert('Future date report is not allowed.')
                  return
                }

                setDateTo(value)
                setReport(null)
              }}
              className="h-11 rounded-2xl border border-blue-100 bg-slate-50 px-3 text-xs font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="h-11 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white shadow-lg transition hover:-translate-y-1 disabled:opacity-60"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>

          <button
            type="button"
            onClick={downloadPdf}
            disabled={!report}
            className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-xs font-black text-white shadow-lg transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>

        {report && (
          <div className="mt-3 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
            Current report period: {formatDisplayDate(selectedPeriod.dateFrom)} to{' '}
            {formatDisplayDate(selectedPeriod.dateTo)}
          </div>
        )}
      </div>

      {report && (
        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Collected"
              value={money(report.periodSummary.totalDonation)}
              subtitle="Selected period"
              color="blue"
            />

            <StatCard
              title="Expense"
              value={money(report.periodSummary.totalExpense)}
              subtitle="Selected period"
              color="rose"
            />

            <StatCard
              title="Available"
              value={money(report.periodSummary.availableFund)}
              subtitle="Selected period"
              color="emerald"
            />

            <StatCard
              title="Blood Bags"
              value={report.bloodSummary.periodBloodBags}
              subtitle="Selected period"
              color="violet"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
              <h3 className="text-lg font-black text-slate-950">Income by Category</h3>

              <div className="mt-3 grid gap-2">
                {report.incomeByCategory.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                    No income found.
                  </p>
                ) : (
                  report.incomeByCategory.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-500">
                          {item.count} donations
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-black text-emerald-700">
                        {money(item.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-rose-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
              <h3 className="text-lg font-black text-slate-950">Expense by Category</h3>

              <div className="mt-3 grid gap-2">
                {report.expenseByCategory.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                    No expense found.
                  </p>
                ) : (
                  report.expenseByCategory.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-500">
                          {item.count} expenses
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-black text-rose-700">
                        {money(item.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-red-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <h3 className="text-lg font-black text-slate-950">Blood Donation Summary</h3>

            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                title="Total Donors"
                value={report.bloodSummary.totalBloodDonors}
                color="rose"
              />

              <StatCard
                title="Verified"
                value={report.bloodSummary.verifiedBloodDonors}
                color="emerald"
              />

              <StatCard
                title="Total Bags"
                value={report.bloodSummary.totalBloodBags}
                color="violet"
              />

              <StatCard
                title="Period Bags"
                value={report.bloodSummary.periodBloodBags}
                color="blue"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}