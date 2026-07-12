import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  HeartHandshake,
  Image as ImageIcon,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'

function money(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-US')}`
}

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

const emptyForm = {
  project: '',
  fundCategoryName: 'General Donation',
  donorName: '',
  phone: '',
  email: '',
  amount: '',
  paymentMethod: 'bkash',
  transactionId: '',
  status: 'pending',
  note: '',
  adminNote: '',
  isAnonymous: false,
  proofImage: null,
}

export default function DonationsPage({ API, token }) {
  const [donations, setDonations] = useState([])
  const [projects, setProjects] = useState([])
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    verifiedAmount: 0,
    pendingAmount: 0,
  })

  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [editingDonationId, setEditingDonationId] = useState('')
  const [selectedImage, setSelectedImage] = useState('')

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    project: '',
    paymentMethod: 'all',
    dateFrom: '',
    dateTo: '',
  })

  const [form, setForm] = useState(emptyForm)

  const totals = useMemo(() => {
    return {
      totalAmount: donations.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      verifiedAmount: donations
        .filter((item) => item.status === 'verified')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      pendingAmount: donations
        .filter((item) => item.status === 'pending')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      rejectedAmount: donations
        .filter((item) => item.status === 'rejected')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }
  }, [donations])

  const buildQuery = () => {
    const params = new URLSearchParams()

    if (filters.search.trim()) params.append('search', filters.search.trim())
    if (filters.status !== 'all') params.append('status', filters.status)
    if (filters.project) params.append('project', filters.project)
    if (filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)

    return params.toString()
  }

  const loadProjects = async () => {
    if (!token) return

    try {
      const res = await fetch(`${API}/api/projects/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (res.ok) {
        setProjects(Array.isArray(data?.projects) ? data.projects : [])
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const loadDonations = async () => {
    if (!token) return

    try {
      setLoading(true)

      const query = buildQuery()

      const res = await fetch(`${API}/api/donations/admin/all${query ? `?${query}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load donations.')
      }

      setDonations(Array.isArray(data?.donations) ? data.donations : [])
      setSummary(data?.summary || {})
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
    loadDonations()
  }, [API, token])

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target

    if (type === 'file') {
      setForm((prev) => ({
        ...prev,
        [name]: files?.[0] || null,
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setEditingDonationId('')
    setForm(emptyForm)
  }

  const startEdit = (donation) => {
    setEditingDonationId(donation._id)

    setForm({
      project: donation.project?._id || donation.project || '',
      fundCategoryName: donation.fundCategoryName || 'General Donation',
      donorName: donation.donorName || '',
      phone: donation.phone || '',
      email: donation.email || '',
      amount: donation.amount || '',
      paymentMethod: donation.paymentMethod || 'bkash',
      transactionId: donation.transactionId || '',
      status: donation.status || 'pending',
      note: donation.note || '',
      adminNote: donation.adminNote || '',
      isAnonymous: Boolean(donation.isAnonymous),
      proofImage: null,
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const submitDonation = async (e) => {
    e.preventDefault()

    if (!token) {
      alert('Please login first.')
      return
    }

    if (!form.donorName.trim() || !form.phone.trim() || form.amount === '') {
      alert('Donor name, phone and amount are required.')
      return
    }

    try {
      setFormLoading(true)

      const formData = new FormData()

      formData.append('project', form.project)
      formData.append('fundCategoryName', form.fundCategoryName)
      formData.append('donorName', form.donorName)
      formData.append('phone', form.phone)
      formData.append('email', form.email)
      formData.append('amount', form.amount)
      formData.append('paymentMethod', form.paymentMethod)
      formData.append('transactionId', form.transactionId)
      formData.append('status', form.status)
      formData.append('note', form.note)
      formData.append('adminNote', form.adminNote)
      formData.append('isAnonymous', form.isAnonymous ? 'true' : 'false')

      if (form.proofImage) {
        formData.append('proofImage', form.proofImage)
      }

      const url = editingDonationId
        ? `${API}/api/donations/admin/${editingDonationId}`
        : `${API}/api/donations/admin/create`

      const res = await fetch(url, {
        method: editingDonationId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Donation save failed.')
      }

      alert(data.message || 'Donation saved successfully.')
      resetForm()
      await loadDonations()
      await loadProjects()
    } catch (error) {
      alert(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const verifyDonation = async (donationId) => {
    const confirmed = window.confirm('Verify this donation and update project fund?')

    if (!confirmed) return

    const adminNote = window.prompt('Admin note optional:', '') || ''

    try {
      setActionLoadingId(`verify-${donationId}`)

      const res = await fetch(`${API}/api/donations/admin/${donationId}/verify`, {
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
        throw new Error(data?.message || 'Donation verify failed.')
      }

      alert(data.message || 'Donation verified successfully.')
      await loadDonations()
      await loadProjects()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const rejectDonation = async (donationId) => {
    const adminNote = window.prompt('Write rejection note:', '')

    if (adminNote === null) return

    const confirmed = window.confirm('Reject this donation?')

    if (!confirmed) return

    try {
      setActionLoadingId(`reject-${donationId}`)

      const res = await fetch(`${API}/api/donations/admin/${donationId}/reject`, {
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
        throw new Error(data?.message || 'Donation reject failed.')
      }

      alert(data.message || 'Donation rejected successfully.')
      await loadDonations()
      await loadProjects()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const deleteDonation = async (donationId) => {
    const confirmed = window.confirm('Delete this donation permanently?')

    if (!confirmed) return

    try {
      setActionLoadingId(`delete-${donationId}`)

      const res = await fetch(`${API}/api/donations/admin/${donationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Donation delete failed.')
      }

      alert(data.message || 'Donation deleted successfully.')
      await loadDonations()
      await loadProjects()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  return (
    <section className="mt-4 grid gap-4">
      {selectedImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-4xl rounded-[28px] bg-white p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedImage('')}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white"
            >
              <X size={18} />
            </button>

            <img
              src={selectedImage}
              alt="Donation proof"
              className="max-h-[80vh] w-full rounded-[20px] object-contain"
            />
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-500 sm:text-[11px]">
              Donation Management
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
              Donations Control
            </h2>

            <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
              Add, verify, reject, edit and manage project-wise donations.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDonations}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg disabled:opacity-60"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-xl font-black text-slate-950">{summary.total || donations.length}</p>
            <p className="text-[10px] font-bold text-slate-500">Total</p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-center">
            <p className="text-xl font-black text-amber-700">{summary.pending || 0}</p>
            <p className="text-[10px] font-bold text-amber-600">Pending</p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <p className="text-xl font-black text-emerald-700">{summary.verified || 0}</p>
            <p className="text-[10px] font-bold text-emerald-600">Verified</p>
          </div>

          <div className="rounded-2xl bg-rose-50 p-3 text-center">
            <p className="text-xl font-black text-rose-700">{summary.rejected || 0}</p>
            <p className="text-[10px] font-bold text-rose-600">Rejected</p>
          </div>

          <div className="rounded-2xl bg-cyan-50 p-3 text-center">
            <p className="truncate text-lg font-black text-cyan-700">
              {money(summary.verifiedAmount || totals.verifiedAmount)}
            </p>
            <p className="text-[10px] font-bold text-cyan-600">Verified Amount</p>
          </div>

          <div className="rounded-2xl bg-violet-50 p-3 text-center">
            <p className="truncate text-lg font-black text-violet-700">
              {money(summary.pendingAmount || totals.pendingAmount)}
            </p>
            <p className="text-[10px] font-bold text-violet-600">Pending Amount</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={submitDonation}
        className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-500">
              {editingDonationId ? 'Edit Donation' : 'Manual Donation'}
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              {editingDonationId ? 'Update Donation Information' : 'Add New Donation'}
            </h3>
          </div>

          {editingDonationId && (
            <button
              type="button"
              onClick={resetForm}
              className="h-10 rounded-2xl bg-slate-100 px-4 text-xs font-black text-slate-700"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <select
            name="project"
            value={form.project}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">No project / General fund</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="fundCategoryName"
            placeholder="Fund category"
            value={form.fundCategoryName}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <input
            type="text"
            name="donorName"
            placeholder="Donor name"
            value={form.donorName}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <input
            type="email"
            name="email"
            placeholder="Email optional"
            value={form.email}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            name="transactionId"
            placeholder="Transaction ID"
            value={form.transactionId}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-700">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={form.isAnonymous}
              onChange={handleFormChange}
              className="h-5 w-5 rounded border-slate-300"
            />
            Anonymous donor
          </label>

          <input
            type="text"
            name="note"
            placeholder="Donor note"
            value={form.note}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:col-span-2"
          />

          <textarea
            name="adminNote"
            placeholder="Admin note"
            value={form.adminNote}
            onChange={handleFormChange}
            rows="3"
            className="rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:col-span-2"
          />

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-black text-emerald-700 md:col-span-2">
            <ImageIcon size={18} />
            {form.proofImage ? form.proofImage.name : 'Upload donation proof image'}
            <input
              type="file"
              name="proofImage"
              accept="image/*"
              onChange={handleFormChange}
              className="hidden"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={formLoading}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-sm font-black text-white shadow-lg disabled:opacity-60"
        >
          {editingDonationId ? <CheckCircle2 size={17} /> : <Plus size={17} />}
          {formLoading
            ? 'Saving...'
            : editingDonationId
              ? 'Update Donation'
              : 'Add Donation'}
        </button>
      </form>

      <div className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            loadDonations()
          }}
          className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_150px_190px_150px] xl:grid-cols-[1fr_140px_220px_140px_150px_150px_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              name="search"
              placeholder="Search donor, phone, transaction, project"
              value={filters.search}
              onChange={handleFilterChange}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none"
            />
          </div>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          >
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            name="project"
            value={filters.project}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>

          <select
            name="paymentMethod"
            value={filters.paymentMethod}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          >
            <option value="all">All method</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          />

          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
          >
            Search
          </button>
        </form>

        <div className="mt-5 grid gap-4">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
              Loading donations...
            </div>
          ) : donations.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
              No donation found.
            </div>
          ) : (
            donations.map((donation) => (
              <div
                key={donation._id}
                className="grid gap-4 rounded-[26px] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm xl:grid-cols-[110px_1fr_230px]"
              >
                <button
                  type="button"
                  onClick={() => donation.proofImage && setSelectedImage(donation.proofImage)}
                  className="relative h-24 w-24 overflow-hidden rounded-[24px] bg-emerald-100 shadow-lg"
                >
                  {donation.proofImage ? (
                    <img
                      src={donation.proofImage}
                      alt="Donation proof"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-emerald-600">
                      <HeartHandshake size={32} />
                    </div>
                  )}

                  {donation.proofImage && (
                    <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/80 text-white">
                      <Eye size={15} />
                    </span>
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-950 sm:text-xl">
                      {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                        donation.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700'
                          : donation.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {donation.status}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
                      {donation.paymentMethod}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                    <p className="flex items-center gap-2">
                      <Phone size={15} />
                      {donation.phone}
                    </p>

                    <p className="flex items-center gap-2">
                      <HeartHandshake size={15} />
                      {money(donation.amount)}
                    </p>

                    <p className="flex items-center gap-2">
                      <CalendarDays size={15} />
                      {formatDate(donation.createdAt)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-400">
                        Project
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {donation.projectTitle || donation.project?.title || 'General Fund'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-400">
                        Category
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {donation.fundCategoryName || 'General Donation'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-400">
                        Transaction
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {donation.transactionId || 'Not added'}
                      </p>
                    </div>
                  </div>

                  {(donation.note || donation.adminNote) && (
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/80 p-3">
                      {donation.note && (
                        <p className="text-xs font-bold text-slate-600">
                          Note: {donation.note}
                        </p>
                      )}

                      {donation.adminNote && (
                        <p className="mt-1 text-xs font-bold text-slate-600">
                          Admin: {donation.adminNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid content-start gap-2 rounded-[24px] bg-white p-3">
                  {donation.status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => verifyDonation(donation._id)}
                      disabled={actionLoadingId === `verify-${donation._id}`}
                      className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <BadgeCheck size={15} />
                      Verify
                    </button>
                  )}

                  {donation.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => rejectDonation(donation._id)}
                      disabled={actionLoadingId === `reject-${donation._id}`}
                      className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-3 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      <XCircle size={15} />
                      Reject
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startEdit(donation)}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-xs font-black text-blue-700 hover:bg-blue-100"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteDonation(donation._id)}
                    disabled={actionLoadingId === `delete-${donation._id}`}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}