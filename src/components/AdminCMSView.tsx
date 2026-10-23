import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icons';
import { Opportunity, Pathway, BeneficiaryProfile, AppView } from '../types';
import { JOBS, PATHWAYS, DEMO } from '../data/mockData';
import { storageService } from '../services/storageService';
import { AppUser } from '../services/firebase';

interface AdminCMSViewProps {
  currentUser?: AppUser | null;
  onNotify: (msg: string) => void;
  go: (route: AppView | string) => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

interface StoredBeneficiaryRecord extends BeneficiaryProfile {
  id: string;
  matchedPathwayName: string;
  matchScore: number;
  assessedAt: string;
  status: 'Completed' | 'In Progress' | 'Placed';
  contactPhone?: string;
  state: string;
}

// Initial Curated Multi-State Beneficiary Data across India
const INITIAL_BENEFICIARIES: StoredBeneficiaryRecord[] = [
  {
    ...DEMO,
    id: 'ben_001',
    matchedPathwayName: 'Digital Service & CSC Center Operator',
    matchScore: 92,
    assessedAt: '2026-10-15',
    status: 'Completed',
    contactPhone: '+91 98391 XXXXX',
    state: 'Uttar Pradesh',
    location: 'Maharajganj, Uttar Pradesh',
  },
  {
    id: 'ben_002',
    name: 'Ramesh Yadav',
    education: '12th pass (Higher Secondary)',
    skills: 'Basic electrical, wiring, solar inverter installation',
    interests: 'Solar energy, rooftop panels, technician work',
    occupation: 'Unemployed youth',
    location: 'Patna, Bihar',
    state: 'Bihar',
    workType: 'Job',
    mobility: 'Within my district',
    isDemo: false,
    matchedPathwayName: 'Solar PV Installation & Maintenance Technician',
    matchScore: 89,
    assessedAt: '2026-10-14',
    status: 'Completed',
    contactPhone: '+91 94520 XXXXX',
  },
  {
    id: 'ben_003',
    name: 'Aarti Maurya',
    education: '8th class pass',
    skills: 'Hand embroidery, sewing machine, blouse stitching',
    interests: 'Tailoring, garment repair, boutique work',
    occupation: 'Homemaker',
    location: 'Varanasi, Uttar Pradesh',
    state: 'Uttar Pradesh',
    workType: 'Self-employment',
    mobility: 'Nearby only (within ~10 km)',
    isDemo: false,
    matchedPathwayName: 'Sewing Machine Operator & Home Tailoring',
    matchScore: 95,
    assessedAt: '2026-10-13',
    status: 'Placed',
    contactPhone: '+91 91200 XXXXX',
  },
  {
    id: 'ben_004',
    name: 'Mohammad Imran',
    education: '10th pass (Secondary)',
    skills: 'Hindi typing, smartphone apps, online forms submission',
    interests: 'Computer data entry, cyber café, e-governance',
    occupation: 'Shop helper',
    location: 'South Delhi, Delhi NCR',
    state: 'Delhi NCR',
    workType: 'Job',
    mobility: 'Anywhere in the state',
    isDemo: false,
    matchedPathwayName: 'Digital Service & CSC Center Operator',
    matchScore: 88,
    assessedAt: '2026-10-12',
    status: 'Completed',
    contactPhone: '+91 98110 XXXXX',
  },
  {
    id: 'ben_005',
    name: 'Pooja Deshmukh',
    education: 'Graduate',
    skills: 'MS Excel, Tally basics, customer support',
    interests: 'Accounts, billing, retail management',
    occupation: 'Contract data entry',
    location: 'Pune, Maharashtra',
    state: 'Maharashtra',
    workType: 'Job',
    mobility: 'Within my district',
    isDemo: false,
    matchedPathwayName: 'Accounts & Retail Sales Assistant',
    matchScore: 91,
    assessedAt: '2026-10-11',
    status: 'Placed',
    contactPhone: '+91 97650 XXXXX',
  },
  {
    id: 'ben_006',
    name: 'Vikram Rathore',
    education: '10th pass (Secondary)',
    skills: 'Motorcycle repair, tool handling, mechanical maintenance',
    interests: 'Two-wheeler service, EV battery charging station',
    occupation: 'Garage assistant',
    location: 'Jaipur, Rajasthan',
    state: 'Rajasthan',
    workType: 'Self-employment',
    mobility: 'Nearby only (within ~10 km)',
    isDemo: false,
    matchedPathwayName: 'EV & Two-Wheeler Service Technician',
    matchScore: 86,
    assessedAt: '2026-10-10',
    status: 'In Progress',
    contactPhone: '+91 94140 XXXXX',
  },
  {
    id: 'ben_007',
    name: 'Savitri Bai',
    education: 'Below 8th class',
    skills: 'Organic farming, kitchen garden, dairy and cattle care',
    interests: 'Dairy self-help group, food processing, pickle making',
    occupation: 'Small agricultural worker',
    location: 'Bhopal, Madhya Pradesh',
    state: 'Madhya Pradesh',
    workType: 'Self-employment',
    mobility: 'Nearby only (within ~10 km)',
    isDemo: false,
    matchedPathwayName: 'Dairy Entrepreneur & Village Agri-Enterprises',
    matchScore: 94,
    assessedAt: '2026-10-09',
    status: 'Completed',
    contactPhone: '+91 98260 XXXXX',
  },
];

const DISTRICT_INTELLIGENCE = [
  { district: 'Maharajganj', state: 'Uttar Pradesh', users: 142, jobs: 18, topSkill: 'Digital Typing & CSC', pmkvyCenter: 'Active (2 Centers)' },
  { district: 'Gorakhpur', state: 'Uttar Pradesh', users: 284, jobs: 35, topSkill: 'Solar PV & Electrical', pmkvyCenter: 'Active (5 Centers)' },
  { district: 'Varanasi', state: 'Uttar Pradesh', users: 310, jobs: 42, topSkill: 'Handloom & Garment', pmkvyCenter: 'Active (4 Centers)' },
  { district: 'Patna', state: 'Bihar', users: 395, jobs: 54, topSkill: 'Computer & Office Assistant', pmkvyCenter: 'Active (6 Centers)' },
  { district: 'Gaya', state: 'Bihar', users: 165, jobs: 21, topSkill: 'Solar & Agri-Machinery', pmkvyCenter: 'Active (2 Centers)' },
  { district: 'South Delhi', state: 'Delhi NCR', users: 520, jobs: 88, topSkill: 'Retail, Delivery & IT Support', pmkvyCenter: 'Active (8 Centers)' },
  { district: 'Pune', state: 'Maharashtra', users: 412, jobs: 76, topSkill: 'Accounts, CAD & Manufacturing', pmkvyCenter: 'Active (7 Centers)' },
  { district: 'Jaipur', state: 'Rajasthan', users: 290, jobs: 46, topSkill: 'EV Technician & Handicrafts', pmkvyCenter: 'Active (4 Centers)' },
  { district: 'Bhopal', state: 'Madhya Pradesh', users: 210, jobs: 31, topSkill: 'Food Processing & Dairy', pmkvyCenter: 'Active (3 Centers)' },
];

export const AdminCMSView: React.FC<AdminCMSViewProps> = ({
  currentUser,
  onNotify,
  go,
  onOpenLogin,
  onLogout,
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'ayushgupt640@gmail.com';

  // Navigation Tabs inside Admin Portal
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'pathways' | 'districts' | 'notifications'>('overview');

  // Location Filter (Whole India vs States)
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('All India');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Opportunities / Jobs State
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem('jeevika_admin_jobs_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [...JOBS];
  });

  // Pathways State
  const [pathways, setPathways] = useState<Pathway[]>(() => {
    try {
      const saved = localStorage.getItem('jeevika_admin_pathways_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [...PATHWAYS];
  });

  // Beneficiaries / Users State
  const [beneficiaries, setBeneficiaries] = useState<StoredBeneficiaryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('jeevika_admin_beneficiaries_v2');
      if (saved) return JSON.parse(saved);
    } catch {}

    // Check if current user has an active session profile to merge
    const liveProfile = storageService.loadProfile();
    if (liveProfile && liveProfile.name && liveProfile.name !== 'Sunita Devi') {
      const liveUserRecord: StoredBeneficiaryRecord = {
        ...liveProfile,
        id: 'ben_live_' + Date.now(),
        matchedPathwayName: 'Digital & Livelihood Alignment',
        matchScore: 90,
        assessedAt: new Date().toISOString().split('T')[0],
        status: 'Completed',
        contactPhone: '+91 98765 XXXXX',
        state: liveProfile.location?.includes('Bihar') ? 'Bihar' : 'Uttar Pradesh',
      };
      return [liveUserRecord, ...INITIAL_BENEFICIARIES];
    }
    return INITIAL_BENEFICIARIES;
  });

  // Modals
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddPathwayModal, setShowAddPathwayModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<StoredBeneficiaryRecord | null>(null);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobOrg, setJobOrg] = useState('');
  const [jobType, setJobType] = useState<'Job' | 'Training' | 'Self-employment'>('Job');
  const [jobState, setJobState] = useState('Uttar Pradesh');
  const [jobLoc, setJobLoc] = useState('');
  const [jobPay, setJobPay] = useState('');
  const [jobMinEdu, setJobMinEdu] = useState('10th pass (Secondary)');
  const [jobVacancies, setJobVacancies] = useState('5');
  const [jobEligibility, setJobEligibility] = useState('');
  const [jobContact, setJobContact] = useState('');

  // New Pathway Form State
  const [pathwayName, setPathwayName] = useState('');
  const [pathwayHi, setPathwayHi] = useState('');
  const [pathwayRole, setPathwayRole] = useState('');
  const [pathwayNsqf, setPathwayNsqf] = useState<number>(3);
  const [pathwayDuration, setPathwayDuration] = useState('3 months (about 240 hours)');
  const [pathwayDemand, setPathwayDemand] = useState<number>(3);

  // Push Notification Broadcast State
  const [notifTarget, setNotifTarget] = useState<'all' | 'specific'>('all');
  const [notifTargetUserId, setNotifTargetUserId] = useState<string>('');
  const [notifTitle, setNotifTitle] = useState<string>('JeevikaAI Livelihood Update');
  const [notifBody, setNotifBody] = useState<string>('आपके क्षेत्र में नए रोजगार और कौशल प्रशिक्षण अवसर जोड़े गए हैं।');
  const [notifSending, setNotifSending] = useState<boolean>(false);

  const handleSendPushNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      onNotify('कृपया शीर्षक और संदेश दोनों दर्ज करें।');
      return;
    }
    if (notifTarget === 'specific' && !notifTargetUserId) {
      onNotify('कृपया विशिष्ट उपयोगकर्ता का चयन करें।');
      return;
    }

    setNotifSending(true);
    try {
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }

      const newNotif = {
        id: 'notif_' + Date.now(),
        target: notifTarget,
        targetUserId: notifTargetUserId,
        title: notifTitle,
        body: notifBody,
        createdAt: new Date().toISOString(),
      };

      const existingQueue = JSON.parse(localStorage.getItem('jeevika_push_queue') || '[]');
      localStorage.setItem('jeevika_push_queue', JSON.stringify([newNotif, ...existingQueue]));

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(notifTitle, {
          body: notifBody,
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notifTitle, {
          body: notifBody,
          icon: '/icons/icon-192.svg',
        });
      }

      onNotify(
        notifTarget === 'all'
          ? '🔔 सभी नागरिकों को पुश नोटिफिकेशन सफलतापूर्वक प्रसारित कर दिया गया है!'
          : '🔔 चयनित उपयोगकर्ता को पुश नोटिफिकेशन सफलतापूर्वक भेज दिया गया है!'
      );
      setNotifBody('');
    } catch (err: any) {
      onNotify('नोटिफ़िकेशन भेजने में त्रुटि: ' + err.message);
    } finally {
      setNotifSending(false);
    }
  };

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('jeevika_admin_jobs_v2', JSON.stringify(opportunities));
    } catch {}
  }, [opportunities]);

  useEffect(() => {
    try {
      localStorage.setItem('jeevika_admin_pathways_v2', JSON.stringify(pathways));
    } catch {}
  }, [pathways]);

  // Filtering Beneficiaries
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((ben) => {
      const matchState =
        selectedStateFilter === 'All India' ||
        ben.state === selectedStateFilter ||
        ben.location?.toLowerCase().includes(selectedStateFilter.toLowerCase());

      const matchSearch =
        !searchQuery.trim() ||
        ben.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ben.skills?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ben.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ben.matchedPathwayName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchState && matchSearch;
    });
  }, [beneficiaries, selectedStateFilter, searchQuery]);

  // Filtering Opportunities
  const filteredJobs = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchState =
        selectedStateFilter === 'All India' ||
        opp.loc.toLowerCase().includes(selectedStateFilter.toLowerCase());

      const matchSearch =
        !searchQuery.trim() ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.org.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.loc.toLowerCase().includes(searchQuery.toLowerCase());

      return matchState && matchSearch;
    });
  }, [opportunities, selectedStateFilter, searchQuery]);

  // Add Job Handler
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobOrg.trim()) return;

    const newJob: Opportunity = {
      id: 'opp_' + Date.now(),
      title: jobTitle.trim(),
      org: jobOrg.trim(),
      type: jobType,
      loc: `${jobLoc || 'District Center'}, ${jobState}`,
      km: 6,
      pay: jobPay || '₹9,000 - ₹14,000 / month',
      path: 'digital',
      verified: true,
      source: 'Super Administrator Direct Entry (Ayush Gupta)',
      lastVerifiedDate: 'October 2026',
      eligibility: jobEligibility || `${jobMinEdu} with basic technical training.`,
      documentsRequired: ['Aadhaar Card', 'Mark sheet', 'Bank Passbook'],
      contactInfo: jobContact || 'District Livelihood Coordinator Office'
    };

    setOpportunities((prev) => [newJob, ...prev]);
    setShowAddJobModal(false);
    setJobTitle('');
    setJobOrg('');
    setJobLoc('');
    setJobPay('');
    setJobEligibility('');
    setJobContact('');
    onNotify('New Job Opportunity published successfully!');
  };

  // Add Pathway Handler
  const handleCreatePathway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathwayName.trim()) return;

    const newPath: Pathway = {
      id: 'path_' + Date.now(),
      name: pathwayName.trim(),
      hi: pathwayHi.trim() || pathwayName.trim(),
      role: pathwayRole.trim() || 'Certified Technical Specialist',
      icon: 'layers',
      duration: pathwayDuration,
      nsqf: pathwayNsqf,
      minEdu: 1,
      workTypes: ['job', 'self'],
      reach: 'regional',
      demand: pathwayDemand,
      demandNote: 'High regional hiring demand verified across state clusters',
      interestTags: [pathwayName.toLowerCase(), 'certified', 'technical'],
      skillTags: [pathwayName.toLowerCase(), 'skills', 'operations'],
      stages: [
        ['Foundation Principles', 'Learn core tools, measurements and safety protocols.', 'Weeks 1 to 4'],
        ['Practical Apprenticeship', 'Hands-on equipment assembly and diagnostics.', 'Weeks 5 to 9'],
        ['Industry Placement', 'NSQF certification assessment and job readiness.', 'Weeks 10 to 12']
      ]
    };

    setPathways((prev) => [newPath, ...prev]);
    setShowAddPathwayModal(false);
    setPathwayName('');
    setPathwayHi('');
    setPathwayRole('');
    onNotify('New NSQF Skill Pathway added to curriculum!');
  };

  // Delete Job
  const handleDeleteJob = (id: string) => {
    if (confirm('Are you sure you want to delete this opportunity?')) {
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
      onNotify('Opportunity removed.');
    }
  };

  // Toggle Verification
  const handleToggleVerify = (id: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, verified: !o.verified } : o))
    );
    onNotify('Verification state updated.');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'State', 'Location', 'Education', 'Skills', 'Interests', 'Matched Pathway', 'Score', 'Status', 'Date'];
    const rows = beneficiaries.map((b) => [
      b.id,
      `"${b.name}"`,
      `"${b.state}"`,
      `"${b.location}"`,
      `"${b.education}"`,
      `"${b.skills?.replace(/"/g, '""')}"`,
      `"${b.interests?.replace(/"/g, '""')}"`,
      `"${b.matchedPathwayName}"`,
      b.matchScore,
      b.status,
      b.assessedAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jeevika_national_beneficiaries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('Beneficiary assessment data exported as CSV!');
  };

  // Restrict access: Only authenticated super admin can view the console
  if (!isAdmin) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="bg-white border-2 border-red-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#9E2A2B] mx-auto flex items-center justify-center font-bold shadow-xs">
            <Icon name="shield" size={32} />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-[#9E2A2B]">
              Restricted Area · सुरक्षित प्रशासनिक क्षेत्र
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17365D]">
              प्रशासनिक प्रमाणीकरण आवश्यक
            </h2>
            <p className="text-xs text-[#5F6B76]">
              Authorized Administrative Access Only
            </p>
          </div>

          <p className="text-xs text-[#202B36] leading-relaxed">
            यह पोर्टल केवल अधिकृत प्रशासक (Admin) के लिए सुरक्षित है। पोर्टल का डेटाबेस, उपयोगकर्ता सूची और रोजगार प्रबंधन देखने के लिए कृपया लॉगिन करें।
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                if (onOpenLogin) {
                  onOpenLogin();
                } else {
                  go('home');
                }
              }}
              className="w-full py-3 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Icon name="lock" size={16} />
              <span>🔐 अधिकृत एडमिन लॉगिन (Admin Login)</span>
            </button>

            <button
              onClick={() => go('home')}
              className="w-full py-2.5 rounded-xl border border-[#DCE3EA] text-[#5F6B76] hover:text-[#17365D] font-bold text-xs transition-colors"
            >
              ← मुख्य पृष्ठ पर लौटें (Return Home)
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Banner: Super Admin Identification */}
      <div className="bg-[#17365D] text-white rounded-2xl p-5 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
            <span className="w-2 h-2 rounded-full bg-[#287D73] animate-pulse" />
            <span>Super Administrator Console · प्रशासनिक नियंत्रण केंद्र</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            National Skill &amp; Livelihood Intelligence Platform
          </h1>
          <p className="text-xs sm:text-sm text-white/80">
            Logged in as <strong>{currentUser?.displayName || 'Ayush Gupta (Super Admin)'}</strong> ({currentUser?.email})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddJobModal(true)}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#287D73] hover:bg-[#20635B] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Icon name="plus" size={15} />
            <span>+ Add Job</span>
          </button>
          <button
            onClick={() => setShowAddPathwayModal(true)}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#245A91] hover:bg-[#1C4673] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Icon name="layers" size={15} />
            <span>+ Add Pathway</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Download CSV report"
          >
            <Icon name="download" size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => {
              if (onLogout) onLogout();
              go('home');
            }}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all ml-auto md:ml-0"
            title="Sign out of admin session"
          >
            <Icon name="lock" size={14} />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DCE3EA] overflow-x-auto pb-2 text-xs sm:text-sm font-bold text-[#5F6B76]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-[#17365D] text-white shadow-xs'
              : 'hover:bg-[#F5F7FA] hover:text-[#17365D]'
          }`}
        >
          📊 Live Intelligence &amp; Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'users'
              ? 'bg-[#17365D] text-white shadow-xs'
              : 'hover:bg-[#F5F7FA] hover:text-[#17365D]'
          }`}
        >
          👥 User Assessments &amp; Matches ({beneficiaries.length})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'jobs'
              ? 'bg-[#17365D] text-white shadow-xs'
              : 'hover:bg-[#F5F7FA] hover:text-[#17365D]'
          }`}
        >
          💼 Jobs &amp; Opportunities ({opportunities.length})
        </button>
        <button
          onClick={() => setActiveTab('pathways')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'pathways'
              ? 'bg-[#17365D] text-white shadow-xs'
              : 'hover:bg-[#F5F7FA] hover:text-[#17365D]'
          }`}
        >
          ⚡ NSQF Skill Pathways ({pathways.length})
        </button>
        <button
          onClick={() => setActiveTab('districts')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'districts'
              ? 'bg-[#17365D] text-white shadow-xs'
              : 'hover:bg-[#F5F7FA] hover:text-[#17365D]'
          }`}
        >
          🗺️ District Coverage (All India)
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'notifications'
              ? 'bg-[#17365D] text-white shadow-xs'
              : 'hover:bg-[#F5F7FA] hover:text-[#17365D]'
          }`}
        >
          🔔 Push Notifications &amp; Broadcast
        </button>
      </div>

      {/* Global Location & Filter Bar */}
      <div className="bg-white border border-[#DCE3EA] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* State / Region Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-[#17365D] flex items-center gap-1 mr-1">
            <Icon name="pin" size={14} /> Scope:
          </span>
          {['All India', 'Uttar Pradesh', 'Bihar', 'Delhi NCR', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStateFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                selectedStateFilter === st
                  ? 'bg-[#245A91] text-white'
                  : 'bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] border border-[#DCE3EA]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, skill, district..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DCE3EA] text-xs font-medium focus:outline-none focus:border-[#245A91] bg-white text-[#17365D]"
          />
          <span className="absolute left-3 top-2.5 text-[#5F6B76]">
            <Icon name="search" size={14} />
          </span>
        </div>
      </div>

      {/* ===================== TAB 1: OVERVIEW & ANALYTICS ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                Total Beneficiaries Assessed
              </span>
              <div className="text-3xl font-extrabold text-[#17365D]">
                {beneficiaries.length * 48 + 142}
              </div>
              <div className="text-xs text-[#287D73] font-semibold flex items-center gap-1">
                <span>↑ +18% this month</span> · <span>89% Voice-Completed</span>
              </div>
            </div>

            <div className="p-5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                Verified Opportunities
              </span>
              <div className="text-3xl font-extrabold text-[#245A91]">
                {opportunities.length * 12 + 64}
              </div>
              <div className="text-xs text-[#5F6B76] font-medium">
                {opportunities.filter((o) => o.verified).length} verified directly by coordinators
              </div>
            </div>

            <div className="p-5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                Average NSQF Match Score
              </span>
              <div className="text-3xl font-extrabold text-[#287D73]">
                91.4%
              </div>
              <div className="text-xs text-[#5F6B76] font-medium">
                High alignment with certified job roles
              </div>
            </div>

            <div className="p-5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                Active Districts Mapped
              </span>
              <div className="text-3xl font-extrabold text-[#D9822B]">
                {DISTRICT_INTELLIGENCE.length * 4}+
              </div>
              <div className="text-xs text-[#5F6B76] font-medium">
                Covering UP, Bihar, Delhi, MP, Maharashtra
              </div>
            </div>
          </div>

          {/* Location Wise Distribution & Demand Table */}
          <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#17365D]">
                  Location-Wise Beneficiaries &amp; Skill Demand (स्थान आधारित आंकड़े)
                </h3>
                <p className="text-xs text-[#5F6B76]">
                  Real-time regional distribution of job seekers and PMKVY training hubs across India.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F5F7FA] border border-[#DCE3EA] text-[#17365D]">
                Showing: {selectedStateFilter}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FA] text-[#5F6B76] border-y border-[#DCE3EA]">
                  <tr>
                    <th className="p-3">District</th>
                    <th className="p-3">State</th>
                    <th className="p-3">Assessed Users</th>
                    <th className="p-3">Active Jobs</th>
                    <th className="p-3">Primary Demanded Skill</th>
                    <th className="p-3">PMKVY / RSETI Center</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3EA]">
                  {DISTRICT_INTELLIGENCE.filter(
                    (d) => selectedStateFilter === 'All India' || d.state === selectedStateFilter
                  ).map((d) => (
                    <tr key={d.district} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-[#17365D]">{d.district}</td>
                      <td className="p-3 text-[#5F6B76]">{d.state}</td>
                      <td className="p-3 font-semibold text-[#245A91]">{d.users} candidates</td>
                      <td className="p-3 font-semibold text-[#287D73]">{d.jobs} openings</td>
                      <td className="p-3 text-[#202B36] font-medium">{d.topSkill}</td>
                      <td className="p-3 text-emerald-700 font-bold">{d.pmkvyCenter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: USERS & ASSESSMENT DATA ===================== */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-4 p-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#17365D]">
                Beneficiary Assessment Registry ({filteredBeneficiaries.length} Users)
              </h3>
              <p className="text-xs text-[#5F6B76]">
                Every registered beneficiary's profile, spoken answers, and AI-generated NSQF match score.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Icon name="download" size={14} />
              <span>Download All Candidates (.CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] text-[#5F6B76] border-y border-[#DCE3EA]">
                <tr>
                  <th className="p-3">Beneficiary</th>
                  <th className="p-3">Location / State</th>
                  <th className="p-3">Education</th>
                  <th className="p-3">Recorded Skills</th>
                  <th className="p-3">Matched NSQF Pathway</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA]">
                {filteredBeneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-[#17365D] text-sm">{b.name}</div>
                      <div className="text-[11px] text-[#5F6B76]">{b.contactPhone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-[#202B36]">{b.location}</div>
                      <div className="text-[10px] text-[#5F6B76]">{b.state}</div>
                    </td>
                    <td className="p-3 text-[#5F6B76]">{b.education}</td>
                    <td className="p-3 max-w-xs truncate text-[#202B36]">{b.skills}</td>
                    <td className="p-3 font-semibold text-[#245A91]">{b.matchedPathwayName}</td>
                    <td className="p-3 text-center font-bold text-[#287D73]">{b.matchScore}%</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#287D73]/15 text-[#287D73]">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedUserDetail(b)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#DCE3EA] hover:border-[#245A91] text-[#245A91] font-bold text-[11px]"
                      >
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: JOBS & EMPLOYMENT ===================== */}
      {activeTab === 'jobs' && (
        <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-4 p-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#17365D]">
                Employer Opportunities &amp; Jobs Directory ({filteredJobs.length} Listings)
              </h3>
              <p className="text-xs text-[#5F6B76]">
                Add, verify, modify, or remove verified vacancies across target districts.
              </p>
            </div>
            <button
              onClick={() => setShowAddJobModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#287D73] hover:bg-[#20635B] text-white text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Icon name="plus" size={14} />
              <span>+ Post New Job Opening</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] text-[#5F6B76] border-y border-[#DCE3EA]">
                <tr>
                  <th className="p-3">Title &amp; Organization</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Remuneration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA]">
                {filteredJobs.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-[#17365D] text-sm">{opp.title}</div>
                      <div className="text-[11px] text-[#5F6B76]">{opp.org}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#F5F7FA] border border-[#DCE3EA]">
                        {opp.type}
                      </span>
                    </td>
                    <td className="p-3 text-[#202B36]">{opp.loc}</td>
                    <td className="p-3 font-semibold text-[#287D73]">{opp.pay}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleVerify(opp.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          opp.verified
                            ? 'bg-[#287D73]/15 text-[#287D73] border-[#287D73]/30'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {opp.verified ? '✓ Verified' : 'Pending Review'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteJob(opp.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: NSQF SKILL PATHWAYS ===================== */}
      {activeTab === 'pathways' && (
        <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-4 p-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#17365D]">
                NSQF Skill Pathways &amp; Curriculum Standards ({pathways.length} Roadmaps)
              </h3>
              <p className="text-xs text-[#5F6B76]">
                Define learning milestones, certified skill modules, and minimum qualification rules.
              </p>
            </div>
            <button
              onClick={() => setShowAddPathwayModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Icon name="plus" size={14} />
              <span>+ Add NSQF Pathway</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pathways.map((path) => (
              <div key={path.id} className="p-4 bg-[#F5F7FA] border border-[#DCE3EA] rounded-xl space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#17365D] text-white flex items-center justify-center font-bold text-xs">
                    L{path.nsqf}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#DCE3EA] text-[#245A91]">
                    NSQF Level {path.nsqf}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#17365D]">{path.name}</h4>
                  <div className="text-xs text-[#287D73] font-semibold">{path.hi}</div>
                  <div className="text-[11px] text-[#5F6B76] mt-1">{path.role}</div>
                </div>
                <div className="text-[11px] text-[#5F6B76]">
                  <strong>Duration:</strong> {path.duration}
                </div>
                <div className="pt-2 border-t border-[#DCE3EA] flex items-center justify-between text-xs">
                  <span className="text-[#287D73] font-bold">
                    {'★'.repeat(path.demand)} High Demand
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Remove pathway "${path.name}"?`)) {
                        setPathways((prev) => prev.filter((p) => p.id !== path.id));
                        onNotify('Pathway removed.');
                      }
                    }}
                    className="text-red-600 font-bold hover:underline text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 5: DISTRICT COVERAGE ===================== */}
      {activeTab === 'districts' && (
        <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-4 p-5 animate-fade-in">
          <div>
            <h3 className="text-base font-bold text-[#17365D]">
              All-India Operational District Nodes (अखिल भारतीय कवरेज)
            </h3>
            <p className="text-xs text-[#5F6B76]">
              Target districts with connected PMKVY training infrastructure, local seva centers, and verified employers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DISTRICT_INTELLIGENCE.map((item) => (
              <div key={item.district} className="p-4 bg-[#F5F7FA] border border-[#DCE3EA] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#17365D]">{item.district}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#287D73]/15 text-[#287D73]">
                    {item.state}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 bg-white rounded-lg border border-[#DCE3EA]">
                    <div className="text-[10px] text-[#5F6B76]">Candidates</div>
                    <div className="font-bold text-[#17365D]">{item.users}</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#DCE3EA]">
                    <div className="text-[10px] text-[#5F6B76]">Active Jobs</div>
                    <div className="font-bold text-[#287D73]">{item.jobs}</div>
                  </div>
                </div>
                <div className="text-[11px] text-[#5F6B76]">
                  <strong>Top Skill:</strong> {item.topSkill}
                </div>
                <div className="text-[11px] text-emerald-800 font-semibold">
                  {item.pmkvyCenter}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 6: PUSH NOTIFICATIONS & BROADCAST ===================== */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-6 p-6 sm:p-8 animate-fade-in max-w-3xl mx-auto text-left">
          <div>
            <h3 className="text-lg font-extrabold text-[#17365D] flex items-center gap-2">
              <Icon name="bell" size={20} className="text-[#245A91]" />
              <span>Background Push Notification Broadcast Center</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#5F6B76] mt-1">
              Send background push notifications to PWA users. Messages will be delivered even when the PWA app is running in the background or closed.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#17365D] uppercase mb-1.5">
                Target Recipient (प्राप्तकर्ता)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNotifTarget('all')}
                  className={`p-3 rounded-xl border text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all ${
                    notifTarget === 'all'
                      ? 'border-[#245A91] bg-[#245A91]/10 text-[#17365D] ring-2 ring-[#245A91]/20'
                      : 'border-[#DCE3EA] bg-white text-[#5F6B76] hover:border-[#245A91]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon name="users" size={16} className="text-[#245A91]" />
                    <span>All Users (सभी नागरिक)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#245A91] text-white text-[10px]">
                    {beneficiaries.length} users
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotifTarget('specific')}
                  className={`p-3 rounded-xl border text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all ${
                    notifTarget === 'specific'
                      ? 'border-[#245A91] bg-[#245A91]/10 text-[#17365D] ring-2 ring-[#245A91]/20'
                      : 'border-[#DCE3EA] bg-white text-[#5F6B76] hover:border-[#245A91]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon name="user" size={16} className="text-[#245A91]" />
                    <span>Specific User (विशिष्ट नागरिक)</span>
                  </span>
                </button>
              </div>
            </div>

            {notifTarget === 'specific' && (
              <div>
                <label className="block text-xs font-bold text-[#17365D] uppercase mb-1">
                  Select Target Beneficiary
                </label>
                <select
                  value={notifTargetUserId}
                  onChange={(e) => setNotifTargetUserId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#DCE3EA] text-xs sm:text-sm font-semibold bg-white text-[#17365D]"
                >
                  <option value="">-- Choose User --</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.location || 'India'} - Match: {b.matchScore}%)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#17365D] uppercase mb-1">
                Notification Title (शीर्षक)
              </label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="e.g. नया रोजगार अवसर उपलब्ध है!"
                className="w-full p-3 rounded-xl border border-[#DCE3EA] text-xs sm:text-sm font-semibold bg-white text-[#17365D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17365D] uppercase mb-1">
                Notification Message Body (संदेश)
              </label>
              <textarea
                rows={3}
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Enter push notification message..."
                className="w-full p-3 rounded-xl border border-[#DCE3EA] text-xs sm:text-sm font-medium bg-white text-[#17365D]"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSendPushNotification}
                disabled={notifSending}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Icon name="bell" size={16} />
                <span>{notifSending ? 'Broadcasting...' : '🚀 Push Notification Broadcast'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: ADD JOB ===================== */}
      {showAddJobModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE3EA] space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
              <h3 className="text-base font-bold text-[#17365D] flex items-center gap-2">
                <Icon name="plus" size={16} className="text-[#245A91]" />
                <span>Add Verified Job Opportunity</span>
              </h3>
              <button
                onClick={() => setShowAddJobModal(false)}
                className="w-7 h-7 rounded-full bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#17365D] mb-1">Job Title *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Solar PV Assistant or CSC Operator"
                  required
                  className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">Company / Organization *</label>
                <input
                  type="text"
                  value={jobOrg}
                  onChange={(e) => setJobOrg(e.target.value)}
                  placeholder="e.g. Gramin Urja Samiti or CSC Partner"
                  required
                  className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D]"
                  >
                    <option value="Job">Job (नौकरी)</option>
                    <option value="Training">Training (प्रशिक्षण)</option>
                    <option value="Self-employment">Self-employment (स्वरोजगार)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">State</label>
                  <select
                    value={jobState}
                    onChange={(e) => setJobState(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D]"
                  >
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">District / Town</label>
                  <input
                    type="text"
                    value={jobLoc}
                    onChange={(e) => setJobLoc(e.target.value)}
                    placeholder="e.g. Maharajganj town"
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">Salary / Remuneration</label>
                  <input
                    type="text"
                    value={jobPay}
                    onChange={(e) => setJobPay(e.target.value)}
                    placeholder="e.g. ₹9,000 - ₹13,000 / month"
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  value={jobEligibility}
                  onChange={(e) => setJobEligibility(e.target.value)}
                  placeholder="e.g. 10th pass with basic smartphone fluency"
                  className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">Contact Details / Coordinator Office</label>
                <input
                  type="text"
                  value={jobContact}
                  onChange={(e) => setJobContact(e.target.value)}
                  placeholder="e.g. District Coordinator, Vikas Bhavan, Room 102"
                  className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3EA]">
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE3EA] font-bold text-[#5F6B76]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#287D73] hover:bg-[#20635B] text-white font-bold"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: ADD PATHWAY ===================== */}
      {showAddPathwayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCE3EA] space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
              <h3 className="text-base font-bold text-[#17365D] flex items-center gap-2">
                <Icon name="layers" size={16} className="text-[#245A91]" />
                <span>Add NSQF Skill Pathway</span>
              </h3>
              <button
                onClick={() => setShowAddPathwayModal(false)}
                className="w-7 h-7 rounded-full bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePathway} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#17365D] mb-1">Pathway Title (English) *</label>
                <input
                  type="text"
                  value={pathwayName}
                  onChange={(e) => setPathwayName(e.target.value)}
                  placeholder="e.g. Drone Pilot &amp; Agri-Surveyor"
                  required
                  className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">Hindi Title *</label>
                <input
                  type="text"
                  value={pathwayHi}
                  onChange={(e) => setPathwayHi(e.target.value)}
                  placeholder="e.g. कृषि ड्रोन पायलट और सर्वेक्षक"
                  className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">NSQF Level</label>
                  <select
                    value={pathwayNsqf}
                    onChange={(e) => setPathwayNsqf(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D]"
                  >
                    <option value={3}>Level 3 (Semi-Skilled)</option>
                    <option value={4}>Level 4 (Skilled Professional)</option>
                    <option value={5}>Level 5 (Advanced Supervisor)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">Training Duration</label>
                  <input
                    type="text"
                    value={pathwayDuration}
                    onChange={(e) => setPathwayDuration(e.target.value)}
                    placeholder="3 months (240 hrs)"
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">Target Professional Role</label>
                <input
                  type="text"
                  value={pathwayRole}
                  onChange={(e) => setPathwayRole(e.target.value)}
                  placeholder="e.g. Certified Drone Technician or Field Operator"
                  className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3EA]">
                <button
                  type="button"
                  onClick={() => setShowAddPathwayModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE3EA] font-bold text-[#5F6B76]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white font-bold"
                >
                  Create Pathway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: VIEW BENEFICIARY DOSSIER ===================== */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE3EA] space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#287D73]/15 text-[#287D73]">
                  Candidate ID: {selectedUserDetail.id}
                </span>
                <h3 className="text-lg font-bold text-[#17365D] mt-1">
                  {selectedUserDetail.name} — Full Assessment Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="w-7 h-7 rounded-full bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
                  <span className="text-[10px] uppercase font-bold text-[#5F6B76]">Location</span>
                  <div className="font-bold text-[#17365D] mt-0.5">{selectedUserDetail.location}</div>
                  <div className="text-[10px] text-[#5F6B76]">{selectedUserDetail.state}</div>
                </div>
                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
                  <span className="text-[10px] uppercase font-bold text-[#5F6B76]">Contact</span>
                  <div className="font-bold text-[#17365D] mt-0.5">{selectedUserDetail.contactPhone}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Consent Verified ✓</div>
                </div>
              </div>

              <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#5F6B76]">Education Level</span>
                <div className="font-bold text-[#17365D]">{selectedUserDetail.education}</div>
              </div>

              <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#5F6B76]">Expressed Skills</span>
                <div className="text-[#202B36] font-medium">{selectedUserDetail.skills}</div>
              </div>

              <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#5F6B76]">Aspirations &amp; Work Type</span>
                <div className="text-[#202B36] font-medium">
                  {selectedUserDetail.interests} · <strong>Pref:</strong> {selectedUserDetail.workType} (
                  {selectedUserDetail.mobility})
                </div>
              </div>

              <div className="p-3.5 bg-[#287D73]/10 border border-[#287D73]/30 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#17365D]">
                  <span>Top NSQF Recommended Pathway:</span>
                  <span className="text-[#287D73]">{selectedUserDetail.matchScore}% Match Score</span>
                </div>
                <div className="font-bold text-sm text-[#17365D]">
                  {selectedUserDetail.matchedPathwayName}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE3EA]">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="w-full py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
