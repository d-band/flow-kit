import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useRef
} from 'react';
import PropTypes from 'prop-types';
import Graph from './graph';
import cycleRemoval from './layout/cycle-removal';
import Layouter from './layout';
import Node from './Node';

const getRatio = (ctx) => {
  const backingStore = ctx.webkitBackingStorePixelRatio
    || ctx.mozBackingStorePixelRatio
    || ctx.msBackingStorePixelRatio
    || ctx.oBackingStorePixelRatio
    || ctx.backingStorePixelRatio || 1;
  return (window.devicePixelRatio || 1) / backingStore;
};

const useThrottle = (fn, deps, delay = 20) => {
  const timer = useRef(null);
  const last = useRef(0);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  };

  useLayoutEffect(() => {
    const elapsed = Date.now() - last.current;

    clearTimer();
    timer.current = setTimeout(() => {
      last.current = Date.now();
      fn();
    }, elapsed > delay ? 0 : (delay - elapsed));
  }, deps);

  useEffect(() => clearTimer, []);
};

export {
  Graph,
  Layouter,
  cycleRemoval,
  useThrottle
};

export default function Workflow({
  data, renderNode, prefixCls, options
}) {
  const [sizes, setSizes] = useState({});
  const [pos, setPos] = useState({});
  const graph = useRef(null);
  const layouter = useRef(null);
  const canvas = useRef(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (!layouter.current) {
      layouter.current = new Layouter();
    }
    layouter.current
      .ltor(options.ltor)
      .layerMargin(options.layerMargin)
      .vertexMargin(options.vertexMargin)
      .edgeMargin(options.edgeMargin);
  }, [options]);

  useEffect(() => {
    graph.current = new Graph();
    data.nodes.forEach((v) => {
      graph.current.addVertex(v.id, v);
    });
    data.edges.forEach((e) => {
      graph.current.addEdge(e.from, e.to, e);
    });
    cycleRemoval(graph.current);
  }, [data]);

  const reLayout = () => {
    if (!graph.current || !layouter.current) return;
    layouter.current
      .vertexWidth(({ u }) => {
        if (sizes[u]) return sizes[u].width;
        return 0;
      })
      .vertexHeight(({ u }) => {
        if (sizes[u]) return sizes[u].height;
        return 0;
      });
    const layout = layouter.current.layout(graph.current);
    let maxW = 0;
    let maxH = 0;
    const newPos = {};
    graph.current.vertices().forEach((v) => {
      const p = layout.vertices[v];
      maxW = Math.max(maxW, p.x + p.width / 2);
      maxH = Math.max(maxH, p.y + p.height / 2);
      newPos[v] = {
        left: p.x - p.width / 2,
        top: p.y - p.height / 2
      };
    });
    setWidth(maxW);
    setHeight(maxH);
    setPos(newPos);
    setEdges(graph.current.edges().map(([u, v]) => {
      const { points } = layout.edges[u][v];
      return points || [];
    }));
  };

  const drawCanvas = () => {
    if (!canvas.current) return;
    const ctx = canvas.current.getContext('2d');
    const ratio = getRatio(ctx);

    canvas.current.width = width * ratio;
    canvas.current.height = height * ratio;

    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width * ratio, height * ratio);
    ctx.strokeStyle = '#09f';
    ctx.fillStyle = '#09f';

    const { ltor } = options;
    const stepTo = (p1, p2) => {
      if (ltor) {
        const cx = (p1[0] + p2[0]) / 2;
        ctx.lineTo(cx, p1[1]);
        ctx.lineTo(cx, p2[1]);
      } else {
        const cy = (p1[1] + p2[1]) / 2;
        ctx.lineTo(p1[0], cy);
        ctx.lineTo(p2[0], cy);
      }
      ctx.lineTo(p2[0], p2[1]);
    };
    const drawLines = (points, stepped) => {
      ctx.beginPath();
      let prev = null;
      points.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(p[0], p[1]);
        } else {
          // eslint-disable-next-line no-unused-expressions
          stepped ? stepTo(prev, p) : ctx.lineTo(p[0], p[1]);
        }
        prev = p;
      });
    };
    edges.forEach((points) => {
      drawLines(points, true);
      ctx.stroke();

      const e = points[points.length - 1];
      const arr = ltor ? [
        [e[0] - 6, e[1] - 4],
        [e[0], e[1]],
        [e[0] - 6, e[1] + 4],
      ] : [
        [e[0] - 4, e[1] - 6],
        [e[0], e[1]],
        [e[0] + 4, e[1] - 6],
      ];
      drawLines(arr, false);
      ctx.closePath();
      ctx.fill();
    });
  };

  useThrottle(() => {
    drawCanvas();
  }, [canvas.current, width, height, edges]);

  useThrottle(() => {
    reLayout();
  }, [data, sizes]);

  const onSize = (id, size) => setSizes(prev => ({
    ...prev,
    [id]: size
  }));
  const getPos = v => (pos[v.id] || { left: 0, top: 0 });
  const style = { position: 'relative' };
  if (width) {
    style.width = width;
  }
  if (height) {
    style.height = height;
  }
  return (
    <div className={`${prefixCls}-container`} style={style}>
      <canvas
        ref={canvas}
        className={`${prefixCls}-canvas`}
        style={{ width, height, position: 'absolute' }}
      />
      {data.nodes.map(v => (
        <Node
          key={v.id}
          prefixCls={prefixCls}
          onSize={size => onSize(v.id, size)}
          top={getPos(v).top}
          left={getPos(v).left}
          className={v.className}
        >
          {renderNode(v)}
        </Node>
      ))}
    </div>
  );
}

Workflow.displayName = 'Workflow';
Workflow.propTypes = {
  data: PropTypes.shape({
    nodes: PropTypes.array.isRequired,
    edges: PropTypes.array.isRequired
  }).isRequired,
  renderNode: PropTypes.func.isRequired,
  prefixCls: PropTypes.string,
  options: PropTypes.shape({
    ltor: PropTypes.bool,
    layerMargin: PropTypes.number,
    vertexMargin: PropTypes.number,
    edgeMargin: PropTypes.number
  })
};
Workflow.defaultProps = {
  prefixCls: 'workflow',
  options: {
    ltor: false,
    layerMargin: 30,
    vertexMargin: 30,
    edgeMargin: 5
  }
};
