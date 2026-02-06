# FYP Supervision System

A comprehensive web-based platform designed to streamline and digitize the Final Year Project (FYP) supervision process at MMU FCI. This system helps students find supervisors, manage proposals, track meetings, and maintain supervision logs—all in one place.

## What It Does

Managing an FYP project can be overwhelming. Students need to find the right supervisor, submit proposals, schedule meetings, keep track of supervision logs, and manage documents—often using multiple tools and manual processes. This system brings everything together in a single, easy-to-use platform.

The system includes AI-powered features like supervisor recommendations based on project topics, automated proposal analysis, and an intelligent chatbot to answer FYP-related questions. Everything is designed to make the supervision process smoother for students, supervisors, and administrators.

## Key Features

### For Students
- **AI-Powered Supervisor Matching** - Get personalized supervisor recommendations based on your project topic and preferences
- **Proposal Management** - Submit, track, and manage your FYP proposals with version control
- **Meeting Scheduling** - Schedule meetings with supervisors and track your meeting history
- **Digital Supervision Logs** - Create and maintain meeting logs in MMU format with e-signature support
- **Document Management** - Upload and organize all your FYP-related documents
- **Progress Tracking** - Dashboard showing your project status, upcoming deadlines, and pending tasks
- **FYP Chatbot** - Get instant answers to common FYP questions

### For Supervisors
- **Request Management** - Review and respond to supervision requests from students
- **Proposal Review** - Review student proposals and provide feedback
- **Meeting Management** - Schedule meetings and review supervision logs
- **Supervisee Dashboard** - Track progress of all your supervisees in one place
- **Document Review** - Review and approve student-submitted documents

### For FYP Committee
- **Proposal Review Queue** - Review and approve proposals at the faculty level
- **Announcements** - Publish faculty-wide announcements and updates
- **Project Overview** - View all FYP projects and supervisor-student pairings
- **Report Generation** - Generate and export comprehensive FYP reports

### For System Administrators
- **User Management** - Manage user accounts, roles, and permissions
- **System Configuration** - Configure system parameters and settings
- **Integration Settings** - Manage external integrations and export configurations
- **Audit Logs** - Track all system activities for security and compliance

## Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.2.5**
- **MySQL 8** for database
- **JWT** for authentication
- **Flyway** for database migrations
- **Spring Security** for security
- **Lombok** for cleaner code

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching
- **React Hook Form** + **Zod** for form validation
- **React Router** for navigation

### AI Services
- **Flask** microservices for:
  - Supervisor recommendation engine
  - Proposal analysis service
  - FYP chatbot

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **MySQL** database with persistent volumes

## Project Structure

```
fyp-supervision-system/
├── backend/                 # Spring Boot backend API
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── Dockerfile          # Backend container config
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities and API clients
│   │   └── types/         # TypeScript type definitions
│   └── Dockerfile         # Frontend container config
├── ai-recommendation/      # Flask service for supervisor recommendations
├── ai-proposal-analyzer/   # Flask service for proposal analysis
├── ai-chatbot/            # Flask service for chatbot
├── docker-compose.yml      # Docker Compose configuration
└── .env.example           # Environment variables template
```

## Prerequisites

Before you begin, make sure you have the following installed:

- **Java 17** or higher
- **Node.js 18+** and **npm**
- **Docker** and **Docker Compose**
- **MySQL 8** (if running database locally)
- **OpenAI API Key** (for AI features)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fyp-supervision-system
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `JWT_SECRET` - A secure secret key (at least 32 characters)
- `OPENAI_API_KEY` - Your OpenAI API key for AI features

### 3. Run with Docker Compose (Recommended)

The easiest way to get everything running:

```bash
docker-compose up --build
```

This will start:
- MySQL database on port 3306
- Backend API on port 8080
- Frontend on port 3000 (or configured port)
- AI recommendation service on port 5001
- AI proposal analyzer on port 5002
- AI chatbot on port 5003

### 4. Run Locally (Development)

If you prefer running services individually:

#### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend will run on `http://localhost:8080/api`

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` (or the port shown in terminal)

#### AI Services

Each AI service can be run individually:

```bash
cd ai-recommendation  # or ai-proposal-analyzer, ai-chatbot
pip install -r requirements.txt
python app.py
```

## Configuration

### Database

The system uses MySQL 8. When running with Docker Compose, the database is automatically set up. For local development, create a database:

```sql
CREATE DATABASE fyp_supervision;
```

Update `backend/src/main/resources/application.yml` or set environment variables:
- `DB_URL` - Database connection URL
- `DB_USER` - Database username
- `DB_PASS` - Database password

### File Uploads

By default, uploaded files are stored in `./uploads` (backend) or `/app/uploads` (Docker). You can configure this via:
- `FILE_UPLOAD_DIR` environment variable
- `app.file.upload-dir` in `application.yml`

### JWT Configuration

JWT tokens are used for authentication. Configure via:
- `JWT_SECRET` - Secret key for signing tokens
- `JWT_EXPIRY_MS` - Token expiration time in milliseconds (default: 24 hours)

## User Roles

The system supports four user roles:

1. **STUDENT** - Undergraduate FYP students
2. **SUPERVISOR** - Academic staff supervising projects
3. **FYP_COMMITTEE** - Faculty coordinators
4. **SYSTEM_ADMIN** - IT staff managing the system

## API Documentation

The backend API is available at `http://localhost:8080/api`. Key endpoints include:

- `/auth/*` - Authentication endpoints (login, register, password reset)
- `/students/*` - Student-specific endpoints
- `/supervisors/*` - Supervisor-specific endpoints
- `/committee/*` - FYP Committee endpoints
- `/admin/*` - System admin endpoints
- `/notifications` - Notification management
- `/resources` - Resource documents

## Development

### Backend Development

```bash
cd backend
mvn spring-boot:run
```

The backend uses Flyway for database migrations. Migrations are located in `backend/src/main/resources/db/migration/`.

### Frontend Development

```bash
cd frontend
npm run dev
```

The frontend uses Vite for hot module replacement, so changes will be reflected immediately.

### Running Tests

Backend tests:
```bash
cd backend
mvn test
```

Frontend tests (if configured):
```bash
cd frontend
npm test
```

## Building for Production

### Backend

```bash
cd backend
mvn clean package
java -jar target/supervision-1.0.0.jar
```

### Frontend

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`.

## Troubleshooting

### Database Connection Issues

- Make sure MySQL is running and accessible
- Check database credentials in `.env` or `application.yml`
- Verify the database exists: `CREATE DATABASE fyp_supervision;`

### Port Already in Use

If a port is already in use, either:
- Stop the service using that port
- Change the port in `docker-compose.yml` or configuration files

### AI Services Not Working

- Verify `OPENAI_API_KEY` is set correctly in `.env`
- Check that AI services are running and accessible
- Review logs: `docker-compose logs ai-recommendation`

### File Upload Issues

- Ensure the upload directory exists and has write permissions
- Check `FILE_UPLOAD_DIR` configuration
- Verify file size limits in `application.yml` (default: 50MB)

## Contributing

This is a Final Year Project. If you're working on this project:

1. Follow the existing code style and conventions
2. Write meaningful commit messages
3. Test your changes before committing
4. Update documentation if needed

## License

This project is developed as part of a Final Year Project at MMU FCI.

---

**Note:** This system is designed specifically for MMU FCI's FYP supervision process. Some features may be tailored to MMU's specific requirements and workflows.
