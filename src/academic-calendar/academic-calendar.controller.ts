import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AcademicCalendarService } from './academic-calendar.service';
import { CreateAcademicCalendarEventDto } from './dto/create-academic-calendar-event.dto';
import { UpdateAcademicCalendarEventDto } from './dto/update-academic-calendar-event.dto';
import { BulkCreateAcademicCalendarDto } from './dto/bulk-create-academic-calendar.dto';
import { FilterAcademicCalendarDto } from './dto/filter-academic-calendar.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Academic Calendar')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-calendar')
export class AcademicCalendarController {
  constructor(
    private readonly calendarService: AcademicCalendarService,
  ) {}

  // ═════════════════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Admin / SuperAdmin creates a new calendar event
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new academic calendar event (Admin)' })
  @ApiResponse({ status: 201, description: 'Calendar event created successfully.' })
  create(
    @Body() dto: CreateAcademicCalendarEventDto,
    @CurrentUser() user: any,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId =
      user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : user.schoolId;
    return this.calendarService.create(dto, schoolId, user.id || user.userId);
  }

  /**
   * Admin / SuperAdmin bulk creates calendar events (e.g. annual calendar import)
   */
  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Bulk create academic calendar events (Admin annual setup)',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk calendar events created successfully.',
  })
  bulkCreate(
    @Body() dto: BulkCreateAcademicCalendarDto,
    @CurrentUser() user: any,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId =
      user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : user.schoolId;
    return this.calendarService.bulkCreate(dto, schoolId, user.id || user.userId);
  }

  /**
   * Admin calendar summary and statistics
   */
  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Get calendar summary & statistics (total events, holidays, exams count) (Admin)',
  })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'academicYear', required: false })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getSummary(
    @CurrentUser() user: any,
    @Query('schoolId') querySchoolId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('year') year?: number,
  ) {
    const schoolId =
      user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : user.schoolId;
    return this.calendarService.getSummary(schoolId, academicYear, year ? Number(year) : undefined);
  }

  /**
   * Explicit Admin endpoint to list all calendar events
   */
  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all calendar events with full filters (Admin)' })
  findAllForAdmin(
    @Query() filters: FilterAcademicCalendarDto,
    @CurrentUser() user: any,
  ) {
    return this.calendarService.findAll(filters, user);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // TEACHER ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Get academic calendar for teacher
   */
  @Get('teacher')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Get academic calendar events for teacher (school-wide + teacher-specific)',
  })
  findAllForTeacher(
    @Query() filters: FilterAcademicCalendarDto,
    @CurrentUser() user: any,
  ) {
    return this.calendarService.findAll(filters, user);
  }

  /**
   * Get upcoming events for teacher
   */
  @Get('teacher/upcoming')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get upcoming calendar events for teacher' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTeacherUpcoming(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.calendarService.getUpcomingEvents(
      user,
      limit ? Number(limit) : 10,
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STUDENT ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Get academic calendar for student (filtered by student enrolled classes & school-wide)
   */
  @Get('student')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      "Get student's academic calendar (school-wide + enrolled class events)",
  })
  findAllForStudent(
    @Query() filters: FilterAcademicCalendarDto,
    @CurrentUser() user: any,
  ) {
    return this.calendarService.findAll(filters, user);
  }

  /**
   * Get upcoming events for student
   */
  @Get('student/upcoming')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get upcoming calendar events for student' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStudentUpcoming(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.calendarService.getUpcomingEvents(
      user,
      limit ? Number(limit) : 10,
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // COMMON / UNIVERSAL ENDPOINTS (Admin, Teacher, Student)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Get calendar events (automatically contextualized based on current user's role)
   */
  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary:
      'Get calendar events contextualized by authenticated user role & filters',
  })
  findAll(
    @Query() filters: FilterAcademicCalendarDto,
    @CurrentUser() user: any,
  ) {
    return this.calendarService.findAll(filters, user);
  }

  /**
   * Get upcoming calendar events from today onwards
   */
  @Get('upcoming')
  @Roles(
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get upcoming calendar events for the logged-in user',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUpcoming(@CurrentUser() user: any, @Query('limit') limit?: number) {
    return this.calendarService.getUpcomingEvents(
      user,
      limit ? Number(limit) : 10,
    );
  }

  /**
   * Get list of holidays for the school
   */
  @Get('holidays')
  @Roles(
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get list of school holidays' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'academicYear', required: false })
  getHolidays(
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.calendarService.getHolidays(
      user,
      year ? Number(year) : undefined,
      academicYear,
    );
  }

  /**
   * Get event details by ID
   */
  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get calendar event by ID' })
  @ApiParam({ name: 'id', description: 'Calendar event UUID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.calendarService.findOne(id, user);
  }

  /**
   * Update an academic calendar event (Admin/SuperAdmin)
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an academic calendar event (Admin)' })
  @ApiParam({ name: 'id', description: 'Calendar event UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAcademicCalendarEventDto,
    @CurrentUser() user: any,
  ) {
    return this.calendarService.update(id, dto, user);
  }

  /**
   * PUT update support for backward compatibility
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Replace/Update an academic calendar event (Admin)' })
  @ApiParam({ name: 'id', description: 'Calendar event UUID' })
  updatePut(
    @Param('id') id: string,
    @Body() dto: UpdateAcademicCalendarEventDto,
    @CurrentUser() user: any,
  ) {
    return this.calendarService.update(id, dto, user);
  }

  /**
   * Delete a calendar event (Admin/SuperAdmin)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an academic calendar event (Admin)' })
  @ApiParam({ name: 'id', description: 'Calendar event UUID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.calendarService.remove(id, user);
  }
}
