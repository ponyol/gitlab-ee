interface SidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const Sidebar = ({ categories, selectedCategory, onSelectCategory }: SidebarProps) => {
  return (
    <nav className="category-nav">
      <h2>КАТЕГОРИИ</h2>
      <ul>
        {categories.map((category) => (
          <li
            key={category}
            className={category === selectedCategory ? 'active' : ''}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
