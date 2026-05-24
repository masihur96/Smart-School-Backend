import * as admin from 'firebase-admin';
import { Logger, Provider } from '@nestjs/common';

export const FirebaseProvider: Provider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: () => {
    const logger = new Logger('FirebaseProvider');

    if (!process.env.FIREBASE_CONFIG) {
      logger.warn(
        'FIREBASE_CONFIG env variable is not set. Push notifications will be disabled.',
      );
      return null;
    }

    try {
      if (admin.apps.length > 0) {
        return admin.app();
      }

      const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      firebaseConfig.private_key = firebaseConfig.private_key.replace(
        /\\n/g,
        '\n',
      );

      return admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
    } catch (error: any) {
      logger.error(
        `Failed to initialize Firebase: ${error.message}. Push notifications will be disabled.`,
      );
      return null;
    }
  },
};
