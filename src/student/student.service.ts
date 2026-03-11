import { Injectable } from '@nestjs/common';
import { AttendanceService } from '../attendance/attendance.service';
import { GeneralService } from '../general/general.service';
import { HomeworkService } from '../homework/homework.service';
import { MarksService } from '../marks/marks.service';

@Injectable()
export class StudentService {
  constructor(
    private attendanceService: AttendanceService,
    private generalService: GeneralService,
    private homeworkService: HomeworkService,
    private marksService: MarksService,
  ) {}

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
