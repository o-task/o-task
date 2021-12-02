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

require('date-utils');
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseConfig } from './config/firebase-config.js';
import { checkAuth } from './components/header.js';
import { COLLECTION_NAME, TIME_LIST, CATEGORY_LIST }  from './config/app-config.js';

async function initialize(){
  const firebaseAppConfig = getFirebaseConfig();
  initializeApp( firebaseAppConfig );
  checkAuth();
  onAuthStateChanged( getAuth(), loadData );
}

async function loadData(){
  const url     = new URL(window.location.href);
  const taskId  = url.searchParams.get( 'task' );

  if( !taskId ){
      console.error( 'no task asigned' );
      return;
  }

  const taskSnap = await getDoc( doc( getFirestore(), COLLECTION_NAME.TASK, taskId ) );
  if( !taskSnap.exists() ){
      console.error( 'invalid task id' );
      return;
  }
  setTaskView( taskSnap );

  const userSnap = await getDoc( doc( getFirestore(), COLLECTION_NAME.USER, taskSnap.get( 'uid' ) ) );
  setUserView( userSnap.exists() ? userSnap : null );

  document.getElementById( 'message-btn' ).href = `/chat.html?task=${taskId}&uid=${getAuth().currentUser.uid}` ;
}

function setTaskView( task ){
  document.getElementById( 'date' ).innerText =
     `${new Date( task.get( 'date' )).toFormat( 'YYYY年M月D日' )} ${TIME_LIST[task.get('time')]}`;

  document.getElementById( 'place' ).innerText    = task.get('place');
  document.getElementById( 'address' ).innerText  = task.get('address');
  document.getElementById( 'category' ).innerText = CATEGORY_LIST[task.get('category')];
  document.getElementById( 'text' ).innerText     = task.get('text');
}

function setUserView( user ){
  if( user === null ){
    document.getElementById( 'task-user-name' ).innerText = '退会済みユーザ';
    return;
  }

  document.getElementById( 'task-user-pic' ).style      = `background-image: url( '${user.get( 'profilePicUrl' )}' );`;
  document.getElementById( 'task-user-name' ).innerText = user.get( 'name' );
}

initialize();

