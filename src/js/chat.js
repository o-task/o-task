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
  onAuthStateChanged,
  getAuth,
} from 'firebase/auth';
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
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { getPerformance } from 'firebase/performance';

import { getFirebaseConfig } from './config/firebase-config.js';

import { checkAuth } from './components/header.js';

import { COLLECTION_NAME, ROOM_STATUS } from './config/app-config.js';

let roomId,taskId;

async function initialize(){
  const firebaseAppConfig = getFirebaseConfig();
  initializeApp( firebaseAppConfig );
  getPerformance();
  checkAuth();
  onAuthStateChanged( getAuth(), setupRoom );
}

async function setupRoom(){
  const roomDoc = await getOrCreateRoom();
  if( roomDoc === null ){
    console.error( 'cannot prepare room' );
    return;
  }
  roomId = roomDoc.id;
  
  taskId = roomDoc.get( 'taskId' );
  const taskSnap  = await getDoc( doc( getFirestore(), COLLECTION_NAME.TASK, taskId ) );
  if( !taskSnap.exists() ){
    console.error( 'invalid task id:' + taskId );
    return;
  }

  const selfUid = getAuth().currentUser.uid;
  if( ![roomDoc.get( 'supporterUid' ), taskSnap.get( 'uid' )].includes( selfUid ) ){
    console.error( 'not permitted' );
    return;
  }

  loadMessages();
}

async function getOrCreateRoom(){
  let roomSnap;
  const url     = new URL(window.location.href);
  const roomId  = url.searchParams.get( 'room' );
  if( roomId ){
    roomSnap = await getDoc( doc( getFirestore(), COLLECTION_NAME.ROOM, roomId ) );
    console.log( roomSnap );
    return roomSnap;
  }

  let taskId  = url.searchParams.get( 'task' );
  if( !taskId ) return null;

  roomSnap = await getDocs( query( 
    collection( getFirestore(), COLLECTION_NAME.ROOM ),
    where( 'taskId', '==', taskId ),
    where( 'supporterUid', '==', getAuth().currentUser.uid ),
  ) );

  if( roomSnap.size !== 0 ) return roomSnap.docs[0];

  return await createRoom( taskId );
}

async function createRoom(taskId) {
  try{
    const roomRef = await addDoc( collection( getFirestore(), COLLECTION_NAME.ROOM),{
      taskId        : taskId,
      supporterUid  : getAuth().currentUser.uid,
      roomStatus    : ROOM_STATUS.MESSAGING,
      timestamp     : serverTimestamp()
    });
    return await getDoc( roomRef );
    
  }catch(error){
    console.error( 'Error writing new message to Firebase Database', error );
    return null;
  }
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
  return getAuth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return getAuth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!getAuth().currentUser;
}

// Saves a new message on the Cloud Firestore.
async function saveMessage(messageText) {
  try{
    await addDoc( collection( getFirestore(), COLLECTION_NAME.MESSAGE),{
      roomId        : roomId,
      name          : getUserName(),
      text          : messageText,
      profilePicUrl : getProfilePicUrl(),
      timestamp     : serverTimestamp()
    });
  }catch(error){
    console.error( 'Error writing new message to Firebase Database', error );
  }
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  // Create the query to load the last 12 messages and listen for new ones.
  const recentMessageQuery = query(
    collection( getFirestore(), COLLECTION_NAME.MESSAGE ),
    where( 'roomId', '==', roomId ),
    orderBy( 'timestamp', 'desc' ),
    limit( 100 )
  );

  onSnapshot( recentMessageQuery, snapshot => {
    snapshot.docChanges().forEach( change => {
      if( change.type === 'removed' ){
        deleteMessage( change.doc.id );
      }else{
        let message = change.doc.data();
        displayMessage( change.doc.id, message.timestamp, message.name,
                        message.text, message.profilePicUrl, message.imageUrl );
      }
    });
  });
}

// Saves a new message containing an image in Firebase.
// This first saves the image in Firebase storage.
async function saveImageMessage(file) {
  try{
    // 1 - We add a message with a loading icon that will get updated with the shared image.
    const messageRef = await addDoc( collection( getFirestore(), COLLECTION_NAME.MESSAGE ), {
      roomId        : roomId,
      name          : getUserName(),
      imageUrl      : LOADING_IMAGE_URL,
      profilePicUrl : getProfilePicUrl(),
      timestamp     : serverTimestamp()
    });

    // 2 - Upload the image to Cloud Storage.
    const filePath      = `${getAuth().currentUser.uid}/${messageRef.id}/${file.name}`;
    const newImageRef   = ref( getStorage(), filePath );
    const fileSnapshot  = await uploadBytesResumable( newImageRef, file );

    // 3 - Generate a public URL for the file.
    const publicImageUrl = await getDownloadURL( newImageRef );

    // 4 - Update the chat message placeholder with the image's URL.
    await updateDoc( messageRef, {
      imageUrl    : publicImageUrl,
      storageUrl  : fileSnapshot.metadata.fullPath
    } )
  }catch(error){
    console.error('There was an error uploading a file to Cloud Storage:', error);
  }
}

// Triggered when a file is selected via the media picker.
function onMediaFileSelected(event) {
  event.preventDefault();
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  imageFormElement.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000,
    };
    signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (checkSignedInWithMessage()) {
    saveImageMessage(file);
  }
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (messageInputElement.value && checkSignedInWithMessage()) {
    saveMessage(messageInputElement.value).then(function () {
      // Clear message text field and re-enable the SEND button.
      resetMaterialTextfield(messageInputElement);
      toggleButton();
    });
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000,
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
var MESSAGE_TEMPLATE =
  '<div class="message-container">' +
  '<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Delete a Message from the UI.
function deleteMessage(id) {
  var div = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (div) {
    div.parentNode.removeChild(div);
  }
}

function createAndInsertMessage(id, timestamp) {
  const container = document.createElement('div');
  container.innerHTML = MESSAGE_TEMPLATE;
  const div = container.firstChild;
  div.setAttribute('id', id);

  // If timestamp is null, assume we've gotten a brand new message.
  // https://stackoverflow.com/a/47781432/4816918
  timestamp = timestamp ? timestamp.toMillis() : Date.now();
  div.setAttribute('timestamp', timestamp);

  // figure out where to insert new message
  const existingMessages = messageListElement.children;
  if (existingMessages.length === 0) {
    messageListElement.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];

    while (messageListNode) {
      const messageListNodeTime = messageListNode.getAttribute('timestamp');

      if (!messageListNodeTime) {
        throw new Error(
          `Child ${messageListNode.id} has no 'timestamp' attribute`
        );
      }

      if (messageListNodeTime > timestamp) {
        break;
      }

      messageListNode = messageListNode.nextSibling;
    }

    messageListElement.insertBefore(div, messageListNode);
  }

  return div;
}

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, text, picUrl, imageUrl) {
  var div =
    document.getElementById(id) || createAndInsertMessage(id, timestamp);

  // profile picture
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage =
      'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  } 

  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');

  if (text) {
    // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUrl) {
    // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function () {
      messageListElement.scrollTop = messageListElement.scrollHeight;
    });
    image.src = imageUrl + '&' + new Date().getTime();
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function () {
    div.classList.add('visible');
  }, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  messageInputElement.focus();
}

// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

// Shortcuts to DOM Elements.
var messageListElement = document.getElementById('messages');
var messageFormElement = document.getElementById('message-form');
var messageInputElement = document.getElementById('message');
var submitButtonElement = document.getElementById('submit');
var imageButtonElement = document.getElementById('submitImage');
var imageFormElement = document.getElementById('image-form');
var mediaCaptureElement = document.getElementById('mediaCapture');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');

// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// Events for image upload.
imageButtonElement.addEventListener('click', function (e) {
  e.preventDefault();
  mediaCaptureElement.click();
});
mediaCaptureElement.addEventListener('change', onMediaFileSelected);

initialize();