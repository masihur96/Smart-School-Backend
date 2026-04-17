import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) { }

  @Public()
  @Post('send-test')
  @ApiOperation({ summary: 'Send a test notification (Public)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Test Title' },
        body: { type: 'string', example: 'This is a test message' },
        topic: { type: 'string', example: 'all_users', description: 'FCM topic name' },
        userId: { type: 'string', example: 'uuid-123', description: 'Target user UUID' },
        data: { type: 'object', example: { key: 'value' } },
      },
    },
  })
  async sendTestNotification(
    @Body()
    body: {
      title: string;
      body: string;
      topic?: string;
      userId?: string;
      data?: Record<string, string>;
    },
  ) {
    const { title, body: messageBody, topic, userId, data } = body;

    if (userId) {
      return await this.service.sendToUser(userId, title, messageBody, data);
    }

    if (topic) {
      const response = await this.service.sendToTopic(
        topic,
        title,
        messageBody,
        data,
      );
      return { success: true, messageId: response };
    }

    return { success: false, message: 'Provide either userId or topic' };
  }

  @Post('fcm-token')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Register/Update FCM token for the logged-in user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', example: 'fcm_registration_token_here' },
        deviceType: { type: 'string', example: 'android', enum: ['android', 'ios', 'web'] },
      },
    },
  })
  async registerToken(
    @Req() req: any,
    @Body() body: { token: string; deviceType?: string },
  ) {
    return await this.service.registerToken(
      req.user.id,
      body.token,
      body.deviceType,
    );
  }

  @Get()
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get notification history for the logged-in user' })
  async getMyNotifications(@Req() req: any) {
    return await this.service.getUserNotifications(req.user.id);
  }

  @Patch(':id/read')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return await this.service.markAsRead(id, req.user.id);
  }
}