import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get superadmin dashboard statistics' })
  async getDashboardStats() {
    return await this.superadminService.getDashboardStats();
  }

  // ─── Schools ──────────────────────────────────────────────────
  @Post('schools')
  @ApiOperation({ summary: 'Create a new school' })
  async createSchool(@Body() dto: CreateSchoolDto) {
    return await this.superadminService.createSchool(dto);
  }

  @Get('schools')
  @ApiOperation({ summary: 'Get all schools' })
  async getAllSchools() {
    return await this.superadminService.getAllSchools();
  }

  @Put('schools/:id')
  @ApiOperation({ summary: 'Update school details' })
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return await this.superadminService.updateSchool(id, dto);
  }

  @Delete('schools/:id')
  @ApiOperation({ summary: 'Soft-delete a school (moves to trash)' })
  async deleteSchool(@Param('id') id: string) {
    return await this.superadminService.deleteSchool(id);
  }

  // ─── Users ────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.superadminService.getAllUsers(page, limit);
  }

  // ─── Subscriptions ────────────────────────────────────────────
  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions across all schools' })
  async getAllSubscriptions() {
    return await this.superadminService.getAllSubscriptions();
  }

  @Put('subscriptions/:id/status')
  @ApiOperation({ summary: 'Update subscription active status' })
  async updateSubscriptionStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return await this.superadminService.updateSubscriptionStatus(id, isActive);
  }

  // ─── Trash (Soft-Deleted Records) ─────────────────────────────
  @Get('trash')
  @ApiOperation({
    summary: 'Get all soft-deleted records across all entities',
    description:
      'Returns deleted users, schools, classes, subjects, sections, pricing plans, subscriptions, homework, and attendance with a summary count.',
  })
  async getTrash() {
    return await this.superadminService.getTrash();
  }

  // ─── Restore: Generic Endpoint ────────────────────────────────
  @Patch('trash/:entity/:id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted record by entity type and ID',
    description:
      'Entity types: user | school | class | subject | section | pricing | subscription | homework | attendance',
  })
  @ApiParam({
    name: 'entity',
    enum: [
      'user',
      'school',
      'class',
      'subject',
      'section',
      'pricing',
      'subscription',
      'homework',
      'attendance',
    ],
    description: 'The type of entity to restore',
  })
  @ApiParam({ name: 'id', description: 'The UUID of the record to restore' })
  async restoreEntity(
    @Param('entity') entity: string,
    @Param('id') id: string,
  ) {
    return await this.superadminService.restoreEntity(entity, id);
  }

  // ─── Restore: Dedicated Entity Endpoints ──────────────────────
  @Patch('trash/users/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  async restoreUser(@Param('id') id: string) {
    return await this.superadminService.restoreUser(id);
  }

  @Patch('trash/schools/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted school' })
  async restoreSchool(@Param('id') id: string) {
    return await this.superadminService.restoreSchool(id);
  }

  @Patch('trash/classes/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted class' })
  async restoreClass(@Param('id') id: string) {
    return await this.superadminService.restoreClass(id);
  }

  @Patch('trash/subjects/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted subject' })
  async restoreSubject(@Param('id') id: string) {
    return await this.superadminService.restoreSubject(id);
  }

  @Patch('trash/sections/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted section' })
  async restoreSection(@Param('id') id: string) {
    return await this.superadminService.restoreSection(id);
  }

  @Patch('trash/pricing/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted pricing plan' })
  async restorePricingPlan(@Param('id') id: string) {
    return await this.superadminService.restorePricingPlan(id);
  }

  @Patch('trash/subscriptions/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted subscription' })
  async restoreSubscription(@Param('id') id: string) {
    return await this.superadminService.restoreSubscription(id);
  }

  @Patch('trash/homework/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted homework' })
  async restoreHomework(@Param('id') id: string) {
    return await this.superadminService.restoreHomework(id);
  }

  @Patch('trash/attendance/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted attendance record' })
  async restoreAttendance(@Param('id') id: string) {
    return await this.superadminService.restoreAttendance(id);
  }
}
