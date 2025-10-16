/**
 * RAG Monitoring and Performance Optimization Module
 * 
 * This module provides:
 * - Performance metrics tracking for all RAG operations
 * - Query and response caching with TTL
 * - Cost tracking and token usage monitoring
 * - Cache hit rate analysis
 * - Performance optimization recommendations
 * - Production-ready monitoring utilities
 */

import Groq from 'groq-sdk'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface RAGMetrics {
  queryEnhancementTime: number
  vectorSearchTime: number
  responseFormattingTime: number
  totalTime: number
  tokensUsed: number
  cacheHitRate: number
  costEstimate: number
  timestamp: string
}

export interface DetailedMetrics extends RAGMetrics {
  queryEnhancementTokens: number
  responseFormattingTokens: number
  cacheHit: boolean
  interviewType?: string
  modelUsed: {
    queryModel: string
    responseModel: string
  }
  vectorResults: number
  queryLength: number
  responseLength: number
}

export interface PerformanceStats {
  totalQueries: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  avgQueryTime: number
  avgTokensUsed: number
  totalCost: number
  queriesByType: Record<string, number>
  avgTimeByType: Record<string, number>
}

export interface CacheEntry {
  question: string
  response: string
  metrics: DetailedMetrics
  timestamp: number
  ttl: number
  hits: number
}

export interface CacheConfig {
  maxSize: number
  defaultTTL: number // in milliseconds
  enableCache: boolean
}

export interface OptimizationRecommendation {
  type: 'model' | 'cache' | 'configuration' | 'cost'
  severity: 'info' | 'warning' | 'critical'
  message: string
  suggestion: string
  potentialImprovement: string
}

// ============================================================================
// CACHING SYSTEM
// ============================================================================

class RAGCache {
  private cache: Map<string, CacheEntry>
  private config: CacheConfig
  private stats: PerformanceStats

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map()
    this.config = {
      maxSize: config.maxSize || 100,
      defaultTTL: config.defaultTTL || 3600000, // 1 hour default
      enableCache: config.enableCache !== false
    }
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      avgQueryTime: 0,
      avgTokensUsed: 0,
      totalCost: 0,
      queriesByType: {},
      avgTimeByType: {}
    }
  }

  /**
   * Get cached response if available and not expired
   */
  get(question: string): CacheEntry | null {
    if (!this.config.enableCache) return null

    const normalizedQuestion = this.normalizeQuestion(question)
    const entry = this.cache.get(normalizedQuestion)

    if (!entry) {
      return null
    }

    // Check if entry is expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(normalizedQuestion)
      return null
    }

    // Update hit count
    entry.hits++
    this.stats.cacheHits++
    
    return entry
  }

  /**
   * Store response in cache
   */
  set(question: string, response: string, metrics: DetailedMetrics, ttl?: number): void {
    if (!this.config.enableCache) return

    const normalizedQuestion = this.normalizeQuestion(question)
    
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU()
    }

    const entry: CacheEntry = {
      question: normalizedQuestion,
      response,
      metrics,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0
    }

    this.cache.set(normalizedQuestion, entry)
    this.stats.cacheMisses++
  }

  /**
   * Normalize question for cache key matching
   */
  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): PerformanceStats {
    const totalQueries = this.stats.cacheHits + this.stats.cacheMisses
    this.stats.totalQueries = totalQueries
    this.stats.cacheHitRate = totalQueries > 0 
      ? this.stats.cacheHits / totalQueries 
      : 0

    return { ...this.stats }
  }

  /**
   * Update performance statistics
   */
  updateStats(metrics: DetailedMetrics): void {
    // Update total queries
    this.stats.totalQueries++

    // Update average query time
    const prevAvg = this.stats.avgQueryTime
    const n = this.stats.totalQueries
    this.stats.avgQueryTime = (prevAvg * (n - 1) + metrics.totalTime) / n

    // Update average tokens used
    const prevTokenAvg = this.stats.avgTokensUsed
    this.stats.avgTokensUsed = (prevTokenAvg * (n - 1) + metrics.tokensUsed) / n

    // Update total cost
    this.stats.totalCost += metrics.costEstimate

    // Update queries by type
    if (metrics.interviewType) {
      const type = metrics.interviewType
      this.stats.queriesByType[type] = (this.stats.queriesByType[type] || 0) + 1

      // Update average time by type
      const typeCount = this.stats.queriesByType[type]
      const prevTypeAvg = this.stats.avgTimeByType[type] || 0
      this.stats.avgTimeByType[type] = (prevTypeAvg * (typeCount - 1) + metrics.totalTime) / typeCount
    }
  }

  /**
   * Get cache size and capacity info
   */
  getCacheInfo(): { size: number; maxSize: number; utilization: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      utilization: this.cache.size / this.config.maxSize
    }
  }
}

// Global cache instance
const globalCache = new RAGCache({
  maxSize: 100,
  defaultTTL: 3600000, // 1 hour
  enableCache: true
})

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Calculate cost estimate based on token usage
 * Groq pricing: https://console.groq.com/docs/pricing
 */
function calculateCost(tokensUsed: number, model: string): number {
  // Groq pricing (per 1M tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
    'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 }
  }

  const modelPricing = pricing[model] || pricing['llama-3.1-8b-instant']
  // Assume 50/50 input/output split for estimation
  const avgPrice = (modelPricing.input + modelPricing.output) / 2
  return (tokensUsed / 1_000_000) * avgPrice
}

/**
 * Monitor a function's execution time
 */
async function monitorExecution<T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now()
  const result = await fn()
  const duration = Date.now() - start
  
  console.log(`[Performance] ${label}: ${duration}ms`)
  
  return { result, duration }
}

/**
 * Count tokens in text (approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

// ============================================================================
// MONITORED RAG QUERY
// ============================================================================

/**
 * Execute RAG query with full performance monitoring
 */
export async function monitoredRAGQuery(
  question: string,
  options: {
    interviewType?: string
    enableCache?: boolean
    cacheTTL?: number
    queryModel?: string
    responseModel?: string
  } = {}
): Promise<{
  success: boolean
  response: string
  metrics: DetailedMetrics
  cacheHit: boolean
}> {
  const startTime = Date.now()
  const enableCache = options.enableCache !== false

  // Check cache first
  if (enableCache) {
    const cached = globalCache.get(question)
    if (cached) {
      console.log('✅ Cache hit! Returning cached response')
      console.log(`Cache entry age: ${Math.floor((Date.now() - cached.timestamp) / 1000)}s`)
      console.log(`Cache entry hits: ${cached.hits}`)
      
      return {
        success: true,
        response: cached.response,
        metrics: {
          ...cached.metrics,
          cacheHit: true,
          totalTime: Date.now() - startTime // Minimal cache lookup time
        },
        cacheHit: true
      }
    }
  }

  // Initialize metrics
  const metrics: Partial<DetailedMetrics> = {
    timestamp: new Date().toISOString(),
    cacheHit: false,
    queryLength: question.length,
    modelUsed: {
      queryModel: options.queryModel || 'llama-3.1-8b-instant',
      responseModel: options.responseModel || 'llama-3.1-70b-versatile'
    },
    interviewType: options.interviewType
  }

  try {
    // Import dynamically to avoid circular dependencies
    const { enhancedDigitalTwinQuery } = await import('../app/actions/digital-twin-actions')
    
    // Execute the enhanced query with full pipeline
    console.log('\n� Starting Enhanced RAG Pipeline')
    
    const pipelineStart = Date.now()
    const result = await enhancedDigitalTwinQuery(question, {
      topK: 5,
      enableQueryEnhancement: true,
      enableInterviewFormatting: true,
      tone: 'confident'
    })
    const pipelineTime = Date.now() - pipelineStart
    
    if (!result.success) {
      const errorMessage = 'metadata' in result && 'error' in result.metadata 
        ? String(result.metadata.error) 
        : 'Enhanced query failed'
      throw new Error(errorMessage)
    }

    // Extract timing information from metadata
    // Note: We'll estimate component times since they're not directly available
    const totalPipelineTime = pipelineTime
    const estimatedSearchTime = totalPipelineTime * 0.2 // ~20% for vector search
    const estimatedEnhancementTime = totalPipelineTime * 0.3 // ~30% for query enhancement
    const estimatedFormattingTime = totalPipelineTime * 0.5 // ~50% for response formatting

    metrics.queryEnhancementTime = estimatedEnhancementTime
    metrics.vectorSearchTime = estimatedSearchTime
    metrics.responseFormattingTime = estimatedFormattingTime
    
    // Estimate tokens based on content
    const queryTokens = estimateTokens(question) + estimateTokens(question) * 2 // Question + enhancement
    const responseTokens = estimateTokens(result.response) + estimateTokens(question) * 3 // Response + context
    
    metrics.queryEnhancementTokens = queryTokens
    metrics.responseFormattingTokens = responseTokens
    metrics.vectorResults = result.metadata?.resultsFound || 0
    metrics.responseLength = result.response.length
    
    console.log(`✓ Pipeline completed in ${pipelineTime}ms`)
    console.log(`  - Query Enhancement: ~${estimatedEnhancementTime.toFixed(0)}ms`)
    console.log(`  - Vector Search: ~${estimatedSearchTime.toFixed(0)}ms`)
    console.log(`  - Response Formatting: ~${estimatedFormattingTime.toFixed(0)}ms`)
    console.log(`Found ${metrics.vectorResults} relevant results`)
    console.log(`Response length: ${metrics.responseLength} characters`)

    const formattedResponse = result.response

    // Calculate totals
    metrics.totalTime = Date.now() - startTime
    metrics.tokensUsed = (metrics.queryEnhancementTokens || 0) + (metrics.responseFormattingTokens || 0)
    metrics.costEstimate = 
      calculateCost(metrics.queryEnhancementTokens || 0, metrics.modelUsed!.queryModel) +
      calculateCost(metrics.responseFormattingTokens || 0, metrics.modelUsed!.responseModel)
    metrics.cacheHitRate = globalCache.getStats().cacheHitRate

    // Log final metrics
    console.log('\n📊 Performance Summary:')
    console.log(`Total time: ${metrics.totalTime}ms`)
    console.log(`Tokens used: ${metrics.tokensUsed}`)
    console.log(`Cost estimate: $${metrics.costEstimate.toFixed(6)}`)
    console.log(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`)

    const detailedMetrics = metrics as DetailedMetrics

    // Update cache and stats
    if (enableCache) {
      globalCache.set(question, formattedResponse, detailedMetrics, options.cacheTTL)
      globalCache.updateStats(detailedMetrics)
    }

    return {
      success: true,
      response: formattedResponse,
      metrics: detailedMetrics,
      cacheHit: false
    }

  } catch (error) {
    console.error('❌ Error in monitored RAG query:', error)
    
    // Return error metrics
    const errorMetrics: DetailedMetrics = {
      ...(metrics as DetailedMetrics),
      totalTime: Date.now() - startTime,
      tokensUsed: 0,
      cacheHitRate: 0,
      costEstimate: 0,
      queryEnhancementTime: metrics.queryEnhancementTime || 0,
      vectorSearchTime: metrics.vectorSearchTime || 0,
      responseFormattingTime: metrics.responseFormattingTime || 0,
      queryEnhancementTokens: 0,
      responseFormattingTokens: 0,
      cacheHit: false,
      vectorResults: 0,
      queryLength: question.length,
      responseLength: 0,
      timestamp: new Date().toISOString(),
      modelUsed: {
        queryModel: options.queryModel || 'llama-3.1-8b-instant',
        responseModel: options.responseModel || 'llama-3.1-70b-versatile'
      }
    }

    return {
      success: false,
      response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metrics: errorMetrics,
      cacheHit: false
    }
  }
}

// ============================================================================
// PERFORMANCE ANALYSIS
// ============================================================================

/**
 * Get current performance statistics
 */
export function getPerformanceStats(): PerformanceStats {
  return globalCache.getStats()
}

/**
 * Get cache information
 */
export function getCacheInfo(): {
  size: number
  maxSize: number
  utilization: number
  hitRate: number
  stats: PerformanceStats
} {
  const info = globalCache.getCacheInfo()
  const stats = globalCache.getStats()
  
  return {
    ...info,
    hitRate: stats.cacheHitRate,
    stats
  }
}

/**
 * Clear cache
 */
export function clearCache(): void {
  globalCache.clear()
  console.log('✓ Cache cleared')
}

/**
 * Analyze performance and provide optimization recommendations
 */
export function analyzePerformance(): {
  stats: PerformanceStats
  cacheInfo: ReturnType<typeof getCacheInfo>
  recommendations: OptimizationRecommendation[]
} {
  const stats = getPerformanceStats()
  const cacheInfo = getCacheInfo()
  const recommendations: OptimizationRecommendation[] = []

  // Recommendation 1: Cache hit rate
  if (stats.cacheHitRate < 0.3 && stats.totalQueries > 10) {
    recommendations.push({
      type: 'cache',
      severity: 'warning',
      message: `Low cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`,
      suggestion: 'Consider increasing cache TTL or cache size',
      potentialImprovement: 'Could reduce response time by 70-90% for cached queries'
    })
  }

  // Recommendation 2: High average query time
  if (stats.avgQueryTime > 3000) {
    recommendations.push({
      type: 'model',
      severity: 'warning',
      message: `High average query time: ${stats.avgQueryTime.toFixed(0)}ms`,
      suggestion: 'Consider using faster models (8B) for query enhancement',
      potentialImprovement: 'Could reduce query time by 40-60%'
    })
  }

  // Recommendation 3: Cost optimization
  if (stats.totalCost > 0.10) {
    recommendations.push({
      type: 'cost',
      severity: 'info',
      message: `Total cost: $${stats.totalCost.toFixed(4)}`,
      suggestion: 'Consider implementing more aggressive caching or using smaller models',
      potentialImprovement: 'Could reduce costs by 50-70% with caching'
    })
  }

  // Recommendation 4: Cache utilization
  if (cacheInfo.utilization > 0.9) {
    recommendations.push({
      type: 'cache',
      severity: 'warning',
      message: `Cache near full: ${(cacheInfo.utilization * 100).toFixed(1)}% utilized`,
      suggestion: 'Consider increasing cache size or reducing TTL',
      potentialImprovement: 'Prevent premature eviction of frequently used entries'
    })
  }

  // Recommendation 5: Token usage
  if (stats.avgTokensUsed > 2000) {
    recommendations.push({
      type: 'configuration',
      severity: 'info',
      message: `High average token usage: ${stats.avgTokensUsed.toFixed(0)} tokens`,
      suggestion: 'Consider reducing maxTokens in configuration or using more concise prompts',
      potentialImprovement: 'Could reduce costs by 20-30% and improve response time'
    })
  }

  return {
    stats,
    cacheInfo,
    recommendations
  }
}

/**
 * Benchmark RAG performance with a test query
 */
export async function benchmarkRAGPerformance(
  testQuestions: string[] = [
    'What are your main technical skills?',
    'Describe your leadership experience',
    'What is your experience with system design?'
  ]
): Promise<{
  totalTests: number
  avgTime: number
  avgTokens: number
  totalCost: number
  results: Array<{
    question: string
    metrics: DetailedMetrics
    success: boolean
  }>
}> {
  console.log('\n🏁 Starting RAG Performance Benchmark')
  console.log(`Testing ${testQuestions.length} questions...\n`)

  const results: Array<{
    question: string
    metrics: DetailedMetrics
    success: boolean
  }> = []

  let totalTime = 0
  let totalTokens = 0
  let totalCost = 0

  for (const question of testQuestions) {
    console.log(`\n📝 Testing: "${question}"`)
    
    const result = await monitoredRAGQuery(question, {
      enableCache: false // Disable cache for accurate benchmarking
    })

    results.push({
      question,
      metrics: result.metrics,
      success: result.success
    })

    if (result.success) {
      totalTime += result.metrics.totalTime
      totalTokens += result.metrics.tokensUsed
      totalCost += result.metrics.costEstimate
    }
  }

  const successfulTests = results.filter(r => r.success).length
  const avgTime = successfulTests > 0 ? totalTime / successfulTests : 0
  const avgTokens = successfulTests > 0 ? totalTokens / successfulTests : 0

  console.log('\n' + '='.repeat(60))
  console.log('📊 BENCHMARK RESULTS')
  console.log('='.repeat(60))
  console.log(`Total tests: ${testQuestions.length}`)
  console.log(`Successful: ${successfulTests}`)
  console.log(`Failed: ${testQuestions.length - successfulTests}`)
  console.log(`Average time: ${avgTime.toFixed(0)}ms`)
  console.log(`Average tokens: ${avgTokens.toFixed(0)}`)
  console.log(`Total cost: $${totalCost.toFixed(6)}`)
  console.log('='.repeat(60))

  return {
    totalTests: testQuestions.length,
    avgTime,
    avgTokens,
    totalCost,
    results
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  globalCache as cache,
  monitorExecution,
  estimateTokens,
  calculateCost
}
