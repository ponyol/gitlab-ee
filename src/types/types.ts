export interface Article {
  id: string;
  title: string;
  path: string;
  description: string;
  category: string;
  content_md: string;
}

export interface Database {
  articles: Article[];
  categories: string[];
}
