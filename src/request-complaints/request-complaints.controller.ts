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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { RequestComplaintsService } from './request-complaints.service';
import { CreateRequestComplaintDto } from './dto/create-request-complaint.dto';
import { UpdateRequestComplaintStatusDto } from './dto/update-request-complaint-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { FilterRequestComplaintDto } from './dto/filter-request-complaint.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Request & Complaint System')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('request-complaints')
export class RequestComplaintsController {
  constructor(
    private readonly requestComplaintsService: RequestComplaintsService,
  ) {}

  /**
   * Submit a new request or complaint.
   * Permission rules:
   * - Student: can only submit to her class teachers and admin.
   * - Teacher: can only submit to admin.
   * - Admin: can submit to teachers and students.
   */
  @Post()
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Submit a new request or complaint',
    description:
      'Student can send to their class teachers or admin. Teacher can send to admin only. Admin can send to teachers or students.',
  })
  @ApiResponse({ status: 201, description: 'Request or complaint submitted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input or mismatching school.' })
  @ApiResponse({ status: 403, description: 'Forbidden routing based on role rules.' })
  create(
    @Body() dto: CreateRequestComplaintDto,
    @CurrentUser() user: any,
  ) {
    return this.requestComplaintsService.create(dto, user);
  }

  /**
   * Get list of permitted recipients tailored to the authenticated user's role.
   */
  @Get('recipients')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get available recipients tailored to user role',
    description:
      'Returns admins and class teachers for students, admins for teachers, and teachers and students for admins.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'classId', required: false, type: String })
  getRecipients(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('classId') classId?: string,
  ) {
    return this.requestComplaintsService.getAvailableRecipients(user, {
      search,
      classId,
    });
  }

  /**
   * Get stats summary for requests and complaints.
   */
  @Get('stats/summary')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get summary statistics of requests and complaints' })
  getStats(@CurrentUser() user: any) {
    return this.requestComplaintsService.getStats(user);
  }

  /**
   * List requests and complaints with filters and pagination.
   */
  @Get()
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List requests and complaints with filters & pagination' })
  findAll(
    @Query() filters: FilterRequestComplaintDto,
    @CurrentUser() user: any,
  ) {
    return this.requestComplaintsService.findAll(filters, user);
  }

  /**
   * Get details of a single request or complaint by ID with comment thread.
   */
  @Get(':id')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get request or complaint details with discussion thread' })
  @ApiParam({ name: 'id', description: 'Request/Complaint UUID' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.requestComplaintsService.findOne(id, user);
  }

  /**
   * Update status of request or complaint (e.g., In Progress, Resolved, Rejected, Cancelled).
   */
  @Patch(':id/status')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Update status of request or complaint' })
  @ApiParam({ name: 'id', description: 'Request/Complaint UUID' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRequestComplaintStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.requestComplaintsService.updateStatus(id, dto, user);
  }

  /**
   * Add a comment / message to the request/complaint discussion thread.
   */
  @Post(':id/comments')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Add a message or comment to the discussion thread' })
  @ApiParam({ name: 'id', description: 'Request/Complaint UUID' })
  addComment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.requestComplaintsService.addComment(id, dto, user);
  }

  /**
   * Delete a request or complaint (Soft delete).
   */
  @Delete(':id')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Delete a request or complaint' })
  @ApiParam({ name: 'id', description: 'Request/Complaint UUID' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.requestComplaintsService.remove(id, user);
  }
}
