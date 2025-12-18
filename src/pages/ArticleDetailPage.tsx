import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Article, Database } from '../types/types';

const ArticleDetailPage = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/db.json') // Assumes db.json is in the public folder
      .then((res) => res.json())
      .then((data: Database) => {
        const foundArticle = data.articles.find((a) => a.id === articleId);
        setArticle(foundArticle || null);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
        setArticle(null);
      });
  }, [articleId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!article) {
    return <div>Article not found.</div>;
  }

  return (
    <div className="article-detail-container">
      <nav className="article-nav">
        <Link to="/">&larr; Назад к списку</Link>
      </nav>
      <div className="article-detail">
        <h1>{article.title}</h1>
        <div className="article-meta">
          <span>{article.category}</span>
        </div>
        <ReactMarkdown>{article.content_md}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
