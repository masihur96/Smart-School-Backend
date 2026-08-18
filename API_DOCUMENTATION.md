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

## Support & Contribution

For issues, feature requests, or contributions, please contact the development team.

## License

UNLICENSED

---

**Last Updated**: August 2026
**Version**: 1.2.0


