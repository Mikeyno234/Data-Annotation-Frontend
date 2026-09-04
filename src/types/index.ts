export type ModalityType = string

export type TaskStatus = 'UNASSIGNED' | 'IN_PROGRESS' | 'ANNOTATED' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'

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
  level?: 'CATEGORY' | 'SUB_TYPE'
  tool_type?: string
  code: string
  name: string
  modality: ModalityType
  description?: string
  instructions?: string
  badges?: string[] | string
  preview_image_url?: string
  preview_data?: any
  sub_options?: any
  label_config?: string
  status: 'ACTIVE' | 'INACTIVE'
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

export interface Project {
  id: number
  organization_id: number
  name: string
  code: string
  description: string
  modality: ModalityType
  annotation_type: string
  status: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  label_config?: string
  start_date?: string
  due_date?: string
  created_by_id: number
  organization?: Organization
  datasets?: Dataset[]
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
  metadata?: Record<string, any>
  status: TaskStatus
  locked_by_id?: number
  locked_until?: string
  draft_payload?: any
  draft_saved_at?: string
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
  payload: any
  version: number
  lead_time_seconds: number
  is_ground_truth: boolean
  status: string
  submitted_at?: string
  reviews?: Review[]
	created_at: string
	data_item?: DataItem
}

export interface Review {
  id: number
  annotation_id: number
  reviewer_id: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FIX_REQUIRED' | string
  comment: string
  reviewed_at?: string
  created_at: string
  annotation?: Annotation
  reviewer?: User
}

export interface QATask {
  id: number
  data_item_id: number
  assigned_to_id?: number
  status: string
  created_at: string
  results?: QAResult[]
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
  metadata?: any
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

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: Pagination
}
