import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export default function Node({
  onSize, onClick, children, top, left, className, prefixCls
}) {
  const elem = useRef(null);
  const oldW = useRef(0);
  const oldH = useRef(0);
  const observer = useRef(null);

  const onChange = () => {
    if (!elem.current) return;
    const rect = elem.current.getBoundingClientRect();
    const width = Math.round(rect.width || 0);
    const height = Math.round(rect.height || 0);
    if (width !== oldW.current || height !== oldH.current) {
      oldW.current = width;
      oldH.current = height;
      onSize({ width, height });
    }
  };

  const addObserver = () => {
    if (typeof MutationObserver !== 'undefined') {
      observer.current = new MutationObserver(onChange);
      observer.current.observe(elem.current, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
      });
    }
  };

  const removeObserver = () => {
    if (!observer.current) return;
    observer.current.disconnect();
  };

  const ref = (node) => {
    if (!node || node === elem.current) return;
    removeObserver();
    elem.current = node;
    onChange();
    addObserver();
  };

  useEffect(() => {
    document.addEventListener('transitionend', onChange);
    window.addEventListener('resize', onChange);
    return () => {
      document.removeEventListener('transitionend', onChange);
      window.removeEventListener('resize', onChange);
      removeObserver();
    };
  }, []);

  const cls = [`${prefixCls}-node`];
  if (className) {
    cls.push(className);
  }
  const style = {
    position: 'absolute',
    top,
    left
  };

  return (
    <div ref={ref} className={cls.join(' ')} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

Node.displayName = 'Node';
Node.propTypes = {
  onSize: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
  top: PropTypes.number,
  left: PropTypes.number,
  className: PropTypes.string,
  prefixCls: PropTypes.string
};
Node.defaultProps = {
  prefixCls: 'workflow',
  children: undefined,
  top: 0,
  left: 0,
  className: undefined
};
