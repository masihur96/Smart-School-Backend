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
import { AcademicEbooksService } from './academic-ebooks.service';
import { CreateAcademicEbookDto } from './dto/create-academic-ebook.dto';
import { UpdateAcademicEbookDto } from './dto/update-academic-ebook.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Academic eBooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-ebooks')
export class AcademicEbooksController {
  constructor(private readonly academicEbooksService: AcademicEbooksService) {}

  /**
   * Admin uploads a new eBook record (PDF URL already obtained from file-upload API)
   */
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new academic eBook (Admin only)' })
  create(@Body() createDto: CreateAcademicEbookDto, @Request() req) {
    return this.academicEbooksService.create(createDto, req.user.schoolId);
  }

  /**
   * All roles can list eBooks.
   * Students should pass their classId to get class-specific books.
   */
  @Get()
  @ApiOperation({ summary: 'List all eBooks (optionally filtered by classId, subject, search)' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter by class UUID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by book title' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject name' })
  findAll(
    @Request() req,
    @Query('classId') classId?: string,
    @Query('search') search?: string,
    @Query('subject') subject?: string,
  ) {
    return this.academicEbooksService.findAll(
      req.user.schoolId,
      classId,
      search,
      subject,
    );
  }

  /**
   * Get a single eBook by ID — returns pdfUrl for in-app reading
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single eBook by ID (includes pdfUrl for reading)' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.academicEbooksService.findOne(id, req.user.schoolId);
  }

  /**
   * Admin updates eBook metadata (title, cover, pdfUrl, isActive, etc.)
   */
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update eBook metadata (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAcademicEbookDto,
    @Request() req,
  ) {
    return this.academicEbooksService.update(id, updateDto, req.user.schoolId);
  }

  /**
   * Admin deletes an eBook record (does NOT delete from Firebase Storage)
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an eBook record (Admin only)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.academicEbooksService.remove(id, req.user.schoolId);
  }
}
