// Content script for TRACE Academic Integrity Monitor
// This script runs in the ISOLATED world (with Chrome API access)

console.log('🔧 TRACE Extension content script loaded on:', window.location.href);

let extensionActivities = [];

// Listen for messages from the main world script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  console.log('📨 Content script received message:', event.data);
  
  if (event.data.type === 'TRACE_START_MONITORING') {
    console.log('🚀 Starting monitoring via background script...');
    // Start monitoring via extension
    chrome.runtime.sendMessage({ action: 'startMonitoring' }, (response) => {
      console.log('✅ Background script response:', response);
      window.postMessage({
        type: 'TRACE_MONITORING_STARTED',
        success: response?.success || false
      }, '*');
    });
  } else if (event.data.type === 'TRACE_STOP_MONITORING') {
    console.log('🛑 Stopping monitoring via background script...');
    // Stop monitoring and get activities
    chrome.runtime.sendMessage({ action: 'stopMonitoring' }, (response) => {
      console.log('📊 Background script activities:', response?.activities);
      window.postMessage({
        type: 'TRACE_MONITORING_STOPPED',
        activities: response?.activities || []
      }, '*');
    });
  } else if (event.data.type === 'TRACE_GET_ACTIVITIES') {
    // Get current activities
    chrome.runtime.sendMessage({ action: 'getActivities' }, (response) => {
      window.postMessage({
        type: 'TRACE_ACTIVITIES_UPDATE',
        activities: response?.activities || []
      }, '*');
    });
  } else if (event.data.type === 'TRACE_CHECK_EXTENSION') {
    // Respond to extension availability check
    console.log('🔍 Extension availability check received');
    window.postMessage({
      type: 'TRACE_EXTENSION_STATUS',
      available: true
    }, '*');
  }
});

// Listen for messages from background script
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
});

console.log('✅ Content script (isolated world) initialized'); 