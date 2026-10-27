import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder, LessThan } from 'typeorm';
import { FeeStructure, FeeType } from './entities/fee-structure.entity';
import { FeeInvoice, FeeStatus, PaymentMode } from './entities/fee-invoice.entity';
import { FeePayment, FeePaymentMethod } from './entities/fee-payment.entity';
import { FeeSetting } from './entities/fee-setting.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { GenerateFeesDto } from './dto/generate-fees.dto';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { FilterInvoicesDto } from './dto/filter-invoices.dto';
import { UpdateFeeSettingDto } from './dto/update-fee-setting.dto';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepo: Repository<FeeStructure>,
    @InjectRepository(FeeInvoice)
    private readonly feeInvoiceRepo: Repository<FeeInvoice>,
    @InjectRepository(FeePayment)
    private readonly feePaymentRepo: Repository<FeePayment>,
    @InjectRepository(FeeSetting)
    private readonly feeSettingRepo: Repository<FeeSetting>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @Optional()
    @Inject(forwardRef(() => WalletService))
    private readonly walletService?: WalletService,
    @Optional()
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService?: NotificationsService,
  ) {}

  // ═════════════════════════════════════════════════════════════════════════
  // 1. FEE SETTINGS (PERSONAL PAYMENT VS SCHOOL CARE PAYMENT)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Finds or initializes school payment settings.
   * Default mode is PERSONAL_PAYMENT.
   */
  async getOrCreateFeeSetting(schoolId: string): Promise<FeeSetting> {
    if (!schoolId) {
      throw new BadRequestException('schoolId is required.');
    }

    let setting = await this.feeSettingRepo.findOne({ where: { schoolId } });
    if (!setting) {
      setting = this.feeSettingRepo.create({
        schoolId,
        defaultPaymentMode: PaymentMode.PERSONAL_PAYMENT,
        lateFeeFinePerDay: 0,
        currency: 'BDT',
        personalPaymentInfo: {
          instructions:
            'Please pay fees directly at the school accounts counter or via our designated mobile banking / bank account.',
        },
        schoolCarePaymentInfo: {
          enabled: false,
          instructions: 'Pay online via School Care automated payment gateway.',
        },
      });
      setting = await this.feeSettingRepo.save(setting);
    }

    return setting;
  }

  async getFeeSetting(currentUser: any): Promise<FeeSetting> {
    const schoolId = currentUser.schoolId;
    return this.getOrCreateFeeSetting(schoolId);
  }

  async updateFeeSetting(dto: UpdateFeeSettingDto, currentUser: any): Promise<FeeSetting> {
    const schoolId = currentUser.schoolId;
    const setting = await this.getOrCreateFeeSetting(schoolId);

    if (dto.defaultPaymentMode) {
      setting.defaultPaymentMode = dto.defaultPaymentMode;
    }

    if (dto.personalPaymentInfo) {
      setting.personalPaymentInfo = {
        ...setting.personalPaymentInfo,
        ...dto.personalPaymentInfo,
      };
    }

    if (dto.schoolCarePaymentInfo) {
      setting.schoolCarePaymentInfo = {
        ...setting.schoolCarePaymentInfo,
        ...dto.schoolCarePaymentInfo,
      };
    }

    if (dto.lateFeeFinePerDay !== undefined) {
      setting.lateFeeFinePerDay = dto.lateFeeFinePerDay;
    }

    if (dto.currency) {
      setting.currency = dto.currency;
    }

    return this.feeSettingRepo.save(setting);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. FEE STRUCTURES (HEADS / TEMPLATES)
  // ═════════════════════════════════════════════════════════════════════════

  async createStructure(dto: CreateFeeStructureDto, currentUser: any) {
    const schoolId = currentUser.schoolId;

    const structure = this.feeStructureRepo.create({
      schoolId,
      name: dto.name.trim(),
      feeType: dto.feeType,
      description: dto.description?.trim(),
      amount: dto.amount,
      frequency: dto.frequency,
      classIds: dto.classIds || [],
      isActive: true,
    });

    return this.feeStructureRepo.save(structure);
  }

  async findAllStructures(currentUser: any) {
    const schoolId = currentUser.schoolId;
    return this.feeStructureRepo.find({
      where: { schoolId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findStructureById(id: string, currentUser: any) {
    const structure = await this.feeStructureRepo.findOne({
      where: { id, schoolId: currentUser.schoolId },
    });
    if (!structure) {
      throw new NotFoundException(`Fee structure with ID ${id} not found.`);
    }
    return structure;
  }

  async updateStructure(id: string, dto: Partial<CreateFeeStructureDto>, currentUser: any) {
    const structure = await this.findStructureById(id, currentUser);
    Object.assign(structure, dto);
    return this.feeStructureRepo.save(structure);
  }

  async deleteStructure(id: string, currentUser: any) {
    await this.findStructureById(id, currentUser);
    await this.feeStructureRepo.softDelete(id);
    return { success: true, message: 'Fee structure deleted successfully.' };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. GENERATE SCHOOL FEES (ADMIN CAN GENERATE SCHOOL FEES)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Generates fee invoices in bulk by class, for individual student, or batch of students.
   * Auto-assigns invoice numbers and dispatches notifications.
   */
  async generateFees(dto: GenerateFeesDto, currentUser: any) {
    const schoolId = currentUser.schoolId;
    const settings = await this.getOrCreateFeeSetting(schoolId);

    const paymentMode = dto.paymentMode || settings.defaultPaymentMode || PaymentMode.PERSONAL_PAYMENT;
    const dueDate = new Date(dto.dueDate);

    // 1. Resolve Target Students
    let targetStudents: User[] = [];

    if (dto.studentId) {
      const student = await this.userRepo.findOne({
        where: { id: dto.studentId, schoolId, role: UserRole.STUDENT, isActive: true },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${dto.studentId} not found in this school.`);
      }
      targetStudents = [student];
    } else if (dto.studentIds && dto.studentIds.length > 0) {
      targetStudents = await this.userRepo.find({
        where: {
          id: In(dto.studentIds),
          schoolId,
          role: UserRole.STUDENT,
          isActive: true,
        },
      });
      if (targetStudents.length === 0) {
        throw new NotFoundException('No active students found for specified IDs.');
      }
    } else if (dto.classId) {
      // Find all students enrolled in this class
      const qb = this.userRepo
        .createQueryBuilder('user')
        .where('user.schoolId = :schoolId', { schoolId })
        .andWhere('user.role = :role', { role: UserRole.STUDENT })
        .andWhere('user.isActive = :isActive', { isActive: true })
        .andWhere('user.classIds LIKE :classId', { classId: `%${dto.classId}%` });

      if (dto.sectionId) {
        qb.andWhere('user.sectionIds LIKE :sectionId', {
          sectionId: `%${dto.sectionId}%`,
        });
      }

      targetStudents = await qb.getMany();
      if (targetStudents.length === 0) {
        throw new NotFoundException('No active students found in the selected class/section.');
      }
    } else {
      throw new BadRequestException('Must specify classId, studentId, or studentIds to generate fees.');
    }

    // 2. Generate Invoices
    const baseAmount = Number(dto.amount);
    const discountAmount = dto.discountAmount ? Number(dto.discountAmount) : 0;
    const payableAmount = Math.max(0, baseAmount - discountAmount);

    const invoicesToCreate: FeeInvoice[] = [];
    const datePrefix = `${dto.year}${String(dto.month || new Date().getMonth() + 1).padStart(2, '0')}`;

    for (let i = 0; i < targetStudents.length; i++) {
      const student = targetStudents[i];
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${datePrefix}-${randomSuffix}${i}`;

      const invoice = this.feeInvoiceRepo.create({
        schoolId,
        invoiceNumber,
        studentId: student.id,
        classId: dto.classId || (Array.isArray(student.classIds) ? student.classIds[0] : null),
        sectionId: dto.sectionId || (Array.isArray(student.sectionIds) ? student.sectionIds[0] : null),
        title: dto.title.trim(),
        description: dto.description?.trim(),
        feeType: dto.feeType || FeeType.TUITION,
        feeStructureId: dto.feeStructureId,
        month: dto.month,
        year: dto.year,
        dueDate,
        amount: baseAmount,
        discountAmount,
        fineAmount: 0,
        payableAmount,
        paidAmount: 0,
        dueAmount: payableAmount,
        status: FeeStatus.UNPAID,
        paymentMode,
        createdById: currentUser.id,
      });

      invoicesToCreate.push(invoice);
    }

    const savedInvoices = await this.feeInvoiceRepo.save(invoicesToCreate);

    // 3. Dispatch Push Notifications asynchronously
    this.sendFeeGeneratedNotifications(savedInvoices).catch((err) =>
      this.logger.warn(`Failed to dispatch fee notifications: ${err.message}`),
    );

    return {
      message: `Successfully generated ${savedInvoices.length} fee invoice(s).`,
      generatedCount: savedInvoices.length,
      invoices: savedInvoices,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. COLLECT / RECORD PAYMENT (PERSONAL OR SCHOOL CARE PAYMENT)
  // ═════════════════════════════════════════════════════════════════════════

  async collectPayment(invoiceId: string, dto: CollectPaymentDto, currentUser: any) {
    const invoice = await this.feeInvoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['student'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found.`);
    }

    if (invoice.status === FeeStatus.PAID) {
      throw new BadRequestException('This invoice has already been fully paid.');
    }

    const paymentAmount = Number(dto.amount);
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    // Apply any late fee fine if overdue and configured
    let fineAmount = invoice.fineAmount;
    const now = new Date();
    if (now > invoice.dueDate) {
      const setting = await this.getOrCreateFeeSetting(invoice.schoolId);
      if (setting.lateFeeFinePerDay > 0) {
        const overdueDays = Math.ceil((now.getTime() - invoice.dueDate.getTime()) / (1000 * 3600 * 24));
        fineAmount = Math.max(fineAmount, overdueDays * setting.lateFeeFinePerDay);
        invoice.fineAmount = fineAmount;
        invoice.payableAmount = invoice.amount - invoice.discountAmount + fineAmount;
      }
    }

    const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
    const newDueAmount = Math.max(0, invoice.payableAmount - newPaidAmount);

    invoice.paidAmount = newPaidAmount;
    invoice.dueAmount = newDueAmount;

    if (newDueAmount <= 0) {
      invoice.status = FeeStatus.PAID;
    } else {
      invoice.status = FeeStatus.PARTIALLY_PAID;
    }

    const paymentMode = dto.paymentMode || invoice.paymentMode || PaymentMode.PERSONAL_PAYMENT;
    invoice.paymentMode = paymentMode;

    await this.feeInvoiceRepo.save(invoice);

    // Generate unique Receipt Number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-${datePrefix}-${randomSuffix}`;

    const payment = this.feePaymentRepo.create({
      schoolId: invoice.schoolId,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      receiptNumber,
      amount: paymentAmount,
      paymentMode,
      paymentMethod: dto.paymentMethod || FeePaymentMethod.CASH,
      transactionId: dto.transactionId?.trim(),
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      note: dto.note?.trim(),
      collectedById: currentUser.id,
    });

    const savedPayment = await this.feePaymentRepo.save(payment);

    // Optional: Synchronize with Treasury Wallet as INCOME
    if (dto.syncToWallet !== false && this.walletService) {
      try {
        await this.walletService.addMoney(
          invoice.schoolId,
          {
            id: currentUser.id,
            name: currentUser.name || 'Admin',
            email: currentUser.email,
            role: currentUser.role,
          },
          {
            amount: paymentAmount,
            category: 'Student Fees',
            title: `Fee Collection: ${invoice.title} (${receiptNumber})`,
            description: `Payment for ${invoice.student?.name || 'Student'} (Invoice #${invoice.invoiceNumber})`,
            paymentMethod: (dto.paymentMethod as any) || 'CASH',
            referenceNumber: receiptNumber,
          },
        );
      } catch (err: any) {
        this.logger.warn(`Could not sync fee to Treasury Wallet: ${err.message}`);
      }
    }

    // Send payment confirmation notification to student
    this.sendPaymentReceiptNotification(invoice, savedPayment).catch((err) =>
      this.logger.warn(`Failed to dispatch payment notification: ${err.message}`),
    );

    return {
      message: 'Payment recorded successfully.',
      invoice,
      payment: savedPayment,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. PRINT INVOICE & RECEIPT SLIP ("AND PRINT")
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Generates full printable receipt data with student, school, fee breakdown,
   * payment history, and ready-to-render printable HTML.
   */
  async getPrintableInvoice(invoiceId: string, currentUser: any) {
    const invoice = await this.feeInvoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['student', 'payments', 'payments.collectedBy'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found.`);
    }

    // Permission check: Student can only print their own; Admin can print any
    if (currentUser.role === UserRole.STUDENT && invoice.studentId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to view or print this invoice.');
    }

    const school = await this.schoolRepo.findOne({
      where: { schoolId: invoice.schoolId },
    });

    let className: string = 'N/A';
    if (invoice.classId) {
      const cls = await this.classRepo.findOne({ where: { id: invoice.classId } });
      if (cls) className = cls.name;
    }

    const setting = await this.getOrCreateFeeSetting(invoice.schoolId);

    const paymentInstructions =
      invoice.paymentMode === PaymentMode.PERSONAL_PAYMENT
        ? setting.personalPaymentInfo
        : setting.schoolCarePaymentInfo;

    const printableData = {
      school: {
        name: school?.name || 'Smart School',
        address: school?.address || 'School Campus',
        phone: school?.phone || '',
        email: school?.email || '',
        logo: school?.avatar || null,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title,
        feeType: invoice.feeType,
        billingPeriod: `${invoice.month || ''} ${invoice.year}`.trim(),
        issueDate: invoice.createdAt,
        dueDate: invoice.dueDate,
        amount: invoice.amount,
        discountAmount: invoice.discountAmount,
        fineAmount: invoice.fineAmount,
        payableAmount: invoice.payableAmount,
        paidAmount: invoice.paidAmount,
        dueAmount: invoice.dueAmount,
        status: invoice.status,
        paymentMode: invoice.paymentMode,
      },
      student: {
        id: invoice.student?.id,
        name: invoice.student?.name,
        rollNumber: invoice.student?.rollNumber || 'N/A',
        className,
        email: invoice.student?.email,
        phone: invoice.student?.phone || invoice.student?.guardianPhone || 'N/A',
      },
      paymentHistory: (invoice.payments || []).map((p) => ({
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMode: p.paymentMode,
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId || 'N/A',
        collectedByName: p.collectedBy?.name || 'Accounts Officer',
      })),
      paymentInstructions,
      currency: setting.currency || 'BDT',
    };

    const htmlTemplate = this.generatePrintableHtml(printableData);

    return {
      ...printableData,
      htmlTemplate,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. STUDENT HISTORICAL DATA ("IN STUDENT HAVE HISTORICAL DATA ALSO")
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Retrieves complete historical fee records, payment receipts, and balance summary for a student.
   */
  async getStudentFeeHistory(
    studentId: string,
    currentUser: any,
    filters?: { year?: number; month?: string; status?: FeeStatus; feeType?: FeeType },
  ) {
    // If student is querying, ensure they only access their own record
    if (currentUser.role === UserRole.STUDENT && studentId !== currentUser.id) {
      throw new ForbiddenException('You can only access your own fee history.');
    }

    const student = await this.userRepo.findOne({
      where: { id: studentId },
      select: ['id', 'name', 'email', 'rollNumber', 'classIds', 'schoolId', 'phone', 'guardianPhone'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found.`);
    }

    const qb = this.feeInvoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.payments', 'payments')
      .where('inv.studentId = :studentId', { studentId });

    if (filters?.year) {
      qb.andWhere('inv.year = :year', { year: filters.year });
    }
    if (filters?.month) {
      qb.andWhere('inv.month = :month', { month: filters.month });
    }
    if (filters?.status) {
      qb.andWhere('inv.status = :status', { status: filters.status });
    }
    if (filters?.feeType) {
      qb.andWhere('inv.feeType = :feeType', { feeType: filters.feeType });
    }

    qb.orderBy('inv.createdAt', 'DESC');

    const invoices = await qb.getMany();

    // Calculate Summary Statistics
    let totalInvoiced = 0;
    let totalDiscount = 0;
    let totalFine = 0;
    let totalPayable = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalOverdue = 0;
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;

    const now = new Date();
    const allPayments: FeePayment[] = [];

    for (const inv of invoices) {
      totalInvoiced += Number(inv.amount);
      totalDiscount += Number(inv.discountAmount);
      totalFine += Number(inv.fineAmount);
      totalPayable += Number(inv.payableAmount);
      totalPaid += Number(inv.paidAmount);
      totalDue += Number(inv.dueAmount);

      if (inv.status === FeeStatus.PAID) {
        paidInvoicesCount++;
      } else {
        pendingInvoicesCount++;
        if (new Date(inv.dueDate) < now) {
          totalOverdue += Number(inv.dueAmount);
        }
      }

      if (inv.payments && inv.payments.length > 0) {
        allPayments.push(...inv.payments);
      }
    }

    // Sort payments chronologically
    allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const settings = await this.getOrCreateFeeSetting(student.schoolId || currentUser.schoolId);

    return {
      student: {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        phone: student.phone || student.guardianPhone,
      },
      summary: {
        totalInvoiced: parseFloat(totalInvoiced.toFixed(2)),
        totalDiscount: parseFloat(totalDiscount.toFixed(2)),
        totalFine: parseFloat(totalFine.toFixed(2)),
        totalPayable: parseFloat(totalPayable.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        totalDue: parseFloat(totalDue.toFixed(2)),
        totalOverdue: parseFloat(totalOverdue.toFixed(2)),
        invoicesCount: invoices.length,
        paidInvoicesCount,
        pendingInvoicesCount,
        currency: settings.currency || 'BDT',
      },
      invoices,
      payments: allPayments,
      activePaymentInstructions:
        settings.defaultPaymentMode === PaymentMode.PERSONAL_PAYMENT
          ? settings.personalPaymentInfo
          : settings.schoolCarePaymentInfo,
      defaultPaymentMode: settings.defaultPaymentMode,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. INVOICE LIST & SEARCH (ADMIN & STUDENT SCOPING)
  // ═════════════════════════════════════════════════════════════════════════

  async findAllInvoices(filters: FilterInvoicesDto, currentUser: any) {
    const schoolId = currentUser.schoolId;
    const page = filters.page && filters.page > 0 ? Number(filters.page) : 1;
    const limit = filters.limit && filters.limit > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const qb = this.feeInvoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.student', 'student')
      .leftJoinAndSelect('inv.payments', 'payments');

    if (schoolId && currentUser.role !== UserRole.SUPER_ADMIN) {
      qb.andWhere('inv.schoolId = :schoolId', { schoolId });
    }

    // Scoping: Student only sees their own
    if (currentUser.role === UserRole.STUDENT) {
      qb.andWhere('inv.studentId = :myId', { myId: currentUser.id });
    } else if (filters.studentId) {
      qb.andWhere('inv.studentId = :studentId', { studentId: filters.studentId });
    }

    if (filters.classId) {
      qb.andWhere('inv.classId = :classId', { classId: filters.classId });
    }
    if (filters.feeType) {
      qb.andWhere('inv.feeType = :feeType', { feeType: filters.feeType });
    }
    if (filters.status) {
      qb.andWhere('inv.status = :status', { status: filters.status });
    }
    if (filters.paymentMode) {
      qb.andWhere('inv.paymentMode = :paymentMode', { paymentMode: filters.paymentMode });
    }
    if (filters.month) {
      qb.andWhere('inv.month = :month', { month: filters.month });
    }
    if (filters.year) {
      qb.andWhere('inv.year = :year', { year: filters.year });
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(inv.invoiceNumber) LIKE :search OR LOWER(inv.title) LIKE :search OR LOWER(student.name) LIKE :search OR student.rollNumber LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('inv.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [invoices, total] = await qb.getManyAndCount();

    const enrichedInvoices = invoices.map((inv) => ({
      ...inv,
      studentName: inv.student?.name || (inv as any).studentName,
      studentRoll: inv.student?.rollNumber || (inv as any).studentRoll,
    }));

    return {
      data: enrichedInvoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findInvoiceById(id: string, currentUser: any) {
    const invoice = await this.feeInvoiceRepo.findOne({
      where: { id },
      relations: ['student', 'payments', 'payments.collectedBy'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }

    if (currentUser.role === UserRole.STUDENT && invoice.studentId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to view this invoice.');
    }

    return {
      ...invoice,
      studentName: invoice.student?.name || (invoice as any).studentName,
      studentRoll: invoice.student?.rollNumber || (invoice as any).studentRoll,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. STATS & ANALYTICS DASHBOARD
  // ═════════════════════════════════════════════════════════════════════════

  async getStats(currentUser: any) {
    const schoolId = currentUser.schoolId;
    const qb = this.feeInvoiceRepo.createQueryBuilder('inv');

    if (schoolId && currentUser.role !== UserRole.SUPER_ADMIN) {
      qb.andWhere('inv.schoolId = :schoolId', { schoolId });
    }

    const invoices = await qb.getMany();

    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalDue = 0;
    let totalOverdue = 0;
    let paidCount = 0;
    let partiallyPaidCount = 0;
    let unpaidCount = 0;

    const now = new Date();
    const byFeeType: Record<string, number> = {};

    for (const inv of invoices) {
      totalInvoiced += Number(inv.payableAmount);
      totalCollected += Number(inv.paidAmount);
      totalDue += Number(inv.dueAmount);

      if (inv.status === FeeStatus.PAID) paidCount++;
      else if (inv.status === FeeStatus.PARTIALLY_PAID) partiallyPaidCount++;
      else unpaidCount++;

      if (inv.status !== FeeStatus.PAID && new Date(inv.dueDate) < now) {
        totalOverdue += Number(inv.dueAmount);
      }

      byFeeType[inv.feeType] = (byFeeType[inv.feeType] || 0) + Number(inv.paidAmount);
    }

    const collectionRate =
      totalInvoiced > 0 ? parseFloat(((totalCollected / totalInvoiced) * 100).toFixed(2)) : 0;

    return {
      totalInvoiced: parseFloat(totalInvoiced.toFixed(2)),
      totalCollected: parseFloat(totalCollected.toFixed(2)),
      totalDue: parseFloat(totalDue.toFixed(2)),
      totalOverdue: parseFloat(totalOverdue.toFixed(2)),
      collectionRate,
      invoicesCount: invoices.length,
      paidCount,
      partiallyPaidCount,
      unpaidCount,
      byFeeType,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NOTIFICATION & HTML SLIP HELPERS
  // ═════════════════════════════════════════════════════════════════════════

  private async sendFeeGeneratedNotifications(invoices: FeeInvoice[]) {
    if (!this.notificationsService) return;

    for (const inv of invoices) {
      await this.notificationsService.sendToUser(
        inv.studentId,
        `New Fee Invoice: ${inv.title}`,
        `An invoice for ${inv.payableAmount} has been generated. Due date: ${new Date(inv.dueDate).toLocaleDateString()}.`,
        {
          type: 'FEE_INVOICE',
          invoiceId: inv.id,
          amount: String(inv.payableAmount),
        },
        inv.schoolId,
      );
    }
  }

  private async sendPaymentReceiptNotification(invoice: FeeInvoice, payment: FeePayment) {
    if (!this.notificationsService) return;

    await this.notificationsService.sendToUser(
      invoice.studentId,
      `Fee Payment Received: ${payment.receiptNumber}`,
      `Your payment of ${payment.amount} for "${invoice.title}" was recorded. Remaining due: ${invoice.dueAmount}.`,
      {
        type: 'FEE_PAYMENT',
        receiptNumber: payment.receiptNumber,
        invoiceId: invoice.id,
      },
      invoice.schoolId,
    );
  }

  private generatePrintableHtml(data: any): string {
    const paymentRows = (data.paymentHistory || [])
      .map(
        (p: any) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.receiptNumber}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(p.paymentDate).toLocaleDateString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.paymentMethod} (${p.paymentMode})</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.transactionId}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${data.currency} ${p.amount}</td>
        </tr>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fee Invoice Slip - ${data.invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 20px; line-height: 1.5; }
    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
    .school-info h2 { margin: 0 0 5px 0; color: #1e3a8a; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
    .badge-PAID { background: #dcfce7; color: #166534; }
    .badge-UNPAID { background: #fee2e2; color: #991b1b; }
    .badge-PARTIALLY_PAID { background: #fef9c3; color: #854d0e; }
    .meta-table, .breakdown-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .breakdown-table th { background: #f8fafc; padding: 10px; border: 1px solid #ddd; text-align: left; }
    .breakdown-table td { padding: 10px; border: 1px solid #ddd; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
    .sig-line { width: 200px; border-top: 1px dashed #666; text-align: center; padding-top: 5px; font-size: 12px; }
    @media print { body { margin: 0; } .invoice-box { border: none; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div class="school-info">
        <h2>${data.school.name}</h2>
        <div>${data.school.address}</div>
        <div>Phone: ${data.school.phone} | Email: ${data.school.email}</div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-${data.invoice.status}">${data.invoice.status}</span>
        <h3 style="margin: 10px 0 0 0; color: #2563eb;">${data.invoice.invoiceNumber}</h3>
        <small>Date: ${new Date(data.invoice.issueDate).toLocaleDateString()}</small>
      </div>
    </div>

    <table class="meta-table">
      <tr>
        <td style="width: 50%;">
          <strong>Student Details:</strong><br>
          Name: ${data.student.name}<br>
          Roll: ${data.student.rollNumber} | Class: ${data.student.className}<br>
          Phone: ${data.student.phone}
        </td>
        <td style="width: 50%; text-align: right;">
          <strong>Invoice Details:</strong><br>
          Title: ${data.invoice.title}<br>
          Due Date: <strong>${new Date(data.invoice.dueDate).toLocaleDateString()}</strong><br>
          Payment Mode: ${data.invoice.paymentMode}
        </td>
      </tr>
    </table>

    <table class="breakdown-table">
      <thead>
        <tr>
          <th>Fee Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Base Fee Amount</td>
          <td style="text-align: right;">${data.currency} ${data.invoice.amount}</td>
        </tr>
        <tr>
          <td>Discount / Waiver</td>
          <td style="text-align: right; color: green;">- ${data.currency} ${data.invoice.discountAmount}</td>
        </tr>
        <tr>
          <td>Late Fee / Fine</td>
          <td style="text-align: right; color: red;">+ ${data.currency} ${data.invoice.fineAmount}</td>
        </tr>
        <tr style="font-weight: bold; background: #f8fafc;">
          <td>Total Payable Amount</td>
          <td style="text-align: right;">${data.currency} ${data.invoice.payableAmount}</td>
        </tr>
        <tr style="color: #166534;">
          <td>Total Paid Amount</td>
          <td style="text-align: right;">${data.currency} ${data.invoice.paidAmount}</td>
        </tr>
        <tr style="font-weight: bold; color: #991b1b; background: #fff1f2;">
          <td>Balance Due</td>
          <td style="text-align: right;">${data.currency} ${data.invoice.dueAmount}</td>
        </tr>
      </tbody>
    </table>

    ${
      paymentRows
        ? `
      <h4>Payment Receipts</h4>
      <table class="breakdown-table" style="font-size: 13px;">
        <thead>
          <tr>
            <th>Receipt #</th>
            <th>Date</th>
            <th>Method</th>
            <th>Trx ID</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${paymentRows}
        </tbody>
      </table>`
        : ''
    }

    <div class="signatures">
      <div class="sig-line">Student / Guardian Signature</div>
      <div class="sig-line">Authorized Officer / Cashier</div>
    </div>
  </div>
</body>
</html>`;
  }
}
