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

import { checkAuth } from './components/header.js';
checkAuth();

$(document).ready(function(){
    $('.sidenav').sidenav();
});

const chatListCell =
    '<li class="collection-item avatar">' +
        '<a href="/chat.html?=room={0}" class="collection-item">' +
            "{1}" +
            '<span class="title">{2}</span>' +
            "<p>{3}</p>" +
        "</a>" +
    "</li>";
    
    const chatInfo = [
        {
            "roomId": 1,
            "iconUrl": "",
            "title":"テスト１",
            "text":"xxxxxxxxxxxxxxxxxxxxxxxx"
        },
        {
            "roomId": 2,
            "iconUrl": "",
            "title":"テスト2",
            "text":"xxxxxxxxxxxxxxxxxxxxxxxx"
        },
        {
            "roomId": 3,
            "iconUrl": "",
            "title":"テスト3",
            "text":"xxxxxxxxxxxxxxxxxxxxxxxx"
        }
    ];

async function initialize(){
    createChatList();
}

function createChatList() {
    for(var info of chatInfo){
        let imageFormat = '<i class="material-icons circle">person_pin</i>';
        if(info.iconUrl != "") {
            imageFormat = '<img src="{0}" alt="" class="circle">'.format(info.iconUrl);
        }
        let cell = chatListCell.format(info.roomId, imageFormat, info.title, info.text);
        $('.collection').append(cell);
    }
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