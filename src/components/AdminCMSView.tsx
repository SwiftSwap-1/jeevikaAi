import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icons';
import { Opportunity, Pathway, AppView, MediaAssetRecord, ShowcaseProduct } from '../types';
import { JOBS, PATHWAYS } from '../data/mockData';
import { AppUser, isAdminUser, contentService, firestoreService, AdminUserRecord } from '../services/firebase';
import { mediaStorageService, uploadToCloudinary } from '../services/cloudinaryService';

interface AdminCMSViewProps {
  currentUser?: AppUser | null;
  onNotify: (msg: string) => void;
  go: (route: AppView | string) => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export interface DistrictIntelligenceItem {
  district: string;
  state: string;
  users: number;
  jobs: number;
  topSkill: string;
  pmkvyCenter: string;
  isDynamicUserDistrict?: boolean;
}

const BASE_DISTRICT_INTELLIGENCE: DistrictIntelligenceItem[] = [
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
  const isAdmin = isAdminUser(currentUser);

  // Navigation Tabs inside Admin Portal (Vertical Sidebar on Desktop, Mobile Drawer on Mobile)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'pathways' | 'districts' | 'media' | 'notifications'>('users');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Location & Global Search Filters
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('All India');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Users & Beneficiaries State (Directly from Firestore)
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserRecord | null>(null);

  // Cloudinary Media & Showcase State
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([]);
  const [showcaseProducts, setShowcaseProducts] = useState<ShowcaseProduct[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaDirectUrl, setMediaDirectUrl] = useState<string>('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaFolder, setMediaFolder] = useState<string>('banner');
  const [mediaUploading, setMediaUploading] = useState<boolean>(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState<number>(0);
  const [uploadBatchStatus, setUploadBatchStatus] = useState<string>('');
  const [mediaCtaUrl, setMediaCtaUrl] = useState('');
  const [mediaCtaLabel, setMediaCtaLabel] = useState('');
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('all');

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

  // Modals
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddPathwayModal, setShowAddPathwayModal] = useState(false);

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

  // Load and Subscribe to Live Firestore Users
  useEffect(() => {
    setIsLoadingUsers(true);
    firestoreService.getAllUsers().then((initialUsers) => {
      setUsers(initialUsers);
      setIsLoadingUsers(false);
    }).catch(() => {
      setIsLoadingUsers(false);
    });

    const unsubscribe = firestoreService.subscribeUsers((liveUsers) => {
      setUsers(liveUsers);
      setIsLoadingUsers(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadMediaAndShowcase = async () => {
    await mediaStorageService.syncLocalMediaToFirestore();
    const assets = await mediaStorageService.getMediaAssets();
    setMediaAssets(assets);
    const prods = await mediaStorageService.getShowcaseProducts();
    setShowcaseProducts(prods);
  };

  useEffect(() => {
    loadMediaAndShowcase();
    const unsub = mediaStorageService.subscribeMediaAssets((liveAssets) => {
      setMediaAssets(liveAssets);
    });
    return () => {
      unsub();
    };
  }, []);

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

  // Computed Users Statistics
  const pendingUsersCount = useMemo(() => users.filter((u) => u.status === 'pending').length, [users]);
  const completedUsersCount = useMemo(() => users.filter((u) => u.status === 'completed').length, [users]);
  const activeNowUsersCount = useMemo(() => users.filter((u) => u.activeNow).length, [users]);

  // Dynamic available states aggregated from live registered users, jobs, and baseline states
  const availableStates = useMemo<string[]>(() => {
    const stateSet = new Set<string>();

    // Baseline core states
    ['Uttar Pradesh', 'Bihar', 'Delhi NCR', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh'].forEach((s) => stateSet.add(s));

    // Dynamically aggregate states from registered users
    users.forEach((u) => {
      const st = (u.state || '').trim();
      if (st && st !== 'All India' && st.toLowerCase() !== 'all') {
        stateSet.add(st);
      }
      // Also check location if formatted as "District, State"
      if (u.location && u.location.includes(',')) {
        const parts = u.location.split(',').map((p) => p.trim());
        if (parts.length >= 2 && parts[1] && parts[1].length > 1) {
          stateSet.add(parts[1]);
        }
      }
    });

    // Dynamically aggregate states from opportunities
    opportunities.forEach((opp) => {
      if (opp.loc && opp.loc.includes(',')) {
        const parts = opp.loc.split(',').map((p) => p.trim());
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length > 1) {
          stateSet.add(lastPart);
        }
      }
    });

    const sorted = Array.from(stateSet).sort((a, b) => a.localeCompare(b));
    return ['All India', ...sorted];
  }, [users, opportunities]);

  // Dynamic district intelligence automatically populated and updated from incoming users & jobs
  const dynamicDistrictIntelligence = useMemo<DistrictIntelligenceItem[]>(() => {
    const map = new Map<string, DistrictIntelligenceItem>();

    // 1. Seed with base catalog
    BASE_DISTRICT_INTELLIGENCE.forEach((item) => {
      map.set(item.district.toLowerCase(), { ...item });
    });

    const cleanDistrictName = (raw: string): string => {
      if (!raw) return '';
      let d = raw.split(',')[0].trim();
      d = d.replace(/^(district|dist|city|town|तहसील|जिला)\s+/i, '');
      d = d.replace(/\s+(district|dist|city|town|तहसील|जिला)$/i, '');
      return d.trim();
    };

    // 2. Aggregate from live registered users (auto-add new districts as users register)
    users.forEach((u) => {
      const loc = (u.location || '').trim();
      if (!loc || loc === 'जिला अनिर्धारित') return;

      const districtName = cleanDistrictName(loc);
      if (!districtName || districtName.length < 2) return;

      const key = districtName.toLowerCase();
      const userState = u.state || (loc.includes(',') ? loc.split(',')[1].trim() : 'Uttar Pradesh');
      const existing = map.get(key);

      if (existing) {
        existing.users += 1;
        if (u.skills && !u.skills.includes('हुनर दर्ज नहीं')) {
          const primarySkill = u.skills.split(',')[0].trim();
          if (primarySkill && !existing.topSkill.toLowerCase().includes(primarySkill.toLowerCase())) {
            existing.topSkill = `${primarySkill}, ${existing.topSkill}`;
          }
        }
      } else {
        // Automatically add new district discovered from real registered citizen!
        const userSkill = u.skills && !u.skills.includes('हुनर दर्ज नहीं')
          ? u.skills.split(',')[0].trim()
          : 'सामान्य आजीविका व कौशल (General Vocational)';

        map.set(key, {
          district: districtName,
          state: userState,
          users: 1,
          jobs: 0,
          topSkill: userSkill,
          pmkvyCenter: 'सक्रिय (Live District Center / PMKVY Node)',
          isDynamicUserDistrict: true
        });
      }
    });

    // 3. Match opportunities count to districts
    opportunities.forEach((opp) => {
      if (!opp.loc) return;
      const districtName = cleanDistrictName(opp.loc);
      if (!districtName) return;

      const key = districtName.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.jobs += 1;
      } else {
        const oppState = opp.loc.includes(',') ? opp.loc.split(',')[1].trim() : 'Uttar Pradesh';
        map.set(key, {
          district: districtName,
          state: oppState,
          users: 0,
          jobs: 1,
          topSkill: opp.title,
          pmkvyCenter: 'सक्रिय रोजगार नोड (Live Job Center)',
          isDynamicUserDistrict: true
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.users - a.users);
  }, [users, opportunities]);

  // Filtered districts based on current state selection
  const filteredDistricts = useMemo(() => {
    return dynamicDistrictIntelligence.filter((d) => {
      if (selectedStateFilter === 'All India') return true;
      return (
        d.state.toLowerCase().includes(selectedStateFilter.toLowerCase()) ||
        selectedStateFilter.toLowerCase().includes(d.state.toLowerCase())
      );
    });
  }, [dynamicDistrictIntelligence, selectedStateFilter]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter (all / pending / completed)
      if (userStatusFilter === 'pending' && u.status !== 'pending') return false;
      if (userStatusFilter === 'completed' && u.status !== 'completed') return false;

      // State filter
      const matchState =
        selectedStateFilter === 'All India' ||
        u.state === selectedStateFilter ||
        u.location?.toLowerCase().includes(selectedStateFilter.toLowerCase());

      if (!matchState) return false;

      // Search query (phone, name, skills, district)
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const cleanQPhone = q.replace(/\D/g, '');

      return (
        u.name?.toLowerCase().includes(q) ||
        (cleanQPhone && u.phone?.includes(cleanQPhone)) ||
        u.phone?.toLowerCase().includes(q) ||
        u.skills?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q) ||
        u.education?.toLowerCase().includes(q) ||
        u.uid?.toLowerCase().includes(q)
      );
    });
  }, [users, userStatusFilter, selectedStateFilter, searchQuery]);

  // Filtered Opportunities
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

  // Filtered Media Assets
  const filteredMediaAssets = useMemo(() => {
    const list = mediaAssets.filter((m) => {
      const matchCat =
        mediaCategoryFilter === 'any' ||
        mediaCategoryFilter === 'all' ||
        m.folder === mediaCategoryFilter ||
        (mediaCategoryFilter === 'banner' && m.folder === 'hero_banner');

      const matchSearch =
        !searchQuery.trim() ||
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.folder?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });

    if (mediaCategoryFilter === 'banner') {
      return [...list].sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 999;
        const orderB = typeof b.order === 'number' ? b.order : 999;
        return orderA - orderB;
      });
    }
    return list;
  }, [mediaAssets, mediaCategoryFilter, searchQuery]);

  // Hero Banner Assets sorted by admin-specified position order
  const heroBannerAssets = useMemo(() => {
    return mediaAssets
      .filter((m) => m.folder === 'banner' || m.folder === 'hero_banner')
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 999;
        const orderB = typeof b.order === 'number' ? b.order : 999;
        return orderA - orderB;
      });
  }, [mediaAssets]);

  // Slide Reorder Handler (Move Up / Down)
  const handleMoveSlide = async (id: string, direction: 'up' | 'down') => {
    const banners = [...heroBannerAssets];
    const currentIndex = banners.findIndex((b) => b.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    // Swap items in memory
    const temp = banners[currentIndex];
    banners[currentIndex] = banners[targetIndex];
    banners[targetIndex] = temp;

    // Re-index orders sequentially starting from 1
    const reorderedItems = banners.map((item, idx) => ({
      id: item.id,
      order: idx + 1,
    }));

    // Optimistically update local state immediately
    const orderMap = new Map(reorderedItems.map((r) => [r.id, r.order]));
    setMediaAssets((prev) =>
      prev.map((m) => (orderMap.has(m.id) ? { ...m, order: orderMap.get(m.id)! } : m))
    );

    // Persist reordered list to Firestore & localStorage
    await mediaStorageService.reorderMedia(reorderedItems);
    onNotify('हीरो स्लाइडर में बैनर की स्थिति बदल दी गई! (Position updated)');
  };

  // Direct Position Order Setter
  const handleSetSlideOrder = async (id: string, newOrder: number) => {
    if (isNaN(newOrder) || newOrder < 1) return;
    setMediaAssets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, order: newOrder } : m))
    );
    await mediaStorageService.updateMediaAsset(id, { order: newOrder });
    onNotify(`बैनर क्रम #${newOrder} पर सेट किया गया!`);
    loadMediaAndShowcase();
  };

  // Toggle Active/Inactive status in Hero Slider
  const handleToggleMediaActive = async (id: string, currentActive?: boolean) => {
    const newActive = currentActive === false;
    setMediaAssets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: newActive } : m))
    );
    await mediaStorageService.updateMediaAsset(id, { active: newActive });
    onNotify(newActive ? 'बैनर हीरो स्लाइडर में सक्रिय (Active) किया गया!' : 'बैनर हीरो स्लाइडर से छिपाया गया (Hidden)!');
  };

  // WhatsApp Reminder Handler
  const handleSendWhatsAppReminder = (user: AdminUserRecord) => {
    const rawPhone = user.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) {
      onNotify('इस नागरिक के पास वैध 10-अंक का मोबाइल नंबर दर्ज नहीं है।');
      return;
    }

    const missingText = user.missingFields.length > 0
      ? user.missingFields.join(', ')
      : 'हुनर व शिक्षा';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jeevikaai.app';
    const message = `नमस्ते ${user.name || 'साथी'} जी,\nJeevikaAI पोर्टल पर आपका खाता बना हुआ है। आपकी आजीविका प्रोफ़ाइल अभी अधूरी (${user.completionPercent}% पूर्ण) है।\n\nकृपया अपने मोबाइल से लॉगिन कर ${missingText} की जानकारी दर्ज करें ताकि आपको जिले के नजदीकी सरकारी रोजगार, PMKVY प्रशिक्षण और स्वरोजगार योजनाएं मिल सकें:\n${origin}\n\n- जीविका एआई (JeevikaAI Admin)`;

    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Record in local push queue as well
    try {
      const existingQueue = JSON.parse(localStorage.getItem('jeevika_push_queue') || '[]');
      existingQueue.unshift({
        id: 'wa_notif_' + Date.now(),
        target: 'specific',
        targetUserId: user.uid,
        targetPhone: cleanPhone,
        title: 'प्रोफ़ाइल पूर्णता अनुस्मारक (Profile Reminder)',
        body: `WhatsApp रिमाइंडर भेजा गया: ${missingText} दर्ज करें।`,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('jeevika_push_queue', JSON.stringify(existingQueue));
    } catch {}

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onNotify(`WhatsApp रिमाइंडर लिंक तैयार! ${cleanPhone} के लिए संदेश खुल रहा है।`);
  };

  // Delete User Handler
  const handleDeleteUser = async (uid: string) => {
    if (confirm('क्या आप वाकई इस नागरिक खाते को हटाना चाहते हैं?')) {
      await firestoreService.deleteUserData(uid);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      if (selectedUserDetail?.uid === uid) {
        setSelectedUserDetail(null);
      }
      onNotify('नागरिक खाता सफलतापूर्वक हटा दिया गया।');
    }
  };

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
      source: 'Super Administrator Direct Entry',
      lastVerifiedDate: 'October 2026',
      eligibility: jobEligibility || `${jobMinEdu} with basic technical training.`,
      documentsRequired: ['Aadhaar Card', 'Mark sheet', 'Bank Passbook'],
      contactInfo: jobContact || 'District Livelihood Coordinator Office'
    };

    setOpportunities((prev) => [newJob, ...prev]);
    contentService.upsert('opportunities', newJob.id, newJob);
    if (newJob.type === 'Training') {
      contentService.upsert('training_centers', newJob.id, newJob);
    }

    setShowAddJobModal(false);
    setJobTitle('');
    setJobOrg('');
    setJobLoc('');
    setJobPay('');
    setJobEligibility('');
    setJobContact('');
    onNotify('New Job Opportunity published successfully to Firestore!');
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
    contentService.upsert('pathways', newPath.id, newPath);
    setShowAddPathwayModal(false);
    setPathwayName('');
    setPathwayHi('');
    setPathwayRole('');
    onNotify('New NSQF Skill Pathway added to curriculum & Firestore!');
  };

  // Delete Job
  const handleDeleteJob = (id: string) => {
    if (confirm('Are you sure you want to delete this opportunity?')) {
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
      contentService.remove('opportunities', id);
      contentService.remove('training_centers', id);
      onNotify('Opportunity removed from Firestore.');
    }
  };

  // Toggle Verification
  const handleToggleVerify = (id: string) => {
    setOpportunities((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const updated = { ...o, verified: !o.verified };
          contentService.upsert('opportunities', id, updated);
          return updated;
        }
        return o;
      })
    );
    onNotify('Verification state updated in Firestore.');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['UID', 'Name', 'Phone', 'Status', 'Completion', 'State', 'Location', 'Education', 'Skills', 'Interests', 'Matched Pathway', 'Score', 'Last Active'];
    const rows = users.map((u) => [
      u.uid,
      `"${u.name}"`,
      `"${u.phone}"`,
      u.status,
      `${u.completionPercent}%`,
      `"${u.state}"`,
      `"${u.location}"`,
      `"${u.education}"`,
      `"${u.skills?.replace(/"/g, '""')}"`,
      `"${u.interests?.replace(/"/g, '""')}"`,
      `"${u.matchedPathwayName}"`,
      u.matchScore,
      u.lastActive,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jeevika_live_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('Live user assessment registry exported as CSV!');
  };

  const handleUploadNewMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) {
      onNotify('कृपया शीर्षक दर्ज करें।');
      return;
    }
    if (!editingMediaId && !mediaFile && mediaFiles.length === 0 && !mediaDirectUrl.trim() && !mediaPreview) {
      onNotify('कृपया अपलोड करने के लिए एक या अधिक तस्वीरें चुनें अथवा इमेज URL दर्ज करें।');
      return;
    }
    setMediaUploading(true);
    setMediaUploadProgress(10);
    try {
      // 1. If editing existing single media
      if (editingMediaId) {
        let url = mediaPreview;
        if (mediaFile) {
          url = await uploadToCloudinary(mediaFile, mediaFolder, (pct) => {
            setMediaUploadProgress(Math.max(10, pct));
          });
        } else if (mediaDirectUrl.trim()) {
          url = mediaDirectUrl.trim();
        }
        await mediaStorageService.updateMediaAsset(editingMediaId, {
          url,
          folder: mediaFolder,
          name: mediaTitle.trim(),
          ctaUrl: mediaCtaUrl.trim() || undefined,
          ctaLabel: mediaCtaLabel.trim() || undefined,
        });
        onNotify('मीडिया सफलतापूर्वक अपडेट किया गया! (Media updated)');
        setEditingMediaId(null);
      } else if (mediaFiles.length > 0) {
        // 2. Batch upload multiple files! (Unlimited banners / images)
        const total = mediaFiles.length;
        const currentCategoryAssets = mediaAssets.filter((m) => m.folder === mediaFolder);
        const maxOrder = currentCategoryAssets.length > 0
          ? Math.max(...currentCategoryAssets.map((b) => b.order ?? 0))
          : 0;

        for (let i = 0; i < total; i++) {
          const file = mediaFiles[i];
          setUploadBatchStatus(`अपलोड हो रहा है (${i + 1}/${total}): ${file.name}...`);
          const baseProgress = Math.round((i / total) * 100);
          setMediaUploadProgress(Math.max(10, baseProgress));

          const uploadedUrl = await uploadToCloudinary(file, mediaFolder, (pct) => {
            const overall = Math.round(((i + pct / 100) / total) * 100);
            setMediaUploadProgress(Math.max(10, overall));
          });

          const itemTitle = total > 1
            ? `${mediaTitle.trim()} #${i + 1}`
            : mediaTitle.trim();

          await mediaStorageService.saveMediaAsset({
            url: uploadedUrl,
            folder: mediaFolder,
            name: itemTitle,
            tags: ['जीविका अवसर'],
            used: 1,
            time: Date.now() + i,
            createdAt: new Date().toISOString(),
            ctaUrl: mediaCtaUrl.trim() || undefined,
            ctaLabel: mediaCtaLabel.trim() || undefined,
            order: maxOrder + i + 1,
            active: true,
          });
        }
        onNotify(`सफलतापूर्वक ${total} तस्वीरें अपलोड हो गईं और गैलरी/स्लाइडर में जोड़ दी गईं!`);
      } else {
        // 3. Single file or direct URL
        let url = mediaDirectUrl.trim();
        if (mediaFile) {
          url = await uploadToCloudinary(mediaFile, mediaFolder, (pct) => {
            setMediaUploadProgress(Math.max(15, pct));
          });
        } else if (mediaPreview && !url) {
          url = mediaPreview;
        }

        if (!url) {
          throw new Error('तस्वीर अपलोड नहीं हो सकी या अमान्य URL है।');
        }

        const currentCategoryAssets = mediaAssets.filter((m) => m.folder === mediaFolder);
        const maxOrder = currentCategoryAssets.length > 0
          ? Math.max(...currentCategoryAssets.map((b) => b.order ?? 0))
          : 0;

        await mediaStorageService.saveMediaAsset({
          url,
          folder: mediaFolder,
          name: mediaTitle.trim(),
          tags: ['जीविका अवसर'],
          used: 1,
          time: Date.now(),
          createdAt: new Date().toISOString(),
          ctaUrl: mediaCtaUrl.trim() || undefined,
          ctaLabel: mediaCtaLabel.trim() || undefined,
          order: maxOrder + 1,
          active: true,
        });
        onNotify('तस्वीर अपलोड हो गई और गैलरी में सहेज दी गई!');
      }

      setMediaFile(null);
      setMediaFiles([]);
      setMediaPreview('');
      setMediaPreviews([]);
      setMediaDirectUrl('');
      setMediaTitle('');
      setMediaCtaUrl('');
      setMediaCtaLabel('');
      setUploadBatchStatus('');
      await loadMediaAndShowcase();
    } catch (err: any) {
      onNotify('अपलोड विफल: ' + (err.message || 'त्रुटि हुई'));
    } finally {
      setMediaUploading(false);
      setMediaUploadProgress(0);
      setUploadBatchStatus('');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm('क्या आप इस तस्वीर को छिपाना (Hide) चाहते हैं?')) {
      await mediaStorageService.updateMediaAsset(id, { active: false });
      onNotify('तस्वीर सफलतापूर्वक छिपा दी गई है (Hidden).');
      loadMediaAndShowcase();
    }
  };

  const handleDeleteShowcase = async (id: string) => {
    if (confirm('Are you sure you want to remove this showcase product?')) {
      await mediaStorageService.deleteShowcaseProduct(id);
      onNotify('Product removed from showcase.');
      loadMediaAndShowcase();
    }
  };

  const handleSendPushNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      onNotify('कृपया शीर्षक और संदेश दोनों दर्ज करें।');
      return;
    }
    if (notifTarget === 'specific' && !notifTargetUserId) {
      onNotify('कृपया विशिष्ट नागरिक का चयन करें।');
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
          ? 'सभी नागरिकों को पुश नोटिफिकेशन सफलतापूर्वक प्रसारित कर दिया गया है!'
          : 'चयनित नागरिक को पुश नोटिफिकेशन सफलतापूर्वक भेज दिया गया है!'
      );
      setNotifBody('');
    } catch (err: any) {
      onNotify('नोटिफ़िकेशन भेजने में त्रुटि: ' + err.message);
    } finally {
      setNotifSending(false);
    }
  };

  // Navigation Items configuration
  interface NavTabItem {
    id: 'overview' | 'users' | 'jobs' | 'pathways' | 'districts' | 'media' | 'notifications';
    label: string;
    sub: string;
    icon: string;
    badge?: number;
  }

  const navTabs: NavTabItem[] = [
    { id: 'users', label: 'लाइव नागरिक (Users)', sub: 'पंजीकृत व लंबित खाते', icon: 'user', badge: users.length },
    { id: 'overview', label: 'लाइव इंटेलिजेंस', sub: 'डेटा व विश्लेषिकी', icon: 'target' },
    { id: 'jobs', label: 'रोजगार अवसर (Jobs)', sub: 'सत्यापित नौकरियां', icon: 'briefcase', badge: opportunities.length },
    { id: 'pathways', label: 'NSQF पाथवे', sub: 'कौशल रोडमैप', icon: 'layers', badge: pathways.length },
    { id: 'districts', label: 'जिला कवरेज', sub: 'अखिल भारतीय नेटवर्क', icon: 'map', badge: dynamicDistrictIntelligence.length },
    { id: 'media', label: 'क्लाउडिनरी मीडिया', sub: 'बैनर व गैलरी', icon: 'sparkles', badge: mediaAssets.length },
    { id: 'notifications', label: 'पुश ब्रॉडकास्ट', sub: 'अलर्ट व रिमाइंडर', icon: 'bell' },
  ];

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
            यह पोर्टल केवल अधिकृत प्रशासक (Admin) के लिए सुरक्षित है। पोर्टल का डेटाबेस, नागरिक सूची और रोजगार प्रबंधन देखने के लिए कृपया लॉगिन करें।
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                if (onOpenLogin) onOpenLogin();
                else go('home');
              }}
              className="w-full py-3 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Icon name="lock" size={16} />
              <span>अधिकृत एडमिन लॉगिन (Admin Login)</span>
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
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-7 space-y-5">
      {/* Top Banner: Super Admin Identification & Global Actions */}
      <div className="bg-[#17365D] text-white rounded-2xl p-4 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Super Administrator Console · लाइव प्रशासनिक केंद्र</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            National Skill &amp; Livelihood Intelligence Platform
          </h1>
          <p className="text-xs sm:text-sm text-white/80">
            लॉगिन: <strong>{currentUser?.displayName || 'Super Admin'}</strong> ({currentUser?.email || 'Admin Portal'})
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddJobModal(true)}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#287D73] hover:bg-[#20635B] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Icon name="plus" size={14} />
            <span>+ Add Job</span>
          </button>
          <button
            onClick={() => setShowAddPathwayModal(true)}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#245A91] hover:bg-[#1C4673] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Icon name="layers" size={14} />
            <span>+ Add Pathway</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 sm:px-3 sm:py-2.5 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Download CSV report"
          >
            <Icon name="download" size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => {
              if (onLogout) onLogout();
              go('home');
            }}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all ml-auto md:ml-0"
            title="लॉगआउट करें"
          >
            <Icon name="lock" size={13} />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Vertical Sidebar on Desktop + Mobile Toggle + Content */}
      <div className="flex flex-col md:flex-row items-start gap-5">
        {/* ===================== 1. DESKTOP VERTICAL SIDEBAR ===================== */}
        <aside className="hidden md:flex md:w-64 shrink-0 flex-col gap-1.5 p-3.5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs sticky top-20">
          <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#5F6B76] border-b border-[#DCE3EA] mb-1 flex items-center justify-between">
            <span>प्रशासनिक मेनू</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live sync" />
          </div>

          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full p-2.5 rounded-xl text-left font-bold text-xs flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-[#17365D] text-white shadow-sm'
                    : 'text-[#5F6B76] hover:bg-[#F5F7FA] hover:text-[#17365D]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#17365D]'}`}>
                    <Icon name={tab.icon} size={15} />
                  </span>
                  <div className="truncate">
                    <div className="leading-tight truncate">{tab.label}</div>
                    <div className={`text-[10px] font-normal truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                      {tab.sub}
                    </div>
                  </div>
                </div>

                {tab.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white text-[#17365D]' : 'bg-slate-100 text-[#17365D] border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Sidebar Footer Widget */}
          <div className="mt-4 pt-3 border-t border-[#DCE3EA] space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>फ़ायरबेस रियल-टाइम सिंक</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F5F7FA] border border-[#DCE3EA] text-[#5F6B76] text-[11px] space-y-0.5">
              <div className="flex items-center justify-between">
                <span>कुल पंजीकृत:</span>
                <strong className="text-[#17365D]">{users.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>लंबित प्रोफ़ाइल:</span>
                <strong className="text-amber-600">{pendingUsersCount}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>लाइव सक्रिय:</span>
                <strong className="text-emerald-600">{activeNowUsersCount}</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* ===================== 2. MOBILE RESPONSIVE NAV BAR ===================== */}
        <div className="md:hidden w-full bg-white border border-[#DCE3EA] rounded-2xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-[#17365D]">
              <span className="text-slate-500">सेक्शन:</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#17365D] text-white text-xs font-bold flex items-center gap-1.5">
                <Icon name={navTabs.find((t) => t.id === activeTab)?.icon || 'user'} size={13} />
                <span>{navTabs.find((t) => t.id === activeTab)?.label}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-[#F5F7FA] hover:bg-slate-100 border border-[#DCE3EA] text-xs font-bold text-[#17365D] flex items-center gap-1.5 shadow-xs"
            >
              <Icon name="menu" size={14} />
              <span>{mobileMenuOpen ? 'बंद करें ✕' : 'मेनू बदलें ▾'}</span>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-[#DCE3EA] animate-fade-in">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left font-bold text-xs flex items-center justify-between transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#17365D] text-white shadow-xs'
                      : 'bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] border border-[#DCE3EA]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon name={tab.icon} size={14} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/20">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===================== 3. MAIN CONTENT CONTAINER ===================== */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* Global Location & Filter Bar */}
          <div className="bg-white border border-[#DCE3EA] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* State / Region Pill Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="font-bold text-[#17365D] flex items-center gap-1 mr-1 whitespace-nowrap">
                <Icon name="pin" size={13} /> क्षेत्र ({availableStates.length - 1} राज्य):
              </span>
              {availableStates.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStateFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap text-xs ${
                    selectedStateFilter === st
                      ? 'bg-[#245A91] text-white shadow-xs'
                      : 'bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] border border-[#DCE3EA]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="मोबाइल, नाम, हुनर या जिला खोजें..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DCE3EA] text-xs font-medium focus:outline-none focus:border-[#245A91] bg-white text-[#17365D]"
              />
              <span className="absolute left-3 top-2.5 text-[#5F6B76]">
                <Icon name="search" size={14} />
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ===================== TAB: USERS & LIVE REGISTRATIONS ===================== */}
          {activeTab === 'users' && (
            <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-4 p-4 sm:p-6 animate-fade-in">
              {/* Header with Title and User Status Filter Tabs */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-[#17365D]">
                      लाइव नागरिक व प्रोफ़ाइल स्थिति (Live Citizen Registry)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      लाइव फ़ायरबेस
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6B76] mt-0.5">
                    वास्तविक पंजीकृत नागरिक, 4-अंक PIN खाते, प्रोफ़ाइल पूर्णता और WhatsApp रिमाइंडर प्रबंधन।
                  </p>
                </div>

                {/* Filter Tabs: All / Pending / Completed */}
                <div className="flex items-center gap-1.5 p-1 bg-[#F5F7FA] border border-[#DCE3EA] rounded-xl self-start lg:self-auto text-xs font-bold">
                  <button
                    onClick={() => setUserStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      userStatusFilter === 'all'
                        ? 'bg-[#17365D] text-white shadow-xs'
                        : 'text-[#5F6B76] hover:text-[#17365D]'
                    }`}
                  >
                    <span>सभी नागरिक</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${userStatusFilter === 'all' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>
                      {users.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setUserStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      userStatusFilter === 'pending'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-800 hover:text-amber-900'
                    }`}
                  >
                    <span>अधूरा (Pending)</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${userStatusFilter === 'pending' ? 'bg-white/20' : 'bg-amber-100 text-amber-900'}`}>
                      {pendingUsersCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setUserStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      userStatusFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-800 hover:text-emerald-900'
                    }`}
                  >
                    <span>पूर्ण (Completed)</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${userStatusFilter === 'completed' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-900'}`}>
                      {completedUsersCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Status Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">कुल पंजीकृत नागरिक</div>
                  <div className="text-xl font-extrabold text-[#17365D] mt-0.5">{users.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[11px] text-amber-800 font-medium">अधूरे खाते (रिमाइंडर आवश्यक)</div>
                  <div className="text-xl font-extrabold text-amber-700 mt-0.5">{pendingUsersCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 font-medium">पूर्ण प्रोफ़ाइल (मैच तैयार)</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{completedUsersCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-[11px] text-blue-800 font-medium">सक्रिय नागरिक (Active Now)</div>
                  <div className="text-xl font-extrabold text-blue-700 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{activeNowUsersCount}</span>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoadingUsers && (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[#17365D] border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-[#5F6B76] font-medium">फ़ायरबेस से लाइव नागरिक लोड हो रहे हैं...</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoadingUsers && filteredUsers.length === 0 && (
                <div className="p-8 text-center bg-[#F5F7FA] rounded-2xl border border-dashed border-[#DCE3EA] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-[#17365D] flex items-center justify-center mx-auto font-bold">
                    <Icon name="user" size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#17365D]">कोई नागरिक रिकॉर्ड नहीं मिला</h4>
                    <p className="text-xs text-[#5F6B76] max-w-md mx-auto">
                      {searchQuery
                        ? `"${searchQuery}" से मेल खाता कोई रिकॉर्ड नहीं मिला। कृपया खोज शब्द बदलें।`
                        : userStatusFilter === 'pending'
                        ? 'वर्तमान में कोई अधूरा प्रोफ़ाइल खाता नहीं है। सभी नागरिकों ने अपनी प्रोफ़ाइल पूरी कर ली है।'
                        : 'जैसे ही कोई नागरिक अपने मोबाइल नंबर व 4-अंक के PIN से रजिस्टर करेगा, वह यहां तुरंत लाइव दिखाई देगा।'}
                    </p>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DCE3EA] text-xs font-bold text-[#17365D]"
                    >
                      खोज साफ़ करें
                    </button>
                  )}
                </div>
              )}

              {/* Users Table */}
              {!isLoadingUsers && filteredUsers.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F7FA] text-[#5F6B76] border-y border-[#DCE3EA]">
                      <tr>
                        <th className="p-3">नागरिक (Citizen)</th>
                        <th className="p-3">प्रोफ़ाइल स्थिति (Status)</th>
                        <th className="p-3">सक्रियता (Activity)</th>
                        <th className="p-3">जिला व राज्य</th>
                        <th className="p-3">शिक्षा व हुनर</th>
                        <th className="p-3 text-right">कार्रवाई (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3EA]">
                      {filteredUsers.map((u) => {
                        const isPending = u.status === 'pending';
                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            {/* Citizen Info */}
                            <td className="p-3">
                              <div className="font-bold text-[#17365D] text-sm flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0 flex items-center justify-center font-bold text-xs text-[#17365D]">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                  ) : (
                                    (u.name || 'U').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span>{u.name}</span>
                              </div>
                              <div className="text-[11px] text-[#5F6B76] flex items-center gap-1 mt-0.5">
                                <Icon name="phone" size={11} className="text-[#245A91]" />
                                <span className="font-mono font-semibold">
                                  {u.phone ? `+91 ${u.phone}` : 'नंबर अनुपलब्ध'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
                                UID: {u.uid.slice(0, 14)}...
                              </div>
                            </td>

                            {/* Profile Status & Completion Bar */}
                            <td className="p-3">
                              {isPending ? (
                                <div className="space-y-1.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                    <span>अधूरा प्रोफ़ाइल (Pending)</span>
                                  </span>
                                  <div className="w-28 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 rounded-full"
                                      style={{ width: `${u.completionPercent}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-amber-800 font-medium">
                                    {u.missingFields.length > 0 ? `${u.missingFields.slice(0, 2).join(', ')} बाकी` : 'मूल्यांकन बाकी'} ({u.completionPercent}%)
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    <span>पूर्ण प्रोफ़ाइल (Completed)</span>
                                  </span>
                                  <div className="text-[10px] text-emerald-800 font-semibold">
                                    100% पूर्ण · {u.matchedPathwayName}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Active Status */}
                            <td className="p-3">
                              {u.activeNow ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Active Now (सक्रिय)</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500">
                                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                                    <Icon name="clock" size={11} />
                                    <span>हाल ही में सक्रिय</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {u.lastActive ? new Date(u.lastActive).toLocaleDateString('hi-IN', { month: 'short', day: 'numeric' }) : 'आज'}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Location */}
                            <td className="p-3">
                              <div className="font-semibold text-[#17365D]">{u.location || 'जिला अनिर्धारित'}</div>
                              <div className="text-[10px] text-[#5F6B76]">{u.state}</div>
                            </td>

                            {/* Education & Skills */}
                            <td className="p-3 max-w-xs">
                              <div className="font-medium text-[#202B36] truncate">{u.education}</div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">{u.skills}</div>
                            </td>

                            {/* Actions (WhatsApp & Dossier) */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* WhatsApp Reminder Button */}
                                <button
                                  onClick={() => handleSendWhatsAppReminder(u)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                                  title="WhatsApp पर प्रोफ़ाइल पूरा करने का रिमाइंडर भेजें"
                                >
                                  <span>WhatsApp</span>
                                </button>

                                {/* View Dossier Modal */}
                                <button
                                  onClick={() => setSelectedUserDetail(u)}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#DCE3EA] hover:border-[#245A91] hover:bg-slate-50 text-[#245A91] font-bold text-[11px] transition-all"
                                >
                                  विवरण देखें
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB: OVERVIEW & ANALYTICS ===================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Key Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                    Total Registered Citizens
                  </span>
                  <div className="text-3xl font-extrabold text-[#17365D]">
                    {users.length}
                  </div>
                  <div className="text-xs text-[#287D73] font-semibold flex items-center gap-1">
                    <span>↑ {completedUsersCount} पूर्ण खाते</span> · <span>{pendingUsersCount} लंबित</span>
                  </div>
                </div>

                <div className="p-5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                    Verified Opportunities
                  </span>
                  <div className="text-3xl font-extrabold text-[#245A91]">
                    {opportunities.length}
                  </div>
                  <div className="text-xs text-[#5F6B76] font-medium">
                    {opportunities.filter((o) => o.verified).length} verified directly by coordinators
                  </div>
                </div>

                <div className="p-5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                    NSQF Curriculum Pathways
                  </span>
                  <div className="text-3xl font-extrabold text-[#287D73]">
                    {pathways.length}
                  </div>
                  <div className="text-xs text-[#5F6B76] font-medium">
                    Standardized national vocational frameworks
                  </div>
                </div>

                <div className="p-5 bg-white border border-[#DCE3EA] rounded-2xl shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                    Active Districts Mapped
                  </span>
                  <div className="text-3xl font-extrabold text-amber-600">
                    {dynamicDistrictIntelligence.length}
                  </div>
                  <div className="text-xs text-[#5F6B76] font-medium">
                    नागरिकों व अवसरों से स्वतः सिंक ({availableStates.length - 1} राज्य)
                  </div>
                </div>
              </div>

              {/* District Table */}
              <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#17365D]">
                      District-wise Livelihood Intelligence &amp; Skill Demand ({filteredDistricts.length} जिले)
                    </h3>
                    <p className="text-xs text-[#5F6B76]">
                      Real-time aggregation of local candidate supply versus registered industry openings.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F5F7FA] border border-[#DCE3EA] text-[#17365D]">
                    Scope: {selectedStateFilter}
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
                      {filteredDistricts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500 font-medium">
                            इस राज्य ({selectedStateFilter}) के लिए अभी कोई जिला रिकॉर्ड उपलब्ध नहीं है। जैसे ही नागरिक रजिस्टर करेंगे, जिला स्वतः जुड़ जाएगा।
                          </td>
                        </tr>
                      ) : (
                        filteredDistricts.map((d) => (
                          <tr key={d.district} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-[#17365D]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{d.district}</span>
                                {d.isDynamicUserDistrict && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                    नागरिक जिला
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-[#5F6B76]">{d.state}</td>
                            <td className="p-3 font-semibold text-[#245A91]">{d.users} candidates</td>
                            <td className="p-3 font-semibold text-[#287D73]">{d.jobs} openings</td>
                            <td className="p-3 text-[#202B36] font-medium">{d.topSkill}</td>
                            <td className="p-3 text-emerald-700 font-bold">{d.pmkvyCenter}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB: JOBS & EMPLOYMENT ===================== */}
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

          {/* ===================== TAB: NSQF SKILL PATHWAYS ===================== */}
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

          {/* ===================== TAB: DISTRICT COVERAGE ===================== */}
          {activeTab === 'districts' && (
            <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-4 p-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3EA]">
                <div>
                  <h3 className="text-base font-bold text-[#17365D] flex items-center gap-2">
                    <Icon name="map" size={18} className="text-[#245A91]" />
                    <span>All-India Operational District Nodes ({filteredDistricts.length} जिले उपलब्ध)</span>
                  </h3>
                  <p className="text-xs text-[#5F6B76] mt-0.5">
                    पंजीकृत नागरिकों व योजनाओं से गतिशील रूप से जुड़ते जिले। नए नागरिक के रजिस्टर होते ही उनका जिला स्वतः सूचीबद्ध हो जाता है।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F5F7FA] border border-[#DCE3EA] text-[#17365D]">
                    क्षेत्र: {selectedStateFilter}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    कुल सक्रिय: {dynamicDistrictIntelligence.length}
                  </span>
                </div>
              </div>

              {filteredDistricts.length === 0 ? (
                <div className="p-8 text-center bg-[#F5F7FA] rounded-xl border border-dashed border-[#DCE3EA] space-y-2">
                  <p className="font-bold text-xs text-[#17365D]">
                    इस राज्य ({selectedStateFilter}) में अभी कोई जिला रिकॉर्ड नहीं है।
                  </p>
                  <p className="text-xs text-[#5F6B76]">
                    जैसे ही कोई नागरिक इस राज्य के किसी जिले से रजिस्टर करेगा, वह जिला यहाँ स्वचालित रूप से दिखाई देगा।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDistricts.map((item) => (
                    <div key={item.district} className="p-4 bg-[#F5F7FA] border border-[#DCE3EA] rounded-xl space-y-2 relative hover:border-[#245A91] transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#17365D] flex items-center gap-1.5 flex-wrap">
                            <span>{item.district}</span>
                            {item.isDynamicUserDistrict && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                नया जिला
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.state}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#287D73]/15 text-[#287D73] shrink-0">
                          {item.state}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 bg-white rounded-lg border border-[#DCE3EA]">
                          <div className="text-[10px] text-[#5F6B76]">Registered Candidates</div>
                          <div className="font-bold text-[#17365D] flex items-center gap-1">
                            <span>{item.users}</span>
                            <span className="text-[10px] font-normal text-slate-500">नागरिक</span>
                          </div>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-[#DCE3EA]">
                          <div className="text-[10px] text-[#5F6B76]">Active Openings</div>
                          <div className="font-bold text-[#287D73] flex items-center gap-1">
                            <span>{item.jobs}</span>
                            <span className="text-[10px] font-normal text-slate-500">अवसर</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#5F6B76] pt-1 border-t border-slate-200/60">
                        <strong className="text-[#17365D]">Top Skill Demand:</strong> {item.topSkill}
                      </div>
                      <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>{item.pmkvyCenter}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB: CLOUDINARY MEDIA CMS ===================== */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-fade-in">
              {/* MULTI-IMAGE UPLOADER FORM */}
              <div id="cloudinary-uploader-form" className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="pb-2 border-b border-[#DCE3EA]">
                  <h3 className="text-base font-bold text-[#17365D]">
                    मीडिया अपलोडर (Upload Media)
                  </h3>
                  <p className="text-xs text-[#5F6B76]">
                    बैनर, कौशल प्रशिक्षण गैलरी या उत्पाद चित्र अपलोड करें।
                  </p>
                </div>

                {editingMediaId && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 font-bold">
                    <span>संपादक मोड: आप विवरण अपडेट कर रहे हैं</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMediaId(null);
                        setMediaTitle('');
                        setMediaCtaUrl('');
                        setMediaCtaLabel('');
                        setMediaPreview('');
                        setMediaPreviews([]);
                        setMediaFile(null);
                        setMediaFiles([]);
                        setMediaDirectUrl('');
                      }}
                      className="px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px]"
                    >
                      रद्द करें
                    </button>
                  </div>
                )}

                <form onSubmit={handleUploadNewMedia} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#17365D] mb-1">
                        शीर्षक (Title) *
                      </label>
                      <input
                        type="text"
                        value={mediaTitle}
                        onChange={(e) => setMediaTitle(e.target.value)}
                        placeholder="उदा: आधुनिक सिलाई केंद्र प्रशिक्षण, सोलर इंस्टॉलेशन..."
                        required
                        className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D] font-medium focus:ring-1 focus:ring-[#17365D]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#17365D] mb-1">
                        श्रेणी (Category) *
                      </label>
                      <select
                        value={mediaFolder}
                        onChange={(e) => setMediaFolder(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D] font-bold focus:ring-1 focus:ring-[#17365D]"
                      >
                        <option value="banner">हीरो बैनर (Hero Banner Slider)</option>
                        <option value="training">कौशल प्रशिक्षण गैलरी (Training Gallery)</option>
                        <option value="showcase">ग्रामीण उत्पाद शोकेस (Showcase)</option>
                        <option value="job">रोजगार अवसर (Job Thumbnail)</option>
                        <option value="general">सामान्य / अन्य (General / Other)</option>
                        <option value="user_avatars">प्रोफ़ाइल अवतार (User Avatars)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#17365D] mb-1">
                        क्लिक लिंक URL (CTA Link - ऐच्छिक)
                      </label>
                      <input
                        type="text"
                        value={mediaCtaUrl}
                        onChange={(e) => setMediaCtaUrl(e.target.value)}
                        placeholder="उदा: /opportunities या https://..."
                        className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#17365D] mb-1">
                        बटन लेबल (CTA Button Text - ऐच्छिक)
                      </label>
                      <input
                        type="text"
                        value={mediaCtaLabel}
                        onChange={(e) => setMediaCtaLabel(e.target.value)}
                        placeholder="उदा: अभी आवेदन करें, जानकारी देखें"
                        className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D] font-medium"
                      />
                    </div>
                  </div>

                  {/* Dual Input: File(s) or Direct URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <label className="block font-bold text-[#17365D] mb-1.5">
                        तस्वीरें चुनें (Select Files)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          if (files.length > 0) {
                            setMediaFiles(files);
                            setMediaPreviews(files.map((f) => URL.createObjectURL(f)));
                            setMediaFile(files[0]);
                            setMediaPreview(URL.createObjectURL(files[0]));
                          }
                        }}
                        className="w-full p-2 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#17365D] mb-1.5">
                        इमेज URL पेस्ट करें (Direct URL)
                      </label>
                      <input
                        type="url"
                        value={mediaDirectUrl}
                        onChange={(e) => {
                          setMediaDirectUrl(e.target.value);
                          if (e.target.value.trim()) {
                            setMediaPreview(e.target.value.trim());
                          }
                        }}
                        placeholder="https://..."
                        className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D] font-medium"
                      />
                    </div>
                  </div>

                  {/* Multi-Preview Thumbnails Grid */}
                  {mediaPreviews.length > 0 && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#17365D]">
                        <span>चुनी गई तस्वीरें ({mediaPreviews.length}):</span>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaFiles([]);
                            setMediaPreviews([]);
                            setMediaFile(null);
                            setMediaPreview('');
                          }}
                          className="text-red-600 hover:underline text-[11px]"
                        >
                          सभी हटाएं
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {mediaPreviews.map((prev, pIdx) => (
                          <div key={pIdx} className="relative rounded-lg overflow-hidden border border-slate-300 h-24 bg-slate-100 group">
                            <img src={prev} alt={`Preview ${pIdx + 1}`} className="w-full h-full object-cover" />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white">
                              #{pIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = mediaFiles.filter((_, i) => i !== pIdx);
                                const newPrev = mediaPreviews.filter((_, i) => i !== pIdx);
                                setMediaFiles(newFiles);
                                setMediaPreviews(newPrev);
                                if (newFiles.length > 0) {
                                  setMediaFile(newFiles[0]);
                                  setMediaPreview(newPrev[0]);
                                } else {
                                  setMediaFile(null);
                                  setMediaPreview('');
                                }
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs opacity-80 group-hover:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single Preview if direct URL or single preview */}
                  {!mediaPreviews.length && mediaPreview && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-[#17365D]">छवि पूर्वावलोकन (Preview):</span>
                      <div className="max-h-48 overflow-hidden rounded-lg">
                        <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      </div>
                    </div>
                  )}

                  {mediaUploading && (
                    <div className="space-y-1.5 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex justify-between text-xs font-bold text-[#287D73]">
                        <span>{uploadBatchStatus || 'अपलोड हो रहा है...'}</span>
                        <span>{mediaUploadProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-emerald-200 overflow-hidden">
                        <div className="h-full bg-[#287D73] transition-all duration-300" style={{ width: `${mediaUploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={mediaUploading}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#287D73] hover:bg-[#1E6058] text-white font-bold text-xs sm:text-sm shadow-xs disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Icon name="upload" size={15} />
                    <span>
                      {mediaUploading
                        ? 'सहेजा जा रहा है...'
                        : editingMediaId
                        ? 'परिवर्तन सहेजें'
                        : mediaFiles.length > 1
                        ? `${mediaFiles.length} तस्वीरें अपलोड करें`
                        : 'अपलोड करें'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Uploaded Media Assets Grid */}
              <div className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3EA]">
                  <div>
                    <h3 className="text-base font-bold text-[#17365D]">
                      अपलोड की गई मीडिया संपत्तियां ({filteredMediaAssets.length})
                    </h3>
                    <p className="text-xs text-[#5F6B76] mt-0.5">
                      बैनर की स्थिति, क्रम (Position) व दृश्यता यहीं से प्रबंधित करें
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <span className="font-bold text-[#17365D] whitespace-nowrap">फ़िल्टर:</span>
                    {[
                      { id: 'any', label: 'कोई भी (Any)' },
                      { id: 'all', label: `सभी (${mediaAssets.length})` },
                      { id: 'banner', label: `होम बैनर (${heroBannerAssets.length})` },
                      { id: 'training', label: 'कौशल गैलरी' },
                      { id: 'showcase', label: 'उत्पाद' },
                      { id: 'job', label: 'नौकरी' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMediaCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                          mediaCategoryFilter === cat.id
                            ? 'bg-[#17365D] text-white shadow-xs'
                            : 'bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] border border-[#DCE3EA]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={async () => {
                        const count = await mediaStorageService.syncLocalMediaToFirestore();
                        await loadMediaAndShowcase();
                        onNotify(
                          count > 0
                            ? `${count} स्थानीय तस्वीरें Firestore क्लाउड में सुरक्षित सिंक की गईं!`
                            : 'सभी तस्वीरें क्लाउड डेटाबेस से लाइव सिंक हैं!'
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs"
                      title="स्थानीय व क्लाउड मीडिया को री-सिंक करें"
                    >
                      <Icon name="refresh" size={13} />
                      <span>क्लाउड सिंक</span>
                    </button>
                  </div>
                </div>

                {filteredMediaAssets.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-1">
                    <p className="font-bold text-sm text-[#17365D]">
                      कोई मीडिया उपलब्ध नहीं है।
                    </p>
                    <p className="text-xs text-slate-500">
                      ऊपर दिए गए फ़ॉर्म से तस्वीरें चुनें और अपलोड करें।
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMediaAssets.map((m, idx) => {
                      const isBanner = m.folder === 'banner' || m.folder === 'hero_banner';
                      const bannerIdx = isBanner
                        ? heroBannerAssets.findIndex((b) => b.id === m.id)
                        : -1;
                      const displayOrder = typeof m.order === 'number'
                        ? m.order
                        : (bannerIdx >= 0 ? bannerIdx + 1 : idx + 1);

                      return (
                        <div
                          key={m.id}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white flex flex-col shadow-xs ${
                            isBanner && m.active === false
                              ? 'border-dashed border-slate-300 opacity-60 bg-slate-50'
                              : 'border-[#DCE3EA] hover:border-[#17365D]'
                          }`}
                        >
                          {/* Image preview & Badges */}
                          <div className="h-44 bg-slate-900 relative group overflow-hidden">
                            <img
                              src={m.url}
                              alt={m.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Top Badges */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-black/60 text-white uppercase backdrop-blur-xs">
                                {m.folder}
                              </span>
                              {isBanner && (
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                    m.active !== false
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  {m.active !== false ? 'सक्रिय' : 'छिपा हुआ'}
                                </span>
                              )}
                            </div>

                            {/* Right position badge for banners */}
                            {isBanner && (
                              <div className="absolute top-2.5 right-2.5">
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#17365D] text-white shadow-xs">
                                  स्थान #{displayOrder}
                                </span>
                              </div>
                            )}

                            {/* Caption over image */}
                            <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                              <p className="font-bold text-sm line-clamp-1">
                                {m.name}
                              </p>
                              {m.ctaUrl && (
                                <p className="text-[10px] text-cyan-200 truncate mt-0.5 font-semibold">
                                  {m.ctaLabel || 'लिंक'}: {m.ctaUrl}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Controls & Action Buttons */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-[#FAFBFD]">
                            {/* Position Controls if banner */}
                            {isBanner && (
                              <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-[#DCE3EA]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-[#17365D]">क्रम (Pos):</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={displayOrder}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (!isNaN(val)) handleSetSlideOrder(m.id, val);
                                    }}
                                    className="w-12 p-1 text-center font-bold text-xs rounded-lg border border-[#DCE3EA] bg-slate-50 text-[#17365D] focus:ring-1 focus:ring-[#17365D]"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={bannerIdx <= 0}
                                    onClick={() => handleMoveSlide(m.id, 'up')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#17365D] text-white hover:bg-[#245A91] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 shadow-xs"
                                  >
                                    <Icon name="arrowUp" size={13} />
                                    <span>ऊपर</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={bannerIdx < 0 || bannerIdx >= heroBannerAssets.length - 1}
                                    onClick={() => handleMoveSlide(m.id, 'down')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#17365D] text-white hover:bg-[#245A91] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 shadow-xs"
                                  >
                                    <Icon name="arrowDown" size={13} />
                                    <span>नीचे</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons: Toggle Active, Copy URL, Edit, Delete */}
                            <div className="flex items-center flex-wrap gap-1.5 pt-1 border-t border-slate-200">
                              {isBanner && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleMediaActive(m.id, m.active)}
                                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
                                    m.active !== false
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  <Icon name={m.active !== false ? 'eyeOff' : 'eye'} size={13} />
                                  <span>{m.active !== false ? 'छिपाएं' : 'सक्रिय'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(m.url);
                                  onNotify('इमेज लिंक कॉपी किया गया!');
                                }}
                                className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#17365D] font-bold text-[11px] border border-[#DCE3EA] flex items-center gap-1"
                              >
                                <Icon name="copy" size={13} />
                                <span>कॉपी लिंक</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMediaId(m.id);
                                  setMediaTitle(m.name);
                                  setMediaFolder(m.folder);
                                  setMediaCtaLabel(m.ctaLabel || '');
                                  setMediaCtaUrl(m.ctaUrl || '');
                                  setMediaPreview(m.url);
                                  setMediaFile(null);
                                  setMediaFiles([]);
                                  setMediaPreviews([]);
                                  const el = document.getElementById('cloudinary-uploader-form');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#17365D] font-bold text-[11px] border border-[#DCE3EA] flex items-center gap-1"
                              >
                                <Icon name="edit" size={13} />
                                <span>संपादित करें</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteMedia(m.id)}
                                className="py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] border border-red-200 flex items-center gap-1"
                              >
                                <Icon name="trash" size={13} />
                                <span>हटाएं</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Local Business Showcase Products Management */}
              <div className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-[#17365D]">
                  Local Business Showcase Products ({showcaseProducts.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {showcaseProducts.map((p) => (
                    <div key={p.id} className="rounded-xl border border-[#DCE3EA] overflow-hidden bg-white flex flex-col">
                      <div className="h-36 bg-slate-100 relative">
                        <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold bg-black/60 text-white">
                          {p.category}
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="font-bold text-xs text-[#17365D] line-clamp-1">{p.title}</div>
                          <div className="text-[11px] text-[#5F6B76]">{p.artisanName} · {p.location}</div>
                          <div className="text-xs font-extrabold text-[#287D73] mt-1">{p.price}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteShowcase(p.id)}
                          className="w-full py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors"
                        >
                          Delete Showcase Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB: PUSH NOTIFICATIONS & BROADCAST ===================== */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs space-y-6 p-6 sm:p-8 animate-fade-in max-w-3xl text-left">
              <div>
                <h3 className="text-lg font-extrabold text-[#17365D] flex items-center gap-2">
                  <Icon name="bell" size={20} className="text-[#245A91]" />
                  <span>Background Push Notification &amp; Alert Center</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6B76] mt-1">
                  Send background push notifications and WhatsApp reminders to registered citizens.
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
                        <span>All Citizens (सभी नागरिक)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#245A91] text-white text-[10px]">
                        {users.length} citizens
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
                        <span>Specific Citizen (विशिष्ट नागरिक)</span>
                      </span>
                    </button>
                  </div>
                </div>

                {notifTarget === 'specific' && (
                  <div>
                    <label className="block text-xs font-bold text-[#17365D] uppercase mb-1">
                      Select Target Citizen
                    </label>
                    <select
                      value={notifTargetUserId}
                      onChange={(e) => setNotifTargetUserId(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#DCE3EA] text-xs sm:text-sm font-semibold bg-white text-[#17365D]"
                    >
                      <option value="">-- Choose Citizen --</option>
                      {users.map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.name} ({u.phone ? `+91 ${u.phone}` : 'No phone'} - {u.location || 'India'} - {u.status})
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
                    placeholder="Enter notification message..."
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
                    <span>{notifSending ? 'Broadcasting...' : 'Push Notification Broadcast'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D] font-medium"
                  >
                    {availableStates.filter((s) => s !== 'All India').map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
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
                  placeholder="उदा. ड्रोन पायलट व कृषि सर्वेक्षक"
                  required
                  className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">NSQF Level (1 to 8)</label>
                  <select
                    value={pathwayNsqf}
                    onChange={(e) => setPathwayNsqf(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
                      <option key={lvl} value={lvl}>Level {lvl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">Duration</label>
                  <input
                    type="text"
                    value={pathwayDuration}
                    onChange={(e) => setPathwayDuration(e.target.value)}
                    placeholder="e.g. 3 months"
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

      {/* ===================== MODAL 3: VIEW CITIZEN DOSSIER & ACTIONS ===================== */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE3EA] space-y-4 text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    selectedUserDetail.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {selectedUserDetail.status === 'completed' ? 'पूर्ण प्रोफ़ाइल' : 'अधूरा प्रोफ़ाइल'}
                  </span>
                  {selectedUserDetail.activeNow && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Now
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-[#17365D] mt-1">
                  {selectedUserDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="w-7 h-7 rounded-full bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profile Completion Indicator */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#17365D]">
                <span>प्रोफ़ाइल पूर्णता स्तर (Completion)</span>
                <span className={selectedUserDetail.completionPercent === 100 ? 'text-emerald-700' : 'text-amber-700'}>
                  {selectedUserDetail.completionPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all ${selectedUserDetail.completionPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${selectedUserDetail.completionPercent}%` }}
                />
              </div>
              {selectedUserDetail.missingFields.length > 0 && (
                <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                  <span>बाकी विवरण:</span>
                  <span>{selectedUserDetail.missingFields.join(', ')}</span>
                </div>
              )}
            </div>

            {/* User Details Grid */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
                  <span className="text-[10px] uppercase font-bold text-[#5F6B76]">मोबाइल नंबर</span>
                  <div className="font-bold text-[#17365D] mt-0.5 flex items-center gap-1">
                    <Icon name="phone" size={12} className="text-[#245A91]" />
                    <span className="font-mono text-sm">{selectedUserDetail.phone ? `+91 ${selectedUserDetail.phone}` : 'नंबर अनुपलब्ध'}</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">सत्यापित 4-Digit PIN खाता</div>
                </div>

                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
                  <span className="text-[10px] uppercase font-bold text-[#5F6B76]">जिला व राज्य</span>
                  <div className="font-bold text-[#17365D] mt-0.5">{selectedUserDetail.location}</div>
                  <div className="text-[10px] text-[#5F6B76]">{selectedUserDetail.state}</div>
                </div>
              </div>

              <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#5F6B76]">शिक्षा स्तर (Education)</span>
                <div className="font-bold text-[#17365D]">{selectedUserDetail.education}</div>
              </div>

              <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#5F6B76]">हुनर व कौशल (Recorded Skills)</span>
                <div className="text-[#202B36] font-medium">{selectedUserDetail.skills}</div>
              </div>

              <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#5F6B76]">कार्य रुचि व मोबिलिटी</span>
                <div className="text-[#202B36] font-medium">
                  {selectedUserDetail.interests} · <strong>प्राथमिकता:</strong> {selectedUserDetail.workType} ({selectedUserDetail.mobility})
                </div>
              </div>

              <div className="p-3.5 bg-[#287D73]/10 border border-[#287D73]/30 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#17365D]">
                  <span>अनुशंसित NSQF पाथवे:</span>
                  <span className="text-[#287D73]">{selectedUserDetail.matchScore}% Match Score</span>
                </div>
                <div className="font-bold text-sm text-[#17365D]">
                  {selectedUserDetail.matchedPathwayName}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#DCE3EA]">
              <button
                onClick={() => handleSendWhatsAppReminder(selectedUserDetail)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>WhatsApp पर रिमाइंडर भेजें</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleDeleteUser(selectedUserDetail.uid)}
                  className="px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200"
                >
                  खाता मिटाएं
                </button>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
