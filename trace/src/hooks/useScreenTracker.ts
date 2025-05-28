import { useState, useEffect, useRef, useCallback } from 'react';

export interface ScreenActivity {
  type: 'window_blur' | 'window_focus' | 'tab_change' | 'ai_tool_detected' | 'suspicious_url' | 'copy_paste';
  timestamp: number;
  duration?: number;
  url?: string;
  title?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string[];
}

export interface ScreenTrackingState {
  isWindowFocused: boolean;
  activities: ScreenActivity[];
  isTracking: boolean;
  suspiciousActivityCount: number;
  totalTimeOutOfFocus: number;
  aiToolDetections: number;
  extensionAvailable?: boolean;
}

// Known AI tools and suspicious domains
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
  'quillbot.com',
  'paraphraser.io',
  'spinbot.com',
  'rewriter.tools',
  'wordtune.com'
];

const SEARCH_DOMAINS = [
  'google.com',
  'bing.com',
  'yahoo.com',
  'duckduckgo.com',
  'ask.com',
  'baidu.com'
];

const SUSPICIOUS_KEYWORDS = [
  'essay writing',
  'homework help',
  'assignment help',
  'write my essay',
  'essay generator',
  'ai writing',
  'chatgpt',
  'artificial intelligence writing',
  'automated writing',
  'essay bot'
];

export const useScreenTracker = (isEnabled: boolean = false) => {
  const [state, setState] = useState<ScreenTrackingState>({
    isWindowFocused: true,
    activities: [],
    isTracking: false,
    suspiciousActivityCount: 0,
    totalTimeOutOfFocus: 0,
    aiToolDetections: 0
  });

  const windowBlurTime = useRef<number | null>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastClipboardContent = useRef<string>('');
  const [extensionAvailable, setExtensionAvailable] = useState(false);

  const addActivity = useCallback((activity: Omit<ScreenActivity, 'timestamp'>) => {
    const newActivity: ScreenActivity = {
      ...activity,
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      activities: [...prev.activities, newActivity],
      suspiciousActivityCount: prev.suspiciousActivityCount + (activity.severity === 'high' || activity.severity === 'critical' ? 1 : 0),
      aiToolDetections: prev.aiToolDetections + (activity.type === 'ai_tool_detected' ? 1 : 0)
    }));
  }, []);

  // Check for browser extension
  useEffect(() => {
    console.log('🔍 Checking for TRACE extension...');
    
    const checkExtension = () => {
      console.log('🔍 Extension check - window.TRACE_EXTENSION:', (window as any).TRACE_EXTENSION);
      if ((window as any).TRACE_EXTENSION?.isAvailable) {
        setExtensionAvailable(true);
        console.log('✅ TRACE browser extension detected and available');
        return true;
      } else {
        console.log('❌ TRACE browser extension not found');
        return false;
      }
    };

    // Check immediately
    const initialCheck = checkExtension();

    // If not found initially, try alternative detection methods
    if (!initialCheck) {
      // Try sending a message to trigger extension response
      console.log('🔄 Trying alternative extension detection...');
      window.postMessage({ type: 'TRACE_CHECK_EXTENSION' }, '*');
      
      // Listen for extension status response
      const handleExtensionStatus = (event: MessageEvent) => {
        if (event.data?.type === 'TRACE_EXTENSION_STATUS' && event.data.available) {
          console.log('✅ Extension detected via message response');
          setExtensionAvailable(true);
          window.removeEventListener('message', handleExtensionStatus);
        }
      };
      
      window.addEventListener('message', handleExtensionStatus);
      
      // Clean up listener after timeout
      setTimeout(() => {
        window.removeEventListener('message', handleExtensionStatus);
      }, 2000);
    }

    // Check again after a short delay (extension might load after page)
    const delayedCheck = setTimeout(() => {
      if (!extensionAvailable) {
        console.log('🔄 Delayed extension check...');
        checkExtension();
      }
    }, 1000);

    // Listen for extension ready event
    const handleExtensionReady = () => {
      setExtensionAvailable(true);
      console.log('🎉 TRACE browser extension is ready!');
    };

    window.addEventListener('TRACE_EXTENSION_READY', handleExtensionReady);

    // Listen for extension activities
    const handleExtensionActivity = (event: any) => {
      console.log('📨 Received message from extension:', event.data);
      if (event.data?.type === 'TRACE_ACTIVITY_DETECTED') {
        const activity = event.data.activity;
        console.log('🚨 Extension detected activity:', activity);
        addActivity({
          type: activity.type,
          severity: activity.severity,
          description: activity.description,
          url: activity.url,
          title: activity.title,
          evidence: activity.evidence || []
        });
      }
    };

    window.addEventListener('message', handleExtensionActivity);

    return () => {
      clearTimeout(delayedCheck);
      window.removeEventListener('TRACE_EXTENSION_READY', handleExtensionReady);
      window.removeEventListener('message', handleExtensionActivity);
    };
  }, [addActivity, extensionAvailable]);

  const checkForAITools = useCallback(async () => {
    // Note: Browser security prevents accessing other tabs/windows
    // This function now focuses on what we CAN detect
    
    try {
      // Check if current page URL contains AI tools (if user navigates within same tab)
      const currentUrl = window.location.href;
      const currentDomain = window.location.hostname.toLowerCase();
      
      // Check if current tab has been navigated to an AI tool
      const isAITool = AI_TOOL_DOMAINS.some(aiDomain => 
        currentDomain.includes(aiDomain) || currentDomain.endsWith(aiDomain)
      );
      
      if (isAITool && currentDomain !== 'localhost' && !currentDomain.includes('trace')) {
        addActivity({
          type: 'ai_tool_detected',
          severity: 'critical',
          description: `AI tool detected - navigated to ${currentDomain}`,
          url: currentUrl,
          evidence: [
            `Domain: ${currentDomain}`,
            `Full URL: ${currentUrl}`,
            `Detected during assessment session`
          ]
        });
      }
      
      // Enhanced clipboard monitoring with AI content detection
      await checkClipboard();
      
    } catch (error) {
      console.log('URL checking error:', error);
    }
  }, [addActivity]);

  const checkClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText && clipboardText !== lastClipboardContent.current) {
          const textLength = clipboardText.length;
          
          // Check for large text content (potential paste)
          if (textLength > 100) {
            // Analyze clipboard content for AI-generated patterns
            const suspiciousPatterns = [
              /I'm an AI/i,
              /as an AI/i,
              /I cannot/i,
              /I don't have the ability/i,
              /I'm not able to/i,
              /as a language model/i,
              /I'm Claude/i,
              /I'm ChatGPT/i,
              /I'm GPT/i,
              /generated by AI/i,
              /artificial intelligence/i
            ];
            
            const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
              pattern.test(clipboardText)
            );
            
            const severity = hasSuspiciousContent ? 'critical' : 
                           textLength > 500 ? 'high' : 'medium';
            
            const evidence = [
              `Content length: ${textLength} characters`,
              `Content preview: ${clipboardText.substring(0, 100)}...`,
              hasSuspiciousContent ? 'Contains AI-generated content patterns' : 'Large text paste detected'
            ];
            
            if (hasSuspiciousContent) {
              evidence.push('Suspicious phrases detected in clipboard');
            }
            
            addActivity({
              type: 'copy_paste',
              severity,
              description: hasSuspiciousContent 
                ? `Suspicious AI-generated content detected in clipboard`
                : `Large text content detected in clipboard`,
              evidence
            });
          }
          
          lastClipboardContent.current = clipboardText;
        }
      }
    } catch (error) {
      // Clipboard access denied or not available
      console.log('Clipboard access not available');
    }
  }, [addActivity]);

  const handleWindowFocus = useCallback(() => {
    if (windowBlurTime.current) {
      const duration = Date.now() - windowBlurTime.current;
      const durationSeconds = Math.round(duration / 1000);
      
      setState(prev => ({
        ...prev,
        isWindowFocused: true,
        totalTimeOutOfFocus: prev.totalTimeOutOfFocus + duration
      }));

      // More detailed severity assessment
      let severity: ScreenActivity['severity'] = 'low';
      let suspicionLevel = '';
      
      if (duration > 120000) { // 2+ minutes
        severity = 'critical';
        suspicionLevel = 'Extended absence - high risk of external assistance';
      } else if (duration > 60000) { // 1+ minute
        severity = 'high';
        suspicionLevel = 'Significant time away - potential resource access';
      } else if (duration > 30000) { // 30+ seconds
        severity = 'medium';
        suspicionLevel = 'Moderate absence - possible distraction or resource check';
      } else if (duration > 10000) { // 10+ seconds
        severity = 'medium';
        suspicionLevel = 'Brief absence - minor concern';
      } else {
        severity = 'low';
        suspicionLevel = 'Very brief focus loss - likely accidental';
      }

      addActivity({
        type: 'window_focus',
        severity,
        description: `Assessment window regained focus after ${durationSeconds} seconds`,
        duration,
        evidence: [
          `Time out of focus: ${durationSeconds} seconds`,
          `Risk assessment: ${suspicionLevel}`,
          `Total time away this session: ${Math.round((state.totalTimeOutOfFocus + duration) / 1000)} seconds`,
          duration > 30000 ? 'Sufficient time to access external resources' : 'Brief interruption'
        ]
      });

      windowBlurTime.current = null;
    }
  }, [addActivity, state.totalTimeOutOfFocus]);

  const handleWindowBlur = useCallback(() => {
    windowBlurTime.current = Date.now();
    
    setState(prev => ({
      ...prev,
      isWindowFocused: false
    }));

    addActivity({
      type: 'window_blur',
      severity: 'medium',
      description: 'Assessment window lost focus - student switched away',
      evidence: [
        'Student navigated to another tab, window, or application',
        'Potential access to external resources',
        'Monitoring focus loss duration',
        `Time of focus loss: ${new Date().toLocaleTimeString()}`
      ]
    });
  }, [addActivity]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      handleWindowBlur();
    } else {
      handleWindowFocus();
    }
  }, [handleWindowBlur, handleWindowFocus]);

  const startTracking = useCallback(() => {
    if (!isEnabled) return;

    console.log('🚀 Starting screen tracking...');
    console.log('🔧 Extension available:', extensionAvailable);
    console.log('🔧 TRACE_EXTENSION object:', (window as any).TRACE_EXTENSION);

    setState(prev => ({ ...prev, isTracking: true }));

    // Add event listeners
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start periodic checks
    trackingInterval.current = setInterval(() => {
      checkForAITools();
      checkClipboard();
    }, 5000); // Check every 5 seconds

    // Initial check
    checkForAITools();

    // Start browser extension monitoring if available
    if (extensionAvailable) {
      // Double-check that the extension object actually exists
      if ((window as any).TRACE_EXTENSION?.isAvailable) {
        console.log('🎯 Starting extension monitoring...');
        try {
          (window as any).TRACE_EXTENSION.startMonitoring();
          console.log('✅ Extension monitoring started successfully');
          addActivity({
            type: 'window_focus',
            severity: 'low',
            description: 'Enhanced screen tracking started (browser extension active)',
            evidence: ['Real-time monitoring initiated', 'Browser extension providing tab monitoring']
          });
        } catch (error) {
          console.error('❌ Error starting extension monitoring:', error);
          addActivity({
            type: 'window_focus',
            severity: 'low',
            description: 'Basic screen tracking started (extension error)',
            evidence: ['Real-time monitoring initiated', 'Extension failed to start: ' + error]
          });
        }
      } else {
        console.log('⚠️ Extension marked as available but TRACE_EXTENSION object not found, requesting re-initialization...');
        // Request extension re-initialization
        window.postMessage({ type: 'TRACE_CHECK_EXTENSION' }, '*');
        
        // Wait a bit and try again
        setTimeout(() => {
          if ((window as any).TRACE_EXTENSION?.isAvailable) {
            console.log('🎯 Extension now available after re-initialization, starting monitoring...');
            try {
              (window as any).TRACE_EXTENSION.startMonitoring();
              console.log('✅ Extension monitoring started successfully (after retry)');
              addActivity({
                type: 'window_focus',
                severity: 'low',
                description: 'Enhanced screen tracking started (browser extension active after retry)',
                evidence: ['Real-time monitoring initiated', 'Browser extension providing tab monitoring']
              });
            } catch (error) {
              console.error('❌ Error starting extension monitoring after retry:', error);
            }
          } else {
            console.log('⚠️ Extension still not available after retry, using basic monitoring');
            addActivity({
              type: 'window_focus',
              severity: 'low',
              description: 'Basic screen tracking started (extension unavailable after retry)',
              evidence: ['Real-time monitoring initiated', 'Limited to window focus and clipboard monitoring']
            });
          }
        }, 1000);
        
        addActivity({
          type: 'window_focus',
          severity: 'low',
          description: 'Basic screen tracking started (extension re-initializing)',
          evidence: ['Real-time monitoring initiated', 'Waiting for extension re-initialization']
        });
      }
    } else {
      console.log('⚠️ Extension not available, using basic monitoring');
      addActivity({
        type: 'window_focus',
        severity: 'low',
        description: 'Basic screen tracking started (browser extension not available)',
        evidence: ['Real-time monitoring initiated', 'Limited to window focus and clipboard monitoring']
      });
    }
  }, [isEnabled, handleWindowFocus, handleWindowBlur, handleVisibilityChange, checkForAITools, checkClipboard, addActivity, extensionAvailable]);

  const stopTracking = useCallback(() => {
    setState(prev => ({ ...prev, isTracking: false }));

    // Remove event listeners
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    // Clear interval
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }

    // Stop browser extension monitoring if available
    if (extensionAvailable && (window as any).TRACE_EXTENSION) {
      (window as any).TRACE_EXTENSION.stopMonitoring();
    }

    addActivity({
      type: 'window_focus',
      severity: 'low',
      description: 'Screen activity tracking stopped',
      evidence: ['Monitoring session ended']
    });
  }, [handleWindowFocus, handleWindowBlur, handleVisibilityChange, addActivity, extensionAvailable]);

  const clearActivities = useCallback(() => {
    setState(prev => ({
      ...prev,
      activities: [],
      suspiciousActivityCount: 0,
      totalTimeOutOfFocus: 0,
      aiToolDetections: 0
    }));
  }, []);

  // Auto-start/stop tracking based on isEnabled
  useEffect(() => {
    if (isEnabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isEnabled, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, []);

  return {
    ...state,
    extensionAvailable,
    startTracking,
    stopTracking,
    clearActivities,
    addActivity
  };
}; 