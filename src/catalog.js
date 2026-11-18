// More Grow Global service catalog — matches the live Stripe packages and payment links.
// One Stripe Product per package. Prices in cents. Change a value and re-run setup:catalog to update.
// lookup_key lets the server find a price without hardcoding Stripe IDs (live prices carry the same keys).
export const catalog = [
  { key: 'career_positioning_audit', name: 'Career Positioning Audit', description: 'Expert review of your resume, LinkedIn profile and job search strategy, with a prioritised fix list. Delivered in 3 business days.', amount: 9900 },
  { key: 'professional_brand_transformation', name: 'Professional Brand Transformation', description: 'Rewritten resume, cover letter and LinkedIn profile, with one revision round. Delivered in 5-7 business days.', amount: 29500 },
  { key: 'executive_career_transformation', name: 'Executive Career Transformation', description: 'Full executive positioning, resume, cover letter and LinkedIn, plus a career strategy consultation and two revision rounds. Delivered in 7-10 business days.', amount: 49500 },
  { key: 'strategic_reverse_recruiting', name: 'Strategic Reverse Recruiting', description: 'Monthly targeted outreach to decision-makers on your behalf, with weekly reporting. No guarantee of interviews or offers.', amount: 60000, interval: 'month' },
  { key: 'interview_coaching', name: 'Interview Coaching Session', description: '60-minute one-to-one mock interview with behavioral and competency-based coaching, plus written feedback. No guarantee of job offers.', amount: 17500 },
  { key: 'cover_letter', name: 'Professional Cover Letter', description: 'A customized, ATS-friendly cover letter tailored to your target role, with one revision round. Delivered in 3 business days.', amount: 12900 },
];

export const currency = 'usd';
