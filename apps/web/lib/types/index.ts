/**
 * ZeitPal TypeScript Type Definitions
 * International Leave Tracking SaaS
 */

// ============================================================
// COMMON TYPES
// ============================================================

export type Timestamp = string; // ISO 8601 timestamp

// ============================================================
// COUNTRY & REGION TYPES (International Support)
// ============================================================

// Supported country codes (ISO 3166-1 alpha-2)
export type CountryCode = 'DE' | 'AT' | 'CH' | 'GB' | 'NL' | 'FR' | 'US' | 'OTHER';

export interface Country {
  code: CountryCode;
  nameEn: string;
  nameDe: string;
  flag: string;
  hasRegionalHolidays: boolean;
  minLeaveDays: number | null;
  legalNoteEn: string | null;
  legalNoteDe: string | null;
  currency: string;
  dateFormat: string;
  weekStartsOn: 0 | 1; // 0=Sunday, 1=Monday
  isActive: boolean;
  sortOrder: number;
}

export interface Region {
  id: string;
  countryCode: CountryCode;
  code: string;
  nameEn: string;
  nameDe: string;
  hasExtraHolidays: boolean;
}

// Countries configuration for client-side use
export const COUNTRIES: Country[] = [
  {
    code: 'DE',
    nameEn: 'Germany',
    nameDe: 'Deutschland',
    flag: '🇩🇪',
    hasRegionalHolidays: true,
    minLeaveDays: 20,
    legalNoteEn: 'German law requires minimum 20 days for a 5-day work week',
    legalNoteDe: 'Nach deutschem Recht mindestens 20 Tage bei 5-Tage-Woche',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    weekStartsOn: 1,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'AT',
    nameEn: 'Austria',
    nameDe: 'Österreich',
    flag: '🇦🇹',
    hasRegionalHolidays: true,
    minLeaveDays: 25,
    legalNoteEn: 'Austrian law requires minimum 25 working days of paid leave per year',
    legalNoteDe: 'Österreichisches Recht schreibt mindestens 25 Arbeitstage bezahlten Urlaub pro Jahr vor',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    weekStartsOn: 1,
    isActive: true,
    sortOrder: 2,
  },
  {
    code: 'CH',
    nameEn: 'Switzerland',
    nameDe: 'Schweiz',
    flag: '🇨🇭',
    hasRegionalHolidays: true,
    minLeaveDays: 20,
    legalNoteEn: 'Swiss law requires minimum 4 weeks (20 days) of paid vacation per year',
    legalNoteDe: 'Schweizer Recht schreibt mindestens 4 Wochen (20 Tage) bezahlten Urlaub pro Jahr vor',
    currency: 'CHF',
    dateFormat: 'DD.MM.YYYY',
    weekStartsOn: 1,
    isActive: true,
    sortOrder: 3,
  },
  {
    code: 'GB',
    nameEn: 'United Kingdom',
    nameDe: 'Vereinigtes Königreich',
    flag: '🇬🇧',
    hasRegionalHolidays: true,
    minLeaveDays: 28,
    legalNoteEn: 'UK law requires 28 days including bank holidays (5.6 weeks)',
    legalNoteDe: 'Britisches Recht schreibt 28 Tage einschließlich Feiertage vor (5,6 Wochen)',
    currency: 'GBP',
    dateFormat: 'DD/MM/YYYY',
    weekStartsOn: 1,
    isActive: true,
    sortOrder: 4,
  },
  {
    code: 'NL',
    nameEn: 'Netherlands',
    nameDe: 'Niederlande',
    flag: '🇳🇱',
    hasRegionalHolidays: false,
    minLeaveDays: 20,
    legalNoteEn: 'Dutch law requires minimum 4 times weekly working hours in days per year',
    legalNoteDe: 'Niederländisches Recht schreibt mindestens 4-mal die wöchentliche Arbeitszeit in Tagen pro Jahr vor',
    currency: 'EUR',
    dateFormat: 'DD-MM-YYYY',
    weekStartsOn: 1,
    isActive: true,
    sortOrder: 5,
  },
  {
    code: 'FR',
    nameEn: 'France',
    nameDe: 'Frankreich',
    flag: '🇫🇷',
    hasRegionalHolidays: false,
    minLeaveDays: 25,
    legalNoteEn: 'French law requires 2.5 days per month worked (30 working days per year)',
    legalNoteDe: 'Französisches Recht schreibt 2,5 Tage pro gearbeitetem Monat vor (30 Arbeitstage pro Jahr)',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    weekStartsOn: 1,
    isActive: true,
    sortOrder: 6,
  },
  {
    code: 'US',
    nameEn: 'United States',
    nameDe: 'Vereinigte Staaten',
    flag: '🇺🇸',
    hasRegionalHolidays: true,
    minLeaveDays: null,
    legalNoteEn: 'No federal requirement for paid vacation. Company policy applies.',
    legalNoteDe: 'Keine bundesweite Pflicht für bezahlten Urlaub. Es gilt die Unternehmensrichtlinie.',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    weekStartsOn: 0,
    isActive: true,
    sortOrder: 7,
  },
  {
    code: 'OTHER',
    nameEn: 'Other',
    nameDe: 'Andere',
    flag: '🌍',
    hasRegionalHolidays: false,
    minLeaveDays: null,
    legalNoteEn: 'Configure your leave policy based on local requirements',
    legalNoteDe: 'Konfigurieren Sie Ihre Urlaubsrichtlinie basierend auf lokalen Anforderungen',
    currency: 'EUR',
    dateFormat: 'YYYY-MM-DD',
    weekStartsOn: 1,
    isActive: true,
    sortOrder: 99,
  },
];

// Helper to get country by code
export function getCountry(code: CountryCode): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

// German state codes (Bundesländer) - kept for backwards compatibility
export type Bundesland =
  | 'BW' // Baden-Württemberg
  | 'BY' // Bayern
  | 'BE' // Berlin
  | 'BB' // Brandenburg
  | 'HB' // Bremen
  | 'HH' // Hamburg
  | 'HE' // Hessen
  | 'MV' // Mecklenburg-Vorpommern
  | 'NI' // Niedersachsen
  | 'NW' // Nordrhein-Westfalen
  | 'RP' // Rheinland-Pfalz
  | 'SL' // Saarland
  | 'SN' // Sachsen
  | 'ST' // Sachsen-Anhalt
  | 'SH' // Schleswig-Holstein
  | 'TH'; // Thüringen

export const BUNDESLAND_NAMES: Record<Bundesland, { en: string; de: string }> = {
  BW: { en: 'Baden-Württemberg', de: 'Baden-Württemberg' },
  BY: { en: 'Bavaria', de: 'Bayern' },
  BE: { en: 'Berlin', de: 'Berlin' },
  BB: { en: 'Brandenburg', de: 'Brandenburg' },
  HB: { en: 'Bremen', de: 'Bremen' },
  HH: { en: 'Hamburg', de: 'Hamburg' },
  HE: { en: 'Hesse', de: 'Hessen' },
  MV: { en: 'Mecklenburg-Vorpommern', de: 'Mecklenburg-Vorpommern' },
  NI: { en: 'Lower Saxony', de: 'Niedersachsen' },
  NW: { en: 'North Rhine-Westphalia', de: 'Nordrhein-Westfalen' },
  RP: { en: 'Rhineland-Palatinate', de: 'Rheinland-Pfalz' },
  SL: { en: 'Saarland', de: 'Saarland' },
  SN: { en: 'Saxony', de: 'Sachsen' },
  ST: { en: 'Saxony-Anhalt', de: 'Sachsen-Anhalt' },
  SH: { en: 'Schleswig-Holstein', de: 'Schleswig-Holstein' },
  TH: { en: 'Thuringia', de: 'Thüringen' },
};

export const REGIONS_BY_COUNTRY: Partial<Record<CountryCode, Array<{ code: string; name: string }>>> = {
  DE: Object.entries(BUNDESLAND_NAMES).map(([code, names]) => ({
    code,
    name: names.de,
  })),
  AT: [
    { code: 'W', name: 'Wien' },
    { code: 'NOE', name: 'Niederösterreich' },
    { code: 'OOE', name: 'Oberösterreich' },
    { code: 'SBG', name: 'Salzburg' },
    { code: 'T', name: 'Tirol' },
    { code: 'VBG', name: 'Vorarlberg' },
    { code: 'KTN', name: 'Kärnten' },
    { code: 'STMK', name: 'Steiermark' },
    { code: 'BGLD', name: 'Burgenland' },
  ],
  CH: [
    { code: 'ZH', name: 'Zürich' },
    { code: 'BE', name: 'Bern' },
    { code: 'LU', name: 'Luzern' },
    { code: 'ZG', name: 'Zug' },
    { code: 'BS', name: 'Basel-Stadt' },
    { code: 'BL', name: 'Basel-Landschaft' },
    { code: 'AG', name: 'Aargau' },
    { code: 'SG', name: 'St. Gallen' },
    { code: 'GR', name: 'Graubünden' },
    { code: 'TI', name: 'Tessin' },
    { code: 'VD', name: 'Waadt' },
    { code: 'GE', name: 'Genf' },
  ],
  GB: [
    { code: 'ENG', name: 'England' },
    { code: 'SCT', name: 'Scotland' },
    { code: 'WLS', name: 'Wales' },
    { code: 'NIR', name: 'Northern Ireland' },
  ],
};

// ============================================================
// ONBOARDING TYPES
// ============================================================

export type OnboardingStep =
  | 'welcome'
  | 'profile'
  | 'organization'
  | 'location'
  | 'policy'
  | 'team'
  | 'invite'
  | 'complete';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'profile',
  'organization',
  'location',
  'policy',
  'team',
  'invite',
  'complete',
];

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  data: {
    // Profile step
    displayName?: string;
    timezone?: string;
    locale?: 'en' | 'de';
    // Organization step
    organizationName?: string;
    organizationSlug?: string;
    // Location step
    country?: CountryCode;
    region?: string;
    // Policy step
    defaultVacationDays?: number;
    carryoverEnabled?: boolean;
    carryoverMaxDays?: number;
    // Team step
    teamName?: string;
    teamColor?: string;
    skipTeam?: boolean;
    // Invite step
    invites?: Array<{ email: string; role: MemberRole }>;
    skipInvites?: boolean;
  };
}

// ============================================================
// USER TYPES
// ============================================================

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Timestamp | null;
  image: string | null;
  avatarUrl: string | null; // Alias for image, used in some contexts
  phone: string | null;
  locale: string;
  timezone: string;
  employeeId: string | null;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  weeklyHours: number;
  workDaysPerWeek: number;
  notificationPreferences: NotificationPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationPreferences {
  emailOnApproval?: boolean;
  emailOnRejection?: boolean;
  emailOnTeamAbsence?: boolean;
  dailyDigest?: boolean;
}

// ============================================================
// ORGANIZATION TYPES
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  country: CountryCode;
  region: string | null;
  logoUrl: string | null;
  primaryColor: string;
  defaultVacationDays: number;
  carryoverEnabled: boolean;
  carryoverMaxDays: number;
  carryoverExpiryDate: string; // MM-DD format
  sickLeaveAuThreshold: number;
  requireApproval: boolean;
  autoApproveThreshold: number | null;
  memberRole?: MemberRole;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  planExpiresAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MemberRole = 'admin' | 'manager' | 'hr' | 'employee';
export type OrganizationRole = 'admin' | 'manager' | 'member'; // Simplified role for org membership
export type MemberStatus = 'active' | 'inactive' | 'pending';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  customVacationDays: number | null;
  status: MemberStatus;
  invitedAt: Timestamp | null;
  joinedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Joined data
  user?: User;
  organization?: Organization;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: MemberRole;
  token: string;
  invitedBy: string;
  expiresAt: Timestamp;
  acceptedAt: Timestamp | null;
  createdAt: Timestamp;
}

// ============================================================
// TEAM TYPES
// ============================================================

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string;
  minCoverage: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Joined data
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  isLead: boolean;
  createdAt: Timestamp;
  // Joined data
  user?: User;
  team?: Team;
}

// ============================================================
// LEAVE TYPE
// ============================================================

export type LeaveTypeCode =
  | 'vacation'
  | 'sick'
  | 'child_sick'
  | 'maternity'
  | 'parental'
  | 'care'
  | 'special'
  | 'overtime'
  | 'education'
  | 'unpaid';

export interface LeaveType {
  id: string;
  organizationId: string | null; // null = system default
  code: LeaveTypeCode;
  nameEn: string;
  nameDe: string;
  descriptionEn: string | null;
  descriptionDe: string | null;
  color: string;
  icon: string;
  isPaid: boolean;
  requiresApproval: boolean;
  requiresDocument: boolean;
  documentRequiredAfterDays: number | null;
  hasAllowance: boolean;
  defaultDaysPerYear: number | null;
  allowNegative: boolean;
  allowHalfDays: boolean;
  allowCarryover: boolean;
  maxCarryoverDays: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// LEAVE BALANCE
// ============================================================

export interface LeaveBalance {
  id: string;
  organizationId: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  entitled: number;
  carriedOver: number;
  adjustment: number;
  used: number;
  pending: number;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Computed property
  remaining?: number; // entitled + carriedOver + adjustment - used - pending
  // Joined data
  leaveType?: LeaveType;
}

// ============================================================
// LEAVE REQUEST
// ============================================================

export type LeaveRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'withdrawn';

export type HalfDayType = 'morning' | 'afternoon' | null;

export interface LeaveRequest {
  id: string;
  organizationId: string;
  userId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startHalfDay: HalfDayType;
  endHalfDay: HalfDayType;
  workDays: number;
  reason: string | null;
  status: LeaveRequestStatus;
  documentUrl: string | null;
  documentUploadedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  submittedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Joined data
  user?: User;
  leaveType?: LeaveType;
  approvals?: LeaveApproval[];
}

// ============================================================
// APPROVAL WORKFLOW
// ============================================================

export type ApproverType = 'team_lead' | 'manager' | 'hr' | 'specific_user' | 'any_admin';

export interface ApprovalConditions {
  leaveTypes?: LeaveTypeCode[];
  minDays?: number;
  maxDays?: number;
  teamIds?: string[];
}

export interface ApprovalRule {
  id: string;
  organizationId: string;
  name: string;
  conditions: ApprovalConditions;
  approverType: ApproverType;
  approverUserId: string | null;
  level: number;
  priority: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ApprovalDecision = 'approved' | 'rejected' | 'pending';

export interface LeaveApproval {
  id: string;
  leaveRequestId: string;
  approvalRuleId: string | null;
  approverId: string;
  level: number;
  decision: ApprovalDecision;
  comment: string | null;
  decidedAt: Timestamp | null;
  createdAt: Timestamp;
  // Joined data
  approver?: User;
  leaveRequest?: LeaveRequest;
}

// ============================================================
// PUBLIC HOLIDAYS
// ============================================================

export type HolidayType = 'public' | 'company' | 'optional';

export interface PublicHoliday {
  id: string;
  organizationId: string | null; // null = system-wide
  region: string | null; // null = nationwide
  date: string; // YYYY-MM-DD
  nameEn: string;
  nameDe: string;
  type: HolidayType;
  isHalfDay: boolean;
  isRecurring: boolean;
  recurrenceRule: string | null;
  createdAt: Timestamp;
}

// ============================================================
// AUDIT LOG
// ============================================================

export type AuditAction =
  | 'leave_request.created'
  | 'leave_request.updated'
  | 'leave_request.submitted'
  | 'leave_request.approved'
  | 'leave_request.rejected'
  | 'leave_request.cancelled'
  | 'leave_request.withdrawn'
  | 'user.created'
  | 'user.updated'
  | 'organization.created'
  | 'organization.updated'
  | 'member.invited'
  | 'member.joined'
  | 'member.removed'
  | 'team.created'
  | 'team.updated'
  | 'balance.adjusted';

export type AuditEntityType =
  | 'leave_request'
  | 'user'
  | 'organization'
  | 'organization_member'
  | 'team'
  | 'leave_balance';

export interface AuditLog {
  id: string;
  organizationId: string | null;
  userId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Timestamp;
}

// ============================================================
// NOTIFICATION
// ============================================================

export type NotificationType =
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_cancelled'
  | 'approval_needed'
  | 'team_absence'
  | 'carryover_expiry'
  | 'document_required'
  | 'invite_received'
  | 'welcome';

export interface Notification {
  id: string;
  userId: string;
  organizationId: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: AuditEntityType | null;
  entityId: string | null;
  readAt: Timestamp | null;
  emailSent: boolean;
  emailSentAt: Timestamp | null;
  createdAt: Timestamp;
}

// ============================================================
// API TYPES
// ============================================================

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// FORM INPUT TYPES
// ============================================================

export interface CreateLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  startHalfDay?: HalfDayType;
  endHalfDay?: HalfDayType;
  reason?: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  country: CountryCode;
  region?: string | null;
  defaultVacationDays?: number;
}

export interface InviteMemberInput {
  email: string;
  role: MemberRole;
}

export interface UpdateLeaveBalanceInput {
  adjustment: number;
  notes?: string;
}
