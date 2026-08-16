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
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { AddMoneyDto } from './dto/add-money.dto';
import { AddExpenseDto } from './dto/add-expense.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('School Treasury Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Helper to resolve schoolId from JWT or query for SuperAdmin
   */
  private resolveSchoolId(req: any, querySchoolId?: string): string {
    const user = req.user;
    if (user.role === UserRole.SUPER_ADMIN && querySchoolId) {
      return querySchoolId;
    }
    const schoolId = user.schoolId || querySchoolId;
    if (!schoolId) {
      throw new BadRequestException('schoolId is required for this operation');
    }
    return schoolId;
  }

  /**
   * Helper to resolve admin user details
   */
  private resolveAdminUser(req: any) {
    const user = req.user;
    return {
      id: user.id || user.userId,
      name: user.name || user.email || 'Admin',
      email: user.email,
      role: user.role,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get school treasury wallet balance, overview stats & recent transactions',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async getWalletOverview(
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    return await this.walletService.getWalletOverview(schoolId);
  }

  @Post('deposit')
  @ApiOperation({
    summary: 'Add money / record income into the school treasury wallet',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async addMoney(
    @Request() req,
    @Body() dto: AddMoneyDto,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    const adminUser = this.resolveAdminUser(req);
    return await this.walletService.addMoney(schoolId, adminUser, dto);
  }

  @Post('add-money')
  @ApiOperation({
    summary: 'Alias for /wallet/deposit — Add money into treasury wallet',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async addMoneyAlias(
    @Request() req,
    @Body() dto: AddMoneyDto,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    const adminUser = this.resolveAdminUser(req);
    return await this.walletService.addMoney(schoolId, adminUser, dto);
  }

  @Post('expense')
  @ApiOperation({
    summary: 'Record institutional expense from the school treasury wallet',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async addExpense(
    @Request() req,
    @Body() dto: AddExpenseDto,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    const adminUser = this.resolveAdminUser(req);
    return await this.walletService.addExpense(schoolId, adminUser, dto);
  }

  @Post('add-expense')
  @ApiOperation({
    summary: 'Alias for /wallet/expense — Record expense from treasury wallet',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async addExpenseAlias(
    @Request() req,
    @Body() dto: AddExpenseDto,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    const adminUser = this.resolveAdminUser(req);
    return await this.walletService.addExpense(schoolId, adminUser, dto);
  }

  @Get('transactions')
  @ApiOperation({
    summary:
      'List transaction history with monthly, yearly, date range, type, category filters & pagination',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async getTransactions(
    @Request() req,
    @Query() queryDto: QueryTransactionDto,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    return await this.walletService.getTransactions(schoolId, queryDto);
  }

  @Get('analytics')
  @ApiOperation({
    summary:
      'Get treasury financial analytics: 12-month breakdown (income/expense/net), category distributions, and annual totals',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async getAnalytics(
    @Request() req,
    @Query() queryDto: AnalyticsQueryDto,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    return await this.walletService.getAnalytics(schoolId, queryDto);
  }

  @Get('categories')
  @ApiOperation({
    summary:
      'Get standard list of suggested income/expense categories and payment methods',
  })
  getCategories() {
    return this.walletService.getCategories();
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get single transaction details by ID' })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async getTransactionById(
    @Param('id') id: string,
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    return await this.walletService.getTransactionById(id, schoolId);
  }

  @Patch('transactions/:id')
  @ApiOperation({
    summary: 'Update transaction metadata (title, category, reference, etc.)',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async updateTransaction(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto,
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    return await this.walletService.updateTransaction(id, schoolId, updateDto);
  }

  @Delete('transactions/:id')
  @ApiOperation({
    summary:
      'Delete a transaction and automatically adjust the school wallet balance',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID (SuperAdmin only)',
  })
  async deleteTransaction(
    @Param('id') id: string,
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId = this.resolveSchoolId(req, querySchoolId);
    return await this.walletService.deleteTransaction(id, schoolId);
  }
}
