'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Car, 
  Brain,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface AIInsight {
  type: 'priority' | 'workload' | 'efficiency' | 'deadline' | 'resource';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  tasks?: string[];
  metrics?: Record<string, number>;
}

interface InsightsData {
  insights: AIInsight[];
  workloadAnalysis: {
    overview: {
      totalDCTasks: number;
      totalTTTasks: number;
      totalSubtasks: number;
      completionRate: number;
    };
    byLocation: Record<string, number>;
    byPriority: Record<string, number>;
    trends: {
      recommendation: string;
    };
  };
  priorityRecommendations: Array<{
    category: string;
    priority: string;
    count: number;
    suggestion: string;
    examples: string[];
  }>;
  efficiencyMetrics: {
    taskCreationRate: number;
    completionVelocity: number;
    bottlenecks: Array<{
      type: string;
      area: string;
      severity: string;
      description: string;
    }>;
    recommendations: Array<{
      type: string;
      description: string;
      potentialSavings?: string;
    }>;
  };
  generatedAt: string;
  totalTasksAnalyzed: number;
}

interface AIInsightsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIInsightsDashboard({ isOpen, onClose }: AIInsightsDashboardProps) {
  const { token } = useAuth();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen && token && !insights) {
      fetchInsights();
    }
  }, [isOpen, token]);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[AI Insights Dashboard] Fetching insights...');
      
      const response = await fetch('/api/ai/insights', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setInsights(data.data);
        setLastUpdated(new Date());
        console.log('[AI Insights Dashboard] Insights loaded successfully');
      } else {
        throw new Error(data.error || 'Failed to fetch insights');
      }
    } catch (error) {
      console.error('[AI Insights Dashboard] Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'priority': return <AlertTriangle className="h-5 w-5" />;
      case 'workload': return <BarChart3 className="h-5 w-5" />;
      case 'efficiency': return <Zap className="h-5 w-5" />;
      case 'deadline': return <Clock className="h-5 w-5" />;
      case 'resource': return <Car className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Task Insights</h2>
                <p className="text-purple-100">
                  {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Intelligent task analysis and recommendations'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={fetchInsights}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 w-10 h-10 p-0"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing tasks and generating insights...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Failed to load insights</p>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                <Button onClick={fetchInsights} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Tasks</p>
                        <p className="text-2xl font-bold">{insights.totalTasksAnalyzed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold">{insights.workloadAnalysis.overview.completionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Target className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">TT Subtasks</p>
                        <p className="text-2xl font-bold">{insights.workloadAnalysis.overview.totalSubtasks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Key Insights</p>
                        <p className="text-2xl font-bold">{insights.insights.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    <span>Key Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.insights.map((insight, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getImpactColor(insight.impact)}`}>
                        <div className="flex items-start space-x-3">
                          <div className={`mt-1 ${insight.impact === 'high' ? 'text-red-600' : insight.impact === 'medium' ? 'text-orange-600' : 'text-blue-600'}`}>
                            {getInsightIcon(insight.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{insight.title}</h3>
                            <p className="text-sm opacity-90 mb-2">{insight.description}</p>
                            {insight.tasks && insight.tasks.length > 0 && (
                              <div className="text-xs opacity-75">
                                <strong>Examples:</strong> {insight.tasks.slice(0, 3).join(', ')}
                                {insight.tasks.length > 3 && ` +${insight.tasks.length - 3} more`}
                              </div>
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${insight.impact === 'high' ? 'bg-red-100 text-red-700' : insight.impact === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {insight.impact.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Priority Recommendations */}
              {insights.priorityRecommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-red-600" />
                      <span>Priority Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {insights.priorityRecommendations.map((rec, index) => (
                        <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-red-900">{rec.category}</h3>
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              {rec.count} tasks
                            </span>
                          </div>
                          <p className="text-red-800 text-sm mb-2">{rec.suggestion}</p>
                          {rec.examples.length > 0 && (
                            <div className="text-xs text-red-600">
                              <strong>Examples:</strong> {rec.examples.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Efficiency Recommendations */}
              {insights.efficiencyMetrics.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      <span>Efficiency Opportunities</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.efficiencyMetrics.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 text-sm">{rec.description}</p>
                          {rec.potentialSavings && (
                            <p className="text-green-600 text-xs mt-1">
                              <strong>Potential benefit:</strong> {rec.potentialSavings}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Workload Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span>Tasks by Location</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(insights.workloadAnalysis.byLocation).map(([location, count]) => (
                        <div key={location} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{location}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(count / Math.max(...Object.values(insights.workloadAnalysis.byLocation))) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span>Tasks by Priority</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(insights.workloadAnalysis.byPriority).map(([priority, count]) => {
                        const priorityColors = {
                          high: 'bg-red-600',
                          medium: 'bg-orange-600', 
                          low: 'bg-green-600'
                        };
                        return (
                          <div key={priority} className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{priority}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-600'} h-2 rounded-full`}
                                  style={{ 
                                    width: `${(count / Math.max(...Object.values(insights.workloadAnalysis.byPriority))) * 100}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-8">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Recommendation */}
              {insights.workloadAnalysis.trends.recommendation && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <Brain className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">AI Recommendation</h3>
                        <p className="text-blue-800">{insights.workloadAnalysis.trends.recommendation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
} 