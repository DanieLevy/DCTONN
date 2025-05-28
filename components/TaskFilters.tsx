'use client';

import { useState } from 'react';
import { TaskFilters as TaskFiltersType } from '@/lib/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Search, 
  Filter, 
  X,
  MapPin,
  AlertCircle,
  Calendar,
  Tag,
  Check
} from 'lucide-react';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  onClearFilters: () => void;
  activeTab: 'DC' | 'TT';
}

export function TaskFilters({ filters, onFiltersChange, onClearFilters, activeTab }: TaskFiltersProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const updateFilter = (key: keyof TaskFiltersType, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value === undefined || value === '' || value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  // Check if any filters are applied
  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof TaskFiltersType] && 
    filters[key as keyof TaskFiltersType] !== 'all' &&
    filters[key as keyof TaskFiltersType] !== ''
  );

  // Count active filters (excluding search)
  const activeFilterCount = Object.keys(filters).filter(key => 
    key !== 'search' && 
    filters[key as keyof TaskFiltersType] && 
    filters[key as keyof TaskFiltersType] !== 'all' &&
    filters[key as keyof TaskFiltersType] !== ''
  ).length;

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'EU', label: 'Europe' },
    { value: 'USA', label: 'United States' },
    { value: 'IL', label: 'Israel' },
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
  ];

  const taskTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'Lighting Conditions', label: 'Lighting Conditions' },
    { value: 'Pedestrian Detection', label: 'Pedestrian Detection' },
    { value: 'Emergency Vehicles', label: 'Emergency Vehicles' },
    { value: 'Environmental', label: 'Environmental' },
    { value: 'Road Condition', label: 'Road Condition' },
    { value: 'Road Geometry', label: 'Road Geometry' },
    { value: 'Road Slope', label: 'Road Slope' },
    { value: 'Intersection', label: 'Intersection' },
  ];

  // TT-specific filter options
  const ttCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'A1', label: 'Category A1' },
    { value: 'A2', label: 'Category A2' },
    { value: 'A3', label: 'Category A3' },
    { value: 'A4', label: 'Category A4' },
    { value: 'B1', label: 'Category B1' },
    { value: 'B2', label: 'Category B2' },
    { value: 'B3', label: 'Category B3' },
    { value: 'C1', label: 'Category C1' },
    { value: 'C2', label: 'Category C2' },
    { value: 'D1', label: 'Category D1' },
  ];

  const ttLightingConditions = [
    { value: 'all', label: 'All Lighting' },
    { value: 'daylight', label: 'Daylight' },
    { value: 'night', label: 'Night' },
    { value: 'dusk', label: 'Dusk' },
    { value: 'dawn', label: 'Dawn' },
  ];

  const ttScenarios = [
    { value: 'all', label: 'All Scenarios' },
    { value: 'Highway merge', label: 'Highway Merge' },
    { value: 'Urban intersection', label: 'Urban Intersection' },
    { value: 'Parking scenario', label: 'Parking Scenario' },
    { value: 'Emergency stop', label: 'Emergency Stop' },
    { value: 'Lane change', label: 'Lane Change' },
    { value: 'Roundabout entry', label: 'Roundabout Entry' },
    { value: 'Speed bump', label: 'Speed Bump' },
    { value: 'Construction zone', label: 'Construction Zone' },
    { value: 'School zone', label: 'School Zone' },
    { value: 'Tunnel entry', label: 'Tunnel Entry' },
  ];

  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterModalOpen(true)}
            className="relative h-10 px-3"
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600 text-white"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Clear Button - Only show when filters are applied */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 px-3 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 mt-3">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === 'all' || value === '' || key === 'search') return null;
              
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <span className="text-xs capitalize">
                    {key === 'location' && value === 'EU' ? 'Europe' :
                     key === 'location' && value === 'USA' ? 'United States' :
                     key === 'location' && value === 'IL' ? 'Israel' :
                     key === 'category' ? `Category: ${value}` :
                     key === 'lighting' ? `Lighting: ${value}` :
                     key === 'scenario' ? `Scenario: ${value}` :
                     `${key}: ${value}`}
                  </span>
                  <button
                    onClick={() => updateFilter(key as keyof TaskFiltersType, undefined)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFilterModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Filter Tasks</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* Location Filter - Common for both */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="space-y-2">
                  {locations.map((location) => {
                    const isSelected = (filters.location || 'all') === location.value;
                    return (
                      <button
                        key={location.value}
                        onClick={() => updateFilter('location', location.value)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{location.label}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Filter - Common for both */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="space-y-2">
                  {priorities.map((priority) => {
                    const isSelected = (filters.priority || 'all') === priority.value;
                    return (
                      <button
                        key={priority.value}
                        onClick={() => updateFilter('priority', priority.value)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{priority.label}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter - Common for both */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="space-y-2">
                  {statuses.map((status) => {
                    const isSelected = (filters.status || 'all') === status.value;
                    return (
                      <button
                        key={status.value}
                        onClick={() => updateFilter('status', status.value)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{status.label}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DC-specific filters */}
              {activeTab === 'DC' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                  <div className="space-y-2">
                    {taskTypes.map((type) => {
                      const isSelected = (filters.type || 'all') === type.value;
                      return (
                        <button
                          key={type.value}
                          onClick={() => updateFilter('type', type.value)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 text-blue-700' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Tag className="h-4 w-4" />
                            <span className="text-sm">{type.label}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TT-specific filters */}
              {activeTab === 'TT' && (
                <>
                  {/* TT Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Category</label>
                    <div className="space-y-2">
                      {ttCategories.map((category) => {
                        const isSelected = (filters.category || 'all') === category.value;
                        return (
                          <button
                            key={category.value}
                            onClick={() => updateFilter('category', category.value)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Tag className="h-4 w-4" />
                              <span className="text-sm">{category.label}</span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TT Lighting Conditions Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lighting Conditions</label>
                    <div className="space-y-2">
                      {ttLightingConditions.map((lighting) => {
                        const isSelected = (filters.lighting || 'all') === lighting.value;
                        return (
                          <button
                            key={lighting.value}
                            onClick={() => updateFilter('lighting', lighting.value)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">{lighting.label}</span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TT Scenario Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Scenario</label>
                    <div className="space-y-2">
                      {ttScenarios.map((scenario) => {
                        const isSelected = (filters.scenario || 'all') === scenario.value;
                        return (
                          <button
                            key={scenario.value}
                            onClick={() => updateFilter('scenario', scenario.value)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Tag className="h-4 w-4" />
                              <span className="text-sm">{scenario.label}</span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                className="text-sm"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-sm"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 