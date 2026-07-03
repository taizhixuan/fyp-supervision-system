import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  Mail,
  Clock,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { useAdminUsers, useUpdateUser, useBulkUpdateUserStatus, useFYPCycles } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { avatarInitial } from '@/lib/utils/name'
import type { AdminUserListItem, UserRole, UserStatus } from '@/types'

const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string; borderColor: string }> = {
  STUDENT: { label: 'Student', color: 'text-sky-700', bgColor: 'bg-sky-100', borderColor: 'border-sky-200' },
  SUPERVISOR: { label: 'Supervisor', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200' },
  FYP_COMMITTEE: { label: 'Committee', color: 'text-violet-700', bgColor: 'bg-violet-100', borderColor: 'border-violet-200' },
  SYSTEM_ADMIN: { label: 'Admin', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200' },
}

const statusConfig: Record<UserStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200' },
  PENDING: { label: 'Pending', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' },
  SUSPENDED: { label: 'Suspended', color: 'text-rose-700', bgColor: 'bg-rose-100', borderColor: 'border-rose-200' },
  BLOCKED: { label: 'Deleted', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-stone-200' },
}

export function UserManagement() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL')
  const [cycleFilter, setCycleFilter] = useState<number | 'ALL'>('ALL')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Cycle list for the filter dropdown — only active/planning shown; backend
  // filter `?cycleId=N` is student-only (other roles don't enrol in a cycle),
  // so the dropdown is hidden unless the role filter is ALL or STUDENT.
  const { data: cyclesData } = useFYPCycles({})
  const showCycleFilter = roleFilter === 'ALL' || roleFilter === 'STUDENT'

  const { data, isLoading } = useAdminUsers({
    role: showCycleFilter && cycleFilter !== 'ALL' ? 'STUDENT' : roleFilter !== 'ALL' ? roleFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    search: searchQuery || undefined,
    cycleId: showCycleFilter && cycleFilter !== 'ALL' ? (cycleFilter as number) : undefined,
  })

  const updateMutation = useUpdateUser()
  const bulkMutation = useBulkUpdateUserStatus()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data?.users) return
    if (selectedUsers.size === data.users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(data.users.map((u: AdminUserListItem) => u.userId)))
    }
  }

  const handleQuickStatusChange = async (userId: string, status: UserStatus, name: string) => {
    try {
      await updateMutation.mutateAsync({ userId, data: { status } })
      const label = status === 'ACTIVE' ? 'activated' : status === 'SUSPENDED' ? 'suspended' : status
      successToast('Status Updated', `${name}'s account has been ${label}.`)
    } catch (error) {
      errorToast('Update Failed', 'Could not update the account status.')
    }
  }

  const handleBulkAction = async (status: UserStatus) => {
    try {
      await bulkMutation.mutateAsync({ userIds: Array.from(selectedUsers), status })
      const label = status === 'ACTIVE' ? 'activated' : 'suspended'
      successToast('Bulk Update Complete', `${selectedUsers.size} account(s) have been ${label}.`)
      setSelectedUsers(new Set())
    } catch (error) {
      errorToast('Bulk Update Failed', 'Could not update the selected accounts.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const stats = {
    total: data?.users.length ?? 0,
    active: data?.users.filter((u: AdminUserListItem) => u.status === 'ACTIVE').length ?? 0,
    pending: data?.users.filter((u: AdminUserListItem) => u.status === 'PENDING').length ?? 0,
    suspended: data?.users.filter((u: AdminUserListItem) => u.status === 'SUSPENDED').length ?? 0,
  }

  const allSelected = data?.users && data.users.length > 0 && selectedUsers.size === data.users.length

  const statusChips: { key: UserStatus | 'ALL'; label: string; value: number; tone: string }[] = [
    { key: 'ALL', label: 'Total', value: stats.total, tone: 'amber' },
    { key: 'ACTIVE', label: 'Active', value: stats.active, tone: 'emerald' },
    { key: 'PENDING', label: 'Pending', value: stats.pending, tone: 'sky' },
    { key: 'SUSPENDED', label: 'Suspended', value: stats.suspended, tone: 'orange' },
  ]

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero with inline stat chips */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">User Management</h1>
              <p className="text-stone-300 text-xs">Manage user accounts, roles, and permissions</p>
            </div>
          </div>
          <Link to={ROUTES.ADMIN.USER_NEW}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-none">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create User
            </Button>
          </Link>
        </div>

        {/* Stat chips inline */}
        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {statusChips.map((chip) => {
            const active = statusFilter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key === statusFilter && chip.key !== 'ALL' ? 'ALL' : chip.key)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 ring-1 transition-colors text-left',
                  active ? 'bg-amber-500/30 ring-amber-300/50' : 'bg-stone-700/40 ring-stone-600/40 hover:bg-stone-700/60'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold leading-none">{chip.value}</div>
                  <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{chip.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters — compact */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
            className="px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="SUPERVISOR">Supervisors</option>
            <option value="FYP_COMMITTEE">Committee</option>
            <option value="SYSTEM_ADMIN">Admins</option>
          </select>
          {showCycleFilter && (
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
              title="Filter students by their FYP cycle"
            >
              <option value="ALL">All Cycles</option>
              {(cyclesData?.cycles ?? []).map((c) => (
                <option key={c.cycleId} value={c.cycleId}>
                  {c.cycleCode} ({c.type}) — {c.status}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'ALL')}
            className="px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Deleted</option>
          </select>
        </div>
      </Card>

      {/* Bulk Action Bar */}
      {selectedUsers.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 rounded-md border border-amber-200 bg-amber-50">
          <span className="text-sm font-medium text-amber-900">
            {selectedUsers.size} user(s) selected
          </span>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handleBulkAction('ACTIVE')} disabled={bulkMutation.isPending}>
              {bulkMutation.isPending ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              )}
              Activate
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
              onClick={() => handleBulkAction('SUSPENDED')}
              disabled={bulkMutation.isPending}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Suspend
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedUsers(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Select all toggle */}
      {data?.users && data.users.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={!!allSelected}
            onChange={toggleSelectAll}
            className="h-3.5 w-3.5 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-xs text-neutral-500">
            {allSelected ? 'Deselect all' : 'Select all'}
          </span>
        </div>
      )}

      {/* Users grid */}
      {data?.users && data.users.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {data.users.map((user: AdminUserListItem) => {
            const role = roleConfig[user.role]
            const status = statusConfig[user.status]

            return (
              <Card key={user.userId} padding="sm" className="hover:shadow-md transition-all">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.userId)}
                    onChange={() => toggleSelectUser(user.userId)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                  />

                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                      user.isLocked ? 'bg-rose-100' : 'bg-amber-100'
                    )}
                  >
                    {user.isLocked ? (
                      <Lock className="h-4 w-4 text-rose-600" />
                    ) : (
                      <span className="text-sm font-bold text-amber-700">
                        {avatarInitial(user.fullName)}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(ROUTES.ADMIN.USER_DETAIL.replace(':id', user.userId))}
                  >
                    <h3 className="text-sm font-semibold text-neutral-900 leading-tight truncate">{user.fullName}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-500 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                        role.bgColor, role.color, role.borderColor
                      )}>
                        {role.label}
                      </span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                        status.bgColor, status.color, status.borderColor
                      )}>
                        {status.label}
                      </span>
                      {user.department && (
                        <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 border border-stone-200 rounded text-[10px]">
                          {user.department}
                        </span>
                      )}
                      {user.isLocked && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-medium flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" />
                          Deleted
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                      {user.lastLoginAt && (
                        <span>· last: {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {user.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Approve"
                        onClick={() => handleQuickStatusChange(user.userId, 'ACTIVE', user.fullName)}
                        disabled={updateMutation.isPending}
                        className="px-1.5"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    {user.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Suspend"
                        onClick={() => handleQuickStatusChange(user.userId, 'SUSPENDED', user.fullName)}
                        disabled={updateMutation.isPending}
                        className="px-1.5"
                      >
                        <XCircle className="h-4 w-4 text-amber-600" />
                      </Button>
                    )}
                    {user.status === 'SUSPENDED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Reactivate"
                        onClick={() => handleQuickStatusChange(user.userId, 'ACTIVE', user.fullName)}
                        disabled={updateMutation.isPending}
                        className="px-1.5"
                      >
                        <Unlock className="h-4 w-4 text-sky-600" />
                      </Button>
                    )}
                    <button
                      type="button"
                      className="p-0.5 text-neutral-400 hover:text-neutral-600"
                      onClick={() => navigate(ROUTES.ADMIN.USER_DETAIL.replace(':id', user.userId))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <Users className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-medium text-neutral-900 text-sm">No users found</h3>
          <p className="text-xs text-neutral-500 mt-1">
            {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Create your first user to get started'}
          </p>
        </Card>
      )}

      {/* Summary */}
      {data && data.users.length > 0 && (
        <div className="text-xs text-neutral-500 px-1">
          Showing {data.users.length} of {data.total} users
        </div>
      )}
    </div>
  )
}
