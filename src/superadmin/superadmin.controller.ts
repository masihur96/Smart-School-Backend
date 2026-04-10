import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SuperadminService } from './superadmin.service';
import { CreateSchoolDto, UpdateSchoolDto } from '../schools/dto/create-school.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@ApiTags('Superadmin')
@ApiBearerAuth('bearer')
@Roles(UserRole.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return await this.superadminService.getDashboardStats();
  }

  // ─── Schools ──────────────────────────────────────────────────
  @Post('schools')
  async createSchool(@Body() dto: CreateSchoolDto) {
    return await this.superadminService.createSchool(dto);
  }

  @Get('schools')
  async getAllSchools() {
    return await this.superadminService.getAllSchools();
  }

  @Put('schools/:id')
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return await this.superadminService.updateSchool(id, dto);
  }

  // ─── Users ────────────────────────────────────────────────────
  @Get('users')
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.superadminService.getAllUsers(page, limit);
  }

  // ─── Subscriptions ────────────────────────────────────────────
  @Get('subscriptions')
  async getAllSubscriptions() {
    return await this.superadminService.getAllSubscriptions();
  }

  @Put('subscriptions/:id/status')
  async updateSubscriptionStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return await this.superadminService.updateSubscriptionStatus(id, isActive);
  }
}
