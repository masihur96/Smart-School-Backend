import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { GenerateFeesDto } from './dto/generate-fees.dto';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { FilterInvoicesDto } from './dto/filter-invoices.dto';
import { UpdateFeeSettingDto } from './dto/update-fee-setting.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Fees Management')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // ═════════════════════════════════════════════════════════════════════════
  // 1. PAYMENT SETTINGS (PERSONAL PAYMENT VS SCHOOL CARE PAYMENT)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Get current school payment mode configuration and accepted payment instructions.
   */
  @Get('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get school payment settings (Personal Payment vs School Care)',
    description:
      'Returns active payment mode, bank details, bKash/Nagad instructions, or School Care automated gateway info.',
  })
  getSettings(@CurrentUser() user: any) {
    return this.feesService.getFeeSetting(user);
  }

  /**
   * Update school payment mode (Admin can choose Personal Payment or School Care Payment).
   */
  @Patch('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update school payment mode and configuration (Admin)',
    description:
      'Allows admin to toggle between Personal Payment and School Care Payment and configure bank/mobile money numbers.',
  })
  updateSettings(
    @Body() dto: UpdateFeeSettingDto,
    @CurrentUser() user: any,
  ) {
    return this.feesService.updateFeeSetting(dto, user);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. GENERATE SCHOOL FEES (ADMIN CAN GENERATE SCHOOL FEES)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Admin generates school fees for an entire class or specific student(s).
   */
  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Generate school fees (Admin)',
    description:
      'Generate fee invoices in bulk by class, for individual student, or batch of students with auto-assigned invoice numbers.',
  })
  @ApiResponse({ status: 201, description: 'Fees generated successfully.' })
  generateFees(
    @Body() dto: GenerateFeesDto,
    @CurrentUser() user: any,
  ) {
    return this.feesService.generateFees(dto, user);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. STUDENT HISTORICAL DATA (HISTORICAL DATA FOR STUDENTS)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Student views their own historical fee records, dues, and payment receipts.
   */
  @Get('student/history')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get historical fee data for authenticated student',
    description:
      'Returns complete historical invoices, payments log, total invoiced, total paid, and outstanding dues.',
  })
  getOwnStudentHistory(
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Query('month') month?: string,
  ) {
    return this.feesService.getStudentFeeHistory(user.id, user, {
      year: year ? Number(year) : undefined,
      month,
    });
  }

  /**
   * Admin views complete historical fee records for any student.
   */
  @Get('students/:studentId/history')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get historical fee data for a specific student (Admin)',
    description:
      'Provides full historical records, payments log, total invoiced, total paid, and overdue summary for a student.',
  })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  getStudentHistoryByAdmin(
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Query('month') month?: string,
  ) {
    return this.feesService.getStudentFeeHistory(studentId, user, {
      year: year ? Number(year) : undefined,
      month,
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. PRINT INVOICE & RECEIPT SLIP ("AND PRINT")
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Generate printable invoice slip and ready-to-render printable HTML.
   */
  @Get('invoices/:id/print')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @ApiOperation({
    summary: 'Get printable fee invoice and receipt slip (Print)',
    description:
      'Returns structured printable invoice data and ready-to-print clean HTML receipt slip.',
  })
  @ApiParam({ name: 'id', description: 'Fee Invoice UUID' })
  getPrintableInvoice(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.feesService.getPrintableInvoice(id, user);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. COLLECT PAYMENT (RECORD PAYMENT TOWARDS INVOICE)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Record a payment towards an invoice (Admin).
   */
  @Post('invoices/:id/payments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Record fee payment towards an invoice (Admin)',
    description:
      'Collects fee, updates status (Paid/Partially Paid), generates receipt number, and optionally credits treasury wallet.',
  })
  @ApiParam({ name: 'id', description: 'Fee Invoice UUID' })
  collectPayment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CollectPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.feesService.collectPayment(id, dto, user);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. INVOICES LIST & SEARCH
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * List invoices with filters, search, and pagination.
   */
  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: 'List fee invoices with filters and search' })
  findAllInvoices(
    @Query() filters: FilterInvoicesDto,
    @CurrentUser() user: any,
  ) {
    return this.feesService.findAllInvoices(filters, user);
  }

  /**
   * Get single invoice details by ID.
   */
  @Get('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get single fee invoice by ID' })
  @ApiParam({ name: 'id', description: 'Fee Invoice UUID' })
  findInvoiceById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.feesService.findInvoiceById(id, user);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. FEE STRUCTURES (HEADS / TEMPLATES)
  // ═════════════════════════════════════════════════════════════════════════

  @Post('structures')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create fee structure template (Admin)' })
  createStructure(
    @Body() dto: CreateFeeStructureDto,
    @CurrentUser() user: any,
  ) {
    return this.feesService.createStructure(dto, user);
  }

  @Get('structures')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all fee structure templates (Admin)' })
  findAllStructures(@CurrentUser() user: any) {
    return this.feesService.findAllStructures(user);
  }

  @Get('structures/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get fee structure template by ID (Admin)' })
  @ApiParam({ name: 'id', description: 'Fee Structure UUID' })
  findStructureById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.feesService.findStructureById(id, user);
  }

  @Patch('structures/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update fee structure template (Admin)' })
  @ApiParam({ name: 'id', description: 'Fee Structure UUID' })
  updateStructure(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: Partial<CreateFeeStructureDto>,
    @CurrentUser() user: any,
  ) {
    return this.feesService.updateStructure(id, dto, user);
  }

  @Delete('structures/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete fee structure template (Admin)' })
  @ApiParam({ name: 'id', description: 'Fee Structure UUID' })
  deleteStructure(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.feesService.deleteStructure(id, user);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. STATS / ANALYTICS SUMMARY
  // ═════════════════════════════════════════════════════════════════════════

  @Get('stats/summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get fees collection and dues summary statistics (Admin)' })
  getStats(@CurrentUser() user: any) {
    return this.feesService.getStats(user);
  }
}
