import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { loadTasks } from '@/lib/data-store';
import { loadTTTasks } from '@/lib/data-store';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Load both DC and TT tasks
    const [dcTasks, ttTasksData] = await Promise.all([
      loadTasks(),
      loadTTTasks()
    ]);

    const counts = {
      DC: dcTasks.length,
      TT: ttTasksData.tasks.length
    };

    console.log('[Task Counts API] Returning counts:', counts);

    return NextResponse.json({
      success: true,
      data: counts
    });

  } catch (error: any) {
    console.error('[Task Counts API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 