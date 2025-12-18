import { Article } from '../types/types';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
}

const ArticleModal = ({ article, onClose }: ArticleModalProps) => {
  if (!article) {
    return null;
  }

  // Stop propagation to prevent closing when clicking inside the modal content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{article.title}</h2>
        <div 
          className="modal-body" 
          dangerouslySetInnerHTML={{ __html: article.details_html }} 
        />
      </div>
    </div>
  );
};

export default ArticleModal;
