import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Wallet, WalletStatus } from './entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionType,
  PaymentMethod,
} from './entities/wallet-transaction.entity';
import { AddMoneyDto } from './dto/add-money.dto';
import { AddExpenseDto } from './dto/add-expense.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

export interface AdminUserContext {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Finds or creates the single Treasury Wallet for the given school
   */
  async getOrCreateWallet(schoolId: string): Promise<Wallet> {
    if (!schoolId) {
      throw new BadRequestException('schoolId is required');
    }

    let wallet = await this.walletRepository.findOne({
      where: { schoolId },
    });

    if (!wallet) {
      this.logger.log(`Initializing new treasury wallet for schoolId: ${schoolId}`);
      wallet = this.walletRepository.create({
        schoolId,
        balance: 0.0,
        currency: 'BDT',
        status: WalletStatus.ACTIVE,
      });
      wallet = await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  /**
   * Retrieves high-level treasury wallet overview including current balance,
   * all-time stats, current month stats, and current year stats.
   */
  async getWalletOverview(schoolId: string) {
    const wallet = await this.getOrCreateWallet(schoolId);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

    const startOfYear = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

    // All-time aggregates
    const allTimeStats = await this.transactionRepository
      .createQueryBuilder('txn')
      .select('txn.type', 'type')
      .addSelect('SUM(txn.amount)', 'total')
      .addSelect('COUNT(txn.id)', 'count')
      .where('txn.schoolId = :schoolId', { schoolId })
      .groupBy('txn.type')
      .getRawMany();

    let allTimeIncome = 0;
    let allTimeExpense = 0;
    for (const stat of allTimeStats) {
      if (stat.type === WalletTransactionType.INCOME) {
        allTimeIncome = parseFloat(stat.total) || 0;
      } else if (stat.type === WalletTransactionType.EXPENSE) {
        allTimeExpense = parseFloat(stat.total) || 0;
      }
    }

    // Month aggregates
    const monthStats = await this.transactionRepository
      .createQueryBuilder('txn')
      .select('txn.type', 'type')
      .addSelect('SUM(txn.amount)', 'total')
      .where('txn.schoolId = :schoolId', { schoolId })
      .andWhere('txn.transactionDate BETWEEN :startOfMonth AND :endOfMonth', {
        startOfMonth,
        endOfMonth,
      })
      .groupBy('txn.type')
      .getRawMany();

    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    for (const stat of monthStats) {
      if (stat.type === WalletTransactionType.INCOME) {
        thisMonthIncome = parseFloat(stat.total) || 0;
      } else if (stat.type === WalletTransactionType.EXPENSE) {
        thisMonthExpense = parseFloat(stat.total) || 0;
      }
    }

    // Year aggregates
    const yearStats = await this.transactionRepository
      .createQueryBuilder('txn')
      .select('txn.type', 'type')
      .addSelect('SUM(txn.amount)', 'total')
      .where('txn.schoolId = :schoolId', { schoolId })
      .andWhere('txn.transactionDate BETWEEN :startOfYear AND :endOfYear', {
        startOfYear,
        endOfYear,
      })
      .groupBy('txn.type')
      .getRawMany();

    let thisYearIncome = 0;
    let thisYearExpense = 0;
    for (const stat of yearStats) {
      if (stat.type === WalletTransactionType.INCOME) {
        thisYearIncome = parseFloat(stat.total) || 0;
      } else if (stat.type === WalletTransactionType.EXPENSE) {
        thisYearExpense = parseFloat(stat.total) || 0;
      }
    }

    // Recent 5 transactions
    const recentTransactions = await this.transactionRepository.find({
      where: { schoolId },
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      take: 5,
    });

    return {
      wallet: {
        id: wallet.id,
        schoolId: wallet.schoolId,
        balance: Number(wallet.balance),
        currency: wallet.currency,
        status: wallet.status,
        updatedAt: wallet.updatedAt,
      },
      summary: {
        allTime: {
          totalIncome: allTimeIncome,
          totalExpense: allTimeExpense,
          netBalance: Number(wallet.balance),
        },
        currentMonth: {
          month: currentMonth + 1,
          year: currentYear,
          income: thisMonthIncome,
          expense: thisMonthExpense,
          net: thisMonthIncome - thisMonthExpense,
        },
        currentYear: {
          year: currentYear,
          income: thisYearIncome,
          expense: thisYearExpense,
          net: thisYearIncome - thisYearExpense,
        },
      },
      recentTransactions,
    };
  }

  /**
   * Deposit money / record income into the treasury wallet atomically
   */
  async addMoney(
    schoolId: string,
    adminUser: AdminUserContext,
    dto: AddMoneyDto,
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find or create wallet inside transaction
      let wallet = await queryRunner.manager.findOne(Wallet, {
        where: { schoolId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = queryRunner.manager.create(Wallet, {
          schoolId,
          balance: 0.0,
          currency: 'BDT',
          status: WalletStatus.ACTIVE,
        });
        wallet = await queryRunner.manager.save(wallet);
      }

      if (wallet.status === WalletStatus.FROZEN) {
        throw new BadRequestException('Treasury wallet is currently frozen');
      }

      const newBalance = Number((Number(wallet.balance) + Number(dto.amount)).toFixed(2));
      wallet.balance = newBalance;
      await queryRunner.manager.save(wallet);

      const txnDate = dto.transactionDate
        ? new Date(dto.transactionDate)
        : new Date();

      const transaction = queryRunner.manager.create(WalletTransaction, {
        walletId: wallet.id,
        schoolId,
        type: WalletTransactionType.INCOME,
        amount: Number(dto.amount),
        category: dto.category.trim(),
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        referenceNumber: dto.referenceNumber?.trim() || null,
        transactionDate: txnDate,
        performedById: adminUser.id,
        performedByName: adminUser.name || null,
        attachmentUrl: dto.attachmentUrl?.trim() || null,
      });

      const savedTxn = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Added money ${dto.amount} ${wallet.currency} to schoolId ${schoolId}. New balance: ${newBalance}`,
      );

      return {
        message: 'Money added to treasury wallet successfully',
        transaction: savedTxn,
        currentBalance: newBalance,
        currency: wallet.currency,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to add money for schoolId ${schoolId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Record institutional expense deducted from the treasury wallet atomically
   */
  async addExpense(
    schoolId: string,
    adminUser: AdminUserContext,
    dto: AddExpenseDto,
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than 0');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let wallet = await queryRunner.manager.findOne(Wallet, {
        where: { schoolId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = queryRunner.manager.create(Wallet, {
          schoolId,
          balance: 0.0,
          currency: 'BDT',
          status: WalletStatus.ACTIVE,
        });
        wallet = await queryRunner.manager.save(wallet);
      }

      if (wallet.status === WalletStatus.FROZEN) {
        throw new BadRequestException('Treasury wallet is currently frozen');
      }

      const newBalance = Number((Number(wallet.balance) - Number(dto.amount)).toFixed(2));
      wallet.balance = newBalance;
      await queryRunner.manager.save(wallet);

      const txnDate = dto.transactionDate
        ? new Date(dto.transactionDate)
        : new Date();

      const transaction = queryRunner.manager.create(WalletTransaction, {
        walletId: wallet.id,
        schoolId,
        type: WalletTransactionType.EXPENSE,
        amount: Number(dto.amount),
        category: dto.category.trim(),
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        referenceNumber: dto.referenceNumber?.trim() || null,
        transactionDate: txnDate,
        performedById: adminUser.id,
        performedByName: adminUser.name || null,
        attachmentUrl: dto.attachmentUrl?.trim() || null,
      });

      const savedTxn = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Deducted expense ${dto.amount} ${wallet.currency} from schoolId ${schoolId}. New balance: ${newBalance}`,
      );

      return {
        message: 'Expense recorded successfully',
        transaction: savedTxn,
        currentBalance: newBalance,
        currency: wallet.currency,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to record expense for schoolId ${schoolId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get filtered, paginated transaction history with monthly, yearly, category,
   * type, and date-range filters, including totals summary of the filtered set.
   */
  async getTransactions(schoolId: string, query: QueryTransactionDto) {
    await this.getOrCreateWallet(schoolId);

    const qb = this.transactionRepository.createQueryBuilder('txn');
    qb.where('txn.schoolId = :schoolId', { schoolId });

    // Filter by type (INCOME | EXPENSE)
    if (query.type) {
      qb.andWhere('txn.type = :type', { type: query.type });
    }

    // Filter by category
    if (query.category) {
      qb.andWhere('txn.category = :category', { category: query.category });
    }

    // Filter by payment method
    if (query.paymentMethod) {
      qb.andWhere('txn.paymentMethod = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }

    // Filter by month & year or year only
    if (query.month && query.year) {
      const start = new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59, 999));
      qb.andWhere('txn.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      });
    } else if (query.month && !query.year) {
      const currentYear = new Date().getFullYear();
      const start = new Date(Date.UTC(currentYear, query.month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(currentYear, query.month, 0, 23, 59, 59, 999));
      qb.andWhere('txn.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      });
    } else if (query.year && !query.month) {
      const start = new Date(Date.UTC(query.year, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(query.year, 11, 31, 23, 59, 59, 999));
      qb.andWhere('txn.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      });
    } else {
      // Custom date range (startDate / endDate)
      if (query.startDate && query.endDate) {
        const start = new Date(`${query.startDate}T00:00:00.000Z`);
        const end = new Date(`${query.endDate}T23:59:59.999Z`);
        qb.andWhere('txn.transactionDate BETWEEN :startDate AND :endDate', {
          startDate: start,
          endDate: end,
        });
      } else if (query.startDate) {
        const start = new Date(`${query.startDate}T00:00:00.000Z`);
        qb.andWhere('txn.transactionDate >= :startDate', { startDate: start });
      } else if (query.endDate) {
        const end = new Date(`${query.endDate}T23:59:59.999Z`);
        qb.andWhere('txn.transactionDate <= :endDate', { endDate: end });
      }
    }

    // Search query across title, referenceNumber, description
    if (query.search && query.search.trim()) {
      const searchTerm = `%${query.search.trim()}%`;
      qb.andWhere(
        '(txn.title ILIKE :search OR txn.referenceNumber ILIKE :search OR txn.description ILIKE :search OR txn.category ILIKE :search)',
        { search: searchTerm },
      );
    }

    // Clone qb for calculating filtered totals (before applying pagination)
    const totalsQb = qb.clone();
    const rawTotals = await totalsQb
      .select('txn.type', 'type')
      .addSelect('SUM(txn.amount)', 'sum')
      .addSelect('COUNT(txn.id)', 'count')
      .groupBy('txn.type')
      .getRawMany();

    let filteredIncome = 0;
    let filteredExpense = 0;
    for (const row of rawTotals) {
      if (row.type === WalletTransactionType.INCOME) {
        filteredIncome = parseFloat(row.sum) || 0;
      } else if (row.type === WalletTransactionType.EXPENSE) {
        filteredExpense = parseFloat(row.sum) || 0;
      }
    }

    // Sorting & Pagination
    const validSortFields = ['transactionDate', 'createdAt', 'amount'];
    const sortField = validSortFields.includes(query.sortBy)
      ? `txn.${query.sortBy}`
      : 'txn.transactionDate';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortField, sortOrder);
    if (sortField !== 'txn.createdAt') {
      qb.addOrderBy('txn.createdAt', 'DESC');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    qb.skip((page - 1) * limit).take(limit);

    const [transactions, total] = await qb.getManyAndCount();

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalIncome: filteredIncome,
        totalExpense: filteredExpense,
        netBalance: filteredIncome - filteredExpense,
        totalCount: total,
      },
    };
  }

  /**
   * Get single transaction details
   */
  async getTransactionById(id: string, schoolId: string): Promise<WalletTransaction> {
    const txn = await this.transactionRepository.findOne({
      where: { id, schoolId },
    });

    if (!txn) {
      throw new NotFoundException(`Transaction with ID '${id}' not found`);
    }

    return txn;
  }

  /**
   * Update transaction metadata (category, title, description, paymentMethod, reference, attachment, date)
   */
  async updateTransaction(
    id: string,
    schoolId: string,
    updateDto: UpdateTransactionDto,
  ): Promise<WalletTransaction> {
    const txn = await this.getTransactionById(id, schoolId);

    if (updateDto.category !== undefined) txn.category = updateDto.category.trim();
    if (updateDto.title !== undefined) txn.title = updateDto.title.trim();
    if (updateDto.description !== undefined) txn.description = updateDto.description?.trim() || null;
    if (updateDto.paymentMethod !== undefined) txn.paymentMethod = updateDto.paymentMethod;
    if (updateDto.referenceNumber !== undefined) txn.referenceNumber = updateDto.referenceNumber?.trim() || null;
    if (updateDto.attachmentUrl !== undefined) txn.attachmentUrl = updateDto.attachmentUrl?.trim() || null;
    if (updateDto.transactionDate !== undefined) {
      txn.transactionDate = new Date(updateDto.transactionDate);
    }

    return await this.transactionRepository.save(txn);
  }

  /**
   * Delete transaction and safely revert its impact on the treasury wallet balance
   */
  async deleteTransaction(id: string, schoolId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const txn = await queryRunner.manager.findOne(WalletTransaction, {
        where: { id, schoolId },
      });

      if (!txn) {
        throw new NotFoundException(`Transaction with ID '${id}' not found`);
      }

      let wallet = await queryRunner.manager.findOne(Wallet, {
        where: { schoolId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = queryRunner.manager.create(Wallet, {
          schoolId,
          balance: 0.0,
          currency: 'BDT',
          status: WalletStatus.ACTIVE,
        });
      }

      // Revert balance:
      // If deleted txn was INCOME, decrease balance.
      // If deleted txn was EXPENSE, increase balance.
      let newBalance = Number(wallet.balance);
      if (txn.type === WalletTransactionType.INCOME) {
        newBalance = Number((newBalance - Number(txn.amount)).toFixed(2));
      } else if (txn.type === WalletTransactionType.EXPENSE) {
        newBalance = Number((newBalance + Number(txn.amount)).toFixed(2));
      }

      wallet.balance = newBalance;
      await queryRunner.manager.save(wallet);

      await queryRunner.manager.remove(txn);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Deleted transaction ${id} of type ${txn.type} (${txn.amount}). Reverted school wallet balance to: ${newBalance}`,
      );

      return {
        message: 'Transaction deleted and wallet balance adjusted successfully',
        deletedTransactionId: id,
        revertedAmount: Number(txn.amount),
        type: txn.type,
        newBalance,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Treasury Financial Analytics:
   * - 12-month breakdown for a given year (Jan to Dec) with income, expense, and net savings.
   * - Category breakdowns for both Income and Expenses.
   * - Key Financial KPIs.
   */
  async getAnalytics(schoolId: string, query: AnalyticsQueryDto) {
    const wallet = await this.getOrCreateWallet(schoolId);
    const targetYear = Number(query.year) || new Date().getFullYear();

    const startOfYear = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

    // Fetch all transactions in target year for breakdown
    const yearTransactions = await this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.schoolId = :schoolId', { schoolId })
      .andWhere('txn.transactionDate BETWEEN :startOfYear AND :endOfYear', {
        startOfYear,
        endOfYear,
      })
      .orderBy('txn.transactionDate', 'ASC')
      .getMany();

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Initialize 12 months array
    const monthlyBreakdown = monthNames.map((name, index) => ({
      monthNumber: index + 1,
      monthName: name,
      income: 0,
      expense: 0,
      net: 0,
      transactionCount: 0,
    }));

    let totalYearIncome = 0;
    let totalYearExpense = 0;

    const incomeCategoryMap: Record<string, { total: number; count: number }> = {};
    const expenseCategoryMap: Record<string, { total: number; count: number }> = {};

    for (const txn of yearTransactions) {
      const date = new Date(txn.transactionDate);
      const monthIdx = date.getUTCMonth();
      const amount = Number(txn.amount) || 0;

      // Filter by specific month for category map if query.month is provided
      const shouldIncludeInCategoryMap =
        !query.month || query.month === monthIdx + 1;

      if (txn.type === WalletTransactionType.INCOME) {
        monthlyBreakdown[monthIdx].income += amount;
        totalYearIncome += amount;

        if (shouldIncludeInCategoryMap) {
          if (!incomeCategoryMap[txn.category]) {
            incomeCategoryMap[txn.category] = { total: 0, count: 0 };
          }
          incomeCategoryMap[txn.category].total += amount;
          incomeCategoryMap[txn.category].count += 1;
        }
      } else if (txn.type === WalletTransactionType.EXPENSE) {
        monthlyBreakdown[monthIdx].expense += amount;
        totalYearExpense += amount;

        if (shouldIncludeInCategoryMap) {
          if (!expenseCategoryMap[txn.category]) {
            expenseCategoryMap[txn.category] = { total: 0, count: 0 };
          }
          expenseCategoryMap[txn.category].total += amount;
          expenseCategoryMap[txn.category].count += 1;
        }
      }
      monthlyBreakdown[monthIdx].transactionCount += 1;
    }

    // Compute net for each month
    monthlyBreakdown.forEach((m) => {
      m.income = Number(m.income.toFixed(2));
      m.expense = Number(m.expense.toFixed(2));
      m.net = Number((m.income - m.expense).toFixed(2));
    });

    // Format category distribution
    const categoryIncomeTotal = Object.values(incomeCategoryMap).reduce(
      (sum, item) => sum + item.total,
      0,
    );
    const categoryExpenseTotal = Object.values(expenseCategoryMap).reduce(
      (sum, item) => sum + item.total,
      0,
    );

    const incomeCategories = Object.entries(incomeCategoryMap)
      .map(([category, { total, count }]) => ({
        category,
        total: Number(total.toFixed(2)),
        count,
        percentage:
          categoryIncomeTotal > 0
            ? Number(((total / categoryIncomeTotal) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const expenseCategories = Object.entries(expenseCategoryMap)
      .map(([category, { total, count }]) => ({
        category,
        total: Number(total.toFixed(2)),
        count,
        percentage:
          categoryExpenseTotal > 0
            ? Number(((total / categoryExpenseTotal) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      year: targetYear,
      filterMonth: query.month || null,
      walletBalance: Number(wallet.balance),
      currency: wallet.currency,
      yearlyTotals: {
        totalIncome: Number(totalYearIncome.toFixed(2)),
        totalExpense: Number(totalYearExpense.toFixed(2)),
        netSavings: Number((totalYearIncome - totalYearExpense).toFixed(2)),
        totalTransactions: yearTransactions.length,
      },
      monthlyBreakdown,
      categoryDistribution: {
        income: incomeCategories,
        expense: expenseCategories,
      },
    };
  }

  /**
   * Return predefined list of standard income and expense categories
   */
  getCategories() {
    return {
      incomeCategories: [
        'Tuition Fee',
        'Admission Fee',
        'Exam Fee',
        'Session Fee',
        'Donation',
        'Govt Grant',
        'Sponsorship',
        'Book & Uniform Sale',
        'Transport Fee',
        'Hostel Fee',
        'Event Ticket',
        'Miscellaneous Income',
      ],
      expenseCategories: [
        'Teacher Salary',
        'Staff Salary',
        'Electricity Bill',
        'Water Bill',
        'Internet & Telecom Bill',
        'Building Rent',
        'Maintenance & Repairs',
        'Stationery & Printing',
        'Lab Equipment',
        'Sports Supplies',
        'Library Books',
        'Events & Celebrations',
        'Cleaning & Sanitation',
        'Software & IT Subscriptions',
        'Miscellaneous Expense',
      ],
      paymentMethods: Object.values(PaymentMethod),
    };
  }
}
