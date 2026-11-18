// More Grow Global service catalog.
// One Stripe Product per package, so invoices and receipts show a clear name.
// Prices in cents, set at US mid-market rates (Nov 2026). Change a value and re-run setup:catalog to update.
// lookup_key lets the server find a price without hardcoding Stripe IDs.
export const catalog = [
  { key: 'resume_professional', name: 'Professional Resume Writing', description: 'ATS-optimized resume written around your achievements.', amount: 29900 },
  { key: 'resume_executive', name: 'Executive Resume Writing', description: 'Executive-level resume for senior leaders.', amount: 74900 },
  { key: 'cover_letter', name: 'Professional Cover Letter', description: 'Customized cover letter to accompany your resume.', amount: 12900 },
  { key: 'linkedin_optimization', name: 'LinkedIn Profile Optimization', description: 'Headline, content and SEO optimization for recruiter visibility.', amount: 34900 },
  { key: 'career_branding_bundle', name: 'Career Branding Bundle', description: 'Resume + cover letter + LinkedIn optimization (save $128 vs. separately).', amount: 64900 },
  { key: 'interview_coaching', name: 'Interview Coaching Session', description: 'Mock interview and behavioral/competency coaching (60 min).', amount: 17500 },
  { key: 'linkedin_management_monthly', name: 'LinkedIn Profile Management', description: 'Ongoing monthly LinkedIn management.', amount: 24900, interval: 'month' },
];

export const currency = 'usd';
