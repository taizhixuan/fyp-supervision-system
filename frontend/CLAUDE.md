# Project: FYP Supervision System - Frontend (React SPA)

## Tech Stack
- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- react-router-dom v6 (routing)
- TanStack Query + axios (data fetching)
- react-hook-form + zod (forms)
- lucide-react (icons)

## Architecture Rules
1. Pages live in `src/pages/**`, reusable components in `src/components/**`.
2. All API calls go through `src/lib/api/*`. No direct axios in pages.
3. Use CSS variables defined in `src/styles/globals.css` for theming.
4. Forms must use react-hook-form + zod for validation.
5. Include loading, error, and empty states for all data-driven components.
6. Follow the established folder structure strictly.

## Coding Standards
- Use TypeScript strict mode
- Prefer named exports for components
- Use `cn()` utility for conditional classNames
- All components must be accessible (proper labels, keyboard navigation)
- No inline styles; use Tailwind classes

## Component Guidelines
- Button: Always specify `type` attribute
- Input: Always pair with label, include error/helper text slots
- Forms: Show inline errors + summary banner for critical errors
- Loading states: Use Spinner component, never skeleton abuse

## File Naming
- Components: PascalCase (e.g., `LoginForm.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utils: camelCase (e.g., `cn.ts`)
- Types: PascalCase in dedicated files (e.g., `types/auth.ts`)

## Folder Structure
```
src/
├── app/                    # App configuration
│   ├── router.tsx         # React Router setup
│   └── providers.tsx      # QueryClient, AuthProvider
├── components/
│   ├── layout/            # Layout components
│   │   ├── AppShell.tsx   # Main layout with topbar + sidebar
│   │   ├── AuthLayout.tsx # Layout for auth pages
│   │   ├── TopBar.tsx     # Header with bell + user menu
│   │   └── SideNav.tsx    # Sidebar navigation
│   ├── ui/                # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   └── common/            # Shared feature components
│       ├── NotificationDrawer.tsx
│       └── UserMenu.tsx
├── pages/
│   ├── auth/              # Authentication pages
│   ├── common/            # Shared pages
│   ├── student/           # Student-specific (future)
│   ├── supervisor/        # Supervisor-specific (future)
│   ├── committee/         # Committee-specific (future)
│   └── admin/             # Admin-specific (future)
├── lib/
│   ├── api/               # API client and endpoints
│   ├── auth/              # Auth context and hooks
│   ├── hooks/             # Custom hooks
│   ├── validators/        # Zod schemas
│   ├── utils/             # Utility functions
│   └── constants/         # Constants and routes
├── styles/
│   └── globals.css        # Tailwind + CSS variables
└── types/                 # TypeScript types
```

## Color Palette (Brand Colors from Logo)
- Primary: Navy Blue (#1e3a5f) - Professional, trustworthy
- Accent: Coral Red (#ef4444) - CTAs and highlights
- Success: Green (#22c55e) - Checkmark from logo
- Neutral: Warm Gray scale

## API Endpoints
Base URL: `VITE_API_BASE_URL` (default: http://localhost:8080/api)

### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/me
- PUT /auth/change-password
- PUT /auth/update-profile

### Notifications
- GET /notifications
- GET /notifications/unread-count
- PUT /notifications/:id/read
- PUT /notifications/mark-all-read

### Resources
- GET /resources
- GET /resources/categories
- GET /resources/:id

### Announcements
- GET /announcements/latest

### System
- GET /system/parameters/public

## User Roles
1. STUDENT - Undergraduate FYP students
2. SUPERVISOR - Academic staff supervising projects
3. FYP_COMMITTEE - Faculty coordinators
4. SYSTEM_ADMIN - IT staff

## Running the Project
```bash
cd frontend
npm install
npm run dev
```

## Building for Production
```bash
npm run build
npm run preview
```
