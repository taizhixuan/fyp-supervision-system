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
  Sparkles,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { useAdminUsers, useUpdateUser, useBulkUpdateUserStatus } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { UserRole, UserStatus } from '@/types'

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
  BLOCKED: { label: 'Blocked', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-stone-200' },
}

export function UserManagement() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const { data, isLoading } = useAdminUsers({
    role: roleFilter !== 'ALL' ? roleFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    search: searchQuery || undefined,
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
      setSelectedUsers(new Set(data.users.map((u) => u.userId)))
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
    active: data?.users.filter((u) => u.status === 'ACTIVE').length ?? 0,
    pending: data?.users.filter((u) => u.status === 'PENDING').length ?? 0,
    suspended: data?.users.filter((u) => u.status === 'SUSPENDED').length ?? 0,
  }

  const allSelected = data?.users && data.users.length > 0 && selectedUsers.size === data.users.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-xl overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl ring-1 ring-amber-500/30 flex items-center justify-center">
              <Users className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                User Management
                <Sparkles className="h-5 w-5 text-amber-400" />
              </h1>
              <p className="text-stone-300 mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>
          </div>
          <Link to={ROUTES.ADMIN.USER_NEW}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white border-none">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors border-l-4 border-l-amber-500',
            statusFilter === 'ALL' ? 'ring-2 ring-amber-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter('ALL')}
        >
          <p className="text-sm text-neutral-500">Total Users</p>
          <p className="text-2xl font-bold text-amber-700">{stats.total}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors border-l-4 border-l-emerald-500',
            statusFilter === 'ACTIVE' ? 'ring-2 ring-emerald-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        >
          <p className="text-sm text-neutral-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors border-l-4 border-l-sky-500',
            statusFilter === 'PENDING' ? 'ring-2 ring-sky-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
        >
          <p className="text-sm text-neutral-500">Pending</p>
          <p className="text-2xl font-bold text-sky-600">{stats.pending}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors border-l-4 border-l-orange-500',
            statusFilter === 'SUSPENDED' ? 'ring-2 ring-orange-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'SUSPENDED' ? 'ALL' : 'SUSPENDED')}
        >
          <p className="text-sm text-neutral-500">Suspended</p>
          <p className="text-2xl font-bold text-orange-600">{stats.suspended}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="SUPERVISOR">Supervisors</option>
            <option value="FYP_COMMITTEE">Committee</option>
            <option value="SYSTEM_ADMIN">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedUsers.size > 0 && (
        <Card className="p-3 bg-primary-50 border-primary-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-sm font-medium text-primary-900">
              {selectedUsers.size} user(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkAction('ACTIVE')}
                disabled={bulkMutation.isPending}
              >
                {bulkMutation.isPending ? (
                  <Spinner size="sm" className="mr-1" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Activate
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="text-warning-600 border-warning-300 hover:bg-warning-50"
                onClick={() => handleBulkAction('SUSPENDED')}
                disabled={bulkMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Suspend
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedUsers(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Select All + Users List */}
      <div className="flex flex-col gap-4">
        {data?.users && data.users.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              checked={!!allSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-500">
              {allSelected ? 'Deselect all' : 'Select all'}
            </span>
          </div>
        )}

        {data?.users && data.users.length > 0 ? (
          data.users.map((user) => {
            const role = roleConfig[user.role]
            const status = statusConfig[user.status]

            return (
              <Card
                key={user.userId}
                className="p-4 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.userId)}
                    onChange={() => toggleSelectUser(user.userId)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                  />

                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                      user.isLocked ? 'bg-error-100' : 'bg-primary-100'
                    )}
                  >
                    {user.isLocked ? (
                      <Lock className="h-6 w-6 text-error-600" />
                    ) : (
                      <span className="text-lg font-semibold text-primary-600">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Content (clickable for navigation) */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(ROUTES.ADMIN.USER_DETAIL.replace(':id', user.userId))}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{user.fullName}</h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded-xl text-xs font-medium border',
                        role.bgColor,
                        role.color,
                        role.borderColor
                      )}>
                        {role.label}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-xl text-xs font-medium border',
                        status.bgColor,
                        status.color,
                        status.borderColor
                      )}>
                        {status.label}
                      </span>
                      {user.department && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 border border-stone-200 rounded-xl text-xs">
                          {user.department}
                        </span>
                      )}
                      {user.isLocked && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                      {user.lastLoginAt && (
                        <span>
                          Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {user.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Approve"
                        onClick={() => handleQuickStatusChange(user.userId, 'ACTIVE', user.fullName)}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 text-success-600" />
                      </Button>
                    )}
                    {user.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Suspend"
                        onClick={() => handleQuickStatusChange(user.userId, 'SUSPENDED', user.fullName)}
                        disabled={updateMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 text-warning-600" />
                      </Button>
                    )}
                    {user.status === 'SUSPENDED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Reactivate"
                        onClick={() => handleQuickStatusChange(user.userId, 'ACTIVE', user.fullName)}
                        disabled={updateMutation.isPending}
                      >
                        <Unlock className="h-4 w-4 text-info-600" />
                      </Button>
                    )}
                    <button
                      type="button"
                      className="p-1 text-neutral-400 hover:text-neutral-600"
                      onClick={() => navigate(ROUTES.ADMIN.USER_DETAIL.replace(':id', user.userId))}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No users found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Create your first user to get started'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.users.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {data.users.length} of {data.total} users
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
