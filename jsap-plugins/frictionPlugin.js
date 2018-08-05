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
    //extForceParam.bindToAudioParam(this.externalForce);

    //####### AUDIO CODE #######//
    this.frictionNode.onaudioprocess = function (e){
        var outs = new Array (2);
        var audioOut = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < length; i++){ //Frame loop
            interactorDSP(Friction.friction, extForceParam.value, 0, 0, 0, 0, 0, outs);
            audioOut[i] = 100000*outs[1]; //For now, we are just picking one pickup point from one object
        }
        console.log(audioOut[0]);
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
