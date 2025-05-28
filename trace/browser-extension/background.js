// Background script for TRACE Academic Integrity Monitor
console.log('🔧 TRACE Extension background script loaded');

let isMonitoring = false;
let assessmentTabId = null;
let suspiciousActivities = [];

// AI tool domains to monitor
const AI_TOOL_DOMAINS = [
  'chat.openai.com',
  'chatgpt.com',
  'openai.com',
  'perplexity.ai',
  'bard.google.com',
  'gemini.google.com',
  'claude.ai',
  'anthropic.com',
  'copilot.microsoft.com',
  'bing.com/chat',
  'character.ai',
  'jasper.ai',
  'writesonic.com',
  'copy.ai',
  'grammarly.com',
  'quillbot.com'
];

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background script received message:', request, 'from sender:', sender);
  
  if (request.action === 'startMonitoring') {
    isMonitoring = true;
    assessmentTabId = sender.tab.id;
    suspiciousActivities = [];
    console.log('🚀 Started monitoring for tab:', assessmentTabId);
    sendResponse({ success: true });
  } else if (request.action === 'stopMonitoring') {
    console.log('🛑 Stopping monitoring, returning activities:', suspiciousActivities);
    isMonitoring = false;
    assessmentTabId = null;
    sendResponse({ activities: suspiciousActivities });
  } else if (request.action === 'getActivities') {
    console.log('📊 Returning current activities:', suspiciousActivities);
    sendResponse({ activities: suspiciousActivities });
  } else if (request.action === 'getStatus') {
    const status = { 
      isMonitoring: isMonitoring,
      activities: suspiciousActivities,
      assessmentTabId: assessmentTabId
    };
    console.log('📊 Returning status:', status);
    sendResponse(status);
  }
});

// Monitor tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isMonitoring || !tab.url) return;
  
  if (changeInfo.status === 'complete') {
    checkForSuspiciousActivity(tab);
  }
});

// Monitor tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (!isMonitoring) return;
  
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkForSuspiciousActivity(tab);
      
      // Check if user switched away from assessment tab
      if (assessmentTabId && activeInfo.tabId !== assessmentTabId) {
        logActivity({
          type: 'tab_switch',
          severity: 'medium',
          description: `Switched to different tab: ${tab.title}`,
          url: tab.url,
          timestamp: Date.now()
        });
      }
    }
  });
});

// Monitor new tabs
chrome.tabs.onCreated.addListener((tab) => {
  if (!isMonitoring) return;
  
  logActivity({
    type: 'new_tab',
    severity: 'low',
    description: 'New tab created during assessment',
    timestamp: Date.now()
  });
});

function checkForSuspiciousActivity(tab) {
  if (!tab.url) return;
  
  try {
    const url = new URL(tab.url);
    const domain = url.hostname.toLowerCase();
    
    // Check for AI tools
    const isAITool = AI_TOOL_DOMAINS.some(aiDomain => 
      domain.includes(aiDomain) || domain.endsWith(aiDomain)
    );
    
    if (isAITool) {
      logActivity({
        type: 'ai_tool_detected',
        severity: 'critical',
        description: `AI tool accessed: ${domain}`,
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        evidence: [
          `Domain: ${domain}`,
          `Tab title: ${tab.title}`,
          `Full URL: ${tab.url}`,
          'Accessed during assessment period'
        ]
      });
    }
    
    // Check for search engines with suspicious queries
    if (domain.includes('google.com') || domain.includes('bing.com')) {
      const searchParams = url.searchParams.get('q') || '';
      const suspiciousKeywords = [
        'essay writing', 'homework help', 'ai writing', 'chatgpt',
        'write my essay', 'essay generator', 'assignment help'
      ];
      
      const hasSuspiciousKeywords = suspiciousKeywords.some(keyword => 
        searchParams.toLowerCase().includes(keyword)
      );
      
      if (hasSuspiciousKeywords) {
        logActivity({
          type: 'suspicious_search',
          severity: 'high',
          description: `Suspicious search query: ${searchParams}`,
          url: tab.url,
          timestamp: Date.now(),
          evidence: [
            `Search query: ${searchParams}`,
            `Search engine: ${domain}`,
            'Contains academic assistance keywords'
          ]
        });
      }
    }
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
  }
}

function logActivity(activity) {
  suspiciousActivities.push(activity);
  
  // Send to assessment tab if it exists
  if (assessmentTabId) {
    chrome.tabs.sendMessage(assessmentTabId, {
      action: 'activityDetected',
      activity: activity
    }).catch(() => {
      // Tab might be closed or not ready
    });
  }
  
  console.log('Suspicious activity detected:', activity);
} 