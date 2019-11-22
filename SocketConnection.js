
'use strict';

module.exports  = class SocketConnection{
    constructor(io){
        io.sockets.on('connection', function(socket) {
            console.log("Socket enabled")
          //  var roomCreator;
          
            var roomCreatorSocketId;
            var currentObjSocketId;
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
              socket.to(roomCreator).emit('message', message);
            });
            socket.on('serverBaseDataShare',function(data){
              //console.log(data.Data);
              //console.log("data size is ",data.Data.byteLength);
             // console.log(currentObjSocketId)
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
              currentObjSocketId = socket.id;
              console.log(currentObjSocketId)
              console.log(roomCreator)
              log('Received request to create or join room ' + roomCreator);
              var clientsInRoom = io.sockets.adapter.rooms[roomCreator];
              var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
          
              if(numClients >= 1){
                console.log("room already created");
                socket.emit('roomCreateFull',roomCreator);
              }
              else{
                socket.join(data.email);
                socket.emit('roomCreated',roomCreator);
              }
          
              log('Client ID ' + socket.id + ' created room ' + roomCreator);
              //socket.emit('created', room, socket.id);
          
          
          });

          socket.on('join',function(data){
            console.log(data)
            currentObjSocketId = socket.id;
            console.log(currentObjSocketId)
            roomCreator = data.roomCreatorName;
            roomJoin = data.roomJoinerName;
            console.log(data.roomJoinerName+"asas")

            let clientsInRoom = io.sockets.adapter.rooms[roomCreator];
            let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

            if(numClients > 1){
              socket.emit('roomFull',roomCreator);
            }
            else if(numClients < 1){
              socket.emit('peerOffline',roomCreator);
            }
            else{
              io.sockets.in(roomCreator).emit('connectionRequest',{fromMail : roomJoin,socketid:currentObjSocketId});
            }
            });
          
          socket.on("connectionAccepted",function(data){
          
              io.sockets.in(data.roomJoinersSocketId).emit('invokeRoomJoiner');

            });
          
            socket.on('joinConfirm',function(data){
              socket.join(roomCreator);
              let clientsInRoom = io.sockets.adapter.rooms[roomCreator];
              let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
              log('Room ' + roomCreator + ' now has ' + numClients + ' client(s)');
              io.sockets.in(roomCreator).emit('roomJoined',{creator:roomCreator,joiner:roomJoin});
            });
          
            socket.on('disconnectFromUser',function(){
              console.log("room leave");
              socket.leave(roomCreator,function(){
                socket.broadcast.to(roomCreator).emit('userDisconnect', 'disconnected');
              });
          
            });
            socket.on('disconnect',function(){
          
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
          
    }
}