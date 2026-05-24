import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceService } from '../attendance/attendance.service';
import { MarksService } from '../marks/marks.service';
import { HomeworkService } from '../homework/homework.service';
import { ExamsService } from '../exams/exams.service';
import { UsersService } from '../users/users.service';
import { GeneralService } from '../general/general.service';
import { Day } from '../general/entities/routine.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UserRole } from '../users/entities/user.entity';
import { SubmitAttendanceDto } from '../attendance/dto/submit-attendance.dto';
import { SubmitTeacherAttendanceDto } from '../attendance/dto/submit-teacher-attendance.dto';
import { SubmitMarksDto } from '../marks/dto/submit-marks.dto';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
} from '../homework/dto/create-homework.dto';
import { StudentHomeworkStatus } from '../homework/entities/student-homework.entity';

@Injectable()
export class TeacherService {
  constructor(
    private attendanceService: AttendanceService,
    private marksService: MarksService,
    private homeworkService: HomeworkService,
    private examsService: ExamsService,
    private usersService: UsersService,
    private generalService: GeneralService,
  ) {}

  async getTodaysClasses(teacherId: string, date?: string) {
    const days = [
      Day.SUNDAY,
      Day.MONDAY,
      Day.TUESDAY,
      Day.WEDNESDAY,
      Day.THURSDAY,
      Day.FRIDAY,
      Day.SATURDAY,
    ];

    let day: Day;

    if (
      date &&
      Object.values(Day).some((d) => d.toLowerCase() === date.toLowerCase())
    ) {
      day = Object.values(Day).find(
        (d) => d.toLowerCase() === date.toLowerCase(),
      ) as Day;
    } else {
      const targetDate = date ? new Date(date) : new Date();
      day = days[targetDate.getDay()];
    }

    return await this.generalService.getRoutineByTeacherAndDay(teacherId, day);
  }

  async create(data: CreateTeacherDto) {
    return await this.usersService.create({
      ...data,
      role: UserRole.TEACHER,
    });
  }

  // Attendance
  async submitAttendance(data: SubmitAttendanceDto) {
    return await this.attendanceService.submitAttendance(data);
  }

  async getAttendance(classId: string, date?: string) {
    return await this.attendanceService.getAttendance(classId, date);
  }

  async submitTeacherAttendance(
    teacherId: string,
    data: SubmitTeacherAttendanceDto,
  ) {
    return await this.attendanceService.submitTeacherAttendance(
      teacherId,
      data,
    );
  }

  async getTeacherAttendance(
    schoolId?: string,
    teacherId?: string,
    date?: string,
  ) {
    return await this.attendanceService.getTeacherAttendance(
      schoolId,
      teacherId,
      date,
    );
  }

  // Marks
  async submitMarks(data: SubmitMarksDto, teacherId: string) {
    if (data.teacherId !== teacherId) {
      throw new ForbiddenException('You can only submit marks as yourself');
    }

    const assignments =
      await this.examsService.findAssignmentsByExaminer(teacherId);

    // Check if the teacher is assigned to the subjects they are submitting marks for in this exam
    // and validate the bounds locally
    for (const mark of data.marks) {
      if (mark.marksObtained < 0 || mark.marksObtained > mark.totalMarks) {
        throw new BadRequestException(
          `Marks obtained (${mark.marksObtained}) must be between 0 and total marks (${mark.totalMarks}) for subject ${mark.subjectId}`,
        );
      }

      const isAssigned = assignments.some(
        (a) => a.examId === data.examId && a.subject.uuid === mark.subjectId,
      );
      if (!isAssigned) {
        throw new ForbiddenException(
          `You are not assigned to submit marks for subject ${mark.subjectId} in exam ${data.examId}`,
        );
      }
    }

    return await this.marksService.submitMarks(data);
  }

  async getMarks(teacherId: string, examId?: string, studentId?: string) {
    const assignments =
      await this.examsService.findAssignmentsByExaminer(teacherId);

    const allowedSubjects = new Map<string, Set<string>>();
    for (const a of assignments) {
      if (!allowedSubjects.has(a.examId)) {
        allowedSubjects.set(a.examId, new Set());
      }
      allowedSubjects.get(a.examId).add(a.subject.uuid);
    }

    const allMarks = await this.marksService.getMarks(examId, studentId);

    // Filter to only subjects the teacher is assigned to
    return allMarks.filter((m) => {
      const examSubjects = allowedSubjects.get(m.examId);
      return examSubjects && examSubjects.has(m.subjectId);
    });
  }

  async getAssignedSubjectsAndStudents(teacherId: string) {
    const assignments =
      await this.examsService.findAssignmentsByExaminer(teacherId);

    const subjectsMap = new Map();
    const studentsRes = await this.usersService.findAll(
      UserRole.STUDENT,
      1,
      1000,
      true,
    );
    const allStudents = studentsRes.data;

    for (const assignment of assignments) {
      const key = `${assignment.examId}-${assignment.subject.uuid}-${assignment.class.uuid}`;
      if (!subjectsMap.has(key)) {
        const classStudents = allStudents.filter(
          (s) => s.classId === assignment.class.uuid,
        );
        subjectsMap.set(key, {
          exam: assignment.exam || { uuid: assignment.examId },
          subject: assignment.subject,
          class: assignment.class,
          students: classStudents.map((s) => ({
            id: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
          })),
        });
      }
    }

    return Array.from(subjectsMap.values());
  }

  async getAssignedExams(teacherId: string) {
    const assignments =
      await this.examsService.findAssignmentsByExaminer(teacherId);
    const examsMap = new Map();
    for (const a of assignments) {
      if (a.exam && !examsMap.has(a.examId)) {
        examsMap.set(a.examId, a.exam);
      } else if (!a.exam && !examsMap.has(a.examId)) {
        examsMap.set(a.examId, { id: a.examId });
      }
    }
    return Array.from(examsMap.values());
  }

  async getAssignedClasses(teacherId: string, examId: string) {
    const assignments =
      await this.examsService.findAssignmentsByExaminer(teacherId);
    const classesMap = new Map();
    for (const a of assignments) {
      if (a.examId === examId && a.class && !classesMap.has(a.class.uuid)) {
        classesMap.set(a.class.uuid, a.class);
      }
    }
    return Array.from(classesMap.values());
  }

  async getAssignedSubjectsByExam(teacherId: string, examId: string) {
    const assignments =
      await this.examsService.findAssignmentsByExaminer(teacherId);
    const subjectsMap = new Map();
    for (const a of assignments) {
      if (a.examId === examId && a.subject && !subjectsMap.has(a.subject.uuid)) {
        subjectsMap.set(a.subject.uuid, a.subject);
      }
    }
    return Array.from(subjectsMap.values());
  }

  async getAssignedStudents(
    teacherId: string,
    examId: string,
    classId: string,
  ) {
    const assignments =
      await this.examsService.findAssignmentsByExaminer(teacherId);
    const isAssigned = assignments.some(
      (a) => a.examId === examId && a.class.uuid === classId,
    );
    if (!isAssigned) {
      throw new ForbiddenException(
        'You are not assigned to this class for the given exam',
      );
    }

    const studentsRes = await this.usersService.findAll(
      UserRole.STUDENT,
      1,
      1000,
      true,
    );
    return studentsRes.data
      .filter((s) => s.classId === classId)
      .map((s) => ({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
      }));
  }

  async getAssignedSubjectsWithMarks(
    teacherId: string,
    examId: string,
    classId: string,
    studentId: string,
  ) {
    const assignments =
      await this.examsService.findAssignmentsByExaminer(teacherId);
    const assignedSubjectsMap = new Map();
    for (const a of assignments) {
      if (a.examId === examId && a.class.uuid === classId) {
        assignedSubjectsMap.set(a.subject.uuid, a.subject);
      }
    }

    if (assignedSubjectsMap.size === 0) {
      throw new ForbiddenException(
        'You are not assigned to any subjects for this class and exam',
      );
    }

    const allMarks = await this.marksService.getMarks(examId, studentId);

    return Array.from(assignedSubjectsMap.values()).map((subject) => {
      const existingMark = allMarks.find((m) => m.subjectId === subject.uuid);
      return {
        subject,
        existingMark: existingMark || null,
      };
    });
  }

  // Homework
  async createHomework(data: CreateHomeworkDto) {
    return await this.homeworkService.create(data);
  }

  async getHomework(classId?: string, subjectId?: string, sectionId?: string) {
    return await this.homeworkService.findAll(classId, subjectId, sectionId);
  }

  async getHomeworkById(id: string) {
    return await this.homeworkService.findById(id);
  }

  async getHomeworkStudentStatuses(homeworkId: string) {
    return await this.homeworkService.getHomeworkStatusByHomeworkId(homeworkId);
  }

  async updateStudentHomeworkStatus(
    studentHomeworkId: string,
    status: StudentHomeworkStatus,
    teacherId: string,
    comment?: string,
  ) {
    return await this.homeworkService.updateStudentStatus(
      studentHomeworkId,
      status,
      teacherId,
      comment,
    );
  }

  async bulkUpdateHomeworkStatus(
    homeworkId: string,
    status: StudentHomeworkStatus,
    teacherId: string,
    comment?: string,
  ) {
    return await this.homeworkService.bulkUpdateStudentStatuses(
      homeworkId,
      status,
      teacherId,
      comment,
    );
  }

  async updateHomework(id: string, data: UpdateHomeworkDto) {
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
