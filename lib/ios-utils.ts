// iOS-specific utilities for preventing zoom and improving mobile experience

/**
 * Detects if the current device is running iOS Safari
 */
export const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
         /Safari/.test(navigator.userAgent) &&
         !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
};

/**
 * Detects if the current device is iOS (any browser)
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Returns CSS properties to prevent iOS zoom on input focus
 */
export const getIOSInputProps = () => ({
  style: {
    fontSize: '16px',
    transform: 'scale(1)',
    WebkitTransform: 'scale(1)',
    WebkitAppearance: 'none',
    appearance: 'none',
  },
  className: 'input-no-zoom',
});

/**
 * Prevents iOS double-tap zoom on elements
 */
export const preventIOSDoubleeTapZoom = (element: HTMLElement) => {
  if (!isIOS()) return;
  
  let lastTouchEnd = 0;
  element.addEventListener('touchend', (event) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
};

/**
 * Hook to handle iOS-specific behaviors
 */
export const useIOSFixes = () => {
  const iOS = isIOS();
  const iOSSafari = isIOSSafari();
  
  return {
    isIOS: iOS,
    isIOSSafari: iOSSafari,
    inputProps: getIOSInputProps(),
    preventDoubleeTapZoom: preventIOSDoubleeTapZoom,
  };
};

/**
 * Applies iOS-friendly styling to form elements
 */
export const applyIOSFormFixes = () => {
  if (typeof document === 'undefined' || !isIOS()) return;
  
  const style = document.createElement('style');
  style.textContent = `
    /* iOS-specific form input fixes */
    input, textarea, select {
      -webkit-appearance: none !important;
      -webkit-border-radius: 0 !important;
      border-radius: 6px !important;
      font-size: 16px !important;
      transform: scale(1) !important;
    }
    
    input:focus, textarea:focus, select:focus {
      -webkit-appearance: none !important;
      font-size: 16px !important;
      transform: scale(1) !important;
    }
    
    /* Prevent zoom on select */
    select {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 8px center;
      background-repeat: no-repeat;
      background-size: 16px 12px;
      padding-right: 40px;
    }
  `;
  
  document.head.appendChild(style);
}; 