var frictionPlugin = function (factory, owner) {
    BasePlugin.call(this, factory, owner);

    this.onload = function(e) {}

    //####### VARIABLES ########//

    //Input and output for connecting audio chain
    let input = this.context.createGain();
    let output = this.context.createGain();

    let length = 4096;

    this.frictionNode = this.context.createScriptProcessor(length, 1, 1);

    //Control Variables
    let Friction = {
        friction:  Object.create(Interactor),

        force: 0.5, //Normal force in Newtons

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

    Friction.friction.obj0.activeModes = 1;
    Friction.friction.obj0.freqs[0] = 0;
    Friction.friction.obj0.decays[0] = 0;
    Friction.friction.obj0.weights[0] = 0.001022;
    Friction.friction.obj0.gains[0][0] = 1;
    Friction.friction.obj0.fragmentSize = 1;
    updatePickup(Friction.friction.obj0, 0);

    //This will set the rest of the values automatically, but should be removed when added as controls

    setNormalForce(Friction.friction, Friction.force);
    setStribeckVelocity (Friction.friction, Friction.stribeck);
    setStaticCoefficient (Friction.friction, Friction.kStatic);
    setDynamicCoefficient (Friction.friction, Friction.kDynamic);
    setBreakAway(Friction.friction, Friction.breakAway);
    setStiffness(Friction.friction, Friction.stiffness);
    setDissipation(Friction.friction, Friction.dissipation);
    setViscosity(Friction.friction, Friction.viscosity);
    setNoisiness(Friction.friction, Friction.noisiness);

    updateModes(Friction.friction.obj0);
    updateModes(Friction.friction.obj1);
    //let externalForce = 1;


    //####### PARAMETERS ########//

    let extForceParam = this.parameters.createNumberParameter("externalForce", 1, -3, 3);


    //Friction Parameters
    let normForceParam = this.parameters.createNumberParameter("normalForce", 0.5, 0, 1);
    let stribeckParam = this.parameters.createNumberParameter("stribeck", 0.103036, 0.096, 1);
    let staticParam = this.parameters.createNumberParameter("static", 0.922222, 0.4, 1);
    let dynamicParam = this.parameters.createNumberParameter("dynamic", 0.3775, 0.01, 0.5);
    let breakAwayParam = this.parameters.createNumberParameter("breakAway", 0.725, 0.1, 1);
    let stiffnessParam = this.parameters.createNumberParameter("stiffness", 1606.618164, 500, 5000);
    let dissipationParam = this.parameters.createNumberParameter("dissipation", 35.925926, 0, 40);
    let viscosityParam = this.parameters.createNumberParameter("viscosity", 5.55555, 0, 10);
    let noisinessParam  = this.parameters.createNumberParameter("noisiness", 0.844167, 0.01, 1);

    //Control functions
    extForceParam.trigger = function () {
        let a = 2;
    }.bind(this);

    normForceParam.trigger = function () {
        setNormalForce(Friction.friction, normForceParam.value);
    }.bind(normForceParam);
    stribeckParam.trigger = function () {
        setStribeckVelocity(Friction.friction, stribeckParam.value);
    }.bind(this);
    staticParam.trigger = function () {
        setStaticCoefficient(Friction.friction, staticParam.value);
    }.bind(this);
    dynamicParam.trigger = function () {
        setDynamicCoefficient(Friction.friction, dynamicParam.value);
    }.bind(this);
    breakAwayParam.trigger = function () {
        setBreakAway(Friction.friction, breakAwayParam.value);
    }.bind(this);
    stiffnessParam.trigger = function () {
        setStiffness(Friction.friction, stiffnessParam.value);
    }.bind(this);
    dissipationParam.trigger = function () {
        setDissipation(Friction.friction, dissipationParam.value);
    }.bind(this);
    viscosityParam.trigger = function () {
        setViscosity(Friction.friction, viscosityParam.value);
    }.bind(this);
    noisinessParam.trigger = function () {
        setNoisiness(Friction.friction, noisinessParam.value);
    }.bind(this);

    //####### AUDIO CODE #######//

    this.frictionNode.onaudioprocess = function (e){
        var outs = new Array (2);
        var audioOut = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < length; i++){ //Frame loop
            interactorDSP(Friction.friction, extForceParam.value, 0, 0, 0, 0, 0, outs);
            audioOut[i] = 100000*outs[1]; //For now, we are just picking one pickup point from one object
        }
        //console.log(audioOut[0]);
    }

    //Add these at the bottom of your plugin
    this.addInput(input);
    this.addOutput(output);

    this.frictionNode.connect(output);
}

//Add prototype information here
frictionPlugin.prototype = Object.create(BasePlugin.prototype);
frictionPlugin.prototype.constructor = frictionPlugin;
frictionPlugin.prototype.name = "frictionPlugin";
frictionPlugin.prototype.version = "1.0.0";
frictionPlugin.prototype.uniqueID = "RTSFX-frictionPlugin";
