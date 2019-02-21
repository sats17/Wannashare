'use strict';
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var pc;
var reader;
var file;
var dataChannel;
var fileReader;
var fileSize = 0;
var fileName;
var receiveChannel;
let receivedSize = 0;
var userName;

let receiveBuffer = [];
var anotherpeer = false;


const fileInput = document.querySelector('input#fileInput');
fileInput.disabled = true;
var fullPath = document.getElementById('fileInput').value;
var fileNameField = document.getElementById('fileName');
var aliceStatusName = document.getElementById('aliceStatus');


fileInput.addEventListener('change', handleFileSelect, false);

var startButton = document.querySelector('button#startButton');
var sendFile = document.querySelector('button#sendFile');



const downloadAnchor = document.querySelector('a#download');
const Progress = document.querySelector('progress#progress');

sendFile.disabled = true;
//startButton.disabled = true;
startButton.onclick = startAction;
sendFile.onclick = sendFileAction;

//fileInput.onclick = handleFileSelect;


var socket = io.connect();

var room;
function startAction(){
  userName = prompt("Enter your name:")
  var room = prompt('Enter room name:');
  aliceStatusName.textContent = userName+" is connected.";
  if (room !== '') {
    socket.emit('create or join', room);
    console.log('Attempted to create or  join room', room);
  }
  socket.on('created', function(room) {
    console.log('Created room ' + room);
    anotherpeer = true;
    isInitiator = true;
  });
  socket.on('full', function(room) {
    console.log('Room ' + room + ' is full');
    alert("room is full");
  });
  socket.on('join', function (room) {
    console.log('Another peer made a request to join room ' + room);
    console.log('This peer is the initiator of room ' + room + '!');
    isChannelReady = true;

    fileInput.disabled = false;
    console.log("is channel ready here first page:");
  });

  socket.on('joined', function(room) {
    console.log('joined: ' + room);
    isChannelReady = true;


    fileInput.disabled = false;
    console.log("is channel ready here second page:");
  });

  socket.on('log', function(array) {
    console.log.apply(console, array);
  });

  ////////////////////////////////////////////////
  // This client receives a message
  socket.on('message', function(message) {
    console.log('Client received message:', message);

    if (message === 'start connection') {
      console.log("socket part is run here");
      maybeStart();
    }
      else if (!isInitiator && !isStarted) {
        maybeStart();
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
      }
     else if (message.type === 'answer' && isStarted) {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      pc.addIceCandidate(candidate);
      isStarted = false;
      isInitiator = true;
      isChannelReady = false;
    } else if (message === 'bye' && isStarted) {
      handleRemoteHangup();
    }

  });

    var m = 'start connection';
    socket.emit('message',m);
    if (isInitiator) {
      console.log("isInitiator part is run first");
      maybeStart();
    }

}//end of start function
/////////////////////////////////////////////////////////////////////////////
///////// Chat section //////////////////////////////////////////////////////




////////////////////// Meta data send //////////////////////////////////
/*
socket.on('fileSize' , function(data){
    console.log("rec file size",data);
    fileSize = data;

  });
socket.on('fileName' , function(data){
      console.log("rec file size",data);
      fileName = data;
    });*/
socket.on("FileMetaData" , function(data){
      console.log(data);
      console.log("file size is ", data.sendFileSize , " file name is ",data.sendFileName);
      fileSize = data.sendFileSize;
      fileName = data.sendFileName;
    });
//////////////////////////////////////////////////////////////////////
socket.on('fileReceived' , function(data){
      console.log("rec file size",data);
      Progress.value = 0;
      //alert("file received to another peer");
      downloadToast();
      fileInput.value = '';
      sendFile.disabled = true;
    });
//////////////////////////////////////////////////////////////
socket.on('userNameFromServer',function(data){
  bobStatus.textContent = data+" is connected";
  startButton.disabled = true;
});

socket.on('userDisconnect',function(data){
  bobStatus.textContent = "user disconnected";
});

//////////////////////////////////////////////////////////////////////////
function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, isChannelReady);
    if (!isStarted  && isChannelReady) {
      console.log('>>>>>> creating peer connection');
      createPeerConnection();
      //pc.addStream(localStream);
      isStarted = true;
      console.log('isInitiator', isInitiator);
      if (isInitiator) {
        doCall();
      }
    }
}//end of function maybeStart


function createPeerConnection() {
    try {
      pc = new RTCPeerConnection();
      //console.log("rtc peer connection start before ice");
      const dataChannelOptions = {
        ordered: true, // do not guarantee order
        maxPacketLifeTime: 3000, // in milliseconds
      };

      dataChannel = pc.createDataChannel("chat" , dataChannelOptions);
      dataChannel.onopen = onSendChannelStateChange;
      dataChannel.binaryType = 'arraybuffer';
      pc.ondatachannel = reciveChannelCallback;
      pc.onicecandidate = handleIceCandidate;

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

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer().then(
    setLocalAndSendMessage,
    handleCreateOfferError
  );
  //  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
      setLocalAndSendMessage,
      onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
    //console.log('here i reached');
    pc.setLocalDescription(sessionDescription);
  //  console.log('local description ',a);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    socket.emit('message',sessionDescription);
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
    var filename = fileInput.files[0].name;
    fileNameField.textContent = filename;
    console.log("Full path is ", filename);
    //console.log("sending file size is ", fileCheck.size);
    var filesize = fileCheck.size;
  //  socket.emit("fileSize" , fileCheck.size);
    //socket.emit("fileName", filename);
    socket.emit("FileMetaData" , {sendFileName : filename , sendFileSize : filesize });
  }
}


function sendFileAction() {
    file = fileInput.files[0];

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


    let offset = 0;

    fileReader = new FileReader();
    fileReader.onerror = FileErrorHandler;
    fileReader.addEventListener('load', e => {
      //console.log('FileRead.onload ', e);
    dataChannel.send(e.target.result);
    offset += e.target.result.byteLength;
    Progress.value += e.target.result.byteLength;


    if (offset < file.size) {
      readSlice(offset);
    }
    if(offset === file.size){
      fileNameField.textContent = "None";
    }
  });
  const readSlice = o => {
    //console.log('readSlice ', o);
    const slice = file.slice(offset, o + chunkSize);
    fileReader.readAsArrayBuffer(slice);
  };
  readSlice(0);

}

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


function onSendChannelStateChange(){
  var readyState = dataChannel.readyState;
  console.log('ready state is ' , readyState);
  if(readyState === 'open'){
    console.log("data channel opend");
    socket.emit("userNameEvent",userName);

  }
}

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

  receivedSize += event.data.byteLength;

  Progress.value += event.data.byteLength;
  if(receivedSize === fileSize){
        receivedSize = 0;
      //  var uarray = Uint8Array.from(receiveBuffer);
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
        downloadToast();



      }
}
function downloadToast(){
  var x = document.getElementById("toast");
  x.classList.add("show");
  setTimeout(function(){
    x.classList.remove("show");
  },1000);
}

function onReceiveChannelStateChange(){
  var readyState = dataChannel.readyState;
}
///////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////
