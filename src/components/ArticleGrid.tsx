import ArticleCard from './ArticleCard';
import { Article } from '../types/types';

interface ArticleGridProps {
  articles: Article[];
  onCardClick: (article: Article) => void; // New prop
}

const ArticleGrid = ({ articles, onCardClick }: ArticleGridProps) => {
  return (
    <div className="article-grid">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onCardClick={onCardClick} />
      ))}
    </div>
  );
};

export default ArticleGrid;
