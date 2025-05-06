import React from 'react';
import { EllipsisHorizontal } from './icons/EllipsisHorizontal';

interface ItemCardProps {
  title: string;
  preview: string;
  onClick: () => void;
  onOptionsClick?: (e: React.MouseEvent) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ title, preview, onClick, onOptionsClick }) => {
  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOptionsClick) {
      onOptionsClick(e);
    }
  };

  return (
    <div 
      className="p-3 border-b border-[#333333] cursor-pointer hover:bg-[#292929] transition-colors"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-white text-base line-clamp-1 mb-1 pr-6">{title}</h3>
        {onOptionsClick && (
          <button 
            className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors" 
            onClick={handleOptionsClick}
          >
            <EllipsisHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>
      <p className="text-white/60 text-sm line-clamp-2">{preview}</p>
    </div>
  );
};

export default ItemCard;