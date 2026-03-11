import { Injectable } from '@nestjs/common';
import { AttendanceService } from '../attendance/attendance.service';
import { MarksService } from '../marks/marks.service';
import { HomeworkService } from '../homework/homework.service';
import { ExamsService } from '../exams/exams.service';

@Injectable()
export class TeacherService {
  constructor(
    private attendanceService: AttendanceService,
    private marksService: MarksService,
    private homeworkService: HomeworkService,
    private examsService: ExamsService,
  ) {}

  // Attendance
  async submitAttendance(data: any) {
    return await this.attendanceService.submitAttendance(data);
  }

  async getAttendance(classId: string, date?: string) {
    return await this.attendanceService.getAttendance(classId, date);
  }

  // Marks
  async submitMarks(data: any) {
    return await this.marksService.submitMarks(data);
  }

  async getMarks(examId?: string, studentId?: string) {
    return await this.marksService.getMarks(examId, studentId);
  }

  // Homework
  async createHomework(data: any) {
    return await this.homeworkService.create(data);
  }

  async getHomework(classId?: string, subjectId?: string) {
    return await this.homeworkService.findAll(classId, subjectId);
  }

  async updateHomework(id: string, data: any) {
    return await this.homeworkService.update(id, data);
  }

  async deleteHomework(id: string) {
    return await this.homeworkService.delete(id);
  }

  // Exams
  async getExams() {
    return await this.examsService.findAllExams();
  }
}
