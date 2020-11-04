import React from 'react';

const types = {
  start_event: ['Start Event', 'start-event-none'],
  intermediate_event: ['Intermediate Event', 'intermediate-event-none'],
  end_event: ['End Event', 'end-event-none'],
  gateway: ['Gateway', 'gateway-none'],
  task: ['Task', 'task']
};

export default function Palette({ onAdd }) {
  return (
    <div className="palette">
      {Object.keys(types).map(t => (
        <div
          key={t}
          title={`Create ${types[t][0]}`}
          className={`entry bpmn-icon-${types[t][1]}`}
          onClick={() => onAdd(t, types[t][0])}
        />
      ))}
    </div>
  );
}
