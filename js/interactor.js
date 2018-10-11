//*****INTERACTOR*****//

import{Resonator} from "./resonator.js";
import{
    MAX_ERROR,
    MAX_ITERATIONS,
    MAX_POS,
    LCG_MULT,
    LCG_ADD,
    clip,
    isNormal,
    whiteNoise
} from "./utilities.js";
//Friction state variable
var st = { //might have to change this declarationwhen I add new models
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
//s = sigmas
//s0 = stiffness
//s1 = damping
//s2 = viscosity
//s3 = noisiness
//vs = Stribeck velocity
//fc = Coulomb force
//fs = Stiction force (static friction)
//fn = normal force
//ks = kStatic (static friction coeff)
//kd = kDynamic (dynamic friction coeff)
//kba = kBreakaway
//z = average bristle displacement (?)

//var Interactor = {
function Interactor () {
    this.obj0 = new Resonator();
    this.obj1 = new Resonator();
    this.contact0 = 0; //Not sure of what contacts are, but they seem to be not working when != 0
    this.contact1 = 0;
    this.energy = 0;
    this.state = st;//Look for another way to declare this as an empty object
    //double (*computeForce)(SDTInteractor *x)
};

//----Friction Interactor functions----//
Interactor.prototype.frictionElastoPlastic = function (x) {
    var s = x.state;
    var v, vRatio, vSgn, zSgn, zss, zba, alpha, dz, w, f;

    x.energy = 0.0;
    v = x.obj1.resonatorGetVelocity(x.obj1, x.contact1) - x.obj0.resonatorGetVelocity(x.obj0, x.contact0);

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
    s.z += dz * (1/AudioWorkletGlobalScope.sampleRate);
    return f;
}
Interactor.prototype.interactorComputeForce = function (x) {
    var f, h, w, f0, f1, count;
    /*f = friction force

    */
    f = this.frictionElastoPlastic(x); //In the SDT this function is a template, included in the interactor class as an atribute
    h = x.obj0.resonatorComputeEnergy(x.obj0, x.contact0, 0.0) + x.obj1.resonatorComputeEnergy(x.obj1, x.contact1, 0.0) + x.energy; //Total energy in resonators before applying the force
    w = x.obj0.resonatorComputeEnergy(x.obj0, x.contact0, f) + x.obj1.resonatorComputeEnergy(x.obj1, x.contact1, -f) - h; //Energy difference after applying the force (work?)
    count = 0;
    if (w > 0.0) {
      f0 = 0.0;
      f1 = f;
      while ((w > 0.0 || w < -MAX_ERROR * h) && count < MAX_ITERATIONS) {
        f = (f0 + f1) / 2.0;
        w = x.obj0.resonatorComputeEnergy(x.obj0, x.contact0, f) + x.obj1.resonatorComputeEnergy(x.obj1, x.contact1, -f) - h;
        if (w < 0) f0 = f;
        else f1 = f;
        count++;
      }
    }
    x.energy = -w;
    return f;
}
Interactor.prototype.interactorDSP = function (x, f0, v0, s0, f1, v1, s1, outs) {
    /*x: interactor
    f: external forces on resonators
    v: velocities on resonators
    s: sizes of resonators
    */
    var f, p, nPickups0, nPickups1;
    //Apply external forces
    x.obj0.resonatorApplyForce(x.obj0, x.contact0, f0); //inertial
    x.obj1.resonatorApplyForce(x.obj1, x.contact1, f1); //modal

    //Apply friction force
    f = this.interactorComputeForce(x);
    x.obj0.resonatorApplyForce(x.obj0, x.contact0, f); //inertial
    x.obj1.resonatorApplyForce(x.obj1, x.contact1, -f); //modal

    // Update state of inertial object
    nPickups0 = 1;
    if (x.obj0) {
      x.obj0.resonatorDSP(x.obj0);
      nPickups0 = x.obj0.nPickups;
      for (var pickup = 0; pickup < nPickups0; pickup++) {
        outs[pickup] = x.obj0.resonatorDSP(x.obj0, pickup);
      }
    }

    // Update state of modal object
    nPickups1 = 1;
    if (x.obj1) {
        x.obj1.resonatorDSP(x.obj1);
        nPickups1 = x.obj1.nPickups;
        for (var pickup = 0; pickup < nPickups1; pickup++) {
            outs[nPickups0 + pickup] = x.obj1.resonatorDSP(x.obj1, pickup);
        }
    };
    //console.log(outs[0]);
};

//----Friction variable setting----//
Interactor.prototype.setNormalForce = function (inter, f) {
    var s = inter.state;
    s.fn = Math.max(0.0, f /*Friction.force*/);
    s.fs = s.fn * s.ks;
    s.fc = s.fn * s.kd;
};
//Set stribeck
Interactor.prototype.setStribeckVelocity = function (inter, f) {
    var s = inter.state;
    s.vs = Math.max(0.0, f /*Friction.stribeck*/);
};
//Static coefficient
Interactor.prototype.setStaticCoefficient = function (inter, f) {
    var s = inter.state;
    s.ks = clip(f, 0.0, 1.0);
    s.fs = s.fn * s.ks;
};
//Dynamic coefficient
Interactor.prototype.setDynamicCoefficient = function (inter, f) {
    var s = inter.state;
    s.kd = clip(f /*Friction.kDynamic*/, 0.0, 1.0);
    s.fc = s.fn * s.kd;
};
//Breakaway
Interactor.prototype.setBreakAway = function (inter, f) {
    var s = inter.state;
    s.kba = clip(f, 0.0, 1.0);
};
//Stiffness
Interactor.prototype.setStiffness = function (inter, f) {
    var s = inter.state;
    s.s0 = Math.max(0.0, f);
};
//Dissipation
Interactor.prototype.setDissipation = function (inter, f) {
    var s = inter.state;
    s.s1 = Math.max(0.0, f);
};
//Viscosity
Interactor.prototype.setViscosity = function (inter, f) {
    var s = inter.state;
    s.s2 = Math.max(0.0, f);
};
//Noisiness
Interactor.prototype.setNoisiness = function (inter, f) {
    var s = inter.state;
    s.s3 = Math.max(0.0, f);
};



export {Interactor};
