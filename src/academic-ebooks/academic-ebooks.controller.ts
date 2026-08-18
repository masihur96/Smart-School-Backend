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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { AcademicBooksService } from '../academic-books/academic-books.service';
import { CreateAcademicBookDto } from '../academic-books/dto/create-academic-book.dto';
import { UpdateAcademicBookDto } from '../academic-books/dto/update-academic-book.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Academic eBooks')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-ebooks')
export class AcademicEbooksController {
  constructor(private readonly academicBooksService: AcademicBooksService) {}

  /**
   * Create a new eBook record
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  @Post()
  @ApiOperation({ summary: 'Create a new academic eBook' })
  create(@Body() createDto: CreateAcademicBookDto, @Request() req) {
    return this.academicBooksService.create(createDto, req.user.schoolId);
  }

  /**
   * List eBooks (filtered by classId, subject, search)
   */
  @Get()
  @ApiOperation({ summary: 'List all eBooks' })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'subject', required: false })
  findAll(
    @Request() req,
    @Query('classId') classId?: string,
    @Query('search') search?: string,
    @Query('subject') subject?: string,
  ) {
    return this.academicBooksService.findAll(req.user.schoolId, {
      classId,
      search,
      subject,
      user: req.user,
    });
  }

  /**
   * Get a single eBook by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single eBook by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.academicBooksService.findOne(id, req.user.schoolId, req.user?.id);
  }

  /**
   * Update eBook metadata
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update eBook metadata' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAcademicBookDto,
    @Request() req,
  ) {
    return this.academicBooksService.update(id, updateDto, req.user.schoolId);
  }

  /**
   * Delete an eBook record
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an eBook record' })
  remove(@Param('id') id: string, @Request() req) {
    return this.academicBooksService.remove(id, req.user.schoolId);
  }
}
