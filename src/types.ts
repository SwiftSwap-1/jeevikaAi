export interface ProfileAIAnalysis {
  summary?: string;
  topCareerPathway?: string;
  readinessScore?: number;
  keyStrengths?: string[];
}

export type LocationAccuracyLevel = 'Precise' | 'District-level' | 'State-level';

export interface LocationAccuracyInfo {
  level: LocationAccuracyLevel;
  confidenceScore: number; // Percentage 0 - 100 (e.g., 96 for Precise, 85 for District-level, 60 for State-level)
  accuracyMeters?: number; // Geolocation radius in meters
  latitude?: number;
  longitude?: number;
  locality?: string; // Village, town, suburb or neighborhood
  pincode?: string;
  source?: 'gps' | 'manual' | 'cache' | 'default';
  description?: string;
}

export interface BeneficiaryProfile {
  name: string;
  education: string;
  skills: string;
  interests: string;
  occupation: string;
  location: string;
  workType: string;
  mobility: string;
  isDemo?: boolean;
  aiAnalysis?: ProfileAIAnalysis;
  locationAccuracy?: LocationAccuracyLevel;
  locationConfidence?: number;
  locationAccuracyMeters?: number;
  latitude?: number;
  longitude?: number;
}

export interface StepQuestion {
  en: string;
  hi: string;
  bho?: string;
  hin?: string;
}

export interface StepOption {
  v: string;
  hi: string;
  bho?: string;
  kw: string[];
}

export interface AssessmentStep {
  key: keyof BeneficiaryProfile;
  type: 'text' | 'choice' | 'area';
  label: string;
  optional?: boolean;
  options?: StepOption[];
  chips?: { en: string; hi: string; bho?: string }[];
  q: StepQuestion;
  ph: StepQuestion;
}

export interface ScoringFactor {
  k: string;
  label: string;
  pts: number;
  note: string;
  short?: string | null;
}

export interface Pathway {
  id: string;
  name: string;
  hi: string;
  role: string;
  icon: string;
  duration: string;
  nsqf: number;
  minEdu: number;
  workTypes: ('job' | 'self')[];
  reach: 'local' | 'regional';
  demand: number;
  demandNote: string;
  interestTags: string[];
  skillTags: string[];
  stages: [string, string, string][];
}

export interface EvaluatedPathway extends Pathway {
  score: number;
  raw: number;
  factors: ScoringFactor[];
  fit: string;
}

export interface Opportunity {
  id: string;
  title: string;
  org: string;
  type: 'Job' | 'Self-employment' | 'Training';
  loc: string;
  km: number;
  pay: string;
  path: string;
  verified: boolean;
  source: string;
  lastVerifiedDate: string;
  eligibility: string;
  documentsRequired?: string[];
  contactInfo?: string;
  score?: number;
  inRange?: boolean;
}

export interface AssessmentHistoryRecord {
  id: string;
  date: string;
  profileSnapshot: BeneficiaryProfile;
  topScore: number;
  topPathway: string;
}

export interface NotificationPreferences {
  smsAlerts: boolean;
  whatsappAlerts: boolean;
  pushNotifications: boolean;
  newOpportunitiesAlert: boolean;
  roadmapReminders: boolean;
}

export interface ConsentRecord {
  microphoneConsent: boolean;
  profilePersistenceConsent: boolean;
  dataSharingConsent: boolean;
  timestamp: string;
}

export interface SkillGapItem {
  skill: string;
  status: 'possessed' | 'gap';
  importance: 'high' | 'medium';
  actionNeeded: string;
}

export type SupportedLanguage = 'hi' | 'en' | 'bho' | 'hin';

export type ConversationState =
  | 'idle'
  | 'greeting'
  | 'listening_intro'
  | 'asking_question'
  | 'speaking_question'
  | 'listening'
  | 'waiting_speech_stability'
  | 'interpreting_ai'
  | 'clarifying'
  | 'acknowledging'
  | 'readback_review'
  | 'processing_answer'
  | 'confirming_answer'
  | 'saving_profile'
  | 'generating_recommendations'
  | 'completed'
  | 'recoverable_error';

export type AppView =
  | 'home'
  | 'how-it-works'
  | 'assessment'
  | 'dashboard'
  | 'opportunities'
  | 'training'
  | 'skill-gap'
  | 'saved'
  | 'history'
  | 'profile'
  | 'notifications'
  | 'faq'
  | 'accessibility'
  | 'privacy'
  | 'about'
  | 'settings'
  | 'admin'
  | 'login';

export interface SummaryModalData {
  text: string;
  fname: string;
  profile?: BeneficiaryProfile;
  selectedPathway?: EvaluatedPathway | Pathway;
  jobs?: Opportunity[];
}

export interface GovernmentScheme {
  id: string;
  name: string;
  hiName: string;
  benefit: string;
  eligibility: string;
  applyOffice: string;
  category: 'central' | 'state' | 'toolkit' | 'loan';
  financialSupport: string;
}

export interface LocationInsight {
  district: string;
  state: string;
  economicHub: string;
  topSectors: string[];
  averageMonthlyWage: string;
  activeSchemesCount: number;
  openVacanciesCount: number;
  verifiedCentersCount: number;
  summary: string;
}

export interface LocationLivelihoodData {
  location: string;
  district: string;
  state: string;
  isAiGenerated: boolean;
  timestamp: string;
  accuracyLevel?: LocationAccuracyLevel;
  confidenceScore?: number;
  accuracyMeters?: number;
  latitude?: number;
  longitude?: number;
  insight: LocationInsight;
  opportunities: Opportunity[];
  trainingCenters: Opportunity[];
  schemes: GovernmentScheme[];
}
