var createAction = (socket) => {
    //userName = prompt("Enter your name:");
    var roomCreator = prompt('Enter your unique name:');
  
    if (roomCreator !== null) {
      socket.emit('create', {email : roomCreator});
      console.log('Attempted to create or  join roomCreator', roomCreator);
      heCreateRoom = true;
      JoinRoom.disabled = true;
    }
  
}//end of start function

createAction;