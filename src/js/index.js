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

import { getFirebaseConfig } from './config/firebase-config.js';

import { COLLECTION_NAME } from './config/app-config.js';

async function authStateObserver(user) {
  const isLogin = !!user;
  
  document.querySelectorAll( '.top-link-button' ).forEach ( e => {
    e.style.display = isLogin ? '' : 'none';
  });
  document.querySelectorAll( '.top-auth-button' ).forEach ( e => {
    e.style.display = isLogin ? 'none' :'';
  });
  console.log( document.querySelectorAll( '.top-auth-button' ) );

  document.getElementById( 'top-button-area' ).style.visibility = 'visible';
}

async function signIn() {
  var provider = new GoogleAuthProvider();
  await signInWithPopup( getAuth(), provider );
}
document.getElementById( 'google-auth-button' ).addEventListener( 'click', signIn );

const firebaseAppConfig = getFirebaseConfig();
initializeApp( firebaseAppConfig );
onAuthStateChanged( getAuth(), authStateObserver );

