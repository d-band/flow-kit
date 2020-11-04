import React from 'react';

export const types = {
  start_event: 'Start Event',
  start_event_message: 'Message Start Event',
  start_event_timer: 'Timer Start Event',
  start_event_condition: 'Condition Start Event',
  start_event_signal: 'Signal Start Event',
  // Intermediate event
  intermediate_event: 'Intermediate Event',
  intermediate_event_catch_message: 'Message Intermediate Catch Event',
  intermediate_event_throw_message: 'Message Intermediate Throw Event',
  intermediate_event_catch_timer: 'Timer Intermediate Catch Event',
  intermediate_event_throw_escalation: 'Escalation Intermediate Throw Event',
  intermediate_event_catch_condition: 'Condition Intermediate Catch Event',
  intermediate_event_catch_link: 'Link Intermediate Catch Event',
  intermediate_event_throw_link: 'Link Intermediate Throw Event',
  intermediate_event_throw_compensation: 'Compensation Intermediate Throw Event',
  intermediate_event_catch_signa: 'Signal Intermediate Catch Event',
  intermediate_event_throw_signa: 'Signal Intermediate Throw Event',
  // End event
  end_event: 'End Event',
  end_event_message: 'Message End Event',
  end_event_escalation: 'Escalation End Event',
  end_event_error: 'Error End Event',
  end_event_compensation: 'Compensation End Event',
  end_event_signal: 'Signal End Event',
  end_event_terminate: 'Terminate End Event',
  // Gateway
  gateway: 'Gateway',
  gateway_xor: 'Exclusive Gateway',
  gateway_parallel: 'Parallel Gateway',
  gateway_or: 'Inclusive Gateway',
  gateway_complex: 'Complex Gateway',
  gateway_eventbased: 'Eventbased Gateway',
  // Task
  task: 'Task',
  send_task: 'Send Task',
  receive_task: 'Receive Task',
  user_task: 'User Task',
  manual_task: 'Manual Task',
  business_rule_task: 'Business-rule Task',
  service_task: 'Service Task',
  script_task: 'Script Task'
};

export default function NodeForm({ node, onChange }) {
  if (!node) return null;

  const change = k => e => {
    const v = e.target.value;
    onChange(node.id, { [k]: v });
  };
  return (
    <div className="node-form">
      <div className="form-group">
        <div className="col-l">
          <label className="form-label label-sm">id</label>
        </div>
        <div className="col-r">
          <label className="form-label label-sm">{node.id}</label>
        </div>
      </div>
      <div className="form-group">
        <div className="col-l">
          <label className="form-label label-sm">name</label>
        </div>
        <div className="col-r">
          <input
            type="text"
            className="form-input input-sm"
            value={node.name}
            onChange={change('name')}
          />
        </div>
      </div>
      <div className="form-group">
        <div className="col-l">
          <label className="form-label label-sm">type</label>
        </div>
        <div className="col-r">
          <select
            className="form-select select-sm"
            value={node.type}
            onChange={change('type')}
          >
            {Object.keys(types).map((t) => (
              <option key={t} value={t}>{types[t]}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
