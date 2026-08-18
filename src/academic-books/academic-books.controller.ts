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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AcademicBooksService } from './academic-books.service';
import { CreateAcademicBookDto } from './dto/create-academic-book.dto';
import { UpdateAcademicBookDto } from './dto/update-academic-book.dto';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Academic Books')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-books')
export class AcademicBooksController {
  constructor(private readonly academicBooksService: AcademicBooksService) {}

  /**
   * Admin / SuperAdmin / Teacher creates a new academic book
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  @Post()
  @ApiOperation({ summary: 'Create a new academic book (Admin/Teacher)' })
  create(
    @Body() createDto: CreateAcademicBookDto,
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId =
      req.user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : req.user.schoolId;
    return this.academicBooksService.create(createDto, schoolId);
  }

  /**
   * Upload PDF Book or Cover Image file to storage
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  @Post('upload')
  @ApiOperation({ summary: 'Upload a PDF book or cover image to storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.academicBooksService.uploadFile(file);
  }

  /**
   * List all books grouped by class
   */
  @Get('by-class')
  @ApiOperation({ summary: 'Get academic books grouped class-wise' })
  @ApiQuery({ name: 'schoolId', required: false, description: 'School UUID for SuperAdmin' })
  getBooksByClass(
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId =
      req.user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : req.user.schoolId;
    return this.academicBooksService.getBooksByClass(schoolId);
  }

  /**
   * Get user's recently read books to resume reading
   */
  @Get('continue-reading')
  @ApiOperation({ summary: 'Get user recently read books with reading progress' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  getContinueReading(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    return this.academicBooksService.getContinueReading(
      req.user.id,
      req.user.schoolId,
      limit ? Number(limit) : 10,
    );
  }

  /**
   * List all academic books (filter by classId, subjectId, subject, search)
   */
  @Get()
  @ApiOperation({ summary: 'List academic books with optional filters' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter by class UUID' })
  @ApiQuery({ name: 'subjectId', required: false, description: 'Filter by subject UUID' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject name' })
  @ApiQuery({ name: 'search', required: false, description: 'Search title, author, description' })
  @ApiQuery({ name: 'schoolId', required: false, description: 'School UUID for SuperAdmin' })
  findAll(
    @Request() req,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('subject') subject?: string,
    @Query('search') search?: string,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId =
      req.user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : req.user.schoolId;
    return this.academicBooksService.findAll(schoolId, {
      classId,
      subjectId,
      subject,
      search,
      user: req.user,
    });
  }

  /**
   * Get a single academic book by ID (includes PDF URL and user's reading progress)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get book details with reading progress by ID' })
  @ApiQuery({ name: 'schoolId', required: false, description: 'School UUID for SuperAdmin' })
  findOne(
    @Param('id') id: string,
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId =
      req.user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : req.user.schoolId;
    return this.academicBooksService.findOne(id, schoolId, req.user?.id);
  }

  /**
   * Admin / SuperAdmin updates an academic book
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update academic book metadata' })
  @ApiQuery({ name: 'schoolId', required: false, description: 'School UUID for SuperAdmin' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAcademicBookDto,
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId =
      req.user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : req.user.schoolId;
    return this.academicBooksService.update(id, updateDto, schoolId);
  }

  /**
   * Admin / SuperAdmin deletes an academic book
   */
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an academic book (Admin only)' })
  @ApiQuery({ name: 'schoolId', required: false, description: 'School UUID for SuperAdmin' })
  remove(
    @Param('id') id: string,
    @Request() req,
    @Query('schoolId') querySchoolId?: string,
  ) {
    const schoolId =
      req.user.role === UserRole.SUPER_ADMIN && querySchoolId
        ? querySchoolId
        : req.user.schoolId;
    return this.academicBooksService.remove(id, schoolId);
  }

  /**
   * Save user's reading progress for e-book reader
   */
  @Post(':id/progress')
  @ApiOperation({ summary: 'Save reading progress for a book (page number, status)' })
  saveProgress(
    @Param('id') id: string,
    @Body() progressDto: UpdateReadingProgressDto,
    @Request() req,
  ) {
    return this.academicBooksService.saveProgress(
      id,
      req.user.id,
      req.user.schoolId,
      progressDto,
    );
  }

  /**
   * Get current user's reading progress on a book
   */
  @Get(':id/progress')
  @ApiOperation({ summary: 'Get current user reading progress for a book' })
  getProgress(@Param('id') id: string, @Request() req) {
    return this.academicBooksService.getReadingProgress(id, req.user.id);
  }
}
