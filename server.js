//Inicialización de elementos requeridos para el servidor
const express = require('express')    //Aplicación de express
const http = require('http')          //Protocolo HTTP
const socketio = require('socket.io') //Sockets para comunicación en dos sentidos
const cors = require('cors')

const app = express()                 //Inicialización del aplicativo
const server = http.createServer(app) //Creación del servidor HTTP
const io = socketio(server)           //Inicialización del objeto de sockets

const PORT = process.env.PORT || 3030;  //Configuración del puerto

app.use(cors())
app.use(express.static(__dirname + '/public')); //Envía el archivo que visualizará el cliente

const Game = require('./Game.js')               //Importación de clase Game
const Player = require('./Player.js')           //Importación de clase Player

//Inicialización de variables para gestión de partidas (Games)
let waitingPlayer = null    //Se inicia sin ningún jugador esperando
let gameId = 0              //El ID de juego inicia en cero
let games = {}              //Objeto para guardar y gestionar todos los juegos

//Logica de conexión
io.on('connection', (socket) => {
  //Al conectarse el jugador debe ingresar a un juego, esto se asocia al emit "join"
  socket.on('join', (name)=>{
    //Una vez el jugador ha ingresado se revisa si hay un jugador esperando
    if(waitingPlayer == null){
      //Si no hay un jugador esperando, se setea uno
      waitingPlayer = {"name":name, "socket":socket};
      //Se informa al jugador que se conectó
      socket.emit('message', 'Te has unido, esperando al jugador 2')
    }else{
      //Si ya hay un jugador esperando se inicializan los jugadores
      let player1 = new Player(`${gameId}1`,waitingPlayer.name,waitingPlayer.socket);
      let player2 = new Player(`${gameId}2`,name,socket);
      //Se vuelve a tener la condición de espera
      waitingPlayer = null;
      //Se agrega el juego a la lista de juegos
      const game = new Game(gameId+"", 10,  [player1,player2], 1)
      games[gameId] = game
      gameId++

      //Se informa a los jugadores que el juego ha iniciado
      player1.socket.emit('message','El juego ha iniciado, es tu turno!')
      player2.socket.emit('message','El juego ha iniciado, espera tu turno')

      player1.socket.emit('gameInfo',{gameId,"rivalName":player2.name.name})
      player2.socket.emit('gameInfo',{gameId,"rivalName":player1.name.name})

      //Se envían los respectivos tableros de juego a cada jugador
      player1.socket.emit('board', game.boards["p1_board"])
      player2.socket.emit('board', game.boards["p2_board"])
    }
  })
  socket.on('attack', ({gameId, row, col})=>{
    //Se recibe el id del juego y se comunica el ataque al receptor
    let rivalSocket;
    let game = games[gameId]
    let attackResult = game.recieveAttack(socket.id, {"row":row,"col":col})
    //Se envía el resultado del ataque al receptor
    socket.emit('attack_result',attackResult)
    players = game.players
    rivalSocket = socket.id === players[0].socket.id? players[1].socket : players[0].socket;
    rivalSocket.emit('attack_recieved',attackResult);
  })
})

//Ejecución del servidor
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});