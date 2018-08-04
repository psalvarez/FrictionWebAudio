var frictionPlugin = function (factory, owner) {
    BasePlugin.call(this, factory, owner);

    this.onload = function(e) {}

    //####### VARIABLES ########//

    //Input and output for connecting audio chain
    let input = this.context.createGain();
    let output = this.context.createGain();

    //Audio Nodes and settings variables
    this.frictionNode = ctx.createScriptProcessor(length, 1, 1);

    //this.context.sampleRate = 44100;
    timeStep = 1/this.context.sampleRate;
    let length = 4096;

    //Control Variables
    this.Friction = {
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

    this.Friction.friction.obj0.activeModes = 1;
    this.Friction.friction.obj0.freqs[0] = 0;
    this.Friction.friction.obj0.decays[0] = 0;
    this.Friction.friction.obj0.weights[0] = 0.001022;
    this.Friction.friction.obj0.gains[0][0] = 1;
    this.Friction.friction.obj0.fragmentSize = 1;

    this.externalForce = 1;


    //####### PARAMETERS ########//

    //####### AUDIO CODE #######//
    frictionNode.onaudioprocess = function (e){
        var outs = new Array (2);
        var audioOut = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < length; i++){ //Frame loop
            interactorDSP(this.Friction.friction, f0, 0, 0, 0, 0, 0, outs);
            audioOut[i] = 100000*outs[1]; //For now, we are just picking one pickup point from one object
        }
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
