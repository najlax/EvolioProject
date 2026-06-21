"""
seed_database.py - Replace all sample data in the Evolio database with a clean,
professional dataset (10 students, 20 projects, 10 PDF CVs, 10 project images,
5 portfolio reviews).

Safe to run multiple times: it clears the relevant tables and old upload files
first, so repeated runs never create duplicates. It does NOT touch the schema,
models, routes, or auth logic.

Run from anywhere:
    python seed_database.py        (recommended: from the backend/ folder)

Uses the existing SQLAlchemy models, DB connection, password hashing, and the
existing upload/static-file directories.
"""

import hashlib
import json
import os
import sys
from datetime import datetime, timedelta

# --- Import bootstrap: make `from db... import ...` work from any CWD ---------
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy import text  # noqa: E402

from auth.auth import hash_password, verify_password  # noqa: E402
from db.models import (  # noqa: E402
    PortfolioReview,
    Project,
    ProjectImage,
    Resume,
    ShareLink,
    StudentProfile,
    User,
)
from db.session import SessionLocal, init_db  # noqa: E402
from storage import IMAGE_DIR, RESUME_DIR  # noqa: E402

STUDENT_PASSWORD = "12345678"


# =============================================================================
# Pure-Python PDF writer (no third-party dependencies)
# Produces a valid, text-selectable PDF using the standard Helvetica fonts.
# =============================================================================

PAGE_W, PAGE_H = 612, 792           # US Letter
MARGIN_L, MARGIN_R = 56, 56
MARGIN_T, MARGIN_B = 64, 56

NAVY = (0.118, 0.165, 0.314)        # headings / name
GRAY = (0.40, 0.40, 0.40)           # secondary text
RULE = (0.78, 0.80, 0.85)           # section rules


def _num(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def _pdf_escape(textval):
    # Encode to latin-1 (WinAnsi); replace anything unsupported.
    safe = textval.encode("latin-1", "replace").decode("latin-1")
    return safe.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _wrap(line, max_chars):
    words = line.split()
    if not words:
        return [""]
    out, cur = [], ""
    for w in words:
        while len(w) > max_chars:          # break absurdly long tokens
            if cur:
                out.append(cur)
                cur = ""
            out.append(w[:max_chars])
            w = w[max_chars:]
        if not cur:
            cur = w
        elif len(cur) + 1 + len(w) <= max_chars:
            cur += " " + w
        else:
            out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out


class PdfDoc:
    def __init__(self):
        self.pages = [[]]
        self.y = PAGE_H - MARGIN_T
        self.usable_w = PAGE_W - MARGIN_L - MARGIN_R

    def _new_page(self):
        self.pages.append([])
        self.y = PAGE_H - MARGIN_T

    def _ensure(self, needed):
        if self.y - needed < MARGIN_B:
            self._new_page()

    def gap(self, h):
        self.y -= h

    def text_block(self, body, font="F1", size=10.5, leading=None,
                   gap_before=0, indent=0, color=None):
        leading = leading or size * 1.38
        if gap_before:
            self.gap(gap_before)
        max_chars = max(1, int((self.usable_w - indent) / (size * 0.50)))
        for raw in body.split("\n"):
            for line in _wrap(raw, max_chars):
                self._ensure(leading)
                self.pages[-1].append(
                    ("text", MARGIN_L + indent, self.y, font, size, line, color)
                )
                self.y -= leading

    def section(self, title):
        self.gap(11)
        self._ensure(26)
        self.pages[-1].append(
            ("text", MARGIN_L, self.y, "F2", 12.5, title.upper(), NAVY)
        )
        self.y -= 6
        self.pages[-1].append(
            ("rule", MARGIN_L, self.y, PAGE_W - MARGIN_R, RULE)
        )
        self.y -= 13


def _render_stream(ops):
    out = []
    for op in ops:
        if op[0] == "text":
            _, x, y, font, size, body, color = op
            if color:
                out.append(f"{_num(color[0])} {_num(color[1])} {_num(color[2])} rg")
            out.append(
                f"BT /{font} {_num(size)} Tf {_num(x)} {_num(y)} Td "
                f"({_pdf_escape(body)}) Tj ET"
            )
            if color:
                out.append("0 0 0 rg")
        elif op[0] == "rule":
            _, x1, y, x2, color = op
            c = color or (0, 0, 0)
            out.append(
                f"{_num(c[0])} {_num(c[1])} {_num(c[2])} RG 0.8 w "
                f"{_num(x1)} {_num(y)} m {_num(x2)} {_num(y)} l S"
            )
    return "\n".join(out)


def build_pdf(doc):
    page_count = len(doc.pages)
    page_nums, content_nums = [], []
    n = 5
    for _ in range(page_count):
        page_nums.append(n)
        content_nums.append(n + 1)
        n += 2
    total = n - 1

    parts = {}
    parts[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
    kids = " ".join(f"{num} 0 R" for num in page_nums)
    parts[2] = f"<< /Type /Pages /Kids [{kids}] /Count {page_count} >>".encode()
    parts[3] = (b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica "
                b"/Encoding /WinAnsiEncoding >>")
    parts[4] = (b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold "
                b"/Encoding /WinAnsiEncoding >>")

    for i, ops in enumerate(doc.pages):
        stream = _render_stream(ops).encode("latin-1", "replace")
        parts[page_nums[i]] = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] "
            f"/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> "
            f"/Contents {content_nums[i]} 0 R >>"
        ).encode()
        parts[content_nums[i]] = (
            f"<< /Length {len(stream)} >>\nstream\n".encode()
            + stream + b"\nendstream"
        )

    out = b"%PDF-1.4\n"
    offsets = {}
    for num in range(1, total + 1):
        offsets[num] = len(out)
        out += f"{num} 0 obj\n".encode() + parts[num] + b"\nendobj\n"
    xref_pos = len(out)
    out += f"xref\n0 {total + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for num in range(1, total + 1):
        out += f"{offsets[num]:010d} 00000 n \n".encode()
    out += (f"trailer\n<< /Size {total + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_pos}\n%%EOF").encode()
    return out


def render_cv_pdf(student):
    """Build a professional, multi-section CV PDF for a student -> bytes."""
    doc = PdfDoc()

    # Header
    doc.text_block(student["full_name"], font="F2", size=23, leading=27, color=NAVY)
    doc.text_block(student["headline"], font="F1", size=11.5, leading=15, color=GRAY)
    contact = "   |   ".join([
        student["email"],
        student["location"],
        student["linkedin"],
        student["github"],
    ])
    doc.text_block(contact, font="F1", size=9, leading=13, gap_before=2, color=GRAY)
    doc.gap(4)
    doc.pages[-1].append(("rule", MARGIN_L, doc.y, PAGE_W - MARGIN_R, RULE))
    doc.gap(4)

    # Professional Summary
    doc.section("Professional Summary")
    doc.text_block(student["bio"], font="F1", size=10.5)

    # Education
    doc.section("Education")
    doc.text_block(student["education"], font="F1", size=10.5)
    doc.text_block(f"Field of specialization: {student['field']}",
                   font="F1", size=10, gap_before=2, color=GRAY)

    # Core Skills
    doc.section("Core Skills")
    doc.text_block(", ".join(student["skills"]), font="F1", size=10.5)

    # Tools & Technologies
    doc.section("Tools & Technologies")
    doc.text_block(", ".join(student["tools"]), font="F1", size=10.5)

    # Projects / Academic Project Experience
    doc.section("Projects & Academic Experience")
    for p in student["projects"]:
        doc.text_block(p["title"], font="F2", size=10.8, gap_before=6, color=NAVY)
        meta = f"Role: {p['role']}   -   Duration: {p['duration']}"
        doc.text_block(meta, font="F1", size=9, color=GRAY)
        doc.text_block(p["description"], font="F1", size=10, gap_before=1)
        doc.text_block("Tech stack: " + ", ".join(p["tech_stack"]),
                       font="F1", size=9, gap_before=1, color=GRAY)
        doc.text_block("Outcome: " + p["results"], font="F1", size=9, color=GRAY)

    # Target Roles
    doc.section("Target Roles")
    doc.text_block(student["target_roles"], font="F1", size=10.5)

    # Achievements
    doc.section("Achievements")
    for a in student["achievements"]:
        doc.text_block("- " + a, font="F1", size=10.5, indent=8)

    # Portfolio Links
    doc.section("Portfolio & Links")
    doc.text_block(f"LinkedIn: {student['linkedin']}", font="F1", size=10.5)
    doc.text_block(f"GitHub / Portfolio: {student['github']}", font="F1", size=10.5)
    doc.text_block(f"Contact: {student['email']}", font="F1", size=10.5)

    return build_pdf(doc)


# =============================================================================
# SVG project-image writer (no dependencies; renders in <img> via /uploads)
# =============================================================================

def _xml_escape(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def render_cover_svg(title, field, color1, color2):
    lines = _wrap(title, 24)[:3]
    tspans = ""
    for i, ln in enumerate(lines):
        dy = 0 if i == 0 else 78
        tspans += (f"<tspan x='90' dy='{dy}'>{_xml_escape(ln)}</tspan>")
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' "
        "viewBox='0 0 1200 675'>"
        "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>"
        f"<stop offset='0' stop-color='{color1}'/>"
        f"<stop offset='1' stop-color='{color2}'/></linearGradient></defs>"
        "<rect width='1200' height='675' fill='url(#g)'/>"
        "<rect x='56' y='56' width='1088' height='563' rx='20' fill='none' "
        "stroke='#ffffff' stroke-opacity='0.28' stroke-width='2'/>"
        "<text x='90' y='150' font-family='Segoe UI, Arial, sans-serif' "
        "font-size='30' letter-spacing='3' fill='#ffffff' fill-opacity='0.85'>"
        f"{_xml_escape(field.upper())}</text>"
        "<text x='90' y='330' font-family='Segoe UI, Arial, sans-serif' "
        "font-size='66' font-weight='700' fill='#ffffff'>"
        f"{tspans}</text>"
        "<text x='90' y='600' font-family='Segoe UI, Arial, sans-serif' "
        "font-size='26' fill='#ffffff' fill-opacity='0.85'>Evolio Portfolio</text>"
        "</svg>"
    )


# =============================================================================
# Dataset
# =============================================================================

def _p(title, summary, description, tech, skills, role, duration, results,
       github, demo, featured=False, image=False):
    return {
        "title": title, "summary": summary, "description": description,
        "tech_stack": tech, "skills": skills, "role": role, "duration": duration,
        "results": results, "github_link": github, "demo_link": demo,
        "featured": featured, "image": image,
    }


STUDENTS = [
    {
        "slug": "omar-abdullah", "full_name": "Omar Abdullah",
        "email": "omar.abdullah@evolio.dev", "field": "Software Engineering",
        "headline": "Software Engineer | Backend & Full-Stack Developer",
        "bio": "Software engineer focused on designing reliable, well-tested "
               "backend services and clean full-stack applications. Comfortable "
               "owning a feature end to end, from API design and database "
               "modelling to deployment and monitoring.",
        "location": "Riyadh, Saudi Arabia",
        "skills": ["Python", "FastAPI", "REST APIs", "SQL", "Docker",
                   "Git", "Testing", "System Design"],
        "tools": ["FastAPI", "PostgreSQL", "Docker", "GitHub Actions",
                  "Postman", "VS Code"],
        "target_roles": "Backend Engineer, Full-Stack Developer, Software Engineer",
        "linkedin": "https://linkedin.com/in/omar-abdullah",
        "github": "https://github.com/omar-abdullah",
        "education": "B.Sc. in Software Engineering, King Saud University (2021-2025).",
        "achievements": [
            "Led a 4-person capstone team to deliver a production-ready API.",
            "Reduced API response times by 40% through query optimization.",
            "Graduated with First-Class Honours in Software Engineering.",
        ],
        "color": ("#2563eb", "#1e3a8a"),
        "review": None,
        "projects": [
            _p("Task Management API",
               "Scalable REST API for team task tracking.",
               "Designed and built a multi-tenant task management REST API with "
               "JWT authentication, role-based access, and full CRUD for projects, "
               "tasks, and comments. Includes pagination, filtering, and automated "
               "tests covering core flows.",
               ["Python", "FastAPI", "PostgreSQL", "JWT", "Pytest", "Docker"],
               ["API Design", "Authentication", "Testing"],
               "Lead Backend Developer", "3 months",
               "Reached 95% test coverage and handled 500+ concurrent requests "
               "in load testing.",
               "https://github.com/omar-abdullah/task-management-api",
               "https://tasks.omar-demo.dev", featured=True, image=True),
            _p("Student Portfolio Platform",
               "Full-stack platform for students to publish portfolios.",
               "Built a full-stack platform that lets students create profiles, "
               "showcase projects, upload resumes, and share public portfolio "
               "links. Implemented secure file uploads and a responsive React UI.",
               ["React", "FastAPI", "SQLite", "Tailwind CSS", "JWT"],
               ["Full-Stack", "File Uploads", "UI Integration"],
               "Full-Stack Developer", "4 months",
               "Adopted by 60+ students in a pilot program with positive feedback.",
               "https://github.com/omar-abdullah/portfolio-platform",
               "https://portfolio.omar-demo.dev"),
            _p("Appointment Booking System",
               "Booking and scheduling system with email reminders.",
               "Developed an appointment booking system supporting availability "
               "slots, conflict detection, and automated email reminders. Built a "
               "clean admin dashboard for managing bookings.",
               ["Python", "FastAPI", "PostgreSQL", "Celery", "React"],
               ["Scheduling Logic", "Background Jobs", "Dashboards"],
               "Backend Developer", "2 months",
               "Cut no-shows by 30% in a small-clinic trial through reminders.",
               "https://github.com/omar-abdullah/booking-system", ""),
        ],
    },
    {
        "slug": "mohammed-khaled", "full_name": "Mohammed Khaled",
        "email": "mohammed.khaled@evolio.dev", "field": "Data Science",
        "headline": "Data Scientist | Analytics & Machine Learning",
        "bio": "Data scientist who turns raw data into clear, actionable insight. "
               "Experienced in building analytics dashboards and predictive models, "
               "and communicating findings to non-technical stakeholders.",
        "location": "Jeddah, Saudi Arabia",
        "skills": ["Python", "Pandas", "scikit-learn", "SQL",
                   "Data Visualization", "Statistics", "Power BI"],
        "tools": ["Jupyter", "Pandas", "scikit-learn", "Power BI",
                  "PostgreSQL", "NumPy"],
        "target_roles": "Data Scientist, Data Analyst, Machine Learning Engineer",
        "linkedin": "https://linkedin.com/in/mohammed-khaled-ds",
        "github": "https://github.com/mohammed-khaled-ds",
        "education": "B.Sc. in Data Science, King Abdulaziz University (2021-2025).",
        "achievements": [
            "Built a forecasting model adopted by a campus retail club.",
            "Top-5 finalist in a regional data analytics hackathon.",
            "Completed 6 verified certificates in ML and statistics.",
        ],
        "color": ("#0891b2", "#0e7490"),
        "review": None,
        "projects": [
            _p("Campaign Analytics Dashboard",
               "Interactive dashboard for marketing campaign performance.",
               "Built an analytics dashboard that consolidates marketing campaign "
               "data, computes ROI and conversion metrics, and visualizes trends "
               "with interactive filters. Automated the weekly data refresh.",
               ["Python", "Pandas", "Power BI", "SQL", "Plotly"],
               ["Data Analysis", "Visualization", "ETL"],
               "Data Scientist", "3 months",
               "Helped reallocate budget toward channels with 25% higher ROI.",
               "https://github.com/mohammed-khaled-ds/campaign-analytics",
               "https://analytics.mk-demo.dev", featured=True, image=True),
        ],
    },
    {
        "slug": "abdulaziz", "full_name": "Abdulaziz",
        "email": "abdulaziz@evolio.dev", "field": "Cybersecurity",
        "headline": "Cybersecurity Analyst | Application & Network Security",
        "bio": "Security-minded engineer focused on finding and fixing "
               "vulnerabilities before attackers do. Hands-on with vulnerability "
               "scanning, secure coding practices, and security awareness training.",
        "location": "Dammam, Saudi Arabia",
        "skills": ["Network Security", "Python", "Penetration Testing",
                   "Linux", "OWASP", "Threat Analysis"],
        "tools": ["Nmap", "Burp Suite", "Wireshark", "Metasploit",
                  "Python", "Kali Linux"],
        "target_roles": "Security Analyst, Penetration Tester, SOC Analyst",
        "linkedin": "https://linkedin.com/in/abdulaziz-sec",
        "github": "https://github.com/abdulaziz-sec",
        "education": "B.Sc. in Cybersecurity, KFUPM (2021-2025).",
        "achievements": [
            "Reported 3 valid vulnerabilities through a university bug program.",
            "Built a phishing-awareness program used in a 200-person workshop.",
            "Holds an entry-level security certification.",
        ],
        "color": ("#dc2626", "#7f1d1d"),
        "review": {
            "status": "Needs Revision",
            "comment": "Strong technical projects and clear security focus. Please "
                       "add measurable outcomes to the vulnerability scanner entry "
                       "and tighten the professional summary to two sentences. Add a "
                       "link to a sanitized report sample before resubmitting.",
        },
        "projects": [
            _p("Vulnerability Scanner",
               "Automated scanner for common web vulnerabilities.",
               "Developed a Python-based scanner that detects common web "
               "vulnerabilities such as outdated headers, open ports, and basic "
               "injection points, producing a prioritized, human-readable report.",
               ["Python", "Nmap", "Requests", "SQLite", "Linux"],
               ["Vulnerability Assessment", "Automation", "Reporting"],
               "Security Engineer", "3 months",
               "Surfaced 12 misconfigurations across test environments.",
               "https://github.com/abdulaziz-sec/vuln-scanner", "",
               featured=True, image=True),
            _p("Phishing Awareness Platform",
               "Simulated phishing and training platform.",
               "Built a platform to run controlled phishing simulations and track "
               "click rates, then deliver targeted micro-training to users who fall "
               "for simulated attacks.",
               ["Python", "Flask", "PostgreSQL", "Bootstrap"],
               ["Security Awareness", "Web Development", "Metrics"],
               "Full-Stack Security Developer", "2 months",
               "Reduced simulated-phishing click rate from 34% to 11%.",
               "https://github.com/abdulaziz-sec/phish-aware", ""),
        ],
    },
    {
        "slug": "khaled-ahmed", "full_name": "Khaled Ahmed",
        "email": "khaled.ahmed@evolio.dev", "field": "Information Systems",
        "headline": "Information Systems Analyst | Process & Workflow Automation",
        "bio": "Information systems specialist bridging business needs and "
               "technical solutions. Experienced in building information systems "
               "and automating manual workflows to improve efficiency.",
        "location": "Riyadh, Saudi Arabia",
        "skills": ["SQL", "Business Analysis", "Python", "Process Automation",
                   "Databases", "Requirements Gathering"],
        "tools": ["MySQL", "Power Automate", "Django", "Excel",
                  "Lucidchart", "Jira"],
        "target_roles": "Systems Analyst, Business Analyst, IS Developer",
        "linkedin": "https://linkedin.com/in/khaled-ahmed-is",
        "github": "https://github.com/khaled-ahmed-is",
        "education": "B.Sc. in Information Systems, Imam University (2021-2025).",
        "achievements": [
            "Digitized a paper-based registration process for a student club.",
            "Built a workflow dashboard that saved ~10 staff hours per week.",
            "Led requirements workshops for a 3-department system.",
        ],
        "color": ("#7c3aed", "#5b21b6"),
        "review": {
            "status": "Ready",
            "comment": "Well-organized portfolio with a clear systems focus. The "
                       "Student Information System write-up is excellent. Portfolio "
                       "is ready to share with employers; consider adding one "
                       "screenshot to the automation dashboard project.",
        },
        "projects": [
            _p("Student Information System",
               "Centralized system for student records and enrollment.",
               "Designed and built a student information system handling "
               "enrollment, grades, and course registration with role-based access "
               "for students, instructors, and admins.",
               ["Django", "MySQL", "Bootstrap", "Python"],
               ["Systems Analysis", "Database Design", "Web Development"],
               "Systems Analyst & Developer", "4 months",
               "Replaced spreadsheets for 300+ student records.",
               "https://github.com/khaled-ahmed-is/student-info-system",
               "https://sis.khaled-demo.dev", featured=True, image=True),
            _p("Workflow Automation Dashboard",
               "Dashboard to track and automate approval workflows.",
               "Built a dashboard that models multi-step approval workflows, sends "
               "notifications, and reports on bottlenecks, replacing email-based "
               "approvals.",
               ["Python", "Django", "PostgreSQL", "Chart.js"],
               ["Process Automation", "Dashboards", "Reporting"],
               "IS Developer", "2 months",
               "Cut average approval time from 3 days to under 1 day.",
               "https://github.com/khaled-ahmed-is/workflow-dashboard", ""),
        ],
    },
    {
        "slug": "ibrahim-jameel", "full_name": "Ibrahim Jameel",
        "email": "ibrahim.jameel@evolio.dev", "field": "Computer Engineering",
        "headline": "Computer Engineer | Embedded Systems & IoT",
        "bio": "Computer engineer passionate about connecting hardware and "
               "software. Builds embedded and IoT systems with real-time "
               "monitoring dashboards and reliable firmware.",
        "location": "Khobar, Saudi Arabia",
        "skills": ["C", "C++", "Embedded Systems", "IoT", "Python",
                   "Microcontrollers", "RTOS"],
        "tools": ["Arduino", "Raspberry Pi", "ESP32", "PlatformIO",
                  "MQTT", "Grafana"],
        "target_roles": "Embedded Engineer, IoT Developer, Firmware Engineer",
        "linkedin": "https://linkedin.com/in/ibrahim-jameel-ce",
        "github": "https://github.com/ibrahim-jameel-ce",
        "education": "B.Sc. in Computer Engineering, KFUPM (2021-2025).",
        "achievements": [
            "Won 2nd place in a university IoT design competition.",
            "Built a low-cost air-quality monitor used in a campus lab.",
            "Published an open-source firmware library with 40+ stars.",
        ],
        "color": ("#059669", "#065f46"),
        "review": None,
        "projects": [
            _p("IoT Device Monitoring System",
               "Real-time monitoring for distributed IoT sensors.",
               "Built an IoT monitoring system that collects sensor data over MQTT, "
               "stores time-series readings, and visualizes them on a live "
               "dashboard with alerting thresholds.",
               ["ESP32", "MQTT", "Python", "InfluxDB", "Grafana"],
               ["Embedded Systems", "IoT", "Telemetry"],
               "Embedded Engineer", "3 months",
               "Monitored 15 sensor nodes with sub-second update latency.",
               "https://github.com/ibrahim-jameel-ce/iot-monitor",
               "https://iot.ibrahim-demo.dev", featured=True, image=True),
            _p("Hardware Monitoring App",
               "Desktop app for real-time hardware health.",
               "Developed a cross-platform app that reads temperature, CPU, and "
               "voltage data from a microcontroller and displays it with historical "
               "graphs and warnings.",
               ["C++", "Python", "Qt", "Arduino", "Serial"],
               ["Firmware", "Desktop UI", "Data Acquisition"],
               "Computer Engineer", "2 months",
               "Detected thermal issues 5x faster than manual checks.",
               "https://github.com/ibrahim-jameel-ce/hw-monitor", ""),
        ],
    },
    {
        "slug": "fatima", "full_name": "Fatima",
        "email": "fatima@evolio.dev", "field": "UI/UX Engineering",
        "headline": "UI/UX Engineer | Design Systems & Usability",
        "bio": "UI/UX engineer who designs and builds accessible, user-centered "
               "interfaces. Comfortable across the full design process: research, "
               "wireframes, prototypes, and front-end implementation.",
        "location": "Riyadh, Saudi Arabia",
        "skills": ["UI Design", "UX Research", "Figma", "React",
                   "Accessibility", "Prototyping", "Design Systems"],
        "tools": ["Figma", "React", "Tailwind CSS", "Storybook",
                  "Maze", "Adobe XD"],
        "target_roles": "UI/UX Engineer, Product Designer, Front-End Developer",
        "linkedin": "https://linkedin.com/in/fatima-uiux",
        "github": "https://github.com/fatima-uiux",
        "education": "B.Sc. in UI/UX Engineering, Effat University (2021-2025).",
        "achievements": [
            "Designed a design system adopted across 3 student projects.",
            "Improved task success rate by 22% in a usability study.",
            "Speaker at a campus design meetup on accessibility.",
        ],
        "color": ("#db2777", "#9d174d"),
        "review": None,
        "projects": [
            _p("Design System Dashboard",
               "Reusable component library and documentation site.",
               "Created a design system with reusable, accessible React components, "
               "design tokens, and live documentation, enabling consistent UI across "
               "multiple products.",
               ["React", "Storybook", "Tailwind CSS", "Figma"],
               ["Design Systems", "Component Architecture", "Accessibility"],
               "UI/UX Engineer", "3 months",
               "Cut new-screen build time by ~35% through reuse.",
               "https://github.com/fatima-uiux/design-system",
               "https://design.fatima-demo.dev", featured=True, image=True),
            _p("Usability Testing Platform",
               "Tool for running and analyzing usability tests.",
               "Built a platform to script usability tasks, record completion and "
               "time-on-task, and visualize results, helping teams make evidence-based "
               "design decisions.",
               ["React", "Node.js", "MongoDB", "Figma"],
               ["UX Research", "Data Visualization", "Front-End"],
               "Product Designer & Developer", "2 months",
               "Used to run 8 studies informing a redesign.",
               "https://github.com/fatima-uiux/usability-platform", ""),
        ],
    },
    {
        "slug": "zainab-alahmad", "full_name": "Zainab Al-Ahmad",
        "email": "zainab.alahmad@evolio.dev", "field": "Information Technology",
        "headline": "IT Specialist | Support Systems & Infrastructure",
        "bio": "IT specialist focused on keeping systems and people running "
               "smoothly. Experienced in building helpdesk and asset-management "
               "tools and supporting end users.",
        "location": "Medina, Saudi Arabia",
        "skills": ["IT Support", "Networking", "SQL", "Python",
                   "System Administration", "Troubleshooting"],
        "tools": ["Windows Server", "Active Directory", "MySQL",
                  "PowerShell", "Django", "Zabbix"],
        "target_roles": "IT Specialist, Systems Administrator, IT Support Engineer",
        "linkedin": "https://linkedin.com/in/zainab-alahmad-it",
        "github": "https://github.com/zainab-alahmad-it",
        "education": "B.Sc. in Information Technology, Taibah University (2021-2025).",
        "achievements": [
            "Built a helpdesk system used by a 40-person department.",
            "Automated asset tracking, eliminating a monthly manual audit.",
            "Maintained 99% uptime for a lab server during final year.",
        ],
        "color": ("#ea580c", "#9a3412"),
        "review": None,
        "projects": [
            _p("IT Helpdesk System",
               "Ticketing system for IT support requests.",
               "Built an IT helpdesk system with ticket creation, prioritization, "
               "assignment, and SLA tracking, plus a knowledge base for common "
               "issues.",
               ["Django", "MySQL", "Bootstrap", "Python"],
               ["Ticketing", "Web Development", "Support Workflows"],
               "IT Developer", "3 months",
               "Centralized 500+ tickets and cut response time by 40%.",
               "https://github.com/zainab-alahmad-it/it-helpdesk",
               "https://helpdesk.zainab-demo.dev", featured=True, image=True),
            _p("Asset Management Dashboard",
               "Dashboard to track IT hardware and licenses.",
               "Developed a dashboard to track hardware assets, software licenses, "
               "and assignments, with expiry alerts and exportable reports.",
               ["Python", "Flask", "PostgreSQL", "Chart.js"],
               ["Asset Tracking", "Dashboards", "Reporting"],
               "IT Specialist", "2 months",
               "Tracked 250+ assets and flagged 18 expiring licenses.",
               "https://github.com/zainab-alahmad-it/asset-dashboard", ""),
        ],
    },
    {
        "slug": "arwa-mohammed", "full_name": "Arwa Mohammed",
        "email": "arwa.mohammed@evolio.dev", "field": "Information Technology",
        "headline": "IT Engineer | Networks & Service Management",
        "bio": "IT engineer with a focus on network support and service "
               "management. Builds practical tools that streamline support "
               "operations and improve user experience.",
        "location": "Riyadh, Saudi Arabia",
        "skills": ["Networking", "IT Service Management", "Python", "SQL",
                   "Linux", "Cloud Basics"],
        "tools": ["Cisco Packet Tracer", "Linux", "MySQL", "Django",
                  "Docker", "Grafana"],
        "target_roles": "Network Support Engineer, IT Engineer, Cloud Support",
        "linkedin": "https://linkedin.com/in/arwa-mohammed-it",
        "github": "https://github.com/arwa-mohammed-it",
        "education": "B.Sc. in Information Technology, Princess Nourah University "
                     "(2021-2025).",
        "achievements": [
            "Designed a campus network topology for a final-year project.",
            "Built a ticketing platform piloted by a support team.",
            "Completed a cloud fundamentals certification.",
        ],
        "color": ("#0d9488", "#115e59"),
        "review": {
            "status": "Published",
            "comment": "Excellent, employer-ready portfolio. Projects are clearly "
                       "described with strong outcomes and a consistent IT support "
                       "theme. Published to the public portfolio gallery. Great work "
                       "tying networking concepts to real tools.",
        },
        "projects": [
            _p("Network Support Ticketing Platform",
               "Ticketing platform tailored for network support teams.",
               "Built a ticketing platform for network support, with categorized "
               "queues, escalation rules, and dashboards showing resolution times "
               "per category.",
               ["Django", "PostgreSQL", "Bootstrap", "Docker"],
               ["Networking", "Service Management", "Dashboards"],
               "IT Engineer", "3 months",
               "Improved first-response time by 45% in a pilot.",
               "https://github.com/arwa-mohammed-it/net-ticketing",
               "https://tickets.arwa-demo.dev", featured=True, image=True),
            _p("Network Monitoring Dashboard",
               "Live dashboard for network device health.",
               "Developed a monitoring dashboard that polls network devices, tracks "
               "uptime and latency, and raises alerts when thresholds are crossed.",
               ["Python", "SNMP", "Grafana", "InfluxDB"],
               ["Network Monitoring", "Telemetry", "Alerting"],
               "Network Support Engineer", "2 months",
               "Detected outages an average of 8 minutes earlier.",
               "https://github.com/arwa-mohammed-it/net-monitor", ""),
        ],
    },
    {
        "slug": "ghadir-abdullah", "full_name": "Ghadir Abdullah",
        "email": "ghadir.abdullah@evolio.dev", "field": "Computer Engineering",
        "headline": "Computer Engineer | Embedded Dashboards & Signal Processing",
        "bio": "Computer engineer who enjoys building embedded systems with "
               "meaningful dashboards. Combines low-level hardware work with clean "
               "data visualization for monitoring and control.",
        "location": "Jeddah, Saudi Arabia",
        "skills": ["C", "Embedded Systems", "Python", "Signal Processing",
                   "PCB Basics", "Data Visualization"],
        "tools": ["STM32", "Arduino", "Python", "MATLAB",
                  "PlatformIO", "Grafana"],
        "target_roles": "Embedded Engineer, Hardware Engineer, Systems Engineer",
        "linkedin": "https://linkedin.com/in/ghadir-abdullah-ce",
        "github": "https://github.com/ghadir-abdullah-ce",
        "education": "B.Sc. in Computer Engineering, King Abdulaziz University "
                     "(2021-2025).",
        "achievements": [
            "Built an embedded dashboard demoed at a senior project expo.",
            "Optimized firmware to halve power consumption on a sensor node.",
            "Mentored two juniors in embedded C programming.",
        ],
        "color": ("#4f46e5", "#3730a3"),
        "review": {
            "status": "Ready",
            "comment": "Solid engineering portfolio with strong embedded projects. "
                       "Add a short architecture diagram to the embedded dashboard "
                       "and quantify the hardware monitoring results. Otherwise ready "
                       "to share with hardware-focused employers.",
        },
        "projects": [
            _p("Embedded Systems Dashboard",
               "Dashboard visualizing embedded sensor telemetry.",
               "Built an embedded dashboard that streams telemetry from an STM32 "
               "board, processes signals on-device, and visualizes live and "
               "historical data with configurable alerts.",
               ["STM32", "C", "Python", "Grafana", "UART"],
               ["Embedded Systems", "Signal Processing", "Dashboards"],
               "Embedded Engineer", "3 months",
               "Streamed 6 channels at 100 Hz with stable real-time plots.",
               "https://github.com/ghadir-abdullah-ce/embedded-dashboard",
               "https://embed.ghadir-demo.dev", featured=True, image=True),
            _p("Hardware Monitoring App",
               "Companion app for monitoring board health.",
               "Developed a companion app that logs voltage, current, and "
               "temperature from a custom board and surfaces anomalies through a "
               "clean, color-coded interface.",
               ["Python", "C", "Qt", "SQLite"],
               ["Firmware", "Monitoring", "Desktop UI"],
               "Computer Engineer", "2 months",
               "Caught 4 hardware faults during stress testing.",
               "https://github.com/ghadir-abdullah-ce/hw-monitor-app", ""),
        ],
    },
    {
        "slug": "sarah-faisal", "full_name": "Sarah Faisal",
        "email": "sarah.faisal@evolio.dev", "field": "Computer Science",
        "headline": "Computer Scientist | Full-Stack & AI Applications",
        "bio": "Computer scientist who builds full-stack applications and "
               "applied-AI features. Enjoys taking an idea from prototype to a "
               "polished, deployed product with a strong focus on code quality.",
        "location": "Riyadh, Saudi Arabia",
        "skills": ["Python", "JavaScript", "React", "Machine Learning",
                   "Algorithms", "REST APIs", "SQL"],
        "tools": ["React", "FastAPI", "PyTorch", "PostgreSQL",
                  "Docker", "Git"],
        "target_roles": "Software Engineer, Full-Stack Developer, ML Engineer",
        "linkedin": "https://linkedin.com/in/sarah-faisal-cs",
        "github": "https://github.com/sarah-faisal-cs",
        "education": "B.Sc. in Computer Science, King Saud University (2021-2025).",
        "achievements": [
            "Built a recommendation engine featured in a capstone showcase.",
            "Solved 300+ algorithmic problems on competitive platforms.",
            "Interned as a software engineer building production features.",
        ],
        "color": ("#2563eb", "#1d4ed8"),
        "review": {
            "status": "Needs Revision",
            "comment": "Impressive technical range across full-stack and AI. Please "
                       "split the recommendation system description into problem, "
                       "approach, and impact, and add the dataset size and accuracy "
                       "metric. Then it will be ready to publish.",
        },
        "projects": [
            _p("AI Project Recommendation System",
               "Recommends projects to students using ML.",
               "Built a recommendation system that suggests relevant projects to "
               "students based on their skills and interests, using collaborative "
               "filtering and content-based features served through a REST API.",
               ["Python", "FastAPI", "PyTorch", "PostgreSQL", "React"],
               ["Machine Learning", "Recommender Systems", "Full-Stack"],
               "ML & Full-Stack Engineer", "4 months",
               "Achieved 0.82 precision@5 on held-out interaction data.",
               "https://github.com/sarah-faisal-cs/project-recommender",
               "https://recommend.sarah-demo.dev", featured=True, image=True),
            _p("Full-Stack Web App",
               "End-to-end web application with auth and dashboards.",
               "Developed a full-stack web application with secure authentication, "
               "a REST API, and an interactive dashboard, deployed with Docker and "
               "CI/CD.",
               ["React", "FastAPI", "PostgreSQL", "Docker", "GitHub Actions"],
               ["Full-Stack", "DevOps", "API Design"],
               "Full-Stack Developer", "3 months",
               "Deployed with automated CI/CD and zero-downtime releases.",
               "https://github.com/sarah-faisal-cs/fullstack-app", ""),
        ],
    },
]


# =============================================================================
# Seeding logic
# =============================================================================

def _token_for(slug):
    return hashlib.sha1(("evolio-share-" + slug).encode()).hexdigest()[:20]


def clear_upload_dir(folder):
    removed = 0
    if not os.path.isdir(folder):
        os.makedirs(folder, exist_ok=True)
        return 0
    for name in os.listdir(folder):
        if name == ".gitkeep":
            continue
        path = os.path.join(folder, name)
        if os.path.isfile(path):
            try:
                os.remove(path)
                removed += 1
            except OSError:
                pass
    return removed


def clear_data(db):
    cleared = {}
    for model in (ProjectImage, Project, Resume, ShareLink,
                  PortfolioReview, StudentProfile, User):
        cleared[model.__tablename__] = db.query(model).delete(
            synchronize_session=False
        )
    db.commit()
    # Reset autoincrement counters if the sqlite_sequence table exists.
    try:
        db.execute(text("DELETE FROM sqlite_sequence"))
        db.commit()
    except Exception:
        db.rollback()
    files_resumes = clear_upload_dir(RESUME_DIR)
    files_images = clear_upload_dir(IMAGE_DIR)
    return cleared, files_resumes, files_images


def seed(db):
    now = datetime.utcnow()
    pw_hash = hash_password(STUDENT_PASSWORD)

    counts = {"users": 0, "profiles": 0, "resumes": 0, "projects": 0,
              "images": 0, "share_links": 0, "reviews": 0}

    for s in STUDENTS:
        # User
        user = User(
            email=s["email"],
            password_hash=pw_hash,
            full_name=s["full_name"],
            role="student",
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        db.flush()  # assign user.id
        counts["users"] += 1

        # Profile
        profile = StudentProfile(
            user_id=user.id,
            headline=s["headline"],
            bio=s["bio"],
            location=s["location"],
            target_roles=s["target_roles"],
            contact_email=s["email"],
            avatar_color=s["color"][0],
            availability="Open to work",
            skills_json=json.dumps(s["skills"]),
            github=s["github"],
            linkedin=s["linkedin"],
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
        counts["profiles"] += 1

        # Resume PDF
        pdf_bytes = render_cv_pdf(s)
        stored = f"{s['slug']}-cv.pdf"
        path = os.path.join(RESUME_DIR, stored)
        with open(path, "wb") as f:
            f.write(pdf_bytes)
        resume = Resume(
            user_id=user.id,
            original_name=f"{s['full_name']} - CV.pdf",
            stored_name=stored,
            file_path=path,
            content_type="pdf",
            size_bytes=len(pdf_bytes),
            uploaded_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(resume)
        counts["resumes"] += 1

        # Projects (+ one cover image on the featured project)
        for order, p in enumerate(s["projects"]):
            project = Project(
                user_id=user.id,
                title=p["title"],
                summary=p["summary"],
                description=p["description"],
                content=p["description"],
                role=p["role"],
                duration=p["duration"],
                github_link=p["github_link"],
                demo_link=p["demo_link"],
                results=p["results"],
                status="Published",
                tech_stack_json=json.dumps(p["tech_stack"]),
                skills_json=json.dumps(p["skills"]),
                collaborators_json=json.dumps([]),
                is_featured=bool(p["featured"]),
                sort_order=order,
                created_at=now,
                updated_at=now,
            )
            db.add(project)
            db.flush()  # assign project.id
            counts["projects"] += 1

            if p["image"]:
                svg = render_cover_svg(
                    p["title"], s["field"], s["color"][0], s["color"][1]
                )
                img_stored = f"{s['slug']}-cover.svg"
                img_path = os.path.join(IMAGE_DIR, img_stored)
                with open(img_path, "w", encoding="utf-8") as f:
                    f.write(svg)
                image = ProjectImage(
                    project_id=project.id,
                    original_name=img_stored,
                    stored_name=img_stored,
                    file_path=img_path,
                    content_type="svg",
                    size_bytes=len(svg.encode("utf-8")),
                    caption=p["title"],
                    created_at=now,
                )
                db.add(image)
                counts["images"] += 1

        # Share link (public portfolio)
        share = ShareLink(
            user_id=user.id,
            token=_token_for(s["slug"]),
            visibility="public",
            is_active=True,
            expires_at=None,
            created_at=now,
            updated_at=now,
        )
        db.add(share)
        counts["share_links"] += 1

        # Portfolio review (only for the 5 selected students)
        if s["review"]:
            r = s["review"]
            feedback = [{
                "reviewer": "Career Coach",
                "status": r["status"],
                "comment": r["comment"],
                "date": (now - timedelta(days=2)).isoformat(),
            }]
            review = PortfolioReview(
                user_id=user.id,
                status=r["status"],
                feedback=json.dumps(feedback),
                submitted_at=now - timedelta(days=3),
                reviewed_at=now - timedelta(days=2),
                created_at=now - timedelta(days=3),
                updated_at=now - timedelta(days=2),
            )
            db.add(review)
            counts["reviews"] += 1

    db.commit()
    return counts


# =============================================================================
# Validation + report
# =============================================================================

def validate(db):
    problems = []

    n_users = db.query(User).count()
    n_projects = db.query(Project).count()
    n_resumes = db.query(Resume).count()
    n_images = db.query(ProjectImage).count()
    n_reviews = db.query(PortfolioReview).count()

    expected = {"students": (n_users, 10), "projects": (n_projects, 20),
                "resumes": (n_resumes, 10), "images": (n_images, 10),
                "reviews": (n_reviews, 5)}
    for label, (got, want) in expected.items():
        if got != want:
            problems.append(f"Expected {want} {label}, found {got}.")

    # Every student can log in and has a resume.
    for user in db.query(User).all():
        if not verify_password(STUDENT_PASSWORD, user.password_hash):
            problems.append(f"Login failed for {user.email}.")
        resume = db.query(Resume).filter_by(user_id=user.id).first()
        if resume is None:
            problems.append(f"No resume for {user.email}.")

    # All resume + image files exist on disk.
    for resume in db.query(Resume).all():
        if not os.path.exists(resume.file_path):
            problems.append(f"Missing resume file: {resume.file_path}")
    for image in db.query(ProjectImage).all():
        if not os.path.exists(image.file_path):
            problems.append(f"Missing image file: {image.file_path}")

    # Projects + reviews connect to valid students.
    for project in db.query(Project).all():
        if db.get(User, project.user_id) is None:
            problems.append(f"Project '{project.title}' has no owner.")
    for review in db.query(PortfolioReview).all():
        if db.get(User, review.user_id) is None:
            problems.append("A review references a missing student.")

    return expected, problems


def main():
    init_db()
    db = SessionLocal()
    try:
        print("=" * 64)
        print("Evolio database seeding")
        print("=" * 64)

        cleared, f_resumes, f_images = clear_data(db)
        print("\nCleared tables (rows deleted):")
        for table, n in cleared.items():
            print(f"  - {table:<18} {n}")
        print(f"Deleted old upload files: {f_resumes} resume(s), "
              f"{f_images} image(s).")

        counts = seed(db)
        print("\nInserted records:")
        for table, n in counts.items():
            print(f"  - {table:<18} {n}")

        expected, problems = validate(db)
        print("\nValidation:")
        for label, (got, want) in expected.items():
            mark = "OK " if got == want else "!! "
            print(f"  [{mark}] {label:<10} {got}/{want}")

        print("\nTest logins (password: 12345678):")
        for s in STUDENTS:
            print(f"  - {s['email']}")

        print(f"\nResume PDFs:   {RESUME_DIR}")
        print(f"Project images: {IMAGE_DIR}")

        if problems:
            print("\nWARNINGS / ISSUES:")
            for p in problems:
                print(f"  - {p}")
            print("\nSeeding completed WITH WARNINGS.")
            return 1
        print("\nAll checks passed. Seeding completed successfully.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
