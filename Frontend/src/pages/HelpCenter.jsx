import React, { useContext, useMemo, useState } from 'react';
import { UserStateContext } from '../context/AuthPro';
import { HelpCircle, Video, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';

const HelpCenter = () => {
  const { user } = useContext(UserStateContext);
  const role = (user?.roleCategory || 'Recruiter').toLowerCase();

  const content = useMemo(() => {
    if (role === 'coach') {
      return {
        title: 'Coach Help Center',
        videoUrl: 'https://www.youtube.com/watch?v=-4K5DgEkLLM',
        guide: [
          {
            title: 'View Assigned Mandates',
            description: 'Open the Dashboard to see positions where your guidance is requested.',
            bullets: ['Use filters to focus on client or location', 'Open position detail to see JD and expectations']
          },
          {
            title: 'Prepare Guidance',
            description: 'Review role fit, must-haves and validation points before responding.',
            bullets: ['Identify screening criteria', 'Note common mismatches to avoid']
          },
          {
            title: 'Respond to Requests',
            description: 'Use Requests to accept and add structured guidance for the recruiter.',
            bullets: ['Provide clear pass/fail signals', 'Add tactical tips for sourcing and screening']
          },
          {
            title: 'Share Improvement Tips',
            description: 'Offer actionable suggestions tied to outcomes, not generic advice.',
            bullets: ['Focus on shortlist quality', 'Link advice to closure probability']
          },
          {
            title: 'Track Outcomes',
            description: 'Monitor how guidance impacted shortlist and closures.',
            bullets: ['Use status updates to refine guidance', 'Iterate based on feedback']
          }
        ]
      };
    }
    if (role === 'expert') {
      return {
        title: 'Expert Help Center',
        videoUrl: 'https://www.youtube.com/watch?v=-4K5DgEkLLM',
        guide: [
          {
            title: 'See Invited Roles',
            description: 'Open the Dashboard and review roles that need your validation.',
            bullets: ['Check role scope and seniority', 'Verify constraints and expectations']
          },
          {
            title: 'Review Expectations',
            description: 'Read client notes and JD details to align validation criteria.',
            bullets: ['Identify critical success factors', 'Confirm non-negotiables']
          },
          {
            title: 'Accept or Decline',
            description: 'Use Requests to accept tasks you can add value to.',
            bullets: ['Decline quickly if misaligned', 'Accept and set validation window']
          },
          {
            title: 'Provide Validation',
            description: 'Give clear fit assessment tied to role expectations.',
            bullets: ['Flag red lines early', 'Recommend next steps when borderline']
          },
          {
            title: 'Track Follow-ups',
            description: 'Ensure decisions and feedback loops are recorded.',
            bullets: ['Use status updates to close the loop', 'Capture learning for future roles']
          }
        ]
      };
    }
    return {
      title: 'Recruiter Help Center',
      videoUrl: 'https://www.youtube.com/watch?v=ekZi5haJWbA',
      guide: [
        {
          title: 'Pick Positions',
          description: 'Open Open Positions and select mandates you can deliver on.',
          bullets: ['Filter by client, location and experience', 'Check commission and position ID']
        },
        {
          title: 'Request Access',
          description: 'Send an access request and wait for ClientSPOC approval.',
          bullets: ['Explain your plan briefly', 'Monitor approval/rejection status']
        },
        {
          title: 'Submit Candidates',
          description: 'Add accurate candidate details and upload CV URL.',
          bullets: ['Avoid duplicates with email/phone check', 'Align skills and notice period']
        },
        {
          title: 'Get Help',
          description: 'Use Coach/Expert requests when you need guidance.',
          bullets: ['Select the right helper by name', 'Include context for faster response']
        },
        {
          title: 'Track Status',
          description: 'Monitor candidate and position status to prioritize effort.',
          bullets: ['Respond quickly to feedback', 'Iterate sourcing based on outcomes']
        }
      ]
    };
  }, [role]);

  const Layout = () => {
    const { isSidebarCollapsed } = useContext(SidebarContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isClientSpoc = role === 'clientspoc';

    const renderSidebar = () => {
      if (isClientSpoc) return <ClientSpocSidebar />;
      return <Sidebar />;
    };

    const toEmbed = (url) => {
      try {
        if (!url) return '';
        if (url.includes('youtube.com/watch?v=')) {
          const id = url.split('watch?v=')[1].split('&')[0];
          return `https://www.youtube.com/embed/${id}`;
        }
        if (url.includes('youtu.be/')) {
          const id = url.split('youtu.be/')[1].split('?')[0];
          return `https://www.youtube.com/embed/${id}`;
        }
        return url;
      } catch {
        return url;
      }
    };

    return (
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        </header>

        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <HelpCircle size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{content.title}</h1>
                  <p className="text-blue-100 text-sm">Role-specific guidance, video and steps</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                    <Video size={18} className="text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">How it works</span>
                  </div>
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full"
                      src={toEmbed(content.videoUrl)}
                      title="Help Center Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                    <FileText size={18} className="text-orange-600" />
                    <span className="text-sm font-semibold text-gray-700">Step-by-step guide</span>
                  </div>
                  <div className="p-2">
                    {content.guide.map((item, idx) => (
                      <AccordionItem key={idx} title={item.title} defaultOpen={idx === 0}>
                        <div className="space-y-2 text-sm text-gray-800">
                          <p>{item.description}</p>
                          {Array.isArray(item.bullets) && item.bullets.length > 0 && (
                            <ul className="list-disc pl-5 space-y-1">
                              {item.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </AccordionItem>
                    ))}
                    <div className="mt-3 px-3 pb-3 text-xs text-gray-500">
                      For detailed FAQs and troubleshooting, contact support at admin@recruiterv.com
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  };

  const AccordionItem = ({ title, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className="border-b border-gray-100">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {open ? (
            <ChevronDown size={18} className="text-gray-600" />
          ) : (
            <ChevronRight size={18} className="text-gray-600" />
          )}
        </button>
        {open && (
          <div className="px-3 pb-3">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          {role === 'clientspoc' ? <ClientSpocSidebar /> : <Sidebar />}
        </aside>
        <Layout />
      </div>
    </SidebarProvider>
  );
};

export default HelpCenter;
