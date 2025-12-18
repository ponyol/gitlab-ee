import markdown
import os
import re
import shutil

# --- Configuration ---
SOURCE_MAIN_MD = 'gitlab_premium_summaries_ru.md'
SOURCE_DOCS_DIR = 'premium_docs'
OUTPUT_DIR = 'docs'
CSS_FILE = 'style.css'

# --- HTML Template ---
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="/{css_path}">
</head>
<body>
    <pre><code>{content}</code></pre>
</body>
</html>
"""

# --- Helper Functions ---

def clean_filename(title):
    """Generates a clean filename from a title."""
    filename = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '-').lower()
    return f"{filename}.html"

def convert_md_to_html(md_content):
    """Converts markdown content to HTML."""
    return markdown.markdown(md_content, extensions=['fenced_code', 'tables'])

def rewrite_links(html_content, base_path=""):
    """Rewrites .md links to .html links."""
    def replace_md_with_html(match):
        original_link = match.group(1)
        # Handle absolute links or links not ending in .md
        if original_link.startswith(('http://', 'https://', 'ftp://', '#')) or not original_link.endswith('.md'):
            return f'href="{original_link}"'

        # Convert .md to .html
        new_link = original_link.replace('.md', '.html')

        # Adjust path for relative links if necessary, though direct replace should work for same-dir links
        # This part might need more sophisticated path resolution for complex relative paths
        return f'href="{new_link}"'

    # Pattern to find href attributes ending in .md
    # This also tries to capture links that might be relative from base_path
    rewritten_html = re.sub(r'href="([^"]+\.md)"', replace_md_with_html, html_content)
    return rewritten_html

def ensure_dir(path):
    """Ensures a directory exists."""
    os.makedirs(path, exist_ok=True)

# --- Main Generation Logic ---

def generate_site():
    print(f"--- Generating site in '{OUTPUT_DIR}' ---")

    # 1. Prepare output directory
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR) # Clean previous output
    ensure_dir(OUTPUT_DIR)
    shutil.copy(CSS_FILE, os.path.join(OUTPUT_DIR, CSS_FILE))
    print(f"Cleaned '{OUTPUT_DIR}' and copied '{CSS_FILE}'")

    # 2. Process main summary file: gitlab_premium_summaries_ru.md
    print(f"Processing main summary file: '{SOURCE_MAIN_MD}'")
    with open(SOURCE_MAIN_MD, 'r', encoding='utf-8') as f:
        main_md_content = f.read()

    sections = re.split(r'(^## .*$)', main_md_content, flags=re.MULTILINE)
    
    index_links = []
    current_section_md = ""
    section_title = "Введение" # Default for content before first H2
    section_counter = 0

    # Handle content before the first H2 if it exists
    if sections and not sections[0].startswith('## '):
        if sections[0].strip():
            filename = clean_filename("intro")
            html_content = convert_md_to_html(sections[0].strip())
            full_html = HTML_TEMPLATE.format(title="Введение", content=html_content, css_path=CSS_FILE)
            with open(os.path.join(OUTPUT_DIR, filename), 'w', encoding='utf-8') as out_f:
                out_f.write(full_html)
            index_links.append(f'- <a href="/{filename}">Введение</a>')
            section_counter += 1
        sections = sections[1:] # Remove the processed intro section

    for i in range(0, len(sections), 2):
        if i + 1 < len(sections):
            section_title_raw = sections[i].strip().replace('## ', '')
            section_title_clean = section_title_raw
            section_md = sections[i+1].strip()
            
            if not section_md: # Skip empty sections
                continue

            section_counter += 1
            filename = clean_filename(section_title_clean)
            
            html_content = convert_md_to_html(section_md)
            html_content = rewrite_links(html_content) # Rewrite links within the section
            
            full_html = HTML_TEMPLATE.format(title=section_title_clean, content=html_content, css_path=CSS_FILE)
            section_path = os.path.join(OUTPUT_DIR, filename)
            with open(section_path, 'w', encoding='utf-8') as out_f:
                out_f.write(full_html)
            print(f"Generated section: '{section_title_clean}' -> '{section_path}'")
            index_links.append(f'- <a href="/{filename}">{section_title_clean}</a>')

    # Create main index.html
    index_title = "Обзор функций GitLab EE"
    index_content_md = f"# {index_title}\n\n" + "\n".join(index_links)
    index_html_content = convert_md_to_html(index_content_md)
    index_html_content = rewrite_links(index_html_content) # Ensure links in index are also rewritten

    final_index_html = HTML_TEMPLATE.format(title=index_title, content=index_html_content, css_path=CSS_FILE)
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(final_index_html)
    print(f"Generated main index: '{os.path.join(OUTPUT_DIR, 'index.html')}'")


    # 3. Process premium_docs directory
    print(f"Processing '{SOURCE_DOCS_DIR}' directory...")
    for root, _, files in os.walk(SOURCE_DOCS_DIR):
        for file in files:
            if file.endswith('.md'):
                md_path = os.path.join(root, file)
                
                # Determine relative path from SOURCE_DOCS_DIR
                relative_path = os.path.relpath(md_path, SOURCE_DOCS_DIR)
                
                # Determine output HTML path
                output_html_path_relative = relative_path.replace('.md', '.html')
                output_html_path = os.path.join(OUTPUT_DIR, SOURCE_DOCS_DIR, output_html_path_relative)
                
                ensure_dir(os.path.dirname(output_html_path))

                with open(md_path, 'r', encoding='utf-8') as f:
                    md_content = f.read()
                
                html_content = convert_md_to_html(md_content)
                
                # Adjust CSS path for nested directories. Calculate relative path from output_html_path to root docs
                levels_deep = len(os.path.dirname(output_html_path_relative).split(os.sep))
                css_relative_path = '/'.join(['..'] * levels_deep) + '/' + CSS_FILE if levels_deep > 0 else CSS_FILE
                
                # Get title from first heading or filename
                title_match = re.search(r'^#\s*(.*)$', md_content, flags=re.MULTILINE)
                title = title_match.group(1).strip() if title_match else file.replace('.md', '')

                full_html = HTML_TEMPLATE.format(title=title, content=rewrite_links(html_content), css_path=css_relative_path)
                with open(output_html_path, 'w', encoding='utf-8') as f:
                    f.write(full_html)
                print(f"Generated: '{md_path}' -> '{output_html_path}'")

    print("--- Site generation complete! ---")

# Execute generation
if __name__ == "__main__":
    try:
        # Check for markdown library and install if missing
        try:
            import markdown
        except ImportError:
            print("Python 'markdown' library not found. Installing...")
            # Assuming run_shell_command is defined elsewhere or can be replaced with subprocess
            # For demonstration, let's assume it's available or we'd use subprocess.run(['pip', 'install', 'markdown'])
            # run_shell_command("pip install markdown", "Install markdown library") 
            import subprocess
            subprocess.run(['pip', 'install', 'markdown'], check=True)
            import markdown # Try importing again

        generate_site()
    except Exception as e:
        print(f"An error occurred during site generation: {e}")
        import traceback
        traceback.print_exc()
