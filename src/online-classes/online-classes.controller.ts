import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OnlineClassesService } from './online-classes.service';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';
import { UpdateOnlineClassDto } from './dto/update-online-class.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('online-classes')
@ApiBearerAuth()
@Controller('online-classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnlineClassesController {
  constructor(private readonly onlineClassesService: OnlineClassesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  create(@Body() createOnlineClassDto: CreateOnlineClassDto, @CurrentUser() user: any) {
    return this.onlineClassesService.create(createOnlineClassDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.onlineClassesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.onlineClassesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateOnlineClassDto: UpdateOnlineClassDto, @CurrentUser() user: any) {
    return this.onlineClassesService.update(id, updateOnlineClassDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.onlineClassesService.remove(id, user);
  }
}
