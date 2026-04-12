import { Controller, Get, Post, Body, Param, NotFoundException, Patch, Delete } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a subscription' })
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(id);
  }

  @Get('trash')
  @ApiOperation({ summary: 'Get all soft-deleted subscriptions' })
  findDeleted() {
    return this.subscriptionService.findAllDeleted();
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted subscription' })
  restore(@Param('id') id: string) {
    return this.subscriptionService.restore(id);
  }
}
