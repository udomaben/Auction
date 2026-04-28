import React from 'react'
import { CATEGORIES } from '../../utils/constants'

const CategoryNav = ({ activeCategory, onCategoryChange, scrollable = true }) => {
  return (
    <div className={`border-b border-neutral-tertiary bg-white sticky top-[73px] z-30 ${
      scrollable ? 'overflow-x-auto scrollbar-hide' : ''
    }`}>
      <div className={`flex ${scrollable ? 'w-max' : 'flex-wrap justify-center'} gap-1 py-3 px-4`}>
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 whitespace-nowrap rounded-full transition ${
            !activeCategory
              ? 'bg-brand-primary text-white'
              : 'text-neutral-dark-gray hover:bg-neutral-secondary'
          }`}
        >
          All Categories
        </button>
        
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-4 py-2 whitespace-nowrap rounded-full transition flex items-center gap-2 ${
              activeCategory === cat.id
                ? 'bg-brand-primary text-white'
                : 'text-neutral-dark-gray hover:bg-neutral-secondary'
            }`}
          >
            <span className="text-lg">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryNav