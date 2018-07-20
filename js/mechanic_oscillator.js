/* Spring stiffness, in kg / s^2 */
var k = -20;
var spring_length = 180;

/* Damping constant, in kg / s */
var b = -0.5;

/* Block position and velocity. */
var block = {x: 100, v: 0, mass: 0.5};
var wall  = {x: 30,  lx: 30, v: 0, t: 0, frequency: 0};

var frameRate  = 1/30;
var frameDelay = frameRate * 1000;

var canvas;
var ctx;
var width  = 400;
var height = 200;

//Audio Stuff
var audioCtx = new AudioContext();
audioCtx.sampleRate = 44100;
timeStep = 1/audioCtx.sampleRate;
var length = 4096;
var soundfx = audioCtx.createScriptProcessor(length, 1, 1);

soundfx.onaudioprocess = function (e){
	var audioOut = e.outputBuffer.getChannelData(0);
  for (var i = 0; i < length; i++){ //Frame loop

        //audioOut[i] = Math.sin(440*2*Math.PI*timeStep*i + phase); //Test signal
        audioOut[i] = block.x;
  }
  phase = 440*2*Math.PI*timeStep*i + phase;
}

soundfx.connect(audioCtx.destination);

var loop = function() {

    /* Move the wall. */
    wall.t += frameRate;
    wall.lx = wall.x;
    wall.x = 30 + 70 * Math.sin(2 * Math.PI * wall.frequency * wall.t);
    wall.v = (wall.x - wall.lx) / frameRate;


    /* Move the block. */

    if ( ! mouse.isDown )
    {
        var F_spring = k * ( (block.x - wall.x) - spring_length );
        var F_damper = b * ( block.v - wall.v );

        var a = ( F_spring + F_damper ) / block.mass;
        block.v += a * frameRate;
        block.x += block.v * frameRate;
    }


    /* Drawing */
    ctx.clearRect(0, 0, width, height);

    ctx.save();

    for (x = wall.x; x < block.x; x += 20)
    {
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(x, height / 2 - 10);
        ctx.lineTo(x + 10, height / 2);
        ctx.lineTo(x + 20, height / 2 - 10);
        ctx.stroke();
        ctx.closePath();

    }
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(0, height / 2 + 10);
    ctx.lineTo(block.x, height / 2 + 10);
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(0, 0, wall.x, height);

    ctx.fillStyle = 'black';
    ctx.fillRect(block.x, height - (height / 2 + 25), 50, 50);

    ctx.restore();


};

var setup = function() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.onmousemove = getMousePosition;

    canvas.onmousedown = function(e) {
        if (e.which == 1) {
            getMousePosition(e);
            mouse.isDown = true;
            block.x = mouse.x - 25;
        }
    };

    canvas.onmouseup = function(e) {
        if (e.which == 1) {
            mouse.isDown = false;
        }
    };

    document.getElementById('k_slider').onchange = function() {
        this.innerHTML = this.value;
        k = -1 * parseInt(this.value);
        document.getElementById('k_slider_label').innerHTML = k;
    };

    document.getElementById('b_slider').onchange = function() {
        this.innerHTML = this.value;
        b = -1 * parseFloat(this.value);
        document.getElementById('b_slider_label').innerHTML = b;
    };

    document.getElementById('f_slider').onchange = function() {
        this.innerHTML = this.value;
        wall.frequency = parseFloat(this.value);
        document.getElementById('f_slider_label').innerHTML = wall.frequency;
    };

    document.getElementById('m_slider').onchange = function() {
        this.innerHTML = this.value;
        block.mass = parseFloat(this.value);
        document.getElementById('m_slider_label').innerHTML = block.mass;
    };




    setInterval(loop, frameDelay);
};

var mouse = {x: 0, y: 0, isDown: false};

var getMousePosition = function(e) {
    mouse.x = e.pageX - canvas.offsetLeft;
    if (mouse.isDown)
    {
        block.x = mouse.x - 25;
    }
};


setup();
