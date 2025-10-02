'use client'

import { queryDigitalTwin, testConnectivity, populateVectorDatabaseAction } from './actions/digital-twin-actions'
import { useState } from 'react'

interface QueryResult {
  success: boolean
  data?: {
    question: string
    answer: string
    sources: Array<{
      title: string
      category: string
      relevance: number
    }>
    timestamp: string
  }
  message?: string
  error?: string
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [question, setQuestion] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await queryDigitalTwin(question.trim())
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectivityTest = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await testConnectivity()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePopulateVectorDB = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await populateVectorDatabaseAction()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            🤖 Emmanuel&apos;s Digital Twin
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Ask questions about Emmanuel Awotwe&apos;s professional background using RAG (Retrieval-Augmented Generation)
          </p>
        </div>

        {/* MCP Server Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🔗 MCP Server Information
          </h2>
          <div className="space-y-2 text-sm">
            <p><strong>Server Name:</strong> digital-twin-mcp-server</p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>MCP Endpoint:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">https://emma-digital-twin-mcp.vercel.app/api/mcp</code></p>
            <p><strong>Tool Name:</strong> query_digital_twin</p>
          </div>
        </div>

        {/* Claude Desktop Setup */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">
            ⚙️ Claude Desktop Setup
          </h2>
          <p className="text-sm text-green-800 dark:text-green-200 mb-3">
            Add this configuration to your Claude Desktop config file:
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre>{`{
  "mcpServers": {
    "digital-twin": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://emma-digital-twin-mcp.vercel.app/api/mcp"
      ]
    }
  }
}`}</pre>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              <strong>Alternative Configuration (if above doesn&apos;t work):</strong>
            </p>
            <div className="bg-gray-900 text-yellow-400 p-3 rounded text-xs">
              <pre>{`{
  "mcpServers": {
    "digital-twin": {
      "command": "node",
      "args": [
        "-e",
        "const { spawn } = require('child_process'); const proc = spawn('npx', ['-y', 'mcp-remote', 'https://emma-digital-twin-mcp.vercel.app/api/mcp'], { stdio: 'inherit' }); proc.on('exit', process.exit);"
      ]
    }
  }
}`}</pre>
            </div>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
            Config file location: <code>%APPDATA%\Claude\claude_desktop_config.json</code> (Windows)
          </p>
        </div>

        {/* Quick Test */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            🧪 Quick Test
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Test the digital twin functionality using server actions:
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ask a question:
              </label>
              <input
                type="text"
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Tell me about your Python experience"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Ask Digital Twin'}
            </button>
          </form>

          {/* Connectivity Test */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              <button
                onClick={handleConnectivityTest}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Testing...' : 'Test Connectivity'}
              </button>
              
              <button
                onClick={handlePopulateVectorDB}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Populating...' : 'Populate Vector Database'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Use &ldquo;Populate Vector Database&rdquo; to index the updated profile data in Upstash Vector for semantic search.
            </p>
          </div>

          {/* Results Display */}
          {result && (
            <div className="mt-6 p-4 rounded-lg border">
              {result.success ? (
                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Success
                  </div>
                  
                  {result.data && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                      <div className="mb-3">
                        <strong className="text-gray-900 dark:text-gray-100">Question:</strong>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{result.data.question}</p>
                      </div>
                      
                      <div className="mb-3">
                        <strong className="text-gray-900 dark:text-gray-100">Answer:</strong>
                        <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{result.data.answer}</p>
                      </div>
                      
                      {result.data.sources && result.data.sources.length > 0 && (
                        <div>
                          <strong className="text-gray-900 dark:text-gray-100">Sources:</strong>
                          <ul className="mt-1 space-y-1">
                            {result.data.sources.map((source, index: number) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                • {source.title} ({source.category}) - Relevance: {source.relevance}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        Timestamp: {new Date(result.data.timestamp).toLocaleString()}
                      </div>
                    </div>
                  )}
                  
                  {result.message && (
                    <p className="text-green-700 dark:text-green-300">{result.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Error
                  </div>
                  <p className="text-red-700 dark:text-red-300">
                    {result.error || result.message || 'Unknown error occurred'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Example Questions */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
            💡 Example Questions
          </h2>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>• &ldquo;Tell me about your internship at AUSBIZ Consulting&rdquo;</li>
            <li>• &ldquo;What&apos;s your Food RAG project that saves 1,200 hours per year?&rdquo;</li>
            <li>• &ldquo;Describe your experience with Python and AI/ML technologies&rdquo;</li>
            <li>• &ldquo;What are your salary expectations and career goals?&rdquo;</li>
            <li>• &ldquo;Tell me about your Masters in Business Analytics at UTS&rdquo;</li>
            <li>• &ldquo;What&apos;s your experience with Upstash Vector and Groq API?&rdquo;</li>
            <li>• &ldquo;Describe your accounting background at Newmont Ghana Gold&rdquo;</li>
          </ul>
        </div>

        {/* Technology Stack */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-3">
            🛠️ Technology Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong className="text-purple-800 dark:text-purple-200">Framework:</strong>
              <p className="text-purple-700 dark:text-purple-300">Next.js 15.5.3</p>
            </div>
            <div>
              <strong className="text-purple-800 dark:text-purple-200">Vector DB:</strong>
              <p className="text-purple-700 dark:text-purple-300">Upstash Vector</p>
            </div>
            <div>
              <strong className="text-purple-800 dark:text-purple-200">AI Model:</strong>
              <p className="text-purple-700 dark:text-purple-300">Groq LLaMA-3.1-8B</p>
            </div>
            <div>
              <strong className="text-purple-800 dark:text-purple-200">MCP Handler:</strong>
              <p className="text-purple-700 dark:text-purple-300">mcp-handler</p>
            </div>
            <div>
              <strong className="text-purple-800 dark:text-purple-200">UI:</strong>
              <p className="text-purple-700 dark:text-purple-300">ShadCN/UI + Tailwind</p>
            </div>
            <div>
              <strong className="text-purple-800 dark:text-purple-200">Validation:</strong>
              <p className="text-purple-700 dark:text-purple-300">Zod</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
