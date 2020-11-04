import React, { useState } from 'react';

export default function EdgeForm({ nodes, onAdd, onDelete }) {
  const [start, setStart] = useState();
  const [end, setEnd] = useState();
  const addEdge = () => {
    if (!start && !end) return;
    onAdd(parseInt(start), parseInt(end));
  };
  const delEdge = () => {
    if (!start && !end) return;
    onDelete(parseInt(start), parseInt(end));
  };
  return (
    <div className="edge-form">
      <div className="form-group">
        <select
          className="form-select select-sm"
          value={start}
          onChange={e => setStart(e.target.value)}
        >
          <option>--Select start--</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <select
          className="form-select select-sm"
          value={end}
          onChange={e => setEnd(e.target.value)}
        >
          <option>--Select end--</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <button className="btn btn-primary btn-sm mr-2" onClick={addEdge}>Add Edge</button>
        <button className="btn btn-error btn-sm" onClick={delEdge}>Delete Edge</button>
      </div>
    </div>
  );
}