/*
Clase Player
permite gestionar operaciones de comunicación en el juego
*/

class Player{
  constructor(id, name, socket){
    this.id = id;
    this.name = name;
    this.socket = socket;
  }
}

module.exports = Player;