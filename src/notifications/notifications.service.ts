import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { formatReadableDate } from '../common/utils/date.util';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

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
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) { }

  async registerToken(
    userId: string,
    token?: string,
    deviceType?: string,
    schoolId?: string,
    classId?: string,
    sectionId?: string,
    targetUserId?: string,
  ) {
    let tokens: string[] = [];

    if (token) {
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

      await this.fcmTokenRepository.save(fcmToken);
      tokens.push(token);
    } else {
      // If no token provided, get all existing tokens for the user
      const userTokens = await this.fcmTokenRepository.find({ where: { userId } });
      tokens = userTokens.map((t) => t.token);
    }

    if (tokens.length === 0) {
      this.logger.warn(`No FCM tokens to subscribe for user ${userId}`);
      return { success: false, message: 'No tokens found to subscribe' };
    }

    // Automatically subscribe to topics for each token
    for (const t of tokens) {
      await this.subscribeTokenToTopics(t, userId, {
        schoolId,
        classId,
        sectionId,
        userId: targetUserId,
      });
    }

    return { success: true, message: `Subscribed ${tokens.length} token(s) to topics` };
  }

  async subscribeTokenToTopics(
    token: string,
    userId: string,
    explicitIds?: {
      schoolId?: string;
      classId?: string;
      sectionId?: string;
      userId?: string;
    },
  ) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        this.logger.warn(`Cannot subscribe to topics: User ${userId} not found`);
        return;
      }

      const topics: string[] = [];

      // Use explicit IDs if provided, otherwise fallback to user's database records
      const sId = explicitIds?.schoolId || user.schoolId;
      const cId = explicitIds?.classId || user.classId;
      const secId = explicitIds?.sectionId || user.sectionId;
      const uId = explicitIds?.userId || user.id;

      // 1. School topic
      if (sId) {
        topics.push(`school_${sId}`);
      }

      // 2. Class topic
      if (cId) {
        topics.push(`class_${cId}`);
      }

      // 3. Section topic
      if (secId) {
        topics.push(`section_${secId}`);
      }

      // 4. Role-specific topics (optional but useful)
      if (user.role === UserRole.STUDENT) {
        topics.push(`student_${user.id}`);
      }

      // 5. Personal user topic
      if (uId) {
        topics.push(`user_${uId}`);
      }

      if (topics.length > 0) {
        this.logger.log(
          `Subscribing token to topics for user ${userId}: ${topics.join(', ')}`,
        );

        for (const topic of topics) {
          await this.firebaseApp.messaging().subscribeToTopic(token, topic);
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Error subscribing token to topics for user ${userId}: ${error.message}`,
      );
    }
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

  async sendNotification(
    receiverUuid: string,
    title: string,
    messageBody: string,
    additionalData?: Record<string, any>,
    image?: string,
  ) {
    // 1. Prepare FCM data payload (must be string-string)
    const data: Record<string, string> = {};
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        data[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      });
    }

    // 2. Send to topic (treating receiverUuid as the topic name)
    const message: admin.messaging.Message = {
      topic: receiverUuid,
      notification: {
        title,
        body: messageBody,
        ...(image && { imageUrl: image }),
      },
      data,
    };

    try {
      const response = await this.firebaseApp.messaging().send(message);
      this.logger.log(`Notification sent to topic ${receiverUuid}: ${response}`);

      // 3. (Optional) Save to DB if receiverUuid matches a user
      const user = await this.usersService.findById(receiverUuid).catch(() => null);
      if (user) {
        const notification = this.notificationRepository.create({
          recipientId: receiverUuid,
          title,
          body: messageBody,
          data: data,
        });
        await this.notificationRepository.save(notification);
      }

      return { success: true, messageId: response };
    } catch (error: any) {
      this.logger.error(
        `Error sending notification to topic ${receiverUuid}: ${error.message}`,
      );
      throw error;
    }
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