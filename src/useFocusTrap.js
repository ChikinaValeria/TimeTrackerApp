// React hook for trapping focus inside a modal
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;
        const container = containerRef.current;
        // This array lists all the possible HTML elements that a user can typically focus on
        const focusableSelectors = [
            'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
            'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
        ];
        // This function finds all focusable elements inside the container and filters out hidden ones
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
                // If the user presses Shift + Tab, we check if they are on the first element
                if (document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
            } else {
                // If the user presses only Tab, we check if they are on the last element
                if (document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        }
        // We add the keydown listener to the container to detect Tab presses
        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    return containerRef;
}
