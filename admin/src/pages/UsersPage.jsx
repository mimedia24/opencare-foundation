import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Ban,
  Droplets,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserRound,
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

function getInitial(name) {
  return name?.charAt(0)?.toUpperCase() || 'U'
}

export default function UsersPage({ API, token }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    bloodDonor: 'all',
    volunteerStatus: 'all',
  })

  const totals = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => !user.isBanned).length,
      banned: users.filter((user) => user.isBanned).length,
      admins: users.filter((user) => user.role === 'admin').length,
      donors: users.filter((user) => user.isBloodDonor).length,
      volunteers: users.filter((user) => user.isVolunteer).length,
    }
  }, [users])

  const buildQuery = () => {
    const params = new URLSearchParams()

    if (filters.search.trim()) params.append('search', filters.search.trim())
    if (filters.role !== 'all') params.append('role', filters.role)
    if (filters.status !== 'all') params.append('status', filters.status)
    if (filters.bloodDonor !== 'all') params.append('bloodDonor', filters.bloodDonor)

    if (filters.volunteerStatus !== 'all') {
      params.append('volunteerStatus', filters.volunteerStatus)
    }

    return params.toString()
  }

  const loadUsers = async () => {
    if (!token) return

    try {
      setLoading(true)

      const query = buildQuery()
      const res = await fetch(`${API}/api/users/admin/all${query ? `?${query}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load users.')
      }

      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [API, token])

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadUsers()
  }

  const runUserAction = async ({ userId, endpoint, method = 'PUT', body, confirmMessage }) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    if (confirmMessage) {
      const confirmed = window.confirm(confirmMessage)

      if (!confirmed) return
    }

    try {
      setActionLoadingId(`${endpoint}-${userId}`)

      const res = await fetch(`${API}/api/users/admin/${userId}/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Action failed.')
      }

      alert(data.message || 'Action completed successfully.')
      await loadUsers()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const handleBan = (userId) => {
    const reason = window.prompt('Ban reason optional:', '') || ''

    runUserAction({
      userId,
      endpoint: 'ban',
      body: { reason },
      confirmMessage: 'Ban this user?',
    })
  }

  const handleUnban = (userId) => {
    runUserAction({
      userId,
      endpoint: 'unban',
      confirmMessage: 'Unban this user?',
    })
  }

  const handleRemoveVolunteer = (userId) => {
    runUserAction({
      userId,
      endpoint: 'remove-volunteer',
      confirmMessage: 'Remove this user from volunteer list?',
    })
  }

  const handleRestoreVolunteer = (userId) => {
    runUserAction({
      userId,
      endpoint: 'restore-volunteer',
      confirmMessage: 'Restore this user as volunteer from previous approved application?',
    })
  }

  const handleRemoveBloodDonor = (userId) => {
    runUserAction({
      userId,
      endpoint: 'remove-blood-donor',
      confirmMessage: 'Remove this user from public blood donor list?',
    })
  }

  const handleRestoreBloodDonor = (userId) => {
    runUserAction({
      userId,
      endpoint: 'restore-blood-donor',
      confirmMessage: 'Restore this user as blood donor with previous history?',
    })
  }

  const handleMakeAdmin = (userId) => {
    runUserAction({
      userId,
      endpoint: 'make-admin',
      confirmMessage: 'Make this user an admin?',
    })
  }

  const handleRemoveAdmin = (userId) => {
    runUserAction({
      userId,
      endpoint: 'remove-admin',
      confirmMessage: 'Remove admin role from this user?',
    })
  }

  const hasBloodDonorHistory = (user) => {
    return Boolean(
      user.bloodGroup ||
        Number(user.totalBloodDonations || 0) > 0 ||
        user.lastBloodDonationDate ||
        user.nextEligibleDate ||
        user.isBloodDonorVerified
    )
  }

  const hasVolunteerHistory = (user) => {
    return Boolean(user.hasVolunteerHistory || user.isVolunteer || user.volunteerStatus === 'approved')
  }

  const getVolunteerText = (user) => {
    if (user.isVolunteer) return 'approved'
    if (hasVolunteerHistory(user)) return 'removed'
    return user.volunteerStatus || 'none'
  }

  const ActionButton = ({ children, onClick, disabled, tone = 'slate' }) => {
    const toneClass =
      tone === 'red'
        ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_10px_24px_rgba(225,29,72,0.20)]'
        : tone === 'green'
          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_10px_24px_rgba(5,150,105,0.20)]'
          : tone === 'violet'
            ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-[0_10px_24px_rgba(124,58,237,0.18)]'
            : tone === 'blue'
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex h-10 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
      >
        {children}
      </button>
    )
  }

  return (
    <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
            User Management
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
            Users Control
          </h2>

          <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
            View users, ban accounts, remove or restore volunteer status and control donor/admin roles.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg disabled:opacity-60"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl bg-slate-50 p-3 text-center">
          <p className="text-xl font-black text-slate-950">{totals.total}</p>
          <p className="text-[10px] font-bold text-slate-500">Total</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-3 text-center">
          <p className="text-xl font-black text-emerald-700">{totals.active}</p>
          <p className="text-[10px] font-bold text-emerald-600">Active</p>
        </div>

        <div className="rounded-2xl bg-rose-50 p-3 text-center">
          <p className="text-xl font-black text-rose-700">{totals.banned}</p>
          <p className="text-[10px] font-bold text-rose-600">Banned</p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-center">
          <p className="text-xl font-black text-blue-700">{totals.admins}</p>
          <p className="text-[10px] font-bold text-blue-600">Admins</p>
        </div>

        <div className="rounded-2xl bg-red-50 p-3 text-center">
          <p className="text-xl font-black text-red-700">{totals.donors}</p>
          <p className="text-[10px] font-bold text-red-600">Donors</p>
        </div>

        <div className="rounded-2xl bg-violet-50 p-3 text-center">
          <p className="text-xl font-black text-violet-700">{totals.volunteers}</p>
          <p className="text-[10px] font-bold text-violet-600">Volunteers</p>
        </div>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="mt-5 grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_150px_150px] xl:grid-cols-[1fr_140px_140px_150px_170px_auto]"
      >
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            name="search"
            placeholder="Search name, phone, email or district"
            value={filters.search}
            onChange={handleFilterChange}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <select
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none"
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>

        <select
          name="bloodDonor"
          value={filters.bloodDonor}
          onChange={handleFilterChange}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none"
        >
          <option value="all">All donor</option>
          <option value="true">Donor</option>
          <option value="false">Not donor</option>
        </select>

        <select
          name="volunteerStatus"
          value={filters.volunteerStatus}
          onChange={handleFilterChange}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none"
        >
          <option value="all">All volunteer</option>
          <option value="none">None</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
        >
          Search
        </button>
      </form>

      <div className="mt-5 grid gap-4">
        {users.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
            No user found.
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className={`rounded-[26px] border p-4 shadow-sm ${
                user.isBanned
                  ? 'border-rose-200 bg-gradient-to-br from-white to-rose-50'
                  : 'border-slate-200 bg-gradient-to-br from-white to-slate-50'
              }`}
            >
              <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[24px] bg-slate-950 text-2xl font-black text-white shadow-lg">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitial(user.name)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-slate-950">{user.name}</h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                            user.role === 'admin'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.role || 'user'}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            user.isBanned
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                        <p className="flex items-center gap-2">
                          <Phone size={15} />
                          {user.phone || 'No phone'}
                        </p>

                        <p className="flex items-center gap-2">
                          <Mail size={15} />
                          {user.email || 'No email'}
                        </p>

                        <p className="flex items-center gap-2">
                          <UserRound size={15} />
                          {user.district || 'No district'}
                        </p>
                      </div>

                      {user.isBanned && (
                        <div className="mt-4 rounded-2xl border border-rose-100 bg-white p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-400">
                            Ban Reason
                          </p>

                          <p className="mt-2 text-sm font-bold text-slate-700">
                            {user.banReason || 'No reason added'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-400">
                        Blood
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {user.isBloodDonor
                          ? user.bloodGroup || 'Yes'
                          : hasBloodDonorHistory(user)
                            ? `Removed ${user.bloodGroup ? `(${user.bloodGroup})` : ''}`
                            : 'No'}
                      </p>

                      <p className="mt-1 text-[11px] font-bold text-slate-500">
                        Given: {Number(user.totalBloodDonations || 0)} time
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-400">
                        Volunteer
                      </p>

                      <p className="mt-1 text-sm font-black capitalize">
                        {getVolunteerText(user)}
                      </p>

                      {hasVolunteerHistory(user) && !user.isVolunteer && (
                        <p className="mt-1 text-[11px] font-bold text-violet-500">
                          Previous approved record found
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-500">
                        Verified
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {user.isBloodDonorVerified ? 'Yes' : 'No'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Joined
                      </p>

                      <p className="mt-1 text-sm font-black">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid content-start gap-2 rounded-[24px] border border-slate-100 bg-white p-3">
                  {user.isBanned ? (
                    <ActionButton
                      tone="red"
                      onClick={() => handleUnban(user._id)}
                      disabled={actionLoadingId === `unban-${user._id}`}
                    >
                      <Ban size={15} />
                      Banned - Unban
                    </ActionButton>
                  ) : (
                    <ActionButton
                      tone="green"
                      onClick={() => handleBan(user._id)}
                      disabled={actionLoadingId === `ban-${user._id}`}
                    >
                      <BadgeCheck size={15} />
                      Active - Ban
                    </ActionButton>
                  )}

                  {user.isVolunteer || user.volunteerStatus === 'pending' || user.volunteerStatus === 'rejected' ? (
                    <ActionButton
                      tone="violet"
                      onClick={() => handleRemoveVolunteer(user._id)}
                      disabled={actionLoadingId === `remove-volunteer-${user._id}`}
                    >
                      <UserMinus size={15} />
                      Remove Volunteer
                    </ActionButton>
                  ) : hasVolunteerHistory(user) ? (
                    <ActionButton
                      tone="green"
                      onClick={() => handleRestoreVolunteer(user._id)}
                      disabled={actionLoadingId === `restore-volunteer-${user._id}`}
                    >
                      <UserCheck size={15} />
                      Restore Volunteer
                    </ActionButton>
                  ) : null}

                  {user.isBloodDonor ? (
                    <ActionButton
                      tone="red"
                      onClick={() => handleRemoveBloodDonor(user._id)}
                      disabled={actionLoadingId === `remove-blood-donor-${user._id}`}
                    >
                      <Droplets size={15} />
                      Remove Blood Donor
                    </ActionButton>
                  ) : hasBloodDonorHistory(user) ? (
                    <ActionButton
                      tone="green"
                      onClick={() => handleRestoreBloodDonor(user._id)}
                      disabled={actionLoadingId === `restore-blood-donor-${user._id}`}
                    >
                      <Droplets size={15} />
                      Restore Blood Donor
                    </ActionButton>
                  ) : null}

                  {user.role === 'admin' ? (
                    <ActionButton
                      tone="slate"
                      onClick={() => handleRemoveAdmin(user._id)}
                      disabled={actionLoadingId === `remove-admin-${user._id}`}
                    >
                      <XCircle size={15} />
                      Remove Admin
                    </ActionButton>
                  ) : (
                    <ActionButton
                      tone="blue"
                      onClick={() => handleMakeAdmin(user._id)}
                      disabled={actionLoadingId === `make-admin-${user._id}`}
                    >
                      <ShieldCheck size={15} />
                      Make Admin
                    </ActionButton>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}