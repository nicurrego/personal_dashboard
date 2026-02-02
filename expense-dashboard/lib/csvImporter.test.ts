/**
 * Test script for CSV Importer
 * 
 * Run with: npx ts-node --esm lib/csvImporter.test.ts
 * Or: npx tsx lib/csvImporter.test.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { importCSV, validateCSV, getImportPreview } from './csv';

// Read the actual CSV file
const csvPath = join(__dirname, '..', '..', 'expenses_data.csv');
const csvContent = readFileSync(csvPath, 'utf-8');

console.log('='.repeat(60));
console.log('CSV IMPORTER TEST');
console.log('='.repeat(60));
console.log(`\nFile: ${csvPath}`);
console.log(`File size: ${(csvContent.length / 1024).toFixed(1)} KB\n`);

// Test 1: Quick Validation
console.log('-'.repeat(60));
console.log('TEST 1: Quick Validation');
console.log('-'.repeat(60));
const validation = validateCSV(csvContent);
console.log(`Valid: ${validation.valid}`);
console.log(`Row count: ${validation.rowCount}`);
console.log(`Has correct headers: ${validation.hasCorrectHeaders}`);
if (validation.sampleErrors.length > 0) {
    console.log('Sample errors:', validation.sampleErrors);
}

// Test 2: Full Import
console.log('\n' + '-'.repeat(60));
console.log('TEST 2: Full Import');
console.log('-'.repeat(60));
const result = importCSV(csvContent);
console.log(`Success: ${result.success}`);
console.log(`\nStats:`);
console.log(`  Total rows: ${result.stats.totalRows}`);
console.log(`  Valid rows: ${result.stats.validRows}`);
console.log(`  Skipped rows: ${result.stats.skippedRows}`);
console.log(`  Errors: ${result.stats.errorsCount}`);
console.log(`  Warnings: ${result.stats.warningsCount}`);
console.log(`  Date format detected: ${result.stats.dateFormatUsed}`);
console.log(`  Value format detected: ${result.stats.valueFormatUsed}`);

// Show first 3 parsed records
console.log('\nFirst 3 parsed records:');
result.data.slice(0, 3).forEach((expense, i) => {
    console.log(`\n  [${i + 1}]`);
    console.log(`    Date: ${expense.date}`);
    console.log(`    Target: ${expense.target}`);
    console.log(`    Category: ${expense.category}`);
    console.log(`    Value: ¥${expense.value.toLocaleString()}`);
    console.log(`    Item: ${expense.item || '(none)'}`);
});

// Show last 3 parsed records (likely the real data with different format)
console.log('\n\nLast 3 parsed records (real data):');
result.data.slice(-3).forEach((expense, i) => {
    console.log(`\n  [${result.data.length - 2 + i}]`);
    console.log(`    Date: ${expense.date}`);
    console.log(`    Target: ${expense.target}`);
    console.log(`    Category: ${expense.category}`);
    console.log(`    Value: ¥${expense.value.toLocaleString()}`);
    console.log(`    Item: ${expense.item || '(none)'}`);
    console.log(`    Shop: ${expense.shop || '(none)'}`);
    console.log(`    Location: ${expense.location || '(none)'}`);
});

// Show sample warnings
if (result.warnings.length > 0) {
    console.log('\n\nSample Warnings (first 5):');
    result.warnings.slice(0, 5).forEach((w, i) => {
        console.log(`  [${i + 1}] Row ${w.row}: ${w.field} - "${w.originalValue}" → "${w.correctedValue}"`);
    });
}

// Show sample errors
if (result.errors.length > 0) {
    console.log('\n\nSample Errors (first 5):');
    result.errors.slice(0, 5).forEach((e, i) => {
        console.log(`  [${i + 1}] Row ${e.row}: ${e.message}${e.field ? ` (${e.field}: ${e.value})` : ''}`);
    });
}

// Test 3: Target Distribution
console.log('\n' + '-'.repeat(60));
console.log('TEST 3: Target Distribution');
console.log('-'.repeat(60));
const targetCounts: Record<string, number> = {};
result.data.forEach(e => {
    targetCounts[e.target] = (targetCounts[e.target] || 0) + 1;
});
Object.entries(targetCounts).sort((a, b) => b[1] - a[1]).forEach(([target, count]) => {
    const pct = ((count / result.data.length) * 100).toFixed(1);
    console.log(`  ${target}: ${count} (${pct}%)`);
});

// Test 4: Category Distribution (top 10)
console.log('\n' + '-'.repeat(60));
console.log('TEST 4: Top 10 Categories');
console.log('-'.repeat(60));
const categoryCounts: Record<string, number> = {};
result.data.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
});
Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([category, count]) => {
        const pct = ((count / result.data.length) * 100).toFixed(1);
        console.log(`  ${category}: ${count} (${pct}%)`);
    });

// Test 5: Date Range
console.log('\n' + '-'.repeat(60));
console.log('TEST 5: Date Range');
console.log('-'.repeat(60));
const dates = result.data.map(e => new Date(e.date)).filter(d => !isNaN(d.getTime()));
if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    console.log(`  Earliest: ${minDate.toISOString().split('T')[0]}`);
    console.log(`  Latest: ${maxDate.toISOString().split('T')[0]}`);
    const daySpan = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  Span: ${daySpan} days`);
}

// Test 6: Value Statistics
console.log('\n' + '-'.repeat(60));
console.log('TEST 6: Value Statistics');
console.log('-'.repeat(60));
const values = result.data.map(e => e.value);
const totalValue = values.reduce((a, b) => a + b, 0);
const avgValue = totalValue / values.length;
const maxValue = Math.max(...values);
const minValue = Math.min(...values);
console.log(`  Total: ¥${totalValue.toLocaleString()}`);
console.log(`  Average: ¥${avgValue.toLocaleString()}`);
console.log(`  Max: ¥${maxValue.toLocaleString()}`);
console.log(`  Min: ¥${minValue.toLocaleString()}`);

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!');
console.log('='.repeat(60));
