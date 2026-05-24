import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GeneralService } from './general.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import {
  CreateNoticeDto,
  UpdateNoticeDto,
  CreateRoutineDto,
  UpdateRoutineDto,
} from './dto/create-notice.dto';
import { SetMarqueeDto } from './dto/marquee.dto';
import { MarqueeType } from './entities/marquee.entity';

@ApiTags('General')
@ApiBearerAuth('bearer')
@Controller('general')
export class GeneralController {
  constructor(
    private generalService: GeneralService,
    private usersService: UsersService,
  ) {}

  // Notices - public endpoint for getting notices
  @Public()
  @Get('notices')
  async getNotices(@Request() req: any, @Query('schoolId') querySchoolId?: string) {
    const schoolId =
      req?.user?.role === UserRole.SUPER_ADMIN
        ? querySchoolId
        : req?.user?.schoolId || querySchoolId;
    return await this.generalService.getAllNotices(schoolId);
  }

  @Public()
  @Get('notices/:id')
  async getNoticeById(@Param('id') id: string) {
    return await this.generalService.getNoticeById(id);
  }

  @Post('notices')
  async createNotice(@Request() req: any, @Body() data: CreateNoticeDto) {
    if (req?.user && req.user.role !== UserRole.SUPER_ADMIN) {
      data.schoolId = req.user.schoolId;
    }
    return await this.generalService.createNotice(data);
  }

  @Put('notices/:id')
  async updateNotice(@Param('id') id: string, @Body() data: UpdateNoticeDto) {
    return await this.generalService.updateNotice(id, data);
  }

  @Delete('notices/:id')
  async deleteNotice(@Param('id') id: string) {
    return await this.generalService.deleteNotice(id);
  }

  // Routine endpoints
  @Public()
  @Get('routine/:classId')
  async getRoutineByClass(
    @Param('classId') classId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return await this.generalService.getRoutineByClass(classId, sectionId);
  }

  @Public()
  @Get('routine')
  async getAllRoutines(@Request() req: any, @Query('schoolId') querySchoolId?: string) {
    const schoolId =
      req?.user?.role === UserRole.SUPER_ADMIN
        ? querySchoolId
        : req?.user?.schoolId || querySchoolId;
    return await this.generalService.getAllRoutines(schoolId);
  }

  @Post('routine')
  async createRoutine(@Request() req: any, @Body() data: CreateRoutineDto) {
    if (req?.user && req.user.role !== UserRole.SUPER_ADMIN) {
      data.schoolId = req.user.schoolId;
    }
    return await this.generalService.createRoutine(data);
  }

  @Put('routine/:id')
  async updateRoutine(@Param('id') id: string, @Body() data: UpdateRoutineDto) {
    return await this.generalService.updateRoutine(id, data);
  }

  @Delete('routine/:id')
  async deleteRoutine(@Param('id') id: string) {
    return await this.generalService.deleteRoutine(id);
  }

  // Students endpoint
  @Public()
  @Get('students/:classId')
  async getStudentsByClass(
    @Param('classId') classId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return await this.usersService.findStudentsByClass(classId, sectionId);
  }

  // Marquee endpoints
  @Post('marquee')
  async setMarquee(@Body() data: SetMarqueeDto) {
    return await this.generalService.setMarquee(data);
  }

  @Public()
  @Get('marquee/:schoolId')
  async getAllMarquees(@Param('schoolId') schoolId: string) {
    return await this.generalService.getAllMarquees(schoolId);
  }

  @Public()
  @Get('marquee/:schoolId/:type')
  async getMarquee(
    @Param('schoolId') schoolId: string,
    @Param('type') type: MarqueeType,
  ) {
    return await this.generalService.getMarquee(schoolId, type);
  }

  @Public()
  @Get('school-data')
  async getSchoolData(@Request() req: any, @Query('schoolId') querySchoolId?: string) {
    const schoolId =
      req?.user?.role === UserRole.SUPER_ADMIN
        ? querySchoolId
        : req?.user?.schoolId || querySchoolId;
    return await this.generalService.getSchoolData(schoolId);
  }
}
