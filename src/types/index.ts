export const MODALITY_TYPES = ['IMAGE', 'VIDEO', 'TEXT', 'AUDIO'] as const
export type ModalityType = (typeof MODALITY_TYPES)[number]

export const ANNOTATION_TYPE_LEVELS = ['CATEGORY', 'SUB_TYPE'] as const
export type AnnotationTypeLevel = (typeof ANNOTATION_TYPE_LEVELS)[number]

export const TOOL_TYPES = ['BBOX', 'OBB', 'POLYGON', 'CHOICE', 'RADIO', 'SPAN', 'TIMELINE', 'TRANSCRIPT'] as const
export type ToolType = (typeof TOOL_TYPES)[number]

export const GENERAL_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type GeneralStatus = (typeof GENERAL_STATUSES)[number]

export const PROJECT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number]

export const TASK_STATUSES = [
  'UNASSIGNED',
  'IN_PROGRESS',
  'ANNOTATED',
  'QA_PENDING',
  'REWORK',
  'COMPLETED',
  'ESCALATED',
  'EXCLUDED',
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const REVIEW_STATUSES = [
  'PENDING',
  'APPROVED',
  'FIXED_ACCEPTED',
  'REJECTED',
] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export const ANNOTATION_STATUSES = [
  'SUBMITTED',
  'ACCEPTED',
  'FIXED_ACCEPTED',
  'REJECTED',
] as const
export type AnnotationStatus = (typeof ANNOTATION_STATUSES)[number]

export const QA_STATUSES = [
  'PENDING',
  'PASSED',
  'FAILED',
] as const
export type QAStatus = (typeof QA_STATUSES)[number]

export const REJECT_BEHAVIORS = [
  'REQUEUE_TO_ANNOTATOR',
  'REQUEUE_TO_POOL',
  'REMOVE',
] as const
export type RejectBehavior = (typeof REJECT_BEHAVIORS)[number]

export const REJECT_ACTIONS = [
  'REQUEUE',
  'REMOVE',
] as const
export type RejectAction = (typeof REJECT_ACTIONS)[number]

export interface Organization {
  id: number
  name: string
  slug: string
  description?: string
  status: string
}

export interface Permission {
  id: number
  resource: string
  action: string
  code: string
  description: string
}

export interface AnnotationType {
  id: number
  parent_id?: number
  level?: AnnotationTypeLevel
  tool_type?: ToolType | string
  code: string
  name: string
  modality: ModalityType
  description?: string
  instructions?: string
  badges?: string[] | string
  preview_image_url?: string
  preview_data?: Record<string, unknown> | null
  sub_options?: Record<string, unknown> | Array<Record<string, unknown>> | null
  label_config?: string
  status: GeneralStatus
  children?: AnnotationType[]
  created_at?: string
  updated_at?: string
}

export interface MenuLevel {
  id: number
  code: string
  name: string
  permission_code: string
  sort_order: number
  is_active: boolean
}

export interface Menu {
  id: number
  parent_id?: number
  code: string
  name: string
  path: string
  icon: string
  sort_order: number
  is_active?: boolean
  levels: MenuLevel[]
}

export interface MenuGroup {
  id: number
  name: string
  code: string
  icon?: string
  submenus: Menu[]
}

export interface Role {
  id: number
  organization_id?: number
  organization?: Organization
  name: string
  description: string
  is_system: boolean
  permissions?: Permission[]
}

export interface User {
  id: number
  email: string
  full_name: string
  avatar?: string
  status: string
  last_active_at?: string
  role_id: number
  organization_id?: number
  created_at?: string
  role?: Role
  organization?: Organization
  organizations?: Organization[]
}

export interface CreateUserPayload {
  full_name: string
  email: string
  password: string
  role_id: number
  organization_id?: number | null
}

export interface UpdateUserPayload {
  full_name?: string
  email?: string
  role_id?: number
  organization_id?: number | null
  status?: string
  password?: string
}

export interface Project {
  id: number
  organization_id: number
  name: string
  code: string
  description: string
  modality: ModalityType
  annotation_type: string
  // tool_type is the structured editor kind copied from the catalog entry
  // selected at project creation (BBOX, POLYGON, SPAN, RADIO, CHOICE,
  // TIMELINE, etc). Workspaces should match on this exact value rather than
  // pattern-matching annotation_type, which is a free-text task name.
  tool_type?: string
  status: string
  priority: ProjectPriority
  label_config?: string
  start_date?: string
  due_date?: string
  created_by_id: number
  organization?: Organization
  datasets?: Dataset[]
  assignees?: User[]
  created_at: string
}

export interface LabelOption {
  name: string
  color: string
  bg?: string
}

export interface Dataset {
  id: number
  project_id: number
  name: string
  description: string
  modality: ModalityType
  version: number
  total_items: number
  annotated_items: number
  reviewed_items: number
  qa_items: number
  format: string
  status: string
  qa_status: string
  created_by_id: number
  batches?: Batch[]
  created_at: string
}

export interface Batch {
  id: number
  dataset_id: number
  name: string
  sequence: number
  total_items: number
  status: string
  priority: string
  due_date?: string
  assigned_to_id?: number
  assignees?: User[]
  data_items?: DataItem[]
}

export interface DataItem {
  id: number
  batch_id: number
  project_id: number
  external_id?: string
  modality: ModalityType
  file_name: string
  source_url: string
  storage_key?: string
  metadata?: Record<string, unknown> | null
  status: TaskStatus
  locked_by_id?: number
  locked_until?: string
  draft_payload?: AnnotationPayload | null
  draft_saved_at?: string
  // review_round counts completed rework cycles; last_rejection_reason carries
  // the most recent reviewer or QA feedback so the annotator sees why the item
  // came back without querying the audit log.
  review_round?: number
  last_rejection_reason?: string
  annotations?: Annotation[]
  created_at: string
}


export interface AudioSegment {
  id: string
  start: number
  end: number
  speaker: string
  label?: string
  transcript?: string
  confidence?: number
}

export interface ImageBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  confidence?: number
  color?: string
}

export interface ImagePolygon {
  id: string
  points: Array<{ x: number; y: number }>
  label: string
  confidence?: number
  color?: string
}

export interface ImageClassificationPayload {
  selectedLabels: string[]
}

export type ImageAnnotationPayload = ImageBox[] | ImagePolygon[] | ImageClassificationPayload

export type AnnotationPayload =
  | ImageAnnotationPayload
  | TextEntity[]
  | VideoInterval[]
  | AudioSegment[]
  | Array<Record<string, unknown>>
  | Record<string, unknown>

export interface TextEntity {
  id: string
  start: number
  end: number
  text: string
  label: string
  color?: string
}

export interface VideoInterval {
  id: string
  start: number
  end: number
  label: string
  action?: string
  track?: number
}

export interface Annotation {
  id: number
  data_item_id: number
  annotator_id: number
  annotation_type: string
  payload: AnnotationPayload
  version: number
  lead_time_seconds: number
  is_ground_truth: boolean
  status: AnnotationStatus | string
  submitted_at?: string
  reviews?: Review[]
	created_at: string
	data_item?: DataItem
  annotator?: User
}

export interface Review {
  id: number
  annotation_id: number
  reviewer_id: number
  status: ReviewStatus | string
  comment: string
  reviewed_at?: string
  created_at: string
  annotation?: Annotation
  reviewer?: User
}

export interface ReviewProjectSummary {
  project_id: number
  project_name: string
  modality: ModalityType | string
  annotation_type: string
  pending_count: number
  approved_count: number
  rejected_count: number
  total_reviews: number
}

export interface BatchReviewRequest {
  project_id?: number
  annotation_ids?: number[]
  comment?: string
}

export interface QAProjectSummary {
  project_id: number
  project_name: string
  modality: string
  annotation_type: string
  pending_count: number
  passed_count: number
  failed_count: number
  total_tasks: number
  avg_score: number
}

export interface BatchQAEvaluateRequest {
  project_id?: number
  task_ids?: number[]
  score: number
  passed: boolean
  issue_type?: string
  comment?: string
}

export interface QAIssueTypeOption {
  value: string
  label: string
  description?: string
}

export interface QATask {
  id: number
  data_item_id: number
  assigned_to_id?: number
  status: QAStatus | string
  created_at: string
  results?: QAResult[]
  data_item?: DataItem
  assigned_to?: User
}

export interface QAResult {
  id: number
  qa_task_id: number
  evaluator_id: number
  score: number
  passed: boolean
  issue_type?: string
  comment?: string
  created_at: string
}

export interface AuditLog {
  id: number
  organization_id?: number
  user_id: number
  user_email: string
  user_role: string
  action: string
  resource_type: string
  resource_id: string
  details: string
  metadata?: Record<string, unknown> | null
  ip_address: string
  user_agent: string
  status: string
  created_at: string
}

export interface AnalyticsOverview {
  active_projects: number
  annotators: number
  completed_tasks: number
  pending_reviews: number
  mean_lead_time: string
  quality_score: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: Pagination
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: Pagination
}

export interface ExportFormatOption {
  id: string
  name: string
  desc: string
  ext: string
}

export interface ProjectStats {
  total_items: number
  unassigned: number
  in_progress: number
  annotated: number
  qa_pending: number
  rework: number
  completed: number
  escalated: number
  can_export: boolean
  completion_percentage: number
  my_active_task?: DataItem | null
}


