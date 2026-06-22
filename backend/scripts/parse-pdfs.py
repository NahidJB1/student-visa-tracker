import os
import re
import json
import traceback

try:
    import pdfplumber
except ImportError:
    print("Please install pdfplumber: pip install pdfplumber")
    exit(1)

CHECKFILES_DIR = os.path.join(os.path.dirname(__file__), '../../Checkfiles')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'pdf-programs.json')

def clean_text(text):
    if not text:
        return ""
    text = str(text).replace("\n", " ").strip()
    return re.sub(r'\s+', ' ', text)

def get_level_from_string(text):
    lower_text = text.lower()
    if 'foundation' in lower_text: return 'Foundation'
    if 'diploma' in lower_text: return 'Diploma'
    if 'bachelor' in lower_text or 'degree' in lower_text: return 'Bachelor'
    if 'master' in lower_text: return "Master's"
    if 'phd' in lower_text or 'doctor' in lower_text: return 'PhD'
    if 'certificate' in lower_text: return 'Certificate'
    if 'professional' in lower_text: return 'Professional'
    return None

def process_pdfs():
    all_programs = []
    
    if not os.path.exists(CHECKFILES_DIR):
        print(f"Directory not found: {CHECKFILES_DIR}")
        return

    pdf_files = [f for f in os.listdir(CHECKFILES_DIR) if f.lower().endswith('.pdf')]
    print(f"Found {len(pdf_files)} PDF files.")

    for pdf_file in pdf_files:
        pdf_path = os.path.join(CHECKFILES_DIR, pdf_file)
        
        # Extract university name from filename
        uni_name = re.sub(r' Fee Structure.*| Fees.*', '', pdf_file, flags=re.IGNORECASE).strip()
        print(f"\nProcessing {pdf_file} (University: {uni_name})...")
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    tables = page.extract_tables()
                    if not tables:
                        continue
                        
                    for t_idx, table in enumerate(tables):
                        if not table or len(table) < 2:
                            continue
                            
                        # Find header row
                        header_idx = -1
                        prog_idx = -1
                        dur_idx = -1
                        fee_idx = -1
                        
                        for r_idx, row in enumerate(table[:5]): # check first 5 rows for headers
                            if not row: continue
                            row_lower = [str(c).lower() if c else "" for c in row]
                            
                            # look for 'program'
                            p_matches = [idx for idx, c in enumerate(row_lower) if 'program' in c or 'course' in c]
                            d_matches = [idx for idx, c in enumerate(row_lower) if 'duration' in c or 'year' in c]
                            
                            # look for fee
                            f_matches = [idx for idx, c in enumerate(row_lower) if 'total' in c or 'fee (rm)' in c or 'fees' in c]
                            
                            if p_matches:
                                header_idx = r_idx
                                prog_idx = p_matches[0]
                                if d_matches:
                                    dur_idx = d_matches[0]
                                if f_matches:
                                    # Prefer 'total' if available
                                    total_matches = [idx for idx, c in enumerate(row_lower) if 'total' in c]
                                    fee_idx = total_matches[-1] if total_matches else f_matches[-1]
                                else:
                                    # Fallback to last column for fee
                                    fee_idx = len(row) - 1
                                break
                        
                        if header_idx == -1 or prog_idx == -1:
                            continue # Could not find header
                            
                        # Process rows
                        for row in table[header_idx+1:]:
                            if not row or len(row) <= max(prog_idx, fee_idx): continue
                            
                            prog_name = clean_text(row[prog_idx])
                            if not prog_name or len(prog_name) < 5 or 'PROGRAM' in prog_name.upper():
                                continue
                                
                            duration = clean_text(row[dur_idx]) if dur_idx != -1 and len(row) > dur_idx else "N/A"
                            fees = clean_text(row[fee_idx])
                            
                            if not fees:
                                # try the second to last column
                                fees = clean_text(row[len(row)-2]) if len(row) > 2 else "N/A"
                                
                            # Extract level
                            level = get_level_from_string(prog_name)
                            if not level:
                                level = get_level_from_string(pdf_file)
                            if not level:
                                level = "Other"
                                
                            # Add to list
                            all_programs.append({
                                'id': f"{uni_name}-{prog_name}".replace(' ', '-').lower()[:50] + f"-{len(all_programs)}",
                                'university': uni_name,
                                'level': level,
                                'name': prog_name,
                                'duration': duration,
                                'fees': fees
                            })
                            
        except Exception as e:
            print(f"Error processing {pdf_file}:")
            traceback.print_exc()

    # Save output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_programs, f, indent=2)
        
    print(f"\nSuccessfully extracted {len(all_programs)} programs from PDFs to {OUTPUT_FILE}")

if __name__ == "__main__":
    process_pdfs()
