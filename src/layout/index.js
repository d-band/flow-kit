import Graph from '../graph';
import {
  accessor,
  normalize,
  connectedComponents,
  groupLayers,
  bundleEdges
} from './utils';
import layerAssignment from './layer-assignment';
import crossingReduction from './crossing-reduction';
import positionAssignment from './position-assignment';

const initGraph = (g, {
  ltor,
  vertexWidth,
  vertexHeight,
  edgeWidth,
  layerMargin,
  vertexMargin,
  vertexLeftMargin,
  vertexRightMargin,
  vertexTopMargin,
  vertexBottomMargin
}) => {
  const newGraph = new Graph();
  g.vertices().forEach((u) => {
    const d = g.vertex(u);
    const w = vertexWidth({ u, d });
    const h = vertexHeight({ u, d });
    const horizontalMargin = vertexLeftMargin({ u, d }) + vertexRightMargin({ u, d });
    const verticalMargin = vertexTopMargin({ u, d }) + vertexBottomMargin({ u, d });
    newGraph.addVertex(u, {
      width: ltor ? h + vertexMargin + verticalMargin : w + layerMargin + horizontalMargin,
      height: ltor ? w + layerMargin + horizontalMargin : h + vertexMargin + verticalMargin,
      origWidth: ltor ? h : w,
      origHeight: ltor ? w : h
    });
  });
  g.edges().forEach(([u, v]) => {
    newGraph.addEdge(u, v, {
      width: edgeWidth({
        u,
        v,
        ud: g.vertex(u),
        vd: g.vertex(v),
        d: g.edge(u, v)
      })
    });
  });
  return newGraph;
};

const simplify = (points, ltor) => {
  let index = 1;
  while (index < points.length - 1) {
    const x0 = ltor ? points[index][1] : points[index][0];
    const x1 = ltor ? points[index + 1][1] : points[index + 1][0];
    if (x0 === x1) {
      points.splice(index, 2);
    } else {
      index += 2;
    }
  }
};

const reversed = (arr) => {
  const result = [];
  arr.forEach((x) => {
    result.unshift(x);
  });
  return result;
};

const buildResult = (g, layers, ltor) => {
  const result = {
    vertices: {},
    edges: {}
  };
  const layerHeights = [];

  g.vertices().forEach((u) => {
    result.edges[u] = {};
  });

  layers.forEach((layer) => {
    const heights = layer.map(u => (
      g.vertex(u).origHeight || 0
    ));
    const maxHeight = Math.max(...heights);
    layerHeights.push(maxHeight);
  });

  layers.forEach((layer, i) => {
    const layerHeight = layerHeights[i];
    layer.forEach((u) => {
      const uNode = g.vertex(u);
      if (uNode.dummy) return;
      result.vertices[u] = {
        x: ltor ? uNode.y : uNode.x,
        y: ltor ? uNode.x : uNode.y,
        width: ltor ? uNode.origHeight : uNode.origWidth,
        height: ltor ? uNode.origWidth : uNode.origHeight,
        layer: uNode.layer,
        order: uNode.order
      };

      g.outVertices(u).forEach((v) => {
        const points = ltor ? [
          [uNode.y + (uNode.origHeight || 0) / 2, uNode.x], [uNode.y + layerHeight / 2, uNode.x]
        ] : [
          [uNode.x, uNode.y + (uNode.origHeight || 0) / 2], [uNode.x, uNode.y + layerHeight / 2]
        ];
        let w = v;
        let wNode = g.vertex(w);
        let j = i + 1;
        while (wNode.dummy) {
          if (ltor) {
            points.push([wNode.y - layerHeights[j] / 2, wNode.x]);
            points.push([wNode.y + layerHeights[j] / 2, wNode.x]);
          } else {
            points.push([wNode.x, wNode.y - layerHeights[j] / 2]);
            points.push([wNode.x, wNode.y + layerHeights[j] / 2]);
          }
          // eslint-disable-next-line prefer-destructuring
          w = g.outVertices(w)[0];
          wNode = g.vertex(w);
          j += 1;
        }
        if (ltor) {
          points.push([wNode.y - layerHeights[j] / 2, wNode.x]);
          points.push([wNode.y - (wNode.origHeight || 0) / 2, wNode.x]);
        } else {
          points.push([wNode.x, wNode.y - layerHeights[j] / 2]);
          points.push([wNode.x, wNode.y - (wNode.origHeight || 0) / 2]);
        }
        simplify(points, ltor);
        if (g.edge(u, v).reversed) {
          result.edges[w][u] = {
            points: reversed(points),
            reversed: true,
            width: g.edge(u, v).width
          };
        } else {
          result.edges[u][w] = {
            points,
            reversed: false,
            width: g.edge(u, v).width
          };
        }
      });
    });
  });

  return result;
};

const privates = new WeakMap();

export default class SugiyamaLayouter {
  constructor() {
    privates.set(this, {
      vertexWidth: ({ d }) => d.width,
      vertexHeight: ({ d }) => d.height,
      edgeWidth: () => 1,
      layerMargin: 10,
      vertexMargin: 10,
      vertexLeftMargin: () => 0,
      vertexRightMargin: () => 0,
      vertexTopMargin: () => 0,
      vertexBottomMargin: () => 0,
      edgeMargin: 10,
      ltor: true,
      edgeBundling: false,
      layerAssignment: new layerAssignment.QuadHeuristic(),
      crossingReduction: new crossingReduction.LayerSweep(),
      positionAssignment: new positionAssignment.Brandes()
    });
  }

  layout(gOrig) {
    const g = initGraph(gOrig, {
      vertexWidth: this.vertexWidth(),
      vertexHeight: this.vertexHeight(),
      edgeWidth: this.edgeWidth(),
      layerMargin: this.layerMargin(),
      vertexMargin: this.vertexMargin(),
      vertexLeftMargin: this.vertexLeftMargin(),
      vertexRightMargin: this.vertexRightMargin(),
      vertexTopMargin: this.vertexTopMargin(),
      vertexBottomMargin: this.vertexBottomMargin(),
      ltor: this.ltor()
    });
    const layerMap = this.layerAssignment().call(g);
    const layers = groupLayers(g, layerMap, true);
    normalize(g, layers, layerMap, this.edgeMargin(), this.layerMargin());
    const normalizedLayers = layers.map(() => []);

    connectedComponents(g).forEach((component) => {
      const vertices = new Set(component);
      const componentLayers = layers.map(h => h.filter(u => vertices.has(u)));
      this.crossingReduction().call(g, componentLayers);
      componentLayers.forEach((layer, i) => {
        layer.forEach((u) => {
          normalizedLayers[i].push(u);
        });
      });
    });
    normalizedLayers.forEach((layer, i) => {
      layer.forEach((u, j) => {
        g.vertex(u).layer = i;
        g.vertex(u).order = j;
      });
    });
    this.positionAssignment().call(g, normalizedLayers);
    if (this.edgeBundling()) {
      bundleEdges(g, normalizedLayers, this.ltor());
    }
    return buildResult(g, normalizedLayers, this.ltor());
  }

  vertexWidth(...args) {
    return accessor(this, privates, 'vertexWidth', args);
  }

  vertexHeight(...args) {
    return accessor(this, privates, 'vertexHeight', args);
  }

  edgeWidth(...args) {
    return accessor(this, privates, 'edgeWidth', args);
  }

  layerMargin(...args) {
    return accessor(this, privates, 'layerMargin', args);
  }

  vertexMargin(...args) {
    return accessor(this, privates, 'vertexMargin', args);
  }

  edgeMargin(...args) {
    return accessor(this, privates, 'edgeMargin', args);
  }

  vertexLeftMargin(...args) {
    return accessor(this, privates, 'vertexLeftMargin', args);
  }

  vertexRightMargin(...args) {
    return accessor(this, privates, 'vertexRightMargin', args);
  }

  vertexTopMargin(...args) {
    return accessor(this, privates, 'vertexTopMargin', args);
  }

  vertexBottomMargin(...args) {
    return accessor(this, privates, 'vertexBottomMargin', args);
  }

  ltor(...args) {
    return accessor(this, privates, 'ltor', args);
  }

  edgeBundling(...args) {
    return accessor(this, privates, 'edgeBundling', args);
  }

  layerAssignment(...args) {
    return accessor(this, privates, 'layerAssignment', args);
  }

  crossingReduction(...args) {
    return accessor(this, privates, 'crossingReduction', args);
  }

  positionAssignment(...args) {
    return accessor(this, privates, 'positionAssignment', args);
  }
}
