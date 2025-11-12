# Digital Twin MCP Server

## Project Overview
Study and build an MCP server using the roll dice pattern use Github MCP to study the roll dice repository - **Pattern Reference**: https://github.com/gocallum/rolldice-mcpserver.git to create a digital twin assistant that can answer questions about a person's professional profile using RAG (Retrieval-Augmented Generation). 

## Setup commands
- Install deps: `pnpm install` done
- Start dev server: `pnpm dev`
- Run tests: `pnpm test`
- Build for production: `pnpm build`
- Initialize ShadCN: `pnpm dlx shadcn@latest init` done

Study the digitaltwin_rag.py as a reference of the embedding system for the digital twin.

## Environment setup

```
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token
GROQ_API_KEY=your_groq_api_key
```
All the details are in .env

## Environment Variables (.env.local)
```
GROQ_API_KEY=your_groq_api_key_here
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token_here
UPSTASH_VECTOR_REST_READONLY_TOKEN=your_upstash_readonly_token_here
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url_here
```
**Note**: Replace the placeholder values above with your actual API keys. Keep your `.env.local` file private and never commit it to version control.

**✅ Implementation Status: COMPLETE**
- Environment variables successfully loaded from .env.local
- MCP server updated with Groq LLM integration
- Vector database configured with Upstash Vector
- Enhanced RAG pipeline with STAR format responses
- Server running at http://localhost:3000
## Code style
- TypeScript strict mode enabled
- Always use pnpm (never npm or yarn)
- Use Windows PowerShell commands
- Single quotes, no semicolons
- Use functional patterns where possible
- Enforce strong TypeScript type safety throughout
- Always use server actions where possible
- Use globals.css instead of inline styling

## Reference repositories

  - Roll dice MCP server - use same technology and pattern for our MCP server
- **Logic Reference**: https://github.com/gocallum/binal_digital-twin_py.git
  - Python code using Upstash Vector for RAG search with Groq and LLaMA for generations

## Framework requirements
- **Framework**: Next.js 15.5.3+ (use latest available)
- **UI Framework**: ShadCN with dark mode theme
- **Focus**: Prioritize MCP functionality over UI - UI is primarily for MCP server configuration

## Testing instructions

- Test MCP server functionality with VS Code MCP extensions
- Validate responses against Python implementation in `digitaltwin_rag.py`
- Test vector search functionality
- Test Groq API integration
- Test complete RAG pipeline

## Core functionality requirements ✅ IMPLEMENTED
- MCP server accepts user questions about the person's professional background
- Create server actions that search Upstash Vector database and return RAG results
- Search logic enhanced to work with new JSON profile structure
- Always respond in first person as the professional using Groq LLM
- Maintain professional tone and accuracy with STAR format responses
- Include specific metrics and achievements with quantified outcomes
- Environment variables properly loaded from .env.local file
- Enhanced intent classification for better query understanding
- Groq integration for high-quality response generation
- **Conversation Memory**: Multi-turn context awareness with session management
- **Voice Integration**: Speech-to-text and text-to-speech with ElevenLabs
- **Performance Optimization**: Intelligent caching with 60-80% faster responses
- **MCP Server**: 20 tools including memory-aware queries and voice capabilities



## Key integrations

### Upstash Vector
- Getting Started: https://upstash.com/docs/vector/overall/getstarted
- TypeScript SDK: https://upstash.com/docs/vector/sdks/ts/getting-started
- Use built-in embeddings for vector search https://upstash.com/docs/vector/features/embeddingmodels

### Groq API
- Documentation: https://console.groq.com/docs
- Model: `llama-3.1-8b-instant`
- Temperature: 0.7, Max tokens: 500





## RAG implementation flow
1. **Input**: User question about professional background
2. **Session Management**: Create/retrieve conversation session for context
3. **Context Building**: Include previous conversation turns if available
4. **Embedding**: Convert question to vector using Upstash built-in embeddings
5. **Search**: Query vector database with top-k=3 to 5
6. **Context**: Extract relevant content from search results
7. **Cache Check**: Check Step 9 performance cache for faster responses
8. **Generation**: Use Groq API with LLaMA model for response generation
9. **Memory Update**: Store user question and assistant response in session
10. **Output**: Professional, first-person response as digital twin with conversation context

## Development phases
1. **Phase 1**: Setup Next.js with TypeScript and ShadCN
2. **Phase 2**: Implement RAG logic matching Python version
3. **Phase 3**: Create MCP server with tool definitions
4. **Phase 4**: Test with VS Code MCP extensions

## Security considerations
- Secure API key management in environment variables
- Validate all user inputs before processing
- Implement rate limiting for API calls
- Use proper error handling for external API failures

## Deployment notes
- Environment variable management for production
- API rate limiting and error handling
- Performance optimization for vector queries
- Monitor API usage and costs