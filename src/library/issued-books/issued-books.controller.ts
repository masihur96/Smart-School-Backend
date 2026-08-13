import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IssuedBooksService } from './issued-books.service';
import { IssueBookDto } from '../dto/issue-book.dto';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Library Books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('library/issued-books')
export class IssuedBooksController {
  constructor(private readonly issuedBooksService: IssuedBooksService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  issueBook(@Body() issueBookDto: IssueBookDto, @Request() req) {
    return this.issuedBooksService.issueBook(issueBookDto, req.user.schoolId);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.issuedBooksService.findAll(req.user.schoolId, status);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id/return')
  returnBook(@Param('id') id: string, @Request() req) {
    return this.issuedBooksService.returnBook(id, req.user.schoolId);
  }
}
