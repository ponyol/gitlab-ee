import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ArticleGrid from '../components/ArticleGrid';
import ArticleModal from '../components/ArticleModal';
import { Database, Article } from '../types/types';

const HomePage = () => {
  const [db, setDb] = useState<Database>({ articles: [], categories: [] });
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все категории');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalArticle, setModalArticle] = useState<Article | null>(null);

  useEffect(() => {
    // Correctly reference the file from the public folder
    fetch(import.meta.env.BASE_URL + 'db.json')
      .then((res) => res.json())
      .then((data: Database) => {
        setDb(data);
        setFilteredArticles(data.articles);
      });
  }, []);

  useEffect(() => {
    let articles = db.articles;

    if (selectedCategory !== 'Все категории') {
      articles = articles.filter((article) => article.category === selectedCategory);
    }

    if (searchTerm) {
      articles = articles.filter((article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArticles(articles);
  }, [selectedCategory, searchTerm, db.articles]);

  const handleCardClick = (article: Article) => {
    setModalArticle(article);
  };

  const handleCloseModal = () => {
    setModalArticle(null);
  };

  return (
    <div className="container">
      <aside className="sidebar-container">
        <header className="sidebar-header">
          <div className="logo">
            <img src={import.meta.env.BASE_URL + 'logo.svg'} alt="GitLab Logo" />
            <div>
              <h1>GitLab Premium</h1>
              <span>БАЗА ЗНАНИЙ</span>
            </div>
          </div>
        </header>
        <Sidebar
          categories={db.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <footer className="sidebar-footer">
            Всего статей: {db.articles.length}
        </footer>
      </aside>
      <main className="main-content">
        <div className="main-header">
          <input
            type="text"
            placeholder="Поиск по документации..."
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="share-button">Поделиться</button>
        </div>
        <ArticleGrid articles={filteredArticles} onCardClick={handleCardClick} />
      </main>
      <ArticleModal article={modalArticle} onClose={handleCloseModal} />
    </div>
  );
};

export default HomePage;

