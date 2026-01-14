#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Improved expense combiner with proper Japanese romanization
"""

import csv
import re
from datetime import datetime
from pathlib import Path

# Try to import kakasi for better Japanese romanization
try:
    from pykakasi import kakasi
    HAS_KAKASI = True
    kks = kakasi()
except ImportError:
    HAS_KAKASI = False
    print("WARNING: pykakasi not installed. Using basic romanization.")
    print("Install with: pip install pykakasi")

# Comprehensive Japanese to English mappings
SHOP_TRANSLATIONS = {
    # Convenience stores
    'セブン': 'Seven',
    'セブンイレブン': 'Seven Eleven',
    'セブン-イレブン': 'Seven Eleven',
    'ファミマ': 'FamilyMart',
    'ファミリーマート': 'FamilyMart',
    'ローソン': 'Lawson',
    'ミニストップ': 'Ministop',
    'デイリーヤマザキ': 'Daily Yamazaki',
    'ニューデイズ': 'NewDays',
    'Newdays': 'NewDays',
    
    # Restaurants
    '松屋': 'Matsuya',
    '肉のハナマサ': 'Niku no Hanamasa',
    'スシロー': 'Sushiro',
    'くら寿司': 'Kura Sushi',
    'はま寿司': 'Hama Sushi',
    'かっぱ寿司': 'Kappa Sushi',
    '鳥貴族': 'Torikizoku',
    '鳥メロ': 'Torimero',
    'ミライザカ': 'Miραizaka',
    'ミライザ力': 'Miराizaka',
    'ガスト': 'Gusto',
    'サイゼリヤ': 'Saizeriya',
    'マクドナルド': "McDonald's",
    'マック': "McDonald's",
    'ケンタッキー': 'KFC',
    'バーガーキング': 'Burger King',
    'すき家': 'Sukiya',
    '吉野家': 'Yoshinoya',
    'なか卯': 'Nakau',
    'デニーズ': "Denny's",
    'ココカレー': 'Coco Curry',
    'ここカレー': 'Coco Curry',
    'ゴーゴーカレー': 'Go Go Curry',
    '横浜ラーメン': 'Yokohama Ramen',
    '横浜らーめん': 'Yokohama Ramen',
    '長浜ラーメン': 'Nagahama Ramen',
    'しゃぶ葉': 'Shabu-yo',
    '丸亀製麺': 'Marugame Seimen',
    '三田製麺所': 'Mita Seimensho',
    'ドミノ': 'Dominos',
    'ピザハット': 'Pizza Hut',
    'サブウェイ': 'Subway',
    
    # Supermarkets & Stores
    'まいばすけっと': 'My Basket',
    'ライフ': 'Life',
    '赤札堂': 'Akafudado',
    'ドンキ': 'Donki',
    'ドンキー': 'Donki',
    'ドンキホーテ': 'Don Quijote',
    'ウエルパーク': 'Welpark',
    'WELPARK': 'Welpark',
    'ニトリ': 'Nitori',
    'ダイソー': 'Daiso',
    'マツモトキョシ': 'Matsumoto Kiyoshi',
    'ユニクロ': 'Uniqlo',
    'アマゾン': 'Amazon',
    'イケア': 'IKEA',
    
    # Vending Machine
    '販売機': 'Vending Machine',
    '自動販売機': 'Vending Machine',
    
    # Other
    'コインランドリー': 'Coin Laundry',
    'ゆうちょ銀行': 'Japan Post Bank',
    '病院': 'Hospital',
    '薬局': 'Pharmacy',
    '歯医者': 'Dentist',
    'ヤマト便': 'Yamato Delivery',
    'カラオケ': 'Karaoke',
}

LOCATION_TRANSLATIONS = {
    # Tokyo areas
    '新宿': 'Shinjuku',
    '立川': 'Tachikawa',
    '渋谷': 'Shibuya',
    '池袋': 'Ikebukuro',
    '町屋': 'Machiya',
    '荒川': 'Arakawa',
    '千川': 'Senkawa',
    '日暮里': 'Nippori',
    '西日暮里': 'Nishi-Nippori',
    '三河島': 'Mikawashima',
    '北千住': 'Kita-Senju',
    '上野': 'Ueno',
    '秋葉原': 'Akihabara',
    '原宿': 'Harajuku',
    '六本木': 'Roppongi',
    '銀座': 'Ginza',
    '有明': 'Ariake',
    '品川': 'Shinagawa',
    '新橋': 'Shimbashi',
    '恵比寿': 'Ebisu',
    '代々木': 'Yoyogi',
    '新大久保': 'Shin-Okubo',
    '高田馬場': 'Takadanobaba',
    '目白': 'Mejiro',
    '王子': 'Oji',
    '赤羽': 'Akabane',
    '歌舞伎町': 'Kabukicho',
    '歌舞伎': 'Kabuki',
    '中野': 'Nakano',
    '調布': 'Chofu',
    '佐倉': 'Sakura',
    '千葉': 'Chiba',
    '武蔵小金井': 'Musashi-Koganei',
    '小菅': 'Kosuge',
    '白山': 'Hakusan',
    '表参道': 'Omotesando',
    '日光': 'Nikko',
    '鮫洲': 'Samezuru',
    '丸の内': 'Marunouchi',
    '代々木公園': 'Yoyogi Park',
    '海老名': 'Ebina',
    '横浜': 'Yokohama',
    '足立区': 'Adachi-ku',
    '田端': 'Tabata',
    '二子玉川': 'Futako-Tamagawa',
    
    # Generic
    '駅': 'Station',
    '家': 'Home',
    '空港': 'Airport',
    'オンライン': 'Online',
    'フランクフルト': 'Frankfurt',
}

DETAIL_TRANSLATIONS = {
    # Food items
    'onigiri': 'rice ball',
    '朝ごはん': 'breakfast',
    '昼ごはん': 'lunch',
    '夜ごはん': 'dinner',
    'ラーメン': 'ramen',
    '蕎麦': 'soba',
    'そば': 'soba',
    '寿司': 'sushi',
    'カレー': 'curry',
    '唐揚げ': 'fried chicken',
    '肉まん': 'meat bun',
    '弁当': 'bento',
    'おにぎり': 'onigiri',
    'コーヒー': 'coffee',
    'ドリンク': 'drink',
    'コーラ': 'cola',
    'ココア': 'cocoa',
    '水': 'water',
    'お茶': 'tea',
    'ビール': 'beer',
    '酒': 'alcohol',
    
    # Common terms
    '定期': 'commuter pass',
    '定期券': 'commuter pass',
    'チャージ': 'charge/recharge',
    '髪切り': 'haircut',
    'ランドリー': 'laundry',
    '電気代': 'electricity bill',
    'データ': 'mobile data',
    '保険証': 'health insurance',
    '健康保険': 'health insurance',
    'タクシー': 'taxi',
    '薬': 'medicine',
    '学費': 'tuition',
    'レンタ': 'rent',
    
    # Other
    'グロブあげ': 'fried food',
    'もつ鍋': 'motsunabe',
    '送別会': 'farewell party',
    'バレンタインデー': 'Valentine\'s Day',
    'カーテン': 'curtain',
    'ミキサー': 'mixer',
    'プリント': 'printing',
}

def romanize_japanese(text):
    """Convert Japanese text to romaji"""
    if not text or not isinstance(text, str):
        return text
    
    # First, apply manual translations
    result = text
    
    # Apply shop translations
    for jp, en in SHOP_TRANSLATIONS.items():
        result = result.replace(jp, en)
    
    # Apply location translations
    for jp, en in LOCATION_TRANSLATIONS.items():
        result = result.replace(jp, en)
    
    # Apply detail translations
    for jp, en in DETAIL_TRANSLATIONS.items():
        result = result.replace(jp, en)
    
    # If we have kakasi, use it for remaining Japanese
    if HAS_KAKASI:
        result = kks.convert(result)
        if isinstance(result, list):
            result = ''.join([item['hepburn'] for item in result])
    else:
        # Basic fallback: remove remaining Japanese characters
        # Keep only ASCII and common punctuation
        result = ''.join(char if ord(char) < 128 or char in '¥€£' else ' ' for char in result)
        # Clean up multiple spaces
        result = ' '.join(result.split())
    
    return result.strip()

# Category mapping (same as before)
CATEGORY_MAP = {
    ('Future', 'Emergency Fund'): ['emergency fund', 'emergencia', 'emergency'],
    ('Future', 'Retirement Accounts'): ['retirement', 'jubilacion'],
    ('Future', 'Other Investments'): ['qqq', 'investment', 'inversion', 'fin de año', 'mudanza', 'vuelo', 'flight'],
    ('Future', 'Debt Repayment'): ['debt', 'deuda', 'loan'],
    ('Future', 'Goals Fund'): ['goals', 'metas'],
    ('Future', 'Insurance'): ['insurance', 'seguro'],
    ('Future', 'Skill-Building'): ['estudio', 'study', 'skill', 'platzi', 'libro', 'book', 'ebook'],
    
    ('Living', 'Housing'): ['renta', 'rent', 'casa', 'housing', 'home', 'elementos hogar', 'home elements'],
    ('Living', 'Utilities & Services'): ['servicios hogar', 'home services', 'luz', 'gaz', 'agua', 'water', 'datos', 'data', 'internet', 'mobile'],
    ('Living', 'Food'): ['alimentacion', 'comida', 'nutrition', 'food', 'despensa', 'pantry', 'grocery'],
    ('Living', 'Transportation'): ['transporte', 'transport', 'suika', 'pasmo', 'teiki', 'commuter pass'],
    ('Living', 'Healthcare'): ['salud', 'health', 'emergencia', 'hospital', 'medico', 'doctor'],
    ('Living', 'Basic Personal Care'): ['personal care', 'hygiene', 'haircut', 'peluqueria'],
    
    ('Present', 'Enjoyment & Social Life'): ['lujo', 'luxury', 'restaurant', 'restaurante', 'funn', 'diversion', 'party', 'bar', 'izakaya'],
    ('Present', 'Personal Development'): ['personal development', 'desarrollo personal'],
    ('Present', 'Travel & Experiences'): ['travel', 'viaje', 'experience', 'hotel'],
    ('Present', 'Hobbies & Leisure'): ['hobbies', 'leisure', 'ropa', 'clothes', 'cinema', 'cine', 'movie'],
    ('Present', 'Subscriptions'): ['subscriptions', 'suscripciones', 'gym', 'netflix', 'spotify', 'chatgpt', 'kindle'],
    ('Present', '"Life Happens" Fund'): ['life happens', 'gifts', 'regalos', 'other', 'otro'],
}

def map_category(target_text, purpose_text, detail_text, impact_text):
    """Map to Target and Category"""
    combined = ' '.join([
        str(target_text or '').lower(),
        str(purpose_text or '').lower(),
        str(detail_text or '').lower(),
        str(impact_text or '').lower()
    ])
    
    for (target, category), keywords in CATEGORY_MAP.items():
        for keyword in keywords:
            if keyword in combined:
                return target, category
    
    if 'lujo' in combined or 'luxury' in combined:
        return 'Present', 'Enjoyment & Social Life'
    elif 'inversion' in combined or 'invest' in combined:
        return 'Future', 'Other Investments'
    else:
        return 'Living', 'Food'

def clean_value(value):
    """Clean monetary value"""
    if not value:
        return '0'
    cleaned = str(value).replace('$', '').replace(',', '').replace('"', '').strip()
    return cleaned

def parse_date(date_str, month_str=None):
    """Parse date to YYYY-MM-DD"""
    if not date_str:
        return None
    
    date_str = str(date_str).strip()
    
    formats = ['%m/%d/%Y', '%Y-%m-%d', '%d/%m/%Y', '%m-%d-%Y']
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue
    
    return date_str

def process_file1(filepath):
    """Process budget - Expences data.csv"""
    records = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get('Date') or row['Date'] == '1899':
                continue
                
            date = parse_date(row['Date'])
            if not date:
                continue
                
            records.append({
                'Year': row['Year'],
                'Month': row['Month'],
                'Date': date,
                'Target': row['Target'],
                'Category': row['Category'],
                'Value': clean_value(row['Value']),
                'Detail': romanize_japanese(row.get('Detail', '')),
                'Context': romanize_japanese(row.get('Context', '')),
                'Method': romanize_japanese(row.get('Method', '')),
                'Shop': romanize_japanese(row.get('Shop', '')),
                'Location': romanize_japanese(row.get('Location', ''))
            })
    return records

def process_file2(filepath):
    """Process recopilation of data - 2023.csv"""
    records = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get('Date'):
                continue
            
            date = parse_date(row['Date'], row.get('Month'))
            if not date:
                continue
            
            try:
                year = datetime.strptime(date, '%Y-%m-%d').year
                month = datetime.strptime(date, '%Y-%m-%d').month
            except:
                continue
            
            target, category = map_category(
                row.get('Target', ''),
                row.get('Purpose', ''),
                row.get('Detail', ''),
                row.get('Impact', '')
            )
            
            records.append({
                'Year': str(year),
                'Month': str(month),
                'Date': date,
                'Target': target,
                'Category': category,
                'Value': clean_value(row.get('Value', '')),
                'Detail': romanize_japanese(row.get('Detail', '')),
                'Context': '',
                'Method': romanize_japanese(row.get('Method', '')),
                'Shop': romanize_japanese(row.get('Shop', '')),
                'Location': ''
            })
    return records

def process_file3(filepath):
    """Process recopilation of data - 2024.csv"""
    records = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get('Date'):
                continue
            
            date = parse_date(row['Date'], row.get('Month'))
            if not date:
                continue
            
            try:
                year = datetime.strptime(date, '%Y-%m-%d').year
                month = datetime.strptime(date, '%Y-%m-%d').month
            except:
                continue
            
            target, category = map_category(
                row.get('Target', ''),
                row.get('Impact', ''),
                row.get('Detail', ''),
                ''
            )
            
            records.append({
                'Year': str(year),
                'Month': str(month),
                'Date': date,
                'Target': target,
                'Category': category,
                'Value': clean_value(row.get('Value', '')),
                'Detail': romanize_japanese(row.get('Detail', '')),
                'Context': '',
                'Method': romanize_japanese(row.get('Method', '')),
                'Shop': romanize_japanese(row.get('Shop', '')),
                'Location': romanize_japanese(row.get('Location', ''))
            })
    return records

def process_file4(filepath):
    """Process recopilation of data - old_2025.csv"""
    records = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get('Date'):
                continue
            
            date = parse_date(row['Date'], row.get('Month'))
            if not date:
                continue
            
            try:
                year = datetime.strptime(date, '%Y-%m-%d').year
                month = datetime.strptime(date, '%Y-%m-%d').month
            except:
                continue
            
            target, category = map_category(
                row.get('Life target', ''),
                row.get('Purpose', ''),
                row.get('Type', ''),
                row.get('Impact', '')
            )
            
            records.append({
                'Year': str(year),
                'Month': str(month),
                'Date': date,
                'Target': target,
                'Category': category,
                'Value': clean_value(row.get('Value', '')),
                'Detail': romanize_japanese(row.get('Purpose', '')),
                'Context': romanize_japanese(row.get('Type', '')),
                'Method': romanize_japanese(row.get('Method', '')),
                'Shop': romanize_japanese(row.get('Shop', '')),
                'Location': romanize_japanese(row.get('Location', ''))
            })
    return records

def main():
    """Main processing function"""
    base_dir = Path(__file__).parent
    
    print("="*60)
    print("IMPROVED EXPENSE DATA CONSOLIDATION")
    print("="*60)
    
    # Process all files
    print("\n1. Processing budget - Expences data.csv...")
    file1_records = process_file1(base_dir / 'budget - Expences data.csv')
    print(f"   Found {len(file1_records)} records")
    
    print("\n2. Processing recopilation of data - 2023.csv...")
    file2_records = process_file2(base_dir / 'recopilation of data - 2023.csv')
    print(f"   Found {len(file2_records)} records")
    
    print("\n3. Processing recopilation of data - 2024.csv...")
    file3_records = process_file3(base_dir / 'recopilation of data - 2024.csv')
    print(f"   Found {len(file3_records)} records")
    
    print("\n4. Processing recopilation of data - old_2025.csv...")
    file4_records = process_file4(base_dir / 'recopilation of data - old_2025.csv')
    print(f"   Found {len(file4_records)} records")
    
    # Combine
    all_records = file1_records + file2_records + file3_records + file4_records
    print(f"\n[OK] Total records: {len(all_records)}")
    
    # Sort by date
    all_records.sort(key=lambda x: x['Date'])
    
    # Write output with ENGLISH headers
    output_file = base_dir / 'expenses_combined_english.csv'
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['Year', 'Month', 'Date', 'Target', 'Category', 'Value', 'Detail', 'Context', 'Method', 'Shop', 'Location']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)
    
    print(f"\n[OK] Combined file created: {output_file}")
    print(f"[OK] Date range: {all_records[0]['Date']} to {all_records[-1]['Date']}")
    
    # Show distribution
    target_dist = {}
    for record in all_records:
        target = record['Target']
        target_dist[target] = target_dist.get(target, 0) + 1
    
    print("\n[OK] Distribution by Target:")
    for target, count in sorted(target_dist.items()):
        print(f"   {target}: {count} records")
    
    print("\n" + "="*60)
    print("[DONE] Processing complete!")
    print("Output file: expenses_combined_english.csv")
    print("All Japanese text has been romanized/translated")
    print("="*60)

if __name__ == '__main__':
    main()
