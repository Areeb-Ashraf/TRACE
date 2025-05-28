// Main world script for TRACE Academic Integrity Monitor
// This script runs in the MAIN world (same as React)

console.log('🌍 TRACE Extension main world script loaded on:', window.location.href);

let isInitialized = false;

// Create extension interface directly in main world
function createExtensionInterface() {
  console.log('🔧 Creating TRACE Extension interface in main world...');
  
  try {
    // Create extension interface
    window.TRACE_EXTENSION = {
      isAvailable: true,
      startMonitoring: () => {
        console.log('🎯 Extension startMonitoring called');
        window.postMessage({ type: 'TRACE_START_MONITORING' }, '*');
      },
      stopMonitoring: () => {
        console.log('🛑 Extension stopMonitoring called');
        window.postMessage({ type: 'TRACE_STOP_MONITORING' }, '*');
      },
      getActivities: () => {
        console.log('📊 Extension getActivities called');
        window.postMessage({ type: 'TRACE_GET_ACTIVITIES' }, '*');
      }
    };
    
    // Make it persistent
    Object.defineProperty(window, 'TRACE_EXTENSION', {
      value: window.TRACE_EXTENSION,
      writable: true,
      configurable: true
    });
    
    isInitialized = true;
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('TRACE_EXTENSION_READY'));
    console.log('🎉 TRACE Extension interface created successfully');
    console.log('🔍 Verification - window.TRACE_EXTENSION:', window.TRACE_EXTENSION);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating extension interface:', error);
    return false;
  }
}

// Ensure extension interface exists
function ensureExtensionInterface() {
  if (!window.TRACE_EXTENSION || !isInitialized) {
    console.log('🔄 Re-creating extension interface...');
    createExtensionInterface();
  } else {
    console.log('✅ Extension interface already exists');
  }
}

// Initialize extension interface
function initializeExtension() {
  console.log('🚀 Initializing TRACE Extension in main world...');
  
  // Create the interface
  const success = createExtensionInterface();
  
  if (success) {
    console.log('✅ Extension initialization successful');
  } else {
    console.error('❌ Extension initialization failed');
    // Retry after a delay
    setTimeout(initializeExtension, 1000);
  }
}

// Listen for messages from React app
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  // Handle extension status checks
  if (event.data.type === 'TRACE_CHECK_EXTENSION') {
    console.log('🔍 Extension availability check received in main world');
    ensureExtensionInterface();
    window.postMessage({
      type: 'TRACE_EXTENSION_STATUS',
      available: !!window.TRACE_EXTENSION
    }, '*');
  }
});

// Monitor for navigation changes
let currentUrl = window.location.href;
function checkForNavigation() {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('🔄 Navigation detected in main world:', currentUrl);
    // Re-ensure extension interface after navigation
    setTimeout(ensureExtensionInterface, 100);
  }
}

// Initialize immediately
initializeExtension();

// Also initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
}

// And when window loads
window.addEventListener('load', initializeExtension);

// Check for navigation changes every 2 seconds
setInterval(checkForNavigation, 2000);

// Listen for popstate events (back/forward navigation)
window.addEventListener('popstate', () => {
  console.log('🔄 Popstate navigation detected in main world');
  setTimeout(ensureExtensionInterface, 100);
});

// Listen for pushstate/replacestate (programmatic navigation)
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(this, args);
  console.log('🔄 PushState navigation detected in main world');
  setTimeout(ensureExtensionInterface, 100);
};

history.replaceState = function(...args) {
  originalReplaceState.apply(this, args);
  console.log('🔄 ReplaceState navigation detected in main world');
  setTimeout(ensureExtensionInterface, 100);
};

// Periodic check to ensure extension interface persists
setInterval(() => {
  if (!window.TRACE_EXTENSION) {
    console.log('🔄 Periodic re-initialization in main world...');
    ensureExtensionInterface();
  }
}, 10000);

console.log('✅ Main world script initialized'); 