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
  constructor(private readonly service: NotificationsService) {}

  @Public()
  @Post('send')
  @ApiOperation({ summary: 'Send a notification via topic' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['receiver_uuid', 'title', 'message'],
      properties: {
        receiver_uuid: { type: 'string', example: 'user-uuid-or-topic-name' },
        title: { type: 'string', example: 'Notification Title' },
        message: { type: 'string', example: 'Notification Body Message' },
        additional_data: {
          type: 'object',
          example: { path: '/home', uuid: '123' },
        },
        image: { type: 'string', example: 'https://example.com/image.png' },
      },
    },
  })
  async sendNotification(
    @Body()
    body: {
      receiver_uuid: string;
      title: string;
      message: string;
      additional_data?: Record<string, any>;
      image?: string;
    },
  ) {
    return await this.service.sendNotification(
      body.receiver_uuid,
      body.title,
      body.message,
      body.additional_data,
      body.image,
    );
  }

  @Public()
  @Post('send-test')
  @ApiOperation({ summary: 'Send a test notification (Public)' })
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
  @ApiOperation({
    summary:
      'Register FCM token and subscribe to topics (Class, Section, School, etc.)',
    description:
      'Registers the device token and subscribes the user to relevant topics. If no token is provided, it updates subscriptions for all existing tokens of the user.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'fcm_registration_token_here',
          description: 'Optional if token already registered',
        },
        deviceType: {
          type: 'string',
          example: 'android',
          enum: ['android', 'ios', 'web'],
        },
        userId: {
          type: 'string',
          example: 'user-uuid',
          description:
            'Explicit user ID to subscribe (defaults to logged-in user)',
        },
        classId: {
          type: 'string',
          example: 'class-uuid',
          description: 'Explicit class ID to subscribe',
        },
        sectionId: {
          type: 'string',
          example: 'section-uuid',
          description: 'Explicit section ID to subscribe',
        },
        schoolId: {
          type: 'string',
          example: 'school-uuid',
          description: 'Explicit school ID to subscribe',
        },
      },
    },
  })
  async registerToken(
    @Req() req: any,
    @Body()
    body: {
      token?: string;
      deviceType?: string;
      userId?: string;
      classId?: string;
      sectionId?: string;
      schoolId?: string;
    },
  ) {
    return await this.service.registerToken(
      req.user.id,
      body.token,
      body.deviceType,
      body.schoolId,
      body.classId,
      body.sectionId,
      body.userId,
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
