import React, { Fragment } from 'react';

export function isTask(type) {
  return [
    'task',
    'send_task',
    'receive_task',
    'user_task',
    'manual_task',
    'business_rule_task',
    'service_task',
    'script_task'
  ].indexOf(type) >= 0;
}

function Task({ type, name }) {
  const icons = {
    'send_task': 'send',
    'receive_task': 'receive',
    'user_task': 'user',
    'manual_task': 'manual',
    'business_rule_task': 'business-rule',
    'service_task': 'service',
    'script_task': 'script'
  };
  return (
    <Fragment>
      {icons[type] ? (
        <div className={`icon bpmn-icon-${icons[type]}`} />
      ) : null}
      {name}
    </Fragment>
  );
}

const eventIcons = {
  start_event: 'start-event-none',
  start_event_message: 'start-event-message',
  start_event_timer: 'start-event-timer',
  start_event_condition: 'start-event-condition',
  start_event_signal: 'start-event-signal',
  intermediate_event: 'intermediate-event-none',
  intermediate_event_catch_message: 'intermediate-event-catch-message',
  intermediate_event_throw_message: 'intermediate-event-throw-message',
  intermediate_event_catch_timer: 'intermediate-event-catch-timer',
  intermediate_event_throw_escalation: 'intermediate-event-throw-escalation',
  intermediate_event_catch_condition: 'intermediate-event-catch-condition',
  intermediate_event_catch_link: 'intermediate-event-catch-link',
  intermediate_event_throw_link: 'intermediate-event-throw-link',
  intermediate_event_throw_compensation: 'intermediate-event-throw-compensation',
  intermediate_event_catch_signa: 'intermediate-event-catch-signal',
  intermediate_event_throw_signa: 'intermediate-event-throw-signal',
  end_event: 'end-event-none',
  end_event_message: 'end-event-message',
  end_event_escalation: 'end-event-escalation',
  end_event_error: 'end-event-error',
  end_event_compensation: 'end-event-compensation',
  end_event_signal: 'end-event-signal',
  end_event_terminate: 'end-event-terminate',
};
const gatewayIcons = {
  gateway: 'gateway-none',
  gateway_xor: 'gateway-xor',
  gateway_parallel: 'gateway-parallel',
  gateway_or: 'gateway-or',
  gateway_complex: 'gateway-complex',
  gateway_eventbased: 'gateway-eventbased',
};

function Icon({ icon, name }) {
  return (
    <Fragment>
      <div className={`icon bpmn-icon-${icon}`} />
      <div className="text">{name}</div>
    </Fragment>
  );
}

export default function renderNode(node) {
  if (isTask(node.type)) {
    return <Task type={node.type} name={node.name} />;
  }
  if (eventIcons[node.type]) {
    return <Icon icon={eventIcons[node.type]} name={node.name} />;
  }
  if (gatewayIcons[node.type]) {
    return <Icon icon={gatewayIcons[node.type]} name={node.name} />
  }
  return node.name;
}
