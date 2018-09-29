var frictionPlugin = function (factory, owner) {
    BasePlugin.call(this, factory, owner);

    this.onload = function(e) {}

    //####### VARIABLES ########//
    //Input and output for connecting audio chain
    let input = this.context.createGain();
    let output = this.context.createGain();

    this.masterGain = this.context.createGain();
    //Control Variables

    //This variable must be eliminated when every control is added
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

    //Initial settings (must find a more elegant way of doing this)
    /*setNormalForce(Friction.friction, Friction.force);
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

    this.masterGain.gain.value = 0.5;

    //####### PARAMETERS ########//

    let masterGainParam = this.parameters.createNumberParameter("masterGain", 1, 0, 10);
    masterGainParam.bindToAudioParam(this.masterGain.gain);
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

    //Inertial Resonator Parameters

    let inertialWeightParam = this.parameters.createNumberParameter("inertialWeight", 0.001022, 0.001, 1);
    let inertialSizeParam = this.parameters.createNumberParameter("inertialSize", 1, 0, 1); //The minimum here should be 0, but it explodes when going below 0.2. Therefore, this is kept as a safety measure until I am able to fix it

    //Modal Parameters
    let freq1Param = this.parameters.createNumberParameter("freq1", 500, 20, 20000);
    let freq2Param = this.parameters.createNumberParameter("freq2", 600, 20, 20000);
    let freq3Param = this.parameters.createNumberParameter("freq3", 910, 20, 20000);

    let decay1Param = this.parameters.createNumberParameter("decay1", 0.007, 0, 1);
    let decay2Param = this.parameters.createNumberParameter("decay2", 0.01, 0, 1);
    let decay3Param = this.parameters.createNumberParameter("decay3", 0.007, 0, 1);

    let gain1Param = this.parameters.createNumberParameter("gain1", 0.8, 0, 1);
    let gain2Param = this.parameters.createNumberParameter("gain2", 0.8, 0, 1);
    let gain3Param = this.parameters.createNumberParameter("gain3", 0.8, 0, 1);

    let modalSizeParam = this.parameters.createNumberParameter("modalSize", 1, 0, 1);

    let activeModesParam = this.parameters.createNumberParameter("activeModes", 3, 1, 3);

    //Control functions
    extForceParam.trigger = function () {
        let a = 2;
    }.bind(this);

    //Friction
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

    //Inertial
    inertialWeightParam.trigger = function () {
        Friction.friction.obj0.weights[0] = inertialWeightParam.value;
        updateModes(Friction.friction.obj0);
    }.bind(this);

    inertialSizeParam.trigger = function () {
        Friction.friction.obj0.fragmentSize = inertialSizeParam.value;
        updateModes(Friction.friction.obj0);
    }.bind(this);

    //Modal
    freq1Param.trigger = function () {
        Friction.friction.obj1.freqs[0] = freq1Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);

    freq2Param.trigger = function () {
        Friction.friction.obj1.freqs[1] = freq2Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);

    freq3Param.trigger = function () {
        Friction.friction.obj1.freqs[2] = freq3Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);


    decay1Param.trigger = function () {
        Friction.friction.obj1.decays[0] = decay1Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);

    decay2Param.trigger = function () {
        Friction.friction.obj1.decays[1] = decay2Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);

    decay3Param.trigger = function () {
        Friction.friction.obj1.decays[2] = decay3Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);


    gain1Param.trigger = function () {
        Friction.friction.obj1.gains[0][0] = gain1Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);

    gain2Param.trigger = function () {
        Friction.friction.obj1.gains[0][1] = gain2Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);

    gain3Param.trigger = function () {
        Friction.friction.obj1.gains[0][2] = gain3Param.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);

    activeModesParam.trigger = function () {
        Friction.friction.obj1.activeModes = activeModes.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);

    modalSizeParam.trigger = function () {
        Friction.friction.obj1.fragmentSize = modalSizeParam.value;
        updateModes(Friction.friction.obj1);
    }.bind(this);*/

    //####### AUDIO CODE #######//
    this.context.audioWorklet.addModule('../js/frictionProcessor.js').then(() => {
        let frictionNode = new AudioWorkletNode(this.context, 'frictionProcessor');
        frictionNode.connect(this.masterGain);
    });

    /*this.frictionNode.onaudioprocess = function (e){
        var outs = new Array (2);
        var audioOut = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < length; i++){ //Frame loop
            interactorDSP(Friction.friction, extForceParam.value, 0, 0, 0, 0, 0, outs);
            audioOut[i] = 100000*outs[1]; //For now, we are just picking one pickup point from one object
        }
        //console.log(extForceParam.value);
    }*/

    //Add these at the bottom of your plugin
    this.addInput(input);
    this.addOutput(output);

    this.masterGain.connect(output);

}

//Add prototype information here
frictionPlugin.prototype = Object.create(BasePlugin.prototype);
frictionPlugin.prototype.constructor = frictionPlugin;
frictionPlugin.prototype.name = "frictionPlugin";
frictionPlugin.prototype.version = "1.0.0";
frictionPlugin.prototype.uniqueID = "RTSFX-frictionPlugin";
