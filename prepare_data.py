import os
import json
import re
import markdown

# --- Configuration ---
SOURCE_MAIN_MD = 'gitlab_premium_summaries_ru.md'
DOCS_ROOT = 'premium_docs'
OUTPUT_DIR = 'public'
OUTPUT_FILE = 'db.json'

def get_category_from_path(path):
    """Extracts a category from the file path."""
    parts = path.split(os.sep)
    if len(parts) > 1:
        category = parts[0].replace('_', ' ').capitalize()
        return category
    return "General"

def get_description_from_summary(summary_block):
    """Extracts the description from the 'Зачем это нужно' section."""
    patterns = [
        r'(?:#+\s*1\.\s*)?Зачем это нужно\s*\n\n(.*?)(?=\n###|\n---|$)',
        r'(?:#+\s*1\.\s*)?Зачем это нужно\s*\n(.*?)(?=\n###|\n---|$)'
    ]
    for pattern in patterns:
        match = re.search(pattern, summary_block, re.DOTALL)
        if match:
            description = match.group(1).strip().replace('\n', ' ')
            return ' '.join(description.split())
    return ""

def get_title_from_description(description):
    """Generates a title from the first 7 words of the description."""
    if not description:
        return "Без заголовка"
    words = description.split()
    title = ' '.join(words[:7])
    if len(words) > 7:
        title += '...'
    return title

def get_details_html_from_summary(summary_block):
    """Extracts 'Основные возможности' and 'Важные нюансы' into a single HTML string."""
    features_match = re.search(r'###\s*(?:2\.\s*)?Основные возможности\s*\n(.*?)(?=\n###|\n---|$)', summary_block, re.DOTALL)
    nuances_match = re.search(r'###\s*(?:3\.\s*)?Важные нюансы\s*\n(.*?)(?=\n###|\n---|$)', summary_block, re.DOTALL)
    
    details_md = ""
    if features_match:
        details_md += "<h3>Основные возможности</h3>\n" + features_match.group(1).strip() + "\n\n"
    if nuances_match:
        details_md += "<h3>Важные нюансы</h3>\n" + nuances_match.group(1).strip() + "\n\n"
        
    if not details_md:
        return ""
        
    return markdown.markdown(details_md)

def main():
    """
    Main function to generate the JSON database.
    """
    print("--- Starting data preparation ---")
    
    if not os.path.exists(SOURCE_MAIN_MD):
        print(f"Error: Main summary file not found at '{SOURCE_MAIN_MD}'")
        return

    with open(SOURCE_MAIN_MD, 'r', encoding='utf-8') as f:
        content = f.read()

    article_summaries = re.split(r'\n---\n', content)
    all_articles = []
    all_categories = set()
    
    print(f"Found {len(article_summaries)} potential article summaries.")

    for summary_block in article_summaries:
        if not summary_block.strip():
            continue

        path_match = re.search(r'##\s*📄\s*([^\s]+)', summary_block)
        if not path_match:
            continue

        relative_path = path_match.group(1)
        full_path = os.path.join(DOCS_ROOT, relative_path)

        if os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content_md = f.read()
                
                description = get_description_from_summary(summary_block)
                title = get_title_from_description(description)
                details_html = get_details_html_from_summary(summary_block)
                category = get_category_from_path(relative_path)
                
                article_id = f"{category.lower().replace(' ', '-')}-{os.path.splitext(os.path.basename(relative_path))[0]}"

                all_articles.append({
                    "id": article_id,
                    "title": title,
                    "path": relative_path,
                    "description": description,
                    "details_html": details_html,
                    "category": category,
                    "content_md": content_md,
                })
                all_categories.add(category)
                
            except Exception as e:
                print(f"Error processing file '{full_path}': {e}")
        else:
            print(f"Warning: File path '{full_path}' found in summary but does not exist.")

    final_data = {
        "articles": sorted(all_articles, key=lambda x: x['title']),
        "categories": ["Все категории"] + sorted(list(all_categories))
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILE)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated '{output_path}' with {len(all_articles)} articles.")
    print("--- Data preparation complete! ---")

if __name__ == "__main__":
    main()
