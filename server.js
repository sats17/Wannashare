const fs = require('fs');
const http = require('http');
var socketIO = require('socket.io');
var express = require('express');


var port = process.env.PORT || 8080 || 3000;

var app = express();

app.use( express.static( __dirname + '/' ));
app.get('/',function(req, res) {
  res.redirect('index.html');
});

var server = app.listen(port ,'0.0.0.0', ()=>{
  console.log('server started on port ' );
});


//////////////////////////////////////////////////////////////////////////

var io = socketIO.listen(server);

io.sockets.on('connection', function(socket) {

//  var roomCreator;

  var roomCreatorSocketId;
  var roomJoinSocketId;
  var roomCreator;
  var roomJoin;

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }
  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(roomCreator).emit('message', message);
  });
  socket.on('serverBaseDataShare',function(data){
    //console.log(data.Data);
    //console.log("data size is ",data.Data.byteLength);
    socket.to(roomCreator).emit('serverBaseDataReceive',{ArrayData:data.Data});
  });

socket.on('FileMetaData', function(data) {
    log('Client said filename is : ', data.sendFileName , "And file size is ",data.sendFileSize );
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(roomCreator).emit('FileMetaData', data);
  });
socket.on('fileReceived', function(data) {
    log('Client said  : ', data);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(roomCreator).emit('fileReceived', data);
  });

/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

socket.on('create', function(data) {
    roomCreator = data.email;
    log('Received request to create or join room ' + roomCreator);

    socket.join(data.email);
    log('Client ID ' + socket.id + ' created room ' + roomCreator);
    //socket.emit('created', room, socket.id);


});
socket.on('isHeWantToConnect',function(data){

  io.sockets.in(roomCreator).emit('isYouWantToConnect',{fromMail : roomJoin});
});
socket.on('join',function(data){


  roomJoinSocketId = socket.id;
  roomCreator = data.toMail;
  roomJoin = data.fromMail;
  var clientsInRoom = io.sockets.adapter.rooms[roomCreator];
  var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
  if(numClients > 1){
    socket.emit('roomFull',roomCreator);
  }
  else if(numClients < 1){
    socket.emit('peerOffline',roomCreator);
  }
  else{
  io.sockets.in(roomCreator).emit('isYouWantToConnect',{fromMail : roomJoin,socketid:roomJoinSocketId});
  }

  });

socket.on("acceptConnection",function(data){

    io.sockets.in(data.takeyourid).emit('helpToCallSecondPeer','hello');
  });

  socket.on('joinConfirm',function(data){
    socket.join(roomCreator);
    var clientsInRoom = io.sockets.adapter.rooms[roomCreator];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + roomCreator + ' now has ' + numClients + ' client(s)');
    io.sockets.in(roomCreator).emit('joinConfirmed',{creator:roomCreator,joiner:roomJoin});
  });

  socket.on('disconnect',function(){
    console.log("room leave");
    socket.broadcast.to(roomCreator).emit('userDisconnect', 'disconnected');
  });
  socket.on('end', function (){

    socket.leave(roomCreator);
      log('disconnect to server');
  });
  socket.on('bye', function(){
    console.log('received bye');
  });
});
