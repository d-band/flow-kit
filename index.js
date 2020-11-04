import React, { useEffect, useState, useMemo } from 'react';
import { render } from 'react-dom';
import Workflow from '../src';
import EdgeForm from './components/EdgeForm';
import OptionsForm from './components/OptionsForm';
import NodeForm from './components/NodeForm';
import Palette from './components/Palette';
import renderNode, { isTask } from './components/renderNode';
import './index.scss';

let index = 11;
const getId = () => index++;

function App() {
  const [cur, setCur] = useState(null);
  const [nodes, setNodes] = useState([
    { id: 1, type: 'start_event', name: 'Start' },
    { id: 2, type: 'user_task', name: 'User Task' },
    { id: 3, type: 'gateway_parallel', name: 'Gateway 1' },
    { id: 4, type: 'task', name: 'Task 1' },
    { id: 5, type: 'task', name: 'Task 2' },
    { id: 6, type: 'task', name: 'Task 3' },
    { id: 7, type: 'task', name: 'Task 4' },
    { id: 8, type: 'gateway_parallel', name: 'Gateway 2' },
    { id: 9, type: 'send_task', name: 'Send Task' },
    { id: 10, type: 'end_event', name: 'End' }
  ]);
  const [edges, setEdges] = useState([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 3, to: 6 },
    { from: 3, to: 7 },
    { from: 6, to: 8 },
    { from: 7, to: 8 },
    { from: 4, to: 5 },
    { from: 5, to: 8 },
    { from: 8, to: 9 },
    { from: 9, to: 10 }
  ]);
  const [options, setOptions] = useState({
    ltor: false,
    layerMargin: 40,
    vertexMargin: 40,
    edgeMargin: 150
  });
  const data = useMemo(() => ({
    nodes: nodes.map(n => {
      const cls = [];
      if (isTask(n.type)) {
        cls.push('node-task');
      } else {
        cls.push('node-event-gateway');
      }
      if (n.id === cur) {
        cls.push('node-active');
      }
      return { ...n, className: cls.join(' ') };
    }),
    edges
  }), [nodes, edges, cur]);

  useEffect(() => {
    const handle = (e) => {
      for (let t = e.target; t && t !== document; t = t.parentNode) {
        if (t.matches('.main')) {
          setCur(null);
          break;
        }
      }
    };
    document.addEventListener('click', handle, true);
    return () => {
      document.removeEventListener('click', handle, true);
    };
  }, []);

  const addNode = (type, text) => setNodes(prev => {
    const id = getId();
    const name = `${text} ${id}`;
    return [...prev, { id, type, name }];
  });
  const addEdge = (start, end) => setEdges(
    prev => ([...prev, { from: start, to: end }])
  );
  const delEdge = (start, end) => setEdges(
    prev => prev.filter(v => (v.from !== start || v.to !== end))
  );
  const onSelect = (v, e) => {
    e.preventDefault();
    setCur(v.id);
  };
  const setOption = (k, v) => setOptions(
    prev => ({ ...prev, [k]: v })
  );
  const node = nodes.find(v => v.id === cur);
  const setNode = (id, obj) => setNodes(
    prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, ...obj };
      }
      return n;
    })
  );
  return (
    <div className="container">
      <Palette onAdd={addNode} />
      <div className="main">
        <Workflow
          data={data}
          renderNode={renderNode}
          onSelect={onSelect}
          options={options}
        />
      </div>
      <div className="sidebar">
        <EdgeForm nodes={nodes} onAdd={addEdge} onDelete={delEdge} />
        <OptionsForm value={options} onChange={setOption} />
        <NodeForm node={node} onChange={setNode} />
      </div>
    </div>
  );
}

render(
  <App />,
  document.getElementById('root')
);
