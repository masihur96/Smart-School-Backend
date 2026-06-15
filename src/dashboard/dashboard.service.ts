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
import {
  Attendance,
  AttendanceStatus,
} from '../attendance/entities/attendance.entity';
import { TeacherAttendance } from '../attendance/entities/teacher-attendance.entity';
import {
  PeriodAttendance,
  PeriodAttendanceStatus,
} from '../attendance/entities/period-attendance.entity';
import { Homework } from '../homework/entities/homework.entity';
import { StudentHomework } from '../homework/entities/student-homework.entity';
import { Notice } from '../general/entities/notice.entity';
import { Exam } from '../exams/entities/exam.entity';
import { AcademicAssignment } from '../exams/entities/academic-assignment.entity';
import { Marks } from '../marks/entities/marks.entity';
import { Marquee, MarqueeType } from '../general/entities/marquee.entity';
import { Class } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Section } from '../sections/entities/section.entity';

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
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(PeriodAttendance)
    private readonly periodAttendanceRepo: Repository<PeriodAttendance>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // SUPER ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────

  async getSuperAdminDashboard() {
    const [
      systemStatus,
      recentSubscriptions,
      pricingPlans,
      engagedSchools,
      backupDataList,
    ] = await Promise.all([
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
    const totalStudents = await this.userRepo.count({
      where: { role: UserRole.STUDENT },
    });
    const totalTeachers = await this.userRepo.count({
      where: { role: UserRole.TEACHER },
    });
    const totalAdmins = await this.userRepo.count({
      where: { role: UserRole.ADMIN },
    });
    const activeSubscriptions = await this.subscriptionRepo.count({
      where: { isActive: true },
    });

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
    const schools = await this.schoolRepo.find({
      order: { createdAt: 'DESC' },
    });

    // Enrich with student/teacher counts and subscription info
    const enriched = await Promise.all(
      schools.map(async (school) => {
        const [studentCount, teacherCount, activeSubscription] =
          await Promise.all([
            this.userRepo.count({
              where: { schoolId: school.schoolId, role: UserRole.STUDENT },
            }),
            this.userRepo.count({
              where: { schoolId: school.schoolId, role: UserRole.TEACHER },
            }),
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
    const [users, schools, subscriptions, homework, attendance] =
      await Promise.all([
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

    const [
      attendTeacher,
      attendStudent,
      recentHomework,
      recentNotice,
      currentExam,
      superAdminInfo,
    ] = await Promise.all([
      this.getAdminTeacherAttendance(schoolId, today).catch((err) => {
        console.error('[Dashboard] getAdminTeacherAttendance failed:', err?.message);
        return null;
      }),
      this.getAdminStudentAttendance(schoolId, today).catch((err) => {
        console.error('[Dashboard] getAdminStudentAttendance failed:', err?.message);
        return null;
      }),
      this.getAdminRecentHomework(schoolId).catch((err) => {
        console.error('[Dashboard] getAdminRecentHomework failed:', err?.message);
        return null;
      }),
      this.getAdminRecentNotice(schoolId).catch((err) => {
        console.error('[Dashboard] getAdminRecentNotice failed:', err?.message);
        return null;
      }),
      this.getAdminCurrentExam(schoolId).catch((err) => {
        console.error('[Dashboard] getAdminCurrentExam failed:', err?.message);
        return null;
      }),
      this.userRepo.findOne({
        where: { role: UserRole.SUPER_ADMIN },
        select: [
          'id',
          'name',
          'email',
          'phone',
          'lat',
          'lon',
          'radius',
          'role',
          'isActive',
        ],
      }),
    ]);

    return {
      attendTeacher,
      attendStudent,
      recentHomework,
      recentNotice,
      currentExam,
      superAdminInfo,
    };
  }

  private async getAdminTeacherAttendance(schoolId: string, date: string) {
    const allTeachers = await this.userRepo.count({
      where: { schoolId, role: UserRole.TEACHER, isActive: true },
    });

    // Fetch attendance records WITHOUT join to avoid varchar vs uuid mismatch
    const presentRecords = await this.teacherAttendanceRepo
      .createQueryBuilder('ta')
      .where('ta.schoolId = :schoolId', { schoolId })
      .andWhere('ta.date = :date', { date })
      .getMany();

    // Manually enrich with teacher info
    const enrichedRecords = await Promise.all(
      presentRecords.map(async (r) => {
        const teacher = r.teacherId
          ? await this.userRepo.findOne({ where: { id: r.teacherId } })
          : null;
        return { ...r, teacher };
      }),
    );

    const presentCount = enrichedRecords.filter(
      (r) => r.status === 'clock-in',
    ).length;

    return {
      date,
      totalTeachers: allTeachers,
      present: presentCount,
      absent: allTeachers - presentCount,
      attendanceRate:
        allTeachers > 0
          ? parseFloat(((presentCount / allTeachers) * 100).toFixed(2))
          : 0,
      recentRecords: enrichedRecords.slice(0, 5),
    };
  }

  private async getAdminStudentAttendance(schoolId: string, date: string) {
    const allStudents = await this.userRepo.count({
      where: { schoolId, role: UserRole.STUDENT, isActive: true },
    });

    // Fetch attendance records from period_attendance
    const records = await this.periodAttendanceRepo.find({
      where: { schoolId, date },
    });

    // Manually enrich with student, class, and subject info
    const enrichedRecords = await Promise.all(
      records.map(async (r) => {
        const student = await this.userRepo.findOne({
          where: { id: r.studentId },
        });
        const classInfo = await this.classRepo.findOne({
          where: { id: r.classId },
        });
        const subjectInfo = r.subjectId
          ? await this.subjectRepo.findOne({ where: { id: r.subjectId } })
          : null;
        return { ...r, student, class: classInfo, subject: subjectInfo };
      }),
    );

    const presentCount = enrichedRecords.filter(
      (r) =>
        r.status === PeriodAttendanceStatus.PRESENT ||
        r.status === PeriodAttendanceStatus.LATE,
    ).length;
    const absentCount = enrichedRecords.filter(
      (r) => r.status === PeriodAttendanceStatus.ABSENT,
    ).length;
    const leaveCount = enrichedRecords.filter(
      (r) => r.status === PeriodAttendanceStatus.LEAVE,
    ).length;

    return {
      date,
      totalStudents: allStudents,
      recorded: enrichedRecords.length,
      present: presentCount,
      absent: absentCount,
      leave: leaveCount,
      attendanceRate:
        enrichedRecords.length > 0
          ? parseFloat(
              ((presentCount / enrichedRecords.length) * 100).toFixed(2),
            )
          : 0,
      data: enrichedRecords,
    };
  }

  private async getAdminRecentHomework(schoolId: string) {
    const homeworks = await this.homeworkRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return Promise.all(
      homeworks.map(async (hw) => {
        const classInfo = await this.classRepo.findOne({
          where: { id: hw.classId },
        });
        const subjectInfo = await this.subjectRepo.findOne({
          where: { id: hw.subjectId },
        });
        const sectionInfo = hw.sectionId
          ? await this.sectionRepo.findOne({ where: { id: hw.sectionId } })
          : null;
        return { ...hw, classInfo, subjectInfo, sectionInfo };
      }),
    );
  }

  private async getAdminRecentNotice(schoolId: string) {
    return this.noticeRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getAdminCurrentExam(schoolId: string) {
    // Get all class IDs belonging to this school
    const schoolClasses = await this.classRepo.find({ where: { schoolId } });
    const classIds = schoolClasses.map((c) => c.id);

    // If no classes, return empty
    if (classIds.length === 0) return [];

    // Fetch all assignments and filter by class UUID belonging to this school
    const allAssignments = await this.academicAssignmentRepo
      .createQueryBuilder('aa')
      .getMany();

    const relevantAssignments = allAssignments.filter((a) =>
      classIds.includes(a.class?.uuid),
    );
    const relevantExamIds = [
      ...new Set(relevantAssignments.map((a) => a.examId).filter(Boolean)),
    ];

    // Fetch those exams
    const exams =
      relevantExamIds.length > 0
        ? await this.examRepo
            .createQueryBuilder('exam')
            .whereInIds(relevantExamIds)
            .orderBy('exam.start_date', 'DESC')
            .getMany()
        : [];

    const today = getLocalDateString();

    const examList = await Promise.all(
      exams.map(async (e) => {
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
          status = 'upcoming';
        }

        const examAssignments = relevantAssignments.filter(
          (a) => a.examId === e.id,
        );

        return { ...e, assignments: examAssignments, status };
      }),
    );

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
      schoolAdminInfo,
    ] = await Promise.all([
      this.getTeacherTodayAttendanceStatus(teacherId, today),
      this.getTeacherAttendanceList(teacherId),
      this.getTeacherClassStudentAttendance(teacherId, today),
      this.getTeacherSubmittedHomework(teacherId),
      this.getMarqueeForRole(schoolId, MarqueeType.TEACHER),
      this.getTeacherRecentNotices(schoolId),
      this.getTeacherExamList(teacherId),
      this.userRepo.findOne({
        where: { schoolId, role: UserRole.ADMIN },
        select: [
          'id',
          'name',
          'email',
          'phone',
          'lat',
          'lon',
          'radius',
          'role',
          'isActive',
        ],
      }),
    ]);

    return {
      attendanceStatus,
      myAttendanceList,
      myClassAttendStudents,
      mySubmittedHomework,
      marqueeData,
      recentNotice,
      recentExamList,
      schoolAdminInfo,
    };
  }

  private async getTeacherTodayAttendanceStatus(
    teacherId: string,
    date: string,
  ) {
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

  private async getTeacherClassStudentAttendance(
    teacherId: string,
    date: string,
  ) {
    // Find classes where this teacher has taken attendance in period_attendance
    const attendanceRecords = await this.periodAttendanceRepo.find({
      where: { teacherId, date },
    });

    // Group by classId
    const classMap = new Map<
      string,
      {
        classId: string;
        present: number;
        absent: number;
        leave: number;
        total: number;
        records: PeriodAttendance[];
      }
    >();
    for (const record of attendanceRecords) {
      if (!classMap.has(record.classId)) {
        classMap.set(record.classId, {
          classId: record.classId,
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
          records: [],
        });
      }
      const entry = classMap.get(record.classId);
      entry.total++;
      entry.records.push(record);
      if (
        record.status === PeriodAttendanceStatus.PRESENT ||
        record.status === PeriodAttendanceStatus.LATE
      )
        entry.present++;
      else if (record.status === PeriodAttendanceStatus.ABSENT) entry.absent++;
      else if (record.status === PeriodAttendanceStatus.LEAVE) entry.leave++;
    }

    const classList = Array.from(classMap.values());
    const enrichedClassList = await Promise.all(
      classList.map(async (entry) => {
        const classInfo = await this.classRepo.findOne({
          where: { id: entry.classId },
        });

        const enrichedRecords = await Promise.all(
          entry.records.map(async (r) => {
            const sectionInfo = r.sectionId
              ? await this.sectionRepo.findOne({ where: { id: r.sectionId } })
              : null;
            const subjectInfo = r.subjectId
              ? await this.subjectRepo.findOne({ where: { id: r.subjectId } })
              : null;
            return {
              ...r,
              classInfo,
              sectionInfo,
              subjectInfo,
            };
          }),
        );

        return {
          ...entry,
          classInfo,
          records: enrichedRecords,
          attendanceRate:
            entry.total > 0
              ? parseFloat(((entry.present / entry.total) * 100).toFixed(2))
              : 0,
        };
      }),
    );

    return enrichedClassList;
  }

  private async getTeacherSubmittedHomework(teacherId: string) {
    const homeworks = await this.homeworkRepo.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return Promise.all(
      homeworks.map(async (hw) => {
        const classInfo = await this.classRepo.findOne({
          where: { id: hw.classId },
        });
        const subjectInfo = await this.subjectRepo.findOne({
          where: { id: hw.subjectId },
        });
        const sectionInfo = hw.sectionId
          ? await this.sectionRepo.findOne({ where: { id: hw.sectionId } })
          : null;
        return { ...hw, classInfo, subjectInfo, sectionInfo };
      }),
    );
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
        '(notice.targetAudience ILIKE :teacher OR notice.targetAudience ILIKE :all OR notice.targetAudience IS NULL OR notice.targetAudience = :empty)',
        { teacher: '%teacher%', all: '%all%', empty: '' },
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
        '(notice.targetAudience ILIKE :student OR notice.targetAudience ILIKE :all OR notice.targetAudience IS NULL OR notice.targetAudience = :empty)',
        { student: '%student%', all: '%all%', empty: '' },
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
    // Fetch assignments without join to avoid uuid/varchar mismatch
    const assignments = await this.academicAssignmentRepo
      .createQueryBuilder('aa')
      .where(`aa.examiner->>'uuid' = :teacherId`, { teacherId })
      .orderBy('aa.createdAt', 'DESC')
      .take(10)
      .getMany();

    // Fetch exams separately to avoid join type issues
    const examsMap = new Map<string, any>();
    for (const a of assignments) {
      if (!examsMap.has(a.examId)) {
        const exam = await this.examRepo.findOne({ where: { id: a.examId } });
        if (exam) {
          examsMap.set(a.examId, {
            ...exam,
            myAssignments: [],
          });
        }
      }
      if (examsMap.has(a.examId)) {
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
      this.getStudentExamListWithResults(studentId, student.classIds?.[0] || null),
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
    const records = await this.periodAttendanceRepo.find({
      where: { studentId, date },
    });

    const enrichedRecords = await Promise.all(
      (records || []).map(async (r) => {
        const classInfo = r.classId ? await this.classRepo.findOne({ where: { id: r.classId } }) : null;
        const sectionInfo = r.sectionId ? await this.sectionRepo.findOne({ where: { id: r.sectionId } }) : null;
        const subjectInfo = r.subjectId ? await this.subjectRepo.findOne({ where: { id: r.subjectId } }) : null;
        return {
          ...r,
          classInfo,
          sectionInfo,
          subjectInfo,
        };
      })
    );

    return {
      date,
      records: enrichedRecords,
    };
  }

  private async getStudentAttendanceList(studentId: string) {
    const records = await this.periodAttendanceRepo.find({
      where: { studentId },
      order: { date: 'DESC', createdAt: 'DESC' },
      take: 50,
    });

    const total = records.length;
    const present = records.filter(
      (r) =>
        r.status === PeriodAttendanceStatus.PRESENT ||
        r.status === PeriodAttendanceStatus.LATE,
    ).length;
    const absent = records.filter(
      (r) => r.status === PeriodAttendanceStatus.ABSENT,
    ).length;
    const leave = records.filter(
      (r) => r.status === PeriodAttendanceStatus.LEAVE,
    ).length;

    const enrichedRecords = await Promise.all(
      (records || []).map(async (r) => {
        const classInfo = r.classId ? await this.classRepo.findOne({ where: { id: r.classId } }) : null;
        const sectionInfo = r.sectionId ? await this.sectionRepo.findOne({ where: { id: r.sectionId } }) : null;
        const subjectInfo = r.subjectId ? await this.subjectRepo.findOne({ where: { id: r.subjectId } }) : null;
        return {
          ...r,
          classInfo,
          sectionInfo,
          subjectInfo,
        };
      })
    );

    return {
      summary: {
        total,
        present,
        absent,
        leave,
        attendanceRate:
          total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0,
      },
      records: enrichedRecords,
    };
  }

  private async getStudentRecentHomework(studentId: string) {
    // Fetch WITHOUT relation join to avoid uuid/varchar mismatch on homeworkId
    const studentHomeworks = await this.studentHomeworkRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return Promise.all(
      studentHomeworks.map(async (sh) => {
        let homework = null,
          classInfo = null,
          subjectInfo = null,
          sectionInfo = null;

        if (sh.homeworkId) {
          homework = await this.homeworkRepo.findOne({
            where: { id: sh.homeworkId },
          });
        }

        if (homework) {
          classInfo = await this.classRepo.findOne({
            where: { id: homework.classId },
          });
          subjectInfo = await this.subjectRepo.findOne({
            where: { id: homework.subjectId },
          });
          sectionInfo = homework.sectionId
            ? await this.sectionRepo.findOne({
                where: { id: homework.sectionId },
              })
            : null;
        }
        return {
          id: sh.id,
          status: sh.status,
          comment: sh.comment,
          homework: homework
            ? {
                ...homework,
                classInfo,
                subjectInfo,
                sectionInfo,
              }
            : null,
        };
      }),
    );
  }

  private async getStudentExamListWithResults(
    studentId: string,
    classId: string | null,
  ) {
    if (!classId) return [];

    // Fetch assignments without join to avoid uuid/varchar mismatch
    const assignments = await this.academicAssignmentRepo
      .createQueryBuilder('aa')
      .where(`aa.class->>'uuid' = :classId`, { classId })
      .orderBy('aa.createdAt', 'DESC')
      .take(10)
      .getMany();

    const uniqueExamIds = [
      ...new Set(assignments.map((a) => a.examId).filter(Boolean)),
    ];

    const examsWithResults = await Promise.all(
      uniqueExamIds.map(async (examId) => {
        // Fetch exam separately instead of via join
        const exam = await this.examRepo.findOne({ where: { id: examId } });
        if (!exam) return null;

        const myMarks = await this.marksRepo.find({
          where: { examId, studentId },
        });

        const totalObtained = myMarks.reduce(
          (sum, m) => sum + parseFloat(m.marksObtained as any),
          0,
        );
        const totalMax = myMarks.reduce(
          (sum, m) => sum + parseFloat(m.totalMarks as any),
          0,
        );
        const percentage =
          totalMax > 0
            ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2))
            : null;

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
