import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { formatReadableDate } from '../common/utils/date.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject('FIREBASE_ADMIN')
    private readonly firebaseApp: admin.app.App,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(FcmToken)
    private fcmTokenRepository: Repository<FcmToken>,
  ) { }

  async registerToken(userId: string, token: string, deviceType?: string) {
    let fcmToken = await this.fcmTokenRepository.findOne({ where: { token } });

    if (fcmToken) {
      fcmToken.userId = userId;
      if (deviceType) fcmToken.deviceType = deviceType;
    } else {
      fcmToken = this.fcmTokenRepository.create({
        userId,
        token,
        deviceType,
      });
    }

    return await this.fcmTokenRepository.save(fcmToken);
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    schoolId?: string,
  ) {
    // Save to database first
    const notification = this.notificationRepository.create({
      recipientId: userId,
      title,
      body,
      data,
      schoolId,
    });
    await this.notificationRepository.save(notification);

    // Get user's FCM tokens
    const tokens = await this.fcmTokenRepository.find({ where: { userId } });
    if (tokens.length === 0) {
      this.logger.warn(`No FCM tokens found for user ${userId}`);
      return notification;
    }

    const registrationTokens = tokens.map((t) => t.token);

    const message: admin.messaging.MulticastMessage = {
      tokens: registrationTokens,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    try {
      const response = await this.firebaseApp.messaging().sendEachForMulticast(message);
      this.logger.log(
        `Sent notifications to user ${userId}. Success: ${response.successCount}, Failure: ${response.failureCount}`,
      );

      // Cleanup invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error as any;
            if (
              error?.code === 'messaging/invalid-registration-token' ||
              error?.code === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(registrationTokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await this.fcmTokenRepository.delete({ token: In(failedTokens) });
          this.logger.log(`Cleaned up ${failedTokens.length} invalid FCM tokens`);
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Error sending push notification to user ${userId}: ${error.message}`,
      );
    }

    return notification;
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    return await this.firebaseApp.messaging().send(message);
  }

  async getUserNotifications(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((notification) => ({
      ...notification,
      body: this.beautifyBody(notification.body),
    }));
  }

  private beautifyBody(body: string): string {
    if (!body) return body;

    // Regexp for long JS date format: "Mon Apr 27 2026 00:00:00 GMT+0000 (Coordinated Universal Time)"
    const longDateRegex =
      /[A-Z][a-z]{2} [A-Z][a-z]{2} \d{1,2} \d{4} \d{2}:\d{2}:\d{2} GMT[-+]\d{4} \(.*\)/g;

    return body.replace(longDateRegex, (match) => {
      try {
        const date = new Date(match);
        if (!isNaN(date.getTime())) {
          return formatReadableDate(date);
        }
      } catch (e) {
        // ignore
      }
      return match;
    });
  }

  async markAsRead(id: string, userId: string) {
    await this.notificationRepository.update(
      { id, recipientId: userId },
      { isRead: true },
    );
    return await this.notificationRepository.findOne({ where: { id } });
  }

  async deleteNotification(id: string, userId: string) {
    return await this.notificationRepository.delete({ id, recipientId: userId });
  }
}