import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Attendance, AttendanceStatus } from '../attendance/entities/attendance.entity';
import { PeriodAttendance, PeriodAttendanceStatus } from '../attendance/entities/period-attendance.entity';
import { TeacherAttendance } from '../attendance/entities/teacher-attendance.entity';
import { StudentHomework, StudentHomeworkStatus } from '../homework/entities/student-homework.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Marks } from '../marks/entities/marks.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { Section } from '../sections/entities/section.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(PeriodAttendance)
    private periodAttendanceRepository: Repository<PeriodAttendance>,
    @InjectRepository(TeacherAttendance)
    private teacherAttendanceRepository: Repository<TeacherAttendance>,
    @InjectRepository(StudentHomework)
    private studentHomeworkRepository: Repository<StudentHomework>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(Marks)
    private marksRepository: Repository<Marks>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
  ) {}

  private getDateRange(month?: string, year?: string): { startDate: Date; endDate: Date } | null {
    if (!year && !month) return null;

    let y = year ? parseInt(year, 10) : new Date().getFullYear();
    if (isNaN(y)) y = new Date().getFullYear();

    if (month) {
      const m = parseInt(month, 10);
      if (!isNaN(m) && m >= 1 && m <= 12) {
        const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        return { startDate, endDate };
      }
    }

    const startDate = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  private getDateCondition(fieldName: string, month?: string, year?: string) {
    const range = this.getDateRange(month, year);
    if (!range) return {};
    return { [fieldName]: Between(range.startDate, range.endDate) };
  }

  async getStudentPerformance(
    studentId: string,
    schoolId: string,
    month?: string,
    year?: string,
  ) {
    // Verify student exists
    const student = await this.userRepository.findOne({
      where: { id: studentId, schoolId, role: UserRole.STUDENT },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const dateRange = this.getDateRange(month, year);

    // 1. Attendance Performance (Legacy + Period)
    let attQB = this.attendanceRepository
      .createQueryBuilder('att')
      .select('COUNT(1)', 'totalWorkingDays')
      .addSelect(
        `COUNT(CASE WHEN att.status = :presentStatus THEN 1 END)`,
        'presentDays',
      )
      .where('att.studentId = :studentId', { studentId })
      .andWhere('att.schoolId = :schoolId', { schoolId })
      .setParameter('presentStatus', AttendanceStatus.PRESENT);

    if (dateRange) {
      attQB = attQB.andWhere('att.date BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const attRes = await attQB.getRawOne();
    
    let periodAttQB = this.periodAttendanceRepository
      .createQueryBuilder('pa')
      .select('COUNT(1)', 'totalWorkingDays')
      .addSelect(
        `COUNT(CASE WHEN pa.status = :presentStatus THEN 1 END)`,
        'presentDays',
      )
      .where('pa.studentId = :studentId', { studentId })
      .andWhere('pa.schoolId = :schoolId', { schoolId })
      .setParameter('presentStatus', PeriodAttendanceStatus.PRESENT);

    if (dateRange) {
      periodAttQB = periodAttQB.andWhere('pa.date >= :startDate AND pa.date <= :endDate', {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });
    }

    const periodAttRes = await periodAttQB.getRawOne();

    const totalWorkingDays = (parseInt(attRes?.totalWorkingDays, 10) || 0) + (parseInt(periodAttRes?.totalWorkingDays, 10) || 0);
    const presentDays = (parseInt(attRes?.presentDays, 10) || 0) + (parseInt(periodAttRes?.presentDays, 10) || 0);
    const attendancePercentage =
      totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

    // 2. Homework Performance
    let hwQB = this.studentHomeworkRepository
      .createQueryBuilder('sh')
      .select('COUNT(1)', 'totalAssigned')
      .addSelect(
        `COUNT(CASE WHEN sh.status = :doneStatus THEN 1 END)`,
        'totalDone',
      )
      .where('sh.studentId = :studentId', { studentId })
      .setParameter('doneStatus', StudentHomeworkStatus.DONE);

    if (dateRange) {
      hwQB = hwQB.andWhere('sh.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const hwRes = await hwQB.getRawOne();
    const totalHomeworkAssigned = parseInt(hwRes?.totalAssigned, 10) || 0;
    const totalHomeworkDone = parseInt(hwRes?.totalDone, 10) || 0;
    const homeworkPercentage =
      totalHomeworkAssigned > 0
        ? (totalHomeworkDone / totalHomeworkAssigned) * 100
        : 0;

    // 3. Exam Performance (Average Marks)
    let marksQB = this.marksRepository
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.marksObtained), 0)', 'totalMarksObtained')
      .addSelect('COALESCE(SUM(m.totalMarks), 0)', 'totalMaximumMarks')
      .where('m.studentId = :studentId', { studentId })
      .andWhere('m.schoolId = :schoolId', { schoolId });

    if (dateRange) {
      marksQB = marksQB.andWhere('m.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const marksRes = await marksQB.getRawOne();
    const totalMarksObtained = parseFloat(marksRes?.totalMarksObtained) || 0;
    const totalMaximumMarks = parseFloat(marksRes?.totalMaximumMarks) || 0;
    const examPercentage =
      totalMaximumMarks > 0
        ? (totalMarksObtained / totalMaximumMarks) * 100
        : 0;

    let studentClass: Class | null = null;
    let studentSection: Section | null = null;

    if (student.classIds && student.classIds.length > 0 && student.classIds[0]) {
      studentClass = await this.classRepository.findOne({
        where: { id: student.classIds[0] },
      });
    }

    if (
      student.sectionIds &&
      student.sectionIds.length > 0 &&
      student.sectionIds[0]
    ) {
      studentSection = await this.sectionRepository.findOne({
        where: { id: student.sectionIds[0] },
      });
    }

    return {
      studentId: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      class: studentClass,
      section: studentSection,
      attendance: {
        totalWorkingDays,
        presentDays,
        percentage: Number(attendancePercentage.toFixed(2)),
      },
      homework: {
        totalAssigned: totalHomeworkAssigned,
        totalDone: totalHomeworkDone,
        percentage: Number(homeworkPercentage.toFixed(2)),
      },
      exams: {
        totalMarksObtained,
        totalMaximumMarks,
        percentage: Number(examPercentage.toFixed(2)),
      },
    };
  }

  async getTeacherPerformance(
    teacherId: string,
    schoolId: string,
    month?: string,
    year?: string,
  ) {
    // Verify teacher exists
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, schoolId, role: UserRole.TEACHER },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const dateRange = this.getDateRange(month, year);

    // 1. Teacher present days (unique dates)
    let teacherAttQB = this.teacherAttendanceRepository
      .createQueryBuilder('ta')
      .select('COUNT(DISTINCT DATE(ta.date))', 'count')
      .where('ta.teacherId = :teacherId', { teacherId })
      .andWhere('ta.schoolId = :schoolId', { schoolId });

    if (dateRange) {
      teacherAttQB = teacherAttQB.andWhere(
        'ta.date BETWEEN :startDate AND :endDate',
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      );
    }

    const teacherAttRes = await teacherAttQB.getRawOne();
    const presentDays = parseInt(teacherAttRes?.count, 10) || 0;

    // 2. Total working days for the school based on any teacher's attendance
    let totalWorkingDaysQB = this.teacherAttendanceRepository
      .createQueryBuilder('ta')
      .select('COUNT(DISTINCT DATE(ta.date))', 'count')
      .where('ta.schoolId = :schoolId', { schoolId });

    if (dateRange) {
      totalWorkingDaysQB = totalWorkingDaysQB.andWhere(
        'ta.date BETWEEN :startDate AND :endDate',
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      );
    }

    const totalWorkingDaysQuery = await totalWorkingDaysQB.getRawOne();
    const totalWorkingDays = parseInt(totalWorkingDaysQuery?.count, 10) || 0;

    const attendancePercentage =
      totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

    // 3. Homework Provided
    let hwQB = this.homeworkRepository
      .createQueryBuilder('hw')
      .select('COUNT(1)', 'count')
      .where('hw.teacherId = :teacherId', { teacherId })
      .andWhere('hw.schoolId = :schoolId', { schoolId });

    if (dateRange) {
      hwQB = hwQB.andWhere('hw.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const hwRes = await hwQB.getRawOne();
    const totalHomeworkProvided = parseInt(hwRes?.count, 10) || 0;

    // Assume a generic target of 10 homeworks for now, since there's no fixed target in DB
    const homeworkTarget = 10;
    const homeworkPercentage = (totalHomeworkProvided / homeworkTarget) * 100;

    return {
      teacherId: teacher.id,
      name: teacher.name,
      designation: teacher.designation,
      attendance: {
        totalWorkingDays,
        presentDays,
        percentage: Number(attendancePercentage.toFixed(2)),
      },
      homework: {
        totalProvided: totalHomeworkProvided,
        target: homeworkTarget,
        percentage: Number(Math.min(homeworkPercentage, 100).toFixed(2)),
      },
    };
  }

  async getAllStudentsPerformance(
    schoolId: string,
    month?: string,
    year?: string,
  ) {
    const students = await this.userRepository.find({
      where: { schoolId, role: UserRole.STUDENT },
      select: ['id', 'name', 'rollNumber', 'classIds', 'sectionIds'],
      order: { rollNumber: 'ASC', name: 'ASC' },
    });

    if (!students || students.length === 0) {
      return [];
    }

    const dateRange = this.getDateRange(month, year);

    // 1. Batch load classes and sections
    const classIdSet = new Set<string>();
    const sectionIdSet = new Set<string>();
    students.forEach((s) => {
      if (s.classIds && s.classIds.length > 0 && s.classIds[0]) {
        classIdSet.add(s.classIds[0]);
      }
      if (s.sectionIds && s.sectionIds.length > 0 && s.sectionIds[0]) {
        sectionIdSet.add(s.sectionIds[0]);
      }
    });

    const [classes, sections] = await Promise.all([
      classIdSet.size > 0
        ? this.classRepository.find({
            where: { id: In(Array.from(classIdSet)) },
          })
        : Promise.resolve([]),
      sectionIdSet.size > 0
        ? this.sectionRepository.find({
            where: { id: In(Array.from(sectionIdSet)) },
          })
        : Promise.resolve([]),
    ]);

    const classMap = new Map<string, Class>(classes.map((c) => [c.id, c]));
    const sectionMap = new Map<string, Section>(sections.map((s) => [s.id, s]));

    // 2. Batch aggregate Attendance per student (Legacy + Period)
    let attQB = this.attendanceRepository
      .createQueryBuilder('att')
      .select('att.studentId', 'studentId')
      .addSelect('COUNT(1)', 'totalWorkingDays')
      .addSelect(
        `COUNT(CASE WHEN att.status = :presentStatus THEN 1 END)`,
        'presentDays',
      )
      .where('att.schoolId = :schoolId', { schoolId })
      .andWhere('att.studentId IS NOT NULL')
      .setParameter('presentStatus', AttendanceStatus.PRESENT)
      .groupBy('att.studentId');

    if (dateRange) {
      attQB = attQB.andWhere('att.date BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const attStats = await attQB.getRawMany();
    
    let periodAttQB = this.periodAttendanceRepository
      .createQueryBuilder('pa')
      .select('pa.studentId', 'studentId')
      .addSelect('COUNT(1)', 'totalWorkingDays')
      .addSelect(
        `COUNT(CASE WHEN pa.status = :presentStatus THEN 1 END)`,
        'presentDays',
      )
      .where('pa.schoolId = :schoolId', { schoolId })
      .andWhere('pa.studentId IS NOT NULL')
      .setParameter('presentStatus', PeriodAttendanceStatus.PRESENT)
      .groupBy('pa.studentId');

    if (dateRange) {
      periodAttQB = periodAttQB.andWhere('pa.date >= :startDate AND pa.date <= :endDate', {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });
    }

    const periodAttStats = await periodAttQB.getRawMany();

    const attMap = new Map<
      string,
      { totalWorkingDays: number; presentDays: number }
    >();

    const mergeStats = (row: any) => {
      const existing = attMap.get(row.studentId) || { totalWorkingDays: 0, presentDays: 0 };
      existing.totalWorkingDays += parseInt(row.totalWorkingDays, 10) || 0;
      existing.presentDays += parseInt(row.presentDays, 10) || 0;
      attMap.set(row.studentId, existing);
    };

    attStats.forEach(mergeStats);
    periodAttStats.forEach(mergeStats);

    // 3. Batch aggregate Homework per student
    let hwQB = this.studentHomeworkRepository
      .createQueryBuilder('sh')
      .innerJoin(User, 'u', 'u.id = sh.studentId')
      .select('sh.studentId', 'studentId')
      .addSelect('COUNT(1)', 'totalAssigned')
      .addSelect(
        `COUNT(CASE WHEN sh.status = :doneStatus THEN 1 END)`,
        'totalDone',
      )
      .where('u.schoolId = :schoolId', { schoolId })
      .andWhere('u.role = :role', { role: UserRole.STUDENT })
      .setParameter('doneStatus', StudentHomeworkStatus.DONE)
      .groupBy('sh.studentId');

    if (dateRange) {
      hwQB = hwQB.andWhere('sh.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const hwStats = await hwQB.getRawMany();
    const hwMap = new Map<
      string,
      { totalAssigned: number; totalDone: number }
    >();
    hwStats.forEach((row) => {
      hwMap.set(row.studentId, {
        totalAssigned: parseInt(row.totalAssigned, 10) || 0,
        totalDone: parseInt(row.totalDone, 10) || 0,
      });
    });

    // 4. Batch aggregate Marks per student
    let marksQB = this.marksRepository
      .createQueryBuilder('m')
      .select('m.studentId', 'studentId')
      .addSelect('COALESCE(SUM(m.marksObtained), 0)', 'totalMarksObtained')
      .addSelect('COALESCE(SUM(m.totalMarks), 0)', 'totalMaximumMarks')
      .where('m.schoolId = :schoolId', { schoolId })
      .andWhere('m.studentId IS NOT NULL')
      .groupBy('m.studentId');

    if (dateRange) {
      marksQB = marksQB.andWhere('m.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const marksStats = await marksQB.getRawMany();
    const marksMap = new Map<
      string,
      { totalMarksObtained: number; totalMaximumMarks: number }
    >();
    marksStats.forEach((row) => {
      marksMap.set(row.studentId, {
        totalMarksObtained: parseFloat(row.totalMarksObtained) || 0,
        totalMaximumMarks: parseFloat(row.totalMaximumMarks) || 0,
      });
    });

    // 5. Construct results
    return students.map((student) => {
      const studentClass =
        student.classIds && student.classIds[0]
          ? classMap.get(student.classIds[0]) || null
          : null;
      const studentSection =
        student.sectionIds && student.sectionIds[0]
          ? sectionMap.get(student.sectionIds[0]) || null
          : null;

      const att = attMap.get(student.id) || {
        totalWorkingDays: 0,
        presentDays: 0,
      };
      const attendancePercentage =
        att.totalWorkingDays > 0
          ? (att.presentDays / att.totalWorkingDays) * 100
          : 0;

      const hw = hwMap.get(student.id) || { totalAssigned: 0, totalDone: 0 };
      const homeworkPercentage =
        hw.totalAssigned > 0 ? (hw.totalDone / hw.totalAssigned) * 100 : 0;

      const marks = marksMap.get(student.id) || {
        totalMarksObtained: 0,
        totalMaximumMarks: 0,
      };
      const examPercentage =
        marks.totalMaximumMarks > 0
          ? (marks.totalMarksObtained / marks.totalMaximumMarks) * 100
          : 0;

      return {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        class: studentClass,
        section: studentSection,
        attendance: {
          totalWorkingDays: att.totalWorkingDays,
          presentDays: att.presentDays,
          percentage: Number(attendancePercentage.toFixed(2)),
        },
        homework: {
          totalAssigned: hw.totalAssigned,
          totalDone: hw.totalDone,
          percentage: Number(homeworkPercentage.toFixed(2)),
        },
        exams: {
          totalMarksObtained: marks.totalMarksObtained,
          totalMaximumMarks: marks.totalMaximumMarks,
          percentage: Number(examPercentage.toFixed(2)),
        },
      };
    });
  }

  async getAllTeachersPerformance(
    schoolId: string,
    month?: string,
    year?: string,
  ) {
    const teachers = await this.userRepository.find({
      where: { schoolId, role: UserRole.TEACHER },
      select: ['id', 'name', 'designation', 'schoolId'],
      order: { name: 'ASC' },
    });

    if (!teachers || teachers.length === 0) {
      return [];
    }

    const dateRange = this.getDateRange(month, year);

    // 1. Total working days for the school (single query)
    let schoolAttQB = this.teacherAttendanceRepository
      .createQueryBuilder('ta')
      .select('COUNT(DISTINCT DATE(ta.date))', 'count')
      .where('ta.schoolId = :schoolId', { schoolId });

    if (dateRange) {
      schoolAttQB = schoolAttQB.andWhere(
        'ta.date BETWEEN :startDate AND :endDate',
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      );
    }

    const schoolAttRes = await schoolAttQB.getRawOne();
    const totalWorkingDays = parseInt(schoolAttRes?.count, 10) || 0;

    // 2. Present days grouped by teacher
    let teacherAttQB = this.teacherAttendanceRepository
      .createQueryBuilder('ta')
      .select('ta.teacherId', 'teacherId')
      .addSelect('COUNT(DISTINCT DATE(ta.date))', 'presentDays')
      .where('ta.schoolId = :schoolId', { schoolId })
      .andWhere('ta.teacherId IS NOT NULL')
      .groupBy('ta.teacherId');

    if (dateRange) {
      teacherAttQB = teacherAttQB.andWhere(
        'ta.date BETWEEN :startDate AND :endDate',
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      );
    }

    const teacherAttStats = await teacherAttQB.getRawMany();
    const attMap = new Map<string, number>();
    teacherAttStats.forEach((row) => {
      attMap.set(row.teacherId, parseInt(row.presentDays, 10) || 0);
    });

    // 3. Homework provided grouped by teacher
    let hwQB = this.homeworkRepository
      .createQueryBuilder('hw')
      .select('hw.teacherId', 'teacherId')
      .addSelect('COUNT(1)', 'totalProvided')
      .where('hw.schoolId = :schoolId', { schoolId })
      .andWhere('hw.teacherId IS NOT NULL')
      .groupBy('hw.teacherId');

    if (dateRange) {
      hwQB = hwQB.andWhere('hw.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const hwStats = await hwQB.getRawMany();
    const hwMap = new Map<string, number>();
    hwStats.forEach((row) => {
      hwMap.set(row.teacherId, parseInt(row.totalProvided, 10) || 0);
    });

    const homeworkTarget = 10;

    return teachers.map((teacher) => {
      const presentDays = attMap.get(teacher.id) || 0;
      const attendancePercentage =
        totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

      const totalHomeworkProvided = hwMap.get(teacher.id) || 0;
      const homeworkPercentage = (totalHomeworkProvided / homeworkTarget) * 100;

      return {
        teacherId: teacher.id,
        name: teacher.name,
        designation: teacher.designation,
        attendance: {
          totalWorkingDays,
          presentDays,
          percentage: Number(attendancePercentage.toFixed(2)),
        },
        homework: {
          totalProvided: totalHomeworkProvided,
          target: homeworkTarget,
          percentage: Number(Math.min(homeworkPercentage, 100).toFixed(2)),
        },
      };
    });
  }
}
