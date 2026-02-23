import React from 'react';

const EventFilters = ({ selectedTypes, onTypeChange }) => { // onFilterChange → onTypeChange
  const filterTypes = [
    { id: 'all', label: '전체', emoji: '🌐' },
    { id: 'macro', label: '거시경제', emoji: '📊' },
    { id: 'stock', label: '기업', emoji: '📈' },
    { id: 'crypto', label: '암호화폐', emoji: '₿' }
  ];

  const handleFilterClick = (typeId) => {
    if (typeId === 'all') {
      onTypeChange(['all']); // onFilterChange → onTypeChange
    } else {
      let newTypes = [...selectedTypes];
      
      // 'all' 제거
      newTypes = newTypes.filter(t => t !== 'all');
      
      if (newTypes.includes(typeId)) {
        // 이미 선택된 경우 제거
        newTypes = newTypes.filter(t => t !== typeId);
      } else {
        // 새로 추가
        newTypes.push(typeId);
      }
      
      // 아무것도 선택 안 되면 'all'로
      if (newTypes.length === 0) {
        newTypes = ['all'];
      }
      
      onTypeChange(newTypes); // onFilterChange → onTypeChange
    }
  };

  return (
    <div className="mb-8">
      <div className="flex space-x-4">
        {filterTypes.map(filter => (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter.id)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedTypes.includes(filter.id) || selectedTypes.includes('all')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{filter.emoji}</span>
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventFilters;