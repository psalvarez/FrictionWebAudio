//Constants
const MAX_ERROR = 0.001;
const MAX_ITERATIONS = 50;
const MAX_POS = 10000.0;
const LCG_MULT = 1664525;
const LCG_ADD = 1013904223;

//Variable declaration
var ctx = new AudioContext();
ctx.sampleRate = 44100;
timeStep = 1/ctx.sampleRate;
var length = 4096;


var s = {
    fn : 0.0,
    vs : 0.1,
    ks : 0.8,
    kd : 0.2,
    kba : 0.1,
    s0 : 1000.0,
    s1 : 10.0,
    s2 : 10.0,
    s3 : 0.5,
    fs : 0.0,
    fc : 0.0,
    z : 0.0,
}

var Interactor = {
  obj0: new Resonator(),
  obj1: new Resonator(),
  contact0: 0, //Not sure of what contacts are, but they seem to be not working when != 0
  contact1: 0,
  energy: 0,
  state: s
  //double (*computeForce)(SDTInteractor *x),
};

//I think I could get rid of this object for this implementation
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

//Set normal force
function setNormalForce () {
    s.fn = Math.max(0.0, Friction.force);
    s.fs = s.fn * s.ks;
    s.fc = s.fn * s.kd;
}

setNormalForce();

s.vs = Math.max(0.0, Friction.stribeck);

//Static coefficient
s.ks = clip(Friction.kStatic, 0.0, 1.0);
s.fs = s.fn * s.ks;

//Dynamic coefficient
s.kd = clip(Friction.kDynamic, 0.0, 1.0);
s.fc = s.fn * s.kd;

//Breakaway
s.kba = clip(Friction.breakAway, 0.0, 1.0);

//Stiffness
s.s0 = Math.max(0.0, Friction.stiffness);

//Dissipation
s.s1 = Math.max(0.0, Friction.dissipation);

//Viscosity
s.s2 = Math.max(0.0, Friction.viscosity);

//Noisiness
s.s3 = Math.max(0.0, Friction.noisiness);

///////////////////////////
//-------------------FUNCTIONS--------------------------------------//
//Update
function updateModes(r) {
    for (var mode = 0; mode < r.activeModes; mode++) {
        updateMode(r, mode);
    }
}

function updateMode (x, mode) {
    var u, w, wt, m, k, d, g, r, coswt, sincwt, tsincwt;

    u = Math.sqrt(x.fragmentSize);
    w = 2*Math.PI * x.freqs[mode];
    wt = w * timeStep / u;
    m = x.weights[mode] * x.fragmentSize;
    k = w * w * x.weights[mode];
    if (wt < Math.acos(-0.9995) && m > 0.000001) {
        d = x.decays[mode] * u;
        g = d > 0.0 ? 2.0 / d : 0.0;
        r = Math.exp(-g * timeStep);
        coswt = Math.cos(wt);
        sincwt = wt > 0.0 ? Math.sin(wt) / wt : 1.0;
        tsincwt = sincwt * timeStep;
        x.b1[mode] = r * sincwt * timeStep * timeStep / m;
        x.a1[mode] = -2.0 * r * coswt;
        x.a2[mode] = r * r;
        x.b0v[mode] = coswt / tsincwt - g;
        x.b1v[mode] = -r / tsincwt;
        x.v[mode] *= Math.sqrt(x.m[mode] / m);
        x.p0[mode] *= k > 0.0 ? Math.sqrt(x.k[mode] / k) : 1.0;
        updateState(x, mode);
        x.m[mode] = m;
        x.k[mode] = k;
    }
    else {
        x.m[mode] = 0.0;
        x.k[mode] = 0.0;
        x.b1[mode] = 0.0;
        x.a1[mode] = 0.0;
        x.a2[mode] = 0.0;
        x.b0v[mode] = 0.0;
        x.b1v[mode] = 0.0;
    }
}

function updateState (x, mode) {
    x.p1[mode] = (x.v[mode] - x.b0v[mode] * x.p0[mode]) / x.b1v[mode];
}

//Interactor functions

function frictionElastoPlastic(x) {
    var s = x.state;
    var v, vRatio, vSgn, zSgn, zss, zba, alpha, dz, w, f;

    x.energy = 0.0;
    v = resonatorGetVelocity(x.obj1, x.contact1) - resonatorGetVelocity(x.obj0, x.contact0);

    //Relative velocity
    if (s.fn <= 0.0) {
      s.z = 0.0;
      return 0.0;
    }
    vRatio = v / s.vs;
    vSgn = Math.sign(v);
    zSgn = Math.sign(s.z);
    zss = vSgn * (s.fc + (s.fs - s.fc) * Math.exp(-vRatio * vRatio)) / s.s0; //Steady state friction characteristic
    zba = vSgn * s.kba * s.fc / s.s0; //Breakaway deflection

    //Start of Alpha function definition
    if (vSgn != zSgn) alpha = 0.0;
    else if (Math.abs(s.z) < Math.abs(zba)) alpha = 0.0;
    else if (Math.abs(s.z) < Math.abs(zss)) alpha = 0.5 + 0.5 * Math.sin(Math.PI * (s.z - 0.5 * (zss + zba)) / (zss - zba));
    else alpha = 1.0;
    //End of Alpha definition

    dz = v * (1.0 - alpha * s.z / zss);
    if (!isNormal(dz)) dz = 0.0;
    w = whiteNoise() * Math.sqrt(Math.abs(v) * s.fn);
    f = s.s0 * s.z + s.s1 * dz + s.s2 * v + s.s3 * w;
    s.z += dz * (1/ctx.sampleRate);
    return f;
}

function interactorComputeForce(x) {
    var f, h, w, f0, f1, count;
    /*f = friction force

    */
    f = frictionElastoPlastic(x); //In the SDT this function is a template, included in the interactor class as an atribute
    h = resonatorComputeEnergy(x.obj0, x.contact0, 0.0) + resonatorComputeEnergy(x.obj1, x.contact1, 0.0) + x.energy; //Total energy in resonators before applying the force
    w = resonatorComputeEnergy(x.obj0, x.contact0, f) + resonatorComputeEnergy(x.obj1, x.contact1, -f) - h; //Energy difference after applying the force (work?)
    count = 0;
    if (w > 0.0) {
      f0 = 0.0;
      f1 = f;
      while ((w > 0.0 || w < -MAX_ERROR * h) && count < MAX_ITERATIONS) {
        f = (f0 + f1) / 2.0;
        w = resonatorComputeEnergy(x.obj0, x.contact0, f) + resonatorComputeEnergy(x.obj1, x.contact1, -f) - h;
        if (w < 0) f0 = f;
        else f1 = f;
        count++;
      }
    }
    x.energy = -w;
    return f;
}

function interactorDSP (x, f0, v0, s0, f1, v1, s1, outs) {
    /*x: interactor
    f: external forces on resonators
    v: velocities on resonators
    s: sizes of resonators
    */
    var f, p, nPickups0, nPickups1;
    //Apply external forces
    resonatorApplyForce(x.obj0, x.contact0, f0); //inertial
    resonatorApplyForce(x.obj1, x.contact1, f1); //modal

    //Apply friction force
    f = interactorComputeForce(x);
    resonatorApplyForce(x.obj0, x.contact0, f); //inertial
    resonatorApplyForce(x.obj1, x.contact1, -f); //modal

    // Update state of inertial object
    nPickups0 = 1;
    if (x.obj0) {
      resonatorDSP(x.obj0);
      nPickups0 = x.obj0.nPickups;
      for (var pickup = 0; pickup < nPickups0; pickup++) {
        outs[pickup] = resonatorGetPosition(x.obj0, pickup);
      }
    }

    // Update state of modal object
    nPickups1 = 1;
    if (x.obj1) {
        resonatorDSP(x.obj1);
        nPickups1 = x.obj1.nPickups;
        for (var pickup = 0; pickup < nPickups1; pickup++) {
            outs[nPickups0 + pickup] = resonatorGetPosition(x.obj1, pickup);
        }
    }
    //console.log(outs[0]);
}


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
var slider = new Nexus.Slider('#f_slider',{
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
