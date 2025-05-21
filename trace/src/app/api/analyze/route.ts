import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface EditorAction {
  type: string;
  content?: string;
  position?: { from: number; to: number };
  timestamp: number;
  pauseDuration?: number;
}

interface AnalysisResult {
  isHuman: boolean;
  confidenceScore: number;
  metrics: {
    averageTypingSpeed: number;
    pauseFrequency: number;
    deletionRate: number;
    cursorJumpFrequency: number;
    rhythmConsistency: number;
    pausePatterns: {
      beforeDifficultWords: number;
      atPunctuations: number;
    };
  };
  anomalies: string[];
  referenceComparison?: {
    overall: number;
    typingSpeed: number;
    rhythm: number;
    deletionRate: number;
    pauseFrequency: number;
  };
  aiTextDetection?: {
    isAiGenerated: boolean;
    score: number;
    provider: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { actions, referenceActions, textContent } = await request.json();
    
    // Analyze typing behavior
    const result = await analyzeTypingBehavior(actions, referenceActions, textContent);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing data:', error);
    return NextResponse.json(
      { error: 'Failed to analyze typing behavior' },
      { status: 500 }
    );
  }
}

async function analyzeTypingBehavior(
  actions: EditorAction[],
  referenceActions?: EditorAction[],
  textContent?: string
): Promise<AnalysisResult> {
  // Calculate metrics from actions
  const metrics = calculateMetrics(actions);
  
  // Detect paste events - we'll use this to more heavily penalize
  const pasteEvents = detectPasteEvents(actions);
  const hasPasteEvents = pasteEvents.length > 0;
  
  // Compare with reference behaviors if available
  let comparisonScore = null;
  let referenceComparison = undefined;
  
  if (referenceActions && referenceActions.length > 0) {
    const referenceMetrics = calculateMetrics(referenceActions);
    const comparison = compareWithReference(metrics, referenceMetrics);
    comparisonScore = comparison.overall;
    referenceComparison = comparison;
  }
  
  // Check for suspicious patterns
  const anomalies = detectAnomalies(actions, metrics, 
    comparisonScore !== null && comparisonScore < 0.5, pasteEvents);
  
  // Add AI text detection if we have content to analyze
  let aiTextDetection = undefined;
  if (textContent && textContent.trim().length > 50) {
    aiTextDetection = await detectAiGeneratedText(textContent);
  }
  
  // Determine if likely human based on collected metrics
  const humanPatterns = detectHumanPatterns(actions, metrics);
  
  // Calculate final scores with more weight on reference comparison if available
  let confidenceScore = 0;
  if (comparisonScore !== null) {
    // If we have reference data, heavily weight the comparison
    // The more reference actions we have, the more we trust the comparison
    const referenceDataWeight = Math.min(0.8, 0.6 + (referenceActions!.length / 5000));
    confidenceScore = comparisonScore * referenceDataWeight + humanPatterns * (1 - referenceDataWeight);
  } else {
    // Otherwise rely on human pattern detection
    confidenceScore = humanPatterns;
  }
  
  // Apply penalties for highly suspicious behaviors to be stricter
  if (hasPasteEvents) {
    // Apply a significant penalty for each paste event detected, but scale with the number
    // so we don't overly punish a user who made a single paste
    const pastePenalty = Math.min(0.7, 0.2 * pasteEvents.length);
    confidenceScore = Math.max(0, confidenceScore - pastePenalty);
  }

  // Stricter penalties for unusually high typing speeds
  if (metrics.averageTypingSpeed > 200) {
    const speedPenalty = Math.min(0.5, (metrics.averageTypingSpeed - 200) / 400);
    confidenceScore = Math.max(0, confidenceScore - speedPenalty);
  }

  // Stricter penalties for unnaturally consistent rhythm
  if (metrics.rhythmConsistency > 0.9) {
    const rhythmPenalty = (metrics.rhythmConsistency - 0.9) * 5; // scale from 0 to 0.5
    confidenceScore = Math.max(0, confidenceScore - rhythmPenalty);
  }

  // If AI text detection suggests AI-generated content, reduce confidence further
  if (aiTextDetection && aiTextDetection.isAiGenerated) {
    const aiPenalty = aiTextDetection.score * 0.3;
    confidenceScore = Math.max(0, confidenceScore - aiPenalty);
  }
  
  // Be more strict with the threshold 
  // We now consider anything below 0.65 as suspicious
  const isHuman = confidenceScore > 0.65;
  
  return {
    isHuman,
    confidenceScore,
    metrics,
    anomalies,
    ...(referenceComparison && { referenceComparison }),
    ...(aiTextDetection && { aiTextDetection })
  };
}

function calculateMetrics(actions: EditorAction[]) {
  // Filter actions by type
  const inserts = actions.filter(a => a.type === 'insert');
  const deletes = actions.filter(a => a.type === 'delete');
  const cursorMoves = actions.filter(a => a.type === 'cursor');
  const pauses = actions.filter(a => a.type === 'pause');
  
  // Calculate timing between keystrokes
  const keyIntervals: number[] = [];
  for (let i = 1; i < inserts.length; i++) {
    keyIntervals.push(inserts[i].timestamp - inserts[i-1].timestamp);
  }
  
  // Calculate average typing speed (chars per minute)
  const totalTypingTime = inserts.length > 1 
    ? inserts[inserts.length - 1].timestamp - inserts[0].timestamp 
    : 0;
  const charCount = inserts.reduce((sum, a) => sum + (a.content?.length || 0), 0);
  const averageTypingSpeed = totalTypingTime > 0 
    ? (charCount / totalTypingTime) * 60000 
    : 0;
  
  // Calculate pause frequency
  const pauseFrequency = pauses.length / Math.max(1, actions.length);
  
  // Calculate deletion rate
  const deletionRate = deletes.length / Math.max(1, inserts.length);
  
  // Calculate cursor jump frequency
  const cursorJumpFrequency = cursorMoves.length / Math.max(1, actions.length);
  
  // Measure rhythm consistency (standard deviation of intervals)
  const mean = keyIntervals.reduce((sum, val) => sum + val, 0) / Math.max(1, keyIntervals.length);
  const variance = keyIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 
    Math.max(1, keyIntervals.length);
  const rhythmConsistency = 1 - Math.min(1, Math.sqrt(variance) / mean);
  
  // Analyze pause patterns
  const pausePatterns = {
    beforeDifficultWords: 0,
    atPunctuations: 0
  };
  
  return {
    averageTypingSpeed,
    pauseFrequency,
    deletionRate,
    cursorJumpFrequency,
    rhythmConsistency,
    pausePatterns
  };
}

function compareWithReference(currentMetrics: any, referenceMetrics: any) {
  // Calculate similarity scores for each metric with adjustable tolerances
  const speedSimilarity = calculateSimilarity(
    currentMetrics.averageTypingSpeed, 
    referenceMetrics.averageTypingSpeed,
    Math.max(20, referenceMetrics.averageTypingSpeed * 0.25) // 25% tolerance or 20 CPM minimum
  );
  
  const pauseSimilarity = calculateSimilarity(
    currentMetrics.pauseFrequency,
    referenceMetrics.pauseFrequency,
    Math.max(0.1, referenceMetrics.pauseFrequency * 0.5) // 50% tolerance or 0.1 minimum
  );
  
  const deletionSimilarity = calculateSimilarity(
    currentMetrics.deletionRate,
    referenceMetrics.deletionRate,
    Math.max(0.1, referenceMetrics.deletionRate * 0.5) // 50% tolerance or 0.1 minimum
  );
  
  const rhythmSimilarity = calculateSimilarity(
    currentMetrics.rhythmConsistency,
    referenceMetrics.rhythmConsistency,
    0.25 // More tolerance for rhythm variability
  );
  
  // Weight different features
  const overall = (
    speedSimilarity * 0.25 +
    pauseSimilarity * 0.25 +
    deletionSimilarity * 0.2 +
    rhythmSimilarity * 0.3
  );
  
  return {
    overall,
    typingSpeed: speedSimilarity,
    rhythm: rhythmSimilarity,
    deletionRate: deletionSimilarity,
    pauseFrequency: pauseSimilarity
  };
}

function calculateSimilarity(value1: number, value2: number, tolerance: number): number {
  const diff = Math.abs(value1 - value2);
  return Math.max(0, 1 - diff / tolerance);
}

function detectAnomalies(
  actions: EditorAction[], 
  metrics: any, 
  skipGenericChecks: boolean = false,
  pasteEvents: EditorAction[] = []
): string[] {
  const anomalies: string[] = [];
  
  // Skip generic checks if we have good reference data, as personal typing habits can vary
  if (!skipGenericChecks) {
    // Check for unnaturally consistent typing rhythm - made stricter
    if (metrics.rhythmConsistency > 0.9) {
      anomalies.push('Suspiciously consistent typing rhythm');
    }
    
    // Check for lack of normal pauses
    if (metrics.pauseFrequency < 0.005) {
      anomalies.push('Abnormally few pauses while typing');
    }
    
    // Check for abnormally high typing speed - made stricter
    if (metrics.averageTypingSpeed > 180) { // Extremely fast typing
      anomalies.push(`Unusually high typing speed (${Math.round(metrics.averageTypingSpeed)} CPM)`);
    }
  }

  // Always check for paste events - now with more detailed reporting
  if (pasteEvents.length > 0) {
    // Determine approximately how much content was pasted
    const pastedCharCount = pasteEvents.reduce((sum, event) => 
      sum + (event.content?.length || 0), 0);
    
    // Calculate what percentage of total content was pasted
    const totalCharCount = actions
      .filter(a => a.type === 'insert' && a.content)
      .reduce((sum, a) => sum + (a.content?.length || 0), 0);
    
    const pastePercentage = totalCharCount > 0 
      ? Math.round((pastedCharCount / totalCharCount) * 100) 
      : 0;
    
    anomalies.push(
      `Detected ${pasteEvents.length} paste event(s) accounting for approximately ${pastePercentage}% of content`
    );
  }
  
  // Check for lack of corrections/edits
  if (metrics.deletionRate === 0) {
    anomalies.push('No corrections or deletions made (unusual for human typing)');
  }
  
  return anomalies;
}

function detectHumanPatterns(actions: EditorAction[], metrics: any): number {
  let score = 0;
  
  // Use more graduated scoring to avoid binary classification
  
  // Humans typically make errors and correct them
  if (metrics.deletionRate > 0) {
    if (metrics.deletionRate <= 0.01) {
      score += 0.1; // Very few deletions
    } else if (metrics.deletionRate <= 0.05) {
      score += 0.15; // Low deletions
    } else if (metrics.deletionRate <= 0.2) {
      score += 0.2; // Normal deletions
    } else {
      score += 0.15; // High deletions
    }
  }
  
  // Humans typically have natural pauses
  if (metrics.pauseFrequency > 0) {
    if (metrics.pauseFrequency <= 0.01) {
      score += 0.05; // Very few pauses
    } else if (metrics.pauseFrequency <= 0.05) {
      score += 0.1; // Low pauses
    } else if (metrics.pauseFrequency <= 0.2) {
      score += 0.15; // Normal pauses
    } else {
      score += 0.1; // High pauses
    }
  }
  
  // Human typing speeds vary widely based on skill - stricter now
  if (metrics.averageTypingSpeed <= 15) {
    score += 0.05; // Very slow typing
  } else if (metrics.averageTypingSpeed <= 40) {
    score += 0.15; // Slow typing
  } else if (metrics.averageTypingSpeed <= 80) {
    score += 0.2; // Average typing
  } else if (metrics.averageTypingSpeed <= 120) {
    score += 0.2; // Fast typing
  } else if (metrics.averageTypingSpeed <= 180) {
    score += 0.1; // Very fast typing
  } else {
    score += 0.02; // Extremely fast typing - more suspicious
  }
  
  // Humans typically have some rhythm inconsistency - stricter now
  if (metrics.rhythmConsistency <= 0.3) {
    score += 0.1; // Very inconsistent
  } else if (metrics.rhythmConsistency <= 0.6) {
    score += 0.25; // Normal inconsistency
  } else if (metrics.rhythmConsistency <= 0.85) {
    score += 0.2; // Somewhat consistent
  } else if (metrics.rhythmConsistency <= 0.9) {
    score += 0.05; // Very consistent - reduced score
  } else {
    score += 0; // Too consistent to be human
  }
  
  // Humans move their cursor around while editing
  if (metrics.cursorJumpFrequency >= 0.01) {
    score += 0.2;
  } else if (metrics.cursorJumpFrequency > 0) {
    score += 0.1;
  }
  
  return Math.min(1.0, score);
}

function detectPasteEvents(actions: EditorAction[]): EditorAction[] {
  const possiblePasteEvents: EditorAction[] = [];
  const insertActions = actions.filter(a => a.type === 'insert' && a.content);
  
  // Track keyboard vs. content events
  const keyboardKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 'Enter', 
                        'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  
  // Analyze insertions for patterns that suggest pasting
  for (let i = 0; i < insertActions.length; i++) {
    const action = insertActions[i];
    
    // Check for specific paste indicators:
    
    // 1. Large content inserted at once (>15 chars) - threshold lowered
    if (action.content && action.content.length > 15) {
      // Ensure it's not a keyboard action
      if (!keyboardKeys.includes(action.content)) {
        possiblePasteEvents.push(action);
        continue;
      }
    }
    
    // 2. Check for Ctrl+V sequence (if we have such detailed tracking)
    if (i >= 2) {
      const prevActions = [insertActions[i-2], insertActions[i-1], action];
      const ctrlKeyDown = prevActions.some(a => a.content === 'Control');
      const vKeyDown = prevActions.some(a => a.content === 'v' || a.content === 'V');
      
      if (ctrlKeyDown && vKeyDown && action.content && action.content.length > 3) {
        possiblePasteEvents.push(action);
        continue;
      }
    }
    
    // 3. Sudden burst of content after a pause
    if (i > 0 && action.content && action.content.length > 8) { // Threshold lowered
      const prevAction = insertActions[i-1];
      const timeDiff = action.timestamp - prevAction.timestamp;
      
      // If there was a significant pause followed by a lot of content
      if (timeDiff > 400 && action.content.length > prevAction.content?.length! * 4) {
        possiblePasteEvents.push(action);
      }
    }
  }
  
  return possiblePasteEvents;
}

// AI Text Detection using external API
async function detectAiGeneratedText(text: string): Promise<{ isAiGenerated: boolean, score: number, provider: string }> {
  try {
    // API keys should be stored as environment variables, not hardcoded
    // Here we're using ZeroGPT API as requested, but would use proper authentication in production
    const response = await fetch('https://api.zerogpt.com/api/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real setup, we'd use: 'Authorization': `Bearer ${process.env.ZEROGPT_API_KEY}`
      },
      body: JSON.stringify({ text })
    });

    // For testing purposes, if the API call fails, we'll use a mock response
    // In production, we would properly handle the API response
    if (!response.ok) {
      console.warn('AI detection API call failed, using mock response');
      // Do a simple heuristic check for now
      const mockScore = Math.random() * 0.3 + (text.length > 200 ? 0.4 : 0.1); // Add some randomness
      return {
        isAiGenerated: mockScore > 0.6,
        score: mockScore,
        provider: 'MockDetection'
      };
    }

    const data = await response.json();
    return {
      isAiGenerated: data.isAiGenerated || data.score > 0.6,
      score: data.score || 0,
      provider: 'ZeroGPT'
    };
  } catch (error) {
    console.error('Error with AI text detection:', error);
    // Fallback detection logic
    return {
      isAiGenerated: false,
      score: 0,
      provider: 'Failed'
    };
  }
} 