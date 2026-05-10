import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import {
  CreatePricingPlanDto,
  UpdatePricingPlanDto,
} from './dto/pricing-plan.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all available pricing plans' })
  @ApiResponse({ status: 200, description: 'Return all plans.' })
  getPlans() {
    return this.pricingService.getPlans();
  }

  @Public()
  @Get('details')
  @ApiOperation({
    summary: 'Get global pricing details (setup fee, trial info)',
  })
  getDetails() {
    return this.pricingService.getDetails();
  }

  @Public()
  @Get('calculate')
  @ApiOperation({
    summary: 'Calculate best plan and estimate cost based on student count',
  })
  @ApiQuery({ name: 'students', type: Number, required: true, example: 250 })
  calculatePrice(@Query('students') students?: string) {
    if (!students) {
      throw new BadRequestException(
        'Please provide a valid student count. Example: ?students=250',
      );
    }

    const count = parseInt(students, 10);
    if (isNaN(count) || count < 0) {
      throw new BadRequestException('Student count must be a positive number.');
    }

    return this.pricingService.calculatePrice(count);
  }

  @ApiBearerAuth('bearer')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new pricing plan (Superadmin only)' })
  createPlan(@Body() createPricingPlanDto: CreatePricingPlanDto) {
    return this.pricingService.create(createPricingPlanDto);
  }

  @ApiBearerAuth('bearer')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing pricing plan (Superadmin only)',
  })
  updatePlan(
    @Param('id') id: string,
    @Body() updatePricingPlanDto: UpdatePricingPlanDto,
  ) {
    return this.pricingService.update(id, updatePricingPlanDto);
  }

  @ApiBearerAuth('bearer')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a pricing plan (Superadmin only)' })
  deletePlan(@Param('id') id: string) {
    return this.pricingService.delete(id);
  }

  @ApiBearerAuth('bearer')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('trash')
  @ApiOperation({
    summary: 'Get all soft-deleted pricing plans (Superadmin only)',
  })
  getTrashedPlans() {
    return this.pricingService.findAllDeleted();
  }

  @ApiBearerAuth('bearer')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted pricing plan (Superadmin only)',
  })
  restorePlan(@Param('id') id: string) {
    return this.pricingService.restore(id);
  }
}
