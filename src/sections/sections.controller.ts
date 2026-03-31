import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/create-section.dto';

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
  async findAll() {
    return await this.sectionsService.findAll();
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
  @ApiOperation({ summary: 'Delete section' })
  async remove(@Param('id') id: string) {
    return await this.sectionsService.remove(id);
  }
}
