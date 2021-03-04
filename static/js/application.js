animationDelay = 0;
minSearchTime = 100;  //qxx 搜寻时间影响结果


// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var manager = new GameManager(4, KeyboardInputManager, HTMLActuator);

});
