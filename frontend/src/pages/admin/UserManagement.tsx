import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Plus,
  Filter,
  ChevronRight,
  Mail,
  Shield,
  Clock,
  Lock,
  Unlock,
  MoreVertical,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminUsers } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { UserRole, UserStatus } from '@/types'

const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  STUDENT: { label: 'Student', color: 'text-info-600', bgColor: 'bg-info-50' },
  SUPERVISOR: { label: 'Supervisor', color: 'text-accent-600', bgColor: 'bg-accent-50' },
  FYP_COMMITTEE: { label: 'Committee', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  SYSTEM_ADMIN: { label: 'Admin', color: 'text-error-600', bgColor: 'bg-error-50' },
}

const statusConfig: Record<UserStatus, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: 'Active', color: 'text-success-600', bgColor: 'bg-success-50' },
  PENDING: { label: 'Pending', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  SUSPENDED: { label: 'Suspended', color: 'text-error-600', bgColor: 'bg-error-50' },
  BLOCKED: { label: 'Blocked', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
}

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL')

  const { data, isLoading } = useAdminUsers({
    role: roleFilter !== 'ALL' ? roleFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    search: searchQuery || undefined,
  })

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary-600" />
            User Management
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Link to={ROUTES.ADMIN.USER_NEW}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            statusFilter === 'ALL' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter('ALL')}
        >
          <p className="text-sm text-neutral-500">Total Users</p>
          <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            statusFilter === 'ACTIVE' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        >
          <p className="text-sm text-neutral-500">Active</p>
          <p className="text-2xl font-bold text-success-600">{stats.active}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            statusFilter === 'PENDING' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
        >
          <p className="text-sm text-neutral-500">Pending</p>
          <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            statusFilter === 'SUSPENDED' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'SUSPENDED' ? 'ALL' : 'SUSPENDED')}
        >
          <p className="text-sm text-neutral-500">Suspended</p>
          <p className="text-2xl font-bold text-error-600">{stats.suspended}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
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
      </Card>

      {/* Users List */}
      <div className="space-y-3">
        {data?.users && data.users.length > 0 ? (
          data.users.map((user) => {
            const role = roleConfig[user.role]
            const status = statusConfig[user.status]

            return (
              <Link
                key={user.userId}
                to={ROUTES.ADMIN.USER_DETAIL.replace(':id', user.userId)}
              >
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                      user.isLocked ? 'bg-error-100' : 'bg-primary-100'
                    )}>
                      {user.isLocked ? (
                        <Lock className="h-6 w-6 text-error-600" />
                      ) : (
                        <span className="text-lg font-semibold text-primary-600">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{user.fullName}</h3>
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          role.bgColor,
                          role.color
                        )}>
                          {role.label}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          status.bgColor,
                          status.color
                        )}>
                          {status.label}
                        </span>
                        {user.department && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs">
                            {user.department}
                          </span>
                        )}
                        {user.isLocked && (
                          <span className="px-2 py-0.5 bg-error-50 text-error-700 rounded-full text-xs font-medium flex items-center gap-1">
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
                  </div>
                </Card>
              </Link>
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
