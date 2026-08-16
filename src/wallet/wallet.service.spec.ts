import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { Wallet, WalletStatus } from './entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionType,
  PaymentMethod,
} from './entities/wallet-transaction.entity';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: any;
  let transactionRepo: any;
  let dataSource: any;

  const mockSchoolId = '11111111-1111-1111-1111-111111111111';
  const mockAdminUser = {
    id: 'admin-123',
    name: 'School Principal',
    email: 'admin@school.com',
    role: 'admin',
  };

  beforeEach(async () => {
    walletRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'wallet-uuid-1' })),
      save: jest.fn().mockImplementation((w) => Promise.resolve({ ...w, id: w.id || 'wallet-uuid-1' })),
    };

    transactionRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'txn-uuid-1' })),
      save: jest.fn().mockImplementation((t) => Promise.resolve({ ...t, id: t.id || 'txn-uuid-1' })),
      createQueryBuilder: jest.fn(),
    };

    dataSource = {
      createQueryRunner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: walletRepo },
        { provide: getRepositoryToken(WalletTransaction), useValue: transactionRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet if found', async () => {
      const existingWallet = {
        id: 'wallet-1',
        schoolId: mockSchoolId,
        balance: 25000,
        currency: 'BDT',
        status: WalletStatus.ACTIVE,
      };
      walletRepo.findOne.mockResolvedValue(existingWallet);

      const result = await service.getOrCreateWallet(mockSchoolId);
      expect(result).toEqual(existingWallet);
      expect(walletRepo.findOne).toHaveBeenCalledWith({ where: { schoolId: mockSchoolId } });
    });

    it('should create new wallet if not found', async () => {
      walletRepo.findOne.mockResolvedValue(null);

      const result = await service.getOrCreateWallet(mockSchoolId);
      expect(walletRepo.create).toHaveBeenCalledWith({
        schoolId: mockSchoolId,
        balance: 0.0,
        currency: 'BDT',
        status: WalletStatus.ACTIVE,
      });
      expect(result.id).toBe('wallet-uuid-1');
    });
  });

  describe('getCategories', () => {
    it('should return list of income and expense categories and payment methods', () => {
      const categories = service.getCategories();
      expect(categories.incomeCategories).toContain('Tuition Fee');
      expect(categories.expenseCategories).toContain('Teacher Salary');
      expect(categories.paymentMethods).toContain('CASH');
    });
  });

  describe('addMoney', () => {
    it('should add money and update wallet balance', async () => {
      const existingWallet = {
        id: 'wallet-1',
        schoolId: mockSchoolId,
        balance: 1000,
        currency: 'BDT',
        status: WalletStatus.ACTIVE,
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(existingWallet),
          save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          create: jest.fn().mockImplementation((cls, dto) => ({ ...dto, id: 'txn-new-1' })),
        },
      };
      dataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      const result = await service.addMoney(mockSchoolId, mockAdminUser, {
        amount: 5000,
        category: 'Donation',
        title: 'Alumni Donation',
      });

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(result.currentBalance).toBe(6000);
      expect(result.transaction.amount).toBe(5000);
      expect(result.transaction.type).toBe(WalletTransactionType.INCOME);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('addExpense', () => {
    it('should record expense and deduct wallet balance', async () => {
      const existingWallet = {
        id: 'wallet-1',
        schoolId: mockSchoolId,
        balance: 10000,
        currency: 'BDT',
        status: WalletStatus.ACTIVE,
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(existingWallet),
          save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          create: jest.fn().mockImplementation((cls, dto) => ({ ...dto, id: 'txn-exp-1' })),
        },
      };
      dataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      const result = await service.addExpense(mockSchoolId, mockAdminUser, {
        amount: 2500,
        category: 'Electricity Bill',
        title: 'July Electricity Bill',
      });

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(result.currentBalance).toBe(7500);
      expect(result.transaction.amount).toBe(2500);
      expect(result.transaction.type).toBe(WalletTransactionType.EXPENSE);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});
