#!/usr/bin/env python3
"""
CSV Cleaner - Universal CSV Data Cleaning Tool
===============================================

Handles common data quality issues:
- Missing/null values
- Inconsistent casing
- Date format normalization
- Type conversions
- Duplicate detection
- Outlier flagging
- Whitespace/encoding issues
- Structural problems

Usage:
    python csv_cleaner.py input.csv [--output output.csv] [--config config.json]
    python csv_cleaner.py --batch ./to_clean.csv/
"""

import pandas as pd
import numpy as np
import re
import argparse
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
import unicodedata
import warnings

warnings.filterwarnings('ignore')


class CSVCleaner:
    """Universal CSV cleaning utility with configurable cleaning steps."""

    # Default expected schema for expense data
    DEFAULT_SCHEMA = {
        'Year': 'int',
        'Month': 'int',
        'Date': 'date',
        'Target': 'category',
        'Category': 'category',
        'Value': 'float',
        'Detail': 'str',
        'Context': 'str',
        'Method': 'str',
        'Shop': 'str',
        'Location': 'str'
    }

    # Valid values for categorical columns (for standardization)
    VALID_TARGETS = ['Living', 'Present', 'Future', 'Saving', 'Investment']
    
    # Month name mappings
    MONTH_MAP = {
        'jan': 1, 'january': 1, 'feb': 2, 'february': 2,
        'mar': 3, 'march': 3, 'apr': 4, 'april': 4,
        'may': 5, 'jun': 6, 'june': 6,
        'jul': 7, 'july': 7, 'aug': 8, 'august': 8,
        'sep': 9, 'september': 9, 'oct': 10, 'october': 10,
        'nov': 11, 'november': 11, 'dec': 12, 'december': 12
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.issues_log: List[Dict[str, Any]] = []
        self.stats = {
            'rows_original': 0,
            'rows_cleaned': 0,
            'duplicates_removed': 0,
            'nulls_filled': 0,
            'outliers_flagged': 0,
            'encoding_fixed': 0,
            'dates_normalized': 0,
            'casing_fixed': 0
        }

    def log_issue(self, row_idx: int, column: str, issue_type: str, original: Any, fixed: Any = None):
        """Log a data quality issue for reporting."""
        self.issues_log.append({
            'row': row_idx,
            'column': column,
            'type': issue_type,
            'original': str(original),
            'fixed': str(fixed) if fixed is not None else None
        })

    # =========================================================================
    # STEP 1: Encoding & Whitespace Cleaning
    # =========================================================================
    def clean_encoding(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fix encoding issues and normalize unicode characters."""
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].apply(lambda x: self._normalize_text(x) if pd.notna(x) else x)
        return df

    def _normalize_text(self, text: str) -> str:
        """Normalize unicode and strip problematic characters."""
        if not isinstance(text, str):
            return text
        # Normalize unicode (e.g., ö -> o for ASCII compatibility)
        normalized = unicodedata.normalize('NFKD', text)
        # Keep only ASCII-safe characters or common extended chars
        cleaned = ''.join(c for c in normalized if ord(c) < 256)
        self.stats['encoding_fixed'] += 1 if cleaned != text else 0
        return cleaned

    def clean_whitespace(self, df: pd.DataFrame) -> pd.DataFrame:
        """Strip leading/trailing whitespace and normalize internal spaces."""
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].apply(lambda x: self._clean_ws(x) if pd.notna(x) else x)
        return df

    def _clean_ws(self, text: str) -> str:
        """Clean whitespace from text."""
        if not isinstance(text, str):
            return text
        # Remove newlines, tabs, multiple spaces
        cleaned = re.sub(r'[\n\r\t]+', ' ', text)
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.strip()

    # =========================================================================
    # STEP 2: Handle Missing Values
    # =========================================================================
    def handle_missing(self, df: pd.DataFrame) -> pd.DataFrame:
        """Replace various null representations with actual NaN, then fill."""
        null_variants = ['', 'N/A', 'n/a', 'NA', 'na', 'None', 'none', 'NULL', 'null', '-', '--', '.']
        
        for col in df.columns:
            # Replace null-like strings
            df[col] = df[col].replace(null_variants, np.nan)
            
            # Count nulls before filling
            null_count = df[col].isna().sum()
            
            # Fill based on column type (from schema or inference)
            if col in ['Year', 'Month', 'Value']:
                # For numeric: leave as NaN or fill with median
                pass
            elif col in ['Target', 'Category', 'Location', 'Shop', 'Method', 'Context']:
                # For categorical: fill with 'Unknown'
                df[col] = df[col].fillna('Unknown')
                self.stats['nulls_filled'] += null_count
            elif col in ['Detail']:
                df[col] = df[col].fillna('')
            
        return df

    # =========================================================================
    # STEP 3: Normalize Casing
    # =========================================================================
    def normalize_casing(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize casing for categorical columns."""
        case_columns = ['Target', 'Category', 'Location', 'Method', 'Context', 'Shop']
        
        for col in case_columns:
            if col not in df.columns:
                continue
            
            df[col] = df[col].apply(lambda x: self._title_case(x) if pd.notna(x) else x)
            
            # Special handling for Target - map to valid values
            if col == 'Target':
                df[col] = df[col].apply(self._normalize_target)
        
        self.stats['casing_fixed'] += 1
        return df

    def _title_case(self, text: str) -> str:
        """Convert to title case."""
        if not isinstance(text, str):
            return text
        return text.strip().title()

    def _normalize_target(self, value: str) -> str:
        """Normalize Target column to valid values."""
        if not isinstance(value, str):
            return value
        
        val_lower = value.lower().strip()
        
        # Map common variations
        mappings = {
            'living': 'Living',
            'present': 'Present',
            'future': 'Future',
            'saving': 'Saving',
            'savings': 'Saving',
            'investment': 'Investment',
            'invest': 'Investment'
        }
        
        return mappings.get(val_lower, value.title())

    # =========================================================================
    # STEP 4: Date Normalization
    # =========================================================================
    def normalize_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Parse and normalize various date formats to YYYY-MM-DD."""
        if 'Date' not in df.columns:
            return df
        
        df['Date'] = df['Date'].apply(self._parse_date)
        self.stats['dates_normalized'] += 1
        return df

    def _parse_date(self, date_val: Any) -> Optional[str]:
        """Parse various date formats to YYYY-MM-DD string."""
        if pd.isna(date_val):
            return None
        
        date_str = str(date_val).strip()
        
        # Common date patterns to try
        patterns = [
            r'^(\d{4})-(\d{1,2})-(\d{1,2})$',           # 2023-01-22
            r'^(\d{1,2})/(\d{1,2})/(\d{4})$',           # 22/01/2023 
            r'^(\d{1,2})-(\d{1,2})-(\d{4})$',           # 01-23-2023
            r'^(\d{4})\.(\d{1,2})\.(\d{1,2})$',         # 2023.01.24
            r'^(\d{1,2})-([A-Za-z]{3})-(\d{4})$',       # 24-Jan-2023
        ]
        
        # Try pandas first
        try:
            parsed = pd.to_datetime(date_str, dayfirst=True, yearfirst=True)
            return parsed.strftime('%Y-%m-%d')
        except:
            pass
        
        # Fallback: try each pattern
        for pattern in patterns:
            match = re.match(pattern, date_str)
            if match:
                groups = match.groups()
                try:
                    # Different handling based on pattern
                    if '-' in pattern and 'A-Za-z' in pattern:
                        # e.g., 24-Jan-2023
                        day, month_str, year = groups
                        month = self.MONTH_MAP.get(month_str.lower()[:3], 1)
                        return f"{year}-{month:02d}-{int(day):02d}"
                    elif len(groups[0]) == 4:
                        # Year first
                        return f"{groups[0]}-{int(groups[1]):02d}-{int(groups[2]):02d}"
                    else:
                        # Day/Month first - assume DD/MM/YYYY
                        return f"{groups[2]}-{int(groups[1]):02d}-{int(groups[0]):02d}"
                except:
                    pass
        
        return date_str  # Return original if unparseable

    # =========================================================================
    # STEP 5: Type Conversion & Numeric Cleaning
    # =========================================================================
    def clean_numerics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and convert numeric columns."""
        numeric_cols = ['Year', 'Month', 'Value']
        
        for col in numeric_cols:
            if col not in df.columns:
                continue
            
            df[col] = df[col].apply(self._clean_numeric)
            
            # Convert to appropriate type
            if col == 'Year':
                df[col] = pd.to_numeric(df[col], errors='coerce').astype('Int64')
                # Fix 2-digit years
                df[col] = df[col].apply(lambda x: x + 2000 if pd.notna(x) and x < 100 else x)
            elif col == 'Month':
                df[col] = df[col].apply(self._parse_month)
            else:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        return df

    def _clean_numeric(self, val: Any) -> Any:
        """Clean a numeric value by removing symbols, commas, etc."""
        if pd.isna(val):
            return val
        
        val_str = str(val).strip()
        
        # Remove currency symbols and commas
        val_str = re.sub(r'[$¥€£,]', '', val_str)
        
        # Remove quotes
        val_str = val_str.strip('"\'')
        
        # Handle .0 suffix (e.g., 2023.0)
        if val_str.endswith('.0'):
            val_str = val_str[:-2]
        
        return val_str if val_str else None

    def _parse_month(self, val: Any) -> Optional[int]:
        """Parse month value (numeric or name)."""
        if pd.isna(val):
            return None
        
        val_str = str(val).strip().lower()
        
        # Check if it's a month name
        if val_str in self.MONTH_MAP:
            return self.MONTH_MAP[val_str]
        
        # Try numeric
        try:
            month = int(float(val_str))
            return month if 1 <= month <= 12 else None
        except:
            return None

    # =========================================================================
    # STEP 6: Remove Duplicates
    # =========================================================================
    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove exact duplicate rows."""
        original_len = len(df)
        df = df.drop_duplicates()
        self.stats['duplicates_removed'] = original_len - len(df)
        return df

    # =========================================================================
    # STEP 7: Flag/Remove Outliers
    # =========================================================================
    def handle_outliers(self, df: pd.DataFrame, value_col: str = 'Value') -> pd.DataFrame:
        """Flag or remove outliers using IQR method."""
        if value_col not in df.columns:
            return df
        
        # Calculate IQR
        Q1 = df[value_col].quantile(0.25)
        Q3 = df[value_col].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 3 * IQR  # Using 3x IQR for extreme outliers
        upper_bound = Q3 + 3 * IQR
        
        # Flag outliers
        outlier_mask = (df[value_col] < lower_bound) | (df[value_col] > upper_bound)
        df['_is_outlier'] = outlier_mask
        self.stats['outliers_flagged'] = outlier_mask.sum()
        
        # Also flag negative values (likely errors)
        df.loc[df[value_col] < 0, '_is_outlier'] = True
        
        return df

    # =========================================================================
    # STEP 8: Structural Fixes
    # =========================================================================
    def fix_structural_issues(self, df: pd.DataFrame) -> pd.DataFrame:
        """Attempt to fix common structural issues."""
        # Check for merged values with delimiters
        delimiter_patterns = [';', '|', '::']
        
        for col in df.columns:
            for delim in delimiter_patterns:
                df[col] = df[col].apply(
                    lambda x: str(x).split(delim)[0].strip() if pd.notna(x) and delim in str(x) else x
                )
        
        return df

    # =========================================================================
    # MAIN CLEANING PIPELINE
    # =========================================================================
    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Run the full cleaning pipeline."""
        self.stats['rows_original'] = len(df)
        
        # Run cleaning steps in order
        df = self.clean_encoding(df)
        df = self.clean_whitespace(df)
        df = self.handle_missing(df)
        df = self.normalize_casing(df)
        df = self.normalize_dates(df)
        df = self.clean_numerics(df)
        df = self.remove_duplicates(df)
        df = self.handle_outliers(df)
        df = self.fix_structural_issues(df)
        
        # Drop empty rows
        df = df.dropna(how='all')
        
        self.stats['rows_cleaned'] = len(df)
        
        return df

    def get_report(self) -> str:
        """Generate a cleaning report."""
        report = [
            "=" * 60,
            "CSV CLEANING REPORT",
            "=" * 60,
            f"Original rows:       {self.stats['rows_original']}",
            f"Cleaned rows:        {self.stats['rows_cleaned']}",
            f"Duplicates removed:  {self.stats['duplicates_removed']}",
            f"Nulls filled:        {self.stats['nulls_filled']}",
            f"Outliers flagged:    {self.stats['outliers_flagged']}",
            "=" * 60
        ]
        return "\n".join(report)


def clean_file(input_path: str, output_path: Optional[str] = None, verbose: bool = True) -> pd.DataFrame:
    """Clean a single CSV file."""
    input_file = Path(input_path)
    
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Read with flexible encoding
    try:
        df = pd.read_csv(input_file, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(input_file, encoding='latin-1')
    
    # Clean
    cleaner = CSVCleaner()
    cleaned_df = cleaner.clean(df)
    
    # Remove outlier flag column for output (optional)
    output_df = cleaned_df.drop(columns=['_is_outlier'], errors='ignore')
    
    # Save if output path provided
    if output_path:
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_df.to_csv(output_file, index=False)
        if verbose:
            print(f"✅ Saved cleaned file to: {output_path}")
    
    if verbose:
        print(cleaner.get_report())
    
    return output_df


def batch_clean(input_dir: str, output_dir: Optional[str] = None, verbose: bool = True):
    """Clean all CSV files in a directory."""
    input_path = Path(input_dir)
    
    if not input_path.is_dir():
        raise NotADirectoryError(f"Not a directory: {input_dir}")
    
    csv_files = list(input_path.glob("*.csv"))
    
    if not csv_files:
        print(f"No CSV files found in {input_dir}")
        return
    
    print(f"Found {len(csv_files)} CSV files to clean...")
    
    for csv_file in csv_files:
        print(f"\n📄 Processing: {csv_file.name}")
        print("-" * 40)
        
        output_path = None
        if output_dir:
            output_path = Path(output_dir) / f"cleaned_{csv_file.name}"
        
        try:
            clean_file(str(csv_file), str(output_path) if output_path else None, verbose)
        except Exception as e:
            print(f"❌ Error processing {csv_file.name}: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Universal CSV Data Cleaner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python csv_cleaner.py input.csv
  python csv_cleaner.py input.csv --output cleaned.csv
  python csv_cleaner.py --batch ./to_clean.csv/ --output ./cleaned/
        """
    )
    
    parser.add_argument('input', nargs='?', help='Input CSV file or directory (with --batch)')
    parser.add_argument('--output', '-o', help='Output file path or directory')
    parser.add_argument('--batch', '-b', action='store_true', help='Process all CSV files in directory')
    parser.add_argument('--quiet', '-q', action='store_true', help='Suppress verbose output')
    
    args = parser.parse_args()
    
    if not args.input:
        parser.print_help()
        return
    
    verbose = not args.quiet
    
    if args.batch:
        batch_clean(args.input, args.output, verbose)
    else:
        clean_file(args.input, args.output, verbose)


if __name__ == '__main__':
    main()
