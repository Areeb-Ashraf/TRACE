import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// In a real application, you would use a database instead of file storage
const DATA_DIR = path.join(process.cwd(), 'data');

export async function POST(request: NextRequest) {
  try {
    const { actions, userId, sessionId, isReference } = await request.json();
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Create a unique filename based on session ID and whether it's reference data
    const filename = isReference 
      ? `reference_${userId || 'anonymous'}_${sessionId || Date.now()}.json`
      : `session_${userId || 'anonymous'}_${sessionId || Date.now()}.json`;
    
    const filePath = path.join(DATA_DIR, filename);
    
    // Save the data
    fs.writeFileSync(
      filePath, 
      JSON.stringify({ 
        actions, 
        timestamp: Date.now(),
        userId,
        sessionId
      }, null, 2)
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data saved successfully',
      sessionId: sessionId || Date.now().toString()
    });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json(
      { error: 'Failed to save typing data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type') || 'session'; // 'session' or 'reference'
    const includeFull = searchParams.get('includeFull') === 'true'; // Whether to include full action data
    
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      return NextResponse.json({ sessions: [] });
    }
    
    // Read all files in the data directory
    const files = fs.readdirSync(DATA_DIR);
    
    // Filter files based on parameters
    const prefix = type === 'reference' ? 'reference_' : 'session_';
    let filteredFiles = files.filter(file => file.startsWith(prefix));
    
    if (userId) {
      filteredFiles = filteredFiles.filter(file => file.includes(`_${userId}_`));
    }
    
    if (sessionId) {
      filteredFiles = filteredFiles.filter(file => file.includes(`_${sessionId}.json`));
      
      // If we're requesting a specific session, return the full data
      if (filteredFiles.length === 1 && (includeFull || sessionId)) {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, filteredFiles[0]), 'utf8'));
        return NextResponse.json(data);
      }
    }
    
    // Read summary data from each file
    const sessions = filteredFiles.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      return {
        filename: file,
        userId: data.userId,
        sessionId: data.sessionId,
        timestamp: data.timestamp,
        actionCount: data.actions.length
      };
    });
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error retrieving sessions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sessions' },
      { status: 500 }
    );
  }
} 