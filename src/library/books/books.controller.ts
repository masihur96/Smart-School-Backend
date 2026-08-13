import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Library Books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('library/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() createBookDto: CreateBookDto, @Request() req) {
    return this.booksService.create(createBookDto, req.user.schoolId);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.booksService.findAll(req.user.schoolId, search, category);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.booksService.findOne(id, req.user.schoolId);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto, @Request() req) {
    return this.booksService.update(id, updateBookDto, req.user.schoolId);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.booksService.remove(id, req.user.schoolId);
  }
}
