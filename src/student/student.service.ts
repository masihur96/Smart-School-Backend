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
      role: UserRole.STUDENT
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
  async getHomework(classId?: string) {
    return await this.homeworkService.findAll(classId);
  }
}
