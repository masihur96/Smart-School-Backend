import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GeneralService } from './general.service';
import { UsersService } from '../users/users.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
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

  // Notices
  @Get('notices')
  async getNotices(
    @Query('schoolId') querySchoolId?: string,
    @CurrentUser() user?: any,
  ) {
    const schoolId = user?.role === UserRole.SUPER_ADMIN ? querySchoolId : user?.schoolId;
    return await this.generalService.getAllNotices(schoolId);
  }

  @Get('notices/:id')
  async getNoticeById(@Param('id') id: string) {
    return await this.generalService.getNoticeById(id);
  }

  @Post('notices')
  async createNotice(@Body() data: CreateNoticeDto) {
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
  @Get('routine/:classId')
  async getRoutineByClass(
    @Param('classId') classId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return await this.generalService.getRoutineByClass(classId, sectionId);
  }

  @Get('routine')
  async getAllRoutines(
    @Query('schoolId') querySchoolId?: string,
    @CurrentUser() user?: any,
  ) {
    const schoolId = user?.role === UserRole.SUPER_ADMIN ? querySchoolId : user?.schoolId;
    return await this.generalService.getAllRoutines(schoolId);
  }

  @Post('routine')
  async createRoutine(@Body() data: CreateRoutineDto) {
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

  @Get('school-data')
  async getSchoolData(
    @Query('schoolId') querySchoolId?: string,
    @CurrentUser() user?: any,
  ) {
    const schoolId = user?.role === UserRole.SUPER_ADMIN ? querySchoolId : user?.schoolId;
    return await this.generalService.getSchoolData(schoolId);
  }

  // File upload endpoint
  @Post('upload')
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return await this.generalService.uploadFile(file);
  }
}

