import * as admin from 'firebase-admin';
import { Provider } from '@nestjs/common';
import * as serviceAccount from './config/firebase-admin.json';

export const FirebaseProvider: Provider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: () => {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  },
};