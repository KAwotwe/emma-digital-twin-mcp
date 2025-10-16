'use server'

import { 
  ragQuery, 
  enhancedRAGQuery,
  digitalTwinQuerySchema, 
  enhancedDigitalTwinQuerySchema,
  populateVectorDatabase 
} from '@/lib/digital-twin'

import {
  RAG_CONFIGS,
  type InterviewType,
  getInterviewConfig,
  getAvailableInterviewTypes,
  getConfigDescription,
  detectInterviewType,
  buildContextualPrompt,
  enhanceQueryWithContext,
  getPerformanceExpectations,
  logConfigSummary
} from '@/lib/rag-config'

// Type guard for metadata with enhancedQuery
type MetadataWithEnhancedQuery = {
  originalQuery: string
  enhancedQuery: string
  resultsFound: number
  queryEnhanced: boolean
  responseFormatted: boolean
  processingTimeMs: number
}

function hasEnhancedQuery(metadata: unknown): metadata is MetadataWithEnhancedQuery {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'enhancedQuery' in metadata &&
    typeof (metadata as Record<string, unknown>).enhancedQuery === 'string'
  )
}

// Server action to test the digital twin query functionality (original)
export async function queryDigitalTwin(
  question: string,
  options?: {
    topK?: number
    includeMetadata?: boolean
    filterByType?: string
  }
) {
  try {
    // Validate input
    const validatedQuery = digitalTwinQuerySchema.parse({
      question,
      topK: options?.topK || 3,
      includeMetadata: options?.includeMetadata ?? true,
      filterByType: options?.filterByType
    })

    console.log('Server action: Processing digital twin query:', question)
    
    // Execute RAG query
    const result = await ragQuery(validatedQuery)
    
    console.log('Server action: Digital twin query successful')
    
    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error('Server action error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Server action to populate Upstash Vector database
export async function populateVectorDatabaseAction() {
  try {
    console.log('Server action: Populating vector database...')
    
    await populateVectorDatabase()
    
    console.log('Server action: Vector database population successful')
    
    return {
      success: true,
      message: 'Vector database populated successfully with updated profile data!'
    }
    
  } catch (error) {
    console.error('Vector database population error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to populate vector database'
    }
  }
}

// Server action to test basic connectivity
export async function testConnectivity() {
  try {
    console.log('Testing digital twin connectivity...')
    
    const testResult = await queryDigitalTwin('Tell me about your background')
    
    return {
      success: true,
      message: 'Digital twin is ready and operational!',
      testResult
    }
    
  } catch (error) {
    console.error('Connectivity test failed:', error)
    
    return {
      success: false,
      message: 'Digital twin connectivity test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// ENHANCED SERVER ACTIONS - STEP 2
// Support for LLM-enhanced queries with preprocessing and postprocessing
// ============================================

/**
 * Enhanced server action with LLM query preprocessing and response postprocessing
 * Provides interview-ready responses with STAR format and metric highlighting
 */
export async function queryDigitalTwinEnhanced(
  question: string,
  options?: {
    topK?: number
    includeMetadata?: boolean
    filterByType?: string
    enableQueryEnhancement?: boolean
    enableInterviewMode?: boolean
    includeDebugInfo?: boolean
  }
) {
  try {
    // Validate input with enhanced schema
    const validatedQuery = enhancedDigitalTwinQuerySchema.parse({
      question,
      topK: options?.topK || 3,
      includeMetadata: options?.includeMetadata ?? true,
      filterByType: options?.filterByType,
      enableQueryEnhancement: options?.enableQueryEnhancement ?? true,
      enableInterviewMode: options?.enableInterviewMode ?? true,
      includeDebugInfo: options?.includeDebugInfo ?? false
    })

    console.log('Server action: Processing enhanced digital twin query:', question)
    console.log('Enhancement options:', {
      queryEnhancement: validatedQuery.enableQueryEnhancement,
      interviewMode: validatedQuery.enableInterviewMode
    })
    
    // Execute enhanced RAG query with preprocessing and postprocessing
    const result = await enhancedRAGQuery(validatedQuery)
    
    console.log('Server action: Enhanced digital twin query successful')
    
    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error('Enhanced server action error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Test the enhanced query functionality with sample questions
 */
export async function testEnhancedQuery() {
  try {
    console.log('Testing enhanced query functionality...')
    
    const testResult = await queryDigitalTwinEnhanced(
      'Tell me about your Python experience',
      {
        enableQueryEnhancement: true,
        enableInterviewMode: true,
        includeDebugInfo: true
      }
    )
    
    return {
      success: true,
      message: 'Enhanced digital twin is ready with LLM preprocessing and postprocessing!',
      testResult
    }
    
  } catch (error) {
    console.error('Enhanced query test failed:', error)
    
    return {
      success: false,
      message: 'Enhanced query test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// STEP 6: MODULAR LLM-ENHANCED SERVER ACTIONS
// Using standalone llm-enhanced-rag module for maximum flexibility
// ============================================

import { enhanceQuery, formatForInterview } from '@/lib/llm-enhanced-rag'
import { Index } from '@upstash/vector'

// Initialize vector index for modular actions
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

/**
 * Modular enhanced digital twin query using standalone LLM functions
 * 
 * This approach gives you full control over each stage of the pipeline:
 * 1. Query enhancement (preprocessing)
 * 2. Vector search
 * 3. Response formatting (postprocessing)
 * 
 * @param question - User's interview question
 * @param options - Configuration options
 */
export async function enhancedDigitalTwinQuery(
  question: string,
  options?: {
    topK?: number
    enableQueryEnhancement?: boolean
    enableInterviewFormatting?: boolean
    tone?: 'confident' | 'humble' | 'balanced'
    emphasizeSTAR?: boolean
    includeMetrics?: boolean
  }
) {
  try {
    const startTime = Date.now()
    
    console.log('🚀 Step 6: Starting modular enhanced RAG pipeline')
    console.log('📝 Original question:', question)
    
    // Step 1: Query Enhancement (Optional)
    let searchQuery = question
    if (options?.enableQueryEnhancement !== false) {
      console.log('🔍 Step 1: Enhancing query...')
      searchQuery = await enhanceQuery(question)
      console.log('✅ Enhanced query:', searchQuery)
    } else {
      console.log('⏭️ Step 1: Skipping query enhancement (disabled)')
    }
    
    // Step 2: Vector Search
    console.log('🔎 Step 2: Performing vector search...')
    const vectorResults = await vectorIndex.query({
      data: searchQuery, // Use enhanced query for better search
      topK: options?.topK || 5,
      includeMetadata: true,
    })
    
    console.log(`✅ Found ${vectorResults.length} results`)
    
    // Step 3: Response Formatting (Optional)
    let response: string
    if (options?.enableInterviewFormatting !== false) {
      console.log('💬 Step 3: Formatting for interview context...')
      
      // Convert vector results to RAGResult format
      const ragResults = vectorResults.map(result => ({
        data: result.metadata?.content as string || '',
        text: result.metadata?.text as string || '',
        content: result.metadata?.content as string || '',
        metadata: result.metadata,
        score: result.score
      }))
      
      response = await formatForInterview(ragResults, question)
      console.log('✅ Response formatted for interview')
    } else {
      console.log('⏭️ Step 3: Skipping interview formatting (disabled)')
      // Return raw context if formatting is disabled
      response = vectorResults
        .map(r => r.metadata?.content || r.metadata?.text || '')
        .filter(text => text)
        .join('\n\n')
    }
    
    const totalTime = Date.now() - startTime
    console.log(`🎉 Pipeline completed in ${totalTime}ms`)
    
    return {
      success: true,
      response: response,
      metadata: {
        originalQuery: question,
        enhancedQuery: searchQuery,
        resultsFound: vectorResults.length,
        queryEnhanced: options?.enableQueryEnhancement !== false,
        responseFormatted: options?.enableInterviewFormatting !== false,
        processingTimeMs: totalTime
      }
    }
    
  } catch (error) {
    console.error('❌ Enhanced RAG pipeline failed:', error)
    
    // Fallback to basic query if enhancement fails
    console.log('🔄 Falling back to basic query...')
    return await basicDigitalTwinQuery(question)
  }
}

/**
 * Basic digital twin query without LLM enhancements (fallback)
 * 
 * @param question - User's question
 */
export async function basicDigitalTwinQuery(question: string) {
  const startTime = Date.now();
  
  try {
    console.log('📝 Basic query (no LLM enhancement):', question)
    
    // Direct vector search without enhancement
    const vectorResults = await vectorIndex.query({
      data: question,
      topK: 5,
      includeMetadata: true,
    })
    
    // Simple concatenation of results
    const response = vectorResults
      .map(r => r.metadata?.content || r.metadata?.text || '')
      .filter(text => text)
      .join('\n\n')
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      response: response || 'No relevant information found.',
      metadata: {
        originalQuery: question,
        resultsFound: vectorResults.length,
        queryEnhanced: false,
        responseFormatted: false,
        processingTimeMs: processingTime
      }
    }
    
  } catch (error) {
    console.error('❌ Basic query failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query failed',
      response: 'Unable to process your question. Please try again.',
      metadata: {
        originalQuery: question,
        resultsFound: 0,
        queryEnhanced: false,
        responseFormatted: false,
        processingTimeMs: Date.now() - startTime
      }
    }
  }
}

/**
 * Query enhancement only (no vector search or formatting)
 * Useful for testing or when you want to handle search separately
 * 
 * @param question - User's question
 */
export async function enhanceQueryOnly(question: string) {
  try {
    console.log('🔍 Enhancing query only:', question)
    
    const enhanced = await enhanceQuery(question)
    
    return {
      success: true,
      originalQuery: question,
      enhancedQuery: enhanced
    }
    
  } catch (error) {
    console.error('❌ Query enhancement failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Enhancement failed',
      originalQuery: question,
      enhancedQuery: question // Fallback to original
    }
  }
}

/**
 * Test the modular enhanced pipeline with various configurations
 */
export async function testModularEnhancedQuery() {
  try {
    console.log('\n🧪 Testing modular enhanced query pipeline...\n')
    
    const testQuestion = 'Tell me about your React experience'
    
    // Test 1: Full pipeline
    console.log('Test 1: Full pipeline (enhancement + formatting)')
    const fullResult = await enhancedDigitalTwinQuery(testQuestion, {
      enableQueryEnhancement: true,
      enableInterviewFormatting: true,
      tone: 'confident'
    })
    
    // Test 2: Enhancement only
    console.log('\nTest 2: Enhancement only')
    const enhanceOnlyResult = await enhancedDigitalTwinQuery(testQuestion, {
      enableQueryEnhancement: true,
      enableInterviewFormatting: false
    })
    
    // Test 3: Formatting only
    console.log('\nTest 3: Formatting only')
    const formatOnlyResult = await enhancedDigitalTwinQuery(testQuestion, {
      enableQueryEnhancement: false,
      enableInterviewFormatting: true
    })
    
    // Test 4: Basic (no enhancements)
    console.log('\nTest 4: Basic query (no enhancements)')
    const basicResult = await basicDigitalTwinQuery(testQuestion)
    
    return {
      success: true,
      message: 'All modular pipeline tests completed!',
      results: {
        fullPipeline: fullResult,
        enhancementOnly: enhanceOnlyResult,
        formattingOnly: formatOnlyResult,
        basicQuery: basicResult
      }
    }
    
  } catch (error) {
    console.error('❌ Modular pipeline test failed:', error)
    
    return {
      success: false,
      message: 'Modular pipeline test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Compare basic RAG vs LLM-enhanced RAG approaches (A/B Testing)
 * 
 * This function tests both approaches side-by-side to measure improvements:
 * - Response specificity and detail
 * - Interview relevance and presentation
 * - Use of concrete examples and metrics
 * - Natural flow and confidence building
 * - Processing time and reliability
 * 
 * @param question - User's question to test both approaches
 * @param tone - Optional tone for enhanced approach (default: 'balanced')
 */
export async function compareRAGApproaches(
  question: string,
  tone?: 'confident' | 'humble' | 'balanced'
) {
  'use server';
  
  console.log('\n🔬 A/B Testing: Basic RAG vs LLM-Enhanced RAG')
  console.log(`📝 Question: "${question}"`)
  console.log('=' .repeat(80))
  
  const startTime = Date.now();
  
  try {
    // Test both approaches in parallel for fair comparison
    const [basicResult, enhancedResult] = await Promise.all([
      basicDigitalTwinQuery(question),
      enhancedDigitalTwinQuery(question, {
        enableQueryEnhancement: true,
        enableInterviewFormatting: true,
        tone: tone || 'balanced',
        topK: 5
      })
    ]);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Calculate improvement metrics
    const basicTime = basicResult.metadata?.processingTimeMs || 0;
    const enhancedTime = enhancedResult.metadata?.processingTimeMs || 0;
    const timeOverhead = enhancedTime - basicTime;
    const timeOverheadPercent = basicTime > 0 ? ((timeOverhead / basicTime) * 100).toFixed(1) : 'N/A';
    
    // Calculate response length improvement
    const basicLength = basicResult.response?.length || 0;
    const enhancedLength = enhancedResult.response?.length || 0;
    const lengthImprovement = enhancedLength - basicLength;
    const lengthImprovementPercent = basicLength > 0 ? ((lengthImprovement / basicLength) * 100).toFixed(1) : 'N/A';
    
    // Analyze query enhancement (with type checking)
    const queryImproved = hasEnhancedQuery(enhancedResult.metadata) && 
                          enhancedResult.metadata.enhancedQuery !== question;
    
    console.log('\n📊 Comparison Results:')
    console.log('  ⚡ Basic RAG:', `${basicTime}ms`)
    console.log('  🚀 Enhanced RAG:', `${enhancedTime}ms`)
    console.log('  📈 Time Overhead:', `+${timeOverhead}ms (+${timeOverheadPercent}%)`)
    console.log('  📝 Response Length:', `Basic: ${basicLength} chars, Enhanced: ${enhancedLength} chars`)
    console.log('  📈 Length Improvement:', `+${lengthImprovement} chars (+${lengthImprovementPercent}%)`)
    console.log('  🔍 Query Enhanced:', queryImproved ? 'Yes ✅' : 'No ❌')
    console.log('  ⏱️  Total Comparison Time:', `${totalTime}ms`)
    console.log('=' .repeat(80))
    
    return {
      question,
      results: {
        basic: {
          response: basicResult.response,
          processingTime: basicTime,
          metadata: basicResult.metadata,
          success: basicResult.success
        },
        enhanced: {
          response: enhancedResult.response,
          processingTime: enhancedTime,
          enhancedQuery: hasEnhancedQuery(enhancedResult.metadata) ? enhancedResult.metadata.enhancedQuery : undefined,
          metadata: enhancedResult.metadata,
          success: enhancedResult.success
        }
      },
      comparison: {
        totalComparisonTime: totalTime,
        timeOverhead: timeOverhead,
        timeOverheadPercent: timeOverheadPercent,
        lengthImprovement: lengthImprovement,
        lengthImprovementPercent: lengthImprovementPercent,
        queryEnhanced: queryImproved,
        enhancementApplied: {
          queryPreprocessing: enhancedResult.metadata?.queryEnhanced || false,
          responseFormatting: enhancedResult.metadata?.responseFormatted || false
        }
      },
      evaluation: {
        winner: enhancedLength > basicLength && enhancedResult.success ? 'enhanced' : 'basic',
        notes: [
          enhancedLength > basicLength ? '✅ Enhanced provides more detailed response' : '⚠️ Basic is more concise',
          queryImproved ? '✅ Query was successfully enhanced for better search' : '⚠️ Query enhancement had no effect',
          timeOverhead < 3000 ? '✅ Time overhead is acceptable (<3s)' : '⚠️ Time overhead is significant (>3s)',
          enhancedResult.success ? '✅ Enhanced pipeline completed successfully' : '❌ Enhanced pipeline failed'
        ]
      }
    };
    
  } catch (error) {
    console.error('❌ A/B Comparison failed:', error);
    
    return {
      question,
      results: {
        basic: { response: 'Error', processingTime: 0 },
        enhanced: { response: 'Error', processingTime: 0, enhancedQuery: '' }
      },
      totalComparisonTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Comparison failed',
      success: false
    };
  }
}

/**
 * Run batch A/B testing with multiple test questions
 * 
 * This function tests a set of recommended interview questions
 * to evaluate the LLM-enhanced RAG system comprehensively.
 * 
 * Test Categories:
 * - Self-assessment questions
 * - Experience-based questions
 * - Behavioral questions
 * - Technical questions
 */
export async function batchCompareRAGApproaches() {
  'use server';
  
  console.log('\n🧪 Batch A/B Testing: Multiple Questions')
  console.log('=' .repeat(80))
  
  // Recommended test questions from Step 7
  const testQuestions = [
    { question: 'What are my key strengths?', category: 'Self-Assessment' },
    { question: 'Tell me about a challenging project', category: 'Experience' },
    { question: 'Why should we hire you?', category: 'Value Proposition' },
    { question: 'Describe your leadership experience', category: 'Behavioral' }
  ];
  
  const startTime = Date.now();
  const results = [];
  
  for (const { question, category } of testQuestions) {
    console.log(`\n📋 Testing: ${category}`);
    console.log(`   Question: "${question}"`);
    
    const result = await compareRAGApproaches(question);
    results.push({
      category,
      ...result
    });
    
    // Brief pause between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const endTime = Date.now();
  const totalBatchTime = endTime - startTime;
  
  // Calculate aggregate metrics
  const avgBasicTime = results.reduce((sum, r) => sum + (r.results.basic.processingTime || 0), 0) / results.length;
  const avgEnhancedTime = results.reduce((sum, r) => sum + (r.results.enhanced.processingTime || 0), 0) / results.length;
  const avgTimeOverhead = avgEnhancedTime - avgBasicTime;
  
  const successfulEnhancements = results.filter(r => r.comparison?.queryEnhanced).length;
  const successRate = ((successfulEnhancements / results.length) * 100).toFixed(1);
  
  console.log('\n📊 Batch Testing Summary:')
  console.log('=' .repeat(80))
  console.log(`  📝 Total Questions Tested: ${results.length}`)
  console.log(`  ⚡ Avg Basic RAG Time: ${avgBasicTime.toFixed(0)}ms`)
  console.log(`  🚀 Avg Enhanced RAG Time: ${avgEnhancedTime.toFixed(0)}ms`)
  console.log(`  📈 Avg Time Overhead: +${avgTimeOverhead.toFixed(0)}ms`)
  console.log(`  ✅ Query Enhancement Success Rate: ${successRate}%`)
  console.log(`  ⏱️  Total Batch Time: ${totalBatchTime}ms (${(totalBatchTime / 1000).toFixed(1)}s)`)
  console.log('=' .repeat(80))
  
  return {
    success: true,
    batchResults: results,
    summary: {
      totalQuestions: results.length,
      avgBasicTime: avgBasicTime,
      avgEnhancedTime: avgEnhancedTime,
      avgTimeOverhead: avgTimeOverhead,
      queryEnhancementSuccessRate: successRate,
      totalBatchTime: totalBatchTime
    },
    evaluationCriteria: {
      responseSpecificity: 'Compare detail level and concrete examples',
      interviewRelevance: 'Assess STAR format and professional presentation',
      metricsUsage: 'Count quantified achievements and outcomes',
      naturalFlow: 'Evaluate readability and confidence building',
      processingTime: 'Monitor performance overhead',
      reliability: 'Track success rate and error handling'
    }
  };
}

/**
 * Context-aware RAG query with interview-specific configuration
 * 
 * Automatically adapts the RAG pipeline based on interview type:
 * - Technical: Detailed examples with metrics (temp: 0.3)
 * - Behavioral: STAR format stories (temp: 0.7)
 * - Executive: Strategic responses with business impact (temp: 0.5)
 * - Cultural Fit: Authentic personal stories (temp: 0.6)
 * - System Design: Structured technical analysis (temp: 0.2)
 * - Quick Response: Fast, concise answers (minimal enhancement)
 * 
 * @param question - User's question
 * @param interviewType - Type of interview (or 'auto' for detection)
 */
export async function contextAwareRAG(
  question: string,
  interviewType: InterviewType | 'auto' = 'auto'
) {
  'use server';
  
  try {
    // Auto-detect interview type if not specified
    const detectedType = interviewType === 'auto' ? detectInterviewType(question) : interviewType;
    
    console.log(`\n🎯 Context-Aware RAG: ${detectedType.replace(/_/g, ' ').toUpperCase()}`);
    console.log(`📝 Question: "${question}"`);
    
    if (interviewType === 'auto') {
      console.log(`🤖 Auto-detected interview type: ${detectedType}`);
    }
    
    // Get configuration for this interview type
    const config = getInterviewConfig(detectedType);
    logConfigSummary(detectedType);
    
    // Build contextual prompt
    const contextualPrompt = buildContextualPrompt(question, detectedType);
    console.log(`\n📋 Contextual Prompt:\n${contextualPrompt}\n`);
    
    // Execute enhanced query with config-specific settings
    const result = await enhancedDigitalTwinQuery(question, {
      topK: config.topK,
      enableQueryEnhancement: config.enableQueryEnhancement,
      enableInterviewFormatting: config.enableInterviewFormatting,
      tone: config.tone
    });
    
    // Get performance expectations
    const performance = getPerformanceExpectations(detectedType);
    
    console.log(`\n✅ Context-aware query completed`);
    console.log(`⏱️  Actual Time: ${result.metadata?.processingTimeMs || 'N/A'}ms`);
    console.log(`📊 Expected Time: ${performance.expectedTime}`);
    console.log(`💰 Cost Estimate: ${performance.costEstimate}`);
    
    return {
      success: true,
      response: result.response,
      metadata: {
        ...result.metadata,
        interviewType: detectedType,
        autoDetected: interviewType === 'auto',
        configuration: {
          queryModel: config.queryModel,
          responseModel: config.responseModel,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topK: config.topK,
          tone: config.tone,
          focusAreas: config.focusAreas,
          responseStyle: config.responseStyle
        },
        performance: performance,
        contextualPrompt: contextualPrompt
      }
    };
    
  } catch (error) {
    console.error('❌ Context-aware RAG failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Context-aware query failed',
      response: 'Unable to process your question with context awareness. Please try again.'
    };
  }
}

/**
 * Get available interview types and their descriptions
 */
export async function getInterviewTypes() {
  'use server';
  
  const types = getAvailableInterviewTypes();
  
  return types.map(type => ({
    id: type,
    name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: getConfigDescription(type),
    config: getInterviewConfig(type),
    performance: getPerformanceExpectations(type)
  }));
}

/**
 * Test context-aware RAG with multiple interview types for the same question
 * 
 * Demonstrates how the same question gets different responses based on context
 */
export async function testContextAwareRAG(question: string) {
  'use server';
  
  console.log('\n🧪 Testing Context-Aware RAG Across Interview Types');
  console.log('='.repeat(80));
  console.log(`📝 Test Question: "${question}"`);
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  
  // Test with different interview types
  const interviewTypes: InterviewType[] = [
    'technical_interview',
    'behavioral_interview',
    'executive_interview'
  ];
  
  const results = [];
  
  for (const type of interviewTypes) {
    console.log(`\n🎯 Testing: ${type.replace(/_/g, ' ').toUpperCase()}`);
    
    const result = await contextAwareRAG(question, type);
    results.push({
      interviewType: type,
      ...result
    });
    
    // Brief pause
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Also test auto-detection
  console.log(`\n🤖 Testing: AUTO-DETECTION`);
  const autoResult = await contextAwareRAG(question, 'auto');
  results.push({
    interviewType: 'auto',
    ...autoResult
  });
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n📊 Context-Aware Testing Summary:');
  console.log('='.repeat(80));
  console.log(`  📝 Question Tested: "${question}"`);
  console.log(`  🎯 Interview Types Tested: ${interviewTypes.length + 1} (${interviewTypes.join(', ')}, auto)`);
  console.log(`  ⏱️  Total Test Time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
  console.log(`  ✅ All Tests: ${results.every(r => r.success) ? 'PASSED' : 'FAILED'}`);
  console.log('='.repeat(80));
  
  // Compare response lengths across contexts
  const responseLengths = results.map(r => ({
    type: r.interviewType,
    length: r.response?.length || 0,
    processingTime: r.metadata?.processingTimeMs || 0
  }));
  
  console.log('\n📈 Response Comparison:');
  responseLengths.forEach(({ type, length, processingTime }) => {
    console.log(`  ${type.padEnd(25)}: ${length.toString().padStart(4)} chars, ${processingTime.toString().padStart(5)}ms`);
  });
  
  return {
    success: true,
    question: question,
    results: results,
    summary: {
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      totalTime: totalTime,
      responseLengths: responseLengths
    }
  };
}

/**
 * Batch test with recommended questions across different contexts
 */
export async function batchTestContextAware() {
  'use server';
  
  console.log('\n🧪 Batch Testing: Context-Aware RAG');
  console.log('='.repeat(80));
  
  const testCases = [
    { question: 'Describe your experience with microservices architecture', expectedType: 'system_design' as InterviewType },
    { question: 'Tell me about a time you led a difficult team project', expectedType: 'behavioral_interview' as InterviewType },
    { question: 'How would you scale a system to handle 1 million users?', expectedType: 'system_design' as InterviewType },
    { question: 'What is your approach to code quality and testing?', expectedType: 'technical_interview' as InterviewType },
    { question: 'How do you align technical decisions with business goals?', expectedType: 'executive_interview' as InterviewType }
  ];
  
  const results = [];
  let correctDetections = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase.question}"`);
    console.log(`   Expected: ${testCase.expectedType}`);
    
    const result = await contextAwareRAG(testCase.question, 'auto');
    
    const detectedCorrectly = result.metadata?.interviewType === testCase.expectedType;
    if (detectedCorrectly) {
      correctDetections++;
      console.log(`   ✅ Correctly detected as: ${result.metadata?.interviewType}`);
    } else {
      console.log(`   ⚠️ Detected as: ${result.metadata?.interviewType} (expected: ${testCase.expectedType})`);
    }
    
    results.push({
      ...testCase,
      detectedType: result.metadata?.interviewType,
      correct: detectedCorrectly,
      result: result
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const accuracy = ((correctDetections / testCases.length) * 100).toFixed(1);
  
  console.log('\n📊 Batch Test Summary:');
  console.log('='.repeat(80));
  console.log(`  📝 Total Questions: ${testCases.length}`);
  console.log(`  ✅ Correct Detections: ${correctDetections}`);
  console.log(`  📈 Detection Accuracy: ${accuracy}%`);
  console.log('='.repeat(80));
  
  return {
    success: true,
    totalTests: testCases.length,
    correctDetections: correctDetections,
    detectionAccuracy: accuracy,
    results: results
  };
}

// ============================================================================
// STEP 9: PERFORMANCE MONITORING AND OPTIMIZATION
// ============================================================================

/**
 * Execute RAG query with full performance monitoring and caching
 */
export async function monitoredDigitalTwinQuery(
  question: string,
  options: {
    interviewType?: InterviewType | 'auto'
    enableCache?: boolean
    cacheTTL?: number
  } = {}
) {
  try {
    const { monitoredRAGQuery } = await import('@/lib/rag-monitoring')
    
    // Detect interview type if auto
    const interviewType = options.interviewType === 'auto' || !options.interviewType
      ? detectInterviewType(question)
      : options.interviewType

    const config = getInterviewConfig(interviewType)
    
    console.log('\n🎯 Starting Monitored RAG Query')
    console.log(`Interview Type: ${interviewType}`)
    console.log(`Cache: ${options.enableCache !== false ? 'Enabled' : 'Disabled'}`)
    
    const result = await monitoredRAGQuery(question, {
      interviewType,
      enableCache: options.enableCache,
      cacheTTL: options.cacheTTL,
      queryModel: config.queryModel,
      responseModel: config.responseModel
    })

    return {
      success: result.success,
      response: result.response,
      metrics: result.metrics,
      cacheHit: result.cacheHit,
      interviewType
    }
  } catch (error) {
    console.error('Error in monitored digital twin query:', error)
    return {
      success: false,
      response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metrics: null,
      cacheHit: false,
      interviewType: 'unknown'
    }
  }
}

/**
 * Get current performance statistics
 */
export async function getPerformanceStatistics() {
  try {
    const { getPerformanceStats } = await import('@/lib/rag-monitoring')
    
    const stats = getPerformanceStats()
    
    console.log('\n📊 Performance Statistics:')
    console.log(`Total Queries: ${stats.totalQueries}`)
    console.log(`Cache Hits: ${stats.cacheHits}`)
    console.log(`Cache Misses: ${stats.cacheMisses}`)
    console.log(`Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`)
    console.log(`Avg Query Time: ${stats.avgQueryTime.toFixed(0)}ms`)
    console.log(`Avg Tokens Used: ${stats.avgTokensUsed.toFixed(0)}`)
    console.log(`Total Cost: $${stats.totalCost.toFixed(6)}`)
    
    return {
      success: true,
      stats
    }
  } catch (error) {
    console.error('Error getting performance stats:', error)
    return {
      success: false,
      stats: null
    }
  }
}

/**
 * Get cache information
 */
export async function getCacheInformation() {
  try {
    const { getCacheInfo } = await import('@/lib/rag-monitoring')
    
    const cacheInfo = getCacheInfo()
    
    console.log('\n💾 Cache Information:')
    console.log(`Size: ${cacheInfo.size}/${cacheInfo.maxSize}`)
    console.log(`Utilization: ${(cacheInfo.utilization * 100).toFixed(1)}%`)
    console.log(`Hit Rate: ${(cacheInfo.hitRate * 100).toFixed(1)}%`)
    
    return {
      success: true,
      cacheInfo
    }
  } catch (error) {
    console.error('Error getting cache info:', error)
    return {
      success: false,
      cacheInfo: null
    }
  }
}

/**
 * Clear the cache
 */
export async function clearPerformanceCache() {
  try {
    const { clearCache } = await import('@/lib/rag-monitoring')
    
    clearCache()
    
    console.log('✓ Cache cleared successfully')
    
    return {
      success: true,
      message: 'Cache cleared successfully'
    }
  } catch (error) {
    console.error('Error clearing cache:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Analyze performance and get optimization recommendations
 */
export async function analyzeSystemPerformance() {
  try {
    const { analyzePerformance } = await import('@/lib/rag-monitoring')
    
    const analysis = analyzePerformance()
    
    console.log('\n🔍 Performance Analysis:')
    console.log('='.repeat(60))
    console.log('\n📊 Statistics:')
    console.log(`  Total Queries: ${analysis.stats.totalQueries}`)
    console.log(`  Cache Hit Rate: ${(analysis.stats.cacheHitRate * 100).toFixed(1)}%`)
    console.log(`  Avg Query Time: ${analysis.stats.avgQueryTime.toFixed(0)}ms`)
    console.log(`  Total Cost: $${analysis.stats.totalCost.toFixed(6)}`)
    
    console.log('\n💾 Cache:')
    console.log(`  Size: ${analysis.cacheInfo.size}/${analysis.cacheInfo.maxSize}`)
    console.log(`  Utilization: ${(analysis.cacheInfo.utilization * 100).toFixed(1)}%`)
    
    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      analysis.recommendations.forEach((rec, idx) => {
        const icon = rec.severity === 'critical' ? '🔴' : rec.severity === 'warning' ? '⚠️' : 'ℹ️'
        console.log(`\n  ${icon} ${idx + 1}. ${rec.message}`)
        console.log(`     Suggestion: ${rec.suggestion}`)
        console.log(`     Impact: ${rec.potentialImprovement}`)
      })
    } else {
      console.log('\n✅ No recommendations - system performing optimally')
    }
    
    console.log('\n' + '='.repeat(60))
    
    return {
      success: true,
      analysis
    }
  } catch (error) {
    console.error('Error analyzing performance:', error)
    return {
      success: false,
      analysis: null
    }
  }
}

/**
 * Run performance benchmark with test questions
 */
export async function runPerformanceBenchmark(
  customQuestions?: string[]
) {
  try {
    const { benchmarkRAGPerformance } = await import('@/lib/rag-monitoring')
    
    console.log('\n🏁 Starting Performance Benchmark')
    
    const benchmarkResults = await benchmarkRAGPerformance(customQuestions)
    
    return {
      success: true,
      benchmark: benchmarkResults
    }
  } catch (error) {
    console.error('Error running benchmark:', error)
    return {
      success: false,
      benchmark: null
    }
  }
}

/**
 * Test cache functionality with repeated queries
 */
export async function testCacheFunctionality(question: string = 'What are your main technical skills?') {
  try {
    console.log('\n🧪 Testing Cache Functionality')
    console.log(`Test question: "${question}"`)
    
    // First query - should be a cache miss
    console.log('\n📝 Query 1: Cache Miss (expected)')
    const query1 = await monitoredDigitalTwinQuery(question, {
      enableCache: true
    })
    
    // Second query - should be a cache hit
    console.log('\n📝 Query 2: Cache Hit (expected)')
    const query2 = await monitoredDigitalTwinQuery(question, {
      enableCache: true
    })
    
    // Third query - should also be a cache hit
    console.log('\n📝 Query 3: Cache Hit (expected)')
    const query3 = await monitoredDigitalTwinQuery(question, {
      enableCache: true
    })
    
    const allHits = [query1, query2, query3]
    const cacheHits = allHits.filter(q => q.cacheHit).length
    const speedup = query1.metrics && query2.metrics 
      ? ((query1.metrics.totalTime / query2.metrics.totalTime) * 100).toFixed(0)
      : 'N/A'
    
    console.log('\n📊 Cache Test Results:')
    console.log('='.repeat(60))
    console.log(`  Query 1: ${query1.cacheHit ? '✅ Hit' : '❌ Miss'} (${query1.metrics?.totalTime}ms)`)
    console.log(`  Query 2: ${query2.cacheHit ? '✅ Hit' : '❌ Miss'} (${query2.metrics?.totalTime}ms)`)
    console.log(`  Query 3: ${query3.cacheHit ? '✅ Hit' : '❌ Miss'} (${query3.metrics?.totalTime}ms)`)
    console.log(`  Cache Hits: ${cacheHits}/3`)
    console.log(`  Speed Improvement: ${speedup}%`)
    console.log('='.repeat(60))
    
    return {
      success: true,
      queries: allHits,
      cacheHits,
      speedImprovement: speedup
    }
  } catch (error) {
    console.error('Error testing cache:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * ========================================================================
 * STEP 10: VOICE-ENHANCED DIGITAL TWIN
 * ========================================================================
 * 
 * Voice-enabled query with speech-to-text and text-to-speech using ElevenLabs
 */

/**
 * Process voice query: audio → text → RAG → text → audio
 * 
 * This function handles the complete voice interaction flow:
 * 1. Transcribe audio to text using ElevenLabs
 * 2. Process the question with monitored RAG
 * 3. Convert the answer back to speech
 */
export async function voiceDigitalTwinQuery(
  audioBlob: Blob,
  options?: {
    interviewType?: InterviewType
    enableCache?: boolean
    voiceId?: string
  }
) {
  try {
    console.log('\n🎤 Voice Digital Twin Query Started')
    console.log('='.repeat(60))
    
    // Step 1: Transcribe audio to text
    console.log('📝 Step 1: Transcribing audio...')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const formData = new FormData()
    formData.append('audio', audioBlob)
    
    const transcribeResponse = await fetch(`${baseUrl}/api/voice/transcribe`, {
      method: 'POST',
      body: formData
    })
    
    if (!transcribeResponse.ok) {
      throw new Error('Transcription failed')
    }
    
    const transcribeData = await transcribeResponse.json()
    const questionText = transcribeData.text
    
    console.log(`✅ Transcribed: "${questionText}"`)
    
    // Step 2: Process with RAG (using your existing monitored query)
    console.log('\n🤖 Step 2: Processing with Digital Twin RAG...')
    const ragResult = await monitoredDigitalTwinQuery(questionText, {
      interviewType: options?.interviewType || 'auto',
      enableCache: options?.enableCache ?? true
    })
    
    if (!ragResult.success) {
      throw new Error('RAG query failed')
    }
    
    const answerText = ragResult.response
    console.log(`✅ RAG Response generated (${answerText.length} chars)`)
    
    // Step 3: Convert answer to speech
    console.log('\n🔊 Step 3: Converting answer to speech...')
    const speakResponse = await fetch(`${baseUrl}/api/voice/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: answerText,
        voiceId: options?.voiceId
      })
    })
    
    if (!speakResponse.ok) {
      throw new Error('Text-to-speech failed')
    }
    
    const audioBuffer = await speakResponse.arrayBuffer()
    const charactersUsed = parseInt(speakResponse.headers.get('X-Characters-Used') || '0')
    const duration = parseInt(speakResponse.headers.get('X-Duration-Estimate') || '0')
    
    console.log(`✅ Audio generated: ${charactersUsed} chars, ~${duration}s`)
    console.log('='.repeat(60))
    console.log('🎉 Voice query completed successfully\n')
    
    return {
      success: true,
      question: questionText,
      answer: answerText,
      audioBuffer: audioBuffer,
      audioMetadata: {
        charactersUsed,
        duration
      },
      metrics: ragResult.metrics,
      cacheHit: ragResult.cacheHit,
      interviewType: ragResult.interviewType
    }
    
  } catch (error) {
    console.error('❌ Voice query failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Voice query failed'
    }
  }
}
