import os
import json
import re

# --- Configuration ---
SOURCE_MAIN_MD = 'gitlab_premium_summaries_ru.md'
DOCS_ROOT = 'premium_docs'
OUTPUT_DIR = 'public'
OUTPUT_FILE = 'db.json'

def get_category_from_path(path):
    """Extracts a category from the file path."""
    # path is like 'administration/auditor_users.md'
    parts = path.split(os.sep)
    if len(parts) > 1:
        category = parts[0].replace('_', ' ').capitalize()
        return category
    return "General"

def get_title_from_md_content(md_content, fallback_path):
    """Extracts the title from the first H1 heading of the markdown content."""
    match = re.search(r'^#\s*(.*)', md_content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    # Fallback to a title-cased filename if no H1 is found
    return os.path.basename(fallback_path).replace('.md', '').replace('_', ' ').capitalize()

def get_description_from_summary(summary_block):
    """Extracts the description from the 'Зачем это нужно' section."""
    # First, try the '1. Зачем это нужно' or 'Зачем это нужно' format
    patterns = [
        r'(?:#+\s*1\.\s*)?Зачем это нужно\s*\n\n(.*?)(?=\n###|\n---|$)',
        r'(?:#+\s*1\.\s*)?Зачем это нужно\s*\n(.*?)(?=\n###|\n---|$)' # Handles cases with no blank line
    ]
    for pattern in patterns:
        match = re.search(pattern, summary_block, re.DOTALL)
        if match:
            # Clean up the description: remove newlines and extra spaces
            description = match.group(1).strip().replace('\n', ' ')
            return ' '.join(description.split())
    return ""


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

    # Split the main summary file into blocks for each article
    article_summaries = re.split(r'\n---\n', content)

    all_articles = []
    all_categories = set()
    
    print(f"Found {len(article_summaries)} potential article summaries.")

    for summary_block in article_summaries:
        if not summary_block.strip():
            continue

        # Extract the file path from the header, e.g., '## 📄 administration/auditor_users.md'
        path_match = re.search(r'##\s*📄\s*([^\s]+)', summary_block)
        if not path_match:
            continue

        relative_path = path_match.group(1)
        full_path = os.path.join(DOCS_ROOT, relative_path)

        if os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content_md = f.read()
                
                title = get_title_from_md_content(content_md, relative_path)
                description = get_description_from_summary(summary_block)
                category = get_category_from_path(relative_path)
                
                # Create a more URL-friendly and unique ID
                article_id = f"{category.lower().replace(' ', '-')}-{os.path.splitext(os.path.basename(relative_path))[0]}"

                all_articles.append({
                    "id": article_id,
                    "title": title,
                    "path": relative_path,
                    "description": description,
                    "category": category,
                    "content_md": content_md,
                })
                all_categories.add(category)
                
            except Exception as e:
                print(f"Error processing file '{full_path}': {e}")
        else:
            print(f"Warning: File path '{full_path}' found in summary but does not exist.")

    # Prepare final JSON structure
    final_data = {
        "articles": sorted(all_articles, key=lambda x: x['title']),
        "categories": ["Все категории"] + sorted(list(all_categories))
    }

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILE)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated '{output_path}' with {len(all_articles)} articles.")
    print("--- Data preparation complete! ---")

if __name__ == "__main__":
    main()
