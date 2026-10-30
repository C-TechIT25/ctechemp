import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Preserve scroll space while mounting expensive controls only near the viewport.
export default function WindowedTableRecord({ children, initialVisible = false }) {
  const group = useRef(null);
  const height = useRef(81);
  const [visible, setVisible] = useState(initialVisible);
  useEffect(() => {
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '600px 0px' });
    observer.observe(group.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (!visible) return;
    const measure = () => {
      const measured = group.current?.getBoundingClientRect().height;
      if (measured > 0) height.current = measured;
    };
    measure();
    if (!window.ResizeObserver) return;
    const observer = new ResizeObserver(measure);
    observer.observe(group.current);
    return () => observer.disconnect();
  }, [visible]);
  return <tbody ref={group}>{visible ? children() : (
    <tr aria-hidden="true"><td colSpan={12} style={{ height: height.current, padding: 0, border: 0 }} /></tr>
  )}</tbody>;
}
