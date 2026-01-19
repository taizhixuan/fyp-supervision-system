import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'

// Auth pages
import { LandingPage } from '@/pages/auth/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { AccountPendingPage } from '@/pages/auth/AccountPendingPage'
import { AccountBlockedPage } from '@/pages/auth/AccountBlockedPage'
import { RedirectPage } from '@/pages/auth/RedirectPage'

// Common pages
import { AccountSettingsPage } from '@/pages/common/AccountSettingsPage'
import { HelpFaqPage } from '@/pages/common/HelpFaqPage'
import { NotFoundPage } from '@/pages/common/NotFoundPage'
import { AccessDeniedPage } from '@/pages/common/AccessDeniedPage'
import { ServerErrorPage } from '@/pages/common/ServerErrorPage'
import { SessionExpiredPage } from '@/pages/common/SessionExpiredPage'
import { MaintenancePage } from '@/pages/common/MaintenancePage'

// Student pages
import {
  StudentDashboard,
  StudentProfile,
  SupervisorDirectory,
  SupervisorDetail,
  AIRecommendations,
  CompareSupervisors,
  CreateSupervisionRequest,
  MyRequests,
  ProposalWorkspace,
  ProposalHistory,
  ProposalAnalysis,
  ProposalStatus,
  RegistrationStatus,
  MeetingList,
  MeetingRequest,
  MeetingDetail,
  MeetingExport,
  LogList,
  LogCreate,
  LogDetail,
  LogEdit,
  DocumentList,
  DocumentUpload,
  DocumentDetail,
  DocumentHistory,
  ResourcesHub,
  ResourceDetail,
  DeadlineCalendar,
  NotificationCenter,
  NotificationSettings,
  Chatbot,
} from '@/pages/student'

// Supervisor pages
import {
  SupervisorDashboard,
  SupervisorProfile,
  RequestInbox,
  RequestDetail,
  SuperviseesList,
  SuperviseeDetail,
  ProposalReviewQueue,
  ProposalReviewDetail,
  MeetingManagement,
  MeetingDetail as SupervisorMeetingDetail,
  CreateMeeting,
  LogsReview,
  LogDetail as SupervisorLogDetail,
  DocumentsReview,
  DocumentDetail as SupervisorDocumentDetail,
  AnnouncementsList,
  CreateAnnouncement,
  NotificationsCenter,
} from '@/pages/supervisor'

// Committee pages
import {
  CommitteeDashboard,
  AnnouncementsList as CommitteeAnnouncementsList,
  CreateAnnouncement as CommitteeCreateAnnouncement,
  ProposalReviewQueue as CommitteeProposalQueue,
  ProposalReviewDetail as CommitteeProposalDetail,
  DocumentsManagement,
  DocumentUpload as CommitteeDocumentUpload,
  DocumentVersions,
  ProjectOverview,
  ProjectDetail,
  UnpairedStudents,
  SupervisorLoad,
  SupervisorLoadDetail,
  ExportOverview,
  ReportsModule,
  ReportsHistory,
  NotificationsCenter as CommitteeNotificationsCenter,
} from '@/pages/committee'

// Admin pages
import {
  AdminDashboard,
  UserManagement,
  CreateUser,
  UserDetail,
  SystemParameters,
  CycleManagement,
  DeadlineManagement,
  IntegrationSettings,
  ExportConfigurationPage,
  MaintenanceCenter,
  JobHistory,
  AuditLogs,
} from '@/pages/admin'

// Layout components
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute'

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

  // Auth redirect
  {
    path: ROUTES.REDIRECT,
    element: <RedirectPage />,
  },

  // Help page (public)
  {
    path: ROUTES.HELP,
    element: <HelpFaqPage />,
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

      // Supervisor Discovery
      {
        path: ROUTES.STUDENT.SUPERVISORS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <SupervisorDirectory />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.SUPERVISOR_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <SupervisorDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.RECOMMENDATIONS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AIRecommendations />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.COMPARE_SUPERVISORS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <CompareSupervisors />
          </ProtectedRoute>
        ),
      },

      // Supervision Requests
      {
        path: ROUTES.STUDENT.CREATE_REQUEST,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <CreateSupervisionRequest />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MY_REQUESTS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <MyRequests />
          </ProtectedRoute>
        ),
      },

      // Proposal
      {
        path: ROUTES.STUDENT.PROPOSAL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ProposalWorkspace />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.PROPOSAL_HISTORY,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ProposalHistory />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.PROPOSAL_ANALYSIS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ProposalAnalysis />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.PROPOSAL_STATUS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ProposalStatus />
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
            <MeetingList />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_NEW,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <MeetingRequest />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <MeetingDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.MEETING_EXPORT,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <MeetingExport />
          </ProtectedRoute>
        ),
      },

      // Supervision Logs
      {
        path: ROUTES.STUDENT.LOGS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <LogList />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.LOG_NEW,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <LogCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.LOG_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <LogDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.LOG_EDIT,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <LogEdit />
          </ProtectedRoute>
        ),
      },

      // Documents
      {
        path: ROUTES.STUDENT.DOCUMENTS,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DocumentList />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.DOCUMENT_UPLOAD,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DocumentUpload />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.DOCUMENT_DETAIL,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DocumentDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT.DOCUMENT_HISTORY,
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DocumentHistory />
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
        path: ROUTES.COMMITTEE.DOCUMENT_VERSIONS,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <DocumentVersions />
          </ProtectedRoute>
        ),
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
        path: ROUTES.COMMITTEE.EXPORT_OVERVIEW,
        element: (
          <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
            <ExportOverview />
          </ProtectedRoute>
        ),
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
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
})
