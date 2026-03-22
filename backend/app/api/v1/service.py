


























































# from app.services.jd_parser.extractor import extract_jd_skills
# from app.services.gap_engine.gap_analyzer import analyze_gap
# from app.services.gap_engine.priority_engine import prioritize_skills
# from app.services.gap_engine.focus_generator import generate_focus
# from app.services.roadmap.generator import generate_roadmap

# def process_jd(resume, jd_text: str):
#             jd_skills = extract_jd_skills(jd_text)
#             gap = analyze_gap(resume.skills, jd_skills)
#             priority = prioritize_skills(gap, resume.skills)
#             focus = generate_focus(priority)
#             roadmap = generate_roadmap(priority)

#             return {
#                 "gap": gap,
#                 "priority": priority,
#                 "focus": focus,
#                 "roadmap": roadmap
#             }
#         # This file defines the main service function `process_jd` that takes a resume and a job description (JD) text as input. It extracts the required skills from the JD, analyzes the gap between the resume's skills and the JD's required skills, prioritizes the skills to focus on, generates a focus area, and creates a roadmap for skill development. The results are returned in a structured format.