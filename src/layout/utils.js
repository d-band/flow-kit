export const accessor = (self, privates, key, args) => {
  if (args.length === 0) {
    return privates.get(self)[key];
  }
  // eslint-disable-next-line prefer-destructuring
  privates.get(self)[key] = args[0];
  return self;
};

export const normalize = (g, layers, layerMap, edgeMargin, layerMargin) => {
  g.edges().forEach(([u, v]) => {
    const d = g.edge(u, v);
    if (layerMap[v] - layerMap[u] <= 1) return;
    let w1 = u;
    for (let i = layerMap[u] + 1; i < layerMap[v]; ++i) {
      const w2 = Symbol('dummy');
      g.addVertex(w2, {
        u,
        v,
        dummy: true,
        width: d.width + edgeMargin,
        origWidth: d.width,
        height: layerMargin,
        origHeight: 0,
        layer: i
      });
      g.addEdge(w1, w2, {
        u,
        v,
        dummy: true,
        reversed: g.edge(u, v).reversed,
        width: d.width
      });
      layers[i].push(w2);
      w1 = w2;
    }
    g.addEdge(w1, v, {
      u,
      v,
      dummy: true,
      reversed: g.edge(u, v).reversed,
      width: d.width
    });
    g.removeEdge(u, v);
  });
};

export const groupLayers = (graph, layers, allowEmptyLayer) => {
  const result = [];
  graph.vertices().forEach((u) => {
    const layer = layers[u];
    if (result[layer] === undefined) {
      result[layer] = [];
    }
    result[layer].push(u);
  });
  if (allowEmptyLayer) {
    for (let i = 0; i < result.length; ++i) {
      if (result[i] === undefined) {
        result[i] = [];
      }
    }
    return result;
  }
  return result.filter(h => h !== undefined);
};

const markChildren = (graph, u, id, result) => {
  if (result.has(u)) {
    const prevId = result.get(u);
    if (prevId !== id) {
      graph.vertices().forEach((v) => {
        if (result.get(v) === prevId) {
          result.set(v, id);
        }
      });
    }
    return;
  }
  result.set(u, id);
  graph.outVertices(u).forEach((v) => {
    markChildren(graph, v, id, result);
  });
};

export const connectedComponents = (graph) => {
  const componentIdMap = new Map();
  const vertices = graph.vertices();
  vertices.forEach((u) => {
    if (graph.inDegree(u) === 0) {
      markChildren(graph, u, u, componentIdMap);
    }
  });
  const componentIds = new Set(componentIdMap.values());
  return Array.from(componentIds).map(
    u => vertices.filter(v => componentIdMap.get(v) === u)
  );
};

const segment = (graph, vertices, upper) => {
  const arr = [];
  if (vertices.length === 0) {
    return arr;
  }

  const w = upper ? 'v' : 'u';

  let seq = [];
  let lastParent = graph.vertex(vertices[0])[w];
  vertices.forEach((u) => {
    const d = graph.vertex(u);
    if (!d.dummy || d[w] !== lastParent) {
      if (seq.length > 0) {
        arr.push(seq);
        seq = [];
      }
    }
    if (d.dummy) {
      seq.push(u);
      lastParent = d[w];
    }
  });
  if (seq.length > 0) {
    arr.push(seq);
  }
  return arr;
};

const adjustPos = (graph, vertices, ltor) => {
  const p = ltor ? 'x' : 'y';
  const [sumPos, totalWidth] = vertices.reduce((prev, u) => ([
    prev[0] + graph.vertex(u)[p],
    prev[1] + (graph.vertex(u).origWidth || 0)
  ]), [0, 0]);

  let offset = (sumPos / vertices.length) - ((totalWidth - 1) / 2);
  vertices.forEach((u) => {
    graph.vertex(u)[p] = offset;
    offset += graph.vertex(u).origWidth || 0;
  });
};

export const bundleEdges = (graph, layers, ltor) => {
  for (let i = 0; i < layers.length - 1; ++i) {
    segment(graph, layers[i], false).forEach((vertices) => {
      adjustPos(graph, vertices, ltor);
    });
  }
  for (let i = layers.length - 1; i > 0; --i) {
    segment(graph, layers[i], true).forEach((vertices) => {
      adjustPos(graph, vertices, ltor);
    });
  }
};

export const layerMatrix = (g, h1, h2) => {
  const n = h1.length;
  const m = h2.length;
  const orders = {};
  const a = new Int8Array(n * m);

  for (let i = 0; i < m; ++i) {
    orders[h2[i]] = i;
  }
  for (let i = 0; i < n; ++i) {
    const u = h1[i];
    g.outVertices(u).forEach((v) => {
      a[i * m + orders[v]] = 1;
    });
  }
  return a;
};

export const layerEdges = (g, h1, h2) => {
  const result = [];
  h2.forEach((v) => {
    g.inVertices(v).forEach((u) => {
      result.push([u, v]);
    });
  });
  return result;
};

export const median = (g, v, inverse = false) => {
  const vertices = Array.from(inverse ? g.outVertices(v) : g.inVertices(v));
  vertices.sort((u1, u2) => g.vertex(u1).order - g.vertex(u2).order);
  const index = (vertices.length - 1) / 2;
  return {
    left: vertices[Math.floor(index)],
    right: vertices[Math.ceil(index)]
  };
};
