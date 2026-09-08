export type Lang = "en" | "he";

export const LANGS: Lang[] = ["en", "he"];

/** Every user-visible string. Values are plain or functions when they interpolate. */
const en = {
  dir: "ltr" as "ltr" | "rtl",
  langName: "English",
  otherLangName: "עברית",
  productName: "CV → Job Match",

  heroTitle: "Find out what your CV is worth before a recruiter does.",
  heroBody:
    "Your CV comes back graded, with the exact lines to change. Then name the companies you want to work at: their real openings get pulled straight from the job boards they post on, and each one is scored against what your CV actually says.",
  privacy:
    "Everything stays in this browser. Your CV text, profile and results are kept in local storage and sent only to your own OpenAI key for analysis. LinkedIn blocks automated access, so each company links to its own board instead.",

  videoTitle: "How it works",
  videoHint: "86 seconds, sound on.",
  statScore: "CV score",
  statFixes: "Fixes to make",
  statFixesNone: "nothing urgent",
  statCompanies: "Companies",
  statOpenRoles: (n: number) => `${n} open roles`,
  statBest: "Best fit",
  statBestAt: (company: string) => `at ${company}`,
  statPending: "not scored yet",

  stepUpload: "Upload a CV",
  stepUploaded: "CV read",
  stepCompanies: "Add companies",
  stepCompaniesDone: (n: number) => `${n} companies`,
  stepScore: "Score my fit",
  stepScored: (n: number) => `${n} roles scored`,

  dropTitle: "Drop your CV here",
  dropBody:
    "Or click to choose a file. PDF only — your own CV, or LinkedIn’s “Save to PDF” export. Up to 12 MB.",
  reading: "Reading your CV",
  readingHint: "Extraction and review run together — usually 10 to 25 seconds.",
  replaceCv: "Replace CV",
  cvRead: "CV read",
  years: (n: number) => `${n} years`,
  uploadFailed: "Upload failed.",

  companiesTitle: "Where you want to work",
  companiesCount: (n: number) => `${n} of 15`,
  companiesPlaceholder: "Monday.com, Wix, Riskified",
  companyLabel: "Company name",
  add: "Add",
  addHint: "Press Enter to add one, or separate several with commas.",
  openBoard: "Open board",
  remove: (name: string) => `Remove ${name}`,
  findAndScore: "Find openings and score my fit",
  searching: "Searching and scoring",
  uploadFirst: "Upload your CV first.",
  openCount: (n: number) => `${n} open`,
  nothingFound: "nothing found",
  urlPrompt: "Paste this company's careers page or LinkedIn URL and we will read that instead:",
  urlPlaceholder: "example.com/careers or linkedin.com/company/example",
  urlSave: "Use this URL",
  urlSaved: (url: string) => `Reading from ${url}`,
  urlClear: "Remove URL",

  cvScoreLabel: "CV score out of 100",
  scoreOutOf: (n: number) => `${n} out of 100`,
  highPriority: (n: number) => `${n} high priority`,
  suggestions: (n: number) => `${n} suggestions`,
  missingSection: (s: string) => `no ${s}`,
  tabFixes: (n: number) => `Fixes ${n}`,
  tabRewrites: (n: number) => `Rewrites ${n}`,
  tabProfile: "What we read",
  tabUpgraded: "Upgraded CV",
  upgradeIntro:
    "Every fix above, applied to your own CV, then scored again so you can see what it earns. Facts stay as they are — where a number belongs but is not in your CV, you get a bracket to fill in.",
  upgradeCta: "Rewrite my CV",
  upgrading: "Rewriting your CV",
  upgradeAgain: "Improve it again",
  upgradeCopy: "Copy as text",
  upgradeDownload: "Download for Word",
  upgradeCopied: "Copied",
  upgradeChanges: "What changed",
  upgradeExperience: "Experience",
  upgradeScored: (n: number) => `scores ${n} as written`,
  upgradeNoBetter: "That pass scored no better, so your higher-scoring version is the one kept.",
  upgradeWas: (n: number) => `was ${n}`,
  upgradePlaceholders:
    "Fill every bracket with a real number before you send this anywhere. Unfilled brackets still read as missing impact, so filling them is the biggest lift left.",
  workingWell: "Working well",
  atsNotes: "How applicant tracking systems will read it",
  keywords: "Keywords to add, where they are true of you",
  noRewrites: "No bullet rewrites were suggested.",
  severity: { high: "high", medium: "medium", low: "low" },

  fieldName: "Name",
  fieldHeadline: "Headline",
  fieldLocation: "Location",
  fieldExperience: "Experience",
  fieldSkills: "Skills",
  fieldTools: "Tools",
  fieldTitles: "Past titles",
  fieldTargetRoles: "Target roles",
  fieldIndustries: "Industries",
  fieldLanguages: "Languages",
  experienceValue: (n: number, seniority: string) => `${n} years, ${seniority}`,

  rolesScored: (n: number) => `${n} roles scored`,
  companyRoles: (n: number) => `${n} roles`,
  bestFit: (n: number) => `best ${n}%`,
  visibleOf: (a: number, b: number) => `${a} of ${b}`,
  fitAtLeast: "Fit at least",
  allCompanies: "All companies",
  matchesEmptyTitle: "Your ranked roles land here",
  matchesEmptyBody:
    "Name the companies you want to work at and run the search. Every opening they have gets a fit score, best first.",
  linesUp: "Lines up with your CV",
  notInCv: "Not in your CV",
  nothingLinesUp: "Nothing lines up directly.",
  noGaps: "No obvious gaps.",
  heuristicOnly: "Ranked by keyword overlap only — no detailed analysis was run for this role.",
  whyThisScore: "Why this score",
  improveOdds: "Change this to improve your odds here",
  readPosting: "Read the posting",
  remote: "remote",
  fromSource: (s: string) => `from ${s}`,
  postedOn: (d: string) => `posted ${d}`,
  noneAbove: (n: number) => `Nothing at ${n}% fit or above. Lower the threshold to see more.`,

  fit: {
    strong: "strong fit",
    apply: "worth applying",
    stretch: "a stretch",
    poor: "poor fit",
  },
  seniorityFit: { under: "below your level", match: "level match", over: "above your level" },
  locationFit: (v: string) => `location ${v}`,
  locationFitValue: { good: "good", unclear: "unclear", poor: "poor" } as Record<string, string>,

  seniority: {
    intern: "intern",
    junior: "junior",
    mid: "mid",
    senior: "senior",
    staff: "staff",
    lead: "lead",
    manager: "manager",
    director: "director",
    executive: "executive",
  } as Record<string, string>,

  source: {
    greenhouse: "Greenhouse",
    lever: "Lever",
    ashby: "Ashby",
    smartrecruiters: "SmartRecruiters",
    recruitee: "Recruitee",
    workable: "Workable",
    "careers-page": "Careers page",
    none: "No board found",
    "linkedin-only": "LinkedIn only",
    error: "Search failed",
  } as Record<string, string>,

  noteNoBoard:
    "has no public job board we could read. Add its careers page or LinkedIn URL below and we will read that instead.",
  noteUnreadable:
    "has a careers page we found but could not read any openings from — often a JavaScript-only listing.",
  noteLinkedinOnly:
    "is on LinkedIn, which blocks automated reading. We used the page to find its job board and came up empty — open the LinkedIn jobs link, or paste the company's own careers URL instead.",

  errNoOpenings: "No openings could be read for those companies. The notes under each company say why.",
  errRateLimited: (minutes: number) =>
    `Too many requests from this connection. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  errSearch: "Job search failed.",
  errMatch: "Matching failed.",
  errGeneric: "Something went wrong.",
};

const he: typeof en = {
  dir: "rtl",
  langName: "עברית",
  otherLangName: "English",
  productName: "קורות חיים → התאמה למשרה",

  heroTitle: "גלו מה שווים קורות החיים שלכם, לפני שמגייס יגלה.",
  heroBody:
    "קורות החיים חוזרים עם ציון ועם השורות המדויקות שכדאי לשנות. אחר כך רשמו את החברות שבהן תרצו לעבוד: המשרות הפתוחות שלהן נשלפות ישירות מלוחות הדרושים שבהם הן מפרסמות, וכל משרה מקבלת ציון התאמה למה שכתוב אצלכם.",
  privacy:
    "הכול נשאר בדפדפן הזה. הטקסט של קורות החיים, הפרופיל והתוצאות נשמרים באחסון המקומי, ונשלחים לניתוח רק עם מפתח ה-API שלכם. לינקדאין חוסמת גישה אוטומטית, ולכן כל חברה מקושרת ללוח המשרות שלה.",

  videoTitle: "איך זה עובד",
  videoHint: "‏93 שניות, עם קול.",
  statScore: "ציון קורות החיים",
  statFixes: "תיקונים לביצוע",
  statFixesNone: "אין דחוף",
  statCompanies: "חברות",
  statOpenRoles: (n: number) => `${n} משרות פתוחות`,
  statBest: "ההתאמה הגבוהה",
  statBestAt: (company: string) => `ב-${company}`,
  statPending: "עוד לא דורגו",

  stepUpload: "העלו קורות חיים",
  stepUploaded: "קורות החיים נקראו",
  stepCompanies: "הוסיפו חברות",
  stepCompaniesDone: (n: number) => `${n} חברות`,
  stepScore: "חשבו את ההתאמה",
  stepScored: (n: number) => `${n} משרות דורגו`,

  dropTitle: "גררו לכאן את קורות החיים",
  dropBody:
    "או לחצו לבחירת קובץ. PDF בלבד — קורות החיים שלכם, או ייצוא ‏Save to PDF‏ מלינקדאין. עד 12 מ״ב.",
  reading: "קוראים את קורות החיים",
  readingHint: "החילוץ והביקורת רצים יחד — בדרך כלל 10 עד 25 שניות.",
  replaceCv: "החלפת קובץ",
  cvRead: "קורות החיים נקראו",
  years: (n: number) => `${n} שנות ניסיון`,
  uploadFailed: "ההעלאה נכשלה.",

  companiesTitle: "איפה תרצו לעבוד",
  companiesCount: (n: number) => `${n} מתוך 15`,
  companiesPlaceholder: "מאנדיי, וויקס, ריסקיפייד",
  companyLabel: "שם החברה",
  add: "הוספה",
  addHint: "הקישו Enter להוספה, או הפרידו בפסיקים כדי להוסיף כמה יחד.",
  openBoard: "פתחו את הלוח",
  remove: (name: string) => `הסרת ${name}`,
  findAndScore: "מצאו משרות וחשבו התאמה",
  searching: "מחפשים ומדרגים",
  uploadFirst: "העלו קודם את קורות החיים.",
  openCount: (n: number) => `${n} משרות פתוחות`,
  nothingFound: "לא נמצאו משרות",
  urlPrompt: "הדביקו את כתובת עמוד הקריירה או עמוד הלינקדאין של החברה, ונקרא משם:",
  urlPlaceholder: "example.com/careers או linkedin.com/company/example",
  urlSave: "השתמשו בכתובת",
  urlSaved: (url: string) => `נקרא מתוך ${url}`,
  urlClear: "הסרת הכתובת",

  cvScoreLabel: "ציון קורות החיים מתוך 100",
  scoreOutOf: (n: number) => `${n} מתוך 100`,
  highPriority: (n: number) => `${n} בעדיפות גבוהה`,
  suggestions: (n: number) => `${n} המלצות`,
  missingSection: (s: string) => `חסר: ${s}`,
  tabFixes: (n: number) => `תיקונים ${n}`,
  tabRewrites: (n: number) => `ניסוחים ${n}`,
  tabProfile: "מה קראנו",
  tabUpgraded: "קורות חיים משופרים",
  upgradeIntro:
    "כל התיקונים שלמעלה, מיושמים על קורות החיים שלכם, ואז מקבלים ציון מחדש כדי לראות מה זה שווה. העובדות נשארות כפי שהן — במקום שבו נדרש מספר שאינו מופיע, תקבלו סוגריים למילוי.",
  upgradeCta: "כתבו מחדש את קורות החיים",
  upgrading: "כותבים מחדש את קורות החיים",
  upgradeAgain: "שפרו שוב",
  upgradeCopy: "העתיקו כטקסט",
  upgradeDownload: "הורידו לוורד",
  upgradeCopied: "הועתק",
  upgradeChanges: "מה שונה",
  upgradeExperience: "ניסיון",
  upgradeScored: (n: number) => `מקבל ${n} כמו שהוא`,
  upgradeNoBetter: "הסבב הזה לא קיבל ציון גבוה יותר, ולכן נשמרה הגרסה עם הציון הגבוה.",
  upgradeWas: (n: number) => `היה ${n}`,
  upgradePlaceholders:
    "מלאו כל סוגריים במספר אמיתי לפני ששולחים את זה לאן שהוא. סוגריים ריקים עדיין נקראים כחוסר במידע כמותי, ולכן מילוי שלהם הוא השיפור הגדול שנשאר.",
  workingWell: "מה עובד טוב",
  atsNotes: "איך מערכות סינון קורות חיים יקראו את זה",
  keywords: "מילות מפתח להוספה, במקומות שבהם הן נכונות לגביכם",
  noRewrites: "לא הוצעו ניסוחים חלופיים.",
  severity: { high: "גבוהה", medium: "בינונית", low: "נמוכה" },

  fieldName: "שם",
  fieldHeadline: "כותרת",
  fieldLocation: "מקום",
  fieldExperience: "ניסיון",
  fieldSkills: "כישורים",
  fieldTools: "כלים",
  fieldTitles: "תפקידים קודמים",
  fieldTargetRoles: "תפקידי יעד",
  fieldIndustries: "תעשיות",
  fieldLanguages: "שפות",
  experienceValue: (n: number, seniority: string) => `${n} שנים, ${seniority}`,

  rolesScored: (n: number) => `${n} משרות דורגו`,
  companyRoles: (n: number) => `${n} משרות`,
  bestFit: (n: number) => `הגבוה ${n}%`,
  visibleOf: (a: number, b: number) => `${a} מתוך ${b}`,
  fitAtLeast: "התאמה לפחות",
  allCompanies: "כל החברות",
  matchesEmptyTitle: "המשרות המדורגות שלכם יופיעו כאן",
  matchesEmptyBody:
    "רשמו את החברות שבהן תרצו לעבוד והפעילו את החיפוש. כל משרה פתוחה מקבלת ציון התאמה, מהגבוה לנמוך.",
  linesUp: "מתאים למה שכתוב אצלכם",
  notInCv: "לא מופיע בקורות החיים",
  nothingLinesUp: "אין התאמה ישירה.",
  noGaps: "אין פערים בולטים.",
  heuristicOnly: "דורג לפי חפיפת מילות מפתח בלבד — לא הורץ ניתוח מפורט למשרה הזאת.",
  whyThisScore: "למה הציון הזה",
  improveOdds: "מה לשנות כדי לשפר את הסיכוי כאן",
  readPosting: "קראו את המשרה",
  remote: "עבודה מרחוק",
  fromSource: (s: string) => `מתוך ${s}`,
  postedOn: (d: string) => `פורסם ב-${d}`,
  noneAbove: (n: number) => `אין משרות בהתאמה של ${n}% ומעלה. הורידו את הרף כדי לראות עוד.`,

  fit: {
    strong: "התאמה חזקה",
    apply: "שווה להגיש",
    stretch: "מאתגר",
    poor: "התאמה חלשה",
  },
  seniorityFit: { under: "מתחת לרמה שלכם", match: "מתאים לרמה", over: "מעל הרמה שלכם" },
  locationFit: (v: string) => `מקום: ${v}`,
  locationFitValue: { good: "מתאים", unclear: "לא ברור", poor: "בעייתי" },

  seniority: {
    intern: "מתמחה",
    junior: "ג׳וניור",
    mid: "בינוני",
    senior: "סניור",
    staff: "סטאף",
    lead: "לִיד",
    manager: "מנהל",
    director: "דירקטור",
    executive: "בכיר",
  },

  source: {
    greenhouse: "Greenhouse",
    lever: "Lever",
    ashby: "Ashby",
    smartrecruiters: "SmartRecruiters",
    recruitee: "Recruitee",
    workable: "Workable",
    "careers-page": "עמוד קריירה",
    none: "לא נמצא לוח משרות",
    "linkedin-only": "לינקדאין בלבד",
    error: "החיפוש נכשל",
  },

  noteNoBoard:
    "— לא מצאנו לוח משרות ציבורי שניתן לקרוא. הוסיפו למטה קישור לעמוד הקריירה או ללינקדאין ונקרא משם.",
  noteUnreadable:
    "— מצאנו עמוד קריירה אבל לא הצלחנו לקרוא ממנו משרות, בדרך כלל כי הרשימה נטענת ב-JavaScript בלבד.",
  noteLinkedinOnly:
    "— לינקדאין חוסמת קריאה אוטומטית. השתמשנו בעמוד כדי לחפש לוח משרות ולא מצאנו — פתחו את קישור המשרות בלינקדאין, או הדביקו את כתובת עמוד הקריירה של החברה.",

  errNoOpenings: "לא הצלחנו לקרוא משרות פתוחות בחברות האלה. ההערות מתחת לכל חברה מסבירות למה.",
  errRateLimited: (minutes: number) =>
    `יותר מדי בקשות מהחיבור הזה. נסו שוב בעוד כ-${minutes} דקות.`,
  errSearch: "חיפוש המשרות נכשל.",
  errMatch: "חישוב ההתאמה נכשל.",
  errGeneric: "משהו השתבש.",
};

export type Dict = typeof en;

export const STRINGS: Record<Lang, Dict> = { en, he };

/** Appended to every prompt so the model answers in the reader's language. */
export function languageInstruction(lang: Lang): string {
  return lang === "he"
    ? "\n\nWrite every string you output in Hebrew, in natural, professional Israeli Hebrew. Keep technology names, company names and job titles in their original form. Enum values (seniority, seniorityFit, locationFit, severity) must stay in English exactly as specified."
    : "";
}
