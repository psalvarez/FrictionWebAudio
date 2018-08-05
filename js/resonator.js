//*****RESONATOR*****//

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


//Updates
function updateModes(r) {
    for (var mode = 0; mode < r.activeModes; mode++) {
        updateMode(r, mode);
    }
}

function updateMode (x, mode) {
    var u, w, wt, m, k, d, g, r, coswt, sincwt, tsincwt;

    var timeStep = 1/context.sampleRate;

    u = Math.sqrt(x.fragmentSize);
    w = 2*Math.PI * x.freqs[mode];
    wt = w * (timeStep) / u;
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
