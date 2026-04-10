import { Controller, Get, Post, Patch, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreatePricingPlanDto, UpdatePricingPlanDto } from './dto/pricing-plan.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) { }

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all available pricing plans' })
  @ApiResponse({ status: 200, description: 'Return all plans.' })
  getPlans() {
    return this.pricingService.getPlans();
  }

  @Public()
  @Get('details')
  @ApiOperation({ summary: 'Get global pricing details (setup fee, trial info)' })
  getDetails() {
    return this.pricingService.getDetails();
  }

  @Public()
  @Get('calculate')
  @ApiOperation({ summary: 'Calculate best plan and estimate cost based on student count' })
  @ApiQuery({ name: 'students', type: Number, required: true, example: 250 })
  calculatePrice(@Query('students') students?: string) {
    if (!students) {
      throw new BadRequestException('Please provide a valid student count. Example: ?students=250');
    }

    const count = parseInt(students, 10);
    if (isNaN(count) || count < 0) {
      throw new BadRequestException('Student count must be a positive number.');
    }

    return this.pricingService.calculatePrice(count);
  }

  @ApiBearerAuth('bearer')
  @Post()
  @ApiOperation({ summary: 'Create a new pricing plan (Admin only)' })
  createPlan(@Body() createPricingPlanDto: CreatePricingPlanDto) {
    return this.pricingService.create(createPricingPlanDto);
  }

  @ApiBearerAuth('bearer')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing pricing plan (Admin only)' })
  updatePlan(@Param('id') id: string, @Body() updatePricingPlanDto: UpdatePricingPlanDto) {
    return this.pricingService.update(id, updatePricingPlanDto);
  }

  @ApiBearerAuth('bearer')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pricing plan (Admin only)' })
  deletePlan(@Param('id') id: string) {
    return this.pricingService.delete(id);
  }
}
