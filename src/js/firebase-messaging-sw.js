import { initializeApp  } from "@firebase/app";
import { getMessaging } from "@firebase/messaging/sw";
import { getFirebaseConfig } from "./config/firebase-config";

const firebaseApp = initializeApp( getFirebaseConfig() );
getMessaging( firebaseApp );
console.info('Firebase messaging service worker is set up');