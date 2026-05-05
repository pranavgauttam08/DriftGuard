/**
 * 6 preset example datasets for the DataSender "Load Examples" tab.
 * Each set has 10 realistic query-response pairs.
 */

export interface ExampleResponse {
  query: string;
  response: string;
  latencyMs: number;
  tokenCount: number;
}

export interface ExampleSet {
  name: string;
  description: string;
  icon: string;
  responses: ExampleResponse[];
}

export const exampleSets: ExampleSet[] = [
  {
    name: 'E-commerce Support Bot',
    description: '10 customer support conversations',
    icon: '🛒',
    responses: [
      { query: 'Where is my order #4521?', response: 'Your order #4521 was shipped on May 2nd via FedEx. The tracking number is FX-892341. It\'s currently in transit and estimated to arrive by May 7th.', latencyMs: 420, tokenCount: 48 },
      { query: 'Can I return this item?', response: 'Yes! You can return any item within 30 days of delivery. Please visit our Returns Center at returns.example.com and enter your order number to generate a prepaid shipping label.', latencyMs: 380, tokenCount: 52 },
      { query: 'Do you have this shirt in large?', response: 'Let me check our inventory. Yes, the Classic Fit Oxford Shirt is available in Large in Navy Blue and White. Would you like me to add it to your cart?', latencyMs: 510, tokenCount: 44 },
      { query: 'My coupon code isn\'t working', response: 'I\'m sorry about that. Let me look into it. Could you share the coupon code? Some common issues are expired codes or minimum order requirements. I can also apply a 10% discount manually if the code is valid.', latencyMs: 460, tokenCount: 56 },
      { query: 'How long does shipping take?', response: 'Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for $9.99, and overnight shipping is $19.99. Free standard shipping on orders over $75.', latencyMs: 350, tokenCount: 48 },
      { query: 'I received the wrong item', response: 'I\'m so sorry about this mix-up. I\'ll arrange a free return pickup and ship the correct item immediately with express shipping at no charge. You\'ll receive a confirmation email within the hour.', latencyMs: 440, tokenCount: 52 },
      { query: 'Can I change my delivery address?', response: 'If your order hasn\'t shipped yet, I can update the address right away. What\'s the new delivery address? If it\'s already shipped, we may need to contact the carrier.', latencyMs: 390, tokenCount: 46 },
      { query: 'What\'s your price match policy?', response: 'We offer a price match guarantee within 14 days of purchase. If you find the same item at a lower price from an authorized retailer, we\'ll match it and give you an additional 5% off.', latencyMs: 410, tokenCount: 50 },
      { query: 'Is this product eco-friendly?', response: 'Great question! Our Sustainable Collection products are made from 100% recycled materials and certified by the Global Organic Textile Standard. You can filter for eco-friendly products using the Sustainability filter.', latencyMs: 480, tokenCount: 54 },
      { query: 'I want to cancel my subscription', response: 'I understand. Before I process the cancellation, I wanted to mention we have a pause option if you\'d like to take a break instead. Your subscription benefits would resume when you\'re ready. Would you prefer to pause or fully cancel?', latencyMs: 520, tokenCount: 58 },
    ],
  },
  {
    name: 'Technical Docs Assistant',
    description: '10 developer documentation queries',
    icon: '📖',
    responses: [
      { query: 'How do I authenticate with the API?', response: 'Use Bearer token authentication. Include your API key in the Authorization header:\n\n```\nAuthorization: Bearer YOUR_API_KEY\n```\n\nYou can generate API keys from Settings > API Keys. Keys are scoped to specific permissions.', latencyMs: 320, tokenCount: 62 },
      { query: 'What\'s the rate limit?', response: 'The rate limits are:\n- Free tier: 100 requests/minute\n- Pro tier: 1,000 requests/minute\n- Enterprise: Custom\n\nRate limit headers are included in every response: X-RateLimit-Remaining and X-RateLimit-Reset.', latencyMs: 280, tokenCount: 56 },
      { query: 'How do I handle pagination?', response: 'We use cursor-based pagination. Each response includes a `next_cursor` field. Pass it as `?cursor=<value>` in your next request. The `has_more` boolean indicates if more results exist. Default page size is 25, max is 100.', latencyMs: 340, tokenCount: 58 },
      { query: 'What SDK versions are supported?', response: 'Current SDKs:\n- Node.js: v3.2.1 (supports Node 18+)\n- Python: v2.8.0 (supports Python 3.9+)\n- Go: v1.4.0 (supports Go 1.21+)\n\nAll SDKs have TypeScript/type support and async/await patterns.', latencyMs: 310, tokenCount: 64 },
      { query: 'How do I set up webhooks?', response: 'Navigate to Settings > Webhooks > Add Endpoint. Enter your HTTPS URL and select events to subscribe to. We\'ll send a POST with a JSON payload and include an X-Signature header for verification using your webhook secret.', latencyMs: 380, tokenCount: 54 },
      { query: 'What error codes does the API return?', response: '- 400: Bad Request (invalid parameters)\n- 401: Unauthorized (invalid API key)\n- 403: Forbidden (insufficient permissions)\n- 404: Not Found\n- 429: Rate Limited\n- 500: Internal Server Error\n\nAll errors include a JSON body with `code`, `message`, and `details`.', latencyMs: 290, tokenCount: 72 },
      { query: 'How do I upload files?', response: 'Use multipart/form-data POST to /api/v1/files. Max file size is 50MB. Supported formats: PDF, DOCX, TXT, CSV, JSON. The response returns a file_id you can reference in subsequent API calls.', latencyMs: 420, tokenCount: 50 },
      { query: 'Can I use GraphQL?', response: 'Yes! Our GraphQL endpoint is at /graphql. We provide a GraphQL Explorer at docs.example.com/graphql-explorer for testing queries. The schema supports all REST API resources with real-time subscriptions via WebSocket.', latencyMs: 360, tokenCount: 52 },
      { query: 'How do I handle retries?', response: 'We recommend exponential backoff with jitter. Start with a 1-second delay, double on each retry, cap at 30 seconds. Our SDKs handle this automatically. Idempotency keys (via X-Idempotency-Key header) ensure safe retries for POST requests.', latencyMs: 340, tokenCount: 58 },
      { query: 'What\'s the data retention policy?', response: 'Free tier: 30 days data retention. Pro: 1 year. Enterprise: Custom. You can export data at any time via the /api/v1/export endpoint. Deleted data is purged from backups within 90 days per our GDPR compliance policy.', latencyMs: 380, tokenCount: 56 },
    ],
  },
  {
    name: 'HR FAQ Bot',
    description: '10 human resources questions',
    icon: '👥',
    responses: [
      { query: 'How many vacation days do I have?', response: 'Full-time employees receive 20 PTO days per year, accruing at 1.67 days per month. You can check your current balance in the HR portal under Time Off > My Balance. Unused days roll over up to 5 days.', latencyMs: 350, tokenCount: 52 },
      { query: 'What\'s the remote work policy?', response: 'We offer a hybrid model: minimum 2 days in-office per week, your choice of days. Fully remote arrangements are available for certain roles with manager approval. Submit a remote work request through the HR portal.', latencyMs: 380, tokenCount: 50 },
      { query: 'How do I submit an expense report?', response: 'Use the Expenses app in our HR portal. Upload receipts, categorize expenses, and submit for approval. Reimbursements are processed within 5 business days after approval. Expenses over $500 require VP-level approval.', latencyMs: 340, tokenCount: 48 },
      { query: 'When is open enrollment?', response: 'Open enrollment runs November 1-15 annually. During this period, you can change health plans, add/remove dependents, and adjust HSA contributions. Benefits take effect January 1st. HR hosts info sessions in October.', latencyMs: 410, tokenCount: 50 },
      { query: 'What parental leave is offered?', response: 'We offer 16 weeks paid parental leave for all new parents (birth, adoption, or foster). This can be taken continuously or in blocks within the first year. Additional unpaid leave of up to 8 weeks is available upon request.', latencyMs: 390, tokenCount: 54 },
      { query: 'How does the referral bonus work?', response: 'Refer a candidate through the referral portal. If they\'re hired and complete 90 days, you receive a $3,000 bonus ($5,000 for engineering roles). There\'s no limit on referrals. Bonuses are paid in your next regular paycheck.', latencyMs: 360, tokenCount: 52 },
      { query: 'What training budget do I have?', response: 'Each employee has a $2,000 annual learning and development budget. This covers conferences, courses, books, and certifications. Submit requests through the Learning Portal. Unused funds don\'t roll over.', latencyMs: 330, tokenCount: 46 },
      { query: 'How do performance reviews work?', response: 'We conduct semi-annual reviews in January and July. The process: 1) Self-assessment, 2) Peer feedback (360°), 3) Manager evaluation, 4) Calibration, 5) One-on-one discussion. Compensation adjustments follow the January cycle.', latencyMs: 440, tokenCount: 56 },
      { query: 'What happens if I\'m sick?', response: 'You have unlimited sick days — just notify your manager by 9 AM. For absences over 3 consecutive days, a doctor\'s note is requested. We also offer short-term disability coverage at 70% salary for extended illness.', latencyMs: 370, tokenCount: 50 },
      { query: 'How do I request a standing desk?', response: 'Submit an ergonomic equipment request through the Facilities portal. Standing desks, ergonomic chairs, and monitor arms are available at no cost. Requests are typically fulfilled within 2 weeks. An ergonomic assessment can also be scheduled.', latencyMs: 400, tokenCount: 52 },
    ],
  },
  {
    name: 'Sales Assistant',
    description: '10 sales-related conversations',
    icon: '💼',
    responses: [
      { query: 'What pricing plans do you offer?', response: 'We have three plans:\n\n**Starter** — $29/mo: Up to 5 users, 10GB storage, email support\n**Professional** — $79/mo: Up to 25 users, 100GB storage, priority support\n**Enterprise** — Custom: Unlimited users, dedicated infrastructure, 24/7 support\n\nAll plans include a 14-day free trial.', latencyMs: 450, tokenCount: 72 },
      { query: 'How does your product compare to Competitor X?', response: 'Great question! Unlike Competitor X, we offer real-time collaboration, 3x faster processing, and SOC 2 Type II compliance included in all plans. Our customers typically see 40% faster time-to-value. I can share a detailed comparison sheet if helpful.', latencyMs: 520, tokenCount: 58 },
      { query: 'Can I get a demo?', response: 'Absolutely! I can set up a personalized 30-minute demo tailored to your use case. We\'ll cover the features most relevant to your team. What day works best — this week or next? I have availability Tuesday and Thursday afternoons.', latencyMs: 380, tokenCount: 52 },
      { query: 'Do you offer annual discounts?', response: 'Yes! Annual billing saves you 20% compared to monthly. That brings Professional down to $63/mo (billed $756/year). We also offer multi-year agreements with additional discounts. Would you like me to prepare a custom quote?', latencyMs: 400, tokenCount: 54 },
      { query: 'What integrations do you support?', response: 'We integrate with 200+ tools including Salesforce, HubSpot, Slack, Jira, GitHub, and all major cloud providers. We also have a REST API and webhooks for custom integrations. Most integrations are one-click setup.', latencyMs: 360, tokenCount: 50 },
      { query: 'Is there a free trial?', response: 'Yes — 14 days, full access to all Professional features, no credit card required. Your data is preserved if you decide to upgrade. If you need more time to evaluate, I can extend the trial to 30 days.', latencyMs: 340, tokenCount: 50 },
      { query: 'How many users are on your platform?', response: 'Over 12,000 companies use our platform, including 300+ enterprise customers. We serve teams ranging from 3-person startups to Fortune 500 organizations. Last quarter, our users processed 2.8 billion operations.', latencyMs: 420, tokenCount: 48 },
      { query: 'What security certifications do you have?', response: 'We hold SOC 2 Type II, ISO 27001, GDPR compliance, and HIPAA BAA (for healthcare customers). We undergo annual penetration testing and maintain 99.99% uptime SLA. Security whitepaper available on request.', latencyMs: 440, tokenCount: 52 },
      { query: 'Can we get a custom contract?', response: 'For Enterprise plans, absolutely. We offer custom terms, dedicated SLAs, specific data residency requirements, and custom billing arrangements. I\'ll connect you with our solutions team to discuss your specific needs. What\'s the best email?', latencyMs: 480, tokenCount: 54 },
      { query: 'What\'s the onboarding process?', response: 'Our onboarding takes about 1 week: Day 1 — account setup and data import, Day 2-3 — team training sessions, Day 4-5 — workflow customization. You get a dedicated Customer Success Manager for the first 90 days.', latencyMs: 410, tokenCount: 52 },
    ],
  },
  {
    name: 'Code Review Assistant',
    description: '10 code review interactions',
    icon: '🔍',
    responses: [
      { query: 'Review this function for performance issues', response: 'I notice a few concerns:\n1. **N+1 query** — Line 23 runs a DB query inside a loop. Batch these with a single WHERE IN clause.\n2. **Missing index** — The `status` column filter on line 31 would benefit from a composite index.\n3. **Memory leak** — The event listener on line 45 is never cleaned up. Add a cleanup function.', latencyMs: 580, tokenCount: 82 },
      { query: 'Is this SQL injection safe?', response: 'No — line 15 uses string interpolation in the SQL query. This is vulnerable to SQL injection. Use parameterized queries instead:\n\n```sql\nSELECT * FROM users WHERE id = $1\n```\n\nAlso add input validation for the user_id parameter before it reaches the query layer.', latencyMs: 440, tokenCount: 68 },
      { query: 'Should I use useMemo here?', response: 'In this case, no. The computation on line 12 (filtering an array of 20 items) is trivial — useMemo\'s overhead outweighs the benefit. useMemo is worthwhile for: expensive calculations (>1ms), preventing unnecessary child re-renders, or referential equality in effect deps.', latencyMs: 390, tokenCount: 62 },
      { query: 'What\'s wrong with this error handling?', response: 'Three issues:\n1. **Swallowed errors** — The catch block on line 8 catches but doesn\'t log or rethrow.\n2. **No error boundary** — The component will crash without a fallback UI.\n3. **Missing finally** — The loading state on line 3 is never reset if the fetch fails. Add `finally { setLoading(false) }`.', latencyMs: 520, tokenCount: 76 },
      { query: 'Is this component accessible?', response: 'Several a11y issues:\n- The button on line 7 uses a `<div>` — use `<button>` for keyboard support.\n- Missing `aria-label` on the icon-only button (line 15).\n- Color contrast ratio of the text (#888 on #1a1a1a) is 4.1:1 — needs 4.5:1 minimum.\n- No focus visible styles defined.', latencyMs: 480, tokenCount: 74 },
      { query: 'Review this TypeScript type definition', response: 'The type is mostly good, but I\'d suggest:\n1. Make `id` a branded type: `type UserId = string & { readonly __brand: "UserId" }`\n2. `createdAt` should be `Date`, not `string`\n3. The `status` field should be a union type `"active" | "inactive" | "suspended"` instead of `string`\n4. Consider making the entire type `Readonly<>`.', latencyMs: 450, tokenCount: 78 },
      { query: 'How can I improve this API route?', response: 'Recommendations:\n1. **Add input validation** — Use zod schema: `const schema = z.object({ email: z.string().email() })`\n2. **Add rate limiting** — This endpoint is unprotected from abuse.\n3. **Return proper status codes** — Line 23 returns 200 for errors. Use 400/422.\n4. **Add request logging** for debugging.', latencyMs: 510, tokenCount: 72 },
      { query: 'Is this test sufficient?', response: 'The test covers the happy path but is missing:\n1. **Error cases** — What happens when the API returns 500?\n2. **Edge cases** — Empty arrays, null values, maximum length strings.\n3. **Cleanup** — No `afterEach` to reset mocks.\n4. **Assertion specificity** — `toBeTruthy()` on line 12 should be `toEqual(expectedValue)`.', latencyMs: 460, tokenCount: 70 },
      { query: 'Should I split this into smaller files?', response: 'Yes, this 400-line file violates single responsibility. I recommend:\n1. Extract the API client (lines 1-80) → `api-client.ts`\n2. Extract the data transformer (lines 81-150) → `transformers.ts`\n3. Extract the validation logic (lines 151-220) → `validators.ts`\n4. Keep the main orchestration in the current file.\n\nEach module should be independently testable.', latencyMs: 540, tokenCount: 80 },
      { query: 'Any race conditions here?', response: 'Yes — critical race condition on line 34. The `if (!cache[key])` check and `cache[key] = fetch(...)` are not atomic. Two concurrent requests for the same key will both trigger fetches. Use a Promise-based cache pattern:\n\n```ts\nif (!cache[key]) cache[key] = fetchData(key);\nreturn cache[key];\n```\n\nThis deduplicates concurrent requests.', latencyMs: 490, tokenCount: 76 },
    ],
  },
  {
    name: 'Medical FAQ Bot',
    description: '10 health information queries',
    icon: '🏥',
    responses: [
      { query: 'What are common cold symptoms?', response: 'Common cold symptoms include: runny or stuffy nose, sore throat, coughing, sneezing, mild headache, and general fatigue. Symptoms usually appear 1-3 days after exposure and last 7-10 days. If symptoms persist beyond 10 days or worsen, consult your doctor. This is general information — not medical advice.', latencyMs: 380, tokenCount: 64 },
      { query: 'How much water should I drink daily?', response: 'The general recommendation is about 8 cups (64 oz / 2 liters) of water daily, though needs vary by body weight, activity level, and climate. A good rule: drink when thirsty and aim for pale yellow urine. Athletes and those in hot climates may need more. Always consult your healthcare provider for personalized advice.', latencyMs: 420, tokenCount: 68 },
      { query: 'What is a normal blood pressure?', response: 'Normal blood pressure is generally below 120/80 mmHg. Categories:\n- **Normal**: Less than 120/80\n- **Elevated**: 120-129 / less than 80\n- **Stage 1 Hypertension**: 130-139 / 80-89\n- **Stage 2 Hypertension**: 140+ / 90+\n\nRegular monitoring is recommended. Consult your doctor for personalized guidance.', latencyMs: 440, tokenCount: 72 },
      { query: 'How do I manage stress?', response: 'Evidence-based stress management techniques include: regular exercise (30 min/day), adequate sleep (7-9 hours), mindfulness meditation, deep breathing exercises, limiting caffeine, maintaining social connections, and time management. If stress is overwhelming, consider speaking with a mental health professional.', latencyMs: 390, tokenCount: 58 },
      { query: 'What vaccines do adults need?', response: 'Recommended adult vaccines include: annual flu shot, Tdap booster (every 10 years), COVID-19 (as recommended), shingles (age 50+), pneumococcal (age 65+). Travel vaccines may also be needed. Check with your healthcare provider for a personalized immunization schedule based on your age and health conditions.', latencyMs: 460, tokenCount: 62 },
      { query: 'How much sleep do I need?', response: 'The National Sleep Foundation recommends:\n- **Adults (18-64)**: 7-9 hours\n- **Older adults (65+)**: 7-8 hours\n\nSleep quality matters too. Practice good sleep hygiene: consistent schedule, dark room, no screens 1 hour before bed, cool temperature (65-68°F). Consult your doctor if you regularly feel unrested.', latencyMs: 400, tokenCount: 66 },
      { query: 'What are signs of dehydration?', response: 'Early signs: increased thirst, dark yellow urine, dry mouth, fatigue, dizziness. Severe signs: very dark urine, rapid heartbeat, sunken eyes, confusion, no urination for 8+ hours. Children and elderly are at higher risk. Seek medical attention for severe dehydration. Drink fluids regularly throughout the day.', latencyMs: 370, tokenCount: 62 },
      { query: 'Is intermittent fasting safe?', response: 'Intermittent fasting (like 16:8 or 5:2) is generally considered safe for healthy adults. Research shows potential benefits for weight management and metabolic health. However, it\'s not recommended for pregnant women, children, those with eating disorders, or people with diabetes without medical supervision. Consult your doctor before starting.', latencyMs: 450, tokenCount: 66 },
      { query: 'How do I check for skin cancer?', response: 'Use the ABCDE rule for moles: **A**symmetry, **B**order irregularity, **C**olor variation, **D**iameter >6mm, **E**volving size/shape/color. Perform monthly self-exams and get annual professional skin checks. Risk factors include fair skin, sun exposure history, and family history. See a dermatologist for any concerning changes.', latencyMs: 430, tokenCount: 70 },
      { query: 'What causes headaches?', response: 'Common headache triggers include: stress, dehydration, poor sleep, eyestrain, caffeine withdrawal, skipped meals, weather changes, and certain foods (aged cheese, alcohol). Tension headaches are most common. Migraines may include nausea and light sensitivity. Seek immediate care for sudden, severe headaches or those with fever/stiff neck.', latencyMs: 410, tokenCount: 64 },
    ],
  },
];
