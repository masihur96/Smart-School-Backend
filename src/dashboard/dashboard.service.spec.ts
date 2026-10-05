import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PricingPlan } from '../pricing/entities/pricing-plan.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { TeacherAttendance } from '../attendance/entities/teacher-attendance.entity';
import { PeriodAttendance } from '../attendance/entities/period-attendance.entity';
import { Homework } from '../homework/entities/homework.entity';
import { StudentHomework } from '../homework/entities/student-homework.entity';
import { Notice } from '../general/entities/notice.entity';
import { Exam } from '../exams/entities/exam.entity';
import { AcademicAssignment } from '../exams/entities/academic-assignment.entity';
import { Marks } from '../marks/entities/marks.entity';
import { Marquee } from '../general/entities/marquee.entity';
import { Class } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Section } from '../sections/entities/section.entity';
import { OnlineClass } from '../online-classes/entities/online-class.entity';

describe('DashboardService - getAdminDashboard', () => {
  let service: DashboardService;

  const mockUserRepo = {
    count: jest.fn().mockResolvedValue(100),
    findOne: jest.fn().mockResolvedValue({ id: 'u1', name: 'Student 1' }),
    find: jest.fn().mockResolvedValue([{ id: 'u1', name: 'Teacher 1', avatar: null }]),
  };
  const mockSchoolRepo = { find: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(1) };
  const mockSubscriptionRepo = { find: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(1) };
  const mockPricingPlanRepo = { find: jest.fn().mockResolvedValue([]) };
  const mockAttendanceRepo = {
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
  };
  const mockTeacherAttendanceRepo = {
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };
  const mockPeriodAttendanceRepo = {
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          date: '2026-10-01',
          totalRecords: '50',
          totalPresent: '40',
          totalLate: '5',
          totalAbsent: '3',
          totalLeave: '2',
        },
        {
          date: '2026-10-02',
          totalRecords: '50',
          totalPresent: '45',
          totalLate: '2',
          totalAbsent: '2',
          totalLeave: '1',
        },
      ]),
    }),
  };
  const mockHomeworkRepo = { find: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) };
  const mockStudentHomeworkRepo = { find: jest.fn().mockResolvedValue([]) };
  const mockNoticeRepo = { find: jest.fn().mockResolvedValue([]) };
  const mockExamRepo = {
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };
  const mockAcademicAssignmentRepo = {
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
    find: jest.fn().mockResolvedValue([]),
  };
  const mockMarksRepo = { find: jest.fn().mockResolvedValue([]) };
  const mockMarqueeRepo = { findOne: jest.fn().mockResolvedValue(null) };
  const mockClassRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue(null) };
  const mockSubjectRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue(null) };
  const mockSectionRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue(null) };
  const mockOnlineClassRepo = {
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'meet-1',
          title: 'Staff Weekly Meeting',
          meetLink: 'https://meet.google.com/abc-defg-hij',
          date: new Date('2026-10-10T10:00:00Z'),
          startTime: '10:00 AM',
          endTime: '11:00 AM',
          hostId: 'u1',
          schoolId: 'school-uuid-1',
          participantUuids: ['u1'],
        },
      ]),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(School), useValue: mockSchoolRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
        { provide: getRepositoryToken(PricingPlan), useValue: mockPricingPlanRepo },
        { provide: getRepositoryToken(Attendance), useValue: mockAttendanceRepo },
        { provide: getRepositoryToken(TeacherAttendance), useValue: mockTeacherAttendanceRepo },
        { provide: getRepositoryToken(PeriodAttendance), useValue: mockPeriodAttendanceRepo },
        { provide: getRepositoryToken(Homework), useValue: mockHomeworkRepo },
        { provide: getRepositoryToken(StudentHomework), useValue: mockStudentHomeworkRepo },
        { provide: getRepositoryToken(Notice), useValue: mockNoticeRepo },
        { provide: getRepositoryToken(Exam), useValue: mockExamRepo },
        { provide: getRepositoryToken(AcademicAssignment), useValue: mockAcademicAssignmentRepo },
        { provide: getRepositoryToken(Marks), useValue: mockMarksRepo },
        { provide: getRepositoryToken(Marquee), useValue: mockMarqueeRepo },
        { provide: getRepositoryToken(Class), useValue: mockClassRepo },
        { provide: getRepositoryToken(Subject), useValue: mockSubjectRepo },
        { provide: getRepositoryToken(Section), useValue: mockSectionRepo },
        { provide: getRepositoryToken(OnlineClass), useValue: mockOnlineClassRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should return admin dashboard with monthly student attendance summary and daily chart data inside attendStudent', async () => {
    const result = await service.getAdminDashboard('school-uuid-1', 10, 2026);

    expect(result).toBeDefined();
    expect((result as any).monthlyStudentAttendance).toBeUndefined();
    expect(result.attendStudent).toBeDefined();
    expect(result.attendStudent.monthlySummary).toBeDefined();
    expect(result.attendStudent.dailyAttendance).toBeDefined();
    expect(result.upcomingMeeting).toBeDefined();
    expect(result.upcomingMeeting).toHaveLength(1);
    expect(result.upcomingMeeting[0].title).toBe('Staff Weekly Meeting');
    expect(result.upcomingMeetings).toBe(result.upcomingMeeting);

    const summary = result.attendStudent.monthlySummary;
    const daily = result.attendStudent.dailyAttendance;

    // Monthly summary verification
    expect(summary.month).toBe(10);
    expect(summary.monthName).toBe('October');
    expect(summary.year).toBe(2026);
    expect(summary.daysInMonth).toBe(31);
    expect(summary.totalStudents).toBe(100);
    expect(summary.totalRecords).toBe(100); // 50 + 50
    expect(summary.totalPresent).toBe(85); // 40 + 45
    expect(summary.totalLate).toBe(7); // 5 + 2
    expect(summary.totalAttended).toBe(92); // 85 + 7
    expect(summary.totalAbsent).toBe(5); // 3 + 2
    expect(summary.totalLeave).toBe(3); // 2 + 1
    expect(summary.attendanceRate).toBe(92); // 92 / 100 * 100
    expect(summary.daysRecorded).toBe(2);

    // Daily attendance chart points verification: 31 days in October
    expect(daily).toHaveLength(31);

    // Day 1
    const day1 = daily.find((d: any) => d.day === 1);
    expect(day1).toBeDefined();
    expect(day1.date).toBe('2026-10-01');
    expect(day1.present).toBe(40);
    expect(day1.late).toBe(5);
    expect(day1.absent).toBe(3);
    expect(day1.leave).toBe(2);
    expect(day1.totalPresent).toBe(45);
    expect(day1.total).toBe(50);
    expect(day1.attendanceRate).toBe(90);
    expect(day1.hasData).toBe(true);

    // Day 3 (no records)
    const day3 = daily.find((d: any) => d.day === 3);
    expect(day3).toBeDefined();
    expect(day3.date).toBe('2026-10-03');
    expect(day3.present).toBe(0);
    expect(day3.late).toBe(0);
    expect(day3.absent).toBe(0);
    expect(day3.leave).toBe(0);
    expect(day3.totalPresent).toBe(0);
    expect(day3.total).toBe(0);
    expect(day3.attendanceRate).toBe(0);
    expect(day3.hasData).toBe(false);
  });
});
