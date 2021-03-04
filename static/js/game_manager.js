function GameManager(size, InputManager, Actuator) {
  this.size = size; // Size of the grid
  this.inputManager = new InputManager;
  this.actuator = new Actuator;

  this.running = false;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("cellClick", this.cellClick.bind(this));

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
GameManager.prototype.cellClick = function (e) {
  console.debug("onCellClick", this.grid);
  let div = e.target;
  let rowDiv = div.parentElement;
  let tableDiv = rowDiv.parentElement;
  window.div = div;
  console.debug("div", div);
  let row = 0;
  let col = 0;
  let value = 0;
  if (div.className.includes("grid-cell")) {
    row = Array.from(tableDiv.children).indexOf(rowDiv);
    col = Array.from(rowDiv.children).indexOf(div);
  } else if (div.className.includes("tile")) {
    //tile tile-2 tile-position-2-1 tile-new
    let match = div.className.match(/position-(\d)-(\d)/);
    row = parseInt(match[2]) - 1
    col = parseInt(match[1]) - 1
    value = parseInt(div.innerText);
  } else {
    return;
  }
  let tile = null
  let position = { x: col, y: row }
  console.debug("position", position);
  if (value == 0) {
    tile = new Tile(position, 2)
  } else if (value == 2) {
    tile = new Tile(position, 4)
  } else {
    tile = null
  }
  this.grid.cells[col][row] = tile;

  this.actuate()
};

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
  var best = this.ai.getBest();
  this.move(best.move);
  var timeout = animationDelay;
  if (this.running && !this.over && !this.won) {
    var self = this;
    setTimeout(function () {
      self.run();
    }, timeout);
  }
}
