import { PartialType } from '@nestjs/swagger';
import { AssignSubscriptionDto } from './assign-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(AssignSubscriptionDto) {}
