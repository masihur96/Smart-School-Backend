import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Attendance, AttendanceStatus } from '../attendance/entities/attendance.entity';
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

  async getStudentPerformance(studentId: string, schoolId: string) {
    // Verify student exists
    const student = await this.userRepository.findOne({
      where: { id: studentId, schoolId, role: UserRole.STUDENT },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // 1. Attendance Performance
    const totalWorkingDays = await this.attendanceRepository.count({
      where: { studentId, schoolId },
    });
    const presentDays = await this.attendanceRepository.count({
      where: {
        studentId,
        schoolId,
        status: AttendanceStatus.PRESENT,
      },
    });
    const attendancePercentage =
      totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

    // 2. Homework Performance
    const totalHomeworkAssigned = await this.studentHomeworkRepository.count({
      where: { studentId },
    });
    const totalHomeworkDone = await this.studentHomeworkRepository.count({
      where: {
        studentId,
        status: StudentHomeworkStatus.DONE,
      },
    });
    const homeworkPercentage =
      totalHomeworkAssigned > 0
        ? (totalHomeworkDone / totalHomeworkAssigned) * 100
        : 0;

    // 3. Exam Performance (Average Marks)
    const marks = await this.marksRepository.find({
      where: { studentId, schoolId },
    });
    
    let totalMarksObtained = 0;
    let totalMaximumMarks = 0;
    
    marks.forEach(mark => {
      totalMarksObtained += Number(mark.marksObtained);
      totalMaximumMarks += Number(mark.totalMarks);
    });

    const examPercentage =
      totalMaximumMarks > 0
        ? (totalMarksObtained / totalMaximumMarks) * 100
        : 0;

    let studentClass = null;
    let studentSection = null;

    if (student.classIds && student.classIds.length > 0) {
      studentClass = await this.classRepository.findOne({
        where: { id: student.classIds[0] },
      });
    }

    if (student.sectionIds && student.sectionIds.length > 0) {
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

  async getTeacherPerformance(teacherId: string, schoolId: string) {
    // Verify teacher exists
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, schoolId, role: UserRole.TEACHER },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // 1. Attendance Performance
    // Note: TeacherAttendance usually tracks clock-in events. We'll count unique days.
    // Assuming a clock-in record for a day implies presence.
    const allAttendances = await this.teacherAttendanceRepository.find({
      where: { teacherId, schoolId },
    });

    // Get unique dates for this teacher
    const uniqueDates = new Set(
      allAttendances.map(a => {
        const d = new Date(a.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    const presentDays = uniqueDates.size;
    
    // Get total working days for the school based on any teacher's attendance
    const totalWorkingDaysQuery = await this.teacherAttendanceRepository
      .createQueryBuilder('ta')
      .select('COUNT(DISTINCT DATE(ta.date))', 'count')
      .where('ta.schoolId = :schoolId', { schoolId })
      .getRawOne();
      
    const totalWorkingDays = parseInt(totalWorkingDaysQuery.count, 10) || 0;
    
    const attendancePercentage = totalWorkingDays > 0 
      ? (presentDays / totalWorkingDays) * 100 
      : 0;

    // 2. Homework Provided
    const totalHomeworkProvided = await this.homeworkRepository.count({
      where: { teacherId, schoolId },
    });
    
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

  async getAllStudentsPerformance(schoolId: string) {
    const students = await this.userRepository.find({
      where: { schoolId, role: UserRole.STUDENT },
    });

    const performancePromises = students.map(student =>
      this.getStudentPerformance(student.id, schoolId).catch(() => null)
    );
    const results = await Promise.all(performancePromises);
    return results.filter(r => r !== null);
  }

  async getAllTeachersPerformance(schoolId: string) {
    const teachers = await this.userRepository.find({
      where: { schoolId, role: UserRole.TEACHER },
    });

    const performancePromises = teachers.map(teacher =>
      this.getTeacherPerformance(teacher.id, schoolId).catch(() => null)
    );
    const results = await Promise.all(performancePromises);
    return results.filter(r => r !== null);
  }
}
