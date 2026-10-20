# Smart School Backend API

A comprehensive NestJS-based REST API for managing school operations including authentication, user management, attendance tracking, exam administration, and student services.

## Project Overview

This API provides complete backend services for a Smart School Flutter Application, supporting:

- **User Management**: Admin, Teacher, and Student roles with JWT-based authentication
- **Academic Management**: Classes, Subjects, Exams, Marks, and Results
- **Attendance Tracking**: Daily attendance management for classes
- **Homework & Assignments**: Creation and distribution of homework
- **Notices & Communication**: School-wide notices and announcements
- **Routine Management**: Class schedule and routine management

## Tech Stack

- **Framework**: NestJS 11.0.1
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Password Hashing**: bcrypt

## Installation

### Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL (v12+)

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=123456
   DB_NAME=smart_school

   # JWT
   JWT_SECRET=your-super-secret-key-change-in-production

   # Server
   NODE_ENV=development
   PORT=3000
   ```

3. **Create Database**
   ```bash
   # Create PostgreSQL database
   createdb smart_school
   ```

4. **Run the Application**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

5. **Access Documentation**
   - API Documentation: http://localhost:3000/api/docs
   - API Base URL: http://localhost:3000

## Project Structure

```
src/
├── auth/
│   ├── dto/
│   ├── strategies/
│   ├── jwt/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── dto/
│   ├── entities/
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── admin/
│   ├── admin.controller.ts
│   ├── admin.module.ts
│   └── admin.service.ts
├── teacher/
│   ├── teacher.controller.ts
│   ├── teacher.module.ts
│   └── teacher.service.ts
├── student/
│   ├── student.controller.ts
│   ├── student.module.ts
│   └── student.service.ts
├── classes/
│   ├── dto/
│   ├── entities/
│   ├── classes.controller.ts
│   ├── classes.module.ts
│   └── classes.service.ts
├── subjects/
├── exams/
├── attendance/
├── marks/
├── homework/
├── general/
├── app.module.ts
└── main.ts
```

## Core Entities

### User
- UUID primary key
- Name, Email, Password (hashed)
- Role (Admin, Teacher, Student)
- School ID
- Timestamps

### Class
- UUID primary key
- Name, Section
- School ID
- Relationships: Subjects, Routines

### Subject
- UUID primary key
- Name, Code
- Class ID
- School ID

### Exam
- UUID primary key
- Name, Date
- Class ID
- School ID
- Relationships: Exam Results

### Attendance
- UUID primary key
- Date, Student ID, Class ID
- Status (Present, Absent, Leave)
- Taken By (Teacher ID)

### Marks
- UUID primary key
- Exam ID, Student ID
- Marks Obtained, Total Marks
- Subject ID, Teacher ID

### Homework
- UUID primary key
- Title, Description
- Class ID, Subject ID
- Due Date
- Teacher ID

### Notice
- UUID primary key
- Title, Description
- Posted By
- School ID

### Routine
- UUID primary key
- Class ID, Subject ID, Teacher ID
- Day of Week
- Start Time, End Time

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile (requires JWT)

### Users Management (`/admin/users`)
- `GET /admin/users` - List all users (with pagination and filtering)
- `POST /admin/users` - Create new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

### Admin Management (`/admin`)

**Classes**
- `GET /admin/classes` - List all classes
- `POST /admin/classes` - Create class
- `PUT /admin/classes/:id` - Update class
- `DELETE /admin/classes/:id` - Delete class

**Subjects**
- `GET /admin/subjects` - List all subjects
- `POST /admin/subjects` - Create subject
- `PUT /admin/subjects/:id` - Update subject
- `DELETE /admin/subjects/:id` - Delete subject

**Exams**
- `GET /admin/exams` - List all exams
- `POST /admin/exams` - Create exam
- `PUT /admin/exams/:id` - Update exam
- `DELETE /admin/exams/:id` - Delete exam

### Teacher Operations (`/teacher`)

**Attendance**
- `POST /teacher/attendance` - Submit attendance
- `GET /teacher/attendance?classId=xxx&date=yyyy-mm-dd` - Get attendance

**Marks**
- `POST /teacher/marks` - Submit marks
- `GET /teacher/marks?examId=xxx&studentId=yyy` - Get marks

**Homework**
- `POST /teacher/homework` - Create homework
- `GET /teacher/homework?classId=xxx&subjectId=yyy` - List homework
- `PUT /teacher/homework/:id` - Update homework
- `DELETE /teacher/homework/:id` - Delete homework

**Exams**
- `GET /teacher/exams` - List assigned exams

### Student Services (`/student`)
- `GET /student/results` - Get exam results
- `GET /student/attendance` - Get attendance record
- `GET /student/routine?classId=xxx` - Get class routine
- `GET /student/homework?classId=xxx` - Get homework

### General Services (`/general`)

**Notices**
- `GET /general/notices` - List all notices (public)
- `GET /general/notices/:id` - Get single notice (public)
- `POST /general/notices` - Create notice (admin only)
- `PUT /general/notices/:id` - Update notice (admin only)
- `DELETE /general/notices/:id` - Delete notice (admin only)

**Routine**
- `GET /general/routine` - List all routines
- `GET /general/routine/:classId` - Get class routine
- `POST /general/routine` - Create routine (admin only)
- `PUT /general/routine/:id` - Update routine (admin only)
- `DELETE /general/routine/:id` - Delete routine (admin only)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After logging in, include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Login Response Example
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@school.com",
    "role": "teacher",
    "schoolId": "school_id"
  }
}
```

## Error Handling

All API errors follow this standard format:

```json
{
  "error": true,
  "message": "Error description",
  "code": 400
}
```

Common error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Validation

All DTOs include validation using `class-validator`. Key validation rules:

- **Email**: Must be valid email format
- **UUID**: Must be valid UUID format
- **Enum**: Must be one of specified values
- **Dates**: Must be valid date format
- **Numbers**: Must be valid positive numbers

## Development Scripts

```bash
# Start development server with hot reload
npm run start:dev

# Build production bundle
npm run build

# Run production build
npm run start:prod

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Code formatting
npm run format

# Linting
npm run lint
```

## Database Migrations

The application uses `synchronize: true` in development which automatically creates tables. For production, you should:

1. Disable auto-sync
2. Implement TypeORM migrations

```bash
npx typeorm migration:generate ./src/migrations/InitialMigration -d ormconfig.ts
npx typeorm migration:run
```

## Security Recommendations

1. **Change JWT Secret**: Update `JWT_SECRET` in `.env` with a strong random string
2. **Use HTTPS**: Enable HTTPS in production
3. **CORS Configuration**: Configure CORS properly for your frontend domain
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: All inputs are validated using class-validator
6. **Password Security**: Passwords are hashed using bcrypt (salt rounds: 10)

## Performance Optimization

- Implement pagination for large datasets
- Use database indexing on frequently queried fields
- Cache frequently accessed data (notices, routines)
- Use database relationships efficiently

## Deployment

### Docker Deployment

Build and run the application using Docker:

```bash
docker build -t smart-school-backend .
docker run -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=password \
  -e DB_NAME=smart_school \
  -e JWT_SECRET=secret \
  smart-school-backend
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-strong-password
DB_NAME=smart_school
JWT_SECRET=your-super-secret-key-min-32-chars
```


## School Treasury Wallet Endpoints (`/wallet`)

All wallet endpoints are protected and accessible by `admin` and `superadmin` roles with Bearer Token.

### Overview & Balance
- `GET /wallet` - Get current wallet balance, overview summary (all-time, monthly, yearly), and recent transactions.

### Add Money (Income/Deposit)
- `POST /wallet/deposit` (or `POST /wallet/add-money`) - Deposit funds / record revenue into the treasury wallet.
  ```json
  {
    "amount": 50000,
    "category": "Tuition Fee",
    "title": "August 2026 Tuition Fee Collections",
    "description": "Collected from grade 9 and 10 students",
    "paymentMethod": "BANK_TRANSFER",
    "referenceNumber": "DEP-2026-08-001",
    "transactionDate": "2026-08-16T10:00:00.000Z",
    "attachmentUrl": "https://storage.googleapis.com/smart-school/receipts/dep-001.pdf"
  }
  ```

### Add Expense
- `POST /wallet/expense` (or `POST /wallet/add-expense`) - Deduct expense from the treasury wallet.
  ```json
  {
    "amount": 12000,
    "category": "Electricity Bill",
    "title": "DESCO Campus Electricity Bill for July",
    "paymentMethod": "MOBILE_BANKING",
    "referenceNumber": "EXP-2026-08-042",
    "transactionDate": "2026-08-16T11:00:00.000Z"
  }
  ```

### Transaction History & Filters
- `GET /wallet/transactions` - Filtered & paginated transaction history.
  - **Query Parameters**:
    - `month` (e.g. `8`)
    - `year` (e.g. `2026`)
    - `type` (`INCOME` | `EXPENSE`)
    - `category` (e.g. `Electricity Bill`)
    - `paymentMethod` (`CASH`, `BANK_TRANSFER`, `MOBILE_BANKING`, etc.)
    - `startDate` & `endDate` (`YYYY-MM-DD`)
    - `search` (searches across title, reference number, description, category)
    - `page` (default `1`), `limit` (default `20`)
    - `sortBy` (`transactionDate`, `createdAt`, `amount`), `sortOrder` (`ASC`, `DESC`)

### Single Transaction Management
- `GET /wallet/transactions/:id` - Get transaction details.
- `PATCH /wallet/transactions/:id` - Update transaction metadata (title, category, reference, etc.).
- `DELETE /wallet/transactions/:id` - Delete transaction and automatically adjust the school treasury balance.

### Treasury Analytics & Categories
- `GET /wallet/analytics?year=2026` - 12-month breakdown (income, expense, net for Jan-Dec), category distribution, and annual totals.
- `GET /wallet/categories` - Returns recommended lists of income categories, expense categories, and payment methods.

---

## 13. Academic Books & E-Book Reader API (`/academic-books`)

The Academic Books module allows schools to store, organize, and serve class-wise PDF textbooks/e-books. Students and teachers can browse books by class/subject, read PDFs directly within the app, and save reading progress like an e-book reader.

### List Academic Books
- `GET /academic-books`
  - **Roles**: All (`Admin`, `SuperAdmin`, `Teacher`, `Student`)
  - **Query Parameters**:
    - `classId` (UUID) - Filter by class
    - `subjectId` (UUID) - Filter by subject
    - `subject` (string) - Filter by subject name
    - `search` (string) - Search title, author, description
    - `schoolId` (UUID, SuperAdmin only)
  - *Note: For students, if `classId` is omitted, the API automatically filters by the student's enrolled classes.*

### List Books Grouped by Class
- `GET /academic-books/by-class`
  - **Roles**: All (`Admin`, `SuperAdmin`, `Teacher`, `Student`)
  - Returns a list of classes with their associated books and total book count.

### Get Single Book (Read E-Book)
- `GET /academic-books/:id`
  - **Roles**: All (`Admin`, `SuperAdmin`, `Teacher`, `Student`)
  - Returns full book details with `pdfUrl` and current user's `readingProgress` (`lastPage`, `totalPages`, `progressPercentage`, `isCompleted`, `lastReadAt`).

### Continue Reading (Recently Read Books)
- `GET /academic-books/continue-reading`
  - **Roles**: All (`Admin`, `SuperAdmin`, `Teacher`, `Student`)
  - **Query Parameters**: `limit` (default: 10)
  - Returns the list of books the user is currently reading with their last read page and progress percentage.

### Save Reading Progress
- `POST /academic-books/:id/progress`
  - **Roles**: All (`Admin`, `SuperAdmin`, `Teacher`, `Student`)
  - **Request Body**:
    ```json
    {
      "lastPage": 45,
      "totalPages": 280,
      "isCompleted": false
    }
    ```

### Create Academic Book
- `POST /academic-books`
  - **Roles**: `Admin`, `SuperAdmin`, `Teacher`
  - **Request Body**:
    ```json
    {
      "title": "Class 9 Higher Mathematics",
      "author": "NCTB",
      "classId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "subjectId": "4fa85f64-5717-4562-b3fc-2c963f66afa6",
      "subject": "Higher Mathematics",
      "edition": "2024 Edition",
      "coverImageUrl": "https://example.supabase.co/storage/v1/object/public/uploads/cover.jpg",
      "pdfUrl": "https://example.supabase.co/storage/v1/object/public/uploads/math-book.pdf",
      "fileSize": 15485760,
      "description": "Standard syllabus textbook for secondary education.",
      "totalPages": 280,
      "publishedYear": 2024,
      "isActive": true
    }
    ```

### Upload PDF or Cover File
- `POST /academic-books/upload`
  - **Roles**: `Admin`, `SuperAdmin`, `Teacher`
  - **Content-Type**: `multipart/form-data` (`file`)
  - Uploads a PDF or cover image file directly to Supabase storage and returns public URL, file name, and file size.

### Update Academic Book
- `PATCH /academic-books/:id`
  - **Roles**: `Admin`, `SuperAdmin`, `Teacher`
  - **Request Body**: Partial fields of Create DTO.

### Delete Academic Book
- `DELETE /academic-books/:id`
  - **Roles**: `Admin`, `SuperAdmin`
  - Soft-deletes the academic book record.

---

## Academic Calendar Module

The **Academic Calendar** module provides comprehensive calendar and event management for every school in the multi-tenant system. It supports school-wide and class-specific events, holidays, exam schedules, vacations, meetings, and academic milestones with tailored views for **Admin**, **Teacher**, and **Student** roles.

### Supported Event Categories
- `HOLIDAY` (School holiday / day off)
- `EXAM` (Mid-term, final examinations, mock tests)
- `EVENT` (Cultural events, celebrations, exhibitions)
- `VACATION` (Summer vacation, winter break, festive holidays)
- `ACADEMIC` (Semester start/end, result publishing, enrollment deadlines)
- `MEETING` (PTA meetings, teacher conferences)
- `SPORTS` (Sports day, athletic tournaments)
- `OTHER` (General school events)

### Target Audiences
- `ALL`: Visible to students, teachers, and admins
- `STUDENTS`: Visible to students and admins
- `TEACHERS`: Visible to teachers and admins
- `ADMIN`: Visible to admins only

---

### Endpoints Overview

| Role | Method | Endpoint | Description |
|---|---|---|---|
| **Admin** | `POST` | `/academic-calendar` | Create a new calendar event |
| **Admin** | `POST` | `/academic-calendar/bulk` | Bulk create events (e.g., annual holiday list import) |
| **Admin** | `PATCH` / `PUT` | `/academic-calendar/:id` | Update an existing event |
| **Admin** | `DELETE` | `/academic-calendar/:id` | Soft-delete a calendar event |
| **Admin** | `GET` | `/academic-calendar/summary` | Get calendar statistics & counts |
| **Admin** | `GET` | `/academic-calendar/admin` | List all events with admin filters |
| **Admin** | `GET` | `/admin/academic-calendar` | Shortcut in Admin API route |
| **Admin** | `POST` | `/admin/academic-calendar` | Create event via Admin API route |
| **Admin** | `PUT` | `/admin/academic-calendar/:id` | Update event via Admin API route |
| **Admin** | `DELETE` | `/admin/academic-calendar/:id` | Delete event via Admin API route |
| **Teacher** | `GET` | `/academic-calendar/teacher` | View calendar events for teachers |
| **Teacher** | `GET` | `/academic-calendar/teacher/upcoming` | View upcoming events for teacher |
| **Teacher** | `GET` | `/teacher/academic-calendar` | Shortcut in Teacher API route |
| **Teacher** | `GET` | `/teacher/academic-calendar/upcoming` | Shortcut in Teacher API route |
| **Student** | `GET` | `/academic-calendar/student` | View student calendar (enrolled classes + school-wide) |
| **Student** | `GET` | `/academic-calendar/student/upcoming` | View student upcoming events |
| **Student** | `GET` | `/student/academic-calendar` | Shortcut in Student API route |
| **Student** | `GET` | `/student/academic-calendar/upcoming` | Shortcut in Student API route |
| **All Roles** | `GET` | `/academic-calendar` | Contextual calendar events by role |
| **All Roles** | `GET` | `/academic-calendar/upcoming` | Upcoming events from today onwards |
| **All Roles** | `GET` | `/academic-calendar/holidays` | List all school holidays |
| **All Roles** | `GET` | `/academic-calendar/:id` | Get event details by ID |

---

### Admin APIs

#### 1. Create Calendar Event
- **Endpoint**: `POST /academic-calendar` or `POST /admin/academic-calendar`
- **Roles**: `Admin`, `SuperAdmin`
- **Request Body**:
  ```json
  {
    "title": "Summer Vacation 2026",
    "description": "School will remain closed for summer recess.",
    "category": "VACATION",
    "startDate": "2026-06-01",
    "endDate": "2026-06-15",
    "startTime": "09:00",
    "endTime": "14:00",
    "isAllDay": true,
    "isHoliday": true,
    "targetAudience": "ALL",
    "classIds": [],
    "color": "#FB8C00",
    "location": "School Campus",
    "attachmentUrl": "https://example.com/calendar-notice.pdf",
    "academicYear": "2026-2027",
    "term": "Summer Term"
  }
  ```

#### 2. Bulk Create Calendar Events
- **Endpoint**: `POST /academic-calendar/bulk` or `POST /admin/academic-calendar/bulk`
- **Roles**: `Admin`, `SuperAdmin`
- **Request Body**:
  ```json
  {
    "events": [
      {
        "title": "New Year Holiday",
        "startDate": "2026-01-01",
        "category": "HOLIDAY",
        "isHoliday": true,
        "academicYear": "2026"
      },
      {
        "title": "First Term Examination",
        "startDate": "2026-04-10",
        "endDate": "2026-04-22",
        "category": "EXAM",
        "isHoliday": false,
        "academicYear": "2026"
      }
    ]
  }
  ```

#### 3. Update Calendar Event
- **Endpoint**: `PATCH /academic-calendar/:id` or `PUT /academic-calendar/:id` (or `/admin/academic-calendar/:id`)
- **Roles**: `Admin`, `SuperAdmin`
- **Request Body**: Partial fields of Create Event DTO.

#### 4. Delete Calendar Event
- **Endpoint**: `DELETE /academic-calendar/:id` or `DELETE /admin/academic-calendar/:id`
- **Roles**: `Admin`, `SuperAdmin`
- **Response**:
  ```json
  {
    "statusCode": 200,
    "message": "Academic calendar event successfully deleted",
    "data": { "id": "uuid-of-event" }
  }
  ```

#### 5. Get Calendar Summary & Statistics
- **Endpoint**: `GET /academic-calendar/summary` or `GET /admin/academic-calendar/summary`
- **Roles**: `Admin`, `SuperAdmin`
- **Query Parameters**:
  - `year`: Optional calendar year filter (e.g. `2026`)
  - `academicYear`: Optional academic year filter (e.g. `2026-2027`)
  - `schoolId`: Optional school UUID (SuperAdmin only)
- **Response**:
  ```json
  {
    "statusCode": 200,
    "message": "Success",
    "data": {
      "schoolId": "uuid-school-id",
      "academicYear": "2026-2027",
      "year": 2026,
      "totalEvents": 28,
      "totalHolidays": 14,
      "totalExams": 4,
      "totalVacations": 2,
      "upcomingEventsCount": 8,
      "categoryBreakdown": {
        "HOLIDAY": 14,
        "EXAM": 4,
        "VACATION": 2,
        "EVENT": 5,
        "ACADEMIC": 3
      }
    }
  }
  ```

---

### Teacher APIs

#### 1. Get Teacher Calendar
- **Endpoint**: `GET /academic-calendar/teacher` or `GET /teacher/academic-calendar`
- **Roles**: `Teacher`, `Admin`, `SuperAdmin`
- **Query Parameters**:
  - `month`: (1-12)
  - `year`: (e.g. `2026`)
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `category`: `HOLIDAY`, `EXAM`, `EVENT`, etc.
  - `isHoliday`: `true` or `false`
  - `academicYear`: `2026-2027`
  - `classId`: Filter events relevant to a specific class

#### 2. Get Teacher Upcoming Events
- **Endpoint**: `GET /academic-calendar/teacher/upcoming` or `GET /teacher/academic-calendar/upcoming`
- **Roles**: `Teacher`, `Admin`, `SuperAdmin`
- **Query Parameters**:
  - `limit`: Number of upcoming events to return (default: `10`)

---

### Student APIs

#### 1. Get Student Calendar
- **Endpoint**: `GET /academic-calendar/student` or `GET /student/academic-calendar`
- **Roles**: `Student`, `Admin`, `SuperAdmin`
- **Behavior**:
  - Automatically filters events for `targetAudience` in (`ALL`, `STUDENTS`).
  - Automatically matches events applicable school-wide OR matching the student's enrolled `classIds`.
- **Query Parameters**: `month`, `year`, `startDate`, `endDate`, `category`, `isHoliday`, `academicYear`.

#### 2. Get Student Upcoming Events
- **Endpoint**: `GET /academic-calendar/student/upcoming` or `GET /student/academic-calendar/upcoming`
- **Roles**: `Student`, `Admin`, `SuperAdmin`
- **Query Parameters**:
  - `limit`: Number of upcoming events to return (default: `10`)

---

### Shared / Universal APIs

#### 1. List Calendar Events
- **Endpoint**: `GET /academic-calendar`
- **Roles**: `Admin`, `Teacher`, `Student`, `SuperAdmin`
- Automatically applies audience and class visibility according to the authenticated user's role.

#### 2. Get School Holidays
- **Endpoint**: `GET /academic-calendar/holidays`
- **Roles**: `Admin`, `Teacher`, `Student`, `SuperAdmin`
- **Query Parameters**: `year`, `academicYear`

#### 3. Get Single Event Details
- **Endpoint**: `GET /academic-calendar/:id`
- **Roles**: `Admin`, `Teacher`, `Student`, `SuperAdmin`
- Returns enriched event details with assigned class names and creator details.

---

### Request & Complaint System APIs

The Request & Complaint module enables students, teachers, and admins to submit requests and complaints with strict permission routing, status workflows, conversation threads, and notification dispatching.

#### Routing Permission Matrix:
- **Student**: Can submit requests/complaints **ONLY** to their assigned **Class Teachers** (via enrolled `classIds` or weekly routine schedule) and **Admin**. Direct submissions to other teachers or students are strictly blocked with `403 Forbidden`. If `recipientId` is omitted, the request routes to the School Admin queue.
- **Teacher**: Can submit requests/complaints **ONLY** to **Admin**. Direct submissions to other teachers or students are blocked with `403 Forbidden`. If `recipientId` is omitted, the request routes to the School Admin queue.
- **Admin / SuperAdmin**: Can submit requests/complaints to **Teachers** and **Students** (and other Admins).

#### 1. Submit Request or Complaint
- **Endpoint**: `POST /request-complaints`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Request Body**:
  ```json
  {
    "type": "REQUEST", // "REQUEST" | "COMPLAINT"
    "title": "Medical Leave Application",
    "description": "Requesting 3 days leave from Oct 25 to Oct 27 due to fever.",
    "category": "LEAVE", // "ACADEMIC" | "ATTENDANCE" | "LEAVE" | "FACILITY" | "FEE" | "DISCIPLINE" | "BEHAVIOR" | "EXAM" | "OTHER"
    "priority": "MEDIUM", // "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    "recipientId": "teacher-or-admin-uuid", // Optional for student/teacher (defaults to Admin queue)
    "attachments": ["https://example.com/uploads/doctor-note.pdf"]
  }
  ```

#### 2. Get Available Recipients
- **Endpoint**: `GET /request-complaints/recipients`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Query Parameters**: `search` (string), `classId` (string, for admin filtering)
- **Response**:
  - For **Student**: Returns `{ admins: [...], classTeachers: [...] }` with teacher designations and subjects taught.
  - For **Teacher**: Returns `{ admins: [...] }`.
  - For **Admin**: Returns `{ teachers: [...], students: [...] }`.

#### 3. List Requests and Complaints
- **Endpoint**: `GET /request-complaints`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Query Parameters**:
  - `type`: `REQUEST` | `COMPLAINT`
  - `status`: `PENDING` | `IN_PROGRESS` | `RESOLVED` | `REJECTED` | `CANCELLED`
  - `priority`: `LOW` | `MEDIUM` | `HIGH` | `URGENT`
  - `category`: category string
  - `scope`: `sent` | `received` | `unassigned` | `all`
  - `search`: title or description keyword
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`)
- **Scoping**: Automatically scopes to caller's identity (students/teachers see requests they sent or received; admin sees school-wide).

#### 4. Get Single Request / Complaint with Discussion Thread
- **Endpoint**: `GET /request-complaints/:id`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Access**: Creator, assigned recipient, or school admin. Includes discussion thread with messages and attachments.

#### 5. Update Status
- **Endpoint**: `PATCH /request-complaints/:id/status`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Permissions**:
  - `Student`: Can set status to `CANCELLED` only on their own pending requests.
  - `Teacher`: Can update status (`IN_PROGRESS`, `RESOLVED`, `REJECTED`) if they are the assigned recipient.
  - `Admin`: Can update status (`IN_PROGRESS`, `RESOLVED`, `REJECTED`, `CANCELLED`) for any ticket in their school.
- **Request Body**:
  ```json
  {
    "status": "RESOLVED",
    "resolutionNote": "Application approved for requested dates."
  }
  ```

#### 6. Add Comment / Reply
- **Endpoint**: `POST /request-complaints/:id/comments`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Request Body**:
  ```json
  {
    "message": "Please attach the doctor's prescription note.",
    "attachments": []
  }
  ```

#### 7. Get Statistical Summary
- **Endpoint**: `GET /request-complaints/stats/summary`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Response**: Aggregated counts of total, pending, inProgress, resolved, rejected, cancelled, requests, complaints, and breakdown by priority.

#### 8. Delete Request or Complaint
- **Endpoint**: `DELETE /request-complaints/:id`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Permissions**: Creator can soft-delete while `PENDING`; Admins can soft-delete anytime.

---

### Chat & Messaging System APIs

The Chat & Messaging module provides real-time and REST-based 1-on-1 messaging between permitted school members, with unread tracking, conversation previews, and push notifications.

#### Chat Permission Matrix:
- **Student**:
  - Can chat with:
    - **Class Teachers**: Teachers assigned to the student's enrolled classes (via `teacher.classIds` or weekly routine schedule).
    - **Admin / Principal**: Users with role `ADMIN` or `SUPER_ADMIN`, or designation 'Principal'.
  - Cannot chat with: Other students or teachers of classes they are not in.
- **Teacher**:
  - Can chat with:
    - **Principal / Admin**: Users with role `ADMIN`, `SUPER_ADMIN`, or designation 'Principal'.
    - **Only Her Assigned Classes Students**: Students whose enrolled classes match the teacher's assigned classes (via `teacher.classIds` or weekly routine schedule).
  - Cannot chat with: Students from unassigned classes or other teachers (unless Admin/Principal).
- **Admin / SuperAdmin**:
  - Can chat with:
    - **Anyone in this school**: All teachers, all students, and other administrators.

#### 1. Get Permitted Chat Contacts
- **Endpoint**: `GET /chat/contacts`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Query Parameters**:
  - `search`: Filter by name, email, or roll number.
  - `role`: Filter by role (`teacher`, `student`, `admin`) - for Admin only.
  - `classId`: Filter students by class UUID.
- **Response**:
  - For **Student**: `{ role: "student", admins: [...], classTeachers: [...] }` with subjects taught.
  - For **Teacher**: `{ role: "teacher", principalsAndAdmins: [...], assignedStudents: [...] }` with roll numbers and class info.
  - For **Admin**: `{ role: "admin", admins: [...], teachers: [...], students: [...] }`.

#### 2. Start Conversation / Open Existing
- **Endpoint**: `POST /chat/conversations`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Request Body**:
  ```json
  {
    "recipientId": "teacher-or-admin-uuid",
    "message": "Hello Sir, I have a doubt regarding homework.", // Optional initial message
    "attachments": []
  }
  ```

#### 3. List User Conversations
- **Endpoint**: `GET /chat/conversations`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Description**: Returns all conversations for the user sorted by `lastMessageAt DESC`, including the other participant's profile (name, avatar, role, designation), last message preview, and unread message count.

#### 4. Get Messages in a Conversation
- **Endpoint**: `GET /chat/conversations/:id/messages`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Query Parameters**:
  - `page`: Page number (default `1`)
  - `limit`: Messages per page (default `50`)
  - `before`: ISO date string for cursor pagination
- **Behavior**: Retrieves messages chronologically and automatically marks incoming unread messages as read.

#### 5. Send Message
- **Endpoint**: `POST /chat/conversations/:id/messages` or `POST /chat/messages`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Request Body**:
  ```json
  {
    "conversationId": "uuid-of-conversation", // Optional if posting to /chat/conversations/:id/messages
    "recipientId": "uuid-of-recipient",       // Optional if conversationId is provided
    "message": "Thank you for the explanation!",
    "attachments": ["https://example.com/uploads/photo.jpg"]
  }
  ```
- **Behavior**: Verifies permissions, saves message, updates conversation last message preview, dispatches Firebase push notification, and emits WebSocket event if recipient is connected.

#### 6. Mark Conversation as Read
- **Endpoint**: `PATCH /chat/conversations/:id/read`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Description**: Marks all unread messages received by caller in this conversation as read.

#### 7. Get Total Unread Count
- **Endpoint**: `GET /chat/unread-count`
- **Roles**: `Student`, `Teacher`, `Admin`, `SuperAdmin`
- **Response**: `{ "unreadCount": 3 }`

#### 8. Real-Time WebSocket Connection
- **Endpoint**: `ws://<host>:<port>/chat?token=<jwt_bearer_token>`
- **Events**:
  - Incoming from Server:
    - `{ "event": "connected", "data": { "userId": "..." } }`
    - `{ "event": "new_message", "data": { ...chatMessageObject } }`
  - Outgoing from Client:
    - `{ "action": "send_message", "data": { "recipientId": "...", "message": "..." } }`
    - `{ "action": "ping" }` -> Server responds with `{ "event": "pong" }`

---

### Fees Management System APIs

The Fees Management module allows school administrators to define fee structures, generate school fees in bulk by class or for specific students, configure collection modes (**Personal Payment** vs **School Care Payment**), record payments, generate printable invoice slips, and provides complete historical fee ledgers for students.

#### Payment Collection Modes:
1. **Personal Payment (`PERSONAL_PAYMENT`)**:
   - Admin configures personal/school bank account details (Bank name, account number, branch, routing number) and mobile financial services (bKash, Nagad, Rocket numbers) or physical cash counter instructions.
   - Payments are collected directly by the school and recorded with transaction IDs or receipt references.
2. **School Care Payment (`SCHOOL_CARE_PAYMENT`)**:
   - Automated online payment gateway provided by the centralized School Care platform.

---

#### 1. Payment Settings (Personal Payment vs School Care Payment)
- **Get School Payment Settings**:
  - **Endpoint**: `GET /fees/settings`
  - **Roles**: `Admin`, `SuperAdmin`, `Student`, `Teacher`
  - **Description**: Returns active payment mode, banking details, mobile money numbers, and gateway configuration.
- **Update School Payment Settings**:
  - **Endpoint**: `PATCH /fees/settings`
  - **Roles**: `Admin`, `SuperAdmin`
  - **Request Body**:
    ```json
    {
      "defaultPaymentMode": "PERSONAL_PAYMENT", // or "SCHOOL_CARE_PAYMENT"
      "personalPaymentInfo": {
        "bankName": "Sonali Bank PLC",
        "accountName": "Dhaka Ideal School & College",
        "accountNumber": "1234567890123",
        "branch": "Motijheel Branch",
        "routingNumber": "125272635",
        "bkashNumber": "01712345678",
        "nagadNumber": "01812345678",
        "cashCounterLocation": "Accounts Office, Room 102",
        "instructions": "Send via bKash personal with student roll number as reference or pay at counter."
      },
      "schoolCarePaymentInfo": {
        "enabled": true,
        "merchantId": "MERCHANT_001",
        "instructions": "Pay online via School Care automated gateway."
      },
      "lateFeeFinePerDay": 10,
      "currency": "BDT"
    }
    ```

---

#### 2. Generate School Fees (Admin)
- **Endpoint**: `POST /fees/generate`
- **Roles**: `Admin`, `SuperAdmin`
- **Description**: Generates invoices in bulk for all students in a class or for single/multiple individual students with auto-generated unique invoice numbers (e.g. `INV-202610-1234`) and dispatches push notifications.
- **Request Body (Bulk Class Generation)**:
  ```json
  {
    "classId": "class-uuid-1",
    "sectionId": "optional-section-uuid",
    "title": "Monthly Tuition Fee - October 2026",
    "feeType": "TUITION", // "TUITION" | "ADMISSION" | "EXAM" | "REGISTRATION" | "SESSION" | "LAB" | "LIBRARY" | "TRANSPORT" | "SPORTS" | "HOSTEL" | "FINE" | "OTHER"
    "amount": 1500,
    "discountAmount": 0,
    "month": "October",
    "year": 2026,
    "dueDate": "2026-10-31T23:59:59.000Z",
    "paymentMode": "PERSONAL_PAYMENT" // Optional (defaults to school setting)
  }
  ```
- **Request Body (Single Student Generation)**:
  ```json
  {
    "studentId": "student-uuid-1",
    "title": "Annual Exam Fee 2026",
    "feeType": "EXAM",
    "amount": 800,
    "discountAmount": 50,
    "year": 2026,
    "dueDate": "2026-11-15T23:59:59.000Z"
  }
  ```

---

#### 3. Student Historical Fee Data
- **Student View (Own History)**:
  - **Endpoint**: `GET /fees/student/history`
  - **Roles**: `Student`, `Admin`, `SuperAdmin`
  - **Query Parameters**: `year`, `month`
  - **Response**: Complete financial ledger:
    ```json
    {
      "summary": {
        "totalInvoiced": 18000,
        "totalDiscount": 500,
        "totalFine": 50,
        "totalPayable": 17550,
        "totalPaid": 16050,
        "totalDue": 1500,
        "totalOverdue": 1500,
        "invoicesCount": 12,
        "paidInvoicesCount": 11,
        "pendingInvoicesCount": 1,
        "currency": "BDT"
      },
      "invoices": [ /* all historical invoices with nested payment installments */ ],
      "payments": [ /* chronological payment transactions log */ ],
      "activePaymentInstructions": { /* active payment instructions for student */ }
    }
    ```
- **Admin View (Any Student History)**:
  - **Endpoint**: `GET /fees/students/:studentId/history`
  - **Roles**: `Admin`, `SuperAdmin`

---

#### 4. Print Fee Invoice & Receipt Slip ("Print")
- **Endpoint**: `GET /fees/invoices/:id/print`
- **Roles**: `Admin`, `SuperAdmin`, `Student` (own invoice)
- **Description**: Returns structured printable invoice data along with ready-to-render professional HTML (`htmlTemplate`) formatted for A4 or thermal receipt printing, with school header, student info, fee breakdown, payment history receipts, and signature placeholders.

---

#### 5. Record / Collect Fee Payment (Admin)
- **Endpoint**: `POST /fees/invoices/:id/payments`
- **Roles**: `Admin`, `SuperAdmin`
- **Description**: Collects full or partial payment towards an invoice, updates invoice status (`PARTIALLY_PAID` or `PAID`), generates unique `receiptNumber` (`REC-YYYYMMDD-XXXX`), dispatches confirmation push notification, and optionally credits the school Treasury Wallet.
- **Request Body**:
  ```json
  {
    "amount": 1500,
    "paymentMode": "PERSONAL_PAYMENT", // or "SCHOOL_CARE_PAYMENT"
    "paymentMethod": "BKASH", // "CASH" | "BANK_TRANSFER" | "BKASH" | "NAGAD" | "ROCKET" | "ONLINE" | "WALLET"
    "transactionId": "TRX-BKASH-987654321",
    "note": "Paid by parent via personal bKash",
    "syncToWallet": true
  }
  ```

---

#### 6. List & Search Fee Invoices
- **Endpoint**: `GET /fees/invoices`
- **Roles**: `Admin`, `SuperAdmin`, `Student` (student only sees own)
- **Query Parameters**:
  - `studentId`, `classId`, `feeType`, `status` (`UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `WAIVED`)
  - `month`, `year`, `search` (invoice number or student name/roll)
  - `page` (default `1`), `limit` (default `10`)

---

#### 7. Fee Structure Templates (Admin)
- `POST /fees/structures` - Create reusable fee template (e.g. Monthly Tuition Fee $1500)
- `GET /fees/structures` - List all fee templates
- `GET /fees/structures/:id` - Get template details
- `PATCH /fees/structures/:id` - Update template
- `DELETE /fees/structures/:id` - Soft delete template

---

#### 8. Fees Dashboard Analytics Summary (Admin)
- **Endpoint**: `GET /fees/stats/summary`
- **Roles**: `Admin`, `SuperAdmin`
- **Response**: Aggregated stats: `totalInvoiced`, `totalCollected`, `totalDue`, `totalOverdue`, `collectionRate`, `invoicesCount`, and breakdown by fee type.

---

## Support & Contribution

For issues, feature requests, or contributions, please contact the development team.

## License

UNLICENSED

---

**Last Updated**: October 2026
**Version**: 1.5.0


