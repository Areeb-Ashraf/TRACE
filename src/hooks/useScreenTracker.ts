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
    let statusCheckCount = 0;
    const MAX_STATUS_CHECKS = 5; // Limit status checks to prevent spam
    let statusCheckTimeout: NodeJS.Timeout;
    
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
    if (!initialCheck && statusCheckCount < MAX_STATUS_CHECKS) {
      statusCheckCount++;
      console.log(`🔄 Trying alternative extension detection (attempt ${statusCheckCount}/${MAX_STATUS_CHECKS})...`);
      window.postMessage({ type: 'TRACE_CHECK_EXTENSION' }, '*');
      
      // Listen for extension status response
      const handleExtensionStatus = (event: MessageEvent) => {
        if (event.data?.type === 'TRACE_EXTENSION_STATUS') {
          if (event.data.available) {
            console.log('✅ Extension detected via message response');
            setExtensionAvailable(true);
          } else if (event.data.error?.includes('context invalidated')) {
            console.log('⚠️ Extension context invalidated, stopping status checks');
            statusCheckCount = MAX_STATUS_CHECKS; // Stop further checks
            setExtensionAvailable(false);
          }
          window.removeEventListener('message', handleExtensionStatus);
        }
      };
      
      window.addEventListener('message', handleExtensionStatus);
      
      // Clean up listener after timeout
      statusCheckTimeout = setTimeout(() => {
        window.removeEventListener('message', handleExtensionStatus);
      }, 3000);
    }

    // Check again after a short delay only if we haven't exceeded max attempts
    const delayedCheck = setTimeout(() => {
      if (!extensionAvailable && statusCheckCount < MAX_STATUS_CHECKS) {
        statusCheckCount++;
        console.log(`🔄 Delayed extension check (attempt ${statusCheckCount}/${MAX_STATUS_CHECKS})...`);
        checkExtension();
      }
    }, 1000);

    // Listen for extension ready event
    const handleExtensionReady = () => {
      setExtensionAvailable(true);
      statusCheckCount = 0; // Reset counter on successful connection
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
      } else if (event.data?.type === 'TRACE_EXTENSION_STATUS') {
        // Handle extension status updates
        const { available, error, contextInvalidated } = event.data;
        console.log(`🔧 Extension status update: available=${available}, error=${error}, contextInvalidated=${contextInvalidated}`);
        
        const wasAvailable = extensionAvailable;
        setExtensionAvailable(available);
        
        if (wasAvailable && !available && error) {
          console.warn('⚠️ Extension became unavailable:', error);
          
          // Only log activity if not already context invalidated
          if (!error.includes('context invalidated') || statusCheckCount < MAX_STATUS_CHECKS) {
            addActivity({
              type: 'window_focus',
              severity: 'medium',
              description: 'Browser extension monitoring interrupted',
              evidence: [
                `Error: ${error}`,
                'Fallback to basic monitoring active',
                'Some AI detection features may be limited',
                contextInvalidated ? 'Extension context was invalidated' : 'Extension communication failed'
              ]
            });
          }
          
          // Stop further status checks if context is permanently invalidated
          if (contextInvalidated || error.includes('context invalidated')) {
            statusCheckCount = MAX_STATUS_CHECKS;
          }
        } else if (!wasAvailable && available) {
          console.log('✅ Extension became available again');
          statusCheckCount = 0; // Reset counter
          
          // Try to restart monitoring if we were tracking
          if (state.isTracking && (window as any).TRACE_EXTENSION?.isAvailable) {
            try {
              (window as any).TRACE_EXTENSION.startMonitoring();
              addActivity({
                type: 'window_focus',
                severity: 'low',
                description: 'Browser extension monitoring restored',
                evidence: [
                  'Extension monitoring reactivated',
                  'Full AI detection capabilities restored'
                ]
              });
            } catch (error) {
              console.warn('⚠️ Failed to restart extension monitoring:', error);
            }
          }
        }
      } else if (event.data?.type === 'TRACE_MONITORING_STARTED') {
        const { success, error } = event.data;
        if (!success && error && statusCheckCount < MAX_STATUS_CHECKS) {
          console.warn('⚠️ Extension monitoring failed to start:', error);
          addActivity({
            type: 'window_focus',
            severity: 'low',
            description: 'Extension monitoring failed to start, using basic tracking',
            evidence: [
              `Error: ${error}`,
              'Basic window focus monitoring active',
              'Limited to clipboard and visibility detection'
            ]
          });
        } else if (success) {
          console.log('✅ Extension monitoring confirmed started');
          statusCheckCount = 0; // Reset on success
        }
      }
    };

    window.addEventListener('message', handleExtensionActivity);

    return () => {
      clearTimeout(delayedCheck);
      clearTimeout(statusCheckTimeout);
      window.removeEventListener('TRACE_EXTENSION_READY', handleExtensionReady);
      window.removeEventListener('message', handleExtensionActivity);
    };
  }, [addActivity]); // Removed extensionAvailable from deps to prevent excessive re-runs

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

    // Start periodic checks with reduced frequency to prevent spam
    trackingInterval.current = setInterval(() => {
      checkForAITools();
      checkClipboard();
    }, 10000); // Increased to 10 seconds to reduce load

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
        console.log('⚠️ Extension marked as available but TRACE_EXTENSION object not found');
        
        // Only try re-initialization once to prevent loops
        let reInitAttempted = false;
        if (!reInitAttempted) {
          reInitAttempted = true;
          console.log('🔄 Requesting extension re-initialization (single attempt)...');
          window.postMessage({ type: 'TRACE_CHECK_EXTENSION' }, '*');
          
          // Wait a bit and try again, but only once
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
                addActivity({
                  type: 'window_focus',
                  severity: 'low',
                  description: 'Basic screen tracking started (extension failed after retry)',
                  evidence: ['Real-time monitoring initiated', 'Limited to window focus and clipboard monitoring']
                });
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
          }, 2000); // Give extension more time to initialize
        }
        
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
    if (!state.isTracking) {
      console.log('⚠️ Tracking already stopped, skipping...');
      return;
    }

    console.log('🛑 Stopping screen tracking...');
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

    // Only attempt to stop browser extension monitoring if extension is available and context is valid
    if (extensionAvailable && (window as any).TRACE_EXTENSION) {
      // Check if extension context is still valid before attempting to stop
      const checkExtensionContext = () => {
        try {
          // Simple test to see if we can access extension properties
          return !!(window as any).TRACE_EXTENSION.isAvailable;
        } catch (error) {
          console.warn('⚠️ Extension context test failed:', error);
          return false;
        }
      };

      if (checkExtensionContext()) {
        try {
          console.log('🛑 Attempting to stop extension monitoring...');
          (window as any).TRACE_EXTENSION.stopMonitoring();
          console.log('✅ Extension monitoring stopped successfully');
        } catch (error) {
          console.warn('⚠️ Error stopping extension monitoring (context may be invalidated):', error);
          // Don't add activity for this error as it's likely a context invalidation
        }
      } else {
        console.log('ℹ️ Extension context invalid - skipping extension stop monitoring call');
      }
    } else {
      console.log('ℹ️ Extension not available for stopping monitoring');
    }

    // Always add the tracking stopped activity regardless of extension state
    addActivity({
      type: 'window_focus',
      severity: 'low',
      description: 'Screen activity tracking stopped',
      evidence: ['Monitoring session ended', extensionAvailable ? 'Extension monitoring ended' : 'Basic monitoring ended']
    });
  }, [handleWindowFocus, handleWindowBlur, handleVisibilityChange, addActivity, extensionAvailable, state.isTracking]);

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
    let timeoutId: NodeJS.Timeout;
    let isEffectActive = true; // Flag to prevent race conditions
    
    if (isEnabled && !state.isTracking) {
      // Add a small delay to prevent rapid start/stop cycles
      timeoutId = setTimeout(() => {
        if (isEffectActive && isEnabled && !state.isTracking) {
          console.log('🎯 Auto-starting tracking...');
          startTracking();
        }
      }, 200); // Increased delay to prevent rapid cycles
    } else if (!isEnabled && state.isTracking) {
      // Only stop if we're actually tracking and the effect is still active
      timeoutId = setTimeout(() => {
        if (isEffectActive && !isEnabled && state.isTracking) {
          console.log('🎯 Auto-stopping tracking...');
          stopTracking();
        }
      }, 200); // Increased delay to prevent rapid cycles
    }

    // Return cleanup function to prevent React strict mode issues
    return () => {
      isEffectActive = false; // Mark effect as inactive
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Don't call stopTracking here - let the component handle its own lifecycle
    };
  }, [isEnabled, state.isTracking]); // Remove startTracking and stopTracking from deps to prevent loops

  // Cleanup only on actual unmount
  useEffect(() => {
    return () => {
      // Only cleanup intervals, not the extension monitoring
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, []);

  // Add cleanup for page navigation/unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.isTracking) {
        // Save final tracking data before page unload
        try {
          stopTracking();
        } catch (error) {
          console.warn('Error stopping tracking on page unload:', error);
        }
        
        // Optional: Warn user about leaving during assessment
        const message = 'You are currently being monitored for an assessment. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
      }
    };

    const handleVisibilityChangeForUnload = () => {
      // If page becomes hidden during tracking, log it
      if (document.hidden && state.isTracking) {
        addActivity({
          type: 'window_blur',
          severity: 'high',
          description: 'Assessment page hidden or user navigated away',
          evidence: [
            'Page visibility changed to hidden',
            'Potential navigation away from assessment',
            'Monitor for premature session end'
          ]
        });
      }
    };

    if (isEnabled && state.isTracking) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChangeForUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChangeForUnload);
    };
  }, [isEnabled, state.isTracking, stopTracking, addActivity]);

  return {
    ...state,
    extensionAvailable,
    startTracking,
    stopTracking,
    clearActivities,
    addActivity,
    // Add monitoring status check
    isMonitoring: state.isTracking,
    getMonitoringStatus: () => ({
      isTracking: state.isTracking,
      extensionAvailable,
      activitiesCount: state.activities.length,
      suspiciousActivityCount: state.suspiciousActivityCount,
      aiToolDetections: state.aiToolDetections
    })
  };
}; 