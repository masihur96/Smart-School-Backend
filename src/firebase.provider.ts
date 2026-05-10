import * as admin from 'firebase-admin';
import { Provider } from '@nestjs/common';

export const FirebaseProvider: Provider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: () => {
    if (admin.apps.length > 0) {
      return admin.app();
    }

    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG!);
    firebaseConfig.private_key = firebaseConfig.private_key.replace(
      /\\n/g,
      '\n',
    );

    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
  },
};
