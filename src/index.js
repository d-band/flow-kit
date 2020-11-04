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

const useThrottle = (fn, deps, delay = 50) => {
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
  data, renderNode, onSelect, prefixCls, options, lineColor
}) {
  const [sizes, setSizes] = useState({});
  const [pos, setPos] = useState({});
  const graph = useRef(null);
  const canvas = useRef(null);
  const layouter = useRef(null);
  const [size, setSize] = useState({
    width: 0,
    height: 0
  });
  const [lines, setLines] = useState([]);

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

  useThrottle(() => {
    if (!canvas.current || !layouter.current) return;
    const ctx = canvas.current.getContext('2d');
    const ratio = getRatio(ctx);
    const width = size.width * ratio;
    const height = size.height * ratio;

    canvas.current.width = width;
    canvas.current.height = height;

    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = lineColor;
    ctx.fillStyle = lineColor;

    const ltor = layouter.current.ltor();
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
    lines.forEach(({ points, width: w }) => {
      ctx.lineWidth = w;
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
  }, [size, lines, lineColor]);

  useThrottle(() => {
    if (!graph.current) return;
    if (!layouter.current) {
      layouter.current = new Layouter();
    }
    // set options for layouter
    const opts = {
      ...options,
      vertexWidth({ u }) {
        return sizes[u] ? sizes[u].width : 0;
      },
      vertexHeight({ u }) {
        return sizes[u] ? sizes[u].height : 0;
      }
    };
    Object.keys(opts).forEach((k) => {
      layouter.current[k](opts[k]);
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
    const newLines = graph.current.edges().map(([u, v]) => {
      const line = layout.edges[u][v];
      line.points.forEach((p) => {
        maxW = Math.max(maxW, p[0] + line.width);
        maxH = Math.max(maxH, p[1] + line.width);
      });
      return line;
    });
    setSize({
      width: Math.ceil(maxW),
      height: Math.ceil(maxH)
    });
    setPos(newPos);
    setLines(newLines);
  }, [data, options, sizes]);

  const onSize = (id, s) => setSizes(
    prev => ({ ...prev, [id]: s })
  );
  const getPos = v => ({ left: 0, top: 0, ...pos[v.id] });
  const style = { position: 'relative' };
  if (size.width) {
    style.width = size.width;
  }
  if (size.height) {
    style.height = size.height;
  }
  return (
    <div className={`${prefixCls}-container`} style={style}>
      <canvas
        ref={canvas}
        className={`${prefixCls}-canvas`}
        style={{
          ...size,
          left: 0,
          top: 0,
          position: 'absolute'
        }}
      />
      {data.nodes.map(v => (
        <Node
          key={v.id}
          prefixCls={prefixCls}
          onSize={s => onSize(v.id, s)}
          top={getPos(v).top}
          left={getPos(v).left}
          className={v.className}
          onClick={e => onSelect(v, e)}
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
  onSelect: PropTypes.func,
  prefixCls: PropTypes.string,
  lineColor: PropTypes.string,
  options: PropTypes.shape({
    ltor: PropTypes.bool,
    layerMargin: PropTypes.number,
    vertexMargin: PropTypes.number,
    edgeMargin: PropTypes.number
  })
};
Workflow.defaultProps = {
  prefixCls: 'workflow',
  lineColor: '#09f',
  options: {},
  onSelect: () => {}
};
