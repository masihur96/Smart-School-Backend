import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeeStructure, FeeType } from './entities/fee-structure.entity';
import { FeeInvoice, FeeStatus, PaymentMode } from './entities/fee-invoice.entity';
import { FeePayment, FeePaymentMethod } from './entities/fee-payment.entity';
import { FeeSetting } from './entities/fee-setting.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('FeesService', () => {
  let service: FeesService;

  const mockSchoolId = '11111111-1111-1111-1111-111111111111';
  const mockClassId = 'class-1-uuid';

  const mockAdminUser: Partial<User> = {
    id: 'admin-uuid',
    name: 'Admin User',
    email: 'admin@school.com',
    role: UserRole.ADMIN,
    schoolId: mockSchoolId,
    isActive: true,
  };

  const mockStudentUser: Partial<User> = {
    id: 'student-1-uuid',
    name: 'Alice Student',
    email: 'alice@school.com',
    role: UserRole.STUDENT,
    schoolId: mockSchoolId,
    classIds: [mockClassId],
    rollNumber: '101',
    isActive: true,
  };

  const mockOtherStudentUser: Partial<User> = {
    id: 'student-2-uuid',
    name: 'Bob Student',
    email: 'bob@school.com',
    role: UserRole.STUDENT,
    schoolId: mockSchoolId,
    classIds: [mockClassId],
    rollNumber: '102',
    isActive: true,
  };

  const mockSchool: Partial<School> = {
    id: 'school-id',
    schoolId: mockSchoolId,
    name: 'Greenwood High School',
    address: '123 Academic Way',
    phone: '+8801700000000',
    email: 'info@greenwood.edu',
  };

  const mockFeeSetting: Partial<FeeSetting> = {
    id: 'setting-1',
    schoolId: mockSchoolId,
    defaultPaymentMode: PaymentMode.PERSONAL_PAYMENT,
    lateFeeFinePerDay: 5,
    currency: 'BDT',
    personalPaymentInfo: {
      bankName: 'City Bank PLC',
      accountNumber: '987654321',
      bkashNumber: '01712345678',
    },
    schoolCarePaymentInfo: {
      enabled: false,
    },
  };

  let mockFeeStructureRepo: any;
  let mockFeeInvoiceRepo: any;
  let mockFeePaymentRepo: any;
  let mockFeeSettingRepo: any;
  let mockUserRepo: any;
  let mockClassRepo: any;
  let mockSchoolRepo: any;
  let mockWalletService: any;
  let mockNotificationsService: any;

  beforeEach(async () => {
    mockFeeStructureRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'struct-1', ...dto })),
      save: jest.fn().mockImplementation(async (item) => ({ id: item.id || 'struct-1', ...item })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: 'struct-1', schoolId: mockSchoolId }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockFeeInvoiceRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'inv-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (items) => {
        if (Array.isArray(items)) {
          return items.map((i, idx) => ({ id: `inv-${idx + 1}`, ...i }));
        }
        return { id: items.id || 'inv-1', ...items };
      }),
      findOne: jest.fn().mockImplementation(async (opts) => {
        if (opts.where.id === 'inv-1') {
          return {
            id: 'inv-1',
            schoolId: mockSchoolId,
            invoiceNumber: 'INV-202610-001',
            studentId: mockStudentUser.id,
            student: mockStudentUser,
            title: 'Tuition Fee',
            amount: 1500,
            discountAmount: 0,
            fineAmount: 0,
            payableAmount: 1500,
            paidAmount: 0,
            dueAmount: 1500,
            status: FeeStatus.UNPAID,
            dueDate: new Date(Date.now() + 86400000),
            paymentMode: PaymentMode.PERSONAL_PAYMENT,
            payments: [],
          };
        }
        return null;
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    mockFeePaymentRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'pay-1', ...dto })),
      save: jest.fn().mockImplementation(async (item) => ({ id: item.id || 'pay-1', ...item })),
      find: jest.fn().mockResolvedValue([]),
    };

    mockFeeSettingRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'setting-1', ...dto })),
      save: jest.fn().mockImplementation(async (item) => ({ id: item.id || 'setting-1', ...item })),
      findOne: jest.fn().mockResolvedValue({ ...mockFeeSetting }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        if (where.id === mockStudentUser.id) return { ...mockStudentUser };
        if (where.id === mockOtherStudentUser.id) return { ...mockOtherStudentUser };
        if (where.id === mockAdminUser.id) return { ...mockAdminUser };
        return null;
      }),
      find: jest.fn().mockResolvedValue([mockStudentUser, mockOtherStudentUser]),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStudentUser, mockOtherStudentUser]),
      }),
    };

    mockClassRepo = {
      findOne: jest.fn().mockResolvedValue({ id: mockClassId, name: 'Grade 10' }),
    };

    mockSchoolRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockSchool }),
    };

    mockWalletService = {
      addMoney: jest.fn().mockResolvedValue({}),
    };

    mockNotificationsService = {
      sendToUser: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        {
          provide: getRepositoryToken(FeeStructure),
          useValue: mockFeeStructureRepo,
        },
        {
          provide: getRepositoryToken(FeeInvoice),
          useValue: mockFeeInvoiceRepo,
        },
        {
          provide: getRepositoryToken(FeePayment),
          useValue: mockFeePaymentRepo,
        },
        {
          provide: getRepositoryToken(FeeSetting),
          useValue: mockFeeSettingRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Class),
          useValue: mockClassRepo,
        },
        {
          provide: getRepositoryToken(School),
          useValue: mockSchoolRepo,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 1. ADMIN CAN CHOOSE PERSONAL PAYMENT OR SCHOOL CARE PAYMENT
  // ═════════════════════════════════════════════════════════════════════════

  describe('Payment Mode Settings (Personal vs School Care)', () => {
    it('retrieves default fee settings with PERSONAL_PAYMENT', async () => {
      const setting = await service.getFeeSetting(mockAdminUser);
      expect(setting).toBeDefined();
      expect(setting.defaultPaymentMode).toBe(PaymentMode.PERSONAL_PAYMENT);
    });

    it('allows admin to choose SCHOOL_CARE_PAYMENT mode', async () => {
      const updated = await service.updateFeeSetting(
        {
          defaultPaymentMode: PaymentMode.SCHOOL_CARE_PAYMENT,
          schoolCarePaymentInfo: {
            enabled: true,
            merchantId: 'MERCHANT_123',
          },
        },
        mockAdminUser,
      );

      expect(mockFeeSettingRepo.save).toHaveBeenCalled();
      expect(updated.defaultPaymentMode).toBe(PaymentMode.SCHOOL_CARE_PAYMENT);
    });

    it('allows admin to configure personal payment bank and mobile money accounts', async () => {
      const updated = await service.updateFeeSetting(
        {
          defaultPaymentMode: PaymentMode.PERSONAL_PAYMENT,
          personalPaymentInfo: {
            bankName: 'Eastern Bank PLC',
            accountNumber: '1122334455',
            bkashNumber: '01800000000',
            nagadNumber: '01900000000',
          },
        },
        mockAdminUser,
      );

      expect(mockFeeSettingRepo.save).toHaveBeenCalled();
      expect(updated.defaultPaymentMode).toBe(PaymentMode.PERSONAL_PAYMENT);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 2. ADMIN CAN GENERATE SCHOOL FEES
  // ═════════════════════════════════════════════════════════════════════════

  describe('Generate School Fees', () => {
    it('generates fees in bulk for all students in a class', async () => {
      const result = await service.generateFees(
        {
          classId: mockClassId,
          title: 'Monthly Tuition Fee - October 2026',
          feeType: FeeType.TUITION,
          amount: 1500,
          year: 2026,
          month: 'October',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        },
        mockAdminUser,
      );

      expect(result.generatedCount).toBe(2);
      expect(mockFeeInvoiceRepo.save).toHaveBeenCalled();
      expect(mockNotificationsService.sendToUser).toHaveBeenCalled();
    });

    it('generates fee for a single individual student', async () => {
      const result = await service.generateFees(
        {
          studentId: mockStudentUser.id,
          title: 'Admission Fee',
          feeType: FeeType.ADMISSION,
          amount: 5000,
          discountAmount: 500,
          year: 2026,
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        },
        mockAdminUser,
      );

      expect(result.generatedCount).toBe(1);
      expect(mockFeeInvoiceRepo.save).toHaveBeenCalled();
    });

    it('rejects generation if no class or student target is specified', async () => {
      await expect(
        service.generateFees(
          {
            title: 'Invalid Fee',
            amount: 100,
            year: 2026,
            dueDate: new Date().toISOString(),
          } as any,
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 3. COLLECT PAYMENT (RECORD PAYMENT TOWARDS INVOICE)
  // ═════════════════════════════════════════════════════════════════════════

  describe('Collect / Record Payment', () => {
    it('records partial fee payment and updates status to PARTIALLY_PAID', async () => {
      const result = await service.collectPayment(
        'inv-1',
        {
          amount: 500,
          paymentMode: PaymentMode.PERSONAL_PAYMENT,
          paymentMethod: FeePaymentMethod.BKASH,
          transactionId: 'TRX-12345',
        },
        mockAdminUser,
      );

      expect(result.invoice.paidAmount).toBe(500);
      expect(result.invoice.dueAmount).toBe(1000);
      expect(result.invoice.status).toBe(FeeStatus.PARTIALLY_PAID);
      expect(result.payment.receiptNumber).toBeDefined();
      expect(mockFeePaymentRepo.save).toHaveBeenCalled();
    });

    it('records full payment, marks status as PAID, and syncs to treasury wallet', async () => {
      const result = await service.collectPayment(
        'inv-1',
        {
          amount: 1500,
          paymentMode: PaymentMode.PERSONAL_PAYMENT,
          paymentMethod: FeePaymentMethod.CASH,
          syncToWallet: true,
        },
        mockAdminUser,
      );

      expect(result.invoice.paidAmount).toBe(1500);
      expect(result.invoice.dueAmount).toBe(0);
      expect(result.invoice.status).toBe(FeeStatus.PAID);
      expect(mockWalletService.addMoney).toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 4. PRINT INVOICE & RECEIPT SLIP ("AND PRINT")
  // ═════════════════════════════════════════════════════════════════════════

  describe('Printable Slip & Receipt', () => {
    it('generates printable data and ready-to-render HTML slip', async () => {
      const result = await service.getPrintableInvoice('inv-1', mockAdminUser);

      expect(result).toBeDefined();
      expect(result.invoice.invoiceNumber).toBe('INV-202610-001');
      expect(result.school.name).toBe('Greenwood High School');
      expect(result.student.name).toBe('Alice Student');
      expect(result.htmlTemplate).toContain('INV-202610-001');
      expect(result.htmlTemplate).toContain('Greenwood High School');
    });

    it('forbids student from viewing or printing another student invoice', async () => {
      await expect(
        service.getPrintableInvoice('inv-1', mockOtherStudentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 5. STUDENT HISTORICAL DATA ("IN STUDENT HAVE HISTORICAL DATA ALSO")
  // ═════════════════════════════════════════════════════════════════════════

  describe('Student Historical Data', () => {
    it('returns historical invoices, payments, and financial summary for student', async () => {
      const mockHistoryInvoices = [
        {
          id: 'inv-1',
          title: 'Tuition Fee - October',
          amount: 1500,
          discountAmount: 100,
          fineAmount: 0,
          payableAmount: 1400,
          paidAmount: 1400,
          dueAmount: 0,
          status: FeeStatus.PAID,
          dueDate: new Date(Date.now() + 86400000),
          payments: [
            {
              id: 'p-1',
              receiptNumber: 'REC-001',
              amount: 1400,
              paymentDate: new Date(),
            },
          ],
        },
        {
          id: 'inv-2',
          title: 'Tuition Fee - November',
          amount: 1500,
          discountAmount: 0,
          fineAmount: 0,
          payableAmount: 1500,
          paidAmount: 0,
          dueAmount: 1500,
          status: FeeStatus.UNPAID,
          dueDate: new Date(Date.now() - 86400000), // Overdue
          payments: [],
        },
      ];

      mockFeeInvoiceRepo.createQueryBuilder.mockReturnValueOnce({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockHistoryInvoices),
      });

      const history = await service.getStudentFeeHistory(
        mockStudentUser.id!,
        mockStudentUser,
      );

      expect(history.summary).toBeDefined();
      expect(history.summary.totalInvoiced).toBe(3000);
      expect(history.summary.totalPayable).toBe(2900);
      expect(history.summary.totalPaid).toBe(1400);
      expect(history.summary.totalDue).toBe(1500);
      expect(history.summary.totalOverdue).toBe(1500);
      expect(history.summary.paidInvoicesCount).toBe(1);
      expect(history.summary.pendingInvoicesCount).toBe(1);
      expect(history.payments.length).toBe(1);
    });

    it('forbids a student from querying another student historical data', async () => {
      await expect(
        service.getStudentFeeHistory(mockStudentUser.id!, mockOtherStudentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to view any student historical data', async () => {
      const history = await service.getStudentFeeHistory(
        mockStudentUser.id!,
        mockAdminUser,
      );
      expect(history.student.id).toBe(mockStudentUser.id);
    });
  });
});
