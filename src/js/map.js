'use strict';
import { initializeApp } from 'firebase/app';
import {
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

import { getFirebaseConfig } from './firebase-config.js';

import { checkAuth } from './components/header.js';

const COLLECTION_NAME = {
  MESSAGE   : 'messages',
  ROOM      : 'rooms',
  TASK      : 'tasks',
  USER      : 'users',
}

const TASK_STATUS = {
  WAITING    : 1,
  MESSAGING  : 2,
  CONCLUEDED : 3,
}

const CATEGORY_LIST = {
  1 : '移動',
  2 : '買い物',
  3 : 'その他',
}

let roomId;

async function initialize(){
  const firebaseAppConfig = getFirebaseConfig();
  initializeApp( firebaseAppConfig );
  getPerformance();
  checkAuth();
}

async function loadTasks() {
  // TODO 範囲をマップ範囲内に絞りたい
  const taskQeury = query(
    collection( getFirestore(), COLLECTION_NAME.TASK ),
    orderBy( 'timestamp', 'desc' ),
    limit( 100 )
  );

  onSnapshot( taskQeury, snapshot => {
    snapshot.docChanges().forEach( async (change) => {
      if( change.type === 'removed' ){
        // TODO
      }else{
        const task    = change.doc.data();
        // やり取り中のものは表示させない仕様
        if( task.taskStatus === TASK_STATUS.MESSAGING ) return;

        const uid  = task.uid;
        console.log( uid );
        const userSnap  = await getDoc( doc( getFirestore(), COLLECTION_NAME.USER, uid ) );
        if( !userSnap.exists() ){
          console.error( 'invalid user:' + uid );
          return;
        }

        createMarkerByInfo({
          "taskId": change.doc.id,
          "category": CATEGORY_LIST[task.category],
          "date": task.date,
          "lat": task.latitude,
          "lng": task.longitude,
          "isConcluded": task.taskStatus === TASK_STATUS.CONCLUEDED,
          "userName": userSnap.get( 'name' ),
          "place": task.place,
          "text": task.text
        });
      }
    });
  });
}


const markerInfo = [
    {
      "lat": 35.73583356716435,
      "lng": 139.65179199136116,
      "isConcluded": true,
      "userName":"ikoma",
      "place":"練馬区役所",
      "text":"test1"
    },
    {
      "lat": 35.73792383224485,
      "lng": 139.65330267582618,
      "isConcluded": false,
      "userName":"ozaki",
      "place":"練馬駅",
      "text":"test2"
    },
    {
      "lat": 35.73724628020582,
      "lng": 139.6516448157238,
      "isConcluded": false,
      "userName":"tomo",
      "place":"業務スーパー 練馬駅前店",
      "text":"test3"
    }
];
const contentString =
    '<div id="content">' +
      '<div id="bodyContent">' +
        "<h4>{0} さん</h4>" +
        "<p>日付：{1}</p>" +
        "<p>場所：{2}</p>" +
        '<p>カテゴリ：{3}</p>' +
        '<p>内容：{4}</p>' +
        '<a href="/chat.html?task={5}&uid={6}" class="mdl-button mdl-button--raised mdl-button--colored">詳細を見る</button>'
      "</div>" +
    "</div>";
    
let geocoder;

let map;
let markers = [];
let currentInfoWindow = null;

// 現在地取得処理
async function initMap() {
  geocoder = new google.maps.Geocoder();

  // Geolocation APIに対応している
  if (navigator.geolocation) {
    detectBrowser();
    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
      // 取得成功した場合
      function(position) {
        // 緯度・経度を変数に格納
        //var mapLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var mapLatLng = new google.maps.LatLng(35.73583356716435, 139.65179199136116);
        // マップオプションを変数に格納
        var mapOptions = {
            zoom : 16,          // 拡大倍率
            center : mapLatLng,  // 緯度・経度
            mapTypeControl: false,
            styles : [
            {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#dde2e3"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "all",
                "stylers": [
                    {
                        "color": "#c6e8b3"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#c6e8b3"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#c1d1d6"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#a9b8bd"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "all",
                "stylers": [
                    {
                        "color": "#f8fbfc"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "color": "#979a9c"
                    },
                    {
                        "visibility": "on"
                    },
                    {
                        "weight": 0.5
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "visibility": "on"
                    },
                    {
                        "color": "#827e7e"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#3b3c3c"
                    },
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#a6cbe3"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            }
        ]
        };
        // マップオブジェクト作成
        map = new google.maps.Map(
          document.getElementById("map"), // マップを表示する要素
          mapOptions         // マップオプション
        );

        // This event listener will call addMarker() when the map is clicked.
        map.addListener("click", (event) => {
          // 住所を取得
          getAddress(event.latLng);
          //TODO登録UIを出す
          //addMarker(event.latLng, true);
        });

        // Create the search box and link it to the UI element.
        const input = document.getElementById("pac-input");
        const searchBox = new google.maps.places.SearchBox(input);
        
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener("bounds_changed", () => {
          searchBox.setBounds(map.getBounds());
        });

        let markers = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener("places_changed", () => {
          const places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }

          // Clear out the old markers.
          markers.forEach((marker) => {
            marker.setMap(null);
          });
          markers = [];

          // For each place, get the icon, name and location.
          const bounds = new google.maps.LatLngBounds();

          places.forEach((place) => {
            if (!place.geometry || !place.geometry.location) {
              console.log("Returned place contains no geometry");
              return;
            }

            const icon = {
              url: place.icon,
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(25, 25),
            };

            // Create a marker for each place.
            markers.push(
              new google.maps.Marker({
                map,
                icon,
                title: place.name,
                position: place.geometry.location,
              })
            );
            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        });
        loadTasks();
      },
      // 取得失敗した場合
      function(error) {
        // エラーメッセージを表示
        switch(error.code) {
          case 1: // PERMISSION_DENIED
            alert("位置情報の利用が許可されていません");
            break;
          case 2: // POSITION_UNAVAILABLE
            alert("現在位置が取得できませんでした");
            break;
          case 3: // TIMEOUT
            alert("タイムアウトになりました");
            break;
          default:
            alert("その他のエラー(エラーコード:"+error.code+")");
            break;
        }
      }
    );
  // Geolocation APIに対応していない
  } else {
    alert("この端末では位置情報が取得できません");
  }
}

// Adds a marker to the map and push to the array.
function addMarker(position, animationFlag = false, icon = null) {
  var marker = new google.maps.Marker({
    position,
    animation: (animationFlag) ? google.maps.Animation.DROP : null,
    map,
  });
  if(icon != null) {
    marker.setIcon( icon );
  }
  return marker;
}

// Marker生成
function createMarkerByInfo(info) {
  var position = new google.maps.LatLng(info.lat, info.lng); 

  // 
  const icon = !info.isConcluded ? null : {
    url       : "/images/nerimarukun.png",
    anchor    : new google.maps.Point(23, 50),
    scaledSize: new google.maps.Size(46, 61),
  };

  var marker = addMarker(position, false, icon);
  // InfoWindowオブジェクト
  var infoWindow = new google.maps.InfoWindow();
  google.maps.event.addListener(marker, 'click', function (e) {
      if (currentInfoWindow) currentInfoWindow.close();
      infoWindow.setContent( contentString.format( info.userName, info.date,   info.place, info.category,
                                                   info.text, info.taskId, getAuth().currentUser.uid ));
      infoWindow.open(map, marker);
      currentInfoWindow = infoWindow;
  });
}

function getAddress(position){
  geocoder.geocode(
    {
        location: position
      }, 
    function(results, status) {
			  if (status !== 'OK') {
			    alert('Failed: ' + status);
			    return;
		    }
        // results[0].formatted_address
        if (results[0]) {
        console.log(results[0]);
        alert(results[0].formatted_address);
	        return results[0].formatted_address;
        } else {
          alert('場所が特定できません。');
          return;
        }
  });
}

function detectBrowser() {
  var useragent = navigator.userAgent;
  var mapdiv = document.getElementById("map");
  mapdiv.style.width = '100%';
  mapdiv.style.height = '100%';
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

window.initMap = initMap;
initialize();