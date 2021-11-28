/**
 * To find your Firebase config object:
 * 
 * 1. Go to your [Project settings in the Firebase console](https://console.firebase.google.com/project/_/settings/general/)
 * 2. In the "Your apps" card, select the nickname of the app for which you need a config object.
 * 3. Select Config from the Firebase SDK snippet pane.
 * 4. Copy the config object snippet, then add it here.
 */
const config = {
  apiKey: "AIzaSyApgRKBVWp0KxSK0MECjYHc-S8nG4KDFGc",
  authDomain: "fir-tutorial-874b4.firebaseapp.com",
  projectId: "fir-tutorial-874b4",
  storageBucket: "fir-tutorial-874b4.appspot.com",
  messagingSenderId: "324500450506",
  appId: "1:324500450506:web:baca36f9d55f2812051833"
};

export function getFirebaseConfig() {
  if (!config || !config.apiKey) {
    throw new Error('No Firebase configuration object provided.' + '\n' +
    'Add your web app\'s configuration object to firebase-config.js');
  } else {
    return config;
  }
}