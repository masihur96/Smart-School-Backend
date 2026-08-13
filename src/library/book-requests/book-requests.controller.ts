import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { BookRequestsService } from './book-requests.service';
import { CreateBookRequestDto } from '../dto/create-book-request.dto';
import { UpdateBookRequestDto } from '../dto/update-book-request.dto';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('library/book-requests')
export class BookRequestsController {
  constructor(private readonly bookRequestsService: BookRequestsService) {}

  @Roles(UserRole.STUDENT)
  @Post()
  create(@Body() createBookRequestDto: CreateBookRequestDto, @Request() req) {
    return this.bookRequestsService.create(createBookRequestDto, req.user.schoolId, req.user.userId);
  }

  @Get()
  findAll(@Request() req) {
    // If student, only return their own requests.
    // If admin/teacher, return all requests for the school.
    const studentId = req.user.role === UserRole.STUDENT ? req.user.userId : undefined;
    return this.bookRequestsService.findAll(req.user.schoolId, studentId);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body() updateBookRequestDto: UpdateBookRequestDto,
    @Request() req
  ) {
    return this.bookRequestsService.updateStatus(id, updateBookRequestDto, req.user.schoolId);
  }
}
