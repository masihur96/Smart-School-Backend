import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/create-section.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Controller('admin/sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new section' })
  @ApiResponse({
    status: 201,
    description: 'The section has been successfully created.',
  })
  async create(@Body() createSectionDto: CreateSectionDto) {
    return await this.sectionsService.create(createSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sections' })
  @ApiQuery({ name: 'schoolId', required: false })
  async findAll(
    @Query('schoolId') querySchoolId?: string,
    @CurrentUser() user?: any,
  ) {
    const schoolId = user?.role === UserRole.SUPER_ADMIN ? querySchoolId : user?.schoolId;
    return await this.sectionsService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get section by ID' })
  async findOne(@Param('id') id: string) {
    return await this.sectionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update section' })
  async update(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return await this.sectionsService.update(id, updateSectionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete section' })
  async remove(@Param('id') id: string) {
    return await this.sectionsService.remove(id);
  }

  @Get('trash')
  @ApiOperation({ summary: 'Get all soft-deleted sections' })
  @ApiQuery({ name: 'schoolId', required: false })
  async findDeleted(
    @Query('schoolId') querySchoolId?: string,
    @CurrentUser() user?: any,
  ) {
    const schoolId = user?.role === UserRole.SUPER_ADMIN ? querySchoolId : user?.schoolId;
    return await this.sectionsService.findAllDeleted(schoolId);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted section' })
  async restore(@Param('id') id: string) {
    return await this.sectionsService.restore(id);
  }
}
