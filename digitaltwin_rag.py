"""
Digital Twin RAG Application
Based on Binal's production implementation
- Upstash Vector: Built-in embeddings and vector storage
- Groq: Ultra-fast LLM inference
"""

import os
import json
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq

# Load environment variables
load_dotenv()

# Constants from environment variables
JSON_FILE = os.getenv('DIGITAL_TWIN_JSON_FILE', 'digitaltwin.json')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
DEFAULT_MODEL = os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')
RAG_TOP_K = int(os.getenv('RAG_TOP_K', '3'))
RAG_TEMPERATURE = float(os.getenv('RAG_TEMPERATURE', '0.7'))
RAG_MAX_TOKENS = int(os.getenv('RAG_MAX_TOKENS', '500'))
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

def setup_groq_client():
    """Setup Groq client"""
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY not found in .env file")
        return None
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq client initialized successfully!")
        return client
    except Exception as e:
        print(f"❌ Error initializing Groq client: {str(e)}")
        return None

def setup_vector_database(force_reload=False):
    """Setup Upstash Vector database with built-in embeddings"""
    print("🔄 Setting up Upstash Vector database...")
    
    try:
        index = Index.from_env()
        print("✅ Connected to Upstash Vector successfully!")
        
        # Check current vector count
        try:
            info = index.info()
            current_count = getattr(info, 'vector_count', 0)
            print(f"📊 Current vectors in database: {current_count}")
        except:
            current_count = 0
        
        # Load data if database is empty or force reload requested
        if current_count == 0 or force_reload:
            if force_reload:
                print("🔄 Force reloading updated professional profile...")
                # Clear existing vectors
                try:
                    # Get all vector IDs and delete them
                    existing_vectors = index.query(data="dummy", top_k=1000, include_metadata=True)
                    if existing_vectors:
                        vector_ids = [v.id for v in existing_vectors]
                        if vector_ids:
                            index.delete(ids=vector_ids)
                            print(f"🗑️ Cleared {len(vector_ids)} existing vectors")
                except Exception as e:
                    print(f"⚠️ Could not clear existing vectors: {e}")
            else:
                print("📝 Loading your updated professional profile...")
            
            try:
                with open(JSON_FILE, "r", encoding="utf-8") as f:
                    profile_data = json.load(f)
            except FileNotFoundError:
                print(f"❌ {JSON_FILE} not found!")
                return None
            
            vectors = []
            
            # Process personal information
            personal = profile_data.get('personal', {})
            if personal:
                personal_text = f"Personal Information: {personal.get('name', '')} - {personal.get('title', '')}. {personal.get('summary', '')} Location: {personal.get('location', '')}. Elevator Pitch: {personal.get('elevator_pitch', '')}"
                vectors.append((
                    "personal_overview",
                    personal_text,
                    {
                        "title": "Personal Information & Summary",
                        "type": "personal",
                        "content": personal_text,
                        "category": "personal_info",
                        "tags": ["personal", "summary", "overview", "elevator_pitch"],
                        "importance": "high"
                    }
                ))
            
            # Process salary and location information
            salary_location = profile_data.get('salary_location', {})
            if salary_location:
                salary_text = f"Salary & Location: Current salary range: {salary_location.get('current_salary_range', '')}. Expectations: {salary_location.get('salary_expectations', '')}. Location preferences: {', '.join(salary_location.get('location_preferences', []))}. Work authorization: {salary_location.get('work_authorization', '')}. Remote experience: {salary_location.get('remote_experience', '')}. Willing to relocate: {salary_location.get('relocation_willing', '')}."
                vectors.append((
                    "salary_location_info",
                    salary_text,
                    {
                        "title": "Salary & Location Preferences",
                        "type": "salary_location",
                        "content": salary_text,
                        "category": "employment_details",
                        "tags": ["salary", "location", "visa", "remote", "relocation"],
                        "importance": "high"
                    }
                ))
            
            # Process projects in STAR format
            projects = profile_data.get('projects_star_format', [])
            for i, project in enumerate(projects):
                project_text = f"Project: {project.get('project_name', '')}. Situation: {project.get('situation', '')}. Task: {project.get('task', '')}. Action: {project.get('action', '')}. Result: {project.get('result', '')}. Technologies: {', '.join(project.get('technologies', []))}. Duration: {project.get('duration', '')}. Team size: {project.get('team_size', '')}."
                
                # Add links if available
                links = project.get('links', {})
                if links:
                    link_info = f" GitHub: {links.get('github', 'N/A')}. Live Demo: {links.get('live_demo', 'N/A')}."
                    project_text += link_info
                
                # Add KPIs if available
                kpis = project.get('kpis', {})
                if kpis:
                    kpi_text = " Key Metrics: " + "; ".join([f"{k}: {v}" for k, v in kpis.items()])
                    project_text += kpi_text
                
                # Add governance considerations if available
                governance = project.get('governance_considerations', [])
                if governance:
                    governance_text = " Governance & Ethics: " + "; ".join(governance)
                    project_text += governance_text
                
                # Add future enhancements if available
                future_enhancements = project.get('future_enhancements', [])
                if future_enhancements:
                    future_text = " Future Enhancements: " + "; ".join(future_enhancements)
                    project_text += future_text
                
                vectors.append((
                    f"project_{i+1}",
                    project_text,
                    {
                        "title": f"Project: {project.get('project_name', '')}",
                        "type": "project",
                        "content": project_text,
                        "category": "projects",
                        "tags": ["project", "portfolio"] + project.get('technologies', []),
                        "importance": "high"
                    }
                ))
            
            # Process leadership examples
            leadership = profile_data.get('leadership_examples_star', [])
            for i, example in enumerate(leadership):
                leadership_text = f"Leadership Example: Situation: {example.get('situation', '')}. Task: {example.get('task', '')}. Action: {example.get('action', '')}. Result: {example.get('result', '')}."
                vectors.append((
                    f"leadership_{i+1}",
                    leadership_text,
                    {
                        "title": f"Leadership Example {i+1}",
                        "type": "leadership",
                        "content": leadership_text,
                        "category": "leadership",
                        "tags": ["leadership", "management", "teamwork"],
                        "importance": "high"
                    }
                ))
            
            # Process work experience
            experiences = profile_data.get('experience', [])
            for i, exp in enumerate(experiences):
                exp_text = f"Work Experience: {exp.get('title', '')} at {exp.get('company', '')} ({exp.get('duration', '')}). Company context: {exp.get('company_context', '')}. Team structure: {exp.get('team_structure', '')}."
                
                # Add achievements in STAR format
                achievements = exp.get('achievements_star', [])
                for j, achievement in enumerate(achievements):
                    achievement_text = f" Achievement {j+1}: Situation: {achievement.get('situation', '')}. Task: {achievement.get('task', '')}. Action: {achievement.get('action', '')}. Result: {achievement.get('result', '')}."
                    exp_text += achievement_text
                
                # Add technical skills and leadership
                tech_skills = exp.get('technical_skills_used', [])
                if tech_skills:
                    exp_text += f" Technical skills used: {', '.join(tech_skills)}."
                
                leadership_examples = exp.get('leadership_examples', [])
                if leadership_examples:
                    exp_text += f" Leadership examples: {'; '.join(leadership_examples)}."
                
                vectors.append((
                    f"experience_{i+1}",
                    exp_text,
                    {
                        "title": f"{exp.get('title', '')} at {exp.get('company', '')}",
                        "type": "experience",
                        "content": exp_text,
                        "category": "work_experience",
                        "tags": ["work", "experience", "employment"] + tech_skills,
                        "importance": "high"
                    }
                ))
            
            # Process skills
            skills = profile_data.get('skills', {})
            
            # Technical skills
            technical = skills.get('technical', {})
            if technical:
                prog_langs = technical.get('programming_languages', [])
                lang_text = "Programming Languages: " + "; ".join([f"{lang['language']} (v{lang.get('version', 'N/A')}, {lang.get('years', 0)} years, proficiency {lang.get('proficiency_1to5', 'N/A')}/5)" for lang in prog_langs])
                
                databases = technical.get('databases', [])
                if databases:
                    lang_text += f". Databases: {', '.join(databases)}."
                
                cloud_platforms = technical.get('cloud_platforms', [])
                if cloud_platforms:
                    lang_text += f" Cloud platforms: {', '.join(cloud_platforms)}."
                
                ai_ml = technical.get('ai_ml', [])
                if ai_ml:
                    lang_text += f" AI/ML: {', '.join(ai_ml)}."
                
                business_tools = technical.get('business_tools', [])
                if business_tools:
                    lang_text += f" Business tools: {', '.join(business_tools)}."
                
                vectors.append((
                    "technical_skills",
                    lang_text,
                    {
                        "title": "Technical Skills",
                        "type": "skills",
                        "content": lang_text,
                        "category": "technical_skills",
                        "tags": ["skills", "technical", "programming", "databases", "cloud", "ai", "ml"],
                        "importance": "high"
                    }
                ))
            
            # Soft skills and other skills sections
            soft_skills = skills.get('soft_skills', [])
            if soft_skills:
                soft_text = f"Soft Skills: {', '.join(soft_skills)}."
                vectors.append((
                    "soft_skills",
                    soft_text,
                    {
                        "title": "Soft Skills",
                        "type": "skills",
                        "content": soft_text,
                        "category": "soft_skills",
                        "tags": ["skills", "soft", "communication", "leadership"],
                        "importance": "medium"
                    }
                ))
            
            # Process education
            education = profile_data.get('education', {})
            if education:
                degrees = education.get('degrees', [])
                edu_text = ""
                for degree in degrees:
                    degree_text = f"Education: {degree.get('program', '')} at {degree.get('institution', '')} ({degree.get('timeline', '')})."
                    if degree.get('gpa'):
                        degree_text += f" GPA: {degree.get('gpa')}."
                    
                    projects = degree.get('projects_highlights', [])
                    if projects:
                        degree_text += f" Key projects: {', '.join(projects)}."
                    
                    edu_text += degree_text + " "
                
                qualifications = education.get('qualifications', [])
                if qualifications:
                    edu_text += f"Additional qualifications: {', '.join(qualifications)}."
                
                vectors.append((
                    "education",
                    edu_text.strip(),
                    {
                        "title": "Education & Qualifications",
                        "type": "education",
                        "content": edu_text.strip(),
                        "category": "education",
                        "tags": ["education", "degree", "university", "qualifications"],
                        "importance": "high"
                    }
                ))
            
            # Process portfolio evidence
            portfolio = profile_data.get('portfolio_evidence', {})
            if portfolio:
                dashboards = portfolio.get('dashboards', [])
                for i, dashboard in enumerate(dashboards):
                    dash_text = f"Dashboard Portfolio: {dashboard.get('title', '')} using {dashboard.get('tool', '')}."
                    
                    kpis = dashboard.get('kpis', {})
                    if kpis:
                        kpi_text = " Key metrics: " + "; ".join([f"{k}: {v}" for k, v in kpis.items()])
                        dash_text += kpi_text
                    
                    insights = dashboard.get('insights', [])
                    if insights:
                        dash_text += f" Key insights: {'; '.join(insights)}."
                    
                    artifacts = dashboard.get('artifacts', [])
                    if artifacts:
                        dash_text += f" Artifacts: {', '.join(artifacts)}."
                    
                    vectors.append((
                        f"portfolio_dashboard_{i+1}",
                        dash_text,
                        {
                            "title": f"Portfolio: {dashboard.get('title', '')}",
                            "type": "portfolio",
                            "content": dash_text,
                            "category": "portfolio_evidence",
                            "tags": ["portfolio", "dashboard", "visualization", dashboard.get('tool', '').lower()],
                            "importance": "high"
                        }
                    ))
            
            # Process quantification examples
            quantifications = profile_data.get('quantification_examples', [])
            if quantifications:
                quant_text = "Quantified Achievements: " + "; ".join(quantifications)
                vectors.append((
                    "quantified_achievements",
                    quant_text,
                    {
                        "title": "Quantified Achievements",
                        "type": "achievements",
                        "content": quant_text,
                        "category": "achievements",
                        "tags": ["achievements", "metrics", "results", "quantified"],
                        "importance": "high"
                    }
                ))
            
            if not vectors:
                print("❌ No content found in profile data")
                return None
            
            # Upload vectors
            index.upsert(vectors=vectors)
            print(f"✅ Successfully uploaded {len(vectors)} content chunks from updated profile!")
            if DEBUG:
                print(f"🔍 Debug: Uploaded vectors with IDs: {[v[0] for v in vectors[:5]]}{'...' if len(vectors) > 5 else ''}")
        
        return index
        
    except Exception as e:
        print(f"❌ Error setting up database: {str(e)}")
        return None

def load_profile_data():
    """Load and parse the complete profile data"""
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ {JSON_FILE} not found!")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing {JSON_FILE}: {str(e)}")
        return None

def classify_query_intent(query_text):
    """Classify user query to determine what type of information they're looking for"""
    query_lower = query_text.lower()
    
    # Define intent keywords with enhanced coverage
    intents = {
        'experience': ['work', 'job', 'experience', 'employment', 'company', 'role', 'position', 'career history', 'ausbiz', 'newmont', 'rigglets', 'intern', 'accountant', 'associate'],
        'skills': ['skill', 'technology', 'programming', 'language', 'tool', 'framework', 'technical', 'software', 'python', 'sql', 'javascript', 'database', 'cloud', 'proficiency', 'machine learning', 'ml', 'regression', 'classification', 'modeling', 'scikit-learn'],
        'education': ['education', 'degree', 'university', 'school', 'qualification', 'certification', 'course', 'msc', 'bsc', 'masters', 'bachelor', 'uts', 'ghana', 'acca'],
        'projects': ['project', 'portfolio', 'github', 'built', 'developed', 'created', 'app', 'application', 'rag', 'food', 'tableau', 'dashboard', 'analytics', 'tennis', 'trade', 'insurance', 'premium', 'credit risk', 'banking', 'random forest', 'ridge', 'lasso'],
        'personal': ['about', 'who', 'background', 'summary', 'introduction', 'overview', 'tell me', 'elevator pitch'],
        'career_goals': ['goal', 'future', 'aspiration', 'plan', 'want', 'looking for', 'seeking', 'next', 'career path'],
        'salary': ['salary', 'compensation', 'pay', 'money', 'rate', 'wage', 'location preference', 'visa', 'authorization', 'remote', 'hybrid', 'relocation'],
        'achievements': ['achievement', 'accomplish', 'result', 'outcome', 'impact', 'success', 'metric', 'kpi', 'improvement', 'delivery', 'saved', 'reduced'],
        'leadership': ['leadership', 'lead', 'manage', 'team', 'coordinate', 'mentor', 'guide', 'responsibility'],
        'portfolio': ['portfolio', 'dashboard', 'visualization', 'tableau', 'power bi', 'demo', 'showcase', 'example']
    }
    
    # Score each intent
    intent_scores = {}
    for intent, keywords in intents.items():
        score = sum(1 for keyword in keywords if keyword in query_lower)
        if score > 0:
            intent_scores[intent] = score
    
    # Return the highest scoring intent, or 'general' if no specific intent found
    if intent_scores:
        return max(intent_scores, key=intent_scores.get)
    return 'general'

def query_vectors(index, query_text, top_k=None, filter_by_type=None):
    """Query Upstash Vector for similar vectors with optional filtering"""
    if top_k is None:
        top_k = RAG_TOP_K
        
    try:
        results = index.query(
            data=query_text,
            top_k=top_k,
            include_metadata=True
        )
        
        # Optional: Filter results by content type
        if filter_by_type and results:
            filtered_results = []
            for result in results:
                metadata = result.metadata or {}
                if metadata.get('type') == filter_by_type or metadata.get('category') == filter_by_type:
                    filtered_results.append(result)
            results = filtered_results
        
        if DEBUG:
            print(f"🔍 Debug: Retrieved {len(results) if results else 0} vectors for query: '{query_text[:50]}...'")
            if filter_by_type:
                print(f"🔍 Debug: Filtered by type/category: {filter_by_type}")
        
        return results
    except Exception as e:
        print(f"❌ Error querying vectors: {str(e)}")
        return None

def generate_response_with_groq(client, prompt, personal_context=None, model=None):
    """Generate response using Groq with enhanced personal context"""
    if model is None:
        model = DEFAULT_MODEL
        
    try:
        # Enhanced system prompt with personal context
        system_content = "You are Emmanuel Awotwe's AI digital twin. Answer questions as if you are Emmanuel, speaking in first person about your background, skills, and experience."
        
        if personal_context:
            system_content += f"\n\nKey Personal Info:\n- Name: {personal_context.get('name', 'Emmanuel Awotwe')}\n- Title: {personal_context.get('title', '')}\n- Location: {personal_context.get('location', '')}\n- Summary: {personal_context.get('summary', '')}"
        
        system_content += "\n\nAlways respond professionally and authentically as Emmanuel. Be specific about your experience and achievements."
        
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": system_content
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=RAG_TEMPERATURE,
            max_tokens=RAG_MAX_TOKENS
        )
        
        return completion.choices[0].message.content.strip()
        
    except Exception as e:
        return f"❌ Error generating response: {str(e)}"
        
def get_profile_summary(profile_data):
    """Generate a comprehensive profile summary from structured data"""
    if not profile_data:
        return "Profile data not available."
    
    summary_parts = []
    
    # Personal info
    personal = profile_data.get('personal', {})
    if personal:
        summary_parts.append(f"👤 **{personal.get('name', 'Unknown')}** - {personal.get('title', '')}")
        summary_parts.append(f"📍 **Location:** {personal.get('location', '')}")
        if personal.get('summary'):
            summary_parts.append(f"📝 **Summary:** {personal.get('summary')}")
        if personal.get('elevator_pitch'):
            summary_parts.append(f"🎯 **Elevator Pitch:** {personal.get('elevator_pitch')}")
    
    # Recent experience
    experiences = profile_data.get('experience', [])
    if experiences:
        recent_exp = experiences[0]  # Most recent
        summary_parts.append(f"💼 **Current Role:** {recent_exp.get('title', '')} at {recent_exp.get('company', '')} ({recent_exp.get('duration', '')})")
    
    # Key skills with proficiency levels
    skills = profile_data.get('skills', {})
    tech_skills = skills.get('technical', {})
    if tech_skills:
        prog_langs = tech_skills.get('programming_languages', [])
        if prog_langs:
            langs = [f"{lang['language']} ({lang.get('proficiency_1to5', 'N/A')}/5)" for lang in prog_langs[:3]]
            summary_parts.append(f"🛠️ **Key Skills:** {', '.join(langs)}")
        
        # AI/ML capabilities
        ai_ml = tech_skills.get('ai_ml', [])
        if ai_ml:
            summary_parts.append(f"🤖 **AI/ML:** {', '.join(ai_ml[:3])}")
    
    # Education
    education = profile_data.get('education', {})
    degrees = education.get('degrees', [])
    if degrees:
        current_degree = degrees[0]  # Most recent
        summary_parts.append(f"🎓 **Education:** {current_degree.get('program', '')} - {current_degree.get('institution', '')} ({current_degree.get('timeline', '')})")
    
    # Key achievements
    quantifications = profile_data.get('quantification_examples', [])
    if quantifications:
        summary_parts.append(f"📊 **Key Achievements:** {quantifications[0]}")  # First achievement
    
    # Salary expectations
    salary_location = profile_data.get('salary_location', {})
    if salary_location and salary_location.get('salary_expectations'):
        summary_parts.append(f"💰 **Salary Expectations:** {salary_location.get('salary_expectations')}")
    
    return "\\n".join(summary_parts)

def get_contact_info(profile_data):
    """Extract contact information"""
    if not profile_data:
        return "Contact information not available."
    
    personal = profile_data.get('personal', {})
    contact = personal.get('contact', {})
    
    if not contact:
        return "Contact information not available."
    
    contact_parts = []
    if contact.get('email'):
        contact_parts.append(f"📧 **Email:** {contact['email']}")
    if contact.get('phone'):
        contact_parts.append(f"📱 **Phone:** {contact['phone']}")
    if contact.get('linkedin'):
        contact_parts.append(f"💼 **LinkedIn:** {contact['linkedin']}")
    if contact.get('github'):
        contact_parts.append(f"💻 **GitHub:** {contact['github']}")
    
    return "\\n".join(contact_parts)

def handle_special_commands(question, profile_data):
    """Handle special commands like 'summary', 'contact', etc."""
    question_lower = question.lower().strip()
    
    if question_lower in ['summary', 'overview', 'profile summary']:
        return get_profile_summary(profile_data)
    elif question_lower in ['contact', 'contact info', 'contact information']:
        return get_contact_info(profile_data)
    elif question_lower in ['help', 'commands']:
        return """Available commands:
• **summary** - Get comprehensive profile overview
• **contact** - Get contact information  
• **help** - Show this help message

Or ask natural questions about:
• **Work experience** - AUSBIZ, Newmont, De Rigglets roles with STAR format achievements
• **Technical skills** - Python, SQL, JavaScript with proficiency levels and years of experience  
• **AI/ML projects** - Food RAG system, vector databases, LLM integration
• **Machine Learning** - Insurance premium pricing (regression), credit risk classification, model evaluation, governance
• **Portfolio** - Tableau dashboards, trade analytics, tennis analytics with KPIs
• **Education** - MSc Business Analytics (UTS), BSc Administration (Ghana), ACCA progress
• **Quantified achievements** - Specific metrics like time savings, delivery rates, improvements
• **Leadership examples** - Team coordination, project management, stakeholder communication
• **Salary & location** - Expectations, work authorization, remote experience, relocation
• **Career goals** - Future aspirations, learning objectives, industry interests

💡 **Enhanced Features:**
- Answers use STAR format for experiences and projects
- Includes specific proficiency levels and quantified outcomes
- Covers interview performance insights and improvement areas"""
    
    return None

def rag_query(index, groq_client, question, profile_data=None):
    """Enhanced RAG query using Upstash Vector + Groq with intent classification"""
    try:
        # Step 1: Classify query intent
        intent = classify_query_intent(question)
        if DEBUG:
            print(f"🎯 Query intent classified as: {intent}")
        
        # Step 2: Query vector database with optional filtering
        filter_type = None
        if intent in ['experience', 'skills', 'education', 'projects', 'personal', 'career_goals', 'achievements', 'leadership', 'portfolio']:
            filter_type = intent
            
        results = query_vectors(index, question, filter_by_type=filter_type)
        
        if not results or len(results) == 0:
            # Fallback: try without filtering
            if filter_type:
                print("🔄 No filtered results found, trying broader search...")
                results = query_vectors(index, question)
            
            if not results or len(results) == 0:
                return "I don't have specific information about that topic in my profile."
        
        # Step 3: Extract and format relevant content
        print("🧠 Searching your professional profile...")
        
        top_docs = []
        context_metadata = []
        
        for result in results:
            metadata = result.metadata or {}
            title = metadata.get('title', 'Information')
            content = metadata.get('content', '')
            category = metadata.get('category', '')
            tags = metadata.get('tags', [])
            importance = metadata.get('importance', 'medium')
            score = result.score
            
            print(f"🔹 Found: {title} (Relevance: {score:.3f}, Category: {category})")
            
            if content:
                top_docs.append(f"**{title}**\n{content}")
                context_metadata.append({
                    'title': title,
                    'category': category,
                    'tags': tags,
                    'importance': importance,
                    'score': score
                })
        
        if not top_docs:
            return "I found some relevant information but couldn't extract specific details."
        
        print(f"⚡ Generating personalized response...")
        
        # Step 4: Create enhanced context with intent-specific formatting
        context = "\n\n".join(top_docs)
        
        # Get personal context for enhanced system prompt
        personal_context = None
        if profile_data:
            personal_context = profile_data.get('personal', {})
        
        # Create intent-specific prompt enhancement
        intent_context = ""
        if intent == 'experience':
            intent_context = "Focus on work experience, achievements in STAR format, and professional accomplishments with quantified results."
        elif intent == 'skills':
            intent_context = "Emphasize technical skills with proficiency levels (1-5 scale), programming languages with years of experience, tools, and specific expertise areas."
        elif intent == 'education':
            intent_context = "Highlight educational background, degrees with timelines, certifications, and key academic projects with outcomes."
        elif intent == 'projects':
            intent_context = "Describe specific projects using STAR format (Situation, Task, Action, Result), technologies used, quantified outcomes, and business impact."
        elif intent == 'career_goals':
            intent_context = "Discuss career aspirations, learning goals, and industry interests with specific examples."
        elif intent == 'salary':
            intent_context = "Provide information about salary expectations, location preferences, work authorization status, and remote work experience."
        elif intent == 'achievements':
            intent_context = "Focus on quantified achievements, measurable outcomes, performance improvements, and specific business impact."
        elif intent == 'leadership':
            intent_context = "Describe leadership examples using STAR format, team coordination, project management, and cross-functional collaboration."
        elif intent == 'portfolio':
            intent_context = "Showcase portfolio evidence, dashboard examples, visualizations, and specific business insights delivered."
        elif intent == 'skills' and any(keyword in question.lower() for keyword in ['machine learning', 'ml', 'model', 'regression', 'classification']):
            intent_context = "Emphasize machine learning expertise including regression and classification projects, model evaluation metrics (MAE, accuracy, F1), feature engineering, model governance, and ethical AI considerations with specific quantified outcomes."
        
        prompt = f"""Based on the following information about yourself, answer the question.
{intent_context if intent_context else ''}

Your Professional Information:
{context}

Question: {question}

Provide a helpful, professional response in first person:"""
        
        response = generate_response_with_groq(groq_client, prompt, personal_context)
        return response
    
    except Exception as e:
        return f"❌ Error during query: {str(e)}"

def main():
    """Main application loop"""
    print("🤖 Your Digital Twin - AI Profile Assistant")
    print("=" * 50)
    print("🔗 Vector Storage: Upstash (built-in embeddings)")
    print(f"⚡ AI Inference: Groq ({DEFAULT_MODEL})")
    print("📋 Data Source: Your Professional Profile")
    print(f"🔧 Environment: {ENVIRONMENT}")
    if DEBUG:
        print("🐛 Debug mode: ON")
    print()
    
    # Load profile data
    profile_data = load_profile_data()
    if not profile_data:
        print("❌ Could not load profile data. Exiting...")
        return
    
    # Display profile overview
    personal = profile_data.get('personal', {})
    if personal:
        print(f"👤 Profile loaded: {personal.get('name', 'Unknown')}")
        print(f"💼 Role: {personal.get('title', 'Unknown')}")
        print(f"📍 Location: {personal.get('location', 'Unknown')}")
        print()
    
    # Setup clients
    groq_client = setup_groq_client()
    if not groq_client:
        return
    
    # Check if user wants to force reload the database
    force_reload = os.getenv('FORCE_RELOAD', 'false').lower() == 'true'
    index = setup_vector_database(force_reload=force_reload)
    if not index:
        return
    
    print("✅ Your Digital Twin is ready!")
    print()
    
    # Interactive chat loop
    print("🤖 Chat with your AI Digital Twin!")
    print("Ask questions about your experience, skills, projects, or career goals.")
    print("Type 'exit' to quit.")
    print()
    
    print("💭 Try asking:")
    print("  - 'Tell me about your work experience at AUSBIZ Consulting'")
    print("  - 'What are your Python and AI/ML skills and proficiency levels?'")
    print("  - 'Describe your Food RAG project using the STAR format'")
    print("  - 'Tell me about your machine learning projects in regression and classification'")
    print("  - 'What machine learning models have you built and what were the outcomes?'")
    print("  - 'Describe your insurance premium pricing model project'")
    print("  - 'Tell me about your credit risk classification model with Random Forest'")
    print("  - 'What are your quantified achievements and measurable outcomes?'")
    print("  - 'Tell me about your Tableau dashboard portfolio'")
    print("  - 'What are your salary expectations and work authorization status?'")
    print("  - 'Describe your leadership experience and team coordination'")
    print()
    
    while True:
        question = input("You: ")
        if question.lower() in ["exit", "quit", "bye"]:
            print("👋 Thanks for chatting with your Digital Twin!")
            break
        
        if question.strip():
            # Check for special commands first
            special_response = handle_special_commands(question, profile_data)
            if special_response:
                print(f"🤖 Emmanuel's Digital Twin: {special_response}")
            else:
                # Regular RAG query
                answer = rag_query(index, groq_client, question, profile_data)
                print(f"🤖 Emmanuel's Digital Twin: {answer}")
            print()

if __name__ == "__main__":
    main()