import csv
import os
import html
import math # Added for math.ceil
import argparse # Added for command-line arguments

# --- Configuration ---
TEMPLATE_PATH = "print.html"
PDF_DATA_CSV_PATH = "pdfdata.csv"
# CATEGORY_ID will now come from command-line arguments
# Example: CATEGORY_ID = "FP"
FORMATIONS_DATA_CSV_PATH_TEMPLATE = "../formations/{category_id}/data.csv" 
OUTPUT_HTML_PATH = "output.html"

# Columns to include in the Page 4 table
# (CSV Header, Display Header (optional, defaults to CSV Header))
TABLE_COLUMNS = [
    ("ID", "ID"),
    ("Thème de la Formation", "Thème de la Formation"),
    ("Temps Moyen de Formation", "Durée"),
    ("Prix", "Prix")
]

# --- Helper Functions ---

def load_pdf_data(csv_path, category_id_to_find):
    """Loads general PDF data for a specific category from pdfdata.csv."""
    try:
        with open(csv_path, mode='r', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            for row in reader:
                if row.get("CategoryID") == category_id_to_find:
                    return row # Found the matching category
            print(f"Warning: Category ID '{category_id_to_find}' not found in {csv_path} (expected column 'CategoryID')")
            return {} # Category ID not found
    except FileNotFoundError:
        print(f"Error: PDF data CSV not found at {csv_path}")
        return {}
    except Exception as e:
        print(f"Error reading PDF data CSV: {e}")
        return {}

def load_formations_data(csv_path):
    """Loads formations data for a specific category and returns data and fieldnames."""
    formations = []
    fieldnames = []
    try:
        with open(csv_path, mode='r', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            fieldnames = reader.fieldnames if reader.fieldnames else []
            for row in reader:
                formations.append(row)
        return formations, fieldnames
    except FileNotFoundError:
        print(f"Error: Formations CSV not found at {csv_path}")
        return [], []
    except Exception as e:
        print(f"Error reading formations CSV: {e}")
        return [], []

def generate_table_rows_html(formations_data):
    """Generates HTML table rows for the formations data."""
    rows_html = ""
    if not formations_data:
        return "<tr><td colspan=\"4\">Aucune formation disponible pour cette catégorie.</td></tr>" # Updated colspan

    for formation in formations_data:
        rows_html += "                    <tr>\n"
        for csv_col, _ in TABLE_COLUMNS:
            cell_data = formation.get(csv_col, 'N/A') # Get data, default to N/A if column missing
            rows_html += f"                        <td>{cell_data}</td>\n"
        rows_html += "                    </tr>\n"
    return rows_html

def generate_course_detail_pages_html(formations_data, fieldnames):
    """Generates HTML for individual course detail pages."""
    all_detail_pages_html = "\n"
    fields_to_exclude = [
        "Accessibilité aux Personnes en Situation de Handicap", 
        "Lieu"
    ]

    if not formations_data or not fieldnames:
        return ""

    for formation in formations_data:
        all_detail_pages_html += '    <div class="page-content page-break">\n'
        all_detail_pages_html += '        <div class="course-detail-page-content">\n'
        
        theme = formation.get("Thème de la Formation", "Titre de formation non disponible")
        all_detail_pages_html += f'            <h1>{html.escape(theme)}</h1>\n'
        
        for fieldname in fieldnames:
            if fieldname in fields_to_exclude:
                continue # Skip this field
            value = formation.get(fieldname, 'N/A')
            all_detail_pages_html += '            <div class="course-detail-field">\n'
            all_detail_pages_html += f'                <h4 class="field-label">{html.escape(fieldname)}</h4>\n'
            all_detail_pages_html += f'                <p class="field-value">{html.escape(str(value))}</p>\n' # Ensure value is str
            all_detail_pages_html += '            </div>\n'
            
        all_detail_pages_html += '        </div>\n'
        all_detail_pages_html += '    </div>\n'
    
    return all_detail_pages_html

def generate_summary_table_pages_html(formations_data, category_name, items_per_page=15):
    """Generates HTML for paginated course summary table pages."""
    if not formations_data:
        return ""

    all_summary_pages_html = ""
    num_courses = len(formations_data)
    num_pages = math.ceil(num_courses / items_per_page)
    category_name_escaped = html.escape(category_name)

    for page_num in range(num_pages):
        start_index = page_num * items_per_page
        end_index = start_index + items_per_page
        current_page_courses = formations_data[start_index:end_index]

        page_class = "page-content"
        # Page 3 always has a page-break after it.
        # So, the first summary page doesn'''t need an explicit page-break div itself.
        # Subsequent summary pages WILL need a page-break.
        if page_num > 0: 
            page_class += " page-break" 

        all_summary_pages_html += f'    <div class="{page_class}">\n'
        all_summary_pages_html += '        <div class="page-four-content">\n' # Reusing .page-four-content CSS
        all_summary_pages_html += f'            <h1>Formations - {category_name_escaped}</h1>\n'
        all_summary_pages_html += '            <table>\n'
        all_summary_pages_html += '                <thead>\n'
        all_summary_pages_html += '                    <tr>\n'
        # Use display headers from TABLE_COLUMNS for consistency if defined, else raw field names
        # For simplicity, let'''s re-define headers here as per original Page 4 intent
        all_summary_pages_html += '                        <th>ID</th>\n'
        all_summary_pages_html += '                        <th>Thème de la Formation</th>\n'
        all_summary_pages_html += '                        <th>Durée</th>\n'
        all_summary_pages_html += '                        <th>Prix</th>\n'
        all_summary_pages_html += '                    </tr>\n'
        all_summary_pages_html += '                </thead>\n'
        all_summary_pages_html += '                <tbody>\n'
        all_summary_pages_html += generate_table_rows_html(current_page_courses) # generate_table_rows_html needs to handle the current_page_courses structure
        all_summary_pages_html += '                </tbody>\n'
        all_summary_pages_html += '            </table>\n'
        all_summary_pages_html += '        </div>\n'
        all_summary_pages_html += '    </div>\n'

    return all_summary_pages_html

def create_output_html(template_content, pdf_general_data, table_rows_content_obsolete=None):
    """Populates the HTML template with data for non-repeating sections."""
    populated_html = template_content

    # Populate Page 1 data
    category_name = pdf_general_data.get("Category Name", "N/A")
    course_quantity = pdf_general_data.get("Course Quantity", "0")
    populated_html = populated_html.replace("{{Category Name}}", html.escape(category_name))
    populated_html = populated_html.replace("{{Course Quantity}}", html.escape(course_quantity))

    # Populate Category Info Page data ("Public Ciblé" and "Nos Formateurs")
    public_cible_text = pdf_general_data.get("Public Cible", "Information sur le public ciblé non disponible.")
    nos_formateurs_text = pdf_general_data.get("Nos Formateurs", "Information sur nos formateurs non disponible.")
    populated_html = populated_html.replace("{{Public_Cible_Text}}", html.escape(public_cible_text))
    populated_html = populated_html.replace("{{Nos_Formateurs_Text}}", html.escape(nos_formateurs_text))

    # The old loop for Page 4 table rows is removed as Page 4 is now dynamically generated.

    return populated_html

# --- Main Script ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a PDF catalogue for a specific category.")
    parser.add_argument("category_id", help="The ID of the category to generate the catalogue for (e.g., AHS, GEDD, CP, FP). Ensure corresponding data exists.")
    args = parser.parse_args()
    
    CATEGORY_ID = args.category_id # Use the parsed argument

    # Construct absolute paths relative to this script's location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    template_file_path = os.path.join(script_dir, TEMPLATE_PATH)
    pdf_data_file_path = os.path.join(script_dir, PDF_DATA_CSV_PATH)
    
    # formations_data_file_path uses the new CATEGORY_ID from args
    formations_data_file_path = os.path.abspath(os.path.join(script_dir, "..", "formations", CATEGORY_ID, "data.csv"))
    output_file_path = os.path.join(script_dir, OUTPUT_HTML_PATH)

    print(f"--- Generating catalogue for Category ID: {CATEGORY_ID} ---")
    print(f"Attempting to load template from: {template_file_path}")
    print(f"Attempting to load PDF data from: {pdf_data_file_path}")
    print(f"Attempting to load formations data from: {formations_data_file_path}")

    # 1. Load HTML Template
    try:
        with open(template_file_path, 'r', encoding='utf-8') as f:
            html_template_content = f.read()
    except FileNotFoundError:
        print(f"Error: HTML template not found at {template_file_path}")
        exit(1)
    except Exception as e:
        print(f"Error reading HTML template: {e}")
        exit(1)

    # 2. Load Data
    general_data = load_pdf_data(pdf_data_file_path, CATEGORY_ID)
    category_name_for_summary = general_data.get("Category Name", "Formations") # Get category name for summary titles
        
    formations, course_fieldnames = load_formations_data(formations_data_file_path)
    if not formations:
        print(f"No formations data loaded for category {CATEGORY_ID}. The table on Page 4 might be empty or show an error message, and no detail pages will be generated.")

    # 3. Generate HTML for paginated course summary table pages
    summary_table_pages_html_block = generate_summary_table_pages_html(formations, category_name_for_summary, items_per_page=15)

    # 4. Generate HTML for individual course detail pages
    course_detail_pages_html_block = ""
    if formations and course_fieldnames:
        course_detail_pages_html_block = generate_course_detail_pages_html(formations, course_fieldnames)
    else:
        print("Skipping generation of course detail pages due to missing formation data or fieldnames.")

    # 5. Populate the main template (Pages 1-3, Category Info, Contact page)
    # Note: create_output_html no longer needs table_rows_content for Page 4 summary
    populated_main_template = create_output_html(html_template_content, general_data)

    # 6. Insert the paginated summary table pages
    html_after_summary_insertion = populated_main_template.replace(
        "<!-- ###COURSE_SUMMARY_PAGES_INSERT_POINT### -->", 
        summary_table_pages_html_block
    )

    # 7. Insert the course detail pages HTML block
    final_html = html_after_summary_insertion.replace(
        "<!-- ###COURSE_DETAIL_PAGES_INSERT_POINT### -->", 
        course_detail_pages_html_block
    )

    # 8. Write to Output HTML File
    try:
        with open(output_file_path, 'w', encoding='utf-8') as f:
            f.write(final_html)
        print(f"Successfully generated populated HTML: {output_file_path}")
        print(f"Please open {output_file_path} in a browser and print to PDF.")
        print("\n---")
        print("Regarding table pagination for very long tables:")
        print("This script currently places all table rows into Page 4.")
        print("For PDF output, the browser'''s print functionality will handle pagination.")
        print("To improve this, CSS properties like 'page-break-inside: avoid;' for rows,")
        print("and 'thead { display: table-header-group; }' for repeating headers are recommended in the HTML template.")
        print("For more advanced control, a dedicated HTML-to-PDF library would be needed.")
        print("---")

    except Exception as e:
        print(f"Error writing output HTML: {e}") 