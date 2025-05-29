'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { TTTask, TTSubtask, DateAssignment } from '@/lib/types';
import { 
  Brain, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  Users,
  MapPin,
  Zap,
  BarChart3,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,
  CalendarDays,
  Plus,
  ChevronRight,
  Eye,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface TTTaskAIInsightsProps {
  task: TTTask;
  assignments: DateAssignment[];
  onSuggestAssignment?: (suggestion: CalendarSuggestion) => void;
}

interface AIInsight {
  id: string;
  type: 'execution' | 'optimization' | 'calendar' | 'performance' | 'safety' | 'resource';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  metrics?: Record<string, any>;
  icon: any;
  color: string;
}

interface CalendarSuggestion {
  id: string;
  type: 'empty_day' | 'batch_optimization' | 'lighting_grouping' | 'scenario_clustering';
  date: string;
  endDate?: string;
  title: string;
  description: string;
  subtaskIds: string[];
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedDuration: number; // in hours
  benefits: string[];
}

export function TTTaskAIInsights({ task, assignments, onSuggestAssignment }: TTTaskAIInsightsProps) {
  const { token } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [calendarSuggestions, setCalendarSuggestions] = useState<CalendarSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  useEffect(() => {
    if (task && token) {
      generateAIInsights();
    }
  }, [task, assignments, token]);

  const generateAIInsights = async () => {
    setIsLoading(true);
    try {
      // Generate insights based on task data
      const taskInsights = await analyzeTaskExecution();
      const optimizationInsights = await analyzeOptimizationOpportunities();
      const calendarInsights = await analyzeCalendarOptimization();
      const performanceInsights = await analyzePerformanceMetrics();
      
      setInsights([...taskInsights, ...optimizationInsights, ...calendarInsights, ...performanceInsights]);
      
      // Generate calendar suggestions
      const suggestions = await generateCalendarSuggestions();
      setCalendarSuggestions(suggestions);
      
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('[TT AI Insights] Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeTaskExecution = async (): Promise<AIInsight[]> => {
    const insights: AIInsight[] = [];
    const subtasks = task.subtasks || [];
    
    // Execution progress analysis
    const completedSubtasks = subtasks.filter(st => st.isExecuted || st.status === 'completed');
    const pendingSubtasks = subtasks.filter(st => st.status === 'pending');
    const activeSubtasks = subtasks.filter(st => st.status === 'in_progress' || st.isAssigned);
    
    const completionRate = subtasks.length > 0 ? (completedSubtasks.length / subtasks.length) * 100 : 0;
    
    if (completionRate < 30 && subtasks.length > 10) {
      insights.push({
        id: 'low-completion',
        type: 'execution',
        priority: 'high',
        title: 'Low Completion Rate Detected',
        description: `Only ${completionRate.toFixed(1)}% of subtasks completed. Consider prioritizing high-impact scenarios first.`,
        icon: AlertTriangle,
        color: 'text-red-600',
        metrics: { completionRate, pendingCount: pendingSubtasks.length }
      });
    } else if (completionRate > 80) {
      insights.push({
        id: 'high-completion',
        type: 'performance',
        priority: 'low',
        title: 'Excellent Progress!',
        description: `Outstanding ${completionRate.toFixed(1)}% completion rate. You're on track for early completion.`,
        icon: CheckCircle,
        color: 'text-green-600',
        metrics: { completionRate }
      });
    }
    
    // Scenario distribution analysis
    const scenarioGroups = subtasks.reduce((acc, st) => {
      acc[st.scenario] = (acc[st.scenario] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    if (Object.keys(scenarioGroups).length > 5) {
      insights.push({
        id: 'scenario-diversity',
        type: 'optimization',
        priority: 'medium',
        title: 'Diverse Scenario Coverage',
        description: `${Object.keys(scenarioGroups).length} different scenarios detected. Consider grouping similar scenarios for efficient execution.`,
        icon: Target,
        color: 'text-blue-600',
        metrics: { scenarioCount: Object.keys(scenarioGroups).length, scenarios: scenarioGroups }
      });
    }
    
    return insights;
  };

  const analyzeOptimizationOpportunities = async (): Promise<AIInsight[]> => {
    const insights: AIInsight[] = [];
    const subtasks = task.subtasks || [];
    
    // Lighting condition optimization
    const lightingGroups = subtasks.reduce((acc, st) => {
      acc[st.lighting] = (acc[st.lighting] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const nightTasks = lightingGroups['Night'] || 0;
    const dayTasks = lightingGroups['Day'] || 0;
    
    if (nightTasks > 0 && dayTasks > 0) {
      insights.push({
        id: 'lighting-optimization',
        type: 'optimization',
        priority: 'medium',
        title: 'Lighting Condition Grouping',
        description: `Mix of day (${dayTasks}) and night (${nightTasks}) scenarios. Batch similar lighting conditions to minimize setup changes.`,
        icon: Sun,
        color: 'text-yellow-600',
        metrics: { nightTasks, dayTasks },
        action: {
          label: 'View Suggestions',
          onClick: () => {
            // Generate lighting-based calendar suggestions
            generateLightingOptimizedSuggestions();
          }
        }
      });
    }
    
    // Speed profile analysis
    const speedProfiles = subtasks.reduce((acc, st) => {
      const speedKey = `${st.ego_speed}_${st.target_speed}`;
      acc[speedKey] = (acc[speedKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    if (Object.keys(speedProfiles).length > 8) {
      insights.push({
        id: 'speed-complexity',
        type: 'execution',
        priority: 'medium',
        title: 'Complex Speed Requirements',
        description: `${Object.keys(speedProfiles).length} different speed combinations. Plan adequate time for vehicle reconfiguration.`,
        icon: Zap,
        color: 'text-purple-600',
        metrics: { speedCombinations: Object.keys(speedProfiles).length }
      });
    }
    
    return insights;
  };

  const analyzeCalendarOptimization = async (): Promise<AIInsight[]> => {
    const insights: AIInsight[] = [];
    const subtasks = task.subtasks || [];
    
    // Assignment efficiency analysis
    const assignedSubtasks = subtasks.filter(st => st.isAssigned);
    const unassignedSubtasks = subtasks.filter(st => !st.isAssigned);
    
    if (unassignedSubtasks.length > assignedSubtasks.length) {
      insights.push({
        id: 'assignment-gap',
        type: 'calendar',
        priority: 'high',
        title: 'Assignment Gap Detected',
        description: `${unassignedSubtasks.length} subtasks are unassigned. Consider scheduling them soon to maintain momentum.`,
        icon: Calendar,
        color: 'text-orange-600',
        metrics: { unassigned: unassignedSubtasks.length, assigned: assignedSubtasks.length },
        action: {
          label: 'Auto-Schedule',
          onClick: () => {
            generateAutoScheduleSuggestions();
          }
        }
      });
    }
    
    // Workload distribution analysis
    const assignmentDates = assignments.reduce((acc, assignment) => {
      const dates = getAssignmentDates(assignment);
      dates.forEach(date => {
        acc[date] = (acc[date] || 0) + assignment.subtaskIds.length;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const heavyDays = Object.entries(assignmentDates).filter(([_, count]) => count > 10);
    
    if (heavyDays.length > 0) {
      insights.push({
        id: 'workload-balance',
        type: 'calendar',
        priority: 'medium',
        title: 'Workload Balancing Opportunity',
        description: `${heavyDays.length} day(s) have heavy workloads (>10 subtasks). Consider redistributing for better balance.`,
        icon: BarChart3,
        color: 'text-indigo-600',
        metrics: { heavyDays: heavyDays.length, maxWorkload: Math.max(...Object.values(assignmentDates)) }
      });
    }
    
    return insights;
  };

  const analyzePerformanceMetrics = async (): Promise<AIInsight[]> => {
    const insights: AIInsight[] = [];
    const subtasks = task.subtasks || [];
    
    // Execution efficiency
    const executedSubtasks = subtasks.filter(st => st.isExecuted);
    const totalRuns = executedSubtasks.reduce((sum, st) => sum + (st.executedRuns || 0), 0);
    const requiredRuns = executedSubtasks.reduce((sum, st) => sum + parseInt(st.number_of_runs || '1'), 0);
    
    if (executedSubtasks.length > 0) {
      const efficiency = requiredRuns > 0 ? (totalRuns / requiredRuns) * 100 : 0;
      
      if (efficiency > 110) {
        insights.push({
          id: 'execution-efficiency',
          type: 'performance',
          priority: 'medium',
          title: 'Over-Execution Detected',
          description: `Running ${efficiency.toFixed(1)}% of required runs. Consider optimizing test procedures to reduce redundancy.`,
          icon: Activity,
          color: 'text-yellow-600',
          metrics: { efficiency, totalRuns, requiredRuns }
        });
      } else if (efficiency > 95 && efficiency <= 105) {
        insights.push({
          id: 'optimal-efficiency',
          type: 'performance',
          priority: 'low',
          title: 'Optimal Execution Efficiency',
          description: `Perfect execution efficiency at ${efficiency.toFixed(1)}%. Maintaining excellent test discipline.`,
          icon: Target,
          color: 'text-green-600',
          metrics: { efficiency }
        });
      }
    }
    
    return insights;
  };

  const generateCalendarSuggestions = async (): Promise<CalendarSuggestion[]> => {
    const suggestions: CalendarSuggestion[] = [];
    const subtasks = task.subtasks || [];
    const unassignedSubtasks = subtasks.filter(st => !st.isAssigned);
    
    if (unassignedSubtasks.length === 0) return suggestions;
    
    // Generate empty day suggestions
    const emptyDaySuggestions = await findEmptyDays();
    suggestions.push(...emptyDaySuggestions);
    
    // Generate lighting-optimized suggestions
    const lightingSuggestions = await generateLightingGroupSuggestions();
    suggestions.push(...lightingSuggestions);
    
    // Generate scenario clustering suggestions
    const scenarioSuggestions = await generateScenarioClusterSuggestions();
    suggestions.push(...scenarioSuggestions);
    
    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  };

  const findEmptyDays = async (): Promise<CalendarSuggestion[]> => {
    const suggestions: CalendarSuggestion[] = [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Find days with no assignments in the next week
    const busyDates = new Set(
      assignments.flatMap(assignment => getAssignmentDates(assignment))
    );
    
    const unassignedSubtasks = (task.subtasks || []).filter(st => !st.isAssigned);
    
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = checkDate.toISOString().split('T')[0];
      
      if (!busyDates.has(dateString) && checkDate.getDay() !== 0 && checkDate.getDay() !== 6) { // Skip weekends
        const dayOfWeek = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Suggest a batch of related subtasks for this empty day
        const suggestedSubtasks = unassignedSubtasks.slice(0, Math.min(8, unassignedSubtasks.length));
        
        if (suggestedSubtasks.length > 0) {
          suggestions.push({
            id: `empty-day-${dateString}`,
            type: 'empty_day',
            date: dateString,
            title: `Available ${dayOfWeek}`,
            description: `Perfect opportunity to schedule ${suggestedSubtasks.length} unassigned subtasks`,
            subtaskIds: suggestedSubtasks.map(st => st.id),
            priority: 'medium',
            reason: 'No conflicts, optimal for batch execution',
            estimatedDuration: suggestedSubtasks.length * 0.5, // 30 mins per subtask
            benefits: [
              'No scheduling conflicts',
              'Efficient batch execution',
              'Maintains project momentum'
            ]
          });
        }
      }
    }
    
    return suggestions;
  };

  const generateLightingGroupSuggestions = async (): Promise<CalendarSuggestion[]> => {
    const suggestions: CalendarSuggestion[] = [];
    const unassignedSubtasks = (task.subtasks || []).filter(st => !st.isAssigned);
    
    // Group by lighting conditions
    const lightingGroups = unassignedSubtasks.reduce((acc, st) => {
      const lighting = st.lighting || 'Day';
      if (!acc[lighting]) acc[lighting] = [];
      acc[lighting].push(st);
      return acc;
    }, {} as Record<string, TTSubtask[]>);
    
    Object.entries(lightingGroups).forEach(([lighting, subtasks]) => {
      if (subtasks.length >= 3) {
        const nextAvailableDate = getNextAvailableDate();
        
        suggestions.push({
          id: `lighting-${lighting.toLowerCase()}-${nextAvailableDate}`,
          type: 'lighting_grouping',
          date: nextAvailableDate,
          title: `${lighting} Scenarios Batch`,
          description: `Group ${subtasks.length} ${lighting.toLowerCase()} scenarios for efficient execution`,
          subtaskIds: subtasks.map(st => st.id),
          priority: lighting === 'Night' ? 'high' : 'medium',
          reason: `Minimize lighting setup changes, optimize ${lighting.toLowerCase()} testing conditions`,
          estimatedDuration: subtasks.length * 0.4, // Slightly faster due to grouping
          benefits: [
            'Reduced setup time',
            'Consistent testing conditions',
            `Optimized for ${lighting.toLowerCase()} scenarios`
          ]
        });
      }
    });
    
    return suggestions;
  };

  const generateScenarioClusterSuggestions = async (): Promise<CalendarSuggestion[]> => {
    const suggestions: CalendarSuggestion[] = [];
    const unassignedSubtasks = (task.subtasks || []).filter(st => !st.isAssigned);
    
    // Group by scenario
    const scenarioGroups = unassignedSubtasks.reduce((acc, st) => {
      const scenario = st.scenario || 'Unknown';
      if (!acc[scenario]) acc[scenario] = [];
      acc[scenario].push(st);
      return acc;
    }, {} as Record<string, TTSubtask[]>);
    
    Object.entries(scenarioGroups).forEach(([scenario, subtasks]) => {
      if (subtasks.length >= 4) {
        const nextAvailableDate = getNextAvailableDate(1); // 1 day offset
        
        suggestions.push({
          id: `scenario-${scenario.toLowerCase()}-${nextAvailableDate}`,
          type: 'scenario_clustering',
          date: nextAvailableDate,
          title: `${scenario} Scenario Focus`,
          description: `Dedicated session for ${subtasks.length} ${scenario} variations`,
          subtaskIds: subtasks.map(st => st.id),
          priority: scenario.includes('CBFA') ? 'high' : 'medium',
          reason: `Deep focus on ${scenario} scenario variations with consistent setup`,
          estimatedDuration: subtasks.length * 0.35, // More efficient due to scenario focus
          benefits: [
            'Scenario expertise development',
            'Consistent test setup',
            'Optimized parameter variations'
          ]
        });
      }
    });
    
    return suggestions;
  };

  const getAssignmentDates = (assignment: DateAssignment): string[] => {
    switch (assignment.assignmentType) {
      case 'single_day':
        return assignment.date ? [assignment.date] : [];
      case 'date_range':
        if (assignment.startDate && assignment.endDate) {
          const dates: string[] = [];
          const startDate = new Date(assignment.startDate);
          const endDate = new Date(assignment.endDate);
          
          for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
            dates.push(current.toISOString().split('T')[0]);
          }
          return dates;
        }
        return [];
      case 'duration_days':
        if (assignment.startDate && assignment.durationDays) {
          const dates: string[] = [];
          const startDate = new Date(assignment.startDate);
          
          for (let i = 0; i < assignment.durationDays; i++) {
            const current = new Date(startDate);
            current.setDate(startDate.getDate() + i);
            dates.push(current.toISOString().split('T')[0]);
          }
          return dates;
        }
        return [];
      default:
        return [];
    }
  };

  const getNextAvailableDate = (offsetDays: number = 0): string => {
    const today = new Date();
    const checkDate = new Date(today.getTime() + (1 + offsetDays) * 24 * 60 * 60 * 1000);
    
    const busyDates = new Set(
      assignments.flatMap(assignment => getAssignmentDates(assignment))
    );
    
    let availableDate = checkDate;
    while (busyDates.has(availableDate.toISOString().split('T')[0]) || 
           availableDate.getDay() === 0 || availableDate.getDay() === 6) {
      availableDate = new Date(availableDate.getTime() + 24 * 60 * 60 * 1000);
    }
    
    return availableDate.toISOString().split('T')[0];
  };

  const generateLightingOptimizedSuggestions = () => {
    // Implementation for lighting optimization suggestions
    generateCalendarSuggestions().then(suggestions => {
      setCalendarSuggestions(suggestions);
    });
  };

  const generateAutoScheduleSuggestions = () => {
    // Implementation for auto-schedule suggestions
    generateCalendarSuggestions().then(suggestions => {
      setCalendarSuggestions(suggestions);
    });
  };

  const getInsightIcon = (insight: AIInsight) => {
    const IconComponent = insight.icon;
    return <IconComponent className={`h-5 w-5 ${insight.color}`} />;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">AI analyzing task data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {/* AI Insights Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>AI Task Insights</span>
            {lastAnalyzed && (
              <span className="text-sm text-gray-500 font-normal">
                • Analyzed {lastAnalyzed.toLocaleTimeString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Lightbulb className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No specific insights available. Task appears well-optimized!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="mt-1">
                    {getInsightIcon(insight)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{insight.title}</h3>
                      <Badge className={getPriorityBadge(insight.priority)}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                    {insight.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={insight.action.onClick}
                        className="text-xs"
                      >
                        {insight.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Suggestions */}
      {calendarSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <span>Smart Calendar Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calendarSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSuggestAssignment?.(suggestion)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium">{suggestion.title}</h3>
                      <Badge className={getPriorityBadge(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{suggestion.estimatedDuration}h</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <p className="text-xs text-gray-500 mb-2">{suggestion.reason}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>📅 {new Date(suggestion.date).toLocaleDateString()}</span>
                      <span>📊 {suggestion.subtaskIds.length} subtasks</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                  
                  {suggestion.benefits.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex flex-wrap gap-1">
                        {suggestion.benefits.map((benefit, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 