//*****FRICTION*****//

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

var Interactor = {
    obj0: new Resonator(),
    obj1: new Resonator(),
    contact0: 0, //Not sure of what contacts are, but they seem to be not working when != 0
    contact1: 0,
    energy: 0,
    state: st //Look for another way to declare this as an empty object
    //double (*computeForce)(SDTInteractor *x),
};

//----Friction variable setting----//
function setNormalForce (inter, f) {
    var s = inter.state;
    s.fn = Math.max(0.0, f /*Friction.force*/);
    s.fs = s.fn * s.ks;
    s.fc = s.fn * s.kd;
}
//Set stribeck
function setStribeckVelocity (inter, f) {
    var s = inter.state;
    s.vs = Math.max(0.0, f /*Friction.stribeck*/);
}
//Static coefficient
function setStaticCoefficient (inter, f) {
    var s = inter.state;
    s.ks = clip(Friction.kStatic, 0.0, 1.0);
    s.fs = s.fn * s.ks;
}
//Dynamic coefficient
function setDynamicCoefficient (inter, f) {
    var s = inter.state;
    s.kd = clip(f /*Friction.kDynamic*/, 0.0, 1.0);
    s.fc = s.fn * s.kd;
}
//Breakaway
function setBreakAway (inter, f) {
    var s = inter.state;
    s.kba = clip(f, 0.0, 1.0);
}
//Stiffness
function setStiffness (inter, f) {
    var s = inter.state;
    s.s0 = Math.max(0.0, f);
}
//Dissipation
function setDissipation (inter, f) {
    var s = inter.state;
    s.s1 = Math.max(0.0, f);
}
//Viscosity
function setViscosity (inter, f) {
    var s = inter.state;
    s.s2 = Math.max(0.0, f);
}
//Noisiness
function setNoisiness (inter, f) {
    var s = inter.state;
    s.s3 = Math.max(0.0, f);
}


//----Friction Interactor functions----//
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
