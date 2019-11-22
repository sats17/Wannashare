var socketIO = require('socket.io');
var express = require('express');
var SocketConnection = require('./SocketConnection');
//import { SocketConnection } from './SocketConnection';

var port = process.env.PORT || 2222 || 3000;

var app = express();

app.use( express.static( __dirname + '/' ));

// app.get('/',function(req, res) {
//   res.redirect('index.html');
// });

var server = app.listen(port ,'0.0.0.0', ()=>{
  console.log('server started on port',port );
});


//////////////////////////////////////////////////////////////////////////


var io = socketIO.listen(server);

new SocketConnection(io);
