import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'

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

function cleanPhoneForCall(phone) {
  return String(phone || '').replace(/[^\d+]/g, '')
}

function getWhatsAppLink(phone) {
  const cleanPhone = String(phone || '').replace(/[^\d]/g, '')

  if (!cleanPhone) return '#'

  if (cleanPhone.startsWith('880')) {
    return `https://wa.me/${cleanPhone}`
  }

  if (cleanPhone.startsWith('0')) {
    return `https://wa.me/88${cleanPhone}`
  }

  return `https://wa.me/${cleanPhone}`
}

export default function VolunteersPage({ API, token }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [selectedImage, setSelectedImage] = useState({
    src: '',
    label: '',
  })

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sort: 'newest',
  })

  const pendingCount = applications.filter((item) => item.status === 'pending').length
  const approvedCount = applications.filter((item) => item.status === 'approved').length
  const rejectedCount = applications.filter((item) => item.status === 'rejected').length

  const filteredApplications = useMemo(() => {
    let result = [...applications]

    if (filters.status !== 'all') {
      result = result.filter((item) => item.status === filters.status)
    }

    if (filters.search.trim()) {
      const keyword = filters.search.trim().toLowerCase()

      result = result.filter((item) => {
        const name = String(item.name || '').toLowerCase()
        const phone = String(item.phone || '').toLowerCase()
        const district = String(item.district || '').toLowerCase()
        const note = String(item.note || '').toLowerCase()
        const adminNote = String(item.adminNote || '').toLowerCase()

        return (
          name.includes(keyword) ||
          phone.includes(keyword) ||
          district.includes(keyword) ||
          note.includes(keyword) ||
          adminNote.includes(keyword)
        )
      })
    }

    if (filters.sort === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    }

    if (filters.sort === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }

    if (filters.sort === 'pending-first') {
      const statusOrder = {
        pending: 1,
        approved: 2,
        rejected: 3,
      }

      result.sort((a, b) => {
        const statusCompare = (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9)

        if (statusCompare !== 0) return statusCompare

        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })
    }

    return result
  }, [applications, filters])

  const loadApplications = async () => {
    if (!token) return

    try {
      setLoading(true)

      const res = await fetch(`${API}/api/volunteers/admin/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load volunteer applications.')
      }

      setApplications(Array.isArray(data?.applications) ? data.applications : [])
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [API, token])

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleStatusFilter = (status) => {
    setFilters((prev) => ({
      ...prev,
      status,
    }))
  }

  const handleApprove = async (applicationId) => {
    const confirmApprove = window.confirm('Approve this volunteer application?')

    if (!confirmApprove) return

    const adminNote = window.prompt('Admin note optional:', '') || ''

    try {
      setActionLoadingId(applicationId)

      const res = await fetch(`${API}/api/volunteers/admin/${applicationId}/approve`, {
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
        throw new Error(data?.message || 'Volunteer approval failed.')
      }

      alert(data.message || 'Volunteer application approved successfully.')
      await loadApplications()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const handleReject = async (applicationId) => {
    const adminNote = window.prompt('Write rejection note:', '')

    if (adminNote === null) return

    const confirmReject = window.confirm('Reject this volunteer application?')

    if (!confirmReject) return

    try {
      setActionLoadingId(applicationId)

      const res = await fetch(`${API}/api/volunteers/admin/${applicationId}/reject`, {
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
        throw new Error(data?.message || 'Volunteer rejection failed.')
      }

      alert(data.message || 'Volunteer application rejected successfully.')
      await loadApplications()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const openImage = (src, label) => {
    if (!src) return

    setSelectedImage({
      src,
      label,
    })
  }

  const ImageButton = ({ src, label }) => (
    <button
      type="button"
      onClick={() => openImage(src, label)}
      className="group relative overflow-hidden rounded-[22px] border border-violet-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="h-28 w-full bg-violet-50 sm:h-32">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-violet-500">
            <ImageIcon size={28} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs font-black text-slate-700">{label}</span>

        <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-white">
          <Eye size={13} />
        </span>
      </div>
    </button>
  )

  const StatusButton = ({ status, label, count, tone }) => {
    const isActive = filters.status === status

    const toneClass =
      tone === 'amber'
        ? isActive
          ? 'bg-amber-100 ring-2 ring-amber-300'
          : 'bg-amber-50'
        : tone === 'emerald'
          ? isActive
            ? 'bg-emerald-100 ring-2 ring-emerald-300'
            : 'bg-emerald-50'
          : tone === 'rose'
            ? isActive
              ? 'bg-rose-100 ring-2 ring-rose-300'
              : 'bg-rose-50'
            : isActive
              ? 'bg-slate-950 text-white ring-2 ring-slate-300'
              : 'bg-slate-50 text-slate-700'

    const numberClass =
      tone === 'amber'
        ? 'text-amber-700'
        : tone === 'emerald'
          ? 'text-emerald-700'
          : tone === 'rose'
            ? 'text-rose-700'
            : isActive
              ? 'text-white'
              : 'text-slate-950'

    const labelClass =
      tone === 'amber'
        ? 'text-amber-600'
        : tone === 'emerald'
          ? 'text-emerald-600'
          : tone === 'rose'
            ? 'text-rose-600'
            : isActive
              ? 'text-white/80'
              : 'text-slate-500'

    return (
      <button
        type="button"
        onClick={() => handleStatusFilter(status)}
        className={`rounded-2xl p-3 text-center transition sm:p-4 ${toneClass}`}
      >
        <p className={`text-xl font-black sm:text-2xl ${numberClass}`}>{count}</p>
        <p className={`text-[10px] font-bold sm:text-xs ${labelClass}`}>{label}</p>
      </button>
    )
  }

  return (
    <section className="mt-4 rounded-[28px] border border-violet-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
      {selectedImage.src && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white p-3 shadow-2xl sm:rounded-[30px] sm:p-4">
            <button
              type="button"
              onClick={() =>
                setSelectedImage({
                  src: '',
                  label: '',
                })
              }
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white sm:h-10 sm:w-10"
            >
              <X size={18} />
            </button>

            <div className="mb-3 flex items-center justify-between gap-3 pr-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">
                  Preview
                </p>
                <h3 className="text-lg font-black text-slate-950">{selectedImage.label}</h3>
              </div>
            </div>

            <img
              src={selectedImage.src}
              alt={selectedImage.label || 'Volunteer document'}
              className="max-h-[78vh] w-full rounded-[20px] object-contain sm:rounded-[22px]"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-500 sm:text-[11px]">
            Volunteer Approval
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
            Volunteer Applications
          </h2>

          <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
            Review photo, NID documents, district and approve or reject volunteer applications.
          </p>
        </div>

        <button
          type="button"
          onClick={loadApplications}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-black text-white disabled:opacity-60"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatusButton status="all" label="Total" count={applications.length} tone="slate" />
        <StatusButton status="pending" label="Pending" count={pendingCount} tone="amber" />
        <StatusButton status="approved" label="Approved" count={approvedCount} tone="emerald" />
        <StatusButton status="rejected" label="Rejected" count={rejectedCount} tone="rose" />
      </div>

      <div className="mt-5 grid gap-3 rounded-[24px] border border-violet-100 bg-violet-50/40 p-3 md:grid-cols-[1fr_190px]">
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            name="search"
            placeholder="Search name, phone, district or note"
            value={filters.search}
            onChange={handleFilterChange}
            className="h-12 w-full rounded-2xl border border-violet-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <select
          name="sort"
          value={filters.sort}
          onChange={handleFilterChange}
          className="h-12 rounded-2xl border border-violet-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="pending-first">Pending first</option>
        </select>
      </div>

      <div className="mt-5 grid gap-4">
        {loading ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
            Loading volunteer applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
            No volunteer application found.
          </div>
        ) : (
          filteredApplications.map((application) => (
            <div
              key={application._id}
              className="grid gap-4 rounded-[26px] border border-violet-100 bg-gradient-to-br from-white via-violet-50/40 to-white p-4 shadow-sm lg:grid-cols-[1fr_270px]"
            >
              <div className="min-w-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-violet-600 text-xl font-black text-white">
                      {application.photo ? (
                        <img
                          src={application.photo}
                          alt={application.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        application.name?.charAt(0)?.toUpperCase() || 'V'
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-950 sm:text-xl">
                          {application.name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                            application.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : application.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {application.status}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2 sm:text-sm">
                        <p className="flex items-center gap-2">
                          <Phone size={15} />
                          {application.phone}
                        </p>

                        <p className="flex items-center gap-2">
                          <MapPin size={15} />
                          {application.district || 'No district'}
                        </p>

                        <p className="flex items-center gap-2">
                          <CalendarDays size={15} />
                          {formatDate(application.createdAt)}
                        </p>

                        <p className="flex items-center gap-2">
                          <UserRound size={15} />
                          Volunteer Request
                        </p>
                      </div>
                    </div>
                  </div>

                  {application.status === 'approved' && (
                    <div className="flex w-max items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                      <BadgeCheck size={15} />
                      Approved
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <a
                    href={`tel:${cleanPhoneForCall(application.phone)}`}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-xs font-black text-white transition hover:-translate-y-0.5"
                  >
                    <Phone size={15} />
                    Call
                  </a>

                  <a
                    href={getWhatsAppLink(application.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-black text-white transition hover:-translate-y-0.5"
                  >
                    WhatsApp
                  </a>
                </div>

                <div className="mt-4 rounded-2xl border border-violet-100 bg-white/85 p-3 sm:p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-400 sm:text-[10px]">
                    Applicant Note
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-700 sm:text-sm sm:leading-6">
                    {application.note || 'No note added'}
                  </p>
                </div>

                {application.adminNote && (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
                      Admin Note
                    </p>

                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-700 sm:text-sm sm:leading-6">
                      {application.adminNote}
                    </p>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ImageButton src={application.photo} label="Photo" />
                  <ImageButton src={application.nidFront} label="NID Front" />
                  <ImageButton src={application.nidBack} label="NID Back" />
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:justify-between">
                <div className="grid gap-3">
                  <div className="rounded-[22px] bg-white p-4 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
                      Request Date
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-900">
                      {formatDate(application.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-[22px] bg-white p-4 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
                      Current Status
                    </p>

                    <p
                      className={`mt-2 text-sm font-black capitalize ${
                        application.status === 'approved'
                          ? 'text-emerald-700'
                          : application.status === 'rejected'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {application.status}
                    </p>
                  </div>
                </div>

                {application.status === 'pending' ? (
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                    <button
                      type="button"
                      onClick={() => handleApprove(application._id)}
                      disabled={actionLoadingId === application._id}
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 sm:text-sm"
                    >
                      <CheckCircle2 size={16} />
                      {actionLoadingId === application._id ? 'Working...' : 'Approve'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(application._id)}
                      disabled={actionLoadingId === application._id}
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 sm:text-sm"
                    >
                      <XCircle size={16} />
                      {actionLoadingId === application._id ? 'Working...' : 'Reject'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-100 p-4 text-center text-sm font-black capitalize text-slate-600">
                    Already {application.status}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}