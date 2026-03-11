import { Injectable } from '@nestjs/common';
import { ExamsService } from '../exams/exams.service';
import { AttendanceService } from '../attendance/attendance.service';
import { GeneralService } from '../general/general.service';
import { HomeworkService } from '../homework/homework.service';

@Injectable()
export class StudentService {
  constructor(
    private examsService: ExamsService,
    private attendanceService: AttendanceService,
    private generalService: GeneralService,
    private homeworkService: HomeworkService,
  ) {}

  // Get student exam results
  async getResults(studentId: string) {
    // Get all exams and filter by student
    const exams = await this.examsService.findAllExams();
    const allResults: any[] = [];
    
    for (const exam of exams) {
      const examResults = await this.examsService.getResults(exam.id, studentId);
      allResults.push(...examResults);
    }
    
    return allResults;
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
