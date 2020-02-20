
'use strict';

module.exports  = class SocketConnection{
    constructor(io){
        io.sockets.on('connection', function(socket) {
            console.log("Socket enabled")
          //  var roomCreator;
          
            var roomCreatorSocketId;
            var roomJoinerSocketId;
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
              roomCreatorSocketId = socket.id;
              console.log("DEBUG--- Room Creator Socket ID "+roomCreatorSocketId)
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
          
          });

          socket.on('join',function(data){

            roomJoinerSocketId = socket.id;
            console.log("DEBUG--- Room Joiner Socket ID "+roomJoinerSocketId)
            roomCreator = data.roomCreator;
            roomJoin = data.newRoomJoiner;
            console.log(data.newRoomJoiner+"  asas")

            let clientsInRoom = io.sockets.adapter.rooms[roomCreator];
            let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

            if(numClients > 1){
              socket.emit('roomFull',roomCreator);
            }
            else if(numClients < 1){
              socket.emit('peerOffline',roomCreator);
            }
            else{
              console.log("Sending request")
              io.sockets.in(roomCreator).emit('connectionRequest',{fromMail : roomJoin,socketid:roomJoinerSocketId});
            }
            });
          
          socket.on("connectionAccepted",function(data){
              roomJoinerSocketId = data.roomJoinerSocketId
              io.sockets.in(data.roomJoinerSocketId).emit('invokeRoomJoiner');

            });
          
            socket.on('joinConfirm',function(data){
              socket.join(roomCreator);
              let clientsInRoom = io.sockets.adapter.rooms[roomCreator];
              let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
              log('Room ' + roomCreator + ' now has ' + numClients + ' client(s)');
              io.sockets.in(roomCreator).emit('roomJoined',{creator:roomCreator,joiner:roomJoin});
            });
          
            socket.on('disconnectFromUser',function(data){
              console.log(socket.id)
              console.log("room leave from "+data.disconnectedUser);
              let clientsInRoom = io.sockets.adapter.rooms[roomCreator];
              console.log("Clients In room "+Object.keys(clientsInRoom.sockets))
              if(data.disconnectedUser === roomCreator){
                console.log("Room Creator socketId "+roomCreatorSocketId)
                console.log("Room Joiner socketId "+roomJoinerSocketId)
                io.of('/').connected[roomJoinerSocketId].leave(roomCreator,function(){
                  let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
                  console.log("DEBUG - After disconnect number of clients in room -> "+numClients)
                  socket.broadcast.to(roomCreator).emit('userDisconnect', 'disconnected');
                  console.log("Clients In room "+Object.keys(clientsInRoom.sockets))
                });
              }
              else{
              socket.leave(roomCreator,function(){
                let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
                console.log("DEBUG - After disconnect number of clients in room -> "+numClients)
                socket.broadcast.to(roomCreator).emit('userDisconnect', 'disconnected');
                console.log("Clients In room "+Object.keys(clientsInRoom.sockets))
              });
            }
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