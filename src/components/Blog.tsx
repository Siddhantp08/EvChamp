import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../Footer';

interface BlogPost {
  id: string;
  tag: string;
  tagColor: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  image: string; // emoji or icon
  featured?: boolean;
}

const posts: BlogPost[] = [
  {
    id: '1',
    tag: 'EV Ecosystem',
    tagColor: '#dcfce7',
    tagTextColor: '#15803d',
    date: 'May 20, 2026',
    readTime: '5 min read',
    title: 'Why India\'s EV Revolution Is Just Getting Started',
    excerpt: 'With over 1.5 million EVs sold in FY2025 and a target of 30% EV penetration by 2030, India stands at the cusp of a mobility transformation. We explore what\'s driving this surge and what it means for EV owners, investors, and infrastructure providers.',
    author: 'EVChamp Team',
    authorInitial: 'E',
    authorColor: '#22c55e',
    image: '⚡',
    featured: true,
  } as any,
  {
    id: '2',
    tag: 'Battery Intelligence',
    tagColor: '#ede9fe',
    tagTextColor: '#7c3aed',
    date: 'May 15, 2026', 
    title: 'How Zeflash AI Detects Battery Degradation Before It\'s Too Late',
    excerpt: 'Battery health is the single biggest concern for EV owners. Zeflash uses real-time IoT telemetry and AI diagnostics to flag anomalies weeks before they become failures — saving costs and keeping you safe on the road.',
    author: 'Zeflash R&D',
    authorInitial: 'Z',
    authorColor: '#7c3aed',
    image: '🔋',
  } as any,
  {
    id: '3',
    tag: 'Investment',
    tagColor: '#fef9c3',
    tagTextColor: '#a16207',
    date: 'May 10, 2026',
    title: 'Investing in EV Charging Infrastructure: The Opportunity Nobody Talks About',
    excerpt: 'While most investors chase EV stocks, the real money is in the charging infrastructure underneath. INVESTYZ breaks down how real-world asset investing in charging networks, battery storage, and data centres can deliver long-term yield.',
    author: 'INVESTYZ Insights',
    authorInitial: 'I',
    authorColor: '#f59e0b',
    image: '💹',
  } as any,
  {
    id: '4',
    tag: 'Roadside Assistance',
    tagColor: '#fee2e2',
    tagTextColor: '#b91c1c',
    date: 'May 5, 2026',
    title: '5 Situations Where EVChamp RSA Saved the Day',
    excerpt: 'From sudden battery drain on expressways to charging port failures at midnight — our Roadside Assistance team has seen it all. Real stories from real EV owners and how EVChamp RSA got them back on the road within minutes.',
    author: 'RSA Operations',
    authorInitial: 'R',
    authorColor: '#ef4444',
    image: '🚨',
  } as any,
  {
    id: '5',
    tag: 'Marketplace',
    tagColor: '#dbeafe',
    tagTextColor: '#1d4ed8',
    date: 'April 28, 2026',
    title: 'Buying a Used EV in India? Here\'s What You Must Check First',
    excerpt: 'The used EV market is booming — but so are the risks. EVChamp\'s certified marketplace verifies battery health, service history, and charging compatibility before you buy. Here\'s a complete checklist for smart EV buyers.',
    author: 'EV Marketplace Team',
    authorInitial: 'M',
    authorColor: '#3b82f6',
    image: '🚗',
  } as any,
  {
    id: '6',
    tag: 'Service Network',
    tagColor: '#d1fae5',
    tagTextColor: '#065f46',
    date: 'April 20, 2026',
    title: 'How EVChamp Is Building India\'s Largest Verified EV Service Network',
    excerpt: 'Finding a trustworthy EV service centre in tier-2 cities is still a challenge. EVChamp is partnering with certified workshops across India, equipped to handle everything from software updates to motor replacements.',
    author: 'EVChamp Network',
    authorInitial: 'N',
    authorColor: '#10b981',
    image: '🔧',
  } as any,
  {
    id: '7',
    tag: 'ZipBattery',
    tagColor: '#fce7f3',
    tagTextColor: '#9d174d',
    date: 'April 14, 2026',
    title: 'ZipBattery: Bringing AI-Grade Battery Intelligence to Every EV Owner',
    excerpt: 'ZipBattery combines predictive analytics, thermal modelling, and usage pattern recognition to give EV owners an unprecedented view into their battery\'s health, life expectancy, and optimal charging habits.',
    author: 'ZipBattery Labs',
    authorInitial: 'B',
    authorColor: '#ec4899',
    image: '🧠',
  } as any,
  {
    id: '8',
    tag: 'Charging Network',
    tagColor: '#e0f2fe',
    tagTextColor: '#0369a1',
    date: 'April 8, 2026',
    title: 'Mapping 100+ EV Charging Stations: Our Journey Across India',
    excerpt: 'EVChamp has now mapped over 100 public and semi-public charging stations across India — from Delhi NCR to Bangalore and beyond. Here\'s what we learned and what\'s coming next for EV drivers nationwide.',
    author: 'EVChamp Team',
    authorInitial: 'E',
    authorColor: '#22c55e',
    image: '📍',
  } as any,
  {
    id: '9',
    tag: 'Policy',
    tagColor: '#f3f4f6',
    tagTextColor: '#374151',
    date: 'March 30, 2026',
    title: 'FAME III & Beyond: What India\'s EV Policy Means for You',
    excerpt: 'The FAME III scheme brings fresh subsidies, expanded charging mandates, and support for commercial EVs. We break down the key provisions and explain how EVChamp\'s platform helps you take full advantage of the policy shift.',
    author: 'EVChamp Policy Desk',
    authorInitial: 'P',
    authorColor: '#6b7280',
    image: '🏛️',
  } as any,
];

const tags = ['All', 'EV Ecosystem', 'Battery Intelligence', 'Investment', 'Roadside Assistance', 'Marketplace', 'Service Network', 'Charging Network', 'Policy'];

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeTag === 'All' ? posts : posts.filter(p => p.tag === activeTag);
  const featured = posts.find(p => p.featured);
  const rest = filtered.filter(p => !p.featured || activeTag !== 'All');

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Blog | EVChamp — EV Insights, Battery Intelligence & Green Investment</title>
        <meta name="description" content="Stay updated with EVChamp's latest articles on EV ecosystems, battery intelligence, green infrastructure investment, roadside assistance, and India's electric mobility future." />
        <meta name="keywords" content="EV blog India, electric vehicle news, battery health, EV charging infrastructure, INVESTYZ, Zeflash, EVChamp blog" />
      </Helmet>

      {/* Hero */}
      <section
        className="relative text-white py-16 sm:py-24 overflow-hidden"
        style={{
          backgroundImage: "url('/blog-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          minHeight: '340px',
        }}
      >
        {/* Dim overlay — darkens to ~55% so the glowing EV car shows through but text is crisp */}
        <div className="absolute inset-0" style={{ background: 'rgba(5, 15, 20, 0.58)' }} />
        {/* Bottom fade for smooth transition into content below */}
        <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: 'linear-gradient(to bottom, transparent, rgba(5,15,20,0.45))' }} />

        <div className="relative container mx-auto px-4 sm:px-6 max-w-5xl text-center">
          <span className="inline-block bg-green-500/25 text-green-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest mb-5 border border-green-500/20">EVChamp Blog</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>
            Insights for India's<br className="hidden sm:block" /> Electric Mobility Future
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            Deep dives into EV technology, battery intelligence, green investment, charging networks, and the road ahead — written by the EVChamp team.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      {activeTag === 'All' && featured && (
        <section className="border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 max-w-5xl">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Featured Article</p>
            <div
              className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 sm:p-10 cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => setExpandedId(expandedId === featured.id ? null : featured.id)}
            >
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
                <div className="text-6xl sm:text-7xl flex-shrink-0">{featured.image}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: (featured as any).tagColor, color: (featured as any).tagTextColor }}
                    >
                      {featured.tag}
                    </span>
                    <span className="text-xs text-gray-400">{featured.date}</span>
                    <span className="text-xs text-gray-400">· {featured.readTime}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors">{featured.title}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{featured.excerpt}</p>
                  {expandedId === featured.id && (
                    <div className="mt-2 text-sm text-gray-700 leading-relaxed space-y-3 border-t border-green-100 pt-4">
                      <p>India's electric vehicle market saw a record-breaking FY2025, with two-wheelers, three-wheelers, and commercial EVs all posting double-digit growth. Government incentives under FAME II laid the groundwork, and the incoming FAME III promises to accelerate adoption further.</p>
                      <p>EVChamp sits at the centre of this transformation — connecting EV owners to certified service centres, AI-powered battery diagnostics through Zeflash, green infrastructure investment via INVESTYZ, and a verified marketplace for buying and selling EVs.</p>
                      <p>The next five years will define who owns India's EV stack. EVChamp's integrated platform is built to serve every stakeholder — owner, investor, workshop, and fleet operator — in one unified ecosystem.</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: featured.authorColor }}
                      >
                        {featured.authorInitial}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{featured.author}</span>
                    </div>
                    <span className="text-xs text-green-600 font-semibold group-hover:underline">
                      {expandedId === featured.id ? 'Show less ↑' : 'Read more →'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Article Overview</p>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No articles in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTag === 'All' ? posts.filter(p => !p.featured) : filtered).map(post => (
                <div
                  key={post.id}
                  onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                  className="bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group flex flex-col"
                >
                  <div className="text-4xl mb-4">{post.image}</div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: (post as any).tagColor, color: (post as any).tagTextColor }}
                    >
                      {post.tag}
                    </span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug group-hover:text-green-700 transition-colors">{post.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed flex-1">{post.excerpt}</p>

                  {expandedId === post.id && (
                    <div className="mt-3 text-xs text-gray-700 leading-relaxed border-t border-gray-100 pt-3 space-y-2">
                      {post.id === '2' && <>
                        <p>Zeflash's onboard diagnostics continuously monitor cell voltage deviation, thermal behaviour, and charge-discharge cycles. When anomalies exceed thresholds, an alert is instantly pushed to the EVChamp app.</p>
                        <p>Early users report a 40% reduction in unexpected battery-related breakdowns after switching to Zeflash-monitored vehicles.</p>
                      </>}
                      {post.id === '3' && <>
                        <p>Charging infrastructure yields are driven by utilisation rates, energy arbitrage, and carbon credit generation. INVESTYZ structures these as tokenised assets on Polygon, enabling fractional ownership.</p>
                        <p>Early investors in EV charging networks have seen 12–18% IRR benchmarks in comparable markets globally.</p>
                      </>}
                      {post.id === '4' && <>
                        <p>Case 1: A Pune-based Ather owner ran out of charge 20km from the nearest charger. EVChamp RSA dispatched a portable charging unit within 35 minutes.</p>
                        <p>Case 2: A charging port failure on the Mumbai-Pune expressway was resolved with a tow and loaner vehicle arranged within the hour.</p>
                      </>}
                      {post.id === '5' && <>
                        <p>Always request a Zeflash battery health report. Check State of Health (SoH) — anything below 80% warrants negotiation or avoidance. Verify the IMEI and OBD history. Confirm warranty transferability with the OEM.</p>
                        <p>EVChamp's marketplace pre-screens all listings, so buyers get a verified report before making contact with sellers.</p>
                      </>}
                      {post.id === '6' && <>
                        <p>EVChamp has onboarded 200+ service partners across 18 cities. Each partner undergoes technical certification, tool verification, and customer rating checks before listing.</p>
                        <p>By Q4 2026, we aim to cover all state capitals and 50 tier-2 cities with at least three certified service centres each.</p>
                      </>}
                      {post.id === '7' && <>
                        <p>ZipBattery's model processes over 200 data points per session — from ambient temperature and charging speed to motor load and regenerative braking efficiency.</p>
                        <p>The result: a battery score, predicted remaining range accuracy, and personalised charging advice that improves battery longevity by up to 25%.</p>
                      </>}
                      {post.id === '8' && <>
                        <p>Our field team drove 11,000+ km across 14 states to map stations. Key findings: urban density is high but rural coverage remains sparse. Fast chargers (DC 50kW+) account for only 18% of total stations.</p>
                        <p>EVChamp's map is updated in real-time and integrated into the app, with live availability status where supported by station operators.</p>
                      </>}
                      {post.id === '9' && <>
                        <p>FAME III allocates ₹20,000 crore for EV incentives through 2028, including ₹7,500 crore specifically for public charging infrastructure. Two-wheelers and three-wheelers receive direct purchase subsidies.</p>
                        <p>EVChamp users can access service centre and charging station lists aligned to FAME-III-registered operators directly inside the app.</p>
                      </>}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: post.authorColor }}
                      >
                        {post.authorInitial}
                      </div>
                      <span className="text-xs text-gray-400">{post.author} · {post.date}</span>
                    </div>
                    <span className="text-xs text-green-600 font-semibold">
                      {expandedId === post.id ? '↑ Less' : 'Read →'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-br from-gray-950 to-slate-900 text-white py-14">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl text-center">
          <span className="text-2xl mb-4 block">📬</span>
          <h2 className="text-2xl font-bold mb-3">Stay Ahead of the EV Curve</h2>
          <p className="text-gray-400 text-sm mb-6">Get the latest EVChamp insights, platform updates, and investment opportunities delivered to your inbox.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-green-400"
            />
            <button
              onClick={() => navigate('/contact')}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-all flex-shrink-0"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
