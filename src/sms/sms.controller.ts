import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendTargetedSmsDto } from './dto/send-targeted-sms.dto';
import { FilterSmsLogsDto } from './dto/filter-sms-logs.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Bulk SMS')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send Direct Bulk SMS',
    description:
      'Dispatches an SMS message to an array or comma-separated list of Bangladeshi phone numbers via White Info BD gateway (proxied via Cloudflare worker).',
  })
  @ApiResponse({ status: 201, description: 'SMS campaign dispatched/queued' })
  async sendSms(
    @Body() sendSmsDto: SendSmsDto,
    @CurrentUser() user: any,
  ) {
    return await this.smsService.sendBulkSms(sendSmsDto, user);
  }

  @Post('send-targeted')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send Targeted Bulk SMS to School Groups',
    description:
      'Target SMS recipients by audience group: ALL_STUDENTS (guardians/students), CLASS, SECTION, ALL_TEACHERS, ALL_PARENTS, or ALL_USERS.',
  })
  @ApiResponse({ status: 201, description: 'Targeted SMS campaign dispatched' })
  async sendTargetedSms(
    @Body() dto: SendTargetedSmsDto,
    @CurrentUser() user: any,
  ) {
    return await this.smsService.sendTargetedBulkSms(dto, user);
  }

  @Get('balance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Check Gateway SMS Account Balance',
    description:
      'Returns current SMS credit balance and currency from White Info BD gateway.',
  })
  @ApiResponse({ status: 200, description: 'Account balance retrieved' })
  async checkBalance() {
    return await this.smsService.checkBalance();
  }

  @Get('senders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get Approved Sender IDs',
    description:
      'Returns all registered/approved CLI / sender IDs and mask types from White Info BD.',
  })
  @ApiResponse({ status: 200, description: 'Approved sender list' })
  async getSenders() {
    return await this.smsService.getSenders();
  }

  @Get('batches/:batchId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get Delivery Report by Batch ID',
    description:
      'Fetches delivery status and recipient statistics for a given batch from White Info BD and syncs it with the SMS log.',
  })
  @ApiParam({ name: 'batchId', example: '285' })
  @ApiResponse({ status: 200, description: 'Delivery report returned' })
  async getBatchReport(@Param('batchId') batchId: string) {
    return await this.smsService.getBatchReport(batchId);
  }

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get Paginated SMS Campaign Logs',
    description:
      'Query history of sent SMS campaigns with status, recipient count, and delivery statistics.',
  })
  @ApiResponse({ status: 200, description: 'List of SMS campaign logs' })
  async getLogs(
    @Query() filterDto: FilterSmsLogsDto,
    @CurrentUser() user: any,
  ) {
    return await this.smsService.getLogs(filterDto, user);
  }

  @Get('logs/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get SMS Campaign Details by ID',
    description: 'Retrieve full details of an SMS campaign record.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'SMS log details' })
  async getLogById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return await this.smsService.getLogById(id, user);
  }
}
