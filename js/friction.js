//Variable declaration
var ctx = new AudioContext();
ctx.sampleRate = 44100;
timeStep = 1/ctx.sampleRate;
var length = 4096;


var Friction = {
    friction:  Object.create(Interactor),
    //Keys are for identification in the original code, so don't think they are needed here
    //var key0, key1:
    force: 0.5, //Normal force in Newtons (this might have to be variable)

    //These are control variables. The variables that intervene in the calculations are derived from these
    stribeck: 0.1,
    kStatic: 0.9,
    kDynamic: 0.37,
    stiffness: 1606.6,
    dissipation: 35.92,
    viscosity: 5.5,
    noisiness: 0.84,
    breakAway: 0.725,
    contact0: 0,
    contact1: 0
}


//Setting the state properly

setNormalForce(Friction.friction, Friction.force);
setStribeckVelocity (Friction.friction, Friction.stribeck);
setStaticCoefficient (Friction.friction, Friction.kStatic);
setDynamicCoefficient (Friction.friction, Friction.kDynamic);
setBreakAway(Friction.friction, Friction.breakAway);
setStiffness(Friction.friction, Friction.stiffness);
setDissipation(Friction.friction, Friction.dissipation);
setViscosity(Friction.friction, Friction.viscosity);
setNoisiness(Friction.friction, Friction.noisiness);


//-------------------MAIN PART---------------------------------------//
var soundfx = ctx.createScriptProcessor(length, 1, 1);

//Setting the inertial resonator (this might go in a function in the future)
Friction.friction.obj0.activeModes = 1;
Friction.friction.obj0.freqs[0] = 0;
Friction.friction.obj0.decays[0] = 0;
Friction.friction.obj0.weights[0] = 0.001022;
Friction.friction.obj0.gains[0][0] = 1;
Friction.friction.obj0.fragmentSize = 1;


updateModes(Friction.friction.obj0);
updateModes(Friction.friction.obj1);
var phase = 0;
var freq = 2;
var f0 = 0;

//Slider
var slider = new Nexus.Slider('f_slider',{
    min: -3,
    max: 3,
    step: 0.01,
    mode: 'absolute'
});

slider.on('change', function(v) {
  f0 = v;
})

soundfx.onaudioprocess = function (e){
    var outs = new Array (2);
    var audioOut = e.outputBuffer.getChannelData(0);
    for (var i = 0; i < length; i++){ //Frame loop
        //f0 = 3*Math.cos(freq*2*Math.PI*timeStep*i + phase);

        interactorDSP(Friction.friction, f0, 0, 0, 0, 0, 0, outs);
        audioOut[i] = 100000*outs[1]; //For now, we are just picking one pickup point from one object
        //audioOut[i] = Math.sin(freq*2*Math.PI*timeStep*i + phase); //Test signal
    }
    phase = freq*2*Math.PI*timeStep*i + phase;

    //console.log(Friction.force/outs[0]);
    //console.log(outs[1]);

}

soundfx.connect(ctx.destination);

//Scope
var canvas = document.getElementById("canvas");
var canvasCtx = canvas.getContext("2d");

var HEIGHT = 600; var WIDTH = 400;
var analyser = ctx.createAnalyser();
soundfx.connect(analyser);
analyser.fftSize = 2048;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);

canvasCtx.clearRect(0, 0, HEIGHT, WIDTH);

/*document.getElementById('f_slider').onchange = function() {
        this.innerHTML = this.value;
        f0 = parseFloat(this.value);
        document.getElementById('f_slider_label').innerHTML = Friction.force ;
};*/


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
