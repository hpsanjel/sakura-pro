# AI Agent Guidelines for SakuraPro SaaS

## 🏢 PROJECT CONTEXT
Multi-tenant SaaS for Nepal-based study abroad consultancies managing students applying to Japanese language schools.

## 🧪 TECH STACK
- **Next.js 16.2.1** (App Router) - Breaking changes exist from standard Next.js
- **TypeScript** - Type-safe development required
- **Prisma 7.6.0** - PostgreSQL ORM
- **NextAuth.js 4.24.13** - JWT authentication
- **Tailwind CSS 4** - Styling framework

## 🔐 ARCHITECTURE RULES

### Multi-Tenant Isolation (MANDATORY)
- ALL database queries MUST be scoped by `consultancyId`
- Never mix data between consultancies
- SUPERADMIN role can view all data, others limited to their consultancy

### Role-Based Access Control
- **SUPERADMIN**: Global system access
- **ADMIN**: Full consultancy access
- **COUNSELOR**: Student/document management
- **TEACHER**: Classes, progress, interviews
- **STUDENT**: Self-service portal

### Authentication Patterns
- Use JWT strategy via NextAuth.js
- Session must contain: `userId`, `role`, `consultancyId`
- Enforce API-level authorization (never trust frontend)

## 🛡 SECURITY RULES
- Validate authentication, role, and consultancy ownership on ALL endpoints
- Prevent cross-tenant data leaks
- Use Zod schemas for input validation
- File uploads via Cloudinary only
- Role-based API access control

## 🎨 UI/UX PATTERNS

### Design System
- **Headers**: Blue to purple gradients
- **Badges**: Glassmorphism effects
- **Spacing**: Consistent without extra margins
- **Animations**: Modern hover transitions

### Layout Structure
- Sidebar navigation with role-based menu items
- Consistent header design across pages
- Mobile-responsive navigation required

## 🗃 DATABASE PATTERNS

### Core Models
User, Consultancy, Student, Document, Sponsor, Application, School, Teacher, Class, Progress, Interview, Fee, Payment, Message, OfficeExpense

### Query Patterns
```typescript
// ALWAYS scope by consultancy
const students = await prisma.student.findMany({
  where: { consultancyId: session.consultancyId }
});
```

### Relations & Foreign Keys
- Proper relations with foreign keys
- Enums for roles and statuses
- Timestamps for auditing
- Year-based data partitioning

## 📁 CODE STRUCTURE

### Directory Organization
- `/app` - Routes with role-based protection
- `/components` - Reusable UI components
- `/lib` - Utils, auth, database helpers
- `/prisma` - Schema and migrations
- `/api` - RESTful endpoints with validation

### Component Patterns
- Follow existing component structure
- Maintain TypeScript types
- Use consistent naming conventions
- Implement proper error handling

## 🔧 FEATURE IMPLEMENTATION

### Student Management
- Categories: VISITOR → PROSPECT → APPLIED → COMMITTED → ENROLLED → ALUMNI
- Student login accounts with email/password
- Japanese language levels (N5–N1)
- Intake tracking (April, July, October, January)

### Document System
- Predefined document types per student
- Status: MISSING, UPLOADED, VERIFIED, REJECTED
- Cloudinary file upload integration
- Role-based document access

### Financial Management
- Fee types: TUITION, CONSULTANCY, APPLICATION, VISA, ACCOMMODATION, OTHER
- Payment methods: CASH, BANK_TRANSFER, CREDIT_CARD, ONLINE_PAYMENT, CHEQUE, OTHER
- Receipt uploads via Cloudinary
- Payment status tracking

### Messaging System
- Gmail-style interface (Inbox, Sent, Archived)
- Multi-recipient support
- File attachments via Cloudinary
- Read/unread status with visual indicators

## ⚠️ CRITICAL RULES

### NEVER DO
- Generate placeholder or fake logic
- Skip backend validation
- Mix data between consultancies
- Over-engineer simple features
- Break existing patterns

### ALWAYS DO
- Write production-quality code
- Maintain existing code quality
- Follow established patterns
- Test with different user roles
- Keep multi-tenant security intact

## 🔄 MAINTENANCE GUIDELINES

### Code Quality
- Preserve existing architecture
- Maintain UI consistency
- Follow role-based access patterns
- Keep responsive design principles

### Testing
- Test with all user roles before deployment
- Verify consultancy data isolation
- Check authentication flows
- Validate file upload functionality

## 🚀 PRODUCTION READINESS

This is a production SaaS used by real consultancies. Maintain:
- Secure multi-tenant architecture
- Complete student visa workflow
- Modern UI/UX design
- Role-based access control
- File management systems
- Analytics and reporting

---

<!-- BEGIN:nextjs-agent-rules -->
# Next.js Version Warning

This project uses Next.js 16.2.1 with breaking changes. APIs, conventions, and file structure may differ from standard Next.js. Read guides in `node_modules/next/dist/docs/` before coding. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
