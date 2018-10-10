//Constants
const MAX_ERROR = 0.001;
const MAX_ITERATIONS = 50;
const MAX_POS = 10000.0;
const LCG_MULT = 1664525;
const LCG_ADD = 1013904223;

//Functions
function clip(x, min, max) {
  if (x < min) x = min;
  else if (x > max) x = max;
  return x;
}

function isNormal(a) {
    var normal = true;
    if(Number.isNaN(a) || (!Number.isFinite(a)) || (a === 0)) {
        normal = false;
    }
    return normal;
}

function whiteNoise() {
    return Math.random() * 2 - 1;
    /*seed = seed * LCG_MULT + LCG_ADD;
    return seed / 2147483647 - 1.0;*/
}

export {
  MAX_ERROR,
  MAX_ITERATIONS,
  MAX_POS,
  LCG_MULT,
  LCG_ADD,
  clip,
  isNormal,
  whiteNoise
};
