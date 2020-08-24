// Adds zeros between every element in analysis array
// and interpolates it to mimic a waveform.
function createInterpolationFromAnalysis(arr) {
  let xs = [0];
  let ys = [0];
  for (var i=0; i < arr.length-1; i++) {
    xs.push(arr[i].start * 1e3);
    ys.push(arr[i].confidence);
    xs.push(arr[i].start * 1e3 + (arr[i+1].start * 1e3 - arr[i].start * 1e3) * (3/4));
    ys.push(0);
  }
  xs.push(arr[i].start * 1e3);
  ys.push(arr[i].confidence);
  xs.push(xs[xs.length-1] + 200);
  ys.push(0);
  // console.log("xs:", xs);
  // console.log("ys:", ys);
  return new CosineInterpolation(xs, ys);
}

class CosineInterpolation {
  constructor(xs, ys) {
    this.xs = xs;
    this.ys = ys;
  }

  // http://paulbourke.net/miscellaneous/interpolation/
  at(pos) {
    // console.log(pos);
    const i = this.getIndexBefore(pos);
    // console.log(i);
    const mu = (pos-this.xs[i]) / (this.xs[i+1]-this.xs[i]);
    const mu2 = (1-Math.cos(mu*Math.PI)) / 2;
    const y = this.ys[i]*(1-mu2)+this.ys[i+1]*mu2 || 0;
    return y > 0 ? y : 0;
  }

  getIndexBefore(target) {
    if (this.lastIndex >= 0) {
      if (target >= this.xs[this.lastIndex] && target <= this.xs[this.lastIndex] + 1e3) {
        this.lastIndex = this.sequentialForwardSearch(target);
        return this.lastIndex;
      }
    }
    this.lastIndex = this.binarySearch(target);
    return this.lastIndex;
  }

  sequentialForwardSearch(target) {
    let index = this.lastIndex;
    for (let i=index; i < this.xs.length; i++) {
      if (target >= this.xs[i]) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }

  binarySearch(target) {
    let low = 0;
    let high = this.xs.length;
    let mid = 0;
    while (low < high) {
      mid = Math.floor((low + high) / 2);
      if (this.xs[mid] < target && mid !== low) {
        low = mid;
      } else if (this.xs[mid] >= target && mid !== high) {
        high = mid;
      } else {
        high = low;
      }
    }
    return low;
  }
};