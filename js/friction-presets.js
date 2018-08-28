// (c) 2017 Adán L. Benito, Parham Bahadoran, Thomas Vassallo. All rights reserved.

  //presets
  var presetObject = {};
  presetObject["RTSFXfriction"] = {
      //These are interactive
      extForceParam: 2.13,
      normForceParam: 1,
      modalSizeParam: 1,

      //These are fixed
      inertialWeightParam: 0,
      stribeckParam: 0.12,
      staticParam: 0.87,
      dynamicParam: 0.24,
      breakAwayParam: 0.72,
      stiffnessParam: 2441,
      dissipationParam: 14.07,
      viscosityParam: 9.48,
      noisinessParam: 0.84,
      freq1Param: 500,
      freq2Param: 600,
      freq3Param: 910,
      decay1Param: 0.01,
      decay2Param: 0.01,
      decay3Param: 0.01,
      gain1Param: 0.8,
      gain2Param: 0.8,
      gain3Param: 0.8,

      activeModesParam: 3,
  };
  addPreset(presetObject, 'Drifting/Braking car');

  var presetObject = {};
  presetObject["RTSFXfriction"] = {

      //These are fixed
      freq1Param: 1000,
      freq2Param: 2000,
      freq3Param: 3000,
      decay1Param: 0.01,
      decay2Param: 0.01,
      decay3Param: 0.01,
      gain1Param: 0.8,
      gain2Param: 0.8,
      gain3Param: 0.8,

      activeModesParam: 3,
  };
  addPreset(presetObject, 'Wooden Joint');

  var presetObject = {};
  presetObject["RTSFXfriction"] = {

      //These are fixed
      freq1Param: 700,
      freq2Param: 1600,
      freq3Param: 3000,
      decay1Param: 0.1,
      decay2Param: 0.13,
      decay3Param: 0.06,
      gain1Param: 0.8,
      gain2Param: 0.8,
      gain3Param: 0.8,

      activeModesParam: 3,
  };
  addPreset(presetObject, 'Ceramic Plate');

  var presetObject = {};
  presetObject["RTSFXfriction"] = {

      //These are fixed
      freq1Param: 500,
      freq2Param: 2000,
      freq3Param: 3000,
      decay1Param: 0.09,
      decay2Param: 0.13,
      decay3Param: 0.16,
      gain1Param: 0.8,
      gain2Param: 0.8,
      gain3Param: 0.8,

      activeModesParam: 3,
  };
  addPreset(presetObject, 'Metal bowl');

  var presetObject = {};
  presetObject["RTSFXfriction"] = {

      //These are fixed
      freq1Param: 1000,
      freq2Param: 2000,
      freq3Param: 4000,
      decay1Param: 0.14,
      decay2Param: 0.15,
      decay3Param: 0.17,
      gain1Param: 0.8,
      gain2Param: 0.8,
      gain3Param: 0.8,

      activeModesParam: 3,
  };
  addPreset(presetObject, 'Thin glass cup');

  var presetObject = {};
  presetObject["RTSFXfriction"] = {

      //These are fixed
      freq1Param: 500,
      freq2Param: 2000,
      freq3Param: 4000,
      decay1Param: 0.14,
      decay2Param: 0.14,
      decay3Param: 0.15,
      gain1Param: 0.8,
      gain2Param: 0.8,
      gain3Param: 0.6,

      activeModesParam: 3,
  };
  addPreset(presetObject, 'Thick glass cup');

  var presetObject = {};
  presetObject["RTSFXfriction"] = {

      //These are fixed
      freq1Param: 500,
      freq2Param: 600,
      freq3Param: 910,
      decay1Param: 0.01,
      decay2Param: 0.01,
      decay3Param: 0.01,
      gain1Param: 0.8,
      gain2Param: 0.8,
      gain3Param: 0.8,

      activeModesParam: 3,
  };
  addPreset(presetObject, 'Plastic Rubber Surface');


  if(typeof scene == 'undefined'){
 	addPresetOption(null, presets[0]);
  addPresetOption(null, presets[1]);
  addPresetOption(null, presets[2]);
  addPresetOption(null, presets[3]);
  addPresetOption(null, presets[4]);
  addPresetOption(null, presets[5]);
}
