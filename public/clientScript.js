const socket = io.connect("http://192.168.137.13:3030")

socket.on('message', function(message){
  document.getElementById("status").innerText = message;
})
socket.on('gameInfo', function(message){
  document.getElementById("gameInfo").innerText = `Te encuentras en el juego ${message.gameId}, jugando contra ${message.rivalName}`
})
socket.on('board',function(message){
  displayBoards(message)
})

socket.on('attack_recieved', (message)=>{
  if(message.result === "miss"){
    tile = document.getElementById(`M-${message.position.col},${message.position.row}`)
    document.getElementById("status").innerText = "Ataque recibido, es tu turno!"
    tile.classList.remove("tile")
    tile.classList.add("miss")
  }else if(message.result === "hit"){
    tile = document.getElementById(`M-${message.position.col},${message.position.row}`)
    document.getElementById("status").innerText = "Ataque recibido, es tu turno!"
    tile.classList.remove("ship")
    tile.classList.add("miss")
    tile.innerText = "X"
  }else if(message.result === "gamefinished"){
    document.getElementById("status").innerText = "Has perdido el juego!"
    document.getElementById("myBoard").remove()
    document.getElementById("foeBoard").remove()
  }
})

socket.on('attack_result', function(message){
  switch(message.result){
    case "hit":
      changeTileState(message.position.col, message.position.row, "hit");
      document.getElementById("status").innerText = "Has enviado tu ataque, espera tu turno"
    break
    case "miss":
      changeTileState(message.position.col, message.position.row, "miss");
      document.getElementById("status").innerText = "Has enviado tu ataque, espera tu turno"
    break
    case "not_your_turn":
      document.getElementById("status").innerText = "No es tu turno"
    break
    case "gamefinished":
      document.getElementById("status").innerText = "Felicidades, has ganado el juego"
      document.getElementById("myBoard").remove();
      document.getElementById("foeBoard").remove();      
  }
})

function changeTileState(col, row, newState){
  let tile = document.getElementById(`${col},${row}`)
  tile.onclick = () => {document.getElementById("status").innerText = "Movimiento no valido"}
  tile.classList.remove('tile')
  tile.classList.add(newState)
}

function displayBoards(board){
  let myBoard = document.getElementById('myBoard');
  let foeBoard = document.getElementById('foeBoard')
  for (let i = 0; i < board.boardSize+1; i++) {
    // Create a new row element and index element for each row
    const myRow = document.createElement('div');
    const foeRow = document.createElement('div');

    const index = document.createElement('h1');
    const index1 = document.createElement('h1');
    myRow.classList.add('row');
    foeRow.classList.add('row')
    // If current row is not the first row
    if (i > 0) {
      // Set the index element to the row number
      index.innerHTML = i.toString();
      index1.innerHTML = i.toString();
      foeRow.appendChild(index);
      myRow.appendChild(index1);
      // Iterate over columns of the row
      for (let j = 0; j < board.boardSize; j++) {
        // Create a new tile element for each column
        const myTile = document.createElement('div');
        const foeTile = document.createElement('div')
        foeTile.id = `${String.fromCharCode(j+65)},${i}`
        myTile.id = `M-${String.fromCharCode(j+65)},${i}`

        if(board.gameZone[i-1][j].state == "empty")
          myTile.classList.add('tile');
        else if(board.gameZone[i-1][j].state == "ship")
          myTile.classList.add('shipTile')
        foeTile.classList.add('tile')
        // Add onclick event listener to the tile
        foeTile.onclick = () => {
          let pos = foeTile.id.split(',')
          let col = pos[0]
          let row = pos[1]
          socket.emit('attack',{
            gameId:board.gameId,
            row:row,
            col:col
          })
          console.log(`Tile ${foeTile.id} pressed`)
        };
        foeRow.appendChild(foeTile);
        myRow.appendChild(myTile);
      }
    } else {
      // If current row is the first row, create column index labels
      myRow.appendChild(document.createElement('h1'));
      foeRow.appendChild(document.createElement('h1'));
      
      for (let j = 0; j < board.boardSize; j++) {
        const columnIndex = document.createElement('h1');
        const columnIndex1 = document.createElement('h1');

        columnIndex.innerHTML = String.fromCharCode(65+j);
        columnIndex1.innerHTML = String.fromCharCode(65+j);
        myRow.appendChild(columnIndex);
        foeRow.appendChild(columnIndex1)
      }
    }
    // Append the completed row to the game board
    myBoard.appendChild(myRow);
    foeBoard.appendChild(foeRow)
  }
}
function joinGame(){
  let name = document.getElementById("nameInput").value;
  if(name.length > 0){
    document.getElementById("joinButton").remove()
    document.getElementById("nameInput").remove()
    socket.emit('join',{name})
  }
}
