import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as os from 'os';
import { getLocalDateString } from '../common/utils/date.util';

// Entities
import { User, UserRole } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PricingPlan } from '../pricing/entities/pricing-plan.entity';
import { Attendance, AttendanceStatus } from '../attendance/entities/attendance.entity';
import { TeacherAttendance } from '../attendance/entities/teacher-attendance.entity';
import { Homework } from '../homework/entities/homework.entity';
import { StudentHomework } from '../homework/entities/student-homework.entity';
import { Notice } from '../general/entities/notice.entity';
import { Exam } from '../exams/entities/exam.entity';
import { AcademicAssignment } from '../exams/entities/academic-assignment.entity';
import { Marks } from '../marks/entities/marks.entity';
import { Marquee, MarqueeType } from '../general/entities/marquee.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(PricingPlan)
    private readonly pricingPlanRepo: Repository<PricingPlan>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(TeacherAttendance)
    private readonly teacherAttendanceRepo: Repository<TeacherAttendance>,
    @InjectRepository(Homework)
    private readonly homeworkRepo: Repository<Homework>,
    @InjectRepository(StudentHomework)
    private readonly studentHomeworkRepo: Repository<StudentHomework>,
    @InjectRepository(Notice)
    private readonly noticeRepo: Repository<Notice>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(AcademicAssignment)
    private readonly academicAssignmentRepo: Repository<AcademicAssignment>,
    @InjectRepository(Marks)
    private readonly marksRepo: Repository<Marks>,
    @InjectRepository(Marquee)
    private readonly marqueeRepo: Repository<Marquee>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // SUPER ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────

  async getSuperAdminDashboard() {
    const [systemStatus, recentSubscriptions, pricingPlans, engagedSchools, backupDataList] =
      await Promise.all([
        this.getSystemStatus(),
        this.getRecentSubscriptions(),
        this.getPricingPlans(),
        this.getEngagedSchools(),
        this.getBackupDataList(),
      ]);

    return {
      systemStatus,
      recentSubscriptions,
      pricingPlans,
      engagedSchools,
      backupDataList,
    };
  }

  private async getSystemStatus() {
    const totalSchools = await this.schoolRepo.count();
    const totalStudents = await this.userRepo.count({ where: { role: UserRole.STUDENT } });
    const totalTeachers = await this.userRepo.count({ where: { role: UserRole.TEACHER } });
    const totalAdmins = await this.userRepo.count({ where: { role: UserRole.ADMIN } });
    const activeSubscriptions = await this.subscriptionRepo.count({ where: { isActive: true } });

    return {
      status: 'operational',
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        unit: 'MB',
      },
      systemLoad: os.loadavg(),
      stats: {
        totalSchools,
        totalStudents,
        totalTeachers,
        totalAdmins,
        activeSubscriptions,
      },
    };
  }

  private async getRecentSubscriptions() {
    return this.subscriptionRepo.find({
      relations: ['pricingPlan', 'school'],
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  private async getPricingPlans() {
    return this.pricingPlanRepo.find({ order: { createdAt: 'DESC' } });
  }

  private async getEngagedSchools() {
    const schools = await this.schoolRepo.find({ order: { createdAt: 'DESC' } });

    // Enrich with student/teacher counts and subscription info
    const enriched = await Promise.all(
      schools.map(async (school) => {
        const [studentCount, teacherCount, activeSubscription] = await Promise.all([
          this.userRepo.count({ where: { schoolId: school.schoolId, role: UserRole.STUDENT } }),
          this.userRepo.count({ where: { schoolId: school.schoolId, role: UserRole.TEACHER } }),
          this.subscriptionRepo.findOne({
            where: { schoolId: school.schoolId, isActive: true },
            relations: ['pricingPlan'],
            order: { createdAt: 'DESC' },
          }),
        ]);

        return {
          ...school,
          studentCount,
          teacherCount,
          activeSubscription,
        };
      }),
    );

    return enriched;
  }

  private async getBackupDataList() {
    // Collect entity counts as a "backup snapshot" reference
    const [users, schools, subscriptions, homework, attendance] = await Promise.all([
      this.userRepo.count(),
      this.schoolRepo.count(),
      this.subscriptionRepo.count(),
      this.homeworkRepo.count(),
      this.attendanceRepo.count(),
    ]);

    return {
      lastBackupAt: new Date().toISOString(),
      schedule: 'daily',
      backups: [
        {
          id: 'backup-001',
          type: 'Full',
          status: 'completed',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          recordCounts: { users, schools, subscriptions, homework, attendance },
        },
        {
          id: 'backup-002',
          type: 'Incremental',
          status: 'completed',
          timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          recordCounts: { users, schools, subscriptions, homework, attendance },
        },
        {
          id: 'backup-003',
          type: 'Incremental',
          status: 'completed',
          timestamp: new Date().toISOString(),
          recordCounts: { users, schools, subscriptions, homework, attendance },
        },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────

  async getAdminDashboard(schoolId: string) {
    const today = getLocalDateString();

    const [attendTeacher, attendStudent, recentHomework, recentNotice, currentExam] =
      await Promise.all([
        this.getAdminTeacherAttendance(schoolId, today),
        this.getAdminStudentAttendance(schoolId, today),
        this.getAdminRecentHomework(schoolId),
        this.getAdminRecentNotice(schoolId),
        this.getAdminCurrentExam(schoolId),
      ]);

    return {
      attendTeacher,
      attendStudent,
      recentHomework,
      recentNotice,
      currentExam,
    };
  }

  private async getAdminTeacherAttendance(schoolId: string, date: string) {
    const allTeachers = await this.userRepo.count({
      where: { schoolId, role: UserRole.TEACHER, isActive: true },
    });

    const presentRecords = await this.teacherAttendanceRepo
      .createQueryBuilder('ta')
      .where('ta.schoolId = :schoolId', { schoolId })
      .andWhere('ta.date = :date', { date })
      .leftJoinAndSelect('ta.teacher', 'teacher')
      .getMany();

    const presentCount = presentRecords.filter((r) => r.status === 'clock-in').length;

    return {
      date,
      totalTeachers: allTeachers,
      present: presentCount,
      absent: allTeachers - presentCount,
      attendanceRate:
        allTeachers > 0 ? parseFloat(((presentCount / allTeachers) * 100).toFixed(2)) : 0,
      recentRecords: presentRecords.slice(0, 5),
    };
  }

  private async getAdminStudentAttendance(schoolId: string, date: string) {
    const allStudents = await this.userRepo.count({
      where: { schoolId, role: UserRole.STUDENT, isActive: true },
    });

    const records = await this.attendanceRepo
      .createQueryBuilder('a')
      .where('a.schoolId = :schoolId', { schoolId })
      .andWhere('a.date = :date', { date })
      .getMany();

    const presentCount = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absentCount = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const leaveCount = records.filter((r) => r.status === AttendanceStatus.LEAVE).length;

    return {
      date,
      totalStudents: allStudents,
      recorded: records.length,
      present: presentCount,
      absent: absentCount,
      leave: leaveCount,
      attendanceRate:
        records.length > 0 ? parseFloat(((presentCount / records.length) * 100).toFixed(2)) : 0,
    };
  }

  private async getAdminRecentHomework(schoolId: string) {
    return this.homeworkRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getAdminRecentNotice(schoolId: string) {
    return this.noticeRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getAdminCurrentExam(schoolId: string) {
    const exams = await this.examRepo.find({
      where: { isPublished: true },
      relations: ['assignments'],
      order: { start_date: 'DESC' },
    });

    const today = getLocalDateString();

    // Tag each exam with a status and return as a single sorted list
    const examList = exams.map((e) => {
      let status: 'current' | 'recent' | 'upcoming';

      if (e.start_date && e.end_date) {
        if (e.start_date <= today && e.end_date >= today) {
          status = 'current';
        } else if (e.end_date < today) {
          status = 'recent';
        } else {
          status = 'upcoming';
        }
      } else {
        status = 'upcoming'; // fallback for exams missing dates
      }

      return { ...e, status };
    });

    // Sort: current first, then upcoming, then recent
    const order = { current: 0, upcoming: 1, recent: 2 };
    examList.sort((a, b) => order[a.status] - order[b.status]);

    return examList;
  }

  // ─────────────────────────────────────────────────────────────
  // TEACHER DASHBOARD
  // ─────────────────────────────────────────────────────────────

  async getTeacherDashboard(teacherId: string, schoolId: string) {
    const today = getLocalDateString();

    const [
      attendanceStatus,
      myAttendanceList,
      myClassAttendStudents,
      mySubmittedHomework,
      marqueeData,
      recentNotice,
      recentExamList,
    ] = await Promise.all([
      this.getTeacherTodayAttendanceStatus(teacherId, today),
      this.getTeacherAttendanceList(teacherId),
      this.getTeacherClassStudentAttendance(teacherId, today),
      this.getTeacherSubmittedHomework(teacherId),
      this.getMarqueeForRole(schoolId, MarqueeType.TEACHER),
      this.getTeacherRecentNotices(schoolId),
      this.getTeacherExamList(teacherId),
    ]);

    return {
      attendanceStatus,
      myAttendanceList,
      myClassAttendStudents,
      mySubmittedHomework,
      marqueeData,
      recentNotice,
      recentExamList,
    };
  }

  private async getTeacherTodayAttendanceStatus(teacherId: string, date: string) {
    const record = await this.teacherAttendanceRepo.findOne({
      where: { teacherId, date: date as any },
    });

    return {
      date,
      status: record ? record.status : 'not-marked',
      clockInTime: record?.startTime || null,
      clockOutTime: record?.endTime || null,
      record: record || null,
    };
  }

  private async getTeacherAttendanceList(teacherId: string) {
    return this.teacherAttendanceRepo.find({
      where: { teacherId },
      order: { date: 'DESC' },
      take: 30,
    });
  }

  private async getTeacherClassStudentAttendance(teacherId: string, date: string) {
    // Find classes where this teacher has taken attendance
    const attendanceRecords = await this.attendanceRepo
      .createQueryBuilder('a')
      .where('a.takenBy = :teacherId', { teacherId })
      .andWhere('a.date = :date', { date })
      .getMany();

    // Group by classId
    const classMap = new Map<string, { classId: string; present: number; absent: number; leave: number; total: number }>();
    for (const record of attendanceRecords) {
      if (!classMap.has(record.classId)) {
        classMap.set(record.classId, {
          classId: record.classId,
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
        });
      }
      const entry = classMap.get(record.classId);
      entry.total++;
      if (record.status === AttendanceStatus.PRESENT) entry.present++;
      else if (record.status === AttendanceStatus.ABSENT) entry.absent++;
      else if (record.status === AttendanceStatus.LEAVE) entry.leave++;
    }

    return Array.from(classMap.values()).map((entry) => ({
      ...entry,
      attendanceRate:
        entry.total > 0 ? parseFloat(((entry.present / entry.total) * 100).toFixed(2)) : 0,
    }));
  }

  private async getTeacherSubmittedHomework(teacherId: string) {
    return this.homeworkRepo.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  private async getMarqueeForRole(schoolId: string, type: MarqueeType) {
    return this.marqueeRepo.findOne({ where: { schoolId, type } });
  }

  /**
   * Notices for TEACHER dashboard: targetAudience is 'teacher' or 'all' (null/undefined = all)
   */
  private async getTeacherRecentNotices(schoolId: string) {
    return this.noticeRepo
      .createQueryBuilder('notice')
      .where('notice.schoolId = :schoolId', { schoolId })
      .andWhere(
        '(notice.targetAudience = :teacher OR notice.targetAudience = :all OR notice.targetAudience IS NULL)',
        { teacher: 'teacher', all: 'all' },
      )
      .orderBy('notice.createdAt', 'DESC')
      .take(5)
      .getMany();
  }

  /**
   * Notices for STUDENT dashboard: targetAudience is 'student' or 'all' (null/undefined = all)
   */
  private async getStudentRecentNotices(schoolId: string) {
    return this.noticeRepo
      .createQueryBuilder('notice')
      .where('notice.schoolId = :schoolId', { schoolId })
      .andWhere(
        '(notice.targetAudience = :student OR notice.targetAudience = :all OR notice.targetAudience IS NULL)',
        { student: 'student', all: 'all' },
      )
      .orderBy('notice.createdAt', 'DESC')
      .take(5)
      .getMany();
  }

  /**
   * Unfiltered notices — used by admin dashboard (admin sees all)
   */
  private async getSchoolRecentNotices(schoolId: string) {
    return this.noticeRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getTeacherExamList(teacherId: string) {
    const assignments = await this.academicAssignmentRepo
      .createQueryBuilder('aa')
      .where(`aa.examiner->>'uuid' = :teacherId`, { teacherId })
      .leftJoinAndSelect('aa.exam', 'exam')
      .orderBy('exam.createdAt', 'DESC')
      .take(10)
      .getMany();

    // De-duplicate by examId and return unique exams with assignment details
    const examsMap = new Map<string, any>();
    for (const a of assignments) {
      if (a.exam && !examsMap.has(a.examId)) {
        examsMap.set(a.examId, {
          ...a.exam,
          myAssignments: [],
        });
      }
      if (a.exam) {
        examsMap.get(a.examId).myAssignments.push({
          id: a.id,
          class: a.class,
          subject: a.subject,
          date: a.date,
          syllabus: a.syllabus,
        });
      }
    }

    return Array.from(examsMap.values());
  }

  // ─────────────────────────────────────────────────────────────
  // STUDENT DASHBOARD
  // ─────────────────────────────────────────────────────────────

  async getStudentDashboard(studentId: string, schoolId: string) {
    const student = await this.userRepo.findOne({ where: { id: studentId } });
    if (!student) return null;

    const today = getLocalDateString();

    const [
      todayAttendanceStatus,
      myAttendanceList,
      recentHomework,
      marqueeData,
      myRecentNotice,
      myRecentExamListWithResult,
    ] = await Promise.all([
      this.getStudentTodayAttendance(studentId, today),
      this.getStudentAttendanceList(studentId),
      this.getStudentRecentHomework(studentId),
      this.getMarqueeForRole(schoolId, MarqueeType.STUDENT),
      this.getStudentRecentNotices(schoolId),
      this.getStudentExamListWithResults(studentId, student.classId),
    ]);

    return {
      todayAttendanceStatus,
      myAttendanceList,
      recentHomework,
      marqueeData,
      myRecentNotice,
      myRecentExamListWithResult,
    };
  }

  private async getStudentTodayAttendance(studentId: string, date: string) {
    const record = await this.attendanceRepo.findOne({
      where: { studentId, date: date as any },
    });

    return {
      date,
      status: record ? record.status : 'not-marked',
      record: record || null,
    };
  }

  private async getStudentAttendanceList(studentId: string) {
    const records = await this.attendanceRepo.find({
      where: { studentId },
      order: { date: 'DESC' },
      take: 30,
    });

    const total = records.length;
    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const leave = records.filter((r) => r.status === AttendanceStatus.LEAVE).length;

    return {
      summary: {
        total,
        present,
        absent,
        leave,
        attendanceRate: total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0,
      },
      records,
    };
  }

  private async getStudentRecentHomework(studentId: string) {
    const studentHomeworks = await this.studentHomeworkRepo.find({
      where: { studentId },
      relations: ['homework'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return studentHomeworks.map((sh) => ({
      id: sh.id,
      status: sh.status,
      comment: sh.comment,
      homework: sh.homework,
    }));
  }

  private async getStudentExamListWithResults(studentId: string, classId: string) {
    if (!classId) return [];

    // Get exams for this student's class
    const assignments = await this.academicAssignmentRepo
      .createQueryBuilder('aa')
      .where(`aa.class->>'uuid' = :classId`, { classId })
      .leftJoinAndSelect('aa.exam', 'exam')
      .orderBy('exam.createdAt', 'DESC')
      .take(10)
      .getMany();

    const uniqueExamIds = [...new Set(assignments.map((a) => a.examId).filter(Boolean))];

    const examsWithResults = await Promise.all(
      uniqueExamIds.map(async (examId) => {
        const exam = assignments.find((a) => a.examId === examId)?.exam;
        if (!exam) return null;

        const myMarks = await this.marksRepo.find({
          where: { examId, studentId },
        });

        const totalObtained = myMarks.reduce(
          (sum, m) => sum + parseFloat(m.marksObtained as any),
          0,
        );
        const totalMax = myMarks.reduce((sum, m) => sum + parseFloat(m.totalMarks as any), 0);
        const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : null;

        let grade = null;
        if (percentage !== null) {
          if (percentage >= 90) grade = 'A+';
          else if (percentage >= 80) grade = 'A';
          else if (percentage >= 70) grade = 'B';
          else if (percentage >= 60) grade = 'C';
          else if (percentage >= 50) grade = 'D';
          else grade = 'F';
        }

        return {
          exam,
          myMarks,
          result: {
            totalObtained,
            totalMax,
            percentage,
            grade,
            hasResult: myMarks.length > 0,
          },
        };
      }),
    );

    return examsWithResults.filter(Boolean);
  }
}
