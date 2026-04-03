import { Injectable } from '@nestjs/common';
import { AttendanceService } from '../attendance/attendance.service';
import { GeneralService } from '../general/general.service';
import { HomeworkService } from '../homework/homework.service';
import { MarksService } from '../marks/marks.service';
import { UsersService } from '../users/users.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class StudentService {
  constructor(
    private attendanceService: AttendanceService,
    private generalService: GeneralService,
    private homeworkService: HomeworkService,
    private marksService: MarksService,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateStudentDto) {
    return await this.usersService.create({
      ...dto,
      role: UserRole.STUDENT,
    });
  }

  // Get student exam results by leveraging MarksService
  async getResults(studentId: string) {
    return await this.marksService.findByStudent(studentId);
  }

  // Get student attendance
  async getAttendance(studentId: string) {
    return await this.attendanceService.getStudentAttendance(studentId);
  }

  // Get class routine
  async getRoutine(classId: string) {
    return await this.generalService.getRoutineByClass(classId);
  }

  // Get homework
  async getHomework(studentId: string) {
    return await this.homeworkService.getHomeworkForStudent(studentId);
  }

  // Get student performance report
  async getPerformanceReport(studentId: string) {
    const attendance = await this.attendanceService.getStudentAttendance(
      studentId,
    );
    const homework = await this.homeworkService.getHomeworkForStudent(
      studentId,
    );

    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(
      (a) => a.status === 'present',
    ).length;
    const attendancePercentage =
      totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    const totalHomework = homework.length;
    const completedHomework = homework.filter(
      (h) => h.status === 'done',
    ).length;
    const homeworkPercentage =
      totalHomework > 0 ? (completedHomework / totalHomework) * 100 : 0;

    return {
      studentId,
      attendance: {
        total: totalAttendance,
        present: presentCount,
        percentage: parseFloat(attendancePercentage.toFixed(2)),
      },
      homework: {
        total: totalHomework,
        completed: completedHomework,
        percentage: parseFloat(homeworkPercentage.toFixed(2)),
      },
      overallPerformance: parseFloat(
        ((attendancePercentage + homeworkPercentage) / 2).toFixed(2),
      ),
    };
  }
}
