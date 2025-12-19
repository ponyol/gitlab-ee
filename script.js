// Global state
let allDocs = [];
let currentCategory = 'all';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    await loadDocumentation();
    hideLoading();
    setupEventListeners();
});

// Show loading indicator
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('show');
}

// Hide loading indicator
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('show');
}

// Load and parse the documentation
async function loadDocumentation() {
    try {
        const response = await fetch('gitlab_premium_summaries_ru.md');
        const text = await response.text();
        allDocs = parseDocumentation(text);
        renderCategories();
        renderCards(allDocs);
    } catch (error) {
        console.error('Error loading documentation:', error);
        alert('Ошибка загрузки документации. Проверьте консоль для деталей.');
    }
}

// Parse the markdown documentation file
function parseDocumentation(text) {
    const docs = [];
    const sections = text.split('---').filter(s => s.trim());

    sections.forEach(section => {
        const lines = section.trim().split('\n');

        // Extract title (## 📄 path/to/file.md)
        const titleLine = lines.find(line => line.startsWith('## 📄'));
        if (!titleLine) return;

        const filePath = titleLine.replace('## 📄', '').trim();
        const fileName = filePath.split('/').pop().replace('.md', '');
        const category = filePath.split('/')[0];

        // Extract sections
        const whySection = extractSection(section, '**Зачем это нужно**');
        const featuresSection = extractSection(section, '**Основные возможности**');
        const nuancesSection = extractSection(section, '**Важные нюансы**');

        if (whySection) {
            docs.push({
                filePath,
                fileName,
                category,
                why: whySection,
                features: featuresSection,
                nuances: nuancesSection
            });
        }
    });

    return docs;
}

// Extract a section from markdown text
function extractSection(text, sectionTitle) {
    // Find the section title
    const titleIndex = text.indexOf(sectionTitle);
    if (titleIndex === -1) return '';

    // Start after the title line
    const startIndex = text.indexOf('\n', titleIndex) + 1;
    if (startIndex === 0) return '';

    // Find the end: next section header or separator
    const sectionHeaders = [
        '**Зачем это нужно**',
        '**Основные возможности**',
        '**Важные нюансы**'
    ];

    let endIndex = text.length;

    // Find the next section header (but not the current one)
    for (const header of sectionHeaders) {
        const headerPos = text.indexOf(header, startIndex);
        if (headerPos !== -1 && headerPos < endIndex) {
            endIndex = headerPos;
        }
    }

    // Also check for separator
    const separatorPos = text.indexOf('\n---', startIndex);
    if (separatorPos !== -1 && separatorPos < endIndex) {
        endIndex = separatorPos;
    }

    // Extract and clean the content
    const content = text.substring(startIndex, endIndex);
    return content.trim();
}

// Escape special regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Render categories in the sidebar
function renderCategories() {
    const categoriesContainer = document.getElementById('categories');
    const categories = {};

    // Count documents per category
    allDocs.forEach(doc => {
        if (!categories[doc.category]) {
            categories[doc.category] = 0;
        }
        categories[doc.category]++;
    });

    // Sort categories alphabetically
    const sortedCategories = Object.keys(categories).sort();

    // Add "All" category
    categoriesContainer.innerHTML = `
        <div class="category-item active" data-category="all">
            <span>all</span>
            <span class="category-count">${allDocs.length}</span>
        </div>
    `;

    // Add other categories
    sortedCategories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.dataset.category = category;
        categoryItem.innerHTML = `
            <span>${category}</span>
            <span class="category-count">${categories[category]}</span>
        `;
        categoriesContainer.appendChild(categoryItem);
    });
}

// Render cards
function renderCards(docs) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '';

    if (docs.length === 0) {
        cardsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">
                <span class="prompt">$</span> No documents found
            </div>
        `;
        return;
    }

    docs.forEach(doc => {
        const card = createCard(doc);
        cardsContainer.appendChild(card);
    });
}

// Create a card element
function createCard(doc) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.filePath = doc.filePath;

    // Truncate "why" section if too long
    const maxLength = 500;
    let whyText = doc.why;
    if (whyText.length > maxLength) {
        whyText = whyText.substring(0, maxLength) + '...';
    }

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${doc.fileName}</div>
            <div class="card-category">${doc.category}</div>
        </div>
        <div class="card-content">${whyText}</div>
        <div class="card-footer">
            <a href="#" class="card-link detail-link" data-doc='${JSON.stringify(doc).replace(/'/g, "&apos;")}'>
                подробнее
            </a>
        </div>
    `;

    // Add click event to card (not on link)
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('detail-link')) {
            openCardModal(doc);
        }
    });

    // Add click event to "подробнее" link
    const detailLink = card.querySelector('.detail-link');
    detailLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDocModal(doc.filePath);
    });

    return card;
}

// Open modal with card details (features + nuances)
function openCardModal(doc) {
    const modal = document.getElementById('card-modal');
    const modalTitle = document.getElementById('modal-card-title');
    const modalBody = document.getElementById('modal-card-body');

    modalTitle.textContent = doc.fileName;

    let bodyHTML = '';

    if (doc.features) {
        bodyHTML += `
            <div class="modal-section">
                <h3>Основные возможности</h3>
                <div>${marked.parse(doc.features)}</div>
            </div>
        `;
    }

    if (doc.nuances) {
        bodyHTML += `
            <div class="modal-section">
                <h3>Важные нюансы</h3>
                <div>${marked.parse(doc.nuances)}</div>
            </div>
        `;
    }

    modalBody.innerHTML = bodyHTML;
    modal.classList.add('show');
}

// Close card modal
function closeCardModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('show');
}

// Convert GitLab Hugo shortcodes to HTML/Markdown
function convertShortcodes(text) {
    let converted = text;

    // Convert {{< details >}}...{{< /details >}} to HTML details/summary
    converted = converted.replace(
        /\{\{<\s*details\s*>\}\}([\s\S]*?)\{\{<\s*\/details\s*>\}\}/g,
        (match, content) => {
            return `<details class="gitlab-details">\n<summary>📋 Детали</summary>\n\n${content.trim()}\n</details>`;
        }
    );

    // Convert {{< alert type="..." >}}...{{< /alert >}} to styled divs
    converted = converted.replace(
        /\{\{<\s*alert\s+type="(\w+)"\s*>\}\}([\s\S]*?)\{\{<\s*\/alert\s*>\}\}/g,
        (match, type, content) => {
            const icons = {
                note: '📝',
                warning: '⚠️',
                info: 'ℹ️',
                danger: '🚨',
                tip: '💡'
            };
            const icon = icons[type] || '📌';
            return `<div class="gitlab-alert gitlab-alert-${type}">\n<div class="alert-icon">${icon}</div>\n<div class="alert-content">\n\n${content.trim()}\n\n</div>\n</div>`;
        }
    );

    // Convert {{< history >}}...{{< /history >}} to styled div
    converted = converted.replace(
        /\{\{<\s*history\s*>\}\}([\s\S]*?)\{\{<\s*\/history\s*>\}\}/g,
        (match, content) => {
            return `<div class="gitlab-history">\n<div class="history-header">📅 История изменений</div>\n\n${content.trim()}\n\n</div>`;
        }
    );

    // Convert {{< tabs >}}...{{< /tabs >}} with nested tabs to terminal-style tabs
    converted = converted.replace(
        /\{\{<\s*tabs\s*>\}\}([\s\S]*?)\{\{<\s*\/tabs\s*>\}\}/g,
        (match, content) => {
            // Extract all tabs
            const tabRegex = /\{\{<\s*tab\s+title="([^"]+)"\s*>\}\}([\s\S]*?)(?=\{\{<\s*\/tab\s*>\}\})/g;
            const tabs = [];
            let tabMatch;

            while ((tabMatch = tabRegex.exec(content)) !== null) {
                tabs.push({
                    title: tabMatch[1],
                    content: tabMatch[2].trim()
                });
            }

            if (tabs.length === 0) return match;

            // Generate unique ID for this tab group
            const tabId = 'tab-' + Math.random().toString(36).substr(2, 9);

            // Build tabs HTML
            let tabsHTML = '<div class="gitlab-tabs">\n';
            tabsHTML += '<div class="tabs-header">\n';

            tabs.forEach((tab, index) => {
                const activeClass = index === 0 ? 'active' : '';
                tabsHTML += `<button class="tab-button ${activeClass}" data-tab="${tabId}-${index}">▸ ${tab.title}</button>\n`;
            });

            tabsHTML += '</div>\n<div class="tabs-content">\n';

            tabs.forEach((tab, index) => {
                const activeClass = index === 0 ? 'active' : '';
                tabsHTML += `<div class="tab-pane ${activeClass}" id="${tabId}-${index}">\n\n${tab.content}\n\n</div>\n`;
            });

            tabsHTML += '</div>\n</div>';

            return tabsHTML;
        }
    );

    // Convert {{< icon name="..." >}} to unicode/emoji equivalents
    const iconMap = {
        'plus': '➕',
        'star-o': '⭐',
        'star': '★',
        'ellipsis_v': '⋮',
        'check': '✓',
        'times': '✕',
        'arrow-right': '→',
        'arrow-left': '←',
        'info-circle': 'ℹ️',
        'warning': '⚠️',
        'question-circle': '❓'
    };

    converted = converted.replace(
        /\{\{<\s*icon\s+name="([^"]+)"\s*>\}\}/g,
        (match, iconName) => {
            return iconMap[iconName] || `[${iconName}]`;
        }
    );

    return converted;
}

// Open modal with full document
async function openDocModal(filePath) {
    const modal = document.getElementById('doc-modal');
    const modalTitle = document.getElementById('modal-doc-title');
    const modalBody = document.getElementById('modal-doc-body');

    modalTitle.textContent = filePath;
    modalBody.innerHTML = '<div style="text-align: center; padding: 20px;"><span class="blink">Загрузка...</span></div>';

    modal.classList.add('show');

    try {
        const response = await fetch(`premium_docs/${filePath}`);
        let text = await response.text();

        // Convert GitLab shortcodes before rendering markdown
        text = convertShortcodes(text);

        modalBody.innerHTML = marked.parse(text);

        // Initialize tab functionality after rendering
        initializeTabs();
    } catch (error) {
        console.error('Error loading document:', error);
        modalBody.innerHTML = '<div style="color: #ff4444; text-align: center; padding: 20px;">Ошибка загрузки документа</div>';
    }
}

// Initialize tab switching functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            const tabGroup = this.closest('.gitlab-tabs');

            // Remove active class from all buttons and panes in this group
            tabGroup.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            tabGroup.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            this.classList.add('active');
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// Close document modal
function closeDocModal() {
    const modal = document.getElementById('doc-modal');
    modal.classList.remove('show');
}

// Setup event listeners
function setupEventListeners() {
    // Category filtering
    document.getElementById('categories').addEventListener('click', (e) => {
        const categoryItem = e.target.closest('.category-item');
        if (!categoryItem) return;

        // Update active category
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        categoryItem.classList.add('active');

        const category = categoryItem.dataset.category;
        currentCategory = category;

        // Update content header
        const contentHeader = document.getElementById('current-category');
        contentHeader.textContent = category === 'all'
            ? 'cat all_docs.md'
            : `cat ${category}/*.md`;

        // Filter and render cards
        const filteredDocs = category === 'all'
            ? allDocs
            : allDocs.filter(doc => doc.category === category);

        renderCards(filteredDocs);
    });

    // Search functionality
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        // Filter docs based on current category and search term
        let filteredDocs = currentCategory === 'all'
            ? allDocs
            : allDocs.filter(doc => doc.category === currentCategory);

        if (searchTerm) {
            filteredDocs = filteredDocs.filter(doc => {
                return doc.fileName.toLowerCase().includes(searchTerm) ||
                       doc.category.toLowerCase().includes(searchTerm) ||
                       doc.why.toLowerCase().includes(searchTerm) ||
                       doc.features.toLowerCase().includes(searchTerm) ||
                       doc.nuances.toLowerCase().includes(searchTerm);
            });
        }

        renderCards(filteredDocs);
    });

    // Close modals on background click
    document.getElementById('card-modal').addEventListener('click', (e) => {
        if (e.target.id === 'card-modal') {
            closeCardModal();
        }
    });

    document.getElementById('doc-modal').addEventListener('click', (e) => {
        if (e.target.id === 'doc-modal') {
            closeDocModal();
        }
    });

    // Close modals on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCardModal();
            closeDocModal();
        }
    });
}
