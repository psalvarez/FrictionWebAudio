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

  

  if(typeof scene == 'undefined'){
 	addPresetOption(null, presets[0]);
  addPresetOption(null, presets[1]);
  addPresetOption(null, presets[2]);
  addPresetOption(null, presets[3]);
  addPresetOption(null, presets[4]);
  addPresetOption(null, presets[5]);
}
