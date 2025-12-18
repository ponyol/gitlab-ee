import { Link } from 'react-router-dom';
import { Article } from '../types/types';

interface ArticleCardProps {
  article: Article;
}

// A simple function to get an icon based on category
const getIconForCategory = (category: string) => {
    // In a real app, you might have a map of categories to icon components or URLs
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

const ArticleCard = ({ article }: ArticleCardProps) => {
  const shortDescription = article.description.length > 100
    ? `${article.description.substring(0, 100)}...`
    : article.description;

  return (
    <Link to={`/articles/${article.id}`} className="article-card">
        <div className="card-header">
            <div className="card-icon">{getIconForCategory(article.category)}</div>
            <span className="card-category">{article.category.toUpperCase()}</span>
        </div>
        <h3>{article.title}</h3>
        <p>{shortDescription}</p>
        <div className="card-footer">
            <span>Подробнее →</span>
        </div>
    </Link>
  );
};

export default ArticleCard;
