import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Building,
  Clock,
  Calendar,
  Lock,
  Unlock,
  Activity,
  Monitor,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Key,
  LogOut,
  Send,
  RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { useAdminUser, useUpdateUser, useDeleteUser, useResendInvite, useSendCredentials } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { avatarInitial } from '@/lib/utils/name'
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
  PENDING: { label: 'Pending Approval', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  SUSPENDED: { label: 'Suspended', color: 'text-error-600', bgColor: 'bg-error-50' },
  BLOCKED: { label: 'Blocked', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
}

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showConfirmSuspend, setShowConfirmSuspend] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const { data: user, isLoading } = useAdminUser(id!)
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()
  const resendInviteMutation = useResendInvite()
  const sendCredentialsMutation = useSendCredentials()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">User not found</h2>
        <p className="text-neutral-600 mt-2">The user you're looking for doesn't exist.</p>
        <Link to={ROUTES.ADMIN.USERS}>
          <Button className="mt-4">Back to Users</Button>
        </Link>
      </div>
    )
  }

  const role = roleConfig[user.role]
  const status = statusConfig[user.status]

  const statusLabels: Record<string, string> = {
    ACTIVE: 'activated',
    SUSPENDED: 'suspended',
    BLOCKED: 'blocked',
    PENDING: 'set to pending',
  }

  const handleStatusChange = async (newStatus: UserStatus) => {
    try {
      await updateMutation.mutateAsync({
        userId: user.userId,
        data: { status: newStatus },
      })
      setShowConfirmSuspend(false)
      successToast('Status Updated', `${user.fullName}'s account has been ${statusLabels[newStatus]}.`)
    } catch (error) {
      errorToast('Update Failed', 'Could not update the account status.')
    }
  }

  const handleLockToggle = async () => {
    try {
      await updateMutation.mutateAsync({
        userId: user.userId,
        data: { isLocked: !user.isLocked },
      })
      successToast(
        user.isLocked ? 'Account Unlocked' : 'Account Locked',
        `${user.fullName}'s account has been ${user.isLocked ? 'unlocked' : 'locked'}.`
      )
    } catch (error) {
      errorToast('Update Failed', 'Could not toggle account lock status.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(user.userId)
      successToast('Account Deleted', `${user.fullName}'s account has been permanently deleted.`)
      navigate(ROUTES.ADMIN.USERS)
    } catch (error) {
      errorToast('Delete Failed', 'Could not delete the account.')
    }
  }

  const handleResendInvite = async () => {
    try {
      await resendInviteMutation.mutateAsync(user.email)
      successToast('Invitation Resent', `Reset email sent to ${user.email}`)
    } catch (error) {
      errorToast('Failed to Resend', 'Could not send the invitation email.')
    }
  }

  const handleSendResetLink = async () => {
    try {
      await sendCredentialsMutation.mutateAsync({ email: user.email, method: 'RESET_LINK' })
      successToast('Reset Link Sent', `Password reset link sent to ${user.email}`)
    } catch (error) {
      errorToast('Failed to Send', 'Could not send the password reset link.')
    }
  }

  return (
    <div className="space-y-3 lg:space-y-4 max-w-4xl mx-auto">
      {/* Back */}
      <Link to={ROUTES.ADMIN.USERS} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-amber-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Users
      </Link>

      {/* User hero — compact stone-800 with avatar + status chips */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ring-1',
              user.isLocked ? 'bg-rose-500/30 ring-rose-300/40' : 'bg-amber-500/20 ring-amber-500/30'
            )}>
              {user.isLocked ? (
                <Lock className="h-5 w-5 text-rose-300" />
              ) : (
                <span className="text-base font-bold text-amber-300">{avatarInitial(user.fullName)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">{user.fullName}</h1>
              <p className="text-stone-300 text-xs truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <span className={cn('px-1.5 py-0 rounded text-[10px] font-medium', role.bgColor, role.color)}>{role.label}</span>
                <span className={cn('px-1.5 py-0 rounded text-[10px] font-medium', status.bgColor, status.color)}>{status.label}</span>
                {user.isLocked && (
                  <span className="px-1.5 py-0 bg-rose-50 text-rose-700 rounded text-[10px] font-medium flex items-center gap-0.5">
                    <Lock className="h-2.5 w-2.5" />
                    Locked
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link to={ROUTES.ADMIN.USER_EDIT.replace(':id', user.userId)}>
            <Button variant="secondary" size="sm">
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Basic Info */}
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1.5">
            <User className="h-4 w-4 text-amber-600" />
            Account Information
          </h3>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-500">Email:</span>
              <span className="font-medium text-neutral-900 truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-neutral-500">Phone:</span>
                <span className="font-medium text-neutral-900">{user.phone}</span>
              </div>
            )}
            {user.department && (
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-neutral-500">Department:</span>
                <span className="font-medium text-neutral-900 truncate">{user.department}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-500">Role:</span>
              <span className={cn('font-medium', role.color)}>{role.label}</span>
            </div>
          </div>
        </Card>

        {/* Security Info */}
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-amber-600" />
            Security Information
          </h3>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-500">Created:</span>
              <span className="font-medium text-neutral-900">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            {user.lastLoginAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-neutral-500">Last Login:</span>
                <span className="font-medium text-neutral-900">{new Date(user.lastLoginAt).toLocaleString()}</span>
              </div>
            )}
            {user.passwordChangedAt && (
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-neutral-500">Password Changed:</span>
                <span className="font-medium text-neutral-900">{new Date(user.passwordChangedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-500">Failed Logins:</span>
              <span className={cn('font-medium', user.loginAttempts > 3 ? 'text-error-600' : 'text-neutral-900')}>{user.loginAttempts}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sessions + Activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Active Sessions */}
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1.5">
            <Monitor className="h-4 w-4 text-amber-600" />
            Active Sessions ({user.sessions.length})
          </h3>

          {user.sessions.length > 0 ? (
            <div className="space-y-1.5">
              {user.sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between gap-2 p-2 bg-neutral-50 rounded-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', session.isActive ? 'bg-emerald-500' : 'bg-neutral-300')} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-900">{session.ipAddress}</p>
                      <p className="text-[10px] text-neutral-500 line-clamp-1">{session.userAgent}</p>
                      <p className="text-[10px] text-neutral-400">
                        Last activity: {new Date(session.lastActivityAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-rose-600 px-1.5">
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500">No active sessions</p>
          )}
        </Card>

        {/* Recent Activity */}
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-amber-600" />
            Recent Activity
          </h3>

          {user.activityLog.length > 0 ? (
            <div className="space-y-1.5">
              {user.activityLog.map((log) => (
                <div key={log.logId} className="flex items-start gap-2 p-2 bg-neutral-50 rounded-md">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="h-3 w-3 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-900 leading-tight">{log.action}</p>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{log.details}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-neutral-400">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      {log.ipAddress && <span>· {log.ipAddress}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500">No recent activity</p>
          )}
        </Card>
      </div>

      {/* Notes */}
      {user.notes && (
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">Admin Notes</h3>
          <p className="text-xs text-neutral-600">{user.notes}</p>
        </Card>
      )}

      {/* Actions */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-neutral-900 mb-2">Account Actions</h3>

        <div className="flex flex-wrap gap-1.5">
          <Button variant="secondary" size="sm" onClick={handleLockToggle} disabled={updateMutation.isPending}>
            {user.isLocked ? (
              <><Unlock className="h-3.5 w-3.5 mr-1" />Unlock</>
            ) : (
              <><Lock className="h-3.5 w-3.5 mr-1" />Lock</>
            )}
          </Button>

          {user.status === 'PENDING' && (
            <Button variant="secondary" size="sm" onClick={handleResendInvite} disabled={resendInviteMutation.isPending}>
              <Send className="h-3.5 w-3.5 mr-1" />
              {resendInviteMutation.isPending ? 'Sending…' : 'Resend Invite'}
            </Button>
          )}

          {user.status !== 'PENDING' && (
            <Button variant="secondary" size="sm" onClick={handleSendResetLink} disabled={sendCredentialsMutation.isPending}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {sendCredentialsMutation.isPending ? 'Sending…' : 'Reset Password'}
            </Button>
          )}

          {user.status === 'PENDING' && (
            <Button size="sm" onClick={() => handleStatusChange('ACTIVE')} disabled={updateMutation.isPending}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
          )}

          {user.status === 'ACTIVE' && (
            <Button variant="secondary" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => setShowConfirmSuspend(true)}>
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Suspend
            </Button>
          )}
          {user.status === 'SUSPENDED' && (
            <Button variant="secondary" size="sm" onClick={() => handleStatusChange('ACTIVE')} disabled={updateMutation.isPending}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Reactivate
            </Button>
          )}

          <Button variant="secondary" size="sm" className="text-rose-700 border-rose-300 hover:bg-rose-50" onClick={() => setShowConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </Card>

      {/* Suspend Confirmation Modal */}
      {showConfirmSuspend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-warning-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Suspend Account?</h3>
                <p className="text-sm text-neutral-500">
                  This user will be unable to access the system.
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              Are you sure you want to suspend <strong>{user.fullName}</strong>'s account?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowConfirmSuspend(false)}>
                Cancel
              </Button>
              <Button
                className="bg-warning-600 hover:bg-warning-700"
                onClick={() => handleStatusChange('SUSPENDED')}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <Spinner size="sm" /> : 'Suspend'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-error-100 rounded-full">
                <Trash2 className="h-6 w-6 text-error-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Delete Account?</h3>
                <p className="text-sm text-neutral-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              Are you sure you want to permanently delete <strong>{user.fullName}</strong>'s
              account and all associated data?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                className="bg-error-600 hover:bg-error-700"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Spinner size="sm" /> : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
