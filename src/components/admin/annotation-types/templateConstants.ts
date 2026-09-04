import type { ModalityType } from '@/types'
import {
  Box,
  SlidersHorizontal,
  Scissors,
  Activity,
  Tag,
  FileText,
  Headphones,
  Video as VideoIcon,
  Image as ImageIcon,
} from 'lucide-vue-next'

export interface ToolOption {
  code: string
  label: string
  icon: any
  desc: string
  defaultXml: (labels: Array<{ name: string; color: string }>) => string
  defaultInstructions: string
  defaultBadges: string[]
  defaultPreviewData: any
  defaultPreviewUrl: string
}

export const modalityList = [
  { value: 'ALL', label: 'All Modalities', icon: Tag, color: 'text-foreground' },
  { value: 'IMAGE', label: 'Images & Vision', icon: ImageIcon, color: 'text-info' },
  { value: 'AUDIO', label: 'Audio & Speech', icon: Headphones, color: 'text-primary' },
  { value: 'TEXT', label: 'Text & NLP', icon: FileText, color: 'text-success' },
  { value: 'VIDEO', label: 'Video Streams', icon: VideoIcon, color: 'text-warning' },
]

export const toolsByModality: Record<ModalityType, ToolOption[]> = {
  IMAGE: [
    {
      code: 'BBOX',
      label: '2D Bounding Box',
      icon: Box,
      desc: 'Rectangular target detection with tight coordinates',
      defaultXml: (labels) => `<View><RectangleLabels name="label" toName="image">${labels.map((l) => `<Label value="${l.name}" background="${l.color}"/>`).join('')}</RectangleLabels><Image name="image" value="$image_url"/></View>`,
      defaultInstructions: 'Identify objects and their precise positions by drawing tight rectangular bounding boxes. Include occlusion attributes and tracking IDs.',
      defaultBadges: ['Bounding Boxes', 'Counts', 'Tracking'],
      defaultPreviewData: { type: 'BBOX', boxes: [{ id: '#118', label: 'car', x: 22, y: 28, w: 18, h: 24, color: '#ef4444', score: '98%' }, { id: '#34', label: 'car', x: 48, y: 42, w: 20, h: 26, color: '#38bdf8', score: '95%' }, { id: '#13', label: 'bus', x: 72, y: 18, w: 22, h: 40, color: '#10b981', score: '99%' }] },
      defaultPreviewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    },
    {
      code: 'OBB',
      label: 'Oriented Bounding Box',
      icon: SlidersHorizontal,
      desc: 'Rotated bounding box with arbitrary angles',
      defaultXml: (labels) => `<View><RectangleLabels name="label" toName="image">${labels.map((l) => `<Label value="${l.name}" background="${l.color}"/>`).join('')}</RectangleLabels><Image name="image" value="$image_url"/></View>`,
      defaultInstructions: 'Draw rotated bounding boxes matching object orientation angle precisely for aerial or satellite imagery.',
      defaultBadges: ['Rotated Angles', 'Aerial / Satellite', 'Dense Alignment'],
      defaultPreviewData: { type: 'OBB', boxes: [{ id: 'CNT-01', label: 'container', x: 30, y: 40, w: 30, h: 15, angle: 35, color: '#f59e0b' }] },
      defaultPreviewUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    },
    {
      code: 'POLYGON',
      label: 'Polygon Segmentation',
      icon: Scissors,
      desc: 'Sub-pixel polygon contours for irregular shapes',
      defaultXml: (labels) => `<View><PolygonLabels name="label" toName="image">${labels.map((l) => `<Label value="${l.name}" background="${l.color}"/>`).join('')}</PolygonLabels><Image name="image" value="$image_url"/></View>`,
      defaultInstructions: 'Trace along natural contours and borders of target instances with sub-pixel vertices.',
      defaultBadges: ['Polygons', 'Measuring', 'Odd Shapes'],
      defaultPreviewData: { type: 'POLYGON', masks: [{ id: 'Chip 1', label: 'circuit_chip', color: '#10b981', points: [[25, 30], [55, 30], [55, 60], [25, 60]] }, { id: 'Cap 2', label: 'capacitor', color: '#f59e0b', points: [[65, 35], [80, 45], [75, 70], [60, 60]] }] },
      defaultPreviewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    },
    {
      code: 'KEYPOINT',
      label: 'Keypoint & Skeleton',
      icon: Activity,
      desc: 'Anatomical joints and skeletal pose tracking',
      defaultXml: (labels) => `<View><KeyPointLabels name="keypoint" toName="image">${labels.map((l) => `<Label value="${l.name}" background="${l.color}"/>`).join('')}</KeyPointLabels><Image name="image" value="$image_url"/></View>`,
      defaultInstructions: 'Annotate anatomical joints to track posture, ergonomics, and movement.',
      defaultBadges: ['17 Keypoints', 'Joint Angles', 'Human Skeleton'],
      defaultPreviewData: { type: 'KEYPOINT', skeleton_name: 'COCO 17-Keypoint Rig', points: [{ name: 'Head', x: 50, y: 20, color: '#ef4444' }, { name: 'Neck', x: 50, y: 28, color: '#38bdf8' }, { name: 'Left Shoulder', x: 42, y: 35, color: '#38bdf8' }] },
      defaultPreviewUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    },
    {
      code: 'CHOICE',
      label: 'Whole-Image Tagging',
      icon: Tag,
      desc: 'Single or multi-label image categorization',
      defaultXml: (labels) => `<View><Choices name="choice" toName="image">${labels.map((l) => `<Choice value="${l.name}"/>`).join('')}</Choices><Image name="image" value="$image_url"/></View>`,
      defaultInstructions: 'Categorize the image overall context, scene setting, and quality attribute.',
      defaultBadges: ['Image Labels', 'Filtering', 'Content Moderation'],
      defaultPreviewData: { type: 'IMAGE_TAG', tags: [{ label: 'Oil Painting', color: '#8b5cf6', confidence: '97%' }, { label: 'Impressionism', color: '#ec4899', confidence: '91%' }] },
      defaultPreviewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    },
  ],
  TEXT: [
    {
      code: 'SPAN',
      label: 'Named Entity Recognition (NER)',
      icon: Tag,
      desc: 'Highlight token spans for entities (names, places, etc.)',
      defaultXml: (labels) => `<View><Labels name="label" toName="text">${labels.map((l) => `<Label value="${l.name}" background="${l.color}"/>`).join('')}</Labels><Text name="text" value="$text"/></View>`,
      defaultInstructions: 'Highlight word and phrase spans representing named entities.',
      defaultBadges: ['Entity Extraction', 'Color-Coded Spans', 'Token Highlight'],
      defaultPreviewData: { type: 'NER_SPAN', sample_text: 'President Joko Widodo met with Apple CEO Tim Cook in Jakarta.', spans: [{ text: 'Joko Widodo', label: 'PERSON', color: '#38bdf8' }, { text: 'Jakarta', label: 'LOCATION', color: '#f59e0b' }] },
      defaultPreviewUrl: '',
    },
    {
      code: 'CHOICE',
      label: 'Text Classification',
      icon: FileText,
      desc: 'Sentiment, intent, or document-level classification',
      defaultXml: (labels) => `<View><Choices name="sentiment" toName="text">${labels.map((l) => `<Choice value="${l.name}"/>`).join('')}</Choices><Text name="text" value="$text"/></View>`,
      defaultInstructions: 'Read the text passage and select the most appropriate topic or sentiment label.',
      defaultBadges: ['Sentiment', 'Intent Detection', 'Document Routing'],
      defaultPreviewData: { type: 'TEXT_CLASSIFICATION', sample_text: 'The delivery arrived ahead of schedule and the package condition was excellent!', category: 'Positive Experience', score: '98.4%', labels: ['Fast Shipping', 'Excellent Quality'] },
      defaultPreviewUrl: '',
    },
  ],
  AUDIO: [
    {
      code: 'DIARIZATION',
      label: 'Speaker Diarization & Turns',
      icon: Headphones,
      desc: 'Segment dialogue into speaker turns with timestamps',
      defaultXml: (labels) => `<View><Labels name="label" toName="audio">${labels.map((l) => `<Label value="${l.name}" background="${l.color}"/>`).join('')}</Labels><Audio name="audio" value="$audio_url"/></View>`,
      defaultInstructions: 'Segment multi-speaker conversation into discrete time turns and transcribe verbatim spoken words.',
      defaultBadges: ['Waveform Scrubbing', 'Speaker Turns', 'Speech-to-Text'],
      defaultPreviewData: { type: 'AUDIO_DIARIZATION', duration: '00:15', segments: [{ speaker: 'Speaker 1', start: '00:00', end: '00:04', text: 'Good morning, welcome to enterprise customer support.', color: '#38bdf8' }] },
      defaultPreviewUrl: '',
    },
  ],
  VIDEO: [
    {
      code: 'TIMELINE',
      label: 'Action Timeline (Per Detik)',
      icon: VideoIcon,
      desc: 'Scrub timeline and mark intervals for human actions or events',
      defaultXml: (labels) => `<View><Labels name="label" toName="video">${labels.map((l) => `<Label value="${l.name}" background="${l.color}"/>`).join('')}</Labels><Video name="video" value="$video_url"/></View>`,
      defaultInstructions: 'Annotate specific temporal time intervals where discrete events or human actions occur within the video timeline.',
      defaultBadges: ['Per-Second Intervals', 'Action Triggers', 'Timeline Scrubber'],
      defaultPreviewData: { type: 'VIDEO_TIMELINE', duration: '00:30', actions: [{ label: 'Ball Dribble', start: '00:02', end: '00:07', color: '#f59e0b' }] },
      defaultPreviewUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    },
  ],
}

export const labelPresetsByModality: Record<ModalityType, Array<{ label: string; items: Array<{ name: string; color: string }> }>> = {
  IMAGE: [
    { label: 'Vehicles', items: [{ name: 'car', color: '#ef4444' }, { name: 'bus', color: '#3b82f6' }, { name: 'truck', color: '#10b981' }] },
    { label: 'Electronics', items: [{ name: 'circuit_chip', color: '#10b981' }, { name: 'capacitor', color: '#f59e0b' }] },
  ],
  TEXT: [
    { label: 'Named Entities', items: [{ name: 'PERSON', color: '#38bdf8' }, { name: 'ORGANIZATION', color: '#10b981' }, { name: 'LOCATION', color: '#f59e0b' }] },
    { label: 'Sentiment', items: [{ name: 'POSITIVE', color: '#10b981' }, { name: 'NEGATIVE', color: '#ef4444' }, { name: 'NEUTRAL', color: '#64748b' }] },
  ],
  AUDIO: [
    { label: 'Speakers', items: [{ name: 'Speaker 1', color: '#38bdf8' }, { name: 'Speaker 2', color: '#10b981' }] },
    { label: 'Sound Events', items: [{ name: 'Speech', color: '#38bdf8' }, { name: 'Noise', color: '#64748b' }] },
  ],
  VIDEO: [
    { label: 'Sports Actions', items: [{ name: 'Ball Dribble', color: '#f59e0b' }, { name: 'Jump Shot', color: '#ef4444' }] },
  ],
}
