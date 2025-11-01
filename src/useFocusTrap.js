// useFocusTrap.js
// React hook for trapping focus inside a modal
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;
        const container = containerRef.current;
        const focusableSelectors = [
            'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
            'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
        ];
        const getFocusable = () => Array.from(
            container.querySelectorAll(focusableSelectors.join(','))
        ).filter(el => el.offsetParent !== null);

        // Focus first element on open
        const focusables = getFocusable();
        if (focusables.length) focusables[0].focus();

        function handleKeyDown(e) {
            if (e.key !== 'Tab') return;
            const focusables = getFocusable();
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        }
        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    return containerRef;
}
