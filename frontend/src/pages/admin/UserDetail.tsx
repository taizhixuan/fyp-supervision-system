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
      await resendInviteMutation.mutateAsync(user.userId)
      successToast('Invitation Resent', `Invite email sent to ${user.email}`)
    } catch (error) {
      errorToast('Failed to Resend', 'Could not send the invitation email.')
    }
  }

  const handleSendResetLink = async () => {
    try {
      await sendCredentialsMutation.mutateAsync({ userId: user.userId, method: 'RESET_LINK' })
      successToast('Reset Link Sent', `Password reset link sent to ${user.email}`)
    } catch (error) {
      errorToast('Failed to Send', 'Could not send the password reset link.')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.ADMIN.USERS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      {/* User Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            user.isLocked ? 'bg-error-100' : 'bg-primary-100'
          )}>
            {user.isLocked ? (
              <Lock className="h-8 w-8 text-error-600" />
            ) : (
              <span className="text-2xl font-bold text-primary-600">
                {avatarInitial(user.fullName)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{user.fullName}</h1>
            <p className="text-neutral-600">{user.email}</p>
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
              {user.isLocked && (
                <span className="px-2 py-0.5 bg-error-50 text-error-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={ROUTES.ADMIN.USER_EDIT.replace(':id', user.userId)}>
            <Button variant="secondary">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Account Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600">Email:</span>
              <span className="font-medium text-neutral-900">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Phone:</span>
                <span className="font-medium text-neutral-900">{user.phone}</span>
              </div>
            )}
            {user.department && (
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Department:</span>
                <span className="font-medium text-neutral-900">{user.department}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600">Role:</span>
              <span className={cn('font-medium', role.color)}>{role.label}</span>
            </div>
          </div>
        </Card>

        {/* Security Info */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            Security Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600">Created:</span>
              <span className="font-medium text-neutral-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user.lastLoginAt && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Last Login:</span>
                <span className="font-medium text-neutral-900">
                  {new Date(user.lastLoginAt).toLocaleString()}
                </span>
              </div>
            )}
            {user.passwordChangedAt && (
              <div className="flex items-center gap-3 text-sm">
                <Key className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Password Changed:</span>
                <span className="font-medium text-neutral-900">
                  {new Date(user.passwordChangedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600">Failed Logins:</span>
              <span className={cn(
                'font-medium',
                user.loginAttempts > 3 ? 'text-error-600' : 'text-neutral-900'
              )}>
                {user.loginAttempts}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card>
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary-600" />
          Active Sessions ({user.sessions.length})
        </h3>

        {user.sessions.length > 0 ? (
          <div className="space-y-3">
            {user.sessions.map((session) => (
              <div
                key={session.sessionId}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    session.isActive ? 'bg-success-500' : 'bg-neutral-300'
                  )} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {session.ipAddress}
                    </p>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {session.userAgent}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Last activity: {new Date(session.lastActivityAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-error-600">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No active sessions</p>
        )}
      </Card>

      {/* Recent Activity */}
      <Card>
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-600" />
          Recent Activity
        </h3>

        {user.activityLog.length > 0 ? (
          <div className="space-y-3">
            {user.activityLog.map((log) => (
              <div
                key={log.logId}
                className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{log.action}</p>
                  <p className="text-xs text-neutral-500">{log.details}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    {log.ipAddress && (
                      <>
                        <span>•</span>
                        <span>{log.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No recent activity</p>
        )}
      </Card>

      {/* Notes */}
      {user.notes && (
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-2">Admin Notes</h3>
          <p className="text-sm text-neutral-600">{user.notes}</p>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <h3 className="font-semibold text-neutral-900 mb-4">Account Actions</h3>

        <div className="flex flex-wrap gap-3">
          {/* Lock/Unlock */}
          <Button
            variant="secondary"
            onClick={handleLockToggle}
            disabled={updateMutation.isPending}
          >
            {user.isLocked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Account
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock Account
              </>
            )}
          </Button>

          {/* Resend Invite (if pending) */}
          {user.status === 'PENDING' && (
            <Button
              variant="secondary"
              onClick={handleResendInvite}
              disabled={resendInviteMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {resendInviteMutation.isPending ? 'Sending...' : 'Resend Invite'}
            </Button>
          )}

          {/* Send Password Reset (for non-pending users) */}
          {user.status !== 'PENDING' && (
            <Button
              variant="secondary"
              onClick={handleSendResetLink}
              disabled={sendCredentialsMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {sendCredentialsMutation.isPending ? 'Sending...' : 'Send Password Reset'}
            </Button>
          )}

          {/* Approve (if pending) */}
          {user.status === 'PENDING' && (
            <Button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={updateMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Account
            </Button>
          )}

          {/* Suspend/Reactivate */}
          {user.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              className="text-warning-600 border-warning-300 hover:bg-warning-50"
              onClick={() => setShowConfirmSuspend(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Suspend Account
            </Button>
          )}
          {user.status === 'SUSPENDED' && (
            <Button
              variant="secondary"
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={updateMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Reactivate Account
            </Button>
          )}

          {/* Delete */}
          <Button
            variant="secondary"
            className="text-error-600 border-error-300 hover:bg-error-50"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
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
