const fs = require('fs');
const http = require('http');
var socketIO = require('socket.io');
var express = require('express');
var serverRoom;

var port = process.env.PORT || 8080 || 3000;

var app = express();

app.use( express.static( __dirname + '/' ));
app.get('/',function(req, res) {
  res.redirect('index.html');
});

var server = app.listen(port , ()=>{
  console.log('server started on port ' );
});


//////////////////////////////////////////////////////////////////////////

var io = socketIO.listen(server);

io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }
  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(serverRoom).emit('message', message);
  });
/*
  socket.on('fileSize', function(data) {
    log('Client said fileSize is : ', data);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(serverRoom).emit('fileSize', data);
  });
  socket.on('fileName', function(data) {
    log('Client said filename is : ', data);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(serverRoom).emit('fileName', data);
  });*/
  socket.on('FileMetaData', function(data) {
    log('Client said filename is : ', data.sendFileName , "And file size is ",data.sendFileSize );
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(serverRoom).emit('FileMetaData', data);
  });
  socket.on('fileReceived', function(data) {
    log('Client said  : ', data);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(serverRoom).emit('fileReceived', data);
  });
  socket.on('userNameEvent', function(data) {
    log('Client said username is  : ', data);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.to(serverRoom).emit('userNameFromServer', data);
  });

  socket.on('create or join', function(room) {
    serverRoom = room;
    log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    }
     else {
      socket.emit('full', room);
      //window.parent.close();
    }
  });
  socket.on('disconnect',function(){
    console.log("room leave");
    socket.broadcast.to(serverRoom).emit('userDisconnect', 'disconnected');
  });
  socket.on('end', function (){
    //socket.disconnect(true);
    socket.leave(serverRoom);
      log('disconnect to server');
  });
  socket.on('bye', function(){
    console.log('received bye');
  });
});
