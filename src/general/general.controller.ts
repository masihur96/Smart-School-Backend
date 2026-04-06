import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GeneralService } from './general.service';
import { Public } from '../auth/decorators/public.decorator';
import {
  CreateNoticeDto,
  UpdateNoticeDto,
  CreateRoutineDto,
  UpdateRoutineDto,
} from './dto/create-notice.dto';

@ApiTags('General')
@ApiBearerAuth('bearer')
@Controller('general')
export class GeneralController {
  constructor(private generalService: GeneralService) {}

  // Notices - public endpoint for getting notices
  @Public()
  @Get('notices')
  async getNotices() {
    return await this.generalService.getAllNotices();
  }

  @Public()
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
  async getAllRoutines() {
    return await this.generalService.getAllRoutines();
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
}
