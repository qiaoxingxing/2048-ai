function GameManager(size, InputManager, Actuator) {
  this.size = size; // Size of the grid
  this.inputManager = new InputManager;
  this.actuator = new Actuator;

  this.running = false;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));

  this.inputManager.on('think', function () {
    var best = this.ai.getBest();
    this.actuator.showHint(best.move);
    this.move(best.move);
  }.bind(this));


  this.inputManager.on('run', function () {
    if (this.running) {
      this.running = false;
      this.actuator.setRunButton('Auto-run');
    } else {
      this.running = true;
      this.run()
      this.actuator.setRunButton('Stop');
    }
  }.bind(this));

  this.setup();
}


// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.restart();
  this.running = false;
  this.actuator.setRunButton('Auto-run');
  this.setup();
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid = new Grid(this.size);
  this.grid.addStartTiles();
  window.grid = this.grid;
  this.ai = new AI(this.grid);

  this.score = 0;
  this.over = false;
  this.won = false;

  // Update the actuator
  this.actuate();
};


// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  this.actuator.actuate(this.grid, {
    score: this.score,
    over: this.over,
    won: this.won
  });
};

// makes a given move and updates state
GameManager.prototype.move = function (direction) {
  var result = this.grid.move(direction);
  this.score += result.score;

  if (!result.won) {
    if (result.moved) {
      this.grid.computerMove();
    }
  } else {
    this.won = true;
  }

  //console.log(this.grid.valueSum());

  if (!this.grid.movesAvailable()) {
    this.over = true; // Game over!
  }

  this.actuate();
}

// moves continuously until game is over
GameManager.prototype.run = function () {
  // var best = this.ai.getBest();
  // this.move(best.move);
  this.getBest().then(bestMove => {
    this.move(bestMove)
    var timeout = animationDelay;
    if (this.running && !this.over && !this.won) {
      var self = this;
      setTimeout(function () {
        self.run();
      }, timeout);
    }
  })
}

GameManager.prototype.getBest = function () {
  console.debug("test", "getBest");
  let array = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]
  for (let i = 0; i < this.size; i++) {
    for (let j = 0; j < this.size; j++) {
      let tile = this.grid.cells[j][i]
      if (tile != null) {
        array[i][j] = tile.value;
      }
    }
  }
  return  axios.post("/best", array).then(res => {
    let move = res.data
    let dict = {
      'up': 0,
      'right': 1,
      'down': 2,
      'left': 3
    }
    return dict[move];
  })
}

