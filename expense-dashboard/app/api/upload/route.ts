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
    const csvContent = Buffer.from(bytes).toString('utf-8');

    // Use the production-ready TypeScript importer instead of external Python
    const { importCSV } = await import('@/lib/csv');
    const result = importCSV(csvContent);

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.errors[0].message
      }, { status: 400 });
    }

    // Convert parsed data back to CSV string for the persistent file
    // (Or we could just save the raw content if we prefer, but importing ensures it's valid)
    const headers = 'year,month,date,target,category,value,item,context,method,shop,location';
    const rows = result.data.map(e =>
      `${e.year},${e.month},${e.date},${e.target},${e.category},${e.value},"${e.item || ''}","${e.context || ''}","${e.method || ''}","${e.shop || ''}","${e.location || ''}"`
    ).join('\n');
    const cleanedContent = `${headers}\n${rows}`;

    // Save to public folder as the source of truth for the dashboard
    const publicPath = path.join(process.cwd(), 'public', 'expenses_combined_english.csv');
    await writeFile(publicPath, cleanedContent);

    return NextResponse.json({
      success: true,
      message: 'File uploaded and cleaned successfully',
      records: result.data.length,
      warnings: result.warnings.length,
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
