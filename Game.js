const { debug } = require("console");

class Game{
  //Constructor de la clase Game
  //id: identificador de juego
  //boards: tableros de juego
  //player: información de los jugadores
  //currentTurn: sirve para determinar de quien es el turno
  //isOver: condición de finalización del juego
  constructor(id, boardSize, players, nShips){
    this.id = id;
    this.boards = {
      "p1_board" : new Board(boardSize, nShips, id),
      "p2_board" : new Board(boardSize, nShips, id)
    }
    this.players = players;
    this.currentTurn = 1;
    this.isOver = false;
  }
  recieveAttack(socketID, position){
    //Revisa que sea el turno del jugador, identifica a este mediante el socketID
    let result;
    if(this.players[this.currentTurn-1].socket.id === socketID){
      if(this.currentTurn == 1){
        result = this.boards["p2_board"].checksAttack(position);
        this.currentTurn = 2
      }else{
        result = this.boards["p1_board"].checksAttack(position);
        this.currentTurn = 1
      }
      return result;
    }else{
      return "not_your_turn"
    }
  }
}

class Board{
  /*
  Clase Board "tablero" de juego para el manejo de una matriz de casillas
  -gameId: sirve para identificar el juego al cual pertenece
  -boardSize: permite parametrizar el tamaño del tablero
  -gameZone: matriz de "Tiles" casillas que contienen alguno de los siguientes estados
    *empty: No hay un barco en esta casilla, tampoco ha sido atacada
    *ship: Existe un barco en la casilla y no ha sido atacada
    *miss: Una casilla sin barco que ha sido atacada
    *hit: Una casilla con barco que fue atacada
  -ships: Lista de barcos con información de ubicación
  -nShips: Argumento parametrizable que permite configurar n cantidad de barcos
  */ 
  constructor(boardSize, nShips, gameId){
    this.gameId = gameId;
    this.boardSize = boardSize;
    this.gameZone = new Array(boardSize);
    //Se inicializa todo el board con casillas vacias 
    for(let i = 0; i < boardSize; i++){
      this.gameZone[i] = new Array(boardSize).fill().map(() => new Tile("empty"));
    }
    this.ships = []
    this.nShips = nShips
    this.currentHits = 0
    this.hitsToWin = 0
    this.initShips()
  }
  //Metodo que revisa si el ataque enviado es un hit o un miss
  checksAttack(position){
    const tile = this.gameZone[position.row-1][position.col.charCodeAt(0)-65]
    if(tile.state === "empty"){
      tile.state = "miss";
      return {
        result:"miss",
        position:position
      }
        ;
    }else if(tile.state === "ship"){
      tile.state = "hit";
      this.currentHits ++
      if(this.currentHits != this.hitsToWin)
        return{
          result:"hit",
          position:position
        }
      else
        return{
          result:"gamefinished"
        }
    }
  }
//Metodo de inicialización de barcos en el tablero
  initShips(){
    for(let i = 0; i < this.nShips; i++){
      //Se generan "i" cantidad de barcos, el tamaño se calcula de 5 hasta 1
      //Si hay mas de 5 barcos se generan todas las siguientes de tamaño 1
      let shipSize = i <5? 5-i : 1;
      this.hitsToWin += shipSize;
      //Se genera una orientación aleatoria
      const orientation = Math.floor(Math.random() * 2) === 0 ? 'horizontal' : 'vertical';
      let row, col
      let colides = true
      let ship
      //Si un barco colisiona con otro se vuelve a generar la posición hasta que no lo haga
      while(colides){
        if (orientation === 'horizontal') {
          row = Math.floor(Math.random() * this.boardSize);
          col = Math.floor(Math.random() * (this.boardSize - shipSize + 1));
        } else {
          row = Math.floor(Math.random() * (this.boardSize - shipSize + 1));
          col = Math.floor(Math.random() * this.boardSize);
        }
        ship = new Ship(row, col, shipSize, orientation);
        //Revisión de colisión con todos los demás barcos
        colides = this.checkCollision(ship)
      }
      //Si no se cumple la condición "colides" se agrega el barco a la lista
      this.ships.push(ship)
      //Se actualiza el tablero
      for(let j = 0; j < ship.size; j++){
        if(ship.orientation == 'horizontal'){
          this.gameZone[ship.row][ship.col+j].state = "ship"
        }else{
          this.gameZone[ship.row+j][ship.col].state = "ship"
        }
      }
    }
  }
//Metodo de revisión de colisiones para la generación de los barcos en el tablero
  checkCollision(ship) {
    for (let i = 0; i < this.ships.length; i++) {
      const otherShip = this.ships[i];
      // Revisa si hay colisión horizontal
      if (ship.orientation === 'horizontal' && otherShip.orientation === 'horizontal' &&
          ship.row === otherShip.row &&
          Math.abs(ship.col - otherShip.col) < (ship.size + otherShip.size) / 2) {
        return true;
      }
      // Revisa si hay colisión vertical
      if (ship.orientation === 'vertical' && otherShip.orientation === 'vertical' &&
          ship.col === otherShip.col &&
          Math.abs(ship.row - otherShip.row) < (ship.size + otherShip.size) / 2) {
        return true;
      }
      // Revisa si hay colisión diagonal
      if (ship.orientation !== otherShip.orientation) {
        const horizontalShip = ship.orientation === 'horizontal' ? ship : otherShip;
        const verticalShip = ship.orientation === 'vertical' ? ship : otherShip;
        if (horizontalShip.row <= verticalShip.row + verticalShip.size - 1 &&
            horizontalShip.row >= verticalShip.row &&
            verticalShip.col <= horizontalShip.col + horizontalShip.size - 1 &&
            verticalShip.col >= horizontalShip.col) {
          return true;
        }
      }
    }
    return false;
  }

  //Metodo de Debug que permite visualizar el estado de un tablero en consola
  printBoard() {
    // Imprime las etiquetas de columna
    let colLabels = "   ";
    for (let i = 0; i < this.gameZone.length; i++) {
      //Usa el codigo ascci para establecer el caracter de la columna 0=A,1=B,2=C,... 
      colLabels += ` ${String.fromCharCode(65 + i)} `;
    }
    console.log(colLabels);
  
    // Imprime las filas con sus respectivas etiquetas
    for (let i = 0; i < this.gameZone.length; i++) {
      let row = `${i.toString().padStart(2, ' ')} `;
      for (let j = 0; j < this.gameZone.length; j++) {
        if (this.gameZone[i][j].state == "empty") {
          row += " O ";
        } else if (this.gameZone[i][j].state == "ship") {
          row += " X ";
        }
      }
      console.log(row);
    }
    console.log("");
  }
  
}

/*
  Clase Ship "barco" para gestionar información de los barcos en el tablero
  -row: posición vertical
  -col: posición horizontal
  -size: tamaño del barco
  -orientation: orientación puede ser vertical u horizontal
  -hits: lista de tiles que permite verificar los impactos al barco
  */
class Ship{
  constructor(row, col, size, orientation) {
    this.row = row;
    this.col = col;
    this.size = size;
    this.orientation = orientation;
    this.hits = new Array(size).fill(new Tile("ship"));
  }
}
/*
  Clase Tile "casilla"
  Simplemente almacena un estado
*/
class Tile{
  constructor(state){
    this.state = state
  }
}

module.exports = Game;