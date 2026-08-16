import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { UserRole } from '../users/entities/user.entity';

describe('WalletController', () => {
  let controller: WalletController;
  let service: WalletService;

  const mockWalletService = {
    getWalletOverview: jest.fn().mockResolvedValue({
      wallet: { id: 'wallet-1', balance: 5000 },
      summary: {},
    }),
    addMoney: jest.fn().mockResolvedValue({
      message: 'Money added to treasury wallet successfully',
      currentBalance: 55000,
    }),
    addExpense: jest.fn().mockResolvedValue({
      message: 'Expense recorded successfully',
      currentBalance: 45000,
    }),
    getTransactions: jest.fn().mockResolvedValue({
      transactions: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
      summary: { totalIncome: 0, totalExpense: 0, netBalance: 0 },
    }),
    getTransactionById: jest.fn().mockResolvedValue({ id: 'txn-1' }),
    updateTransaction: jest.fn().mockResolvedValue({ id: 'txn-1', title: 'Updated' }),
    deleteTransaction: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    getAnalytics: jest.fn().mockResolvedValue({ monthlyBreakdown: [] }),
    getCategories: jest.fn().mockReturnValue({ incomeCategories: [], expenseCategories: [] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return wallet overview for admin', async () => {
    const req = { user: { schoolId: 'school-123', role: UserRole.ADMIN } };
    const result = await controller.getWalletOverview(req);
    expect(service.getWalletOverview).toHaveBeenCalledWith('school-123');
    expect(result).toHaveProperty('wallet');
  });

  it('should call addMoney with admin user context', async () => {
    const req = {
      user: { id: 'admin-1', schoolId: 'school-123', role: UserRole.ADMIN, name: 'Admin' },
    };
    const dto = { amount: 50000, category: 'Tuition Fee', title: 'Tuition batch' };
    const result = await controller.addMoney(req, dto as any);
    expect(service.addMoney).toHaveBeenCalledWith(
      'school-123',
      { id: 'admin-1', name: 'Admin', email: undefined, role: UserRole.ADMIN },
      dto,
    );
    expect(result.currentBalance).toBe(55000);
  });

  it('should call addExpense with admin user context', async () => {
    const req = {
      user: { id: 'admin-1', schoolId: 'school-123', role: UserRole.ADMIN, name: 'Admin' },
    };
    const dto = { amount: 10000, category: 'Electricity Bill', title: 'Campus Power' };
    const result = await controller.addExpense(req, dto as any);
    expect(service.addExpense).toHaveBeenCalledWith(
      'school-123',
      { id: 'admin-1', name: 'Admin', email: undefined, role: UserRole.ADMIN },
      dto,
    );
    expect(result.currentBalance).toBe(45000);
  });
});
