import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle, Users, TrendingUp, Zap, Star, Building2,
  MapPin, Briefcase, ChevronRight, ChevronLeft, Award, Lightbulb,
  DollarSign, Shield, Clock, BarChart3, Target, Sparkles, Menu, X,
  Play, Quote, IndianRupee, Rocket, Globe, MessageSquare, ChevronDown
} from "lucide-react";

/* ─── tiny hook: fires once when element enters viewport ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── animated counter ─── */
function Counter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [visible, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── DATA ─── */
const partners = [
  { name: "Tata Capital", logo: "/partner/tatacapital.jpg" },
  { name: "LTI Mindtree", logo: "/partner/ltimind.jpg" },
  { name: "Tech Mahindra", logo: "/partner/techahindra.png" },
  { name: "Asian Paints", logo: "/partner/asianpaints.png" },
  { name: "Aditya Birla", logo: "/partner/adityabirla.jpg" },
  { name: "Bajaj Capital", logo: "/partner/bajajcapital.png" },
  { name: "Indusind Bank", logo: "/partner/indusindbank.jpg" },
  { name: "Motilal Oswal", logo: "/partner/motilaloswal.jpg" },
  { name: "Muthoot Finance", logo: "/partner/muthootfinance.jpg" },
  { name: "Great Learning", logo: "/partner/greatlearning.jpg" },
  { name: "RBL Bank", logo: "/partner/rbl.jpg" },
  { name: "Sun TV", logo: "/partner/suntv.jpg" },
  { name: "Tiger Analytics", logo: "/partner/tigeranalytics.webp" },
  { name: "Brillio", logo: "/partner/brillio.jpg" },
  { name: "Coherent", logo: "/partner/coherent.png" },
  { name: "AU Small Finance", logo: "/partner/ausmallfinance.jpg" },
];

const testimonials = [
  { name: "Priya Sharma", role: "Senior Recruiter", company: "TechHire Solutions", rating: 5, text: "RecruiterV transformed how I work. The commission structure is transparent, and I've closed more positions in 3 months than the entire previous year. The platform is intuitive and support is excellent!", avatar: "PS" },
  { name: "Rahul Mehta", role: "Independent Recruiter", company: "Freelance", rating: 5, text: "Finding quality leads was always a challenge. RecruiterV changed that completely. The real-time job updates and high-commission roles helped me triple my income in under 6 months.", avatar: "RM" },
  { name: "Anjali Patel", role: "Recruitment Manager", company: "Staffing Pro", rating: 5, text: "The quality of clients on RecruiterV is outstanding. I love filtering jobs by commission. The platform made our team far more efficient — and we've built lasting client relationships.", avatar: "AP" },
  { name: "Vikram Singh", role: "HR Consultant", company: "Talent Bridge", rating: 5, text: "What sets RecruiterV apart is the community. I've networked with top recruiters, learned best practices, and grown my business exponentially. The recognition program keeps me motivated!", avatar: "VS" },
];

const roles = [
  { icon: Users, title: "Freelance Recruiter", tag: "Source & Earn", description: "Access verified mandates, submit curated CVs, and earn competitive commissions with full transparency and coaching support.", link: "/main/area", gradient: "from-blue-500 to-blue-700", light: "bg-blue-50", accent: "text-blue-600" },
  { icon: Award, title: "Hiring Guru", tag: "Coach & Scale", description: "Guide recruiters on mandate clarity and screening quality. Get measured by outcomes and closures — not just activity.", link: "/coach", gradient: "from-orange-500 to-orange-600", light: "bg-orange-50", accent: "text-orange-600" },
  { icon: Lightbulb, title: "Industry Expert", tag: "Advise & Monetise", description: "Validate role fit and candidate expectations. Reduce hiring mismatches and monetise your domain expertise selectively.", link: "/expert", gradient: "from-purple-500 to-purple-700", light: "bg-purple-50", accent: "text-purple-600" },
  { icon: Building2, title: "Corporate TA Team", tag: "Hire Smarter", description: "Get a governed recruitment ecosystem with coached freelancers, domain experts, and enterprise-grade accountability.", link: "/corporate", gradient: "from-emerald-500 to-emerald-700", light: "bg-emerald-50", accent: "text-emerald-600" },
];

const steps = [
  { num: "01", icon: Users, title: "Create Your Profile", desc: "Sign up free in minutes. Choose your role — recruiter, coach, expert, or corporate — and set your preferences.", color: "blue" },
  { num: "02", icon: Target, title: "Access Live Mandates", desc: "Browse verified, capped-submission positions from 100+ companies. Filter by industry, location, and CTC.", color: "orange" },
  { num: "03", icon: Rocket, title: "Submit & Get Coached", desc: "Upload curated CVs, get feedback from coaches and domain experts, and improve shortlist quality with every submission.", color: "blue" },
  { num: "04", icon: IndianRupee, title: "Earn & Grow", desc: "Track placements in real-time, receive transparent commissions, and build your reputation in India's top recruitment community.", color: "orange" },
];

const faqs = [
  { q: "Is it free to join RecruiterV?", a: "Yes — registration is 100% free for recruiters, coaches, and industry experts. There are no hidden fees or monthly charges." },
  { q: "How does RecruiterV limit submissions?", a: "Each position has a capped number of CV submissions. This reduces noise for clients and increases your chances of a shortlist — instead of competing with hundreds of CVs." },
  { q: "How and when do I get paid?", a: "Commissions are paid directly after successful placement confirmation. You can track your earnings and payout status in real-time on your dashboard." },
  { q: "What support do I get as a recruiter?", a: "Every recruiter has access to Hiring Gurus (coaches) and Industry Experts who review mandates, give feedback on submissions, and help close positions faster." },
  { q: "Can I work on multiple positions at once?", a: "Yes. Your plan determines how many positions you can actively work on. You can upgrade or release positions at any time." },
];

/* ─── COMPONENT ─── */
export default function HomepageV2() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tIdx, setTIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [heroRef, heroVisible] = useInView(0.1);
  const [statsRef, statsVisible] = useInView(0.2);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="font-sans text-gray-900 bg-white overflow-x-hidden">

      {/* ══════════════════ NAV ══════════════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center">
            <img src="/recruitorV.png" alt="RecruiterV" className="h-10 lg:h-12 w-auto object-contain" />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {[["For Recruiters", "/main/area"], ["For Corporates", "/corporate"], ["How It Works", "#how-it-works"], ["Blog", "/blog"]].map(([label, href]) => (
              <a key={label} href={href} className={`text-sm font-semibold transition-colors ${scrolled ? "text-gray-700 hover:text-blue-600" : "text-white/90 hover:text-white"}`}>{label}</a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/log_rec" className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}>Sign In</Link>
            <Link to="/reg" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-0.5">
              Get Started Free
            </Link>
          </div>

          <button onClick={() => setMobileOpen(v => !v)} className={`lg:hidden p-2 rounded-lg ${scrolled ? "text-gray-700" : "text-white"}`}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {[["For Recruiters", "/main/area"], ["For Corporates", "/corporate"], ["Blog", "/blog"]].map(([l, h]) => (
              <a key={l} href={h} className="block text-gray-700 font-semibold py-2">{l}</a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link to="/log_rec" className="flex-1 text-center py-3 border-2 border-gray-200 rounded-xl font-semibold text-sm">Sign In</Link>
              <Link to="/reg" className="flex-1 text-center py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-sm">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 overflow-hidden">
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div ref={heroRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 lg:pt-36 lg:pb-28 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className={`transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles size={14} className="animate-pulse" />
              India's Structured Recruitment Ecosystem
            </div>
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6">
              Recruitment<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300">
                Gigs That Pay.
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-blue-200 leading-relaxed mb-8 max-w-xl">
              Join India's fastest-growing recruitment community. Work on verified mandates, get coached by industry experts, and earn commissions with full transparency — no middlemen, no noise.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link to="/reg" className="group inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-7 py-4 rounded-2xl font-bold text-base shadow-2xl shadow-orange-500/30 transition-all transform hover:-translate-y-1">
                Start Earning Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-7 py-4 rounded-2xl font-semibold text-base transition-all">
                <Play size={16} className="fill-white" />
                See How It Works
              </a>
            </div>

            {/* Social proof avatars */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {["A","B","C","D","E"].map((l,i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-orange-400 border-2 border-blue-900 flex items-center justify-center text-white font-bold text-xs">{l}</div>
                ))}
              </div>
              <div className="text-blue-200 text-sm">
                <span className="text-white font-bold">2,000+</span> recruiters already earning
              </div>
            </div>
          </div>

          {/* Right — floating metric cards */}
          <div className={`relative transition-all duration-1000 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Active Clients", value: "20+", icon: Building2, grad: "from-orange-500 to-orange-600", delay: "0s" },
                { label: "Open Positions", value: "500+", icon: Briefcase, grad: "from-blue-500 to-blue-600", delay: "0.1s" },
                { label: "CTC Range", value: "₹6L–60L", icon: IndianRupee, grad: "from-emerald-500 to-emerald-600", delay: "0.2s" },
                { label: "Response Time", value: "< 24 hrs", icon: Zap, grad: "from-purple-500 to-purple-600", delay: "0.3s" },
              ].map(({ label, value, icon: Icon, grad, delay }) => (
                <div key={label} className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-500 group" style={{ animation: `fadeUp 0.6s ease-out ${delay} both` }}>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="text-2xl font-black text-white mb-1">{value}</div>
                  <div className="text-blue-300 text-sm font-medium">{label}</div>
                </div>
              ))}
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-gray-100 animate-float">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Latest closure</div>
                <div className="text-sm font-bold text-gray-900">₹18L CTC · IT Sector</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-xs uppercase tracking-widest">
          <span>Scroll</span>
          <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ══════════════════ MARQUEE LOGOS ══════════════════ */}
      <section className="bg-gray-50 border-y border-gray-100 py-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-3 px-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Trusted by Leading Companies</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
        </div>
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {[...partners, ...partners].map((p, i) => (
            <div key={i} className="inline-flex items-center gap-2 shrink-0 bg-white border border-gray-100 rounded-xl px-5 py-3 shadow-sm">
              <img src={p.logo} alt={p.name} className="h-8 w-auto object-contain" />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ STATS BAR ══════════════════ */}
      <section ref={statsRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: 2000, suf: "+", label: "Active Recruiters", sub: "and growing every week" },
              { num: 500, suf: "+", label: "Live Mandates", sub: "across 12 industries" },
              { num: 100, suf: "+", label: "Hiring Partners", sub: "top Indian companies" },
              { num: 24, suf: " hrs", label: "Avg. Response Time", sub: "on every submission" },
            ].map(({ num, suf, label, sub }) => (
              <div key={label} className={`text-center transition-all duration-700 ${statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
                  {statsVisible ? <Counter target={num} suffix={suf} /> : `0${suf}`}
                </div>
                <div className="font-bold text-gray-900 mb-1">{label}</div>
                <div className="text-gray-400 text-sm">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ WHO WE SERVE ══════════════════ */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader badge="Built for Everyone" title="Who We Serve" subtitle="A skill-first recruitment ecosystem — whether you source, coach, advise, or hire." />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {roles.map((r, i) => {
              const Icon = r.icon;
              const [ref, vis] = useInView();
              return (
                <div ref={ref} key={r.title} className={`group bg-white border-2 border-gray-100 hover:border-transparent rounded-3xl p-7 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <div className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${r.light} ${r.accent} mb-3`}>{r.tag}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{r.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1">{r.description}</p>
                  <div className="mt-6 flex gap-3">
                    <Link to={r.link} className="flex-1 text-center py-2.5 border-2 border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-all">Learn More</Link>
                    <Link to="/reg" className={`flex-1 text-center py-2.5 bg-gradient-to-r ${r.gradient} text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all`}>Join</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader badge="Simple Process" title="How It Works" subtitle="From sign-up to your first commission in 4 focused steps." />

          <div className="mt-16 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-orange-200 to-blue-200" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const [ref, vis] = useInView();
                return (
                  <div ref={ref} key={s.num} className={`relative text-center transition-all duration-700 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${i * 100}ms` }}>
                    <div className={`relative z-10 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-xl ${s.color === "blue" ? "bg-gradient-to-br from-blue-500 to-blue-700" : "bg-gradient-to-br from-orange-500 to-orange-600"}`}>
                      <Icon size={28} className="text-white" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-gray-200 text-[10px] font-black text-gray-700 flex items-center justify-center">{s.num}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link to="/reg" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:-translate-y-1">
              Start Your Journey <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ WHY RECRUITERVV ══════════════════ */}
      <section className="py-24 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader badge="Why RecruiterV" title="A Different Kind of Recruitment Platform" subtitle="We didn't just build another job board. We built a structured ecosystem where quality beats quantity." light />

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Capped Submissions", desc: "Each position limits how many CVs can be submitted. Less noise. Better shortlists. Higher closing rates for you." },
              { icon: Award, title: "Coach-Backed Quality", desc: "Hiring Gurus review mandates and give feedback on your CVs — turning every submission into a learning opportunity." },
              { icon: Lightbulb, title: "Domain Expert Validation", desc: "Industry experts validate role fit before CVs reach the client, reducing mismatches and boosting your credibility." },
              { icon: DollarSign, title: "Transparent Commissions", desc: "See the commission upfront on every position. No hidden deductions. Track payouts live from your dashboard." },
              { icon: Globe, title: "100+ Company Network", desc: "Work directly with Tata Capital, LTI Mindtree, Tech Mahindra, Bajaj, and 100+ more. No middlemen." },
              { icon: BarChart3, title: "Real-Time Analytics", desc: "Monitor your submissions, shortlists, and earnings with intuitive dashboards built for freelance recruiters." },
            ].map((f, i) => {
              const Icon = f.icon;
              const [ref, vis] = useInView();
              return (
                <div ref={ref} key={f.title} className={`bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-3xl p-7 transition-all duration-500 group ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${i * 70}ms` }}>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-blue-200 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionHeader badge="Success Stories" title="Recruiters Love RecruiterV" subtitle="Real stories from real recruiters who transformed their careers on our platform." />

          <div className="mt-14 relative">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-12">
              <Quote size={40} className="text-orange-200 mb-6" />
              <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed font-medium mb-8">"{testimonials[tIdx].text}"</p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                    {testimonials[tIdx].avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonials[tIdx].name}</div>
                    <div className="text-gray-500 text-sm">{testimonials[tIdx].role} · {testimonials[tIdx].company}</div>
                    <div className="flex gap-0.5 mt-1">
                      {Array(5).fill(0).map((_,i) => <Star key={i} size={12} className="fill-orange-400 text-orange-400" />)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setTIdx(i => (i - 1 + testimonials.length) % testimonials.length)} className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-blue-300 flex items-center justify-center transition-all">
                    <ChevronLeft size={18} className="text-gray-600" />
                  </button>
                  <button onClick={() => setTIdx(i => (i + 1) % testimonials.length)} className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-blue-300 flex items-center justify-center transition-all">
                    <ChevronRight size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTIdx(i)} className={`h-2 rounded-full transition-all ${i === tIdx ? "w-8 bg-gradient-to-r from-blue-600 to-orange-500" : "w-2 bg-gray-300"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionHeader badge="FAQ" title="Common Questions" subtitle="Everything you need to know before joining." />

          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border-2 border-gray-100 hover:border-blue-200 rounded-2xl overflow-hidden transition-all">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <span className="font-bold text-gray-900 pr-4">{f.q}</span>
                  <ChevronDown size={20} className={`text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <section className="py-24 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 to-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-orange-300 px-5 py-2.5 rounded-full text-sm font-semibold mb-8">
            <Rocket size={14} className="animate-pulse" />
            Zero to First Placement in Days
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Ready to Turn Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">Network into Income?</span>
          </h2>
          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join 2,000+ recruiters, coaches, and experts already working on live mandates with India's most structured recruitment platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/reg" className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/30 transition-all transform hover:-translate-y-1">
              Get Started for Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="https://www.recruiterv.com/apply" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-5 rounded-2xl font-semibold text-lg transition-all">
              Browse Open Positions
            </a>
          </div>
          <p className="text-blue-400 text-sm mt-6">No credit card required · Free to join · Start in minutes</p>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="bg-slate-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <img src="/recruitorV.png" alt="RecruiterV" className="h-10 w-auto object-contain mb-4 brightness-0 invert" />
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm">India's structured recruitment ecosystem connecting freelance recruiters, coaches, experts, and companies for quality hiring at scale.</p>
              <div className="flex gap-3 mt-5">
                {["LinkedIn", "Twitter", "Instagram"].map(s => (
                  <a key={s} href="#" className="px-4 py-2 border border-gray-700 hover:border-gray-500 rounded-xl text-xs font-semibold transition-all hover:text-white">{s}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Platform</div>
              {[["For Recruiters","/main/area"],["For Coaches","/coach"],["For Experts","/expert"],["For Corporates","/corporate"],["Browse Jobs","https://www.recruiterv.com/apply"]].map(([l,h]) => (
                <a key={l} href={h} className="block text-sm hover:text-white transition-colors mb-2">{l}</a>
              ))}
            </div>
            <div>
              <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Company</div>
              {[["About Us","/about"],["Blog","/blog"],["Register","/reg"],["Sign In","/log_rec"]].map(([l,h]) => (
                <Link key={l} to={h} className="block text-sm hover:text-white transition-colors mb-2">{l}</Link>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <div>© {new Date().getFullYear()} RecruiterV. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════ GLOBAL STYLES ══════════════════ */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

/* ─── reusable section header ─── */
function SectionHeader({ badge, title, subtitle, light = false }) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${light ? "bg-white/10 border border-white/20 text-orange-300" : "bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700"}`}>
        <Sparkles size={13} />
        {badge}
      </div>
      <h2 className={`text-4xl md:text-5xl font-black mb-4 ${light ? "text-white" : "text-gray-900"}`}>
        {title.split(" ").map((w, i, a) => i === a.length - 1
          ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500"> {w}</span>
          : <span key={i}>{w} </span>
        )}
      </h2>
      <p className={`text-lg max-w-2xl mx-auto leading-relaxed ${light ? "text-blue-200" : "text-gray-500"}`}>{subtitle}</p>
    </div>
  );
}
