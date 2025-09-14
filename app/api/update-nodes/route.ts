import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const filePath = join(process.cwd(), 'node_data', 'nodes.json');
    
    // Write the updated data to the file
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nodes.json:', error);
    return NextResponse.json({ success: false, error: 'Failed to update file' }, { status: 500 });
  }
}