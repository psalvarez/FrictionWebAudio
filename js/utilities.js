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
