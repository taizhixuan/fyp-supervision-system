import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'

// Auth pages - Keep essential pages eager for fast initial load
import { LandingPage } from '@/pages/auth/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { RedirectPage } from '@/pages/auth/RedirectPage'

// Lazy load less critical auth pages
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const AccountPendingPage = lazy(() => import('@/pages/auth/AccountPendingPage').then(m => ({ default: m.AccountPendingPage })))
const AccountBlockedPage = lazy(() => import('@/pages/auth/AccountBlockedPage').then(m => ({ default: m.AccountBlockedPage })))
const Fyp1ResultPendingPage = lazy(() => import('@/pages/auth/Fyp1ResultPendingPage').then(m => ({ default: m.Fyp1ResultPendingPage })))

// Common pages - Lazy load
const AccountSettingsPage = lazy(() => import('@/pages/common/AccountSettingsPage').then(m => ({ default: m.AccountSettingsPage })))
const NotFoundPage = lazy(() => import('@/pages/common/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const AccessDeniedPage = lazy(() => import('@/pages/common/AccessDeniedPage').then(m => ({ default: m.AccessDeniedPage })))
const ServerErrorPage = lazy(() => import('@/pages/common/ServerErrorPage').then(m => ({ default: m.ServerErrorPage })))
const SessionExpiredPage = lazy(() => import('@/pages/common/SessionExpiredPage').then(m => ({ default: m.SessionExpiredPage })))
const MaintenancePage = lazy(() => import('@/pages/common/MaintenancePage').then(m => ({ default: m.MaintenancePage })))
const PrivacyNoticePage = lazy(() => import('@/pages/common/PrivacyNoticePage').then(m => ({ default: m.PrivacyNoticePage })))

// Student pages - All lazy loaded
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })))
const StudentProfile = lazy(() => import('@/pages/student/StudentProfile').then(m => ({ default: m.StudentProfile })))
const SupervisorDirectory = lazy(() => import('@/pages/student/SupervisorDirectory').then(m => ({ default: m.SupervisorDirectory })))
const SupervisorDetail = lazy(() => import('@/pages/student/SupervisorDetail').then(m => ({ default: m.SupervisorDetail })))
const AIRecommendations = lazy(() => import('@/pages/student/AIRecommendations').then(m => ({ default: m.AIRecommendations })))
const CompareSupervisors = lazy(() => import('@/pages/student/CompareSupervisors').then(m => ({ default: m.CompareSupervisors })))
const CreateSupervisionRequest = lazy(() => import('@/pages/student/CreateSupervisionRequest').then(m => ({ default: m.CreateSupervisionRequest })))
const MyRequests = lazy(() => import('@/pages/student/MyRequests').then(m => ({ default: m.MyRequests })))
const ProposalWorkspace = lazy(() => import('@/pages/student/ProposalWorkspace').then(m => ({ default: m.ProposalWorkspace })))
const ProposalHistory = lazy(() => import('@/pages/student/ProposalHistory').then(m => ({ default: m.ProposalHistory })))
const ProposalAnalysis = lazy(() => import('@/pages/student/ProposalAnalysis').then(m => ({ default: m.ProposalAnalysis })))
const ProposalStatus = lazy(() => import('@/pages/student/ProposalStatus').then(m => ({ default: m.ProposalStatus })))
const RegistrationStatus = lazy(() => import('@/pages/student/RegistrationStatus').then(m => ({ default: m.RegistrationStatus })))
const MeetingList = lazy(() => import('@/pages/student/MeetingList').then(m => ({ default: m.MeetingList })))
const MeetingRequest = lazy(() => import('@/pages/student/MeetingRequest').then(m => ({ default: m.MeetingRequest })))
const MeetingDetail = lazy(() => import('@/pages/student/MeetingDetail').then(m => ({ default: m.MeetingDetail })))
const MeetingExport = lazy(() => import('@/pages/student/MeetingExport').then(m => ({ default: m.MeetingExport })))
const LogList = lazy(() => import('@/pages/student/LogList').then(m => ({ default: m.LogList })))
const LogCreate = lazy(() => import('@/pages/student/LogCreate').then(m => ({ default: m.LogCreate })))
const LogDetail = lazy(() => import('@/pages/student/LogDetail').then(m => ({ default: m.LogDetail })))
const LogEdit = lazy(() => import('@/pages/student/LogEdit').then(m => ({ default: m.LogEdit })))
const MeetingLogList = lazy(() => import('@/pages/student/MeetingLogList').then(m => ({ default: m.MeetingLogList })))
const MeetingLogCreate = lazy(() => import('@/pages/student/MeetingLogCreate').then(m => ({ default: m.MeetingLogCreate })))
const MeetingLogDetail = lazy(() => import('@/pages/student/MeetingLogDetail').then(m => ({ default: m.MeetingLogDetail })))
const MeetingLogEdit = lazy(() => import('@/pages/student/MeetingLogEdit').then(m => ({ default: m.MeetingLogEdit })))
const DocumentList = lazy(() => import('@/pages/student/DocumentList').then(m => ({ default: m.DocumentList })))
const DocumentUpload = lazy(() => import('@/pages/student/DocumentUpload').then(m => ({ default: m.DocumentUpload })))
const DocumentDetail = lazy(() => import('@/pages/student/DocumentDetail').then(m => ({ default: m.DocumentDetail })))
const DocumentHistory = lazy(() => import('@/pages/student/DocumentHistory').then(m => ({ default: m.DocumentHistory })))
const ResourcesHub = lazy(() => import('@/pages/student/ResourcesHub').then(m => ({ default: m.ResourcesHub })))
const ResourceDetail = lazy(() => import('@/pages/student/ResourceDetail').then(m => ({ default: m.ResourceDetail })))
const DeadlineCalendar = lazy(() => import('@/pages/student/DeadlineCalendar').then(m => ({ default: m.DeadlineCalendar })))
const NotificationCenter = lazy(() => import('@/pages/student/NotificationCenter').then(m => ({ default: m.NotificationCenter })))
const NotificationSettings = lazy(() => import('@/pages/student/NotificationSettings').then(m => ({ default: m.NotificationSettings })))
const StudentAnnouncementsList = lazy(() => import('@/pages/student/AnnouncementsList').then(m => ({ default: m.AnnouncementsList })))
const Chatbot = lazy(() => import('@/pages/student/Chatbot').then(m => ({ default: m.Chatbot })))

// Supervisor pages - All lazy loaded
const SupervisorDashboard = lazy(() => import('@/pages/supervisor/SupervisorDashboard').then(m => ({ default: m.SupervisorDashboard })))
const SupervisorProfile = lazy(() => import('@/pages/supervisor/SupervisorProfile').then(m => ({ default: m.SupervisorProfile })))
const RequestInbox = lazy(() => import('@/pages/supervisor/RequestInbox').then(m => ({ default: m.RequestInbox })))
const RequestDetail = lazy(() => import('@/pages/supervisor/RequestDetail').then(m => ({ default: m.RequestDetail })))
const SuperviseesList = lazy(() => import('@/pages/supervisor/SuperviseesList').then(m => ({ default: m.SuperviseesList })))
const SuperviseeDetail = lazy(() => import('@/pages/supervisor/SuperviseeDetail').then(m => ({ default: m.SuperviseeDetail })))
const ProposalReviewQueue = lazy(() => import('@/pages/supervisor/ProposalReviewQueue').then(m => ({ default: m.ProposalReviewQueue })))
const ProposalReviewDetail = lazy(() => import('@/pages/supervisor/ProposalReviewDetail').then(m => ({ default: m.ProposalReviewDetail })))
const MeetingManagement = lazy(() => import('@/pages/supervisor/MeetingManagement').then(m => ({ default: m.MeetingManagement })))
const SupervisorMeetingDetail = lazy(() => import('@/pages/supervisor/MeetingDetail').then(m => ({ default: m.MeetingDetail })))
const CreateMeeting = lazy(() => import('@/pages/supervisor/CreateMeeting').then(m => ({ default: m.CreateMeeting })))
const MyAvailability = lazy(() => import('@/pages/supervisor/MyAvailability').then(m => ({ default: m.MyAvailability })))
const LogsReview = lazy(() => import('@/pages/supervisor/LogsReview').then(m => ({ default: m.LogsReview })))
const SupervisorLogDetail = lazy(() => import('@/pages/supervisor/LogDetail').then(m => ({ default: m.LogDetail })))
const MeetingLogReview = lazy(() => import('@/pages/supervisor/MeetingLogReview').then(m => ({ default: m.MeetingLogReview })))
const MeetingLogReviewDetail = lazy(() => import('@/pages/supervisor/MeetingLogReviewDetail').then(m => ({ default: m.MeetingLogReviewDetail })))
const DocumentsReview = lazy(() => import('@/pages/supervisor/DocumentsReview').then(m => ({ default: m.DocumentsReview })))
const SupervisorDocumentDetail = lazy(() => import('@/pages/supervisor/DocumentDetail').then(m => ({ default: m.DocumentDetail })))
const AnnouncementsList = lazy(() => import('@/pages/supervisor/AnnouncementsList').then(m => ({ default: m.AnnouncementsList })))
const CreateAnnouncement = lazy(() => import('@/pages/supervisor/CreateAnnouncement').then(m => ({ default: m.CreateAnnouncement })))
const NotificationsCenter = lazy(() => import('@/pages/supervisor/NotificationsCenter').then(m => ({ default: m.NotificationsCenter })))

// Committee pages - All lazy loaded
const CommitteeDashboard = lazy(() => import('@/pages/committee/CommitteeDashboard').then(m => ({ default: m.CommitteeDashboard })))
const CommitteeAnnouncementsList = lazy(() => import('@/pages/committee/AnnouncementsList').then(m => ({ default: m.AnnouncementsList })))
const CommitteeCreateAnnouncement = lazy(() => import('@/pages/committee/CreateAnnouncement').then(m => ({ default: m.CreateAnnouncement })))
const CommitteeProposalQueue = lazy(() => import('@/pages/committee/ProposalReviewQueue').then(m => ({ default: m.ProposalReviewQueue })))
const CommitteeProposalDetail = lazy(() => import('@/pages/committee/ProposalReviewDetail').then(m => ({ default: m.ProposalReviewDetail })))
const DocumentsManagement = lazy(() => import('@/pages/committee/DocumentsManagement').then(m => ({ default: m.DocumentsManagement })))
const CommitteeDocumentUpload = lazy(() => import('@/pages/committee/DocumentUpload').then(m => ({ default: m.DocumentUpload })))
const ProjectOverview = lazy(() => import('@/pages/committee/ProjectOverview').then(m => ({ default: m.ProjectOverview })))
const ProjectDetail = lazy(() => import('@/pages/committee/ProjectDetail').then(m => ({ default: m.ProjectDetail })))
const UnpairedStudents = lazy(() => import('@/pages/committee/UnpairedStudents').then(m => ({ default: m.UnpairedStudents })))
const SupervisorLoad = lazy(() => import('@/pages/committee/SupervisorLoad').then(m => ({ default: m.SupervisorLoad })))
const SupervisorLoadDetail = lazy(() => import('@/pages/committee/SupervisorLoadDetail').then(m => ({ default: m.SupervisorLoadDetail })))
const ReportsModule = lazy(() => import('@/pages/committee/ReportsModule').then(m => ({ default: m.ReportsModule })))
const ReportsHistory = lazy(() => import('@/pages/committee/ReportsHistory').then(m => ({ default: m.ReportsHistory })))
const CommitteeNotificationsCenter = lazy(() => import('@/pages/committee/NotificationsCenter').then(m => ({ default: m.NotificationsCenter })))
const CommitteeProfile = lazy(() => import('@/pages/committee/CommitteeProfile').then(m => ({ default: m.CommitteeProfile })))

// Admin pages - All lazy loaded
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const UserManagement = lazy(() => import('@/pages/admin/UserManagement').then(m => ({ default: m.UserManagement })))
const PendingRegistrations = lazy(() => import('@/pages/admin/PendingRegistrations').then(m => ({ default: m.PendingRegistrations })))
const ApprovedRoster = lazy(() => import('@/pages/admin/ApprovedRoster').then(m => ({ default: m.ApprovedRoster })))
const Fyp1PassTracking = lazy(() => import('@/pages/admin/Fyp1PassTracking').then(m => ({ default: m.Fyp1PassTracking })))
const CreateUser = lazy(() => import('@/pages/admin/CreateUser').then(m => ({ default: m.CreateUser })))
const UserDetail = lazy(() => import('@/pages/admin/UserDetail').then(m => ({ default: m.UserDetail })))
const SystemParameters = lazy(() => import('@/pages/admin/SystemParameters').then(m => ({ default: m.SystemParameters })))
const CycleManagement = lazy(() => import('@/pages/admin/CycleManagement').then(m => ({ default: m.CycleManagement })))
const DeadlineManagement = lazy(() => import('@/pages/admin/DeadlineManagement').then(m => ({ default: m.DeadlineManagement })))
const IntegrationSettings = lazy(() => import('@/pages/admin/IntegrationSettings').then(m => ({ default: m.IntegrationSettings })))
const ExportConfigurationPage = lazy(() => import('@/pages/admin/ExportConfiguration').then(m => ({ default: m.ExportConfigurationPage })))
const MaintenanceCenter = lazy(() => import('@/pages/admin/MaintenanceCenter').then(m => ({ default: m.MaintenanceCenter })))
const JobHistory = lazy(() => import('@/pages/admin/JobHistory').then(m => ({ default: m.JobHistory })))
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs').then(m => ({ default: m.AuditLogs })))
const DeletionRequests = lazy(() => import('@/pages/admin/DeletionRequests').then(m => ({ default: m.DeletionRequests })))
const AdminNotificationCenter = lazy(() => import('@/pages/admin/AdminNotificationCenter').then(m => ({ default: m.AdminNotificationCenter })))
const AdminProfile = lazy(() => import('@/pages/admin/AdminProfile').then(m => ({ default: m.AdminProfile })))

// Layout components
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute'
import { StudentFeatureGate } from '@/components/common/StudentFeatureGate'
import { RegisteredOnlyLockGate } from '@/components/common/RegisteredOnlyLockGate'
import { CycleActiveGate } from '@/components/common/CycleActiveGate'

export const router = createBrowserRouter([
  // Public routes (no authentication required)
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <ResetPasswordPage />,
  },

  // Account status pages
  {
    path: ROUTES.ACCOUNT_PENDING,
    element: <AccountPendingPage />,
  },
  {
    path: ROUTES.ACCOUNT_BLOCKED,
    element: <AccountBlockedPage />,
  },
  {
    path: ROUTES.FYP1_RESULT_PENDING,
    element: <Fyp1ResultPendingPage />,
  },

  // Auth redirect
  {
    path: ROUTES.REDIRECT,
    element: <RedirectPage />,
  },

  // Error pages (public)
  {
    path: ROUTES.ACCESS_DENIED,
    element: <AccessDeniedPage />,
  },
  {
    path: ROUTES.SERVER_ERROR,
    element: <ServerErrorPage />,
  },
  {
    path: ROUTES.SESSION_EXPIRED,
    element: <SessionExpiredPage />,
  },
  {
    path: ROUTES.MAINTENANCE,
    element: <MaintenancePage />,
  },
  {
    // PDPA / privacy notice — public route, no auth required
    path: '/privacy',
    element: <PrivacyNoticePage />,
  },

  // Protected routes (authentication required)
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      // Common protected routes
      {
        path: ROUTES.SETTINGS,
        element: <AccountSettingsPage />,
      },

      // ========================================
      // STUDENT ROUTES
      // ========================================

      // Dashboard & Profile
      {
        path: ROUTES.STUDENT.DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.PROFILE,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentProfile />
          </ProtectedRoute>
        ),
      },

      // Supervisor Discovery — wrapped in RegisteredOnlyLockGate so already-registered
      // students see a "you are already paired" lock instead of the directory.
      {
        path: ROUTES.STUDENT.SUPERVISORS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <RegisteredOnlyLockGate><SupervisorDirectory /></RegisteredOnlyLockGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.SUPERVISOR_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <RegisteredOnlyLockGate><SupervisorDetail /></RegisteredOnlyLockGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.RECOMMENDATIONS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <RegisteredOnlyLockGate><AIRecommendations /></RegisteredOnlyLockGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.COMPARE_SUPERVISORS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <RegisteredOnlyLockGate><CompareSupervisors /></RegisteredOnlyLockGate>
          </ProtectedRoute>
        ),
      },

      // Supervision Requests — also locked once registered.
      {
        path: ROUTES.STUDENT.CREATE_REQUEST,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <RegisteredOnlyLockGate><CreateSupervisionRequest /></RegisteredOnlyLockGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MY_REQUESTS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <RegisteredOnlyLockGate><MyRequests /></RegisteredOnlyLockGate>
          </ProtectedRoute>
        ),
      },

      // Proposal
      {
        path: ROUTES.STUDENT.PROPOSAL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><ProposalWorkspace /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.PROPOSAL_HISTORY,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><ProposalHistory /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.PROPOSAL_ANALYSIS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><ProposalAnalysis /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.PROPOSAL_STATUS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><ProposalStatus /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },

      // Registration
      {
        path: ROUTES.STUDENT.REGISTRATION,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <RegistrationStatus />
          </ProtectedRoute>
        ),
      },

      // Meetings
      {
        path: ROUTES.STUDENT.MEETINGS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><MeetingList /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_NEW,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><CycleActiveGate><MeetingRequest /></CycleActiveGate></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><MeetingDetail /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_EXPORT,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><MeetingExport /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },

      // Supervision Logs
      {
        path: ROUTES.STUDENT.LOGS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><LogList /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.LOG_NEW,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><CycleActiveGate><LogCreate /></CycleActiveGate></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.LOG_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><LogDetail /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.LOG_EDIT,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><LogEdit /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },

      // Meeting Logs (MMU FCI Format)
      {
        path: ROUTES.STUDENT.MEETING_LOGS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><MeetingLogList /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_LOG_NEW,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><CycleActiveGate><MeetingLogCreate /></CycleActiveGate></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_LOG_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><MeetingLogDetail /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_LOG_EDIT,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><MeetingLogEdit /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },

      // Documents
      {
        path: ROUTES.STUDENT.DOCUMENTS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><DocumentList /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.DOCUMENT_UPLOAD,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><CycleActiveGate><DocumentUpload /></CycleActiveGate></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.DOCUMENT_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><DocumentDetail /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.DOCUMENT_HISTORY,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentFeatureGate><DocumentHistory /></StudentFeatureGate>
          </ProtectedRoute>
        ),
      },

      // Resources & Deadlines
      {
        path: ROUTES.STUDENT.RESOURCES,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ResourcesHub />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.RESOURCE_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ResourceDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.DEADLINES,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DeadlineCalendar />
          </ProtectedRoute>
        ),
      },

      // Notifications
      {
        path: ROUTES.STUDENT.NOTIFICATIONS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <NotificationCenter />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.NOTIFICATION_SETTINGS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <NotificationSettings />
          </ProtectedRoute>
        ),
      },

      // Announcements (UC14)
      {
        path: ROUTES.STUDENT.ANNOUNCEMENTS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAnnouncementsList />
          </ProtectedRoute>
        ),
      },

      // Chatbot
      {
        path: ROUTES.STUDENT.CHATBOT,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Chatbot />
          </ProtectedRoute>
        ),
      },

      // ========================================
      // SUPERVISOR ROUTES
      // ========================================

      // Dashboard & Profile
      {
        path: ROUTES.SUPERVISOR.DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.PROFILE,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <SupervisorProfile />
          </ProtectedRoute>
        ),
      },

      // Supervision Requests
      {
        path: ROUTES.SUPERVISOR.REQUESTS,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <RequestInbox />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.REQUEST_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <RequestDetail />
          </ProtectedRoute>
        ),
      },

      // Supervisees
      {
        path: ROUTES.SUPERVISOR.SUPERVISEES,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <SuperviseesList />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.SUPERVISEE_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <SuperviseeDetail />
          </ProtectedRoute>
        ),
      },

      // Proposal Review
      {
        path: ROUTES.SUPERVISOR.PROPOSALS,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <ProposalReviewQueue />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.PROPOSAL_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <ProposalReviewDetail />
          </ProtectedRoute>
        ),
      },

      // Meetings
      {
        path: ROUTES.SUPERVISOR.MEETINGS,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <MeetingManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.MEETING_NEW,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <CreateMeeting />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.MEETING_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <SupervisorMeetingDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.AVAILABILITY,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <MyAvailability />
          </ProtectedRoute>
        ),
      },

      // Supervision Logs
      {
        path: ROUTES.SUPERVISOR.LOGS,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <LogsReview />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.LOG_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <SupervisorLogDetail />
          </ProtectedRoute>
        ),
      },

      // Meeting Logs (MMU FCI Format)
      {
        path: ROUTES.SUPERVISOR.MEETING_LOGS,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <MeetingLogReview />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.MEETING_LOG_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <MeetingLogReviewDetail />
          </ProtectedRoute>
        ),
      },

      // Documents
      {
        path: ROUTES.SUPERVISOR.DOCUMENTS,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <DocumentsReview />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.DOCUMENT_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <SupervisorDocumentDetail />
          </ProtectedRoute>
        ),
      },

      // Announcements
      {
        path: ROUTES.SUPERVISOR.ANNOUNCEMENTS,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <AnnouncementsList />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <CreateAnnouncement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPERVISOR.ANNOUNCEMENT_EDIT,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <CreateAnnouncement />
          </ProtectedRoute>
        ),
      },

      // Notifications
      {
        path: ROUTES.SUPERVISOR.NOTIFICATIONS,
        element: (
          <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <NotificationsCenter />
          </ProtectedRoute>
        ),
      },

      // ========================================
      // COMMITTEE ROUTES
      // ========================================

      // Dashboard
      {
        path: ROUTES.COMMITTEE.DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeDashboard />
          </ProtectedRoute>
        ),
      },

      // Profile
      {
        path: ROUTES.COMMITTEE.PROFILE,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeProfile />
          </ProtectedRoute>
        ),
      },

      // Announcements (UC24)
      {
        path: ROUTES.COMMITTEE.ANNOUNCEMENTS,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeAnnouncementsList />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.ANNOUNCEMENT_NEW,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeCreateAnnouncement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.ANNOUNCEMENT_EDIT,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeCreateAnnouncement />
          </ProtectedRoute>
        ),
      },

      // Proposal Review (UC25, UC26)
      {
        path: ROUTES.COMMITTEE.PROPOSALS,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeProposalQueue />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.PROPOSAL_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeProposalDetail />
          </ProtectedRoute>
        ),
      },

      // General Documents (UC27)
      {
        path: ROUTES.COMMITTEE.DOCUMENTS,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <DocumentsManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.DOCUMENT_UPLOAD,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeDocumentUpload />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.DOCUMENT_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeDocumentUpload />
          </ProtectedRoute>
        ),
      },
      {
        path: '/committee/documents/:id/versions',
        element: <Navigate to="/committee/documents" replace />,
      },

      // Project & Pairing Overview (UC28)
      {
        path: ROUTES.COMMITTEE.PROJECTS,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <ProjectOverview />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.PROJECT_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <ProjectDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.UNPAIRED_STUDENTS,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <UnpairedStudents />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.SUPERVISOR_LOAD,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <SupervisorLoad />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.SUPERVISOR_LOAD_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <SupervisorLoadDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: '/committee/projects/export',
        element: <Navigate to="/committee/projects" replace />,
      },

      // Reports (UC29)
      {
        path: ROUTES.COMMITTEE.REPORTS,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <ReportsModule />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMMITTEE.REPORTS_HISTORY,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <ReportsHistory />
          </ProtectedRoute>
        ),
      },

      // Notifications
      {
        path: ROUTES.COMMITTEE.NOTIFICATIONS,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <CommitteeNotificationsCenter />
          </ProtectedRoute>
        ),
      },

      // ========================================
      // ADMIN ROUTES (UC30-UC33)
      // ========================================

      // Dashboard
      {
        path: ROUTES.ADMIN.DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },

      // Profile
      {
        path: ROUTES.ADMIN.PROFILE,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AdminProfile />
          </ProtectedRoute>
        ),
      },

      // User Management (UC30)
      {
        path: ROUTES.ADMIN.USERS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.PENDING_REGISTRATIONS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <PendingRegistrations />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.APPROVED_ROSTER,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <ApprovedRoster />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.FYP1_PASS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <Fyp1PassTracking />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.USER_NEW,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <CreateUser />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.USER_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <UserDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.USER_EDIT,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <UserDetail />
          </ProtectedRoute>
        ),
      },

      // System Parameters (UC31)
      {
        path: ROUTES.ADMIN.PARAMETERS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <SystemParameters />
          </ProtectedRoute>
        ),
      },

      // FYP Cycles & Deadlines (UC31)
      {
        path: ROUTES.ADMIN.CYCLES,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <CycleManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.CYCLE_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <CycleManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.DEADLINES,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <DeadlineManagement />
          </ProtectedRoute>
        ),
      },

      // Integration & Export Settings (UC32)
      {
        path: ROUTES.ADMIN.INTEGRATIONS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <IntegrationSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.EXPORT_CONFIG,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <ExportConfigurationPage />
          </ProtectedRoute>
        ),
      },

      // Maintenance (UC33)
      {
        path: ROUTES.ADMIN.MAINTENANCE,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <MaintenanceCenter />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN.JOB_HISTORY,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <JobHistory />
          </ProtectedRoute>
        ),
      },

      // Audit Logs
      {
        path: ROUTES.ADMIN.AUDIT_LOGS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AuditLogs />
          </ProtectedRoute>
        ),
      },

      // PDPA — Account deletion requests
      {
        path: ROUTES.ADMIN.DELETION_REQUESTS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <DeletionRequests />
          </ProtectedRoute>
        ),
      },

      // Notifications
      {
        path: ROUTES.ADMIN.NOTIFICATIONS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AdminNotificationCenter />
          </ProtectedRoute>
        ),
      },

      // Settings
      {
        path: ROUTES.ADMIN.SETTINGS,
        element: (
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <SystemParameters />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // 404 catch-all
  {
    path: '*',
    element: <NotFoundPage />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
})
