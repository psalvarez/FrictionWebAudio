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
var seed = 42; //For whiteNoise Osc

//var x = ctx.createBuffer(1, length, ctx.sampleRate);


var gain = new Array(1); //nPickups

for (var i = 0; i < 1; i++) {
    gain[i] = new Array(3+1); //nModes+1
    gain[i][3] = 0;
    for (var j = 0; j < 3; j++) {
        gain[i][j] = 0.8; //Have to find out where this values come from in the original patch
        gain[i][3] += gain[i][j];
    }
}

function Resonator () {

    this.fragmentSize= 1.0; //Size of the resonator

    //Arrays holding the frequencies, decay times (damper) and weights (mass) for each mode, and the gain for each mode at each pickup point
    this.freqs= [500, 600, 910];
    this.decays= [0.007, 0.01, 0.007];
    this.weights= [1, 1, 1];
    this.gains= gain;

    this.m= [0, 0, 0]; //Masses of each oscillator
    this.k= [0, 0, 0]; //Elastic constant of springs of each oscillator

    //Coefficients to calculate position of each oscillator
    this.b1= [0, 0, 0];
    this.a1= [0, 0, 0];
    this.a2= [0, 0, 0];

    //Coefficients to calculate velocity of each oscillator
    this.b0v= [0, 0, 0];
    this.b1v= [0, 0, 0];

    //Positions of oscillators (previous and target?)
    this.p0= [0, 0, 0];
    this.p1= [0, 0, 0];

    this.v= [0, 0, 0];//Modal velocities of oscillators
    this.f= [0, 0, 0]; //Forces (not sure if input or output) of each oscillator

    this.nModes= 3; //Number of resonant modes
    this.nPickups= 1; //Number of pickup points
    this.activeModes= 3;//Number of active points
}

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


//Resonator functions
function modalPosition(r, mode) {
    return clip(r.b1[mode] * r.f[mode] - r.a1[mode] * r.p0[mode] - r.a2[mode] * r.p1[mode], -MAX_POS, MAX_POS);
}

function modalVelocity(r, mode, p){
    return r.b0v[mode] * p + r.b1v[mode] * r.p0[mode];
}

function modalEnergy(r, mode, p, v) {
    return 0.5 * (r.k[mode] * p * p + r.m[mode] * v * v);
}

function distributeForce(x, pickup, fs, f) {

    for (var mode = 0; mode < x.activeModes; mode++) {
        if(x.gains[pickup][x.nModes] > 0.0 ){
            fs[mode] = f * x.gains[pickup][mode] / x.gains[pickup][x.nModes];
        } else {
            fs[mode] = f / x.activeModes;
        }
    }
}

function resonatorApplyForce(reson, pickup, f) {
    var fs = new Array(reson.activeModes); //not sure of what this is

    if (pickup < reson.nPickups) {
        if (!isNormal(f)) f = 0.0; //Don't know if isNormal exists in javascript
        distributeForce(reson, pickup, fs, f); //fills fs values
        for (var mode = 0; mode < reson.activeModes; mode++) {
            reson.f[mode] += fs[mode];
        }
    }
}

function resonatorDSP (r) { //Updates internal state of resonator
    var p;

    for (var mode = 0; mode < r.activeModes; mode++) {
        p = modalPosition(r, mode, r.f[mode]);
        r.v[mode] = modalVelocity(r, mode, p);
        r.p1[mode] = r.p0[mode];
        r.p0[mode] = p;
        r.f[mode] = 0.0;
    }
}

function resonatorComputeEnergy(r, pickup, f) {
    var out, p, v;
    var fs = new Array(r.activeModes);

    out = 0.0;
    if (pickup < r.nPickups) {
        if (!isNormal(f)) f = 0.0;
        distributeForce(r, pickup, fs, f);
        for (var mode = 0; mode < r.activeModes; mode++) {
            p = modalPosition(r, mode, r.f[mode] + fs[mode]);
            v = modalVelocity(r, mode, p);
            out += modalEnergy(r, mode, p, v) * r.gains[pickup][mode];
        }
    }
    return out;
}

//Setters
function resonatorSetPosition(x, pickup, f) {
    //f is the modal displacement
    if (pickup < x.nPickups && x.gains[pickup][x.nModes] > 0.0) {
        for (var mode = 0; mode < x.activeModes; mode++) {
            x.p0[mode] = f / x.gains[pickup][x.nModes];
            updateState(x, mode);
        }
    }
}

function resonatorSetVelocity(x, pickup, f) {
    //f is the modal velocity
    if (pickup < x.nPickups && x.gains[pickup][x.nModes] > 0.0) {
        for (var mode = 0; mode < x.activeModes; mode++) {
            x.v[mode] = f / x.gains[pickup][x.nModes];
            updateState(x, mode);
        }
    }
}

//Getters
function resonatorGetPosition(x, pickup) {

    var out = 0.0;
    if (pickup < x.nPickups) {
        for (var mode = 0; mode < x.activeModes; mode++) {
            out += x.p0[mode] * x.gains[pickup][mode];
        }
    }
    return out;
}

function resonatorGetVelocity(x, pickup) {
    var out;

    out = 0.0;
    if (pickup < x.nPickups) {
      for (var mode = 0; mode < x.activeModes; mode++) {
        out += x.v[mode] * x.gains[pickup][mode];
      }
    }
    return out;

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


//Other
function clip(x, min, max) {
  if (x < min) x = min;
  else if (x > max) x = max;
  return x;
}

function isNormal(a) {
    var normal = true;
    if(Number.isNaN(a) || (!Number.isFinite(a)) || (a === 0)) {
        normal = false;
    }
    return normal;
}

function whiteNoise() {
    return Math.random() * 2 - 1;
    /*seed = seed * LCG_MULT + LCG_ADD;
    return seed / 2147483647 - 1.0;*/
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
