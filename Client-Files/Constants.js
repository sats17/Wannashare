const PC_CONFIG = {
        'iceServers': [{'urls': 'stun:stun.l.google.com:19302'},
          {'urls':'stun:stun1.l.google.com:19302'},
          {'urls':'stun:stun2.l.google.com:19302'},
          {'urls':'stun:stun3.l.google.com:19302'},
          {'urls':'stun:stun4.l.google.com:19302'},
        {
          "urls": [
            "turn:13.250.13.83:3478?transport=udp"
          ],
          "username": "YzYNCouZM1mhqhmseWk6",
          "credential": "YzYNCouZM1mhqhmseWk6"
        }
      ]
}

const FILE_SENT = "FileSentToast";
const FILE_RECEIVE = "FileRecieveToast";
const FILE_SENDING = "WaitMessageToast";
const ROOM_FULL = "RoomFullToast";
const INVALID_ATTEMPT = "NotAcceptable";
const CONNECTION_REQUEST = "ConnectionRequest";
const USER_NOT_FOUND = "UserNotFound";
const CONNECTION_CREATED = "ConnectionCreated";