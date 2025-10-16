/**
 * Advanced RAG Configuration
 * 
 * Fine-tune LLM-enhanced RAG system for optimal interview preparation
 * across different interview types and scenarios.
 * 
 * Step 8: Advanced Configuration Options
 */

// Interview-specific configurations
export const RAG_CONFIGS = {
  technical_interview: {
    queryModel: 'llama-3.1-8b-instant',
    responseModel: 'llama-3.1-70b-versatile',
    temperature: 0.3,
    maxTokens: 600,
    topK: 5,
    focusAreas: ['technical skills', 'problem solving', 'architecture', 'code quality'],
    responseStyle: 'detailed technical examples with metrics',
    tone: 'confident' as const,
    enableQueryEnhancement: true,
    enableInterviewFormatting: true,
    emphasize: ['specific technologies', 'quantifiable outcomes', 'technical depth']
  },
  
  behavioral_interview: {
    queryModel: 'llama-3.1-8b-instant', 
    responseModel: 'llama-3.1-70b-versatile',
    temperature: 0.7,
    maxTokens: 700,
    topK: 5,
    focusAreas: ['leadership', 'teamwork', 'communication', 'conflict resolution'],
    responseStyle: 'STAR format stories with emotional intelligence',
    tone: 'balanced' as const,
    enableQueryEnhancement: true,
    enableInterviewFormatting: true,
    emphasize: ['team dynamics', 'interpersonal skills', 'problem resolution']
  },
  
  executive_interview: {
    queryModel: 'llama-3.1-70b-versatile',
    responseModel: 'llama-3.1-70b-versatile', 
    temperature: 0.5,
    maxTokens: 800,
    topK: 7,
    focusAreas: ['strategic thinking', 'business impact', 'vision', 'leadership'],
    responseStyle: 'high-level strategic responses with business metrics',
    tone: 'confident' as const,
    enableQueryEnhancement: true,
    enableInterviewFormatting: true,
    emphasize: ['business outcomes', 'strategic decisions', 'organizational impact']
  },
  
  cultural_fit: {
    queryModel: 'llama-3.1-8b-instant',
    responseModel: 'llama-3.1-70b-versatile',
    temperature: 0.6,
    maxTokens: 500,
    topK: 4,
    focusAreas: ['values', 'work style', 'collaboration', 'adaptability'],
    responseStyle: 'authentic personal stories that reveal character',
    tone: 'humble' as const,
    enableQueryEnhancement: true,
    enableInterviewFormatting: true,
    emphasize: ['personal values', 'team fit', 'adaptability examples']
  },
  
  system_design: {
    queryModel: 'llama-3.1-8b-instant',
    responseModel: 'llama-3.1-70b-versatile',
    temperature: 0.2,
    maxTokens: 900,
    topK: 6,
    focusAreas: ['system architecture', 'scalability', 'trade-offs', 'design decisions'],
    responseStyle: 'structured technical analysis with diagrams and rationale',
    tone: 'confident' as const,
    enableQueryEnhancement: true,
    enableInterviewFormatting: true,
    emphasize: ['architectural patterns', 'scalability considerations', 'trade-off analysis']
  },
  
  quick_response: {
    queryModel: 'llama-3.1-8b-instant',
    responseModel: 'llama-3.1-8b-instant',
    temperature: 0.4,
    maxTokens: 300,
    topK: 3,
    focusAreas: ['key points', 'concise answers'],
    responseStyle: 'brief, impactful responses',
    tone: 'balanced' as const,
    enableQueryEnhancement: false,
    enableInterviewFormatting: false,
    emphasize: ['conciseness', 'clarity', 'key achievements']
  }
} as const;

// Type definitions
export type InterviewType = keyof typeof RAG_CONFIGS;
export type RAGConfig = typeof RAG_CONFIGS[InterviewType];

// Configuration validation
export function getInterviewConfig(interviewType: InterviewType): RAGConfig {
  const config = RAG_CONFIGS[interviewType];
  
  if (!config) {
    throw new Error(`Invalid interview type: ${interviewType}. Available types: ${Object.keys(RAG_CONFIGS).join(', ')}`);
  }
  
  return config;
}

// Get all available interview types
export function getAvailableInterviewTypes(): InterviewType[] {
  return Object.keys(RAG_CONFIGS) as InterviewType[];
}

// Get config description for UI/documentation
export function getConfigDescription(interviewType: InterviewType): string {
  const config = getInterviewConfig(interviewType);
  
  const descriptions: Record<InterviewType, string> = {
    technical_interview: 'Optimized for technical questions with detailed examples, metrics, and code quality focus',
    behavioral_interview: 'STAR-format responses emphasizing leadership, teamwork, and interpersonal skills',
    executive_interview: 'High-level strategic responses with business impact and organizational metrics',
    cultural_fit: 'Authentic personal stories revealing values, work style, and team collaboration',
    system_design: 'Structured technical analysis for architecture, scalability, and design decisions',
    quick_response: 'Fast, concise answers for rapid-fire questions or initial screening'
  };
  
  return descriptions[interviewType];
}

// Configuration comparison helper
export function compareConfigs(type1: InterviewType, type2: InterviewType) {
  const config1 = getInterviewConfig(type1);
  const config2 = getInterviewConfig(type2);
  
  return {
    type1: type1,
    type2: type2,
    differences: {
      queryModel: config1.queryModel !== config2.queryModel,
      responseModel: config1.responseModel !== config2.responseModel,
      temperature: config1.temperature !== config2.temperature,
      maxTokens: config1.maxTokens !== config2.maxTokens,
      topK: config1.topK !== config2.topK,
      tone: config1.tone !== config2.tone,
      enhancements: {
        queryEnhancement: config1.enableQueryEnhancement !== config2.enableQueryEnhancement,
        responseFormatting: config1.enableInterviewFormatting !== config2.enableInterviewFormatting
      }
    },
    config1: config1,
    config2: config2
  };
}

// Get recommended config based on question keywords
export function detectInterviewType(question: string): InterviewType {
  const lowerQuestion = question.toLowerCase();
  
  // System design keywords
  if (lowerQuestion.match(/\b(design|architect|scale|system|database|cache|load balancing|microservices)\b/)) {
    return 'system_design';
  }
  
  // Technical keywords
  if (lowerQuestion.match(/\b(code|implement|algorithm|debug|optimize|technical|programming|framework)\b/)) {
    return 'technical_interview';
  }
  
  // Behavioral keywords
  if (lowerQuestion.match(/\b(tell me about|describe a time|how did you|conflict|challenge|leadership|team)\b/)) {
    return 'behavioral_interview';
  }
  
  // Executive keywords
  if (lowerQuestion.match(/\b(strategy|business|vision|roi|revenue|growth|market|organizational)\b/)) {
    return 'executive_interview';
  }
  
  // Cultural fit keywords
  if (lowerQuestion.match(/\b(culture|values|fit|work style|environment|why|motivates you)\b/)) {
    return 'cultural_fit';
  }
  
  // Default to balanced behavioral
  return 'behavioral_interview';
}

// Build contextual prompt based on interview type
export function buildContextualPrompt(question: string, interviewType: InterviewType): string {
  const config = getInterviewConfig(interviewType);
  
  const contextualInfo = `
This is a ${interviewType.replace(/_/g, ' ')} question.
Focus areas: ${config.focusAreas.join(', ')}
Response style: ${config.responseStyle}
Emphasize: ${config.emphasize.join(', ')}
Tone: ${config.tone}

Question: ${question}
`.trim();
  
  return contextualInfo;
}

// Enhanced query with context
export function enhanceQueryWithContext(question: string, interviewType: InterviewType): string {
  const config = getInterviewConfig(interviewType);
  
  // Add context-specific keywords to improve vector search
  const contextKeywords = [
    ...config.focusAreas,
    ...config.emphasize,
    interviewType.replace(/_/g, ' ')
  ];
  
  // Create enhanced query
  return `${question} (${contextKeywords.join(', ')})`;
}

// Get performance expectations based on config
export function getPerformanceExpectations(interviewType: InterviewType): {
  expectedTime: string;
  costEstimate: string;
  qualityLevel: 'high' | 'medium' | 'low';
  enhancementLevel: 'full' | 'partial' | 'minimal';
} {
  const config = getInterviewConfig(interviewType);
  
  const baseTime = config.enableQueryEnhancement && config.enableInterviewFormatting ? 2100 : 300;
  const modelMultiplier = config.responseModel.includes('70b') ? 1.3 : 1.0;
  const expectedTime = Math.round(baseTime * modelMultiplier);
  
  const baseCost = 0.00028;
  const costMultiplier = config.responseModel.includes('70b') ? 1.5 : 1.0;
  const costEstimate = (baseCost * costMultiplier).toFixed(6);
  
  return {
    expectedTime: `~${expectedTime}ms`,
    costEstimate: `$${costEstimate}`,
    qualityLevel: config.enableInterviewFormatting ? 'high' : 'medium',
    enhancementLevel: config.enableQueryEnhancement && config.enableInterviewFormatting 
      ? 'full' 
      : config.enableQueryEnhancement || config.enableInterviewFormatting 
        ? 'partial' 
        : 'minimal'
  };
}

// Export default config for backward compatibility
export const DEFAULT_CONFIG = RAG_CONFIGS.behavioral_interview;

// Config summary for logging
export function logConfigSummary(interviewType: InterviewType): void {
  const config = getInterviewConfig(interviewType);
  const performance = getPerformanceExpectations(interviewType);
  
  console.log(`\n🎯 Interview Configuration: ${interviewType.replace(/_/g, ' ').toUpperCase()}`);
  console.log('='.repeat(80));
  console.log(`📝 Query Model: ${config.queryModel}`);
  console.log(`💬 Response Model: ${config.responseModel}`);
  console.log(`🌡️  Temperature: ${config.temperature}`);
  console.log(`📊 Max Tokens: ${config.maxTokens}`);
  console.log(`🔍 Top K: ${config.topK}`);
  console.log(`🎨 Tone: ${config.tone}`);
  console.log(`🔧 Query Enhancement: ${config.enableQueryEnhancement ? '✅' : '❌'}`);
  console.log(`💎 Response Formatting: ${config.enableInterviewFormatting ? '✅' : '❌'}`);
  console.log(`🎯 Focus: ${config.focusAreas.join(', ')}`);
  console.log(`📈 Expected Time: ${performance.expectedTime}`);
  console.log(`💰 Cost Estimate: ${performance.costEstimate}`);
  console.log(`⭐ Quality Level: ${performance.qualityLevel}`);
  console.log('='.repeat(80));
}
