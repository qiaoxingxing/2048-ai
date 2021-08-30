animationDelay = 200; //等待毫秒数
minSearchTime = 100;  


// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var manager = new GameManager(4, KeyboardInputManager, HTMLActuator);

});
