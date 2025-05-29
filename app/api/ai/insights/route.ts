import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { loadComprehensiveAIData } from '@/lib/data-store';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234';

interface TaskInsight {
  type: 'priority' | 'workload' | 'efficiency' | 'deadline' | 'resource' | 'tt_optimization' | 'scenario_analysis';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  tasks?: string[];
  metrics?: Record<string, number>;
}

interface UserPerformanceInsight {
  completionRate: number;
  averageTaskTime: number;
  preferredTaskTypes: string[];
  strengthAreas: string[];
  improvementAreas: string[];
  recommendedTasks: string[];
}

export async function GET(request: NextRequest) {
  try {
    console.log('[AI Insights] Generating comprehensive task insights and recommendations');
    
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Load comprehensive AI data
    const aiData = await loadComprehensiveAIData();
    console.log('[AI Insights] Loaded comprehensive data:', {
      dcTasks: aiData.dcTasks.length,
      ttTasks: aiData.ttTasks.length,
      subtasks: aiData.allSubtasks.length
    });

    // Generate enhanced insights
    const insights = await generateEnhancedTaskInsights(aiData);
    const workloadAnalysis = generateEnhancedWorkloadAnalysis(aiData);
    const priorityRecommendations = generateEnhancedPriorityRecommendations(aiData);
    const efficiencyMetrics = calculateEnhancedEfficiencyMetrics(aiData);
    const ttSpecificInsights = generateTTSpecificInsights(aiData);

    return NextResponse.json({
      success: true,
      data: {
        insights: [...insights, ...ttSpecificInsights],
        workloadAnalysis,
        priorityRecommendations,
        efficiencyMetrics,
        generatedAt: new Date().toISOString(),
        totalTasksAnalyzed: aiData.dcTasks.length + aiData.allSubtasks.length,
        dataBreakdown: {
          dcTasks: aiData.dcTasks.length,
          ttTasks: aiData.ttTasks.length,
          ttSubtasks: aiData.allSubtasks.length
        }
      }
    });

  } catch (error: any) {
    console.error('[AI Insights] Error generating insights:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

async function generateEnhancedTaskInsights(aiData: any): Promise<TaskInsight[]> {
  const insights: TaskInsight[] = [];

  // High priority tasks analysis (DC + TT)
  const highPriorityDC = aiData.dcTasks.filter((t: any) => t.priority === 'high');
  const highPriorityTT = aiData.allSubtasks.filter((t: any) => t.priority === 'high' || t.priority === '1');
  
  const totalHighPriority = highPriorityDC.length + highPriorityTT.length;
  
  if (totalHighPriority > 0) {
    insights.push({
      type: 'priority',
      title: `${totalHighPriority} High Priority Items Require Attention`,
      description: `${highPriorityDC.length} DC tasks and ${highPriorityTT.length} TT subtasks need immediate focus.`,
      impact: 'high',
      actionable: true,
      tasks: [
        ...highPriorityDC.slice(0, 3).map((t: any) => t.title),
        ...highPriorityTT.slice(0, 3).map((t: any) => t.jira_subtask_number || t.scenario)
      ],
      metrics: { dcCount: highPriorityDC.length, ttCount: highPriorityTT.length }
    });
  }

  // TT completion rate analysis
  const completedSubtasks = aiData.allSubtasks.filter((st: any) => st.isExecuted || st.status === 'completed');
  if (aiData.allSubtasks.length > 0) {
    const completionRate = (completedSubtasks.length / aiData.allSubtasks.length) * 100;
    
    if (completionRate < 25) {
      insights.push({
        type: 'efficiency',
        title: 'Low TT Task Completion Rate',
        description: `Only ${completionRate.toFixed(1)}% of TT subtasks completed. Consider accelerating execution to meet deadlines.`,
        impact: 'high',
        actionable: true,
        metrics: { completionRate, totalSubtasks: aiData.allSubtasks.length, completed: completedSubtasks.length }
      });
    } else if (completionRate > 80) {
      insights.push({
        type: 'efficiency',
        title: 'Excellent TT Progress!',
        description: `Outstanding ${completionRate.toFixed(1)}% completion rate on TT subtasks. Maintaining strong execution momentum.`,
        impact: 'low',
        actionable: false,
        metrics: { completionRate }
      });
    }
  }

  // Overdue tasks analysis
  const now = new Date();
  const overdueTasks = aiData.dcTasks.filter((t: any) => {
    if (!t.deadline) return false;
    return new Date(t.deadline) < now && t.status !== 'completed';
  });

  const overdueSubtasks = aiData.allSubtasks.filter((st: any) => {
    if (!st.assignedDate || st.isExecuted) return false;
    return new Date(st.assignedDate) < now;
  });

  const totalOverdue = overdueTasks.length + overdueSubtasks.length;

  if (totalOverdue > 0) {
    insights.push({
      type: 'deadline',
      title: `${totalOverdue} Tasks Are Past Due`,
      description: `${overdueTasks.length} DC tasks and ${overdueSubtasks.length} TT subtasks require immediate attention.`,
      impact: 'high',
      actionable: true,
      tasks: [
        ...overdueTasks.slice(0, 2).map((t: any) => t.title),
        ...overdueSubtasks.slice(0, 2).map((t: any) => t.jira_subtask_number || t.scenario)
      ]
    });
  }

  return insights;
}

function generateTTSpecificInsights(aiData: any): TaskInsight[] {
  const insights: TaskInsight[] = [];

  // Scenario distribution analysis
  const scenarioGroups = aiData.allSubtasks.reduce((acc: Record<string, number>, st: any) => {
    acc[st.scenario] = (acc[st.scenario] || 0) + 1;
    return acc;
  }, {});

  if (Object.keys(scenarioGroups).length > 0) {
    const topScenario = Object.entries(scenarioGroups).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    insights.push({
      type: 'scenario_analysis',
      title: 'Scenario Distribution Insights',
      description: `${Object.keys(scenarioGroups).length} different scenarios. ${topScenario[0]} is most common with ${topScenario[1]} subtasks.`,
      impact: 'medium',
      actionable: true,
      metrics: scenarioGroups
    });
  }

  // Lighting condition optimization
  const lightingGroups = aiData.allSubtasks.reduce((acc: Record<string, number>, st: any) => {
    acc[st.lighting] = (acc[st.lighting] || 0) + 1;
    return acc;
  }, {});

  const nightTasks = lightingGroups['Night'] || 0;
  const dayTasks = lightingGroups['Day'] || 0;

  if (nightTasks > 0 && dayTasks > 0) {
    insights.push({
      type: 'tt_optimization',
      title: 'Lighting Condition Optimization Opportunity',
      description: `Mix of ${dayTasks} day and ${nightTasks} night scenarios. Consider grouping by lighting for efficient execution.`,
      impact: 'medium',
      actionable: true,
      metrics: { dayTasks, nightTasks }
    });
  }

  // Speed profile complexity
  const speedProfiles = aiData.allSubtasks.reduce((acc: Record<string, number>, st: any) => {
    const speedKey = `${st.ego_speed || 'N/A'}_${st.target_speed || 'N/A'}`;
    acc[speedKey] = (acc[speedKey] || 0) + 1;
    return acc;
  }, {});

  if (Object.keys(speedProfiles).length > 10) {
    insights.push({
      type: 'tt_optimization',
      title: 'Complex Speed Requirements Detected',
      description: `${Object.keys(speedProfiles).length} different speed combinations require careful planning and vehicle configuration time.`,
      impact: 'medium',
      actionable: true,
      metrics: { speedCombinations: Object.keys(speedProfiles).length }
    });
  }

  return insights;
}

function generateEnhancedWorkloadAnalysis(aiData: any) {
  return {
    overview: {
      totalDCTasks: aiData.dcTasks.length,
      totalTTTasks: aiData.ttTasks.length,
      totalSubtasks: aiData.allSubtasks.length,
      completionRate: aiData.statistics.completionRate
    },
    byLocation: aiData.statistics.locationBreakdown,
    byPriority: aiData.statistics.priorityBreakdown,
    byCategory: aiData.statistics.categoryBreakdown,
    byScenario: aiData.statistics.scenarioBreakdown,
    byLighting: aiData.statistics.lightingBreakdown,
    trends: {
      recommendation: aiData.statistics.completionRate < 30 
        ? 'Focus on TT task execution acceleration - completion rate needs improvement'
        : aiData.statistics.completionRate > 80
        ? 'Excellent execution rate - maintain current momentum'
        : 'Good progress - consider optimizing scenario grouping for efficiency'
    }
  };
}

function generateEnhancedPriorityRecommendations(aiData: any) {
  const recommendations: any[] = [];

  // Weather-sensitive tasks
  const weatherTasks = aiData.dcTasks.filter((t: any) => 
    t.weather && t.weather !== 'clear' && t.status !== 'completed'
  );
  
  if (weatherTasks.length > 0) {
    recommendations.push({
      category: 'Weather-Dependent DC Tasks',
      priority: 'high',
      count: weatherTasks.length,
      suggestion: 'Schedule weather-specific DC tasks during appropriate conditions',
      examples: weatherTasks.slice(0, 3).map((t: any) => t.title)
    });
  }

  // Night scenario tasks
  const nightSubtasks = aiData.allSubtasks.filter((st: any) => 
    st.lighting === 'Night' && !st.isExecuted
  );

  if (nightSubtasks.length > 0) {
    recommendations.push({
      category: 'Night TT Scenarios',
      priority: 'high',
      count: nightSubtasks.length,
      suggestion: 'Group night scenarios for efficient lighting setup and execution',
      examples: nightSubtasks.slice(0, 3).map((st: any) => st.jira_subtask_number || st.scenario)
    });
  }

  // High priority unassigned subtasks
  const unassignedHighPriority = aiData.allSubtasks.filter((st: any) => 
    (st.priority === 'high' || st.priority === '1') && !st.isAssigned && !st.isExecuted
  );

  if (unassignedHighPriority.length > 0) {
    recommendations.push({
      category: 'Unassigned High Priority TT',
      priority: 'high',
      count: unassignedHighPriority.length,
      suggestion: 'Schedule high priority TT subtasks immediately to prevent delays',
      examples: unassignedHighPriority.slice(0, 3).map((st: any) => st.jira_subtask_number || st.scenario)
    });
  }

  return recommendations;
}

function calculateEnhancedEfficiencyMetrics(aiData: any) {
  const now = new Date();
  const activeWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Calculate execution efficiency for TT tasks
  const executedSubtasks = aiData.allSubtasks.filter((st: any) => st.isExecuted);
  const totalRuns = executedSubtasks.reduce((sum: number, st: any) => sum + (st.executedRuns || 0), 0);
  const requiredRuns = executedSubtasks.reduce((sum: number, st: any) => sum + parseInt(st.number_of_runs || '1'), 0);

  return {
    taskCreationRate: aiData.dcTasks.filter((t: any) => 
      t.createdAt && new Date(t.createdAt) > activeWeek
    ).length,
    completionVelocity: executedSubtasks.filter((st: any) => 
      st.updatedAt && new Date(st.updatedAt) > activeWeek
    ).length,
    ttExecutionEfficiency: requiredRuns > 0 ? (totalRuns / requiredRuns) * 100 : 100,
    scenarioEfficiency: calculateScenarioEfficiency(aiData.allSubtasks),
    bottlenecks: identifyEnhancedBottlenecks(aiData),
    recommendations: generateEnhancedEfficiencyRecommendations(aiData)
  };
}

function calculateScenarioEfficiency(subtasks: any[]) {
  const scenarioGroups = subtasks.reduce((acc: Record<string, any>, st: any) => {
    if (!acc[st.scenario]) {
      acc[st.scenario] = { total: 0, completed: 0 };
    }
    acc[st.scenario].total++;
    if (st.isExecuted || st.status === 'completed') {
      acc[st.scenario].completed++;
    }
    return acc;
  }, {});

  return Object.entries(scenarioGroups).map(([scenario, data]: [string, any]) => ({
    scenario,
    completionRate: (data.completed / data.total) * 100,
    total: data.total,
    completed: data.completed
  })).sort((a, b) => b.completionRate - a.completionRate);
}

function identifyEnhancedBottlenecks(aiData: any) {
  const bottlenecks: any[] = [];

  // Check for TT scenario bottlenecks
  const scenarioCompletion = calculateScenarioEfficiency(aiData.allSubtasks);
  const poorScenarios = scenarioCompletion.filter(s => s.completionRate < 20 && s.total > 5);

  poorScenarios.forEach(scenario => {
    bottlenecks.push({
      type: 'scenario',
      area: scenario.scenario,
      severity: 'high',
      description: `${scenario.scenario} has low completion rate (${scenario.completionRate.toFixed(1)}%) with ${scenario.total} subtasks`
    });
  });

  // Check for lighting condition bottlenecks
  const lightingCompletion = aiData.allSubtasks.reduce((acc: Record<string, any>, st: any) => {
    if (!acc[st.lighting]) {
      acc[st.lighting] = { total: 0, completed: 0 };
    }
    acc[st.lighting].total++;
    if (st.isExecuted || st.status === 'completed') {
      acc[st.lighting].completed++;
    }
    return acc;
  }, {});

  Object.entries(lightingCompletion).forEach(([lighting, data]) => {
    const typedData = data as any;
    const completionRate = (typedData.completed / typedData.total) * 100;
    if (completionRate < 30 && typedData.total > 10) {
      bottlenecks.push({
        type: 'lighting',
        area: lighting,
        severity: 'medium',
        description: `${lighting} scenarios have low completion rate (${completionRate.toFixed(1)}%)`
      });
    }
  });

  return bottlenecks;
}

function generateEnhancedEfficiencyRecommendations(aiData: any) {
  const recommendations: any[] = [];

  // Scenario batching opportunities
  const scenarioGroups = aiData.allSubtasks.reduce((acc: Record<string, any[]>, st: any) => {
    if (!acc[st.scenario]) acc[st.scenario] = [];
    acc[st.scenario].push(st);
    return acc;
  }, {});

  Object.entries(scenarioGroups).forEach(([scenario, subtasks]) => {
    const unassigned = (subtasks as any[]).filter(st => !st.isAssigned && !st.isExecuted);
    if (unassigned.length >= 5) {
      recommendations.push({
        type: 'scenario_batching',
        description: `Batch ${unassigned.length} unassigned ${scenario} subtasks for efficient execution`,
        potentialSavings: `Could save ${Math.floor(unassigned.length * 0.1)} hours of setup time`
      });
    }
  });

  // Lighting optimization
  const lightingGroups = aiData.allSubtasks.reduce((acc: Record<string, any[]>, st: any) => {
    if (!acc[st.lighting]) acc[st.lighting] = [];
    acc[st.lighting].push(st);
    return acc;
  }, {});

  Object.entries(lightingGroups).forEach(([lighting, subtasks]) => {
    const unassigned = (subtasks as any[]).filter(st => !st.isAssigned && !st.isExecuted);
    if (unassigned.length >= 3) {
      recommendations.push({
        type: 'lighting_optimization',
        description: `Group ${unassigned.length} ${lighting.toLowerCase()} subtasks to minimize lighting setup changes`,
        potentialSavings: `Could reduce setup time by ${Math.floor(unassigned.length * 0.15)} hours`
      });
    }
  });

  return recommendations;
} 