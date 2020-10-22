import { layerEdges, median } from './utils';

const split = (x, f) => {
  const y = [];
  const z = [];
  x.forEach((xi) => {
    if (f(xi)) {
      y.push(xi);
    } else {
      z.push(xi);
    }
  });
  return [y, z];
};

const markConflicts = (g, layers) => {
  const h = layers.length - 2;
  const dummy = {};
  const order = {};
  const isInner = ([u, v]) => dummy[u] && dummy[v];

  g.vertices().forEach((u) => {
    const d = g.vertex(u);
    dummy[u] = !!d.dummy;
    order[u] = d.order;
  });

  for (let i = 1; i < h; ++i) {
    const h1 = layers[i];
    const h2 = layers[i + 1];
    const edges = layerEdges(g, h1, h2);
    const [innerSegments, outerSegments] = split(edges, isInner);
    innerSegments.forEach(([u1, v1]) => {
      outerSegments.forEach(([u2, v2]) => {
        if (
          (order[u1] < order[u2] && order[v1] > order[v2])
          || (order[u1] > order[u2] && order[v1] < order[v2])
        ) {
          g.edge(u2, v2).type1Conflict = true;
        }
      });
    });
  }
};

const verticalAlignment = (g, layers, { rtol = false, btot = false }) => {
  const iterLayers = () => {
    const arr = [];
    if (btot) {
      for (let i = layers.length - 2; i >= 0; --i) {
        arr.push(layers[i]);
      }
    } else {
      for (let i = 1; i < layers.length; ++i) {
        arr.push(layers[i]);
      }
    }
    return arr;
  };

  const iterLayer = (layer) => {
    const arr = [];
    if (rtol) {
      for (let i = layer.length - 1; i >= 0; --i) {
        arr.push(layer[i]);
      }
    } else {
      for (let i = 0; i < layer.length; ++i) {
        arr.push(layer[i]);
      }
    }
    return arr;
  };

  const edge = btot ? (u, v) => g.edge(v, u) : (u, v) => g.edge(u, v);
  const degree = btot ? u => g.outDegree(u) : u => g.inDegree(u);
  g.vertices().forEach((u) => {
    g.vertex(u).root = u;
    g.vertex(u).align = u;
  });
  iterLayers().forEach((layer) => {
    let r = rtol ? Infinity : -Infinity;
    iterLayer(layer).forEach((v) => {
      if (degree(v) > 0) {
        const { left, right } = median(g, v, btot);
        // eslint-disable-next-line no-nested-ternary
        const medians = left === right ? [left] : (rtol ? [right, left] : [left, right]);
        for (let i = 0; i < medians.length; i++) {
          const u = medians[i];
          if (!edge(u, v).type1Conflict && !edge(u, v).type2Conflict) {
            if (rtol ? r > g.vertex(u).order : r < g.vertex(u).order) {
              g.vertex(v).root = g.vertex(u).root;
              g.vertex(v).align = g.vertex(u).root;
              g.vertex(u).align = v;
              r = g.vertex(u).order;
              break;
            }
          }
        }
      }
    });
  });
};

const horizontalCompaction = (g, layers, { rtol = false }) => {
  const orderNonZero = node => (rtol
    ? node.order < layers[node.layer].length - 1
    : node.order > 0);
  const predecessor = rtol
    ? node => layers[node.layer][node.order + 1]
    : node => layers[node.layer][node.order - 1];

  const placeBlock = (v) => {
    const vNode = g.vertex(v);
    if (vNode.x !== null) {
      return;
    }
    vNode.x = 0;
    let w = v;
    do {
      const wNode = g.vertex(w);
      if (orderNonZero(wNode)) {
        const p = predecessor(wNode);
        const pNode = g.vertex(p);
        const u = pNode.root;
        const uNode = g.vertex(u);
        placeBlock(u);
        if (vNode.sink === v) {
          vNode.sink = uNode.sink;
        }
        if (vNode.sink === uNode.sink) {
          vNode.x = Math.max(
            vNode.x,
            uNode.x + (pNode.width + wNode.width) / 2
          );
        } else {
          const uSinkNode = g.vertex(uNode.sink);
          uSinkNode.shift = Math.min(
            uSinkNode.shift,
            vNode.x - uNode.x - (pNode.width + wNode.width) / 2
          );
        }
      }
      w = wNode.align;
    } while (w !== v);
  };

  g.vertices().forEach((u) => {
    const uNode = g.vertex(u);
    uNode.sink = u;
    uNode.shift = Infinity;
    uNode.x = null;
  });
  g.vertices().forEach((u) => {
    if (g.vertex(u).root === u) {
      placeBlock(u);
    }
  });
  g.vertices().forEach((u) => {
    const uNode = g.vertex(u);
    uNode.x = g.vertex(uNode.root).x;
  });
  g.vertices().forEach((u) => {
    const uNode = g.vertex(u);
    const { shift } = g.vertex(g.vertex(uNode.root).sink);
    if (shift < Infinity) {
      uNode.x += shift;
    }
  });
};

const sort = (xs) => {
  xs.sort((x1, x2) => x1 - x2);
};

const brandes = (g, layers) => {
  markConflicts(g, layers);

  const xs = {};
  g.vertices().forEach((u) => {
    xs[u] = [];
  });
  const directions = [
    { rtol: false, btot: false },
    { rtol: true, btot: false },
    { rtol: false, btot: true },
    { rtol: true, btot: true }
  ];

  let minWidthLeft = -Infinity;
  let minWidthRight = Infinity;
  for (let i = 0; i < directions.length; ++i) {
    const direction = directions[i];
    verticalAlignment(g, layers, direction);
    horizontalCompaction(g, layers, direction);
    let minX = Infinity;
    let maxX = -Infinity;
    g.vertices().forEach((u) => {
      if (direction.rtol) {
        g.vertex(u).x = -g.vertex(u).x;
      }
      minX = Math.min(minX, g.vertex(u).x);
      maxX = Math.max(maxX, g.vertex(u).x);
    });
    if (maxX - minX < minWidthRight - minWidthLeft) {
      minWidthLeft = minX;
      minWidthRight = maxX;
    }
    g.vertices().forEach((u) => {
      xs[u].push(g.vertex(u).x);
    });
  }
  for (let i = 0; i < directions.length; ++i) {
    const direction = directions[i];
    if (direction.rtol) {
      let maxX = -Infinity;
      g.vertices().forEach((u) => {
        maxX = Math.max(maxX, xs[u][i]);
      });
      g.vertices().forEach((u) => {
        xs[u][i] += minWidthRight - maxX;
      });
    } else {
      let minX = Infinity;
      g.vertices().forEach((u) => {
        minX = Math.min(minX, xs[u][i]);
      });
      g.vertices().forEach((u) => {
        xs[u][i] += minWidthLeft - minX;
      });
    }
  }
  g.vertices().forEach((u) => {
    sort(xs[u]);
    g.vertex(u).x = (xs[u][1] + xs[u][2]) / 2;
  });
};

const normalize = (g) => {
  let xMin = Infinity;
  let yMin = Infinity;
  g.vertices().forEach((u) => {
    const uNode = g.vertex(u);
    xMin = Math.min(xMin, uNode.x - uNode.origWidth / 2);
    yMin = Math.min(yMin, uNode.y - uNode.origHeight / 2);
  });
  g.vertices().forEach((u) => {
    const uNode = g.vertex(u);
    uNode.x -= xMin;
    uNode.y -= yMin;
  });
};

class Brandes {
  // eslint-disable-next-line class-methods-use-this
  call(g, layers) {
    brandes(g, layers);

    let yOffset = 0;
    layers.forEach((layer) => {
      let maxHeight = 0;
      layer.forEach((u) => {
        maxHeight = Math.max(maxHeight, g.vertex(u).height);
      });
      yOffset += maxHeight / 2;
      layer.forEach((u) => {
        g.vertex(u).y = yOffset;
      });
      yOffset += maxHeight / 2;
    });

    normalize(g);
  }
}

export default { Brandes };
