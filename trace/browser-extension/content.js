// Content script for TRACE Academic Integrity Monitor
// This script runs in the ISOLATED world (with Chrome API access)

console.log('🔧 TRACE Extension content script loaded on:', window.location.href);

let extensionActivities = [];
let isMonitoring = false;
let contextInvalidated = false;
let invalidationMessageSent = false; // Flag to prevent repeated messages

// Helper function to check if extension context is valid
function isExtensionContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id && !contextInvalidated);
  } catch (error) {
    if (!contextInvalidated) {
      console.warn('⚠️ Extension context check failed:', error);
      contextInvalidated = true;
    }
    return false;
  }
}

// Helper function to safely send messages to background script
function safeSendMessage(message, callback) {
  if (!isExtensionContextValid()) {
    console.warn('⚠️ Extension context not available - skipping message');
    if (callback) callback({ success: false, error: 'Extension context not available' });
    return;
  }

  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Chrome runtime error:', chrome.runtime.lastError.message);
        // Check if this is a context invalidation error
        if (chrome.runtime.lastError.message.includes('context invalidated')) {
          if (!contextInvalidated) {
            contextInvalidated = true;
            console.warn('🔄 Extension context marked as invalidated');
            // Only send status message once
            if (!invalidationMessageSent) {
              invalidationMessageSent = true;
              window.postMessage({
                type: 'TRACE_EXTENSION_STATUS',
                available: false,
                error: 'Extension context invalidated'
              }, '*');
            }
          }
        }
        if (callback) callback({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ Background script response:', response);
        if (callback) callback(response);
      }
    });
  } catch (error) {
    console.error('❌ Error sending message to background script:', error);
    if (!contextInvalidated) {
      contextInvalidated = true;
      if (!invalidationMessageSent) {
        invalidationMessageSent = true;
        window.postMessage({
          type: 'TRACE_EXTENSION_STATUS',
          available: false,
          error: 'Extension context invalidated'
        }, '*');
      }
    }
    if (callback) callback({ success: false, error: error.message });
  }
}

// Listen for messages from the main world script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  console.log('📨 Content script received message:', event.data);
  
  if (event.data.type === 'TRACE_START_MONITORING') {
    console.log('🚀 Starting monitoring via background script...');
    
    if (!isExtensionContextValid()) {
      console.warn('⚠️ Cannot start monitoring - extension context invalid');
      window.postMessage({
        type: 'TRACE_MONITORING_STARTED',
        success: false,
        error: 'Extension context not available'
      }, '*');
      return;
    }

    // Prevent duplicate monitoring
    if (isMonitoring) {
      console.log('ℹ️ Monitoring already active');
      window.postMessage({
        type: 'TRACE_MONITORING_STARTED',
        success: true
      }, '*');
      return;
    }

    // Start monitoring via extension with error handling
    safeSendMessage({ action: 'startMonitoring' }, (response) => {
      if (response?.success) {
        isMonitoring = true;
      }
      window.postMessage({
        type: 'TRACE_MONITORING_STARTED',
        success: response?.success || false,
        error: response?.error
      }, '*');
    });
    
  } else if (event.data.type === 'TRACE_STOP_MONITORING') {
    console.log('🛑 Stopping monitoring via background script...');
    
    if (!isExtensionContextValid()) {
      console.warn('⚠️ Cannot stop monitoring - extension context invalid');
      window.postMessage({
        type: 'TRACE_MONITORING_STOPPED',
        activities: [],
        error: 'Extension context not available'
      }, '*');
      return;
    }

    // Stop monitoring and get activities with error handling
    safeSendMessage({ action: 'stopMonitoring' }, (response) => {
      isMonitoring = false;
      console.log('📊 Background script activities:', response?.activities);
      window.postMessage({
        type: 'TRACE_MONITORING_STOPPED',
        activities: response?.activities || [],
        error: response?.error
      }, '*');
    });
    
  } else if (event.data.type === 'TRACE_GET_ACTIVITIES') {
    // Get current activities with error handling
    if (!isExtensionContextValid()) {
      window.postMessage({
        type: 'TRACE_ACTIVITIES_UPDATE',
        activities: [],
        error: 'Extension context not available'
      }, '*');
      return;
    }

    safeSendMessage({ action: 'getActivities' }, (response) => {
      window.postMessage({
        type: 'TRACE_ACTIVITIES_UPDATE',
        activities: response?.activities || [],
        error: response?.error
      }, '*');
    });
    
  } else if (event.data.type === 'TRACE_CHECK_EXTENSION') {
    // Respond to extension availability check
    console.log('🔍 Extension availability check received');
    const isAvailable = isExtensionContextValid();
    
    // Reset invalidation message flag if context is somehow restored
    if (isAvailable && contextInvalidated) {
      contextInvalidated = false;
      invalidationMessageSent = false;
      console.log('🎉 Extension context restored!');
    }
    
    window.postMessage({
      type: 'TRACE_EXTENSION_STATUS',
      available: isAvailable,
      extensionId: chrome.runtime?.id || 'unknown',
      contextInvalidated
    }, '*');
  }
});

// Listen for messages from background script with error handling
if (isExtensionContextValid()) {
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📨 Content script received message from background:', request);
      if (request.action === 'activityDetected') {
        console.log('🚨 Forwarding activity to web page:', request.activity);
        // Forward activity to web page
        window.postMessage({
          type: 'TRACE_ACTIVITY_DETECTED',
          activity: request.activity
        }, '*');
      }
      sendResponse({ received: true });
    });
  } catch (error) {
    console.error('❌ Error setting up message listener:', error);
    contextInvalidated = true;
  }
}

// Improved periodic health check with reduced frequency and better logic
let healthCheckCount = 0;
const MAX_HEALTH_CHECKS = 20; // Limit health checks to prevent infinite loops

setInterval(() => {
  // Stop health checks after a reasonable number of attempts
  if (contextInvalidated && healthCheckCount >= MAX_HEALTH_CHECKS) {
    console.log('🛑 Stopping health checks - context permanently invalidated');
    return;
  }
  
  healthCheckCount++;
  const wasValid = !contextInvalidated;
  const isValid = isExtensionContextValid();
  
  // Only send invalidation message once when context becomes invalid
  if (wasValid && !isValid && !invalidationMessageSent) {
    console.warn('⚠️ Extension context became invalidated');
    invalidationMessageSent = true;
    isMonitoring = false;
    window.postMessage({
      type: 'TRACE_EXTENSION_STATUS',
      available: false,
      error: 'Extension context invalidated'
    }, '*');
  }
  
  // If context is restored, reset flags
  if (!wasValid && isValid) {
    console.log('🎉 Extension context restored during health check!');
    contextInvalidated = false;
    invalidationMessageSent = false;
    healthCheckCount = 0; // Reset counter
  }
}, 5000); // Reduced frequency to 5 seconds

console.log('✅ Content script (isolated world) initialized with enhanced error handling and context management'); 