import { supabase } from '../lib/supabaseClient';

interface DemoTestResult {
  user_id: string;
  wpm: number;
  accuracy: number;
  errors: number;
  time: number;
  consistency?: number;
  keystroke_stats?: any;
  error_types?: any;
  word_count?: number;
  duration: number;
  timestamp: string;
  test_type?: string;
}

/**
 * Generates realistic demo test results for a user
 * Call this function from browser console: generateDemoData(userId)
 */
export async function generateDemoData(userId: string, count: number = 30) {
  if (!userId) {
    console.error('User ID is required');
    return;
  }

  const results: DemoTestResult[] = [];
  const now = new Date();
  
  // Generate test results spread over the last 30 days
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(Math.floor(Math.random() * 24));
    timestamp.setMinutes(Math.floor(Math.random() * 60));
    
    // Vary WPM between 30-120 with gradual improvement over time
    const baseWpm = 40 + (30 - daysAgo) * 1.5 + Math.random() * 20;
    const wpm = Math.max(30, Math.min(120, Math.round(baseWpm)));
    
    // Vary accuracy between 85-100%
    const accuracy = Math.max(85, Math.min(100, Math.round(95 + (Math.random() - 0.5) * 10)));
    
    // Calculate errors based on accuracy
    const wordCount = Math.round((wpm * 30) / 60); // Approximate words for 30s test
    const totalChars = wordCount * 5; // Average 5 chars per word
    const correctChars = Math.round(totalChars * (accuracy / 100));
    const errors = Math.max(0, totalChars - correctChars);
    
    // Duration options: 15, 30, 60, 120 seconds
    const durations = [15, 30, 60, 120];
    const duration = durations[Math.floor(Math.random() * durations.length)];
    
    // Test types for category breakdown
    const testTypes = ['time', 'words', 'quote', 'coding', 'zen', 'zenwriting', 'god', 'syntax'];
    const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
    
    // Generate keystroke stats (include testType for category tracking)
    const keystrokeStats = {
      total: totalChars,
      correct: correctChars,
      incorrect: errors,
      extra: Math.floor(Math.random() * 5),
      keyCounts: generateKeyCounts(errors),
      testType: testType, // Store test type in keystroke_stats
    };
    
    // Generate error types
    const errorTypes = {
      punctuation: Math.floor(errors * 0.3),
      case: Math.floor(errors * 0.2),
      number: Math.floor(errors * 0.1),
      other: errors - Math.floor(errors * 0.3) - Math.floor(errors * 0.2) - Math.floor(errors * 0.1),
    };
    
    // Consistency score (0-100)
    const consistency = Math.max(60, Math.min(100, Math.round(80 + (Math.random() - 0.5) * 20)));
    
    results.push({
      user_id: userId,
      wpm,
      accuracy,
      errors,
      time: duration,
      consistency,
      keystroke_stats: keystrokeStats,
      error_types: errorTypes,
      word_count: wordCount,
      duration,
      timestamp: timestamp.toISOString(),
    });
  }
  
  // Sort by timestamp
  results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Insert into database
  console.log(`Inserting ${results.length} demo test results...`);
  const { data, error } = await supabase.from('test_results').insert(results);
  
  if (error) {
    console.error('Error inserting demo data:', error);
    return { success: false, error };
  }
  
  console.log(`✅ Successfully inserted ${results.length} demo test results!`);
  console.log('Refresh the profile page to see the data.');
  
  return { success: true, count: results.length };
}

/**
 * Generates realistic key error counts
 */
function generateKeyCounts(totalErrors: number): Record<string, number> {
  const commonErrorKeys = ['e', 'a', 'i', 'o', 't', 'n', 's', 'r', 'h', 'l', 'd', 'c', 'u', 'm', 'f', 'p', 'g', 'w', 'y', 'b', 'v', 'k', 'x', 'j', 'q', 'z'];
  const specialKeys = ['.', ',', ';', ':', "'", '"', '!', '?', '-', '(', ')', '[', ']', '{', '}', ' '];
  const allKeys = [...commonErrorKeys, ...specialKeys];
  
  const keyCounts: Record<string, number> = {};
  
  // If no errors, return empty object (but ensure at least some keys have counts for demo)
  if (totalErrors === 0) {
    // For demo purposes, add some minimal error counts even if errors are 0
    const demoKeys = ['e', 'a', 'i', 'o', 't'];
    demoKeys.forEach(key => {
      keyCounts[key] = Math.floor(Math.random() * 3) + 1;
    });
    return keyCounts;
  }
  
  let remainingErrors = totalErrors;
  
  // Distribute errors across keys (ensure at least 5-10 keys have errors for better visualization)
  const keysToUse = Math.min(allKeys.length, Math.max(5, Math.floor(totalErrors / 2) + 5));
  const selectedKeys: string[] = [];
  
  // Select random keys to distribute errors to
  while (selectedKeys.length < keysToUse && remainingErrors > 0) {
    const key = allKeys[Math.floor(Math.random() * allKeys.length)];
    if (!selectedKeys.includes(key)) {
      selectedKeys.push(key);
    }
  }
  
  // Distribute errors across selected keys
  for (let i = 0; i < selectedKeys.length; i++) {
    if (remainingErrors <= 0) break;
    const key = selectedKeys[i];
    const maxForThisKey = i === selectedKeys.length - 1 ? remainingErrors : Math.floor(remainingErrors / (selectedKeys.length - i));
    const count = Math.max(1, Math.floor(Math.random() * Math.min(maxForThisKey, 10)) + 1);
    keyCounts[key] = (keyCounts[key] || 0) + count;
    remainingErrors -= count;
  }
  
  // Add any remaining errors to random keys
  while (remainingErrors > 0) {
    const key = allKeys[Math.floor(Math.random() * allKeys.length)];
    keyCounts[key] = (keyCounts[key] || 0) + 1;
    remainingErrors--;
  }
  
  return keyCounts;
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).generateDemoData = generateDemoData;
}

