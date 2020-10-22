import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export default function Node({
  onSize, children, top, left, className, prefixCls
}) {
  const ref = useRef(null);
  const oldW = useRef(0);
  const oldH = useRef(0);

  useLayoutEffect(() => {
    if (!ref.current) return () => {};

    const onChange = () => {
      const rect = ref.current.getBoundingClientRect();
      const width = Math.round(rect.width || 0);
      const height = Math.round(rect.height || 0);
      if (width !== oldW.current || height !== oldH.current) {
        oldW.current = width;
        oldH.current = height;
        onSize({ width, height });
      }
    };

    document.addEventListener('transitionend', onChange);
    window.addEventListener('resize', onChange);
    let observer = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(onChange);
      observer.observe(ref.current, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
      });
    }
    // call at first
    onChange();
    // release events
    return () => {
      document.removeEventListener('transitionend', onChange);
      window.removeEventListener('resize', onChange);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [ref.current]);

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
    <div ref={ref} className={cls.join(' ')} style={style}>
      {children}
    </div>
  );
}

Node.displayName = 'Node';
Node.propTypes = {
  onSize: PropTypes.func.isRequired,
  children: PropTypes.element,
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
