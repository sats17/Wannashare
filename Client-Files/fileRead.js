'use strict';

/*
  Required Variables
*/
let pc;
let file;
let dataChannel;
let fileReader;
let fileSize = 0;
let fileName;
let receiveChannel;
let receivedBufferSize = 0;
let isHeCreatesRoom = false;
let receiveBuffer = [];
let anotherpeer = false;


/*
  Html GUI Selectors.
*/
const fileSelector = document.querySelector('input#fileSelector');
let fileNameField = document.getElementById('fileName');
let aliceStatusName = document.getElementById('aliceStatus');
let CreateRoom = document.querySelector('button#Create');
let JoinRoom = document.querySelector('button#Join');
let sendFile = document.querySelector('button#sendFile');
let DisconnectRoom = document.querySelector('button#disconnect');
let serverBaseSendFile = document.querySelector('button#sendFileUsingServer');
const downloadAnchor = document.querySelector('a#download');
const Progress = document.querySelector('progress#progress');

/*
  Event Listners.
*/
fileSelector.addEventListener('change', handleFileSelect, false);

/*
  HTML GUI Flags.
*/
fileSelector.disabled = true;
sendFile.disabled = true;
serverBaseSendFile.disabled = true;
DisconnectRoom.disabled = true;


/*
  Function Calls when HTML GUI triggers.
*/
CreateRoom.onclick = createAction;
JoinRoom.onclick = joinAction;
sendFile.onclick = serverLessSendFileAction;
DisconnectRoom.onclick = disconnectAction;
serverBaseSendFile.onclick = serverBaseSendFileAction;

/*
  Creates instance of socket connection.
*/
let socket = socketConfig;

/* 
  When user click on Create button, this function will run.
*/
function createAction(){
  let roomCreator = prompt('Enter your unique name:');
  if (roomCreator !== null) {
    socket.emit('create', {email : roomCreator});
    console.log('Attempted to create or  join roomCreator', roomCreator);
    isHeCreatesRoom = true;
    JoinRoom.disabled = true;
    CreateRoom.disabled = true;
  }
}//end of createAction function

/*
  When user click on Join button, this function will run.
*/
function joinAction(){
  let newRoomJoiner = prompt("Enter your unique name");
  let roomCreator = prompt("Enter another peer name");
  if(newRoomJoiner !== null && roomCreator !== null){
      aliceStatusName.textContent = newRoomJoiner +" is connected.";
      socket.emit('join',{"newRoomJoiner" : newRoomJoiner ,"roomCreator" : roomCreator});
      CreateRoom.disabled = true;
      JoinRoom.disabled = true;
  }
}//end of joinAction function

/*
  When user click on Disconnect button, this function will run.
*/
function disconnectAction(){
  socket.emit('disconnectFromUser');
  bobStatus.textContent = "disconnected";
  DisconnectRoom.disabled = true;
  CreateRoom.disabled = false;
  JoinRoom.disabled = false;
  dataChannel.close();
  pc.close();
  fileSelector.disabled = true;
  sendFile.disabled = true;
}


socket.on('roomCreated',function(data){
  aliceStatusName.textContent = data +" is connected.";
});

socket.on('roomCreateFull',function(data){
  console.log("room full")
  DownloadToast();
});

socket.on('connectionRequest',function(data){
  let peerMail = data.fromMail;
  if (confirm("User "+peerMail+" wants to connect ?")) {
        socket.emit("connectionAccepted",{"roomJoinersSocketId":data.socketid});
  }
  else {
    socket.emit("rejectConnection");
  }
});

socket.on('roomFull',function(data){
  console.log(data+" is currently connected with other user");
});

socket.on('peerOffline',function(data){
    console.log(data+" is currently not online");
});

socket.on('connectionAccepted',function(data){
  console.log(data);
  prompt("connection created");
});

socket.on('invokeRoomJoiner',function(data){
  console.log(data);
  socket.emit('joinConfirm');
});

/*
  This socket event help first user to start webrtc connection.
*/
socket.on('roomJoined',function(data){
  fileSelector.disabled = false;
  DisconnectRoom.disabled = false;
  if(isHeCreatesRoom){
    bobStatus.textContent = data.joiner+" is connected";
    startServerlessConnection();
  }
  else{
    bobStatus.textContent = data.creator+" is connected";
  }
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});


/*
  Handles webrtc connection by sending message throught this socket event.
*/
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message.type === 'offer') {
      startServerlessConnection();
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    }
   else if (message.type === 'answer') {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate') {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);

  } else if (message === 'bye') {
    handleRemoteHangup();
  }

});

/*
  Set file metadata using this event.
*/
socket.on("FileMetaData" , function(data){
      console.log("file size is ", data.sendFileSize , " file name is ",data.sendFileName);
      fileSize = data.sendFileSize;
      fileName = data.sendFileName;
    });

/*
  event triggers when file data completly received.
*/
socket.on('fileReceived' , function(data){
      console.log("rec file size",data);
      Progress.value = 0;
      fileSentToast();
      fileSelector.value = '';
      sendFile.disabled = true;
      serverBaseSendFile.disabled = true;
    });

/*
  Event triggers when file data received.
*/
socket.on('serverBaseDataReceive',function(event){
  if(fileSelector.disabled == false){
    fileSelector.disabled = true;
  }
  receiveBuffer.push(event.ArrayData);
  
  console.log(event.ArrayData.byteLength)
  receivedBufferSize += event.ArrayData.byteLength;
  Progress.value += event.ArrayData.byteLength;

  if(receivedBufferSize === fileSize){
        console.log("Debug - Inside complete section")
        receivedBufferSize = 0;
        const received = new Blob(receiveBuffer);
        console.log(received);
        downloadAnchor.href = URL.createObjectURL(received);
        console.log(downloadAnchor.href)
        downloadAnchor.download = fileName;
        console.log("file name is ",fileName);
        //var download ='Click to download ',fileSize;
        console.log(fileSize);
        downloadAnchor.textContent = 'Click to download file = '+fileName;
        socket.emit("fileReceived" , "file receives");
        console.log("received.size here we reach");
        receiveBuffer = [];
        Progress.value = 0;
        fileSelector.disabled = false;
        DownloadToast();
      }

});

/*
  Event trigger when on of the user disconnects.
*/
socket.on('userDisconnect',function(data){
  bobStatus.textContent = "disconnected";
  DisconnectRoom.disabled = true;
  CreateRoom.disabled = false;
  JoinRoom.disabled = false;
  dataChannel.close();
  pc.close();
  fileSelector.disabled = true;
  sendFile.disabled = true;
});

//////////////////////////////////////////////////////////////////////////
function startServerlessConnection() {
    console.log('>>>>>>> startServerlessConnection() ');

    console.log('>>>>>> creating peer connection');
      createPeerConnection();

      console.log('isHeCreatesRoom', isHeCreatesRoom);
      if (isHeCreatesRoom) {
        doCall();
      }

}//end of function startServerlessConnection
console.log(pcConfig)

function createPeerConnection() {
    try {
      pc = new RTCPeerConnection(pcConfig);
      const dataChannelOptions = {
        ordered: true,
        maxPacketLifeTime: 3000,
      };

      dataChannel = pc.createDataChannel("chat" , dataChannelOptions);
      dataChannel.onopen = onSendChannelStateChange;
      dataChannel.binaryType = 'arraybuffer';
      dataChannel.readyState
      pc.ondatachannel = reciveChannelCallback;
      pc.onicecandidate = handleIceCandidate;
      pc.oniceconnectionstatechange = handleIceCandidateEvents;

      console.log('Created RTCPeerConnnection');
    }
    catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
      }
}

function handleIceCandidate(event) {
      console.log('icecandidate event: ', event);
      if (event.candidate) {
          socket.emit('message',{
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
    } else {
    console.log('End of candidates.');
  }
}

function handleIceCandidateEvents(event){
      if(pc.iceConnectionState === "failed"){
        alert("Peers Connection failed , because one of the user are behind symmetric NAT");
      }

}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');

  pc.createOffer(function(offer) {
  pc.setLocalDescription(new RTCSessionDescription(offer), function() {
    socket.emit('message',offer);
  }, onCreateSessionDescriptionError);
}, handleCreateOfferError);

}

function doAnswer() {
    console.log('Sending answer to peer.');

  pc.createAnswer(function(answer) {
    pc.setLocalDescription(new RTCSessionDescription(answer), function() {
      socket.emit('message',answer);
    }, onCreateSessionDescriptionError);
  }, handleCreateOfferError);
}



function onCreateSessionDescriptionError(error) {
  console.log('Failed to create session description:' + error.toString());
}

////////////////////////////////////////////////////////////////////////
///////////////end of signaling code/////////////////////////////////////////////



function handleFileSelect(evt){

  let fileCheck = evt.target.files[0];
  if(!fileCheck){
    //console.log("file not found");
  }
  else{
    sendFile.disabled = false;
    serverBaseSendFile.disabled = false;
    var filename = fileSelector.files[0].name;
    fileNameField.textContent = filename;
    console.log("Full path is ", filename);

    socket.emit("FileMetaData" , {sendFileName : filename , sendFileSize : fileCheck.size });
  }
}


function serverLessSendFileAction() {
    file = fileSelector.files[0];

    if(file.size === 0){
      alert("File size is zero");
    }
    Progress.max = file.size;


    //var chunkSize  = 64 * 1024;

    if(document.getElementById('one').checked) {
        var chunkSize = 20000;
        console.log("one selected");
    }
    else if(document.getElementById('two').checked) {
        var chunkSize = 61440;
        console.log("two selected");
    }else if(document.getElementById('three').checked) {
        var chunkSize = 512000;
        console.log("three selected");
    }
    else if(document.getElementById('four').checked) {
        var chunkSize = 1048576;
        console.log("four selected");
    }


    let offset = 0;//set offset for file reading

    fileReader = new FileReader();//create object of file API

    fileReader.onerror = FileErrorHandler;//hamdle error

    const readSlice = o => {
      //console.log('readSlice ', o);
      const slice = file.slice(offset, o + chunkSize);
      fileReader.readAsArrayBuffer(slice);
    };

    readSlice(0);


    fileReader.addEventListener('load', e => {
      //console.log('FileRead.onload ', e);
      console.log('ready state is ' , dataChannel.readyState);
        dataChannel.send(e.target.result);
        offset += e.target.result.byteLength;
        Progress.value += e.target.result.byteLength;


        if (offset < file.size) {
            readSlice(offset);
          }
        if(offset === file.size){
          readToast();
          fileNameField.textContent = "None";
        }
    });

}// end of sendFileAction

function serverBaseSendFileAction() {
    file = fileSelector.files[0];

    if(file.size === 0){
      alert("File size is zero");
    }
    Progress.max = file.size;

    if(document.getElementById('one').checked) {
        var chunkSize = 20000;
        console.log("one selected");
    }
    else if(document.getElementById('two').checked) {
        var chunkSize = 61440;
        console.log("two selected");
    }else if(document.getElementById('three').checked) {
        var chunkSize = 512000;
        console.log("three selected");
    }
    else if(document.getElementById('four').checked) {
        var chunkSize = 1048576;
        console.log("four selected");
    }



    let offset = 0;//set offset for file reading

    fileReader = new FileReader();//create object of file API

    fileReader.onerror = FileErrorHandler;//hamdle error

    const readSlice = o => {
      //console.log('readSlice ', o);
      const slice = file.slice(offset, o + chunkSize);
      fileReader.readAsArrayBuffer(slice);
    };

    readSlice(0);


    fileReader.addEventListener('load', e => {
        console.log(e.target.result.byteLength)
        socket.emit('serverBaseDataShare',{Data:e.target.result});
        offset += e.target.result.byteLength;
        Progress.value += e.target.result.byteLength;

        if (offset < file.size) {
            readSlice(offset);
          }
        if(offset === file.size){
          readToast();
          fileNameField.textContent = "None";
        }
    });

}// end of sendFileAction

function FileErrorHandler(evt) {
    switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
      case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
      default:
        alert('An error occurred reading this file.');
    };
}//end of FileErrorHandler




function reciveChannelCallback(event){
  console.log('here we reach')
  receiveChannel = event.channel;
  console.log("receiveChannel ", receiveChannel);
  receiveChannel.binaryType = "arraybuffer";
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
  downloadAnchor.textContent = '';
  downloadAnchor.removeAttribute('download');
  if (downloadAnchor.href) {
    URL.revokeObjectURL(downloadAnchor.href);
    downloadAnchor.removeAttribute('href');
  }

}

function onReceiveMessageCallback(event) {
  Progress.max = fileSize;
  receiveBuffer.push(event.data);

  receivedBufferSize += event.data.byteLength;

  Progress.value += event.data.byteLength;
  if(receivedBufferSize === fileSize){
        receivedBufferSize = 0;
        //var uarray = Uint8Array.from(receiveBuffer);
        //console.log("typed array is =",uarray);
        const received = new Blob(receiveBuffer);
        console.log(received);
        downloadAnchor.href = URL.createObjectURL(received);
        downloadAnchor.download = fileName;
        console.log("file name is ",fileName);
        //var download ='Click to download ',fileSize;
        console.log(fileSize);
        downloadAnchor.textContent = 'Click to download ';
        socket.emit("fileReceived" , "file receives");
        console.log("received.size here we reach");
        receiveBuffer = [];
        Progress.value = 0;
        DownloadToast();

      }
}
function fileSentToast(){
  var x = document.getElementById("toast");
  x.classList.add("show");
  setTimeout(function(){
    x.classList.remove("show");
  },1000);
}
function DownloadToast(){
  var x = document.getElementById("Toast");
  x.classList.add("show");
  setTimeout(function(){
    x.classList.remove("show");
  },1000);
}

function readToast(){
  var x = document.getElementById("toastRead");
  x.classList.add("show");
  setTimeout(function(){
    x.classList.remove("show");
  },1000);
}

function onSendChannelStateChange(){
  var readyState = dataChannel.readyState;
  console.log('ready state is ' , readyState);
  if(readyState === 'open'){
    console.log("data channel opend");
    //fileSelector.disabled = false;
  }
  if(readyState === 'connecting'){
    console.log("connecting data channel");
  }
  if(readyState === 'closed'){
    console.log("send channel closed");
  }

}

function onReceiveChannelStateChange(){
  var readyState = dataChannel.readyState;
  if(readyState === 'open'){
    console.log("receiver ready to receive data");
  }
  if(readyState === 'connecting'){
    console.log("connecting data channel");
  }
  if(readyState === 'closed'){
    console.log("recive channel closed");
  }
}
///////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////
