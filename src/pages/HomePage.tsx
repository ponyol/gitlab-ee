import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ArticleGrid from '../components/ArticleGrid';
import { Database, Article } from '../types/types';

const HomePage = () => {
  const [db, setDb] = useState<Database>({ articles: [], categories: [] });
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все категории');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetch('db.json')
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

  return (
    <div className="container">
      <aside className="sidebar-container">
        <header className="sidebar-header">
          <div className="logo">
            <img src="/logo.svg" alt="GitLab Logo" />
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
        <ArticleGrid articles={filteredArticles} />
      </main>
    </div>
  );
};

export default HomePage;

