# TECHNICAL INTERVIEW - Data Analyst Position
## iSelect Ltd - Senior Technical Assessment

**Date:** January 15, 2025  
**Position:** Data Analyst (Mid-Level)  
**Interviewer Role:** Senior Software Engineer  
**Candidate:** Emmanuel Awotwe (Digital Twin)

---

## TECHNICAL DEEP DIVE ASSESSMENT

### Question 1: SQL Architecture & Performance (Advanced Level Required)
Looking at your profile, you claim SQL proficiency at 4/5 with PostgreSQL experience. The role involves analyzing millions of customer comparison records at iSelect.

**Part A:** Design a database schema for a price comparison service tracking:
- Products (insurance, energy, telecom) with dynamic pricing
- Customer search behavior and conversion funnels
- Partner merchant data feeds with varying update frequencies

**Part B:** Write a SQL query to identify the top 10 product categories where customers abandoned searches in the last 30 days, including conversion rate trends.

**Part C:** How would you optimize this query for a table with 50M+ records? What indexing strategy and performance monitoring would you implement?

*Expected: Advanced joins, window functions, partitioning strategies, query execution plan analysis*

---

### Question 2: RAG System Architecture Deep Dive
Your Food RAG system shows AI implementation experience. Let's evaluate enterprise-scale architecture decisions.

**System Design Challenge:** Design a RAG system for iSelect to answer customer queries about insurance policies from 200+ providers.

**Requirements:**
- Handle 10,000+ concurrent users
- Sub-second response times
- Real-time policy updates from external APIs  
- Multilingual support (English, Mandarin, Arabic)
- Compliance with financial services regulations

**Technical Assessment Points:**
1. **Vector Database Design:** How would you structure embeddings for policy documents vs. customer queries? What chunking strategy for 500-page policy documents?

2. **Scalability Architecture:** Compare your Upstash Vector + Groq approach vs. enterprise alternatives (Pinecone, Weaviate, AWS Bedrock). Justify your recommendations.

3. **Data Pipeline:** Design the ETL pipeline for real-time policy updates. How do you handle version control and rollbacks?

4. **Quality Assurance:** What evaluation metrics and testing framework would you implement? How do you prevent hallucinations in financial advice?

*Expected: Microservices architecture, caching strategies, monitoring/observability, compliance considerations*

---

### Question 3: Python Production Code Quality
Your Python experience shows bootcamp and project work. Let's assess production-level coding practices.

**Code Review Scenario:** Here's a simplified version of what a RAG query function might look like at iSelect:

```python
def search_policies(query, user_id):
    # Get user context
    user = db.get_user(user_id)
    
    # Search vector db
    results = vector_db.search(query, top_k=5)
    
    # Generate response
    response = llm.generate(query, results)
    
    # Log and return
    print(f"User {user_id} searched: {query}")
    return response
```

**Technical Critique Required:**
1. **Error Handling:** What production-level error scenarios are missing?
2. **Performance:** How would you optimize this for high concurrency?
3. **Testing:** Write unit test cases covering edge cases and failure modes
4. **Monitoring:** What metrics and logging would you add?
5. **Security:** What security vulnerabilities exist? How do you fix them?

*Expected: Async/await patterns, connection pooling, circuit breakers, structured logging, input validation*

---

### Question 4: Cloud Infrastructure & DevOps
The role requires AWS/GCP/Azure experience. Your current stack is Vercel/Upstash.

**Infrastructure Migration Challenge:**
Migrate your RAG system to AWS with enterprise requirements:
- Blue/green deployments
- Auto-scaling based on load
- Multi-region deployment (Sydney, Melbourne, Perth)
- 99.9% uptime SLA
- Cost optimization for variable load (10x traffic spikes during comparison seasons)

**Technical Design Requirements:**
1. **Service Architecture:** Which AWS services would you use? (ECS vs Lambda vs EKS?)
2. **Data Storage:** Compare RDS vs DocumentDB vs Neptune for different data types
3. **CI/CD Pipeline:** Design the deployment pipeline from code commit to production
4. **Monitoring:** What CloudWatch metrics and alerts would you implement?
5. **Cost Management:** How do you optimize costs during low-traffic periods?

*Expected: Infrastructure as Code (Terraform/CDK), container orchestration, observability stack, cost optimization strategies*

---

### Question 5: Technical Leadership & Problem Solving
You mention cross-functional collaboration on the RAG project. Let's assess technical leadership capabilities.

**Scenario:** You're leading a data analytics team tasked with building a real-time customer behavior prediction system. The business wants to predict which visitors will convert within their session to optimize the comparison experience.

**Technical Challenges:**
1. **System Design:** How do you architecture real-time ML inference for 50,000+ concurrent sessions?
2. **Data Engineering:** Design the streaming data pipeline for clickstream analysis
3. **Model Deployment:** How do you deploy and update ML models without downtime?
4. **Team Coordination:** How do you coordinate between data scientists, backend engineers, and frontend developers?
5. **Quality Assurance:** What's your approach to A/B testing ML model performance?

**Leadership Assessment:**
- How do you handle technical disagreements between team members?
- What's your process for code reviews and technical standards?
- How do you balance technical debt vs. feature delivery?

*Expected: Stream processing (Kafka/Kinesis), ML Ops practices, team leadership examples, architectural decision-making*

---

## TECHNICAL COMPETENCY SCORING MATRIX

Based on responses, rate each skill (1-10 scale):

| Technical Skill | Required Level | Score | Assessment Notes |
|----------------|----------------|-------|------------------|
| **SQL/Database Design** | Advanced (8+) | ___/10 | Complex queries, optimization, indexing |
| **Python Programming** | Advanced (8+) | ___/10 | Production code quality, testing, async |
| **System Architecture** | Advanced (7+) | ___/10 | Scalability, reliability, design patterns |
| **Cloud Platforms** | Intermediate (6+) | ___/10 | AWS/Azure services, DevOps, infrastructure |
| **RAG/AI Systems** | Intermediate (6+) | ___/10 | Enterprise deployment, quality assurance |
| **Data Pipeline Design** | Advanced (7+) | ___/10 | ETL, streaming, real-time processing |
| **Production Debugging** | Advanced (7+) | ___/10 | Monitoring, troubleshooting, performance |
| **Technical Leadership** | Intermediate (6+) | ___/10 | Architecture decisions, team coordination |

**Minimum Technical Threshold:** 6.5/10 average across all skills

---

## ASSESSMENT METHODOLOGY

**Scoring Criteria:**
- **8-10:** Production-ready expertise with best practices
- **6-7:** Solid foundation with some experience gaps  
- **4-5:** Basic knowledge, requires significant training
- **1-3:** Insufficient for role requirements

**Red Flags to Assess:**
- Inability to discuss production challenges and trade-offs
- Missing understanding of enterprise scalability requirements
- Lack of testing and quality assurance methodologies
- No experience with performance optimization under load
- Limited understanding of security and compliance considerations

This technical assessment will determine if the candidate can handle iSelect's enterprise-scale data analytics challenges and contribute to the technical architecture decisions required for millions of customer interactions.