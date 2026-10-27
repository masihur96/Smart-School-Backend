import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SmsLog, SmsStatus, SmsTargetAudience } from './entities/sms-log.entity';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendTargetedSmsDto } from './dto/send-targeted-sms.dto';
import { FilterSmsLogsDto } from './dto/filter-sms-logs.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly gatewayUrl: string;
  private readonly directUrl: string;
  private readonly apiKey: string;
  private readonly defaultSenderId: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SmsLog)
    private readonly smsLogRepository: Repository<SmsLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.gatewayUrl = (
      this.configService.get<string>('SMS_GATEWAY_URL') ||
      'https://sms-api-proxy.masihur96.workers.dev'
    ).replace(/\/+$/, '');

    this.directUrl = (
      this.configService.get<string>('SMS_DIRECT_URL') ||
      'https://sms.whiteinfobd.com'
    ).replace(/\/+$/, '');

    this.apiKey =
      this.configService.get<string>('SMS_API_KEY') ||
      this.configService.get<string>('SMS_API_TOKEN') ||
      'r74NjxN9j7QblXNtGMU9FoNoNLtR9yUT2jso3OKV9699ff42';

    this.defaultSenderId =
      this.configService.get<string>('SMS_DEFAULT_SENDER_ID') || '8809639228910';
  }

  /**
   * Normalize and validate a Bangladesh mobile number.
   * Returns standard 11-digit format (01XXXXXXXXX) or null if invalid.
   */
  normalizePhoneNumber(phone: string): string | null {
    if (!phone) return null;
    const clean = phone.replace(/[\s\-\(\)\+]/g, '');
    const match = clean.match(/(?:88)?(01[3-9]\d{8})$/);
    return match ? match[1] : null;
  }

  /**
   * Helper to normalize a list of numbers, removing duplicates and invalids.
   */
  sanitizeNumberList(rawNumbers: (string | null | undefined)[]): string[] {
    const validSet = new Set<string>();
    for (const raw of rawNumbers) {
      if (!raw) continue;
      // Also handle comma-separated string inside an item
      const parts = raw.split(/[,;\n]/).map((s) => s.trim());
      for (const part of parts) {
        const normalized = this.normalizePhoneNumber(part);
        if (normalized) {
          validSet.add(normalized);
        }
      }
    }
    return Array.from(validSet);
  }

  /**
   * Internal dispatcher: sends SMS payload to White Info BD.
   * Tries primary proxy first (Cloudflare Worker), falls back to direct URL if needed.
   */
  private async dispatchToGateway(
    senderId: string,
    numbers: string[],
    message: string,
  ): Promise<any> {
    if (!numbers || numbers.length === 0) {
      throw new BadRequestException('No valid recipient numbers provided.');
    }

    const payload = {
      sender_id: senderId,
      numbers: numbers.join(','),
      body: message,
    };

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Attempt 1: Call via configured gateway (Cloudflare Worker proxy)
    const primaryEndpoint = `${this.gatewayUrl}/api/v1/messages?api_key=${encodeURIComponent(this.apiKey)}`;
    try {
      this.logger.log(`Dispatching ${numbers.length} SMS via ${this.gatewayUrl}`);
      const res = await fetch(primaryEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { raw: responseText };
      }

      this.logger.log(`Gateway response [${res.status}]: ${JSON.stringify(parsed)}`);
      return { ok: res.ok, status: res.status, data: parsed };
    } catch (primaryErr: any) {
      this.logger.warn(
        `Primary gateway failed (${primaryErr.message}). Attempting fallback to direct URL...`,
      );

      // Attempt 2: Direct White Info BD fallback
      try {
        const fallbackEndpoint = `${this.directUrl}/api/v1/messages?api_key=${encodeURIComponent(this.apiKey)}`;
        const fallbackRes = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const fallbackText = await fallbackRes.text();
        let fallbackParsed: any;
        try {
          fallbackParsed = JSON.parse(fallbackText);
        } catch {
          fallbackParsed = { raw: fallbackText };
        }

        return {
          ok: fallbackRes.ok,
          status: fallbackRes.status,
          data: fallbackParsed,
        };
      } catch (fallbackErr: any) {
        this.logger.error(`Direct fallback failed: ${fallbackErr.message}`);
        throw new InternalServerErrorException(
          `SMS gateway communication failure: ${fallbackErr.message}`,
        );
      }
    }
  }

  /**
   * 1. Send Direct Bulk SMS
   */
  async sendBulkSms(sendSmsDto: SendSmsDto, currentUser?: any) {
    const rawList: string[] = [];
    if (sendSmsDto.numbers) {
      if (Array.isArray(sendSmsDto.numbers)) {
        rawList.push(...sendSmsDto.numbers);
      } else if (typeof sendSmsDto.numbers === 'string') {
        rawList.push(sendSmsDto.numbers);
      }
    }

    if (sendSmsDto.mobNumbers && Array.isArray(sendSmsDto.mobNumbers)) {
      rawList.push(...sendSmsDto.mobNumbers);
    }

    const sanitizedNumbers = this.sanitizeNumberList(rawList);
    if (sanitizedNumbers.length === 0) {
      throw new BadRequestException(
        'Please provide at least one valid Bangladeshi mobile number (e.g. 017XXXXXXXX).',
      );
    }

    const senderId = sendSmsDto.senderId?.trim() || this.defaultSenderId;
    const schoolId = currentUser?.schoolId || null;
    const sentById = currentUser?.id || currentUser?.userId || null;

    // Create pending log entry
    const log = this.smsLogRepository.create({
      schoolId,
      senderId,
      campaignName: sendSmsDto.campaignName || 'Direct SMS Campaign',
      targetAudience: SmsTargetAudience.DIRECT,
      recipientCount: sanitizedNumbers.length,
      recipients: sanitizedNumbers,
      message: sendSmsDto.message,
      status: SmsStatus.PENDING,
      sentById,
    });
    await this.smsLogRepository.save(log);

    // Dispatch to gateway
    const result = await this.dispatchToGateway(
      senderId,
      sanitizedNumbers,
      sendSmsDto.message,
    );

    const isSuccess =
      result.ok &&
      (result.data?.code === 1000 ||
        result.data?.status === 'processing' ||
        result.data?.status === 'success');

    log.status = isSuccess ? SmsStatus.PROCESSING : SmsStatus.FAILED;
    log.batchId = result.data?.batch_id ? String(result.data.batch_id) : null;
    log.messageId = result.data?.message_id ? String(result.data.message_id) : null;
    log.responseCode = result.data?.code || (result.ok ? 1000 : result.status);
    log.rawResponse = result.data;
    if (!isSuccess) {
      log.errorMessage =
        result.data?.message || result.data?.error || 'Gateway returned non-success';
    }

    await this.smsLogRepository.save(log);

    return {
      success: isSuccess,
      logId: log.id,
      batchId: log.batchId,
      messageId: log.messageId,
      recipientCount: sanitizedNumbers.length,
      gatewayResponse: result.data,
    };
  }

  /**
   * 2. Send Targeted Bulk SMS (Filter by class, section, teacher, guardian, etc.)
   */
  async sendTargetedBulkSms(dto: SendTargetedSmsDto, currentUser?: any) {
    const schoolId = currentUser?.schoolId || null;
    const sentById = currentUser?.id || currentUser?.userId || null;

    const qb = this.userRepository.createQueryBuilder('user');
    if (schoolId) {
      qb.where('user.schoolId = :schoolId', { schoolId });
    }

    const rawPhones: string[] = [];

    switch (dto.targetAudience) {
      case SmsTargetAudience.ALL_STUDENTS: {
        qb.andWhere('user.role = :role', { role: UserRole.STUDENT });
        const students = await qb.select(['user.id', 'user.phone', 'user.guardianPhone']).getMany();
        for (const s of students) {
          if (dto.sendToGuardians !== false && s.guardianPhone) rawPhones.push(s.guardianPhone);
          if (dto.sendToStudents && s.phone) rawPhones.push(s.phone);
        }
        break;
      }

      case SmsTargetAudience.CLASS: {
        if (!dto.classId) {
          throw new BadRequestException('classId is required when targeting CLASS');
        }
        qb.andWhere('user.role = :role', { role: UserRole.STUDENT });
        qb.andWhere('user.classIds LIKE :classId', { classId: `%${dto.classId}%` });
        const students = await qb.select(['user.id', 'user.phone', 'user.guardianPhone']).getMany();
        for (const s of students) {
          if (dto.sendToGuardians !== false && s.guardianPhone) rawPhones.push(s.guardianPhone);
          if (dto.sendToStudents && s.phone) rawPhones.push(s.phone);
        }
        break;
      }

      case SmsTargetAudience.SECTION: {
        if (!dto.sectionId) {
          throw new BadRequestException('sectionId is required when targeting SECTION');
        }
        qb.andWhere('user.role = :role', { role: UserRole.STUDENT });
        if (dto.classId) {
          qb.andWhere('user.classIds LIKE :classId', { classId: `%${dto.classId}%` });
        }
        qb.andWhere('user.sectionIds LIKE :sectionId', { sectionId: `%${dto.sectionId}%` });
        const students = await qb.select(['user.id', 'user.phone', 'user.guardianPhone']).getMany();
        for (const s of students) {
          if (dto.sendToGuardians !== false && s.guardianPhone) rawPhones.push(s.guardianPhone);
          if (dto.sendToStudents && s.phone) rawPhones.push(s.phone);
        }
        break;
      }

      case SmsTargetAudience.ALL_TEACHERS: {
        qb.andWhere('user.role = :role', { role: UserRole.TEACHER });
        const teachers = await qb.select(['user.id', 'user.phone']).getMany();
        for (const t of teachers) {
          if (t.phone) rawPhones.push(t.phone);
        }
        break;
      }

      case SmsTargetAudience.ALL_PARENTS: {
        qb.andWhere('user.role = :role', { role: UserRole.STUDENT });
        const students = await qb.select(['user.id', 'user.guardianPhone']).getMany();
        for (const s of students) {
          if (s.guardianPhone) rawPhones.push(s.guardianPhone);
        }
        break;
      }

      case SmsTargetAudience.ALL_USERS: {
        const users = await qb.select(['user.id', 'user.phone', 'user.guardianPhone']).getMany();
        for (const u of users) {
          if (u.phone) rawPhones.push(u.phone);
          if (u.guardianPhone) rawPhones.push(u.guardianPhone);
        }
        break;
      }

      default:
        throw new BadRequestException(`Unsupported target audience: ${dto.targetAudience}`);
    }

    const sanitizedNumbers = this.sanitizeNumberList(rawPhones);
    if (sanitizedNumbers.length === 0) {
      throw new NotFoundException(
        `No valid phone numbers found for target audience ${dto.targetAudience}.`,
      );
    }

    const senderId = dto.senderId?.trim() || this.defaultSenderId;

    // Create log
    const log = this.smsLogRepository.create({
      schoolId,
      senderId,
      campaignName:
        dto.campaignName || `Targeted Campaign: ${dto.targetAudience}`,
      targetAudience: dto.targetAudience,
      classId: dto.classId || null,
      sectionId: dto.sectionId || null,
      recipientCount: sanitizedNumbers.length,
      recipients: sanitizedNumbers,
      message: dto.message,
      status: SmsStatus.PENDING,
      sentById,
    });
    await this.smsLogRepository.save(log);

    // Dispatch
    const result = await this.dispatchToGateway(
      senderId,
      sanitizedNumbers,
      dto.message,
    );

    const isSuccess =
      result.ok &&
      (result.data?.code === 1000 ||
        result.data?.status === 'processing' ||
        result.data?.status === 'success');

    log.status = isSuccess ? SmsStatus.PROCESSING : SmsStatus.FAILED;
    log.batchId = result.data?.batch_id ? String(result.data.batch_id) : null;
    log.messageId = result.data?.message_id ? String(result.data.message_id) : null;
    log.responseCode = result.data?.code || (result.ok ? 1000 : result.status);
    log.rawResponse = result.data;
    if (!isSuccess) {
      log.errorMessage =
        result.data?.message || result.data?.error || 'Gateway returned non-success';
    }

    await this.smsLogRepository.save(log);

    return {
      success: isSuccess,
      logId: log.id,
      batchId: log.batchId,
      messageId: log.messageId,
      targetAudience: dto.targetAudience,
      recipientCount: sanitizedNumbers.length,
      gatewayResponse: result.data,
    };
  }

  /**
   * 3. Check SMS Account Balance
   */
  async checkBalance(): Promise<any> {
    const urls = [
      `${this.gatewayUrl}/api/v1/balance?api_key=${encodeURIComponent(this.apiKey)}`,
      `${this.directUrl}/api/v1/balance?api_key=${encodeURIComponent(this.apiKey)}`,
    ];

    let lastError: any;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        return data;
      } catch (err) {
        lastError = err;
      }
    }

    throw new InternalServerErrorException(
      `Failed to connect to White Info BD balance API: ${lastError?.message}`,
    );
  }

  /**
   * 4. Get Approved Senders
   */
  async getSenders(): Promise<any> {
    const urls = [
      `${this.gatewayUrl}/api/v1/senders?api_key=${encodeURIComponent(this.apiKey)}`,
      `${this.directUrl}/api/v1/senders?api_key=${encodeURIComponent(this.apiKey)}`,
    ];

    let lastError: any;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        return data;
      } catch (err) {
        lastError = err;
      }
    }

    throw new InternalServerErrorException(
      `Failed to fetch senders from White Info BD: ${lastError?.message}`,
    );
  }

  /**
   * 5. Get Delivery Status for a Batch ID and sync with SmsLog
   */
  async getBatchReport(batchId: string): Promise<any> {
    const urls = [
      `${this.gatewayUrl}/api/v1/batches/${encodeURIComponent(batchId)}?api_key=${encodeURIComponent(this.apiKey)}`,
      `${this.directUrl}/api/v1/batches/${encodeURIComponent(batchId)}?api_key=${encodeURIComponent(this.apiKey)}`,
    ];

    let report: any = null;
    let lastError: any;

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
          },
        });
        report = await res.json();
        if (report) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!report) {
      throw new InternalServerErrorException(
        `Failed to retrieve batch report for ID ${batchId}: ${lastError?.message}`,
      );
    }

    // Sync status into SmsLog if existing
    const existingLog = await this.smsLogRepository.findOne({
      where: { batchId },
    });
    if (existingLog) {
      if (report.status === 'completed') {
        existingLog.status = SmsStatus.COMPLETED;
      } else if (report.status === 'failed') {
        existingLog.status = SmsStatus.FAILED;
      }
      existingLog.rawResponse = {
        ...existingLog.rawResponse,
        deliveryReport: report,
      };
      await this.smsLogRepository.save(existingLog);
    }

    return report;
  }

  /**
   * 6. Query SMS History / Logs with pagination and filters
   */
  async getLogs(dto: FilterSmsLogsDto, currentUser?: any) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.smsLogRepository.createQueryBuilder('log');

    // Tenant isolation: if currentUser belongs to a school and is not SUPER_ADMIN
    if (currentUser?.schoolId && currentUser?.role !== UserRole.SUPER_ADMIN) {
      qb.where('log.schoolId = :schoolId', { schoolId: currentUser.schoolId });
    }

    if (dto.status) {
      qb.andWhere('log.status = :status', { status: dto.status });
    }

    if (dto.targetAudience) {
      qb.andWhere('log.targetAudience = :targetAudience', {
        targetAudience: dto.targetAudience,
      });
    }

    if (dto.search) {
      qb.andWhere(
        '(log.campaignName ILIKE :search OR log.message ILIKE :search OR log.senderId ILIKE :search)',
        { search: `%${dto.search}%` },
      );
    }

    if (dto.startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate: dto.startDate });
    }

    if (dto.endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate: dto.endDate });
    }

    qb.orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 7. Get single SMS Log by ID
   */
  async getLogById(id: string, currentUser?: any): Promise<SmsLog> {
    const log = await this.smsLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`SMS log with ID ${id} not found`);
    }

    if (
      currentUser?.schoolId &&
      currentUser?.role !== UserRole.SUPER_ADMIN &&
      log.schoolId &&
      log.schoolId !== currentUser.schoolId
    ) {
      throw new NotFoundException(`SMS log with ID ${id} not found`);
    }

    return log;
  }
}
