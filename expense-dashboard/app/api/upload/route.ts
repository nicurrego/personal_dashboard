import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are accepted' }, { status: 400 });
    }

    // Get file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to temp location
    const tempDir = path.join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });
    
    const inputPath = path.join(tempDir, 'upload_raw.csv');
    const outputPath = path.join(tempDir, 'upload_cleaned.csv');
    
    await writeFile(inputPath, buffer);

    // Run Python cleaner
    const cleanerPath = path.resolve(process.cwd(), '..', 'csv_cleaner.py');
    
    try {
      await execAsync(`python "${cleanerPath}" "${inputPath}" --output "${outputPath}" --quiet`);
    } catch (error) {
      console.error('Cleaner error:', error);
      // If Python fails, just copy the original
      await writeFile(outputPath, buffer);
    }

    // Copy cleaned file to public folder as expenses data
    const publicPath = path.join(process.cwd(), 'public', 'expenses_combined_english.csv');
    const { readFile } = await import('fs/promises');
    const cleanedData = await readFile(outputPath);
    await writeFile(publicPath, cleanedData);

    // Read the cleaned file to return stats
    const cleanedContent = cleanedData.toString('utf-8');
    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const recordCount = lines.length - 1; // Subtract header

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded and cleaned',
      records: recordCount,
      filename: file.name
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
