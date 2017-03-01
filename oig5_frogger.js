
var gl;

var locPosition;
var locColor;
var locOffsetX;
var locOffsetY;

var verticesLaneLines;
var verticesFrog;
var verticesStreet;
var verticesPoints = [];

var verticesCar1; var verticesCar2;
var verticesCar3; var verticesCar4;
var verticesCar5; var verticesCar6;
var verticesCar7; var verticesCar8;
var verticesCar9; var verticesCar10;
var verticesCar11;

var lane1Speed = 0.007;
var lane2Speed = 0.009;
var lane3Speed = 0.011;
var lane4Speed = 0.012;
var lane5Speed = 0.014;

var carOffsets = [];

var car1Buffer; var car2Buffer;
var car3Buffer; var car4Buffer;
var car5Buffer; var car6Buffer;
var car7Buffer; var car8Buffer;
var car9Buffer; var car10Buffer;
var car11Buffer;

var frogBuffer;
var streetBuffer;
var laneLinesBuffer;

var frogColor = vec4(0.0, 1.0, 0.0, 1.0);
var pointsColor = vec4(0.0, 0.0, 0.0, 1.0);
var colorOfDeath = vec4(0.7, 0.0, 0.0, 1.0);

var collision = false;
var freeze = false;
var goalIsUp = true;
var points = 0;

var frogsterOffset = vec2(0.0, 0.0);

var carLength;
var crashDirection = 1;

var Key;
var intervalID;
var seconds;

window.onload = function init()
{
    // Housekeeping

    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create vertices

    verticesFrog = [
      vec4(0.0, -0.7, 0, 1), frogColor,
      vec4(-0.05, -0.8, 0, 1), frogColor,
      vec4(0.05, -0.8, 0, 1), frogColor
    ];

    var streetColor = vec4(0.3, 0.3, 0.3, 1.0);
    verticesStreet = [
      vec4(1.0, -0.6, 0, 1), streetColor,
      vec4(-1.0, -0.6, 0, 1), streetColor,
      vec4(1.0, 0.6, 0, 1), streetColor,
      vec4(-1.0, 0.6, 0, 1), streetColor
    ];

    var laneLinesColor = vec4(1.0, 1.0, 1.0, 1.0);
    verticesLaneLines = [];
    for(var y = -0.36; y <= 0.36; y += 0.24) {
      for(var x = -0.98; x <= 1.0; x += 0.15) {
        verticesLaneLines.push(vec4(x, y, 0, 1));
        verticesLaneLines.push(laneLinesColor);
      }
    }

    function createCar(y) {
      var verticesCar = [];
      var x = 1.0;
      var carColor = vec4(Math.random(), Math.random(), Math.random(), 1.0);
      verticesCar.push(
        vec4(x, y, 0, 1), carColor,
        vec4(x + 0.25, y, 0, 1), carColor,
        vec4(x, y + 0.16, 0, 1), carColor,
        vec4(x, y + 0.16, 0, 1), carColor,
        vec4(x + 0.25, y, 0, 1), carColor,
        vec4(x + 0.25, y + 0.16, 0, 1), carColor
      );
      return verticesCar;
    }

    verticesCar1 = createCar(-0.56);
    verticesCar2 = createCar(-0.56 + 0.24);
    verticesCar3 = createCar(-0.56 + 0.24);
    verticesCar4 = createCar(-0.56 + (2*0.24));
    verticesCar5 = createCar(-0.56 + (2*0.24));
    verticesCar6 = createCar(-0.56 + (2*0.24));
    verticesCar7 = createCar(-0.56 + (3*0.24));
    verticesCar8 = createCar(-0.56 + (3*0.24));
    verticesCar9 = createCar(-0.56 + (4*0.24));
    verticesCar10 = createCar(-0.56 + (4*0.24));
    verticesCar11 = createCar(-0.56 + (4*0.24));

    carLength = verticesCar1.length / 2; // Fyrir drawArrays

    // Initialize buffers

    function initBuffer(src, dynamic) {
      var buffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
      if (dynamic) gl.bufferData( gl.ARRAY_BUFFER, src, gl.DYNAMIC_DRAW );
      else gl.bufferData( gl.ARRAY_BUFFER, src, gl.STATIC_DRAW );

      return buffer;
    }

    frogBuffer = initBuffer(flatten(verticesFrog), true);
    streetBuffer = initBuffer(flatten(verticesStreet), false);
    laneLinesBuffer = initBuffer(flatten(verticesLaneLines), false);
    pointsBuffer = initBuffer(20*32, false);
    car1Buffer = initBuffer(flatten(verticesCar1), false);
    car2Buffer = initBuffer(flatten(verticesCar2), false);
    car3Buffer = initBuffer(flatten(verticesCar3), false);
    car4Buffer = initBuffer(flatten(verticesCar4), false);
    car5Buffer = initBuffer(flatten(verticesCar5), false);
    car6Buffer = initBuffer(flatten(verticesCar6), false);
    car7Buffer = initBuffer(flatten(verticesCar7), false);
    car8Buffer = initBuffer(flatten(verticesCar8), false);
    car9Buffer = initBuffer(flatten(verticesCar9), false);
    car10Buffer = initBuffer(flatten(verticesCar10), false);
    car11Buffer = initBuffer(flatten(verticesCar11), false);

    // Grab references to GLSL variables

    locPosition = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( locPosition );

    locColor = gl.getAttribLocation(program, "vColor");
    gl.enableVertexAttribArray(locColor);

    locOffsetX = gl.getUniformLocation(program, "offsetX");
    locOffsetY = gl.getUniformLocation(program, "offsetY");
    gl.uniform1f(locOffsetX, 0.0);
    gl.uniform1f(locOffsetY, 0.0);

    // Extra

    carOffsets.push(-0.1); // lane 1
    carOffsets.push(-0.3); // lane 2
    carOffsets.push(-1.0); // lane 2
    carOffsets.push(-0.1); // lane 3
    carOffsets.push(-0.6); // lane 3
    carOffsets.push(-1.3); // lane 3
    carOffsets.push(-0.6); // lane 4
    carOffsets.push(-1.4); // lane 4
    carOffsets.push(-0.2); // lane 5
    carOffsets.push(-0.8); // lane 5
    carOffsets.push(-1.6); // lane 5

    Key = {
      pressed: {},

      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,

      isDown: function(keyCode) {
        return this.pressed[keyCode]
      },
      onKeyDown: function(e) {
        this.pressed[e.keyCode] = true;
      },
      onKeyUp: function(e) {
        delete this.pressed[e.keyCode];
      },

      firstKey: true
    }

    // Timer stuff

    var mins = document.querySelector('.mins');
    var secs = document.querySelector('.secs');
    seconds = 0;
    function setTime() {
      seconds++;
      mins.innerHTML = Math.floor(seconds / 60);
      secs.innerHTML = ("0" + (seconds % 60)).slice(-2);
    }

    loadHighScore();

    // Event listeners

    window.addEventListener('keyup', function(e) { Key.onKeyUp(e); });
    window.addEventListener('keydown', function(e) {
      Key.onKeyDown(e);
      if (Key.firstKey) {
        Key.firstKey = false;
        intervalID = setInterval(setTime, 1000);
      }
    });
    document.getElementById("reload").addEventListener("click", function() {
      location.reload();
    });

    render();
};

// localStorage virkar bara í Edge/IE ef síðan er á webserver
// virkar fínt í flestum öðrum browsers hvar sem er.
function saveHighScore() {
  if (localStorage) {
    var mins = document.querySelector(".mins");
    var secs = document.querySelector(".secs");
    var minsNum = parseInt(mins.textContent);
    var secsNum = parseInt(secs.textContent);
    var totalTime = minsNum*60 + secsNum;

    var currentHigh = localStorage.getItem("Frogster_high_score");
    if (currentHigh) {
      var currentHighNum = JSON.parse(currentHigh);

      if (totalTime >= currentHighNum) return;
      else document.querySelector(".high-score-label").innerHTML = "New high score!";

}

    var jsonTotalTime = JSON.stringify(totalTime);
    localStorage.setItem("Frogster_high_score", jsonTotalTime);
    loadHighScore();
  }
}

// localStorage virkar bara í Edge/IE ef síðan er á webserver
// virkar fínt í flestum öðrum browsers hvar sem er.
function loadHighScore() {
  if (localStorage) {
    var jsonHighScore = localStorage.getItem("Frogster_high_score");
    if (jsonHighScore) {
      var highScoreNum = JSON.parse(jsonHighScore);
      var minsNum = Math.floor(highScoreNum / 60);
      var secsNum = highScoreNum % 60;
      var highScoreString = minsNum + ":" + secsNum;

      document.querySelector(".high-score").innerHTML = highScoreString;
      document.querySelector(".high-score-label").innerHTML = "High score";
    }
  }
}

function checkKeys() {
  if (!freeze) {
    if (Key.isDown(Key.LEFT) && frogsterOffset[0] > -0.94)
      frogsterOffset[0] -= 0.01;
    if (Key.isDown(Key.RIGHT) && frogsterOffset[0] < 0.94)
      frogsterOffset[0] += 0.01;
    if (Key.isDown(Key.UP) && frogsterOffset[1] < 1.69) {
      frogsterOffset[1] += 0.01;
      if (goalIsUp && frogsterOffset[1] > 1.4) turnFrogster(false);
    }
    if (Key.isDown(Key.DOWN) && frogsterOffset[1] > -0.19) {
      frogsterOffset[1] -= 0.01;
      if (!goalIsUp && frogsterOffset[1] < 0.1) turnFrogster(true);
    }
  }
}


function addPoint() {
  points += 1;
  var x;
  if (points > 5) x = -0.85 + (0.04 * points); // bil eftir 5 strik
  else x = -0.90 + (0.04 * points);

  verticesPoints.push(vec4(x, 0.95, 0, 1));
  verticesPoints.push(pointsColor);
  verticesPoints.push(vec4(x, 0.85, 0, 1));
  verticesPoints.push(pointsColor);

  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(verticesPoints));

  if ( points == 10) {
    clearInterval(intervalID);
    var winner = document.getElementById("winner");
    var btn = document.getElementById("reload");
    var instr = document.getElementById("instructions");
    winner.innerHTML = "Winner!";
    btn.classList.remove("hidden");
    instr.classList.add("hidden");
    freeze = true;
    saveHighScore();
  }
}

function removePoints() {
  points = 0;
  verticesPoints = [];

  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(verticesPoints));

  clearInterval(intervalID);
  seconds = 0;
  document.querySelector(".mins").innerHTML = "0";
  document.querySelector(".secs").innerHTML = "00";
  Key.firstKey = true;
}

function turnFrogster(up) {
  goalIsUp = up;
  if (up) {
    verticesFrog[0][1] = -0.7;
    verticesFrog[2][1] = -0.8;
    verticesFrog[4][1] = -0.8;
  } else {
    verticesFrog[0][1] = -0.8;
    verticesFrog[2][1] = -0.7;
    verticesFrog[4][1] = -0.7;
  }
  gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer);
  gl.bufferSubData( gl.ARRAY_BUFFER, 0, flatten(verticesFrog));

  if (!freeze) addPoint();
}

function getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2) {
  if (frogX1 <= carX2 && frogX2 > carX2) crashDirection = 4; // right
  else if (frogX2 >= carX1 && frogX1 < carX1) crashDirection = 2; // left
  else {
    if (goalIsUp) {
      if (frogY1 >= carY1 && frogY2 < carY1) crashDirection = 1; // down
      else crashDirection = 3; // up
    } else {
      if (frogY2 <= carY2 && frogY1 > carY2) crashDirection = 3; // up
      else crashDirection = 1; //down
    }
  }
}

function isCollision() {
  var frogX1 = verticesFrog[2][0] + frogsterOffset[0];
  var frogX2 = frogX1 + 0.1;
  if (goalIsUp){
    var frogY1 = verticesFrog[0][1] + frogsterOffset[1];
    var frogY2 = verticesFrog[4][1] + frogsterOffset[1];
  } else {
    var frogY2 = verticesFrog[0][1] + frogsterOffset[1];
    var frogY1 = verticesFrog[4][1] + frogsterOffset[1];
  }

  var carX1 = verticesCar1[0][0] + carOffsets[0];
  var carX2 = carX1 + 0.25;
  var carY1 = verticesCar1[0][1];
  var carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar2[0][0] + carOffsets[1];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar2[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }


  carX1 = verticesCar3[0][0] + carOffsets[2];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar3[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar4[0][0] + carOffsets[3];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar4[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar5[0][0] + carOffsets[4];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar5[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar6[0][0] + carOffsets[5];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar6[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar7[0][0] + carOffsets[6];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar7[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar8[0][0] + carOffsets[7];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar8[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar9[0][0] + carOffsets[8];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar9[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar10[0][0] + carOffsets[9];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar10[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  carX1 = verticesCar11[0][0] + carOffsets[10];
  carX2 = carX1 + 0.25;
  carY1 = verticesCar11[0][1];
  carY2 = carY1 + 0.16;
  if ( frogX1 < carX2 && frogX2 > carX1
    && frogY1 > carY1 && frogY2 < carY2) {
      getCrashDirection(frogX1, frogX2, frogY1, frogY2, carX1, carX2, carY1, carY2);
      return true;
    }

  return false;
}

function drawCarBuffer(carBuffer, offset) {
  gl.bindBuffer( gl.ARRAY_BUFFER, carBuffer );
  gl.vertexAttribPointer( locPosition, 4, gl.FLOAT, false, 32, 0 );
  gl.vertexAttribPointer( locColor, 4, gl.FLOAT, false, 32, 16);
  gl.uniform1f(locOffsetX, offset);
  gl.drawArrays(gl.TRIANGLES, 0, carLength);
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    // Street stuff

    gl.bindBuffer( gl.ARRAY_BUFFER, streetBuffer );
    gl.vertexAttribPointer( locPosition, 4, gl.FLOAT, false, 32, 0 );
    gl.vertexAttribPointer( locColor, 4, gl.FLOAT, false, 32, 16);
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, verticesStreet.length/2);

    gl.bindBuffer( gl.ARRAY_BUFFER, laneLinesBuffer );
    gl.vertexAttribPointer( locPosition, 4, gl.FLOAT, false, 32, 0 );
    gl.vertexAttribPointer( locColor, 4, gl.FLOAT, false, 32, 16);
    gl.drawArrays( gl.LINES, 0, verticesLaneLines.length/2);

    // Cars stuff

    for (var i = 0; i < 11; i++) {
      if (carOffsets[i] < -2.4) carOffsets[i] = 0.0;
    }

    carOffsets[0] -= lane1Speed;
    carOffsets[1] -= lane2Speed;
    carOffsets[2] -= lane2Speed;
    carOffsets[3] -= lane3Speed;
    carOffsets[4] -= lane3Speed;
    carOffsets[5] -= lane3Speed;
    carOffsets[6] -= lane4Speed;
    carOffsets[7] -= lane4Speed;
    carOffsets[8] -= lane5Speed;
    carOffsets[9] -= lane5Speed;
    carOffsets[10] -= lane5Speed;

    drawCarBuffer(car1Buffer, carOffsets[0]);
    drawCarBuffer(car2Buffer, carOffsets[1]);
    drawCarBuffer(car3Buffer, carOffsets[2]);
    drawCarBuffer(car4Buffer, carOffsets[3]);
    drawCarBuffer(car5Buffer, carOffsets[4]);
    drawCarBuffer(car6Buffer, carOffsets[5]);
    drawCarBuffer(car7Buffer, carOffsets[6]);
    drawCarBuffer(car8Buffer, carOffsets[7]);
    drawCarBuffer(car9Buffer, carOffsets[8]);
    drawCarBuffer(car10Buffer, carOffsets[9]);
    drawCarBuffer(car11Buffer, carOffsets[10]);

    // Frog stuff

    checkKeys();
    gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );

    if(!collision) {
      if (isCollision()) {
        collision = true;
        verticesFrog[1] = verticesFrog[3] = verticesFrog[5] = colorOfDeath;
        gl.bufferSubData( gl.ARRAY_BUFFER, 0, flatten(verticesFrog));
      }
    } else {
      // Death logic
      switch (crashDirection) {
        case 1: // down
          frogsterOffset[0] -= 0.01;
          frogsterOffset[1] -= 0.06;
          break;
        case 2: // left
          frogsterOffset[0] -= 0.06;
          frogsterOffset[1] -= 0.01;
          break;
        case 3: // up
          frogsterOffset[0] -= 0.01;
          frogsterOffset[1] += 0.06;
          break;
        case 4: // right
          frogsterOffset[0] += 0.06;
          frogsterOffset[1] += 0.0;
      }
      if (!freeze) freeze = true;

      if (frogsterOffset[0] > 2.5 || frogsterOffset[0] < -2.5
      || frogsterOffset[1] > 2.5 || frogsterOffset[1] < -2.5) {

        verticesFrog[1] = verticesFrog[3] = verticesFrog[5] = frogColor;
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(verticesFrog));

        frogsterOffset = [0.0, 0.0];
        turnFrogster(true);
        removePoints();
        freeze = false;
        collision = false;
      }
    }

    gl.uniform1f(locOffsetX, frogsterOffset[0]);
    gl.uniform1f(locOffsetY, frogsterOffset[1]);
    gl.vertexAttribPointer( locPosition, 4, gl.FLOAT, false, 32, 0 );
    gl.vertexAttribPointer( locColor, 4, gl.FLOAT, false, 32, 16);
    gl.drawArrays( gl.TRIANGLES, 0, verticesFrog.length/2);

    gl.uniform1f(locOffsetX, 0.0);
    gl.uniform1f(locOffsetY, 0.0);


    // Points stuff
    if(verticesPoints.length) {
      gl.bindBuffer( gl.ARRAY_BUFFER, pointsBuffer);
      gl.vertexAttribPointer( locPosition, 4, gl.FLOAT, false, 32, 0);
      gl.vertexAttribPointer( locColor, 4, gl.FLOAT, false, 32, 16);
      gl.drawArrays(gl.LINES, 0, verticesPoints.length/2);
    }

    window.requestAnimFrame(render);

}
