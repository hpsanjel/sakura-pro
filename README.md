# SakuraPro - Study Abroad Consultancy Management SaaS

A production-ready multi-tenant SaaS platform for Nepal-based study abroad consultancies managing students applying to Japanese language schools.

## 🎯 Product Overview

SakuraPro helps consultancies manage the complete student visa workflow for Japan, including:
- Student management and categorization
- Document tracking and verification
- COE (Certificate of Eligibility) and visa processing
- Teacher and class management
- Financial tracking and payments
- Internal messaging and communication
- Progress tracking and reporting

## 🧪 Tech Stack

- **Next.js 16.2.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Prisma 7.6.0** - PostgreSQL ORM
- **NextAuth.js 4.24.13** - JWT authentication
- **Tailwind CSS 4** - Styling framework
- **Cloudinary** - File storage and management
- **PostgreSQL** - Database (configurable)

## 🏢 Architecture

### Multi-Tenant SaaS
- Complete consultancy data isolation
- Role-based access control (RBAC)
- Secure cross-tenant data protection
- Scalable multi-consultancy support

### User Roles
- **SUPERADMIN**: Global system access across all consultancies
- **ADMIN**: Full consultancy management
- **COUNSELOR**: Student and document management
- **TEACHER**: Classes, progress, and interviews
- **STUDENT**: Self-service portal and document upload

## ✅ Core Features

### Student Management
- Complete student lifecycle: VISITOR → PROSPECT → APPLIED → COMMITTED → ENROLLED → ALUMNI
- Japanese language level tracking (N5–N1)
- Intake management (April, July, October, January)
- Student login accounts with self-service capabilities

### Document System
- Predefined document types per student
- File upload with Cloudinary integration
- Status tracking: MISSING, UPLOADED, VERIFIED, REJECTED
- Role-based document access and verification

### Visa/COE Pipeline
- Complete workflow: NEW_LEAD → DOCS_PENDING → COE_APPLIED → VISA_APPROVED
- Automatic status progression
- Document requirement tracking
- Real-time pipeline analytics

### Financial Management
- Fee management (TUITION, CONSULTANCY, APPLICATION, VISA, ACCOMMODATION)
- Payment tracking with multiple methods
- Receipt uploads via Cloudinary
- Financial analytics and reporting
- Upcoming payment alerts

### Teacher & Class Management
- Teacher profiles and specializations
- Class scheduling and enrollment
- Student progress tracking (speaking, listening, reading, writing)
- Interview management and feedback

### Communication System
- Gmail-style messaging interface
- Multi-recipient support
- File attachments via Cloudinary
- Inbox, Sent, and Archived organization
- Read/unread status tracking

### Analytics & Reporting
- Role-specific dashboards
- Pipeline analytics
- Financial reporting
- Progress tracking with visual charts
- Office expense management

## 🛡 Security Features

- JWT-based authentication with NextAuth.js
- Multi-tenant data isolation
- Role-based API access control
- Input validation with Zod schemas
- Secure file upload handling
- Cross-tenant data leak prevention

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or use Prisma's hosted database)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: OAuth providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

5. Set up the database:
```bash
npm run db:push
```

6. Seed the database with sample data:
```bash
npm run db:seed
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database and reseed

## Default Login Credentials

After running the seed script, you can use these credentials:

**Superadmin User:**
- Email: admin@njsc.com
- Password: admin123

**Admin User:**
- Email: admin@njsc.com
- Password: admin123

**Counselor User:**
- Email: counselor@njsc.com
- Password: counselor123

**Teacher User:**
- Email: teacher@njsc.com
- Password: teacher123

**Student User:**
- Email: student@njsc.com
- Password: student123

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes with validation
│   │   ├── auth/               # NextAuth configuration
│   │   ├── students/           # Student management endpoints
│   │   ├── documents/          # Document upload endpoints
│   │   ├── payments/           # Financial management
│   │   ├── messages/           # Messaging system
│   │   └── ...
│   ├── dashboard/              # Protected dashboard routes
│   ├── admin/                 # Admin-only routes
│   ├── counselor/             # Counselor routes
│   ├── teacher/               # Teacher routes
│   ├── student/               # Student self-service
│   └── auth/                  # Authentication pages
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── forms/                 # Form components
│   ├── charts/                # Analytics components
│   └── layout/                # Layout components
├── lib/
│   ├── auth.ts                # NextAuth configuration
│   ├── prisma.ts              # Prisma client
│   ├── validations.ts        # Zod schemas
│   ├── utils.ts               # Utility functions
│   └── cloudinary.ts          # File upload config
├── types/
│   └── next-auth.d.ts         # NextAuth types
└── generated/prisma/          # Generated Prisma client
```

## Authentication

The app supports multiple authentication methods:

1. **Email/Password** - Traditional credentials authentication
2. **Google OAuth** - Sign in with Google
3. **GitHub OAuth** - Sign in with GitHub

## Database Models

The app uses Prisma ORM with PostgreSQL. Core models include:

- **User** - User accounts with role-based permissions
- **Consultancy** - Multi-tenant consultancy management
- **Student** - Student profiles with categorization and login accounts
- **Document** - Document tracking with file storage
- **Sponsor** - Student sponsor information
- **Application** - School application tracking
- **School** - Partner Japanese language schools
- **Teacher** - Teacher profiles and specializations
- **Class** - Class scheduling and enrollment
- **Progress** - Student progress assessments
- **Interview** - Interview scheduling and feedback
- **Fee** - Financial fee management
- **Payment** - Payment tracking with receipts
- **Message** - Internal messaging with attachments
- **OfficeExpense** - Office expense tracking

## 🎨 UI/UX Design

- Modern gradient headers (blue to purple)
- Glassmorphism effects for badges and cards
- Responsive design for all screen sizes
- Role-based sidebar navigation
- Consistent spacing and typography
- Smooth hover animations and transitions

## 🚀 Production Ready

This is a production SaaS platform used by real consultancies:

- **Secure Multi-Tenant Architecture** - Complete data isolation
- **Complete Student Visa Workflow** - Japan-specific processes
- **Modern UI/UX Design** - Professional and intuitive interface
- **Role-Based Access Control** - Granular permissions
- **File Management System** - Cloudinary integration
- **Analytics and Reporting** - Comprehensive insights
- **Teacher and Class Management** - Educational workflow
- **Student Self-Service** - Empowered student experience
- **Financial Management** - Complete payment tracking
- **Internal Communication** - Gmail-style messaging
- **Office Expense Tracking** - Financial oversight

## 🔄 Development Guidelines

When contributing to this codebase:

1. **Preserve existing architecture** and patterns
2. **Maintain UI consistency** with gradient headers and glassmorphism
3. **Follow role-based access patterns** already established
4. **Keep multi-tenant security** intact
5. **Test with different user roles** before deployment
6. **Maintain responsive design** principles

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚀 Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
