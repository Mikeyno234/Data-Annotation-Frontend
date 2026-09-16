import {
  Image as ImageIcon,
  Headphones,
  FileText,
  Video as VideoIcon,
  Layers,
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  FileCheck2,
  CheckCircle2,
  Users,
  ShieldAlert,
  ListTree,
  Settings2,
  Clock,
  Check,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Cpu,
  Database,
  type LucideIcon,
} from 'lucide-vue-next'

export interface ModalityMeta {
  code: string
  label: string
  shortLabel: string
  icon: LucideIcon
  badgeClass: string
  dotClass: string
  borderClass: string
  bgSoft: string
}

export const MODALITY_CONFIG: Record<string, ModalityMeta> = {
  IMAGE: {
    code: 'IMAGE',
    label: 'Image & Vision',
    shortLabel: 'Image',
    icon: ImageIcon,
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    dotClass: 'bg-blue-500',
    borderClass: 'border-blue-500/30',
    bgSoft: 'bg-blue-500/5',
  },
  AUDIO: {
    code: 'AUDIO',
    label: 'Audio & Speech',
    shortLabel: 'Audio',
    icon: Headphones,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    dotClass: 'bg-amber-500',
    borderClass: 'border-amber-500/30',
    bgSoft: 'bg-amber-500/5',
  },
  TEXT: {
    code: 'TEXT',
    label: 'Text & NLP',
    shortLabel: 'Text',
    icon: FileText,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500/30',
    bgSoft: 'bg-emerald-500/5',
  },
  VIDEO: {
    code: 'VIDEO',
    label: 'Video Streams',
    shortLabel: 'Video',
    icon: VideoIcon,
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    dotClass: 'bg-purple-500',
    borderClass: 'border-purple-500/30',
    bgSoft: 'bg-purple-500/5',
  },
  MULTI: {
    code: 'MULTI',
    label: 'Multi-Modal',
    shortLabel: 'Multi',
    icon: Layers,
    badgeClass: 'bg-muted text-foreground border-border/80',
    dotClass: 'bg-foreground',
    borderClass: 'border-border',
    bgSoft: 'bg-muted/30',
  },
}

export function getModalityConfig(modality?: string): ModalityMeta {
  const norm = (modality || '').toUpperCase().trim()
  return MODALITY_CONFIG[norm] || MODALITY_CONFIG.MULTI
}

export interface StatusMeta {
  label: string
  icon: LucideIcon
  badgeClass: string
  // badgeVariant maps onto components/ui/Badge.vue's variant prop, so status
  // badges across the app share one visual mapping instead of each component
  // re-deriving its own ternary chain from raw status strings.
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info'
}

// Single source of truth for both DataItem and Annotation/Review lifecycle
// labels. Mirrors the state machine in Backend/pkg/constant/constant.go:
//   UNASSIGNED -> IN_PROGRESS -> ANNOTATED -> QA_PENDING -> COMPLETED
//   REWORK loops back after a reviewer or QA rejection.
//   ESCALATED is reached once the project's rework round cap is exceeded.
//   EXCLUDED is a terminal removal (reject behavior REMOVE).
export const STATUS_CONFIG: Record<string, StatusMeta> = {
  DRAFT: {
    label: 'Draft',
    icon: RotateCcw,
    badgeClass: 'bg-muted text-muted-foreground border-border',
    badgeVariant: 'secondary',
  },
  UNASSIGNED: {
    label: 'Unassigned',
    icon: Clock,
    badgeClass: 'bg-muted text-muted-foreground border-border',
    badgeVariant: 'secondary',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Clock,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    badgeVariant: 'warning',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    badgeVariant: 'warning',
  },
  SUBMITTED: {
    label: 'Submitted',
    icon: Clock,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    badgeVariant: 'warning',
  },
  ANNOTATED: {
    label: 'Awaiting Review',
    icon: Clock,
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    badgeVariant: 'info',
  },
  QA_PENDING: {
    label: 'Awaiting QA',
    icon: Clock,
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    badgeVariant: 'info',
  },
  REWORK: {
    label: 'Rework',
    icon: RotateCcw,
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
    badgeVariant: 'warning',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    badgeVariant: 'success',
  },
  FIXED_ACCEPTED: {
    label: 'Fixed & Accepted',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    badgeVariant: 'success',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    badgeVariant: 'success',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    badgeVariant: 'destructive',
  },
  ESCALATED: {
    label: 'Escalated',
    icon: AlertTriangle,
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    badgeVariant: 'destructive',
  },
  EXCLUDED: {
    label: 'Excluded',
    icon: XCircle,
    badgeClass: 'bg-muted text-muted-foreground border-border',
    badgeVariant: 'secondary',
  },
}

export function getStatusConfig(status?: string): StatusMeta {
  const norm = (status || '').toUpperCase().trim()
  return STATUS_CONFIG[norm] || {
    label: status || 'Unknown',
    icon: Clock,
    badgeClass: 'bg-muted text-muted-foreground border-border',
    badgeVariant: 'secondary',
  }
}

// Case-insensitive & aliased icon resolver for menus and navigation
const ICON_REGISTRY: Record<string, LucideIcon> = {
  layoutdashboard: LayoutDashboard,
  dashboard: LayoutDashboard,
  folderkanban: FolderKanban,
  projects: FolderKanban,
  folder: FolderKanban,
  clipboardlist: ClipboardList,
  tasks: ClipboardList,
  mytasks: ClipboardList,
  pentool: ClipboardList,
  filecheck2: FileCheck2,
  reviews: FileCheck2,
  checksquare: FileCheck2,
  checkcircle2: CheckCircle2,
  qa: CheckCircle2,
  shieldcheck: CheckCircle2,
  users: Users,
  shieldalert: ShieldAlert,
  roles: ShieldAlert,
  security: ShieldAlert,
  audit: ShieldAlert,
  auditlogs: ShieldAlert,
  listtree: ListTree,
  menus: ListTree,
  menu: ListTree,
  layers: Layers,
  catalog: Layers,
  taskcatalog: Layers,
  annotationtypes: Layers,
  settings2: Settings2,
  settings: Settings2,
  sparkles: Sparkles,
  cpu: Cpu,
  database: Database,
}

export function resolveMenuIcon(iconName?: string, fallbackCode?: string): LucideIcon {
  if (iconName) {
    const clean = iconName.toLowerCase().replace(/[-_\s]/g, '')
    if (ICON_REGISTRY[clean]) {
      return ICON_REGISTRY[clean]
    }
  }

  if (fallbackCode) {
    const cleanCode = fallbackCode.toLowerCase().replace(/[-_\s]/g, '')
    if (ICON_REGISTRY[cleanCode]) {
      return ICON_REGISTRY[cleanCode]
    }
  }

  return Layers
}

export function formatAnnotationEngine(raw: string): string {
  if (!raw) return 'Standard Engine'
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
