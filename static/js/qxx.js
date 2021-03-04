let minSearchTime = 100;


function Grid(size) {
    this.size = size;
    this.startTiles = 2;
    //qxx cells是列的数组, x是横向坐标, y是纵向坐标; 
    this.cells = [];

    this.build();
    this.playerTurn = true;
}

//qxx 
Grid.prototype.getSearchTime = function () {
    // let maxValue = this.grid.getMaxValue()
    // if (maxValue == 2048) {
    //     minSearchTime = 200
    // } else if (maxValue == 2048 * 2) {
    //     minSearchTime = 200 * 2
    // } else if (maxValue == 2048 * 4) {
    //     minSearchTime = 200 * 4
    // }

    let size = this.size;
    let newCells = []
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let tile = this.cells[i][j];
            let value = 0
            if (tile == null) {
                value = 0
            } else {
                value = tile.value;
            }
            newCells.push(value)
        }
    }
    var availableCount = this.availableCells().length;
    let maxValue = this.getMaxValue()
    if (maxValue <= 1024) {
        return 100;
    }
    if (maxValue <= 2048) {
        return 300;
    }
    //256,512,1024,2048,4096,8192
    let count = newCells.filter(n => n >= 128).length
    let searchTime = 200
    if (count >= 6) {
        searchTime = 1000
    } else if (count >= 5) {
        searchTime = 800
    } else if (count >= 3) {
        searchTime = 600
    } else if (count == 2) {
        searchTime = 400
    }
    else if (count == 1) {
        searchTime = 200
    }

    return searchTime;
};


//qxx 获取最高分数
Grid.prototype.getMaxValue = function () {
    let size = this.size;
    let maxValue = 0;
    let newCells = []
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let tile = this.cells[i][j];
            if (tile == null) {
                continue
            }
            value = tile.value;
            if (value > maxValue) {
                maxValue = value
            }
        }
    }
    return maxValue;
};


//qxx 设置格子
Grid.prototype.setCells = function (cells) {
    let size = 4
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let value = cells[i][j];
            let tile = null;
            if (value > 0) {
                tile = new Tile({ x: j, y: i }, value);
            }
            this.cells[j][i] = tile;
        }
    }
};

// pre-allocate these objects (for speed)
Grid.prototype.indexes = [];
for (var x = 0; x < 4; x++) {
    Grid.prototype.indexes.push([]);
    for (var y = 0; y < 4; y++) {
        Grid.prototype.indexes[x].push({ x: x, y: y });
    }
}

// Build a grid of the specified size
Grid.prototype.build = function () {
    for (var x = 0; x < this.size; x++) {
        var row = this.cells[x] = [];

        for (var y = 0; y < this.size; y++) {
            row.push(null);
        }
    }
};


// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
    var cells = this.availableCells();

    if (cells.length) {
        return cells[Math.floor(Math.random() * cells.length)];
    }
};

Grid.prototype.availableCells = function () {
    var cells = [];
    var self = this;

    this.eachCell(function (x, y, tile) {
        if (!tile) {
            //cells.push(self.indexes[x][y]);
            cells.push({ x: x, y: y });
        }
    });

    return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            callback(x, y, this.cells[x][y]);
        }
    }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
    return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
    return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
    return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
    if (this.withinBounds(cell)) {
        return this.cells[cell.x][cell.y];
    } else {
        return null;
    }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
    this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
    this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
    return position.x >= 0 && position.x < this.size &&
        position.y >= 0 && position.y < this.size;
};

Grid.prototype.clone = function () {
    newGrid = new Grid(this.size);
    newGrid.playerTurn = this.playerTurn;
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            if (this.cells[x][y]) {
                newGrid.insertTile(this.cells[x][y].clone());
            }
        }
    }
    return newGrid;
};

// Set up the initial tiles to start the game with
Grid.prototype.addStartTiles = function () {
    // for (var i = 0; i < this.startTiles; i++) {
    //     this.addRandomTile();
    // }
    let tile = new Tile({ x: 0, y: 0 }, 2048)
    this.insertTile(tile);

};

// Adds a tile in a random position
Grid.prototype.addRandomTile = function () {
    if (this.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        //var value = Math.random() < 0.9 ? 256 : 512;
        var tile = new Tile(this.randomAvailableCell(), value);

        this.insertTile(tile);
    }
};

// Save all tile positions and remove merger info
Grid.prototype.prepareTiles = function () {
    this.eachCell(function (x, y, tile) {
        if (tile) {
            tile.mergedFrom = null;
            tile.savePosition();
        }
    });
};

// Move a tile and its representation
Grid.prototype.moveTile = function (tile, cell) {
    this.cells[tile.x][tile.y] = null;
    this.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};


Grid.prototype.vectors = {
    0: { x: 0, y: -1 }, // up
    1: { x: 1, y: 0 },  // right
    2: { x: 0, y: 1 },  // down
    3: { x: -1, y: 0 }   // left
}

// Get the vector representing the chosen direction
Grid.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    return this.vectors[direction];
};

// Move tiles on the grid in the specified direction
// returns true if move was successful
Grid.prototype.move = function (direction) {
    // 0: up, 1: right, 2:down, 3: left
    var self = this;

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;
    var score = 0;
    var won = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = self.indexes[x][y];
            tile = self.cellContent(cell);

            if (tile) {
                //if (debug) {
                //console.log('tile @', x, y);
                //}
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.insertTile(merged);
                    self.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    score += merged.value;

                    // The mighty 2048 tile
                    if (merged.value === 2048) {
                        won = true;
                    }
                } else {
                    //if (debug) {
                    //console.log(cell);
                    //console.log(tile);
                    //}
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    self.playerTurn = false;
                    //console.log('setting player turn to ', self.playerTurn);
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });

    //console.log('returning, playerturn is', self.playerTurn);
    //if (!moved) {
    //console.log('cell', cell);
    //console.log('tile', tile);
    //console.log('direction', direction);
    //console.log(this.toString());
    //}
    return { moved: moved, score: score, won: won };
};

Grid.prototype.computerMove = function () {
    this.addRandomTile();
    this.playerTurn = true;
}

// Build a list of positions to traverse in the right order
Grid.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

Grid.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.withinBounds(cell) &&
        this.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

Grid.prototype.movesAvailable = function () {
    return this.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
// returns the number of matches
Grid.prototype.tileMatchesAvailable = function () {
    var self = this;

    //var matches = 0;

    var tile;

    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            tile = this.cellContent({ x: x, y: y });

            if (tile) {
                for (var direction = 0; direction < 4; direction++) {
                    var vector = self.getVector(direction);
                    var cell = { x: x + vector.x, y: y + vector.y };

                    var other = self.cellContent(cell);

                    if (other && other.value === tile.value) {
                        return true; //matches++; // These two tiles can be merged
                    }
                }
            }
        }
    }

    //console.log(matches);
    return false; //matches;
};

Grid.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};

Grid.prototype.toString = function () {
    string = '';
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            if (this.cells[j][i]) {
                string += this.cells[j][i].value + ' ';
            } else {
                string += '_ ';
            }
        }
        string += '\n';
    }
    return string;
}

// counts the number of isolated groups. 
Grid.prototype.islands = function () {
    var self = this;
    var mark = function (x, y, value) {
        if (x >= 0 && x <= 3 && y >= 0 && y <= 3 &&
            self.cells[x][y] &&
            self.cells[x][y].value == value &&
            !self.cells[x][y].marked) {
            self.cells[x][y].marked = true;

            for (direction in [0, 1, 2, 3]) {
                var vector = self.getVector(direction);
                mark(x + vector.x, y + vector.y, value);
            }
        }
    }

    var islands = 0;

    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            if (this.cells[x][y]) {
                this.cells[x][y].marked = false
            }
        }
    }
    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            if (this.cells[x][y] &&
                !this.cells[x][y].marked) {
                islands++;
                mark(x, y, this.cells[x][y].value);
            }
        }
    }

    return islands;
}


// measures how smooth the grid is (as if the values of the pieces
// were interpreted as elevations). Sums of the pairwise difference
// between neighboring tiles (in log space, so it represents the
// number of merges that need to happen before they can merge). 
// Note that the pieces can be distant
Grid.prototype.smoothness = function () {
    var smoothness = 0;
    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            if (this.cellOccupied(this.indexes[x][y])) {
                var value = Math.log(this.cellContent(this.indexes[x][y]).value) / Math.log(2);
                for (var direction = 1; direction <= 2; direction++) {
                    var vector = this.getVector(direction);
                    var targetCell = this.findFarthestPosition(this.indexes[x][y], vector).next;

                    if (this.cellOccupied(targetCell)) {
                        var target = this.cellContent(targetCell);
                        var targetValue = Math.log(target.value) / Math.log(2);
                        smoothness -= Math.abs(value - targetValue);
                    }
                }
            }
        }
    }
    return smoothness;
}

Grid.prototype.monotonicity = function () {
    var self = this;
    var marked = [];
    var queued = [];
    var highestValue = 0;
    var highestCell = { x: 0, y: 0 };
    for (var x = 0; x < 4; x++) {
        marked.push([]);
        queued.push([]);
        for (var y = 0; y < 4; y++) {
            marked[x].push(false);
            queued[x].push(false);
            if (this.cells[x][y] &&
                this.cells[x][y].value > highestValue) {
                highestValue = this.cells[x][y].value;
                highestCell.x = x;
                highestCell.y = y;
            }
        }
    }

    increases = 0;
    cellQueue = [highestCell];
    queued[highestCell.x][highestCell.y] = true;
    markList = [highestCell];
    markAfter = 1; // only mark after all queued moves are done, as if searching in parallel

    var markAndScore = function (cell) {
        markList.push(cell);
        var value;
        if (self.cellOccupied(cell)) {
            value = Math.log(self.cellContent(cell).value) / Math.log(2);
        } else {
            value = 0;
        }
        for (direction in [0, 1, 2, 3]) {
            var vector = self.getVector(direction);
            var target = { x: cell.x + vector.x, y: cell.y + vector.y }
            if (self.withinBounds(target) && !marked[target.x][target.y]) {
                if (self.cellOccupied(target)) {
                    targetValue = Math.log(self.cellContent(target).value) / Math.log(2);
                    if (targetValue > value) {
                        //console.log(cell, value, target, targetValue);
                        increases += targetValue - value;
                    }
                }
                if (!queued[target.x][target.y]) {
                    cellQueue.push(target);
                    queued[target.x][target.y] = true;
                }
            }
        }
        if (markAfter == 0) {
            while (markList.length > 0) {
                var cel = markList.pop();
                marked[cel.x][cel.y] = true;
            }
            markAfter = cellQueue.length;
        }
    }

    while (cellQueue.length > 0) {
        markAfter--;
        markAndScore(cellQueue.shift())
    }

    return -increases;
}

// measures how monotonic the grid is. This means the values of the tiles are strictly increasing
// or decreasing in both the left/right and up/down directions
Grid.prototype.monotonicity2 = function () {
    // scores for all four directions
    var totals = [0, 0, 0, 0];

    // up/down direction
    for (var x = 0; x < 4; x++) {
        var current = 0;
        var next = current + 1;
        while (next < 4) {
            while (next < 4 && !this.cellOccupied(this.indexes[x][next])) {
                next++;
            }
            if (next >= 4) { next--; }
            var currentValue = this.cellOccupied({ x: x, y: current }) ?
                Math.log(this.cellContent(this.indexes[x][current]).value) / Math.log(2) :
                0;
            var nextValue = this.cellOccupied({ x: x, y: next }) ?
                Math.log(this.cellContent(this.indexes[x][next]).value) / Math.log(2) :
                0;
            if (currentValue > nextValue) {
                totals[0] += nextValue - currentValue;
            } else if (nextValue > currentValue) {
                totals[1] += currentValue - nextValue;
            }
            current = next;
            next++;
        }
    }

    // left/right direction
    for (var y = 0; y < 4; y++) {
        var current = 0;
        var next = current + 1;
        while (next < 4) {
            while (next < 4 && !this.cellOccupied(this.indexes[next][y])) {
                next++;
            }
            if (next >= 4) { next--; }
            var currentValue = this.cellOccupied({ x: current, y: y }) ?
                Math.log(this.cellContent(this.indexes[current][y]).value) / Math.log(2) :
                0;
            var nextValue = this.cellOccupied({ x: next, y: y }) ?
                Math.log(this.cellContent(this.indexes[next][y]).value) / Math.log(2) :
                0;
            if (currentValue > nextValue) {
                totals[2] += nextValue - currentValue;
            } else if (nextValue > currentValue) {
                totals[3] += currentValue - nextValue;
            }
            current = next;
            next++;
        }
    }

    return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3]);
}

Grid.prototype.maxValue = function () {
    var max = 0;
    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            if (this.cellOccupied(this.indexes[x][y])) {
                var value = this.cellContent(this.indexes[x][y]).value;
                if (value > max) {
                    max = value;
                }
            }
        }
    }

    return Math.log(max) / Math.log(2);
}

// WIP. trying to favor top-heavy distributions (force consolidation of higher value tiles)
/*
Grid.prototype.valueSum = function() {
  var valueCount = [];
  for (var i=0; i<11; i++) {
    valueCount.push(0);
  }

  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (this.cellOccupied(this.indexes[x][y])) {
        valueCount[Math.log(this.cellContent(this.indexes[x][y]).value) / Math.log(2)]++;
      }
    }
  }

  var sum = 0;
  for (var i=1; i<11; i++) {
    sum += valueCount[i] * Math.pow(2, i) + i;
  }

  return sum;
}
*/

// check for win
Grid.prototype.isWin = function () {
    var self = this;
    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            if (self.cellOccupied(this.indexes[x][y])) {
                if (self.cellContent(this.indexes[x][y]).value == 2048 * 2 * 2) {
                    return true;
                }
            }
        }
    }
    return false;
}

//Grid.prototype.zobristTable = {}
//for
//Grid.prototype.hash = function() {
//}

function Tile(position, value) {
    this.x = position.x;
    this.y = position.y;
    this.value = value || 2;

    this.previousPosition = null;
    this.mergedFrom = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
    this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
    this.x = position.x;
    this.y = position.y;
};

Tile.prototype.clone = function () {
    newTile = new Tile({ x: this.x, y: this.y }, this.value);
    //newTile.previousPosition = { x: this.previousPosition.x, y: this.previousPosition.y };
    //newTile.mergedFrom = { x: this.previousPosition.x, y: this.previousPosition.y };
    return newTile;
}


function AI(grid) {
    this.grid = grid;
}

// static evaluation function
AI.prototype.eval = function () {
    var emptyCells = this.grid.availableCells().length;

    var smoothWeight = 0.1,
        //monoWeight   = 0.0,
        //islandWeight = 0.0,
        mono2Weight = 1.0,
        emptyWeight = 2.7,
        maxWeight = 1.0;

    return this.grid.smoothness() * smoothWeight
        //+ this.grid.monotonicity() * monoWeight
        //- this.grid.islands() * islandWeight
        + this.grid.monotonicity2() * mono2Weight
        + Math.log(emptyCells) * emptyWeight
        + this.grid.maxValue() * maxWeight;
};

// alpha-beta depth first search
AI.prototype.search = function (depth, alpha, beta, positions, cutoffs) {
    var bestScore;
    var bestMove = -1;
    var result;

    // the maxing player
    if (this.grid.playerTurn) {
        bestScore = alpha;
        for (var direction in [0, 1, 2, 3]) {
            var newGrid = this.grid.clone();
            if (newGrid.move(direction).moved) {
                positions++;
                if (newGrid.isWin()) {
                    return { move: direction, score: 10000, positions: positions, cutoffs: cutoffs };
                }
                var newAI = new AI(newGrid);

                if (depth == 0) {
                    result = { move: direction, score: newAI.eval() };
                } else {
                    result = newAI.search(depth - 1, bestScore, beta, positions, cutoffs);
                    if (result.score > 9900) { // win
                        result.score--; // to slightly penalize higher depth from win
                    }
                    positions = result.positions;
                    cutoffs = result.cutoffs;
                }

                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = direction;
                }
                if (bestScore > beta) {
                    cutoffs++
                    return { move: bestMove, score: beta, positions: positions, cutoffs: cutoffs };
                }
            }
        }
    }

    else { // computer's turn, we'll do heavy pruning to keep the branching factor low
        bestScore = beta;

        // try a 2 and 4 in each cell and measure how annoying it is
        // with metrics from eval
        var candidates = [];
        var cells = this.grid.availableCells();
        var scores = { 2: [], 4: [] };
        for (var value in scores) {
            for (var i in cells) {
                scores[value].push(null);
                var cell = cells[i];
                var tile = new Tile(cell, parseInt(value, 10));
                this.grid.insertTile(tile);
                scores[value][i] = -this.grid.smoothness() + this.grid.islands();
                this.grid.removeTile(cell);
            }
        }

        // now just pick out the most annoying moves
        var maxScore = Math.max(Math.max.apply(null, scores[2]), Math.max.apply(null, scores[4]));
        for (var value in scores) { // 2 and 4
            for (var i = 0; i < scores[value].length; i++) {
                if (scores[value][i] == maxScore) {
                    candidates.push({ position: cells[i], value: parseInt(value, 10) });
                }
            }
        }

        // search on each candidate
        for (var i = 0; i < candidates.length; i++) {
            var position = candidates[i].position;
            var value = candidates[i].value;
            var newGrid = this.grid.clone();
            var tile = new Tile(position, value);
            newGrid.insertTile(tile);
            newGrid.playerTurn = true;
            positions++;
            newAI = new AI(newGrid);
            result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
            positions = result.positions;
            cutoffs = result.cutoffs;

            if (result.score < bestScore) {
                bestScore = result.score;
            }
            if (bestScore < alpha) {
                cutoffs++;
                return { move: null, score: alpha, positions: positions, cutoffs: cutoffs };
            }
        }
    }

    return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
}

// performs a search and returns the best move
AI.prototype.getBest = function () {
    return this.iterativeDeep();
}

// performs iterative deepening over the alpha-beta search
AI.prototype.iterativeDeep = function () {
    let searchTime = this.grid.getSearchTime()
    minSearchTime = searchTime;
    console.debug("minSearchTime", minSearchTime);
    var start = (new Date()).getTime();
    var depth = 0;
    var best;
    do {
        var newBest = this.search(depth, -10000, 10000, 0, 0);
        if (newBest.move == -1) {
            break;
        } else {
            best = newBest;
        }
        depth++;
    } while ((new Date()).getTime() - start < minSearchTime * 2);
    console.debug("iterativeDeep", depth);
    return best
}

AI.prototype.translate = function (move) {
    return {
        0: 'up',
        1: 'right',
        2: 'down',
        3: 'left'
    }[move];
}

//qxx-------------------
let grid = new Grid(4)
let ai = new AI(grid)
// grid.addStartTiles();
function getBest(cells) {

    grid.setCells(cells)
    let maxValue = grid.getMaxValue()
    console.debug("maxValue", maxValue);
    let step = ai.getBest()
    if (!step) {
        return ""
    }
    let moveName = ai.translate(step.move)
    console.debug("test", step);
    console.debug("moveName", moveName);
    result = `${moveName},${minSearchTime}`
    return result;
}
let cells = [
    [0, 0, 0, 0],
    [0, 0, 0, 2],
    [256, 0, 0, 2],
    [256, 256, 1024, 1024 * 1],
]
getBest(cells)
