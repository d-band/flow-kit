import { accessor, layerMatrix } from './utils';

const baryCenter = (g, h1, h2, inverse = false) => {
  const centers = {};
  const n = h1.length;
  const m = h2.length;
  const a = layerMatrix(g, h1, h2);
  const cmp = (u, v) => centers[u] - centers[v];
  if (inverse) {
    for (let i = 0; i < n; ++i) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < m; ++j) {
        const aij = a[i * m + j];
        count += aij;
        sum += j * aij;
      }
      centers[h1[i]] = sum / count;
    }
    h1.sort(cmp);
  } else {
    for (let j = 0; j < m; ++j) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < n; ++i) {
        const aij = a[i * m + j];
        count += aij;
        sum += i * aij;
      }
      centers[h2[j]] = sum / count;
    }
    h2.sort(cmp);
  }
};

const privates = new WeakMap();

class LayerSweep {
  constructor() {
    privates.set(this, {
      repeat: 8,
      method: baryCenter
    });
  }

  call(g, layers) {
    const n = layers.length;
    const repeat = this.repeat();
    const method = this.method();

    for (let loop = 0; loop < repeat; ++loop) {
      for (let i = 1; i < n; ++i) {
        method(g, layers[i - 1], layers[i]);
      }
      for (let i = n - 1; i > 0; --i) {
        method(g, layers[i - 1], layers[i], true);
      }
    }
  }

  repeat(...args) {
    return accessor(this, privates, 'repeat', args);
  }

  method(...args) {
    return accessor(this, privates, 'method', args);
  }
}

export default { LayerSweep };
