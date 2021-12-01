/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  setDoc,
  doc,
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getPerformance } from 'firebase/performance';

import { getFirebaseConfig } from '../firebase-config.js';

const COLLECTION_NAME = {
  MESSAGE   : 'messages',
  FCM_TOKEN : 'fcmTokens',
  USER      : 'users',
}

var userPicElement, userNameElement, signInButtonElement, signOutButtonElement;

// Signs-in Friendly Chat.
async function signIn() {
  var provider = new GoogleAuthProvider();
  await signInWithPopup( getAuth(), provider );
}

// Signs-out of Friendly Chat.
function signOutUser() {
  signOut(getAuth());
}

// Initiate firebase auth
function initFirebaseAuth() {
  onAuthStateChanged( getAuth(), authStateObserver );
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
  return getAuth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return getAuth().currentUser.displayName;
}
// Saves the messaging device token to Cloud Firestore.
async function saveMessagingDeviceToken() {
  try{
    const currentToken  = await getToken( getMessaging() );
    if( currentToken ){
      console.log('Got FCM device token:', currentToken);

      const tokenRef = doc( getFirestore(), COLLECTION_NAME.FCM_TOKEN, currentToken );
      await setDoc( tokenRef, { uid : getAuth().currentUser.uid } );
  
      onMessage( getMessaging(), message => {
        'New foreground notification from Firebase Messaging!',
            message.notification
      } );
    }else{
      // request permission if cannot get token.
      requestNotificationsPermissions();
    }
  } catch( error ) {
    console.error('Unable to get messaging token.', error);
  }
}

// Requests permissions to show notifications.
async function requestNotificationsPermissions() {
  const permission = await Notification.requestPermission();

  if( permission === 'granted' ){
    console.log( 'Notification permission granted.' );
    await saveMessagingDeviceToken();
  }else{
    console.log( 'Notification permission not granted.' );
  }
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
async function authStateObserver(user) {
  if (user) {
    // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage =
      'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');

    // save users info
    const userRef = doc( getFirestore(), COLLECTION_NAME.USER, getAuth().currentUser.uid );
    await setDoc( userRef, { 
      name          : getUserName(),
      profilePicUrl : getProfilePicUrl()
    } );


    // We save the Firebase Messaging Device token and enable notifications.
    saveMessagingDeviceToken();
  } else {
    // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
  }
}

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

export function checkAuth(){
  // Shortcuts to DOM Elements.
  userPicElement = document.getElementById('user-pic');
  userNameElement = document.getElementById('user-name');
  signInButtonElement = document.getElementById('sign-in');
  signOutButtonElement = document.getElementById('sign-out');
  
  // Saves message on form submit.
  signOutButtonElement.addEventListener('click', signOutUser);
  signInButtonElement.addEventListener('click', signIn);
  
  const firebaseAppConfig = getFirebaseConfig();
  initializeApp( firebaseAppConfig );
  
  getPerformance();
  
  initFirebaseAuth();
}