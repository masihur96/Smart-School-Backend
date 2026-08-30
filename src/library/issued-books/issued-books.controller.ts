import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IssuedBooksService } from './issued-books.service';
import { IssueBookDto } from '../dto/issue-book.dto';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Library Issued Books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('library/issued-books')
export class IssuedBooksController {
  constructor(private readonly issuedBooksService: IssuedBooksService) {}

  /**
   * Issue a book to a student
   * POST /library/issued-books
   * Body: { bookId, studentId, dueDate }
   */
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  issueBook(@Body() issueBookDto: IssueBookDto, @Request() req) {
    return this.issuedBooksService.issueBook(issueBookDto, req.user.schoolId);
  }

  /**
   * Get all issued books for this school (optionally filter by status)
   * GET /library/issued-books?status=active|returned|overdue
   */
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'returned', 'overdue'] })
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get()
  findAll(
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.issuedBooksService.findAll(req.user.schoolId, status);
  }

  /**
   * Get all issued books for a specific student
   * GET /library/issued-books/student/:studentId
   */
  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string, @Request() req) {
    return this.issuedBooksService.findByStudent(studentId, req.user.schoolId);
  }

  /**
   * Mark a book as returned
   * PATCH /library/issued-books/:id/return
   */
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id/return')
  returnBook(@Param('id') id: string, @Request() req) {
    return this.issuedBooksService.returnBook(id, req.user.schoolId);
  }
}
