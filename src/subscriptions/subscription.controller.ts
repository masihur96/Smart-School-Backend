import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@ApiBearerAuth('bearer')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('assign')
  @ApiOperation({ summary: 'Assign or upgrade a pricing plan to a school' })
  assignPlan(@Body() dto: AssignSubscriptionDto) {
    return this.subscriptionService.assignPlan(dto);
  }

  @Get('school/:schoolId')
  @ApiOperation({ summary: 'Get active subscription for a specific school' })
  getSubscription(@Param('schoolId') schoolId: string) {
    return this.subscriptionService.getActiveSubscription(schoolId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all subscriptions across all schools' })
  getAll() {
    return this.subscriptionService.getAllSchoolSubscriptions();
  }
}
