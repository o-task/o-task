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

  const chatListCell =
  '<li class="collection-item avatar">' +
      '<a href="/chat.html?room={0}" class="collection-item">' +
          "{1}" +
          '<span class="title">{2}</span>' +
          "<p>{3}</p>" +
      "</a>" +
  "</li>";

  async function initialize(){
    const firebaseAppConfig = getFirebaseConfig();
    initializeApp( firebaseAppConfig );
    checkAuth();

    $('ul.tabs').tabs();
    onAuthStateChanged( getAuth(), user=>{
        if( !user ) return;
        loadOwnerRoom();
        loadSupporterRoom();
    }) 
  }

  function createChatList( targetElemId, room ) {
    let imageFormat = '<i class="material-icons circle">person_pin</i>';
    if(room.iconUrl != "") {
        imageFormat = '<img src="{0}" alt="" class="circle">'.format(room.iconUrl);
    }
    let cell = chatListCell.format(room.roomId, imageFormat, room.title, room.text);
    $(`#${targetElemId} .collection`).prepend(cell);
  }

  async function loadOwnerRoom(  ) {
    // Create the query to load the last 12 messages and listen for new ones.
    const roomQuery = query(
      collection( getFirestore(), COLLECTION_NAME.ROOM ),
      where( 'ownerUid', '==', getAuth().currentUser.uid ),
      orderBy( 'timestamp', 'asc' ),
      limit( 100 )
    );

    onSnapshot( roomQuery, snapshot => {
      snapshot.docChanges().forEach( async change => {
        if( change.type === 'removed' ){
          
        }else{
          let room    = change.doc.data();
          const task  = await getDoc( doc( getFirestore(), COLLECTION_NAME.TASK, room.taskId ) );
          const supporter  = await getDoc( doc( getFirestore(), COLLECTION_NAME.USER, room.supporterUid ) );
          
          const text = task.get( 'text' );
          createChatList( 'ownerRoom', {
            "roomId"  : change.doc.id,
            "iconUrl" : supporter.get( 'profilePicUrl' ),
            "title"   : supporter.get( 'name' ) + ' さん',
            "text"    : text.length <= 20 ? text : text.slice(0,20) + '...'
          });
        }
      });
    });
  }

  async function loadSupporterRoom(  ) {
    // Create the query to load the last 12 messages and listen for new ones.
    const roomQuery = query(
      collection( getFirestore(), COLLECTION_NAME.ROOM ),
      where( 'supporterUid', '==', getAuth().currentUser.uid ),
      orderBy( 'timestamp', 'asc' ),
      limit( 100 )
    );

    onSnapshot( roomQuery, snapshot => {
      snapshot.docChanges().forEach( async change => {
        if( change.type === 'removed' ){
          
        }else{
          let room    = change.doc.data();
          const task  = await getDoc( doc( getFirestore(), COLLECTION_NAME.TASK, room.taskId ) );
          const owner  = await getDoc( doc( getFirestore(), COLLECTION_NAME.USER, room.ownerUid ) );

          const text = task.get( 'text' );
          createChatList( 'supporterRoom', {
            "roomId"  : change.doc.id,
            "iconUrl" : owner.get( 'profilePicUrl' ),
            "title"   : owner.get( 'name' ) + ' さん',
            "text"    : text.length <= 20 ? text : text.slice(0,20) + '...'
          });
        }
      });
    });
  }

  /*
  * pythonやC#のformatメソッド的な機能を実現
  */
  String.prototype.format = function(){
    let formatted = this;
    for(let arg in arguments){
      formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
  };

  initialize();