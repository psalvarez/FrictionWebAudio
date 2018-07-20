/* Spring stiffness, in kg / s^2 */
var k = 10000;//-20;
var spring_length = 180;

/* Damping constant, in kg / s */
var b = -0.5;

/* Block position and velocity. */
var block = {x: 100, v: 0, mass: 0.001/*0.5*/};
var wall  = {x: 30,  lx: 30, v: 0, t: 0, frequency: 0};

/*Audio settings*/
var ctx = new AudioContext();
ctx.sampleRate  = 44100;
var timeStep = 1/ctx.sampleRate;
//var frameDelay = frameRate * 1000;
length = 4096;
var soundfx = ctx.createScriptProcessor(length, 1, 1);

var canvas = document.getElementById("canvas");
var canvasCtx = canvas.getContext("2d");
var width  = 400;
var height = 200;


soundfx.onaudioprocess = function(e) {
    /* Move the block. */
    var audioOut = e.outputBuffer.getChannelData(0);

    for (var i = 0; i < length; i++){
        var F_spring = k * ( (block.x - wall.x) - spring_length );
        var F_damper = b * ( block.v - wall.v );
        var a = ( F_spring + F_damper ) / block.mass;
        block.v += a * timeStep;
        block.x += block.v * timeStep;
        audioOut[i] = block.x;
    }
};

soundfx.connect(ctx.destination);

//Scope
var HEIGHT = 600; var WIDTH = 400;
var analyser = ctx.createAnalyser();
soundfx.connect(analyser);
analyser.fftSize = length;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);

canvasCtx.clearRect(0, 0, HEIGHT, WIDTH);

function draw() {
    drawVisual = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, HEIGHT, WIDTH);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    canvasCtx.beginPath();
    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }
    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
};
draw();
