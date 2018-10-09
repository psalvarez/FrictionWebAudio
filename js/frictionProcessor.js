import {Interactor} from "./interactor.js";

class FrictionProcessor extends AudioWorkletProcessor {

  // Custom AudioParams can be defined with this static getter.
  static get parameterDescriptors() {
    return [
        {name: 'externalForce', defaultValue: 1, minValue: -3, maxValue: 0},
        {name: 'normalForce', defaultValue: 0.5, minValue: 0, maxValue: 0},
        {name: 'stribeck', defaultValue: 0.103036, minValue: 0.096, maxValue: 0},
        {name: 'static', defaultValue: 0.922222, minValue: 0.4, maxValue: 0},
        {name: 'dynamic', defaultValue: 0.3775, minValue: 0.01, maxValue: 0.0},
        {name: 'breakAway', defaultValue: 0.725, minValue: 0.1, maxValue: 0},
        {name: 'stiffness',  defaultValue: 1606.618164, minValue: 500, maxValue: 5000},
        {name: 'dissipation', defaultValue: 35.925926, minValue: 0, maxValue: 40},
        {name: 'viscosity', defaultValue: 5.55555, minValue: 0, maxValue: 10},
        {name: 'noisiness', defaultValue: 0.844167, minValue: 0.01, maxValue: 0},
        {name: 'inertialWeight', defaultValue: 0.001022, minValue: 0.01, maxValue: 0},
        {name: 'inertialSize', defaultValue: 1, minValue: 0, maxValue: 0},
        {name: 'freq1', defaultValue: 500, minValue: 20, maxValue: 20000},
        {name: 'freq2', defaultValue: 600, minValue: 20, maxValue: 20000},
        {name: 'freq3', defaultValue: 910, minValue: 20, maxValue: 20000},
        {name: 'decay1', defaultValue: 0.007, minValue: 0, maxValue: 0},
        {name: 'decay2', defaultValue: 0.01, minValue: 0, maxValue: 0},
        {name: 'decay3', defaultValue: 0.007, minValue: 0, maxValue: 0},
        {name: 'gain1', defaultValue: 0.8, minValue: 0, maxValue: 0},
        {name: 'gain2', defaultValue: 0.8, minValue: 0, maxValue: 0},
        {name: 'gain3', defaultValue: 0.8, minValue: 0, maxValue: 0},
        {name: 'modalSize', defaultValue: 1, minValue: 0, maxValue: 0},
        {name: 'activeModes', defaultValue: 3, minValue: 1, maxValue: 0}
    ];
  }

  constructor() {
    // The super constructor call is required.
    super();

    this.friction = new Interactor();//Object.create(Interactor); //This doesn't work. Have to think how to use all the objects inside the processor
  }

  process(inputs, outputs, parameters) {
    //Get the first input and output
    let input = inputs[0];
    let output = outputs[0];

    //Get first channel on first input and output
    let inputChannel0 = input[0];
    let outputChannel0 = output[0];

    let gain = parameters.gain;
    let extForceValue = parameters.externalForce;
    var outs = new Array (2);

    for (var i = 0; i < outputChannel0.length; i++){ //Frame loop
        Interactor.interactorDSP(this.friction, extForceValue, 0, 0, 0, 0, 0, outs); //I dknw how to send the friction object to interactorDSP from this scope
        outputChannel0[i] = 100000 * outs[1]; //For now, we are just picking one pickup point from one object
    }
    //console.log(extForceValue);

    return true;
  }
}

registerProcessor('frictionProcessor', FrictionProcessor);
