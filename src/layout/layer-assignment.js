import { accessor } from './utils';

const longestPath = (g) => {
  const visited = {};
  const layers = {};

  const dfs = (u) => {
    if (visited[u]) {
      return layers[u];
    }
    visited[u] = true;

    let layer = Infinity;
    g.outVertices(u).forEach((v) => {
      layer = Math.min(layer, dfs(v) - 1);
    });
    if (layer === Infinity) {
      layer = 0;
    }
    layers[u] = layer;
    return layer;
  };

  g.vertices().forEach((u) => {
    if (g.inDegree(u) === 0) {
      dfs(u);
    }
  });

  let minLayer = Infinity;
  g.vertices().forEach((u) => {
    minLayer = Math.min(minLayer, layers[u]);
  });
  g.vertices().forEach((u) => {
    layers[u] -= minLayer;
  });

  return layers;
};

class LongestPath {
  // eslint-disable-next-line class-methods-use-this
  call(g) {
    return longestPath(g);
  }
}

const quadHeuristic = (g, repeat) => {
  const layers = new LongestPath().call(g);

  let minLayer = Infinity;
  g.vertices().forEach((u) => {
    minLayer = Math.min(minLayer, layers[u]);
  });
  g.vertices().forEach((u) => {
    if (g.inDegree(u) === 0) {
      layers[u] = 0;
    } else {
      layers[u] -= minLayer;
    }
  });

  const vertices = g.vertices().filter(u => g.inDegree(u) > 0 && g.outDegree(u) > 0);
  const weights = {};
  const cmp = (u, v) => weights[v] - weights[u];
  for (let loop = 0; loop < repeat; ++loop) {
    g.vertices().forEach((u) => {
      weights[u] = 0;
    });
    g.edges().forEach(([u, v]) => {
      const l = layers[v] - layers[u];
      weights[u] += l;
      weights[v] += l;
    });

    vertices.sort(cmp).forEach((u) => {
      let sum = 0;
      let count = 0;
      let leftMax = -Infinity;
      let rightMin = Infinity;
      g.inVertices(u).forEach((v) => {
        const layer = layers[v];
        leftMax = Math.max(leftMax, layer);
        sum += layer;
        count += 1;
      });
      g.outVertices(u).forEach((v) => {
        const layer = layers[v];
        rightMin = Math.min(rightMin, layer);
        sum += layer;
        count += 1;
      });
      layers[u] = Math.min(rightMin - 1, Math.max(leftMax + 1, Math.round(sum / count)));
    });
  }

  return layers;
};

const privates = new WeakMap();

class QuadHeuristic {
  constructor() {
    privates.set(this, {
      repeat: 4
    });
  }

  call(g) {
    return quadHeuristic(g, this.repeat());
  }

  repeat(...args) {
    return accessor(this, privates, 'repeat', args);
  }
}

export default { LongestPath, QuadHeuristic };
