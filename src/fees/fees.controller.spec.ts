import { Test, TestingModule } from '@nestjs/testing';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { UserRole } from '../users/entities/user.entity';
import { FeeType } from './entities/fee-structure.entity';
import { PaymentMode } from './entities/fee-invoice.entity';

describe('FeesController', () => {
  let controller: FeesController;
  let service: FeesService;

  const mockAdminUser = {
    id: 'admin-uuid',
    userId: 'admin-uuid',
    role: UserRole.ADMIN,
    schoolId: 'school-uuid',
  };

  const mockService = {
    getFeeSetting: jest.fn().mockResolvedValue({ defaultPaymentMode: PaymentMode.PERSONAL_PAYMENT }),
    updateFeeSetting: jest.fn().mockResolvedValue({ defaultPaymentMode: PaymentMode.SCHOOL_CARE_PAYMENT }),
    generateFees: jest.fn().mockResolvedValue({ generatedCount: 1, invoices: [] }),
    getStudentFeeHistory: jest.fn().mockResolvedValue({ summary: {}, invoices: [], payments: [] }),
    getPrintableInvoice: jest.fn().mockResolvedValue({ invoice: {}, htmlTemplate: '<html></html>' }),
    collectPayment: jest.fn().mockResolvedValue({ invoice: {}, payment: {} }),
    findAllInvoices: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findInvoiceById: jest.fn().mockResolvedValue({ id: 'inv-1' }),
    createStructure: jest.fn().mockResolvedValue({ id: 'struct-1' }),
    findAllStructures: jest.fn().mockResolvedValue([]),
    findStructureById: jest.fn().mockResolvedValue({ id: 'struct-1' }),
    updateStructure: jest.fn().mockResolvedValue({ id: 'struct-1' }),
    deleteStructure: jest.fn().mockResolvedValue({ success: true }),
    getStats: jest.fn().mockResolvedValue({ totalInvoiced: 0, totalCollected: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeesController],
      providers: [
        {
          provide: FeesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FeesController>(FeesController);
    service = module.get<FeesService>(FeesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.getFeeSetting', async () => {
    await controller.getSettings(mockAdminUser);
    expect(service.getFeeSetting).toHaveBeenCalledWith(mockAdminUser);
  });

  it('should call service.updateFeeSetting', async () => {
    const dto = { defaultPaymentMode: PaymentMode.SCHOOL_CARE_PAYMENT };
    await controller.updateSettings(dto, mockAdminUser);
    expect(service.updateFeeSetting).toHaveBeenCalledWith(dto, mockAdminUser);
  });

  it('should call service.generateFees', async () => {
    const dto = {
      title: 'Tuition Fee',
      amount: 1500,
      year: 2026,
      feeType: FeeType.TUITION,
      dueDate: new Date().toISOString(),
    };
    await controller.generateFees(dto, mockAdminUser);
    expect(service.generateFees).toHaveBeenCalledWith(dto, mockAdminUser);
  });

  it('should call service.getOwnStudentHistory', async () => {
    await controller.getOwnStudentHistory(mockAdminUser, 2026, 'October');
    expect(service.getStudentFeeHistory).toHaveBeenCalledWith(
      mockAdminUser.id,
      mockAdminUser,
      { year: 2026, month: 'October' },
    );
  });

  it('should call service.getStudentHistoryByAdmin', async () => {
    const studentId = '11111111-2222-3333-4444-555555555555';
    await controller.getStudentHistoryByAdmin(studentId, mockAdminUser, 2026);
    expect(service.getStudentFeeHistory).toHaveBeenCalledWith(
      studentId,
      mockAdminUser,
      { year: 2026, month: undefined },
    );
  });

  it('should call service.getPrintableInvoice', async () => {
    const invId = '11111111-2222-3333-4444-555555555555';
    await controller.getPrintableInvoice(invId, mockAdminUser);
    expect(service.getPrintableInvoice).toHaveBeenCalledWith(invId, mockAdminUser);
  });

  it('should call service.collectPayment', async () => {
    const invId = '11111111-2222-3333-4444-555555555555';
    const dto = { amount: 1500 };
    await controller.collectPayment(invId, dto, mockAdminUser);
    expect(service.collectPayment).toHaveBeenCalledWith(invId, dto, mockAdminUser);
  });

  it('should call service.findAllInvoices', async () => {
    const filters = { page: 1, limit: 10 };
    await controller.findAllInvoices(filters, mockAdminUser);
    expect(service.findAllInvoices).toHaveBeenCalledWith(filters, mockAdminUser);
  });

  it('should call service.getStats', async () => {
    await controller.getStats(mockAdminUser);
    expect(service.getStats).toHaveBeenCalledWith(mockAdminUser);
  });
});
