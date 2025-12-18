import { Link } from 'react-router-dom';
import { Article } from '../types/types';

interface ArticleCardProps {
  article: Article;
  onCardClick: (article: Article) => void; // New prop
}

const getIconForCategory = (category: string) => {
    switch (category.toLowerCase()) {
        case 'administration':
            return '⚙️';
        case 'auth':
            return '🛡️';
        case 'geo':
            return '🌍';
        case 'ci/cd':
            return '🚀';
        case 'security':
            return '🔒';
        default:
            return '📄';
    }
};

const ArticleCard = ({ article, onCardClick }: ArticleCardProps) => {
  const shortDescription = article.description.length > 100
    ? `${article.description.substring(0, 100)}...`
    : article.description;

  return (
    <div className="article-card" onClick={() => onCardClick(article)}>
        <div className="card-header">
            <div className="card-icon">{getIconForCategory(article.category)}</div>
            <span className="card-category">{article.category.toUpperCase()}</span>
        </div>
        <h3>{article.title}</h3>
        <p>{shortDescription}</p>
        <div className="card-footer">
            <Link to={`/articles/${article.id}`} onClick={(e) => e.stopPropagation()}>
                Подробнее →
            </Link>
        </div>
    </div>
  );
};

export default ArticleCard;
