
// ---- Students ----
export const students = [
  {
    id: "s1",
    name: "Aisha Khan",
    headline: "Frontend Developer | React Enthusiast",
    bio: "Bootcamp grad who loves building clean, responsive UIs.",
    location: "Austin, TX",
    email: "aisha@example.com",
    availability: "Open to work",
    skills: ["React", "JavaScript", "Tailwind CSS", "HTML", "CSS"],
    github: "https://github.com/aisha",
    linkedin: "https://linkedin.com/in/aisha",
    profileCompletion: 85,
    portfolioViews: 240,
    avatarColor: "bg-[#001776]",
  },
  {
    id: "s2",
    name: "Marcus Lee",
    headline: "Full Stack Developer",
    bio: "I enjoy turning ideas into working web apps.",
    location: "Seattle, WA",
    email: "marcus@example.com",
    availability: "Interviewing",
    skills: ["Node.js", "React", "MongoDB", "Express"],
    github: "https://github.com/marcus",
    linkedin: "https://linkedin.com/in/marcus",
    profileCompletion: 60,
    portfolioViews: 130,
    avatarColor: "bg-[#199DB2]",
  },
  {
    id: "s3",
    name: "Priya Patel",
    headline: "Junior Software Engineer",
    bio: "Career switcher passionate about clean code.",
    location: "Remote",
    email: "priya@example.com",
    availability: "Not looking",
    skills: ["Python", "Django", "SQL"],
    github: "https://github.com/priya",
    linkedin: "https://linkedin.com/in/priya",
    profileCompletion: 40,
    portfolioViews: 75,
    avatarColor: "bg-[#3199CC]",
  },
];

// ---- Employers ----
export const employers = [
  {
    id: "e1",
    name: "Jordan Smith",
    company: "TechNova",
    email: "jordan@technova.com",
    status: "Approved",
    openRoles: 3,
    candidatesViewed: 18,
  },
  {
    id: "e2",
    name: "Dana White",
    company: "CloudWorks",
    email: "dana@cloudworks.com",
    status: "Pending",
    openRoles: 1,
    candidatesViewed: 5,
  },
];

// ---- Career Coaches ----
export const coaches = [
  {
    id: "c1",
    name: "Sara Johnson",
    email: "sara@evolio.com",
    assignedStudents: 12,
    reviewsCompleted: 47,
    rating: 4.8,
  },
  {
    id: "c2",
    name: "Tom Nguyen",
    email: "tom@evolio.com",
    assignedStudents: 8,
    reviewsCompleted: 30,
    rating: 4.5,
  },
];

// ---- Admin Users ----
export const admins = [
  {
    id: "a1",
    name: "Admin User",
    email: "admin@evolio.com",
    role: "Super Admin",
  },
];

// ---- Projects ----
function shot(label, bg) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='750'>` +
    `<rect width='100%' height='100%' fill='${bg}'/>` +
    `<text x='50%' y='50%' font-family='Arial, sans-serif' font-size='52' fill='white' ` +
    `font-weight='bold' text-anchor='middle' dominant-baseline='middle'>${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const projects = [
  {
    id: "p1",
    studentId: "s1",
    title: "Weather Dashboard",
    category: "Web Application",
    completionDate: "March 2026",
    summary: "A clean weather app using a public API.",
    description:
      "A responsive weather dashboard built with React.\n\nIt shows the current conditions and a 5-day forecast for any city, pulling live data from a public weather API. The focus was on clean, reusable components and a layout that works well on both mobile and desktop.",
    techStack: ["React", "CSS", "API"],
    github: "https://github.com/aisha/weather",
    demo: "https://weather.example.com",
    status: "Published",
    featured: true,
    views: 120,
    collaborators: ["Marcus Lee"],
    role: "Frontend Developer",
    projectType: "Personal Project",
    stage: "Completed", 
    teamSize: 2,
    screenshots: [
      shot("Weather Dashboard — Home", "#001776"),
      shot("5-Day Forecast", "#199DB2"),
      shot("Mobile View", "#3199CC"),
    ],
  },
  {
    id: "p2",
    studentId: "s1",
    title: "Recipe Finder",
    category: "Web Application",
    completionDate: "",
    summary: "Search recipes by ingredients you already have.",
    description:
      "A simple recipe search tool. Users type in the ingredients they already have at home and get a list of matching meals.\n\nReact state is used to filter the results instantly as you type.",
    techStack: ["React", "Tailwind CSS"],
    github: "https://github.com/aisha/recipes",
    demo: "",
    status: "Draft",
    featured: false,
    views: 35,
    collaborators: [],
    role: "", 
    projectType: "Personal Project",
    stage: "In Progress",
    teamSize: 1,
    screenshots: [
      shot("Recipe Finder — Search", "#199DB2"),
      shot("Results List", "#3199CC"),
    ],
  },
  {
    id: "p3",
    studentId: "s2",
    title: "Task Manager",
    category: "Full Stack Application",
    completionDate: "January 2026",
    summary: "A to-do app with categories and progress tracking.",
    description:
      "A full-stack task manager that lets users organise to-dos into categories and track their progress.\n\nThe frontend is built in React, backed by a Node.js API. This demo version runs on mock data.",
    techStack: ["React", "Node.js", "Express", "MongoDB"],
    github: "https://github.com/marcus/tasks",
    demo: "https://tasks.example.com",
    status: "Published",
    featured: true,
    views: 90,
    collaborators: ["Priya Patel"],
    role: "Full Stack Developer",
    projectType: "Academic Project",
    stage: "Completed",
    teamSize: 2,
    screenshots: [
      shot("Task Manager — Board", "#001776"),
      shot("Categories", "#199DB2"),
      shot("Progress Tracking", "#3199CC"),
    ],
  },
];

// ---- Resumes ----
export const resumes = [
  {
    id: "r1",
    studentId: "s1",
    fileName: "Aisha_Khan_Resume.pdf",
    uploadedDate: "2026-05-20",
    sizeKb: 240,
    downloads: 32,
  },
  {
    id: "r2",
    studentId: "s2",
    fileName: "Marcus_Lee_Resume.pdf",
    uploadedDate: "2026-04-11",
    sizeKb: 180,
    downloads: 14,
  },
];

// ---- Reviews ----
export const reviews = [
  {
    id: "rev1",
    studentId: "s1",
    reviewer: "Sara Johnson",
    status: "Needs Revision",
    date: "2026-05-22",
    comment: "Great projects! Please add a demo link to the Recipe Finder.",
  },
  {
    id: "rev2",
    studentId: "s1",
    reviewer: "Sara Johnson",
    status: "Draft",
    date: "2026-05-18",
    comment: "Initial portfolio submitted for review.",
  },
  {
    id: "rev3",
    studentId: "s2",
    reviewer: "Tom Nguyen",
    status: "Ready",
    date: "2026-04-30",
    comment: "Portfolio looks ready to publish. Nice work!",
  },
];

// ---- Analytics ----
export const analytics = {
  // Student-facing numbers
  student: {
    profileCompletion: 85,
    resumeStatus: "Uploaded",
    reviewStatus: "Needs Revision",
    projectCount: 2,
    portfolioViews: 240,
    projectViews: 155,
    resumeDownloads: 32,
    githubClicks: 64,
    demoClicks: 28,
  },

  admin: {
    totalUsers: 320,
    totalStudents: 250,
    totalEmployers: 45,
    totalCoaches: 25,
    publishedPortfolios: 180,
    userGrowth: "+12%",
    employerEngagement: "+8%",
    moderationAlerts: 3,
  },
};

// ---- Messages ----
export const messages = [
  {
    id: "m1",
    from: "employer",
    name: "Jordan Smith",
    text: "Hi Aisha! I really liked your Weather Dashboard project.",
    time: "10:30 AM",
  },
  {
    id: "m2",
    from: "student",
    name: "Aisha Khan",
    text: "Thank you! I'd love to hear about the role.",
    time: "10:45 AM",
  },
  {
    id: "m3",
    from: "employer",
    name: "Jordan Smith",
    text: "Are you available for a quick call this week?",
    time: "11:00 AM",
  },
];

export const outreachTemplates = [
  "Hi! We have an opening that matches your skills. Interested?",
  "Loved your portfolio! Can we schedule a quick chat?",
  "We're hiring junior developers. Would you like to apply?",
];

// ---- AI Feedback ----
export const aiFeedback = {
  resumeReview:
    "Your resume is well structured. Tip: add measurable results (e.g. 'improved load time by 30%') and keep it to one page.",
  portfolioScore: 82, 
  portfolioScoreText:
    "Strong portfolio! Add one more featured project and a short intro video to boost your score.",
  projectFeedback:
    "Good project summary. Suggestion: explain the problem it solves and add screenshots of the UI.",
  projectSummary:
    "A responsive React weather app that displays current conditions and a 5-day forecast using a public API.",
  skillGaps: [
    "Learn TypeScript for stronger React apps",
    "Practice writing unit tests (Jest)",
    "Add a backend project to show full-stack skills",
  ],
  careerRecommendations: [
    "Frontend Developer",
    "React Developer",
    "Junior Software Engineer",
  ],
  candidateBotAnswer:
    "This candidate has strong React and frontend skills, 2 published projects, and an uploaded resume. They appear ready for junior frontend roles.",
};

export const reportedContent = [
  {
    id: "rc1",
    type: "Portfolio",
    owner: "Marcus Lee",
    reason: "Possible copied project description",
    status: "Pending",
  },
  {
    id: "rc2",
    type: "Project",
    owner: "Priya Patel",
    reason: "Broken demo link reported by employer",
    status: "Pending",
  },
];
