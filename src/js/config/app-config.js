/** firestoreのコレクション */
const COLLECTION_NAME = {
  FCM_TOKEN : 'fcmTokens',
  USER      : 'users',
  MESSAGE   : 'messages',
  ROOM      : 'rooms',
  TASK      : 'tasks',
}

/** 困りごとカテゴリ */
const CATEGORY_LIST = {
  1  : '移動・交通機関',
  2  : '食事',
  3  : 'ショッピング',
  99 : 'その他',
}

/** 困りごとのステータス */
const TASK_STATUS = {
  WAITING    : 1,
  MESSAGING  : 2,
  CONCLUEDED : 3,
}

/** チャットルームのステータス */
const ROOM_STATUS = {
  MESSAGING : 1,
  APPLY     : 2,
  CONCLUDED : 3,
  CANCELED  : 4,
  DECLINED  : 5,
}

/** 時間帯一覧 */
const TIME_LIST = [...Array(12)].map( ( v, k ) => `${k+10}:00~${k+10}:59` );

export { 
  COLLECTION_NAME,
  CATEGORY_LIST,
  TASK_STATUS,
  ROOM_STATUS,
  TIME_LIST
 };