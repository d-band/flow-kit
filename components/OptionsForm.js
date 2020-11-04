import React from 'react';

export default function OptionsForm({ value, onChange }) {
  const setOption = k => e => {
    const t = e.target;
    const v = t.type === 'checkbox'
      ? t.checked
      : (parseInt(t.value) || 0);
    onChange(k, v);
  };
  return (
    <div className="options-form">
      <div className="form-group">
        <div className="col">
          <label className="form-label label-sm">ltor</label>
        </div>
        <div className="col">
          <label className="form-switch input-sm">
            <input type="checkbox" checked={value.ltor} onChange={setOption('ltor')} />
            <i className="form-icon" />
          </label>
        </div>
      </div>
      <div className="form-group">
        <div className="col">
          <label className="form-label label-sm">layerMargin</label>
        </div>
        <div className="col">
          <input
            type="number"
            className="form-input input-sm"
            value={value.layerMargin}
            onChange={setOption('layerMargin')}
          />
        </div>
      </div>
      <div className="form-group">
        <div className="col">
          <label className="form-label label-sm">vertexMargin</label>
        </div>
        <div className="col">
          <input
            type="number"
            className="form-input input-sm"
            value={value.vertexMargin}
            onChange={setOption('vertexMargin')}
          />
        </div>
      </div>
      <div className="form-group">
        <div className="col">
          <label className="form-label label-sm">edgeMargin</label>
        </div>
        <div className="col">
          <input
            type="number"
            className="form-input input-sm"
            value={value.edgeMargin}
            onChange={setOption('edgeMargin')}
          />
        </div>
      </div>
    </div>
  );
}
