import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { S3Service } from '@/lib/s3';

interface EditorAction {
  type: string;
  content?: string;
  position?: { from: number; to: number };
  timestamp: number;
  pauseDuration?: number;
  flightTime?: number;
  dwellTime?: number;
}

interface DetailedMetrics {
  // Basic metrics
  averageTypingSpeed: number;
  standardDeviationTypingSpeed: number;
  pauseFrequency: number;
  deletionRate: number;
  cursorJumpFrequency: number;
  rhythmConsistency: number;
  
  // Advanced metrics
  burstiness: number; // Measure of typing in bursts vs steady
  dwellTimeVariability: number;
  flightTimeVariability: number;
  backtrackingFrequency: number;
  correctionPatterns: number;
  
  // Temporal patterns
  typingAcceleration: number; // How typing speed changes over time
  fatigueIndicators: number;
  consistencyScore: number;
  
  // Pause analysis
  pausePatterns: {
    shortPauses: number; // < 2 seconds
    mediumPauses: number; // 2-10 seconds
    longPauses: number; // > 10 seconds
    averagePauseLength: number;
    pauseDistribution: number[];
  };
  
  // Content-based metrics
  wordsPerMinute: number;
  charactersPerMinute: number;
  revisionsPerWord: number;
}

interface SuspiciousActivity {
  type: 'paste' | 'speed_anomaly' | 'rhythm_anomaly' | 'pause_anomaly' | 'ai_content' | 'behavior_deviation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  confidence: number;
  timestamp?: number;
  affectedContent?: string;
}

interface ReferenceComparison {
  overall: number;
  breakdown: {
    typingSpeed: { similarity: number; deviation: number; explanation: string };
    rhythm: { similarity: number; deviation: number; explanation: string };
    pausePatterns: { similarity: number; deviation: number; explanation: string };
    deletionRate: { similarity: number; deviation: number; explanation: string };
    dwellTime: { similarity: number; deviation: number; explanation: string };
    flightTime: { similarity: number; deviation: number; explanation: string };
  };
  statisticalSignificance: number;
  profileMatchScore: number;
}

interface AnalysisResult {
  isHuman: boolean;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metrics: DetailedMetrics;
  suspiciousActivities: SuspiciousActivity[];
  referenceComparison?: ReferenceComparison;
  aiTextDetection?: {
    isAiGenerated: boolean;
    score: number;
    provider: string;
    error?: string;
    // Enhanced GPTZero data
    details?: {
      version: string;
      scanId: string;
      predictedClass: 'human' | 'ai' | 'mixed';
      confidenceCategory: 'high' | 'medium' | 'low';
      classProbabilities: {
        human: number;
        ai: number;
        mixed: number;
      };
      completelyGeneratedProb: number;
      averageGeneratedProb: number;
      sentences?: Array<{
        sentence: string;
        generatedProb: number;
        perplexity: number;
        highlightForAi: boolean;
      }>;
      paragraphs?: Array<{
        startSentenceIndex: number;
        numSentences: number;
        completelyGeneratedProb: number;
      }>;
    };
  };
  summary: {
    totalFlags: number;
    highRiskFlags: number;
    behaviorScore: number;
    contentScore: number;
    overallAssessment: string;
  };
  timeline: {
    timestamp: number;
    event: string;
    risk: 'low' | 'medium' | 'high';
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { actions, referenceActions, textContent, submissionId } = await request.json();
    
    if (!actions || actions.length === 0) {
      return NextResponse.json(
        { error: 'No actions provided for analysis' },
        { status: 400 }
      );
    }
    
    // Save essay content to S3 if provided and submissionId exists
    let essayS3Key = null;
    if (textContent && submissionId) {
      try {
        essayS3Key = await S3Service.uploadEssayContent(
          submissionId,
          textContent
        );
        console.log('Essay content saved to S3:', essayS3Key);
      } catch (error) {
        console.error('Failed to save essay to S3:', error);
        // Continue with analysis even if S3 upload fails
      }
    }
    
    // Analyze typing behavior
    const result = await analyzeTypingBehavior(actions, referenceActions, textContent);
    
    // Add essay S3 key to the result for future reference
    return NextResponse.json({
      ...result,
      essayS3Key,
      textContent // Keep textContent for immediate use
    });
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
  
  // Calculate detailed metrics
  const metrics = calculateDetailedMetrics(actions);
  
  // Detect suspicious activities
  const suspiciousActivities = detectSuspiciousActivities(actions, metrics);
  
  // Compare with reference data if available
  let referenceComparison: ReferenceComparison | undefined;
  if (referenceActions && referenceActions.length > 0) {
    referenceComparison = compareWithReferenceData(metrics, referenceActions);
    
    // Add reference-based suspicious activities
    const referenceAnomalies = detectReferenceDeviations(metrics, referenceActions);
    suspiciousActivities.push(...referenceAnomalies);
  }
  
  // AI text detection with proper error handling
  let aiTextDetection: { isAiGenerated: boolean; score: number; provider: string; error?: string } | undefined;
  if (textContent && textContent.trim().length > 50) {
    try {
      aiTextDetection = await detectAiGeneratedText(textContent);
      
      // Add AI detection results to suspicious activities if flagged
      if (aiTextDetection.isAiGenerated) {
        suspiciousActivities.push({
          type: 'ai_content',
          severity: aiTextDetection.score > 0.8 ? 'critical' : aiTextDetection.score > 0.6 ? 'high' : 'medium',
          description: `Content flagged as AI-generated with ${Math.round(aiTextDetection.score * 100)}% confidence`,
          evidence: [`AI detection score: ${aiTextDetection.score}`, `Provider: ${aiTextDetection.provider}`],
          confidence: aiTextDetection.score
        });
      }
    } catch (error) {
      console.error('AI detection failed:', error);
      aiTextDetection = {
        isAiGenerated: false,
        score: 0,
        provider: 'GPTZero (Error)',
        error: 'GPTZero API error. Manual review recommended.'
      };
    }
  }
  
  // Calculate sophisticated confidence score
  const { confidenceScore, riskLevel, behaviorScore, contentScore } = calculateAdvancedConfidenceScore(
    metrics,
    suspiciousActivities,
    referenceComparison,
    aiTextDetection
  );
  
  // Generate timeline of events
  const timeline = generateEventTimeline(actions, suspiciousActivities);
  
  // Create summary assessment
  const summary = createSummaryAssessment(suspiciousActivities, behaviorScore, contentScore);
  
  return {
    isHuman: confidenceScore > 0.7 && riskLevel !== 'critical',
    confidenceScore,
    riskLevel,
    metrics,
    suspiciousActivities,
    referenceComparison,
    aiTextDetection,
    summary,
    timeline
  };
}

function calculateDetailedMetrics(actions: EditorAction[]): DetailedMetrics {
  const inserts = actions.filter(a => a.type === 'insert' || a.type === 'keydown');
  const deletes = actions.filter(a => a.type === 'delete');
  const cursorMoves = actions.filter(a => a.type === 'cursor');
  const pauses = actions.filter(a => a.type === 'pause');
  const keydowns = actions.filter(a => a.type === 'keydown');
  const keyups = actions.filter(a => a.type === 'keyup');
  
  // Calculate typing speeds over time
  const typingSpeeds: number[] = [];
  const timeWindows = 10000; // 10 second windows
  
  for (let i = 0; i < actions.length; i += 50) { // Sample every 50 actions
    const windowActions = actions.slice(i, i + 50);
    if (windowActions.length > 1) {
      const timeSpan = windowActions[windowActions.length - 1].timestamp - windowActions[0].timestamp;
      const charCount = windowActions.filter(a => a.content).reduce((sum, a) => sum + (a.content?.length || 0), 0);
      if (timeSpan > 0) {
        typingSpeeds.push((charCount / timeSpan) * 60000);
      }
    }
  }
  
  // Basic speed calculations
  const totalTime = actions.length > 1 ? actions[actions.length - 1].timestamp - actions[0].timestamp : 0;
  const totalChars = inserts.reduce((sum, a) => sum + (a.content?.length || 0), 0);
  const averageTypingSpeed = totalTime > 0 ? (totalChars / totalTime) * 60000 : 0;
  const wordsPerMinute = averageTypingSpeed / 5; // Assuming 5 chars per word
  
  // Speed variability
  const speedMean = typingSpeeds.reduce((sum, speed) => sum + speed, 0) / Math.max(1, typingSpeeds.length);
  const speedVariance = typingSpeeds.reduce((sum, speed) => sum + Math.pow(speed - speedMean, 2), 0) / Math.max(1, typingSpeeds.length);
  const standardDeviationTypingSpeed = Math.sqrt(speedVariance);
  
  // Dwell and flight time analysis
  const dwellTimes = keydowns.filter(a => a.dwellTime).map(a => a.dwellTime!);
  const flightTimes = keydowns.filter(a => a.flightTime).map(a => a.flightTime!);
  
  const dwellTimeVariability = calculateVariabilityScore(dwellTimes);
  const flightTimeVariability = calculateVariabilityScore(flightTimes);
  
  // Rhythm consistency (more sophisticated)
  const keyIntervals: number[] = [];
  for (let i = 1; i < inserts.length; i++) {
    keyIntervals.push(inserts[i].timestamp - inserts[i-1].timestamp);
  }
  
  const intervalMean = keyIntervals.reduce((sum, val) => sum + val, 0) / Math.max(1, keyIntervals.length);
  const intervalVariance = keyIntervals.reduce((sum, val) => sum + Math.pow(val - intervalMean, 2), 0) / Math.max(1, keyIntervals.length);
  const rhythmConsistency = intervalMean > 0 ? 1 - Math.min(1, Math.sqrt(intervalVariance) / intervalMean) : 0;
  
  // Burstiness calculation (measure of typing in bursts vs steady flow)
  const burstiness = calculateBurstiness(keyIntervals);
  
  // Pause analysis
  const shortPauses = pauses.filter(p => p.pauseDuration && p.pauseDuration < 2000).length;
  const mediumPauses = pauses.filter(p => p.pauseDuration && p.pauseDuration >= 2000 && p.pauseDuration < 10000).length;
  const longPauses = pauses.filter(p => p.pauseDuration && p.pauseDuration >= 10000).length;
  const pauseLengths = pauses.filter(p => p.pauseDuration).map(p => p.pauseDuration!);
  const averagePauseLength = pauseLengths.reduce((sum, len) => sum + len, 0) / Math.max(1, pauseLengths.length);
  
  // Correction patterns
  const deletionRate = deletes.length / Math.max(1, inserts.length);
  const backtrackingEvents = cursorMoves.filter(move => {
    // Detect cursor moving backwards significantly
    return move.position && move.position.from < move.position.to - 10;
  });
  const backtrackingFrequency = backtrackingEvents.length / Math.max(1, actions.length);
  
  // Typing acceleration (how speed changes over time)
  const typingAcceleration = calculateTypingAcceleration(typingSpeeds);
  
  // Fatigue indicators (speed decreasing over time)
  const fatigueIndicators = calculateFatigueScore(typingSpeeds);
  
  // Overall consistency
  const consistencyScore = calculateConsistencyScore(typingSpeeds, keyIntervals, pauseLengths);
  
  return {
    averageTypingSpeed,
    standardDeviationTypingSpeed,
    pauseFrequency: pauses.length / Math.max(1, actions.length),
    deletionRate,
    cursorJumpFrequency: cursorMoves.length / Math.max(1, actions.length),
    rhythmConsistency,
    burstiness,
    dwellTimeVariability,
    flightTimeVariability,
    backtrackingFrequency,
    correctionPatterns: deletionRate,
    typingAcceleration,
    fatigueIndicators,
    consistencyScore,
    pausePatterns: {
      shortPauses,
      mediumPauses,
      longPauses,
      averagePauseLength,
      pauseDistribution: [shortPauses, mediumPauses, longPauses]
    },
    wordsPerMinute,
    charactersPerMinute: averageTypingSpeed,
    revisionsPerWord: (deletes.length / Math.max(1, wordsPerMinute)) || 0
  };
}

function detectSuspiciousActivities(actions: EditorAction[], metrics: DetailedMetrics): SuspiciousActivity[] {
  const activities: SuspiciousActivity[] = [];
  
  // Detect paste events with more sophistication
  const pasteEvents = detectAdvancedPasteEvents(actions);
  pasteEvents.forEach(paste => {
    activities.push({
      type: 'paste',
      severity: paste.confidence > 0.8 ? 'high' : 'medium',
      description: `Potential paste operation detected`,
      evidence: [
        `Large content insertion: ${paste.content?.substring(0, 50)}...`,
        `Confidence: ${Math.round(paste.confidence * 100)}%`,
        `Size: ${paste.content?.length} characters`
      ],
      confidence: paste.confidence,
      timestamp: paste.timestamp,
      affectedContent: paste.content
    });
  });
  
  // Speed anomalies
  if (metrics.averageTypingSpeed > 200) {
    activities.push({
      type: 'speed_anomaly',
      severity: metrics.averageTypingSpeed > 300 ? 'critical' : 'high',
      description: `Unusually high typing speed detected`,
      evidence: [
        `Average speed: ${Math.round(metrics.averageTypingSpeed)} CPM`,
        `Expected human range: 30-150 CPM`,
        `Standard deviation: ${Math.round(metrics.standardDeviationTypingSpeed)}`
      ],
      confidence: Math.min(1, (metrics.averageTypingSpeed - 150) / 200)
    });
  }
  
  // Rhythm anomalies
  if (metrics.rhythmConsistency > 0.95) {
    activities.push({
      type: 'rhythm_anomaly',
      severity: 'high',
      description: `Unnaturally consistent typing rhythm`,
      evidence: [
        `Rhythm consistency: ${Math.round(metrics.rhythmConsistency * 100)}%`,
        `Human typical range: 40-85%`,
        `Low variability in keystroke timing`
      ],
      confidence: (metrics.rhythmConsistency - 0.85) / 0.15
    });
  }
  
  // Pause anomalies
  if (metrics.pauseFrequency < 0.01) {
    activities.push({
      type: 'pause_anomaly',
      severity: 'medium',
      description: `Abnormally few pauses during typing`,
      evidence: [
        `Pause frequency: ${Math.round(metrics.pauseFrequency * 1000) / 10}%`,
        `Human typical range: 5-25%`,
        `Continuous typing without natural breaks`
      ],
      confidence: (0.05 - metrics.pauseFrequency) / 0.05
    });
  }
  
  // Correction pattern anomalies
  if (metrics.deletionRate < 0.01) {
    activities.push({
      type: 'behavior_deviation',
      severity: 'medium',
      description: `No corrections or deletions made`,
      evidence: [
        `Deletion rate: ${Math.round(metrics.deletionRate * 100)}%`,
        `Human typical range: 5-20%`,
        `Perfect typing without errors is unusual`
      ],
      confidence: 0.6
    });
  }
  
  // Consistency anomalies
  if (metrics.consistencyScore > 0.9) {
    activities.push({
      type: 'behavior_deviation',
      severity: 'medium',
      description: `Unnaturally consistent typing patterns`,
      evidence: [
        `Consistency score: ${Math.round(metrics.consistencyScore * 100)}%`,
        `Low variance in typing behavior`,
        `Possible automated input`
      ],
      confidence: (metrics.consistencyScore - 0.7) / 0.3
    });
  }
  
  return activities;
}

function compareWithReferenceData(currentMetrics: DetailedMetrics, referenceActions: EditorAction[]): ReferenceComparison {
  const referenceMetrics = calculateDetailedMetrics(referenceActions);
  
  // Statistical comparison with confidence intervals
  const comparisons = {
    typingSpeed: compareMetricWithStats(currentMetrics.averageTypingSpeed, referenceMetrics.averageTypingSpeed, 25),
    rhythm: compareMetricWithStats(currentMetrics.rhythmConsistency, referenceMetrics.rhythmConsistency, 0.15),
    pausePatterns: compareMetricWithStats(currentMetrics.pauseFrequency, referenceMetrics.pauseFrequency, 0.05),
    deletionRate: compareMetricWithStats(currentMetrics.deletionRate, referenceMetrics.deletionRate, 0.1),
    dwellTime: compareMetricWithStats(currentMetrics.dwellTimeVariability, referenceMetrics.dwellTimeVariability, 0.2),
    flightTime: compareMetricWithStats(currentMetrics.flightTimeVariability, referenceMetrics.flightTimeVariability, 0.2)
  };
  
  // Calculate overall similarity
  const weights = { typingSpeed: 0.25, rhythm: 0.2, pausePatterns: 0.2, deletionRate: 0.15, dwellTime: 0.1, flightTime: 0.1 };
  const overall = Object.entries(comparisons).reduce((sum, [key, comparison]) => {
    return sum + comparison.similarity * weights[key as keyof typeof weights];
  }, 0);
  
  // Statistical significance based on sample size
  const statisticalSignificance = Math.min(1, referenceActions.length / 1000);
  
  // Profile match score (how well the current session matches the reference profile)
  const profileMatchScore = calculateProfileMatch(currentMetrics, referenceMetrics);
  
  return {
    overall,
    breakdown: comparisons,
    statisticalSignificance,
    profileMatchScore
  };
}

function detectReferenceDeviations(currentMetrics: DetailedMetrics, referenceActions: EditorAction[]): SuspiciousActivity[] {
  const referenceMetrics = calculateDetailedMetrics(referenceActions);
  const activities: SuspiciousActivity[] = [];
  
  // Speed deviation
  const speedDeviation = Math.abs(currentMetrics.averageTypingSpeed - referenceMetrics.averageTypingSpeed);
  if (speedDeviation > referenceMetrics.averageTypingSpeed * 0.5) { // 50% deviation
    activities.push({
      type: 'behavior_deviation',
      severity: speedDeviation > referenceMetrics.averageTypingSpeed ? 'high' : 'medium',
      description: `Typing speed significantly different from calibration`,
      evidence: [
        `Current speed: ${Math.round(currentMetrics.averageTypingSpeed)} CPM`,
        `Calibration speed: ${Math.round(referenceMetrics.averageTypingSpeed)} CPM`,
        `Deviation: ${Math.round(speedDeviation)} CPM (${Math.round(speedDeviation / referenceMetrics.averageTypingSpeed * 100)}%)`
      ],
      confidence: Math.min(1, speedDeviation / (referenceMetrics.averageTypingSpeed * 0.5))
    });
  }
  
  // Rhythm deviation
  const rhythmDeviation = Math.abs(currentMetrics.rhythmConsistency - referenceMetrics.rhythmConsistency);
  if (rhythmDeviation > 0.3) {
    activities.push({
      type: 'behavior_deviation',
      severity: 'medium',
      description: `Typing rhythm differs significantly from calibration`,
      evidence: [
        `Current rhythm consistency: ${Math.round(currentMetrics.rhythmConsistency * 100)}%`,
        `Calibration rhythm: ${Math.round(referenceMetrics.rhythmConsistency * 100)}%`,
        `Significant change in typing pattern`
      ],
      confidence: rhythmDeviation / 0.3
    });
  }
  
  return activities;
}

function calculateAdvancedConfidenceScore(
  metrics: DetailedMetrics,
  suspiciousActivities: SuspiciousActivity[],
  referenceComparison?: ReferenceComparison,
  aiTextDetection?: { isAiGenerated: boolean; score: number; provider: string; error?: string }
): { confidenceScore: number; riskLevel: 'low' | 'medium' | 'high' | 'critical'; behaviorScore: number; contentScore: number } {
  
  // Base behavior score (0-1)
  let behaviorScore = 0.8; // Start with high confidence
  
  // Apply penalties based on suspicious activities
  const criticalActivities = suspiciousActivities.filter(a => a.severity === 'critical');
  const highActivities = suspiciousActivities.filter(a => a.severity === 'high');
  const mediumActivities = suspiciousActivities.filter(a => a.severity === 'medium');
  
  behaviorScore -= criticalActivities.length * 0.4;
  behaviorScore -= highActivities.length * 0.2;
  behaviorScore -= mediumActivities.length * 0.1;
  
  behaviorScore = Math.max(0, behaviorScore);
  
  // Adjust based on reference comparison if available
  if (referenceComparison) {
    const referenceWeight = Math.min(0.5, referenceComparison.statisticalSignificance);
    behaviorScore = behaviorScore * (1 - referenceWeight) + referenceComparison.overall * referenceWeight;
  }
  
  // Content score (AI detection)
  let contentScore = 1.0;
  if (aiTextDetection && !aiTextDetection.error) {
    contentScore = 1 - aiTextDetection.score;
  }
  
  // Combined confidence score
  const confidenceScore = (behaviorScore * 0.7) + (contentScore * 0.3);
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (criticalActivities.length > 0 || confidenceScore < 0.3) {
    riskLevel = 'critical';
  } else if (highActivities.length > 0 || confidenceScore < 0.5) {
    riskLevel = 'high';
  } else if (mediumActivities.length > 1 || confidenceScore < 0.7) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }
  
  return { confidenceScore, riskLevel, behaviorScore, contentScore };
}

// Helper functions
function calculateVariabilityScore(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return mean > 0 ? Math.sqrt(variance) / mean : 0;
}

function calculateBurstiness(intervals: number[]): number {
  if (intervals.length < 2) return 0;
  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
  const cv = Math.sqrt(variance) / mean;
  return (cv - 1) / (cv + 1); // Normalized burstiness measure
}

function calculateTypingAcceleration(speeds: number[]): number {
  if (speeds.length < 3) return 0;
  let acceleration = 0;
  for (let i = 2; i < speeds.length; i++) {
    acceleration += speeds[i] - speeds[i-1];
  }
  return acceleration / (speeds.length - 2);
}

function calculateFatigueScore(speeds: number[]): number {
  if (speeds.length < 5) return 0;
  const firstHalf = speeds.slice(0, Math.floor(speeds.length / 2));
  const secondHalf = speeds.slice(Math.floor(speeds.length / 2));
  const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
  return Math.max(0, (firstAvg - secondAvg) / firstAvg);
}

function calculateConsistencyScore(speeds: number[], intervals: number[], pauses: number[]): number {
  const speedCV = calculateVariabilityScore(speeds);
  const intervalCV = calculateVariabilityScore(intervals);
  const pauseCV = calculateVariabilityScore(pauses);
  return 1 - ((speedCV + intervalCV + pauseCV) / 3);
}

function compareMetricWithStats(current: number, reference: number, tolerance: number) {
  const deviation = Math.abs(current - reference);
  const similarity = Math.max(0, 1 - deviation / tolerance);
  const explanation = deviation <= tolerance 
    ? 'Within expected range' 
    : `Deviates by ${Math.round(deviation)} (${Math.round(deviation / reference * 100)}%)`;
  
  return { similarity, deviation, explanation };
}

function calculateProfileMatch(current: DetailedMetrics, reference: DetailedMetrics): number {
  // More sophisticated profile matching using multiple behavioral features
  const features = [
    current.averageTypingSpeed / reference.averageTypingSpeed,
    current.rhythmConsistency / reference.rhythmConsistency,
    current.pauseFrequency / reference.pauseFrequency,
    current.deletionRate / reference.deletionRate,
    current.burstiness / reference.burstiness
  ];
  
  const distances = features.map(ratio => Math.abs(1 - ratio));
  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  return Math.max(0, 1 - avgDistance);
}

function detectAdvancedPasteEvents(actions: EditorAction[]): Array<{ content?: string; confidence: number; timestamp: number }> {
  const insertActions = actions.filter(a => a.type === 'insert' && a.content);
  const pasteEvents: Array<{ content?: string; confidence: number; timestamp: number }> = [];
  
  for (let i = 1; i < insertActions.length; i++) {
    const current = insertActions[i];
    const previous = insertActions[i-1];
    
    if (!current.content || !previous.content) continue;
    
    const contentDiff = current.content.length - previous.content.length;
    const timeDiff = current.timestamp - previous.timestamp;
    
    // Large content addition in short time
    if (contentDiff > 20 && timeDiff < 1000) {
      const confidence = Math.min(1, contentDiff / 100);
      pasteEvents.push({
        content: current.content.slice(-contentDiff),
        confidence,
        timestamp: current.timestamp
      });
    }
  }
  
  return pasteEvents;
}

function generateEventTimeline(actions: EditorAction[], suspiciousActivities: SuspiciousActivity[]): Array<{ timestamp: number; event: string; risk: 'low' | 'medium' | 'high' }> {
  const timeline: Array<{ timestamp: number; event: string; risk: 'low' | 'medium' | 'high' }> = [];
  
  // Add key events from actions
  const startTime = actions[0]?.timestamp || 0;
  timeline.push({ timestamp: startTime, event: 'Typing session started', risk: 'low' });
  
  // Add suspicious activities to timeline
  suspiciousActivities.forEach(activity => {
    if (activity.timestamp) {
      timeline.push({
        timestamp: activity.timestamp,
        event: activity.description,
        risk: activity.severity === 'critical' ? 'high' : activity.severity === 'high' ? 'high' : 'medium'
      });
    }
  });
  
  const endTime = actions[actions.length - 1]?.timestamp || 0;
  timeline.push({ timestamp: endTime, event: 'Typing session completed', risk: 'low' });
  
  return timeline.sort((a, b) => a.timestamp - b.timestamp);
}

function createSummaryAssessment(suspiciousActivities: SuspiciousActivity[], behaviorScore: number, contentScore: number): {
  totalFlags: number;
  highRiskFlags: number;
  behaviorScore: number;
  contentScore: number;
  overallAssessment: string;
} {
  const totalFlags = suspiciousActivities.length;
  const highRiskFlags = suspiciousActivities.filter(a => a.severity === 'high' || a.severity === 'critical').length;
  
  let overallAssessment = '';
  if (highRiskFlags > 0) {
    overallAssessment = 'High risk of academic dishonesty. Manual review strongly recommended.';
  } else if (totalFlags > 2) {
    overallAssessment = 'Multiple suspicious indicators detected. Review recommended.';
  } else if (totalFlags > 0) {
    overallAssessment = 'Minor anomalies detected. Work appears generally authentic.';
  } else {
    overallAssessment = 'No significant anomalies detected. Work appears authentic.';
  }
  
  return {
    totalFlags,
    highRiskFlags,
    behaviorScore: Math.round(behaviorScore * 100) / 100,
    contentScore: Math.round(contentScore * 100) / 100,
    overallAssessment
  };
}

// AI Text Detection using GPTZero API
async function detectAiGeneratedText(text: string): Promise<{ 
  isAiGenerated: boolean, 
  score: number, 
  provider: string,
  details?: {
    version: string;
    scanId: string;
    predictedClass: 'human' | 'ai' | 'mixed';
    confidenceCategory: 'high' | 'medium' | 'low';
    classProbabilities: {
      human: number;
      ai: number;
      mixed: number;
    };
    completelyGeneratedProb: number;
    averageGeneratedProb: number;
    sentences?: Array<{
      sentence: string;
      generatedProb: number;
      perplexity: number;
      highlightForAi: boolean;
    }>;
    paragraphs?: Array<{
      startSentenceIndex: number;
      numSentences: number;
      completelyGeneratedProb: number;
    }>;
  }
}> {
  const apiKey = process.env.GPTZERO_API_KEY;
  
  if (!apiKey) {
    console.log('GPTZero API key not configured');
    return getTemporaryFallback(text);
  }

  console.log('Starting GPTZero API call for text length:', text.length);

  try {
    console.log('Trying GPTZero API...');
    const response = await fetch('https://api.gptzero.me/v2/predict/text', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ 
        document: text,
        version: '2025-05-14-multilingual'
      })
    });

    console.log('GPTZero response status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('GPTZero response data:', JSON.stringify(data, null, 2));
      
      // Parse GPTZero response format
      const document = data.documents?.[0];
      const classification = document?.class_probabilities;
      
      if (classification && document) {
        // GPTZero returns probabilities for 'human', 'ai', and 'mixed'
        const aiProbability = classification.ai || 0;
        const mixedProbability = classification.mixed || 0;
        
        // Consider both AI and mixed content as potentially AI-generated
        const totalAiScore = aiProbability + (mixedProbability * 0.5);
        
        // Parse sentences data
        const sentences = document.sentences?.map((sentence: any) => ({
          sentence: sentence.sentence || '',
          generatedProb: sentence.generated_prob || 0,
          perplexity: sentence.perplexity || 0,
          highlightForAi: sentence.highlight_sentence_for_ai || false
        }));

        // Parse paragraphs data
        const paragraphs = document.paragraphs?.map((paragraph: any) => ({
          startSentenceIndex: paragraph.start_sentence_index || 0,
          numSentences: paragraph.num_sentences || 0,
          completelyGeneratedProb: paragraph.completely_generated_prob || 0
        }));
        
        console.log('GPTZero detection successful - AI Score:', totalAiScore);
        return {
          isAiGenerated: totalAiScore > 0.6,
          score: totalAiScore,
          provider: 'GPTZero',
          details: {
            version: data.version || 'unknown',
            scanId: data.scanId || 'unknown',
            predictedClass: document.predicted_class || 'mixed',
            confidenceCategory: document.confidence_category || 'medium',
            classProbabilities: {
              human: classification.human || 0,
              ai: classification.ai || 0,
              mixed: classification.mixed || 0
            },
            completelyGeneratedProb: document.completely_generated_prob || 0,
            averageGeneratedProb: document.average_generated_prob || 0,
            sentences,
            paragraphs
          }
        };
      } else {
        console.log('GPTZero returned unexpected response format:', data);
        return getTemporaryFallback(text);
      }
    } else {
      const errorText = await response.text();
      console.log('GPTZero error response:', errorText);
      
      // Check for specific error types
      if (response.status === 401) {
        console.log('AUTHENTICATION ERROR: Invalid GPTZero API key');
      } else if (response.status === 429) {
        console.log('RATE LIMIT ERROR: GPTZero API rate limit exceeded');
      } else if (response.status === 402) {
        console.log('PAYMENT ERROR: GPTZero API payment required or quota exceeded');
      }
      
      return getTemporaryFallback(text);
    }
  } catch (error) {
    console.log('GPTZero API error:', error);
    return getTemporaryFallback(text);
  }
}

// Temporary fallback function for AI detection
function getTemporaryFallback(text: string): { 
  isAiGenerated: boolean, 
  score: number, 
  provider: string,
  details?: undefined
} {
  // Basic heuristic-based detection as a temporary fallback
  console.log('Using temporary AI detection fallback');
  
  // Simple patterns that might indicate AI-generated text
  const aiIndicators = [
    /as an ai/i,
    /i don't have the ability/i,
    /i cannot/i,
    /i'm an ai/i,
    /as a language model/i,
    /i don't have personal/i,
    /i'm not able to/i
  ];
  
  const suspiciousPatterns = [
    /furthermore/i,
    /moreover/i,
    /in conclusion/i,
    /it's worth noting/i,
    /it's important to/i
  ];
  
  let score = 0;
  const words = text.split(/\s+/).length;
  
  // Check for obvious AI indicators
  for (const pattern of aiIndicators) {
    if (pattern.test(text)) {
      score += 0.3;
    }
  }
  
  // Check for suspicious patterns
  let suspiciousCount = 0;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      suspiciousCount++;
    }
  }
  
  // Add score based on suspicious patterns density
  if (words > 0) {
    score += (suspiciousCount / words) * 2;
  }
  
  // Very uniform sentence length might indicate AI
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) {
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const variance = sentences.reduce((sum, s) => sum + Math.pow(s.length - avgLength, 2), 0) / sentences.length;
    const coefficient = Math.sqrt(variance) / avgLength;
    
    // Low coefficient of variation might indicate AI
    if (coefficient < 0.3) {
      score += 0.2;
    }
  }
  
  // Cap the score
  score = Math.min(score, 1);
  
  return {
    isAiGenerated: score > 0.6,
    score: Math.round(score * 100) / 100,
    provider: 'Fallback Heuristic (GPTZero unavailable)'
  };
} 