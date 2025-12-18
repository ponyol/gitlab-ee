export interface Article {
  id: string;
  title: string;
  path: string;
  description: string;
  category: string;
  content_md: string;
  details_html: string; // New field
}

export interface Database {
  articles: Article[];
  categories: string[];
}
