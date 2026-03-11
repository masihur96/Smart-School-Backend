# Smart School Backend - Quick Start Guide

## 📋 Prerequisites

Before you begin, ensure you have installed:
- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **PostgreSQL** (v12 or higher)

Verify installation:
```bash
node -v    # Should be v18+
npm -v     # Should be v8+
psql -V    # Should be PostgreSQL v12+
```

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=smart_school
JWT_SECRET=your-secret-key-change-this
```

### 3. Create Database
```bash
# Using PostgreSQL
createdb smart_school

# Or using psql
psql -U postgres -c "CREATE DATABASE smart_school;"
```

### 4. Start Development Server
```bash
npm run start:dev
```

You should see:
```
Smart School Backend API is running on http://localhost:3000
Swagger documentation is available at http://localhost:3000/api/docs
```

### 5. Access the API
- **API Base URL**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

## 🔑 Test Login Flow

### 1. Create a User
Use Swagger UI or cURL:

```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Teacher",
    "email": "teacher@school.com",
    "password": "password123",
    "role": "teacher",
    "schoolId": "school-uuid"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "uuid",
    "name": "Test Teacher",
    "email": "teacher@school.com",
    "role": "teacher"
  }
}
```

### 3. Use the Token
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/auth/profile
```

## 📚 Key Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login user |
| GET | `/auth/profile` | Get current user profile |

### Admin Users Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List users |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |

### Admin Classes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/classes` | List classes |
| POST | `/admin/classes` | Create class |
| PUT | `/admin/classes/:id` | Update class |
| DELETE | `/admin/classes/:id` | Delete class |

### Teacher Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/teacher/attendance` | Submit attendance |
| GET | `/teacher/attendance` | Get attendance |
| POST | `/teacher/marks` | Submit marks |
| POST | `/teacher/homework` | Create homework |

### Student Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/results` | Get exam results |
| GET | `/student/attendance` | Get attendance |
| GET | `/student/routine` | Get class schedule |

### General
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/general/notices` | List notices |
| POST | `/general/notices` | Create notice (admin) |
| GET | `/general/routine` | List routines |

## 🛠️ Development Tips

### Debug Mode
```bash
npm run start:debug
```

### Run Tests
```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

### Code Formatting
```bash
npm run format         # Auto-format code
npm run lint           # Check linting
npm run lint --fix     # Fix linting issues
```

## 📁 Project Structure Quick Reference

```
src/
├── auth/              # Authentication (Login, JWT, Strategies)
├── users/             # User management (CRUD)
├── admin/             # Admin operations (Users, Classes, Subjects, Exams)
├── teacher/           # Teacher operations (Attendance, Marks, Homework)
├── student/           # Student services (Results, Attendance, Routine)
├── classes/           # Class management
├── subjects/          # Subject management
├── exams/             # Exam management
├── attendance/        # Attendance tracking
├── marks/             # Marks management
├── homework/          # Homework management
├── general/           # General services (Notices, Routines)
├── app.module.ts      # Main app module
└── main.ts            # Application entry point
```

## 🔗 Module Dependencies

- **AuthModule** → uses UsersModule
- **AdminModule** → uses Users, Classes, Subjects, Exams
- **TeacherModule** → uses Attendance, Marks, Homework, Exams
- **StudentModule** → uses Exams, Attendance, General, Homework
- **GeneralModule** → standalone (Notices, Routines)

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: 
- Ensure PostgreSQL is running
- Check DB credentials in `.env`
- Verify database exists: `psql -l`

### JWT Errors
```
401 Unauthorized
```
**Solution**:
- Include Authorization header: `Authorization: Bearer TOKEN`
- Ensure token is not expired
- Check JWT_SECRET is set in `.env`

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run start:dev
```

## 📞 Support

- Check API documentation: http://localhost:3000/api/docs
- Review this Quick Start Guide
- Check API_DOCUMENTATION.md for detailed API reference

## 🎯 Next Steps

1. Create sample data in the database
2. Test authentication flow
3. Explore API endpoints using Swagger UI
4. Integrate with your Flutter mobile app
5. Deploy to production

---

**Happy Coding! 🚀**
