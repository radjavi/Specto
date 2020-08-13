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

  /**
   * inspired by https://stackoverflow.com/a/40850313/4417327
   */
  getIndexBefore(target) {
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
};