'use client';

import { useEffect } from 'react';

export function ClientOnlyHandler() {
  useEffect(() => {
    // Only run on client side after hydration is complete
    const handleSimulatorCleanup = () => {
      try {
        // Wait a bit to ensure DOM is fully loaded
        setTimeout(() => {
          const body = document.body;
          const html = document.documentElement;
          
          // Clean up simulator modifications that cause hydration issues
          const attributesToClean = ['data-js', 'data-simulator', 'data-simulate'];
          
          attributesToClean.forEach(attr => {
            if (body.hasAttribute(attr)) {
              const value = body.getAttribute(attr);
              if (value?.includes('simulator') || value?.includes('mobile')) {
                body.removeAttribute(attr);
                console.log(`[ClientHandler] Removed ${attr} from body`);
              }
            }
            
            if (html.hasAttribute(attr)) {
              const value = html.getAttribute(attr);
              if (value?.includes('simulator') || value?.includes('mobile')) {
                html.removeAttribute(attr);
                console.log(`[ClientHandler] Removed ${attr} from html`);
              }
            }
          });
          
          // Clean up any injected classes that might conflict
          ['simulator', 'mobile-first', 'simulateur'].forEach(className => {
            body.classList.remove(className);
            html.classList.remove(className);
          });
          
        }, 100);
      } catch (error) {
        console.warn('[ClientHandler] Error during cleanup:', error);
      }
    };

    const handleIOSFixes = () => {
      try {
        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
          // Prevent double-tap zoom
          let lastTouchEnd = 0;
          const preventDoubleTouch = (event: TouchEvent) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
              event.preventDefault();
            }
            lastTouchEnd = now;
          };
          
          document.addEventListener('touchend', preventDoubleTouch, { passive: false });
          
          // Apply iOS-specific CSS if not already applied
          if (!document.getElementById('ios-fixes')) {
            const style = document.createElement('style');
            style.id = 'ios-fixes';
            style.textContent = `
              /* iOS zoom prevention */
              input, textarea, select {
                font-size: 16px !important;
                transform: scale(1) !important;
                -webkit-appearance: none !important;
              }
              input:focus, textarea:focus, select:focus {
                font-size: 16px !important;
                transform: scale(1) !important;
              }
              
              /* Prevent iOS bounce scroll */
              body {
                -webkit-overflow-scrolling: touch;
                overscroll-behavior: none;
              }
            `;
            document.head.appendChild(style);
            console.log('[ClientHandler] Applied iOS fixes');
          }
          
          // Cleanup function
          return () => {
            document.removeEventListener('touchend', preventDoubleTouch);
          };
        }
      } catch (error) {
        console.warn('[ClientHandler] Error applying iOS fixes:', error);
      }
    };

    // Run both handlers
    handleSimulatorCleanup();
    const iosCleanup = handleIOSFixes();
    
    // Also run cleanup after any navigation or DOM changes
    const observer = new MutationObserver((mutations) => {
      let shouldCleanup = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-js' || 
             mutation.attributeName === 'class')) {
          shouldCleanup = true;
        }
      });
      
      if (shouldCleanup) {
        handleSimulatorCleanup();
      }
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-js', 'class', 'data-simulator']
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-js', 'class', 'data-simulator']
    });

    // Cleanup function
    return () => {
      observer.disconnect();
      if (iosCleanup) {
        iosCleanup();
      }
    };
  }, []); // Empty dependency array - run once after mount

  // This component renders nothing
  return null;
} 