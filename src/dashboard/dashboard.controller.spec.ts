import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ForbiddenException } from '@nestjs/common';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<Partial<DashboardService>>;

  beforeEach(async () => {
    service = {
      getAdminDashboard: jest.fn().mockResolvedValue({
        attendTeacher: { date: '2026-10-05', totalTeachers: 10, present: 9, absent: 1, attendanceRate: 90 },
        attendStudent: {
          date: '2026-10-05',
          totalStudents: 100,
          recorded: 95,
          present: 80,
          absent: 10,
          leave: 5,
          late: 3,
          attendanceRate: 84.21,
          monthlySummary: {
            month: 10,
            monthName: 'October',
            year: 2026,
            totalStudents: 100,
            totalPresent: 800,
            totalLate: 30,
            totalAbsent: 50,
            totalLeave: 20,
            totalAttended: 830,
            totalRecords: 900,
            attendanceRate: 92.22,
            daysRecorded: 10,
            daysInMonth: 31,
          },
          dailyAttendance: [
            {
              date: '2026-10-01',
              day: 1,
              dayOfWeek: 'Thu',
              present: 80,
              late: 3,
              absent: 5,
              leave: 2,
              totalPresent: 83,
              total: 90,
              attendanceRate: 92.22,
              hasData: true,
              isFuture: false,
            },
          ],
        },
        recentHomework: [],
        recentNotice: [],
        currentExam: [],
        upcomingMeeting: [],
        upcomingMeetings: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should throw ForbiddenException if schoolId is missing', async () => {
    await expect(
      controller.getAdminDashboard({ user: {} }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should call getAdminDashboard with schoolId and optional month/year', async () => {
    const req = { user: { schoolId: 'school-123' } };
    const result = await controller.getAdminDashboard(req, '10', '2026');

    expect(service.getAdminDashboard).toHaveBeenCalledWith('school-123', 10, 2026);
    expect(result.attendStudent.monthlySummary).toBeDefined();
    expect(result.attendStudent.monthlySummary.month).toBe(10);
    expect(result.attendStudent.dailyAttendance).toHaveLength(1);
  });
});
