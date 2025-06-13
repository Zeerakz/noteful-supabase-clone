
/**
 * Content Type Differentiation System
 * 
 * This system provides visual differentiation between different content types
 * using a unique and clear set of icons. Icons are only used for first-level
 * items to maintain a clean hierarchy.
 */

import { LucideIcon } from 'lucide-react';
import {
  FileText,
  Database,
  Users,
  Calendar,
  Kanban,
  BarChart3,
  Image,
  Video,
  FileCode,
  BookOpen,
  FolderOpen,
  Archive,
  Settings,
  Bell,
  Bookmark,
  Link,
  MessageSquare,
  ClipboardList,
  Target,
  Lightbulb,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Zap,
  Globe,
  Shield,
  Clock,
  Tag,
  Filter,
  Search,
  PlusCircle,
  Folder,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  File,
  MapPin,
  Mail,
  Phone,
  User,
  Building,
  Home,
  Car,
  Plane,
  Camera,
  Music,
  Palette,
  Code,
  Puzzle,
  Trophy,
  Gift,
  Coffee,
  Utensils,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Activity,
  Layers,
  Grid,
  List,
  Layout,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Wifi,
  Cloud,
  Download,
  Upload,
  Share,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  Move,
  RotateCcw,
  RefreshCw,
  Play,
  Pause,
  Stop,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Check,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  MoreVertical,
  Menu,
  Sidebar,
  PanelLeft,
  PanelRight,
  Columns,
  Rows,
  Square,
  Circle,
  Triangle,
  Hash,
  AtSign,
  Percent,
  Dollar,
  Euro,
  Pound,
  Yen,
  Bitcoin,
  Calculator,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Timer,
  Stopwatch,
  AlarmClock,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  Umbrella,
  Thermometer,
  Wind,
  Compass,
  Map,
  Navigation,
  Route,
  Truck,
  Bus,
  Train,
  Ship,
  Anchor,
  Flag,
  Mountain,
  Tree,
  Flower,
  Leaf,
  Seedling,
  Apple,
  Cherry,
  Grape,
  Lemon,
  Orange,
  Banana,
  Carrot,
  Corn,
  Wheat,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Turtle,
  Bug,
  Butterfly,
  Spider,
  Worm,
  Dna,
  Microscope,
  TestTube,
  Beaker,
  Flask,
  Pill,
  Syringe,
  Stethoscope,
  Thermometer as ThermometerIcon,
  Bandage,
  Scissors,
  Wrench,
  Hammer,
  Screwdriver,
  Paintbrush,
  Ruler,
  Pencil,
  Pen,
  Highlighter,
  Eraser,
  PaintBucket,
  Pipette,
  Eyedropper,
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Focus,
  Aperture,
  Shutter,
  Iso,
  Contrast,
  Brightness,
  Gamma,
  Saturation,
  Hue,
  Blur,
  Sharpen,
  Noise,
  Grain,
  Vignette,
  ChromaticAberration,
  Distortion,
  Perspective,
  Skew,
  Warp,
  Liquify,
  Clone,
  Heal,
  Patch,
  Dodge,
  Burn,
  Sponge,
  Smudge,
  Finger,
  Push,
  Bloat,
  Pinch,
  Twirl,
  Polar,
  Spherize,
  Ripple,
  Wave,
  Zigzag,
  Accordion,
  Sine,
  Sawtooth,
  Square as SquareWave,
  Triangle as TriangleWave,
  Noise as NoiseWave,
  Random,
  Chaos,
  Fractal,
  Mandelbrot,
  Julia,
  Spiral,
  Helix,
  Torus,
  Sphere,
  Cube,
  Pyramid,
  Cone,
  Cylinder,
  Prism,
  Dodecahedron,
  Icosahedron,
  Octahedron,
  Tetrahedron,
  Hexagon,
  Pentagon,
  Octagon,
  Star as StarShape,
  Heart as HeartShape,
  Diamond,
  Spade,
  Club,
  Plus,
  Minus,
  Multiply,
  Divide,
  Equals,
  NotEquals,
  LessThan,
  LessThanOrEqual,
  GreaterThan,
  GreaterThanOrEqual,
  Approximately,
  Infinity,
  Pi,
  Sigma,
  Alpha,
  Beta,
  Gamma as GammaSymbol,
  Delta,
  Epsilon,
  Theta,
  Lambda,
  Mu,
  Nu,
  Omega,
  Phi,
  Psi,
  Chi,
  Rho,
  Tau,
  Upsilon,
  Xi,
  Zeta
} from 'lucide-react';

/**
 * Primary content types that can appear in the navigation
 */
export enum ContentType {
  // Core content types
  PAGE = 'page',
  DATABASE = 'database',
  
  // Specialized page types
  DOCUMENT = 'document',
  NOTEBOOK = 'notebook',
  WIKI = 'wiki',
  BLOG_POST = 'blog_post',
  ARTICLE = 'article',
  
  // Database-specific types
  TABLE = 'table',
  KANBAN_BOARD = 'kanban_board',
  CALENDAR = 'calendar',
  GALLERY = 'gallery',
  LIST = 'list',
  TIMELINE = 'timeline',
  
  // Project and task management
  PROJECT = 'project',
  TASK_LIST = 'task_list',
  ROADMAP = 'roadmap',
  MILESTONE = 'milestone',
  SPRINT = 'sprint',
  
  // Data and analytics
  DASHBOARD = 'dashboard',
  REPORT = 'report',
  CHART = 'chart',
  METRICS = 'metrics',
  
  // Collaboration
  TEAM_SPACE = 'team_space',
  MEETING_NOTES = 'meeting_notes',
  DISCUSSION = 'discussion',
  FEEDBACK = 'feedback',
  
  // Media and assets
  MEDIA_LIBRARY = 'media_library',
  IMAGE_GALLERY = 'image_gallery',
  VIDEO_LIBRARY = 'video_library',
  FILE_STORAGE = 'file_storage',
  
  // Knowledge management
  KNOWLEDGE_BASE = 'knowledge_base',
  FAQ = 'faq',
  DOCUMENTATION = 'documentation',
  TUTORIAL = 'tutorial',
  GUIDE = 'guide',
  
  // Business and operations
  CRM = 'crm',
  INVENTORY = 'inventory',
  INVOICES = 'invoices',
  CONTACTS = 'contacts',
  
  // Personal productivity
  JOURNAL = 'journal',
  HABITS = 'habits',
  GOALS = 'goals',
  NOTES = 'notes',
  
  // Templates and examples
  TEMPLATE = 'template',
  EXAMPLE = 'example',
  STARTER = 'starter',
  
  // System and configuration
  SETTINGS = 'settings',
  ARCHIVE = 'archive',
  TRASH = 'trash',
  BACKUP = 'backup'
}

/**
 * Icon mapping for each content type
 * These icons are used for first-level navigation items only
 */
export const CONTENT_TYPE_ICONS: Record<ContentType, LucideIcon> = {
  // Core content types
  [ContentType.PAGE]: FileText,
  [ContentType.DATABASE]: Database,
  
  // Specialized page types
  [ContentType.DOCUMENT]: FileText,
  [ContentType.NOTEBOOK]: BookOpen,
  [ContentType.WIKI]: BookOpen,
  [ContentType.BLOG_POST]: FileText,
  [ContentType.ARTICLE]: FileText,
  
  // Database-specific types
  [ContentType.TABLE]: Database,
  [ContentType.KANBAN_BOARD]: Kanban,
  [ContentType.CALENDAR]: Calendar,
  [ContentType.GALLERY]: Image,
  [ContentType.LIST]: ClipboardList,
  [ContentType.TIMELINE]: BarChart3,
  
  // Project and task management
  [ContentType.PROJECT]: Briefcase,
  [ContentType.TASK_LIST]: ClipboardList,
  [ContentType.ROADMAP]: Target,
  [ContentType.MILESTONE]: Flag,
  [ContentType.SPRINT]: Zap,
  
  // Data and analytics
  [ContentType.DASHBOARD]: BarChart3,
  [ContentType.REPORT]: FileText,
  [ContentType.CHART]: TrendingUp,
  [ContentType.METRICS]: Activity,
  
  // Collaboration
  [ContentType.TEAM_SPACE]: Users,
  [ContentType.MEETING_NOTES]: MessageSquare,
  [ContentType.DISCUSSION]: MessageSquare,
  [ContentType.FEEDBACK]: MessageSquare,
  
  // Media and assets
  [ContentType.MEDIA_LIBRARY]: FolderOpen,
  [ContentType.IMAGE_GALLERY]: Image,
  [ContentType.VIDEO_LIBRARY]: Video,
  [ContentType.FILE_STORAGE]: FolderOpen,
  
  // Knowledge management
  [ContentType.KNOWLEDGE_BASE]: BookOpen,
  [ContentType.FAQ]: HelpCircle,
  [ContentType.DOCUMENTATION]: FileCode,
  [ContentType.TUTORIAL]: GraduationCap,
  [ContentType.GUIDE]: BookOpen,
  
  // Business and operations
  [ContentType.CRM]: Users,
  [ContentType.INVENTORY]: Archive,
  [ContentType.INVOICES]: CreditCard,
  [ContentType.CONTACTS]: Users,
  
  // Personal productivity
  [ContentType.JOURNAL]: BookOpen,
  [ContentType.HABITS]: Target,
  [ContentType.GOALS]: Star,
  [ContentType.NOTES]: FileText,
  
  // Templates and examples
  [ContentType.TEMPLATE]: Copy,
  [ContentType.EXAMPLE]: Lightbulb,
  [ContentType.STARTER]: PlusCircle,
  
  // System and configuration
  [ContentType.SETTINGS]: Settings,
  [ContentType.ARCHIVE]: Archive,
  [ContentType.TRASH]: Trash2,
  [ContentType.BACKUP]: Shield
};

/**
 * Display names for content types
 */
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  // Core content types
  [ContentType.PAGE]: 'Page',
  [ContentType.DATABASE]: 'Database',
  
  // Specialized page types
  [ContentType.DOCUMENT]: 'Document',
  [ContentType.NOTEBOOK]: 'Notebook',
  [ContentType.WIKI]: 'Wiki',
  [ContentType.BLOG_POST]: 'Blog Post',
  [ContentType.ARTICLE]: 'Article',
  
  // Database-specific types
  [ContentType.TABLE]: 'Table',
  [ContentType.KANBAN_BOARD]: 'Kanban Board',
  [ContentType.CALENDAR]: 'Calendar',
  [ContentType.GALLERY]: 'Gallery',
  [ContentType.LIST]: 'List',
  [ContentType.TIMELINE]: 'Timeline',
  
  // Project and task management
  [ContentType.PROJECT]: 'Project',
  [ContentType.TASK_LIST]: 'Task List',
  [ContentType.ROADMAP]: 'Roadmap',
  [ContentType.MILESTONE]: 'Milestone',
  [ContentType.SPRINT]: 'Sprint',
  
  // Data and analytics
  [ContentType.DASHBOARD]: 'Dashboard',
  [ContentType.REPORT]: 'Report',
  [ContentType.CHART]: 'Chart',
  [ContentType.METRICS]: 'Metrics',
  
  // Collaboration
  [ContentType.TEAM_SPACE]: 'Team Space',
  [ContentType.MEETING_NOTES]: 'Meeting Notes',
  [ContentType.DISCUSSION]: 'Discussion',
  [ContentType.FEEDBACK]: 'Feedback',
  
  // Media and assets
  [ContentType.MEDIA_LIBRARY]: 'Media Library',
  [ContentType.IMAGE_GALLERY]: 'Image Gallery',
  [ContentType.VIDEO_LIBRARY]: 'Video Library',
  [ContentType.FILE_STORAGE]: 'File Storage',
  
  // Knowledge management
  [ContentType.KNOWLEDGE_BASE]: 'Knowledge Base',
  [ContentType.FAQ]: 'FAQ',
  [ContentType.DOCUMENTATION]: 'Documentation',
  [ContentType.TUTORIAL]: 'Tutorial',
  [ContentType.GUIDE]: 'Guide',
  
  // Business and operations
  [ContentType.CRM]: 'CRM',
  [ContentType.INVENTORY]: 'Inventory',
  [ContentType.INVOICES]: 'Invoices',
  [ContentType.CONTACTS]: 'Contacts',
  
  // Personal productivity
  [ContentType.JOURNAL]: 'Journal',
  [ContentType.HABITS]: 'Habits',
  [ContentType.GOALS]: 'Goals',
  [ContentType.NOTES]: 'Notes',
  
  // Templates and examples
  [ContentType.TEMPLATE]: 'Template',
  [ContentType.EXAMPLE]: 'Example',
  [ContentType.STARTER]: 'Starter',
  
  // System and configuration
  [ContentType.SETTINGS]: 'Settings',
  [ContentType.ARCHIVE]: 'Archive',
  [ContentType.TRASH]: 'Trash',
  [ContentType.BACKUP]: 'Backup'
};

/**
 * Color themes for different content types
 */
export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  // Core content types
  [ContentType.PAGE]: 'blue',
  [ContentType.DATABASE]: 'purple',
  
  // Specialized page types
  [ContentType.DOCUMENT]: 'blue',
  [ContentType.NOTEBOOK]: 'green',
  [ContentType.WIKI]: 'teal',
  [ContentType.BLOG_POST]: 'orange',
  [ContentType.ARTICLE]: 'yellow',
  
  // Database-specific types
  [ContentType.TABLE]: 'purple',
  [ContentType.KANBAN_BOARD]: 'indigo',
  [ContentType.CALENDAR]: 'red',
  [ContentType.GALLERY]: 'pink',
  [ContentType.LIST]: 'gray',
  [ContentType.TIMELINE]: 'cyan',
  
  // Project and task management
  [ContentType.PROJECT]: 'blue',
  [ContentType.TASK_LIST]: 'green',
  [ContentType.ROADMAP]: 'purple',
  [ContentType.MILESTONE]: 'yellow',
  [ContentType.SPRINT]: 'orange',
  
  // Data and analytics
  [ContentType.DASHBOARD]: 'blue',
  [ContentType.REPORT]: 'green',
  [ContentType.CHART]: 'purple',
  [ContentType.METRICS]: 'red',
  
  // Collaboration
  [ContentType.TEAM_SPACE]: 'blue',
  [ContentType.MEETING_NOTES]: 'green',
  [ContentType.DISCUSSION]: 'orange',
  [ContentType.FEEDBACK]: 'yellow',
  
  // Media and assets
  [ContentType.MEDIA_LIBRARY]: 'purple',
  [ContentType.IMAGE_GALLERY]: 'pink',
  [ContentType.VIDEO_LIBRARY]: 'red',
  [ContentType.FILE_STORAGE]: 'gray',
  
  // Knowledge management
  [ContentType.KNOWLEDGE_BASE]: 'blue',
  [ContentType.FAQ]: 'green',
  [ContentType.DOCUMENTATION]: 'purple',
  [ContentType.TUTORIAL]: 'orange',
  [ContentType.GUIDE]: 'teal',
  
  // Business and operations
  [ContentType.CRM]: 'blue',
  [ContentType.INVENTORY]: 'green',
  [ContentType.INVOICES]: 'yellow',
  [ContentType.CONTACTS]: 'purple',
  
  // Personal productivity
  [ContentType.JOURNAL]: 'orange',
  [ContentType.HABITS]: 'green',
  [ContentType.GOALS]: 'yellow',
  [ContentType.NOTES]: 'blue',
  
  // Templates and examples
  [ContentType.TEMPLATE]: 'gray',
  [ContentType.EXAMPLE]: 'purple',
  [ContentType.STARTER]: 'green',
  
  // System and configuration
  [ContentType.SETTINGS]: 'gray',
  [ContentType.ARCHIVE]: 'gray',
  [ContentType.TRASH]: 'red',
  [ContentType.BACKUP]: 'green'
};

/**
 * Categories for grouping content types
 */
export enum ContentCategory {
  CORE = 'core',
  PAGES = 'pages',
  DATABASES = 'databases',
  PROJECTS = 'projects',
  ANALYTICS = 'analytics',
  COLLABORATION = 'collaboration',
  MEDIA = 'media',
  KNOWLEDGE = 'knowledge',
  BUSINESS = 'business',
  PERSONAL = 'personal',
  TEMPLATES = 'templates',
  SYSTEM = 'system'
}

/**
 * Mapping of content types to categories
 */
export const CONTENT_TYPE_CATEGORIES: Record<ContentType, ContentCategory> = {
  // Core content types
  [ContentType.PAGE]: ContentCategory.CORE,
  [ContentType.DATABASE]: ContentCategory.CORE,
  
  // Specialized page types
  [ContentType.DOCUMENT]: ContentCategory.PAGES,
  [ContentType.NOTEBOOK]: ContentCategory.PAGES,
  [ContentType.WIKI]: ContentCategory.PAGES,
  [ContentType.BLOG_POST]: ContentCategory.PAGES,
  [ContentType.ARTICLE]: ContentCategory.PAGES,
  
  // Database-specific types
  [ContentType.TABLE]: ContentCategory.DATABASES,
  [ContentType.KANBAN_BOARD]: ContentCategory.DATABASES,
  [ContentType.CALENDAR]: ContentCategory.DATABASES,
  [ContentType.GALLERY]: ContentCategory.DATABASES,
  [ContentType.LIST]: ContentCategory.DATABASES,
  [ContentType.TIMELINE]: ContentCategory.DATABASES,
  
  // Project and task management
  [ContentType.PROJECT]: ContentCategory.PROJECTS,
  [ContentType.TASK_LIST]: ContentCategory.PROJECTS,
  [ContentType.ROADMAP]: ContentCategory.PROJECTS,
  [ContentType.MILESTONE]: ContentCategory.PROJECTS,
  [ContentType.SPRINT]: ContentCategory.PROJECTS,
  
  // Data and analytics
  [ContentType.DASHBOARD]: ContentCategory.ANALYTICS,
  [ContentType.REPORT]: ContentCategory.ANALYTICS,
  [ContentType.CHART]: ContentCategory.ANALYTICS,
  [ContentType.METRICS]: ContentCategory.ANALYTICS,
  
  // Collaboration
  [ContentType.TEAM_SPACE]: ContentCategory.COLLABORATION,
  [ContentType.MEETING_NOTES]: ContentCategory.COLLABORATION,
  [ContentType.DISCUSSION]: ContentCategory.COLLABORATION,
  [ContentType.FEEDBACK]: ContentCategory.COLLABORATION,
  
  // Media and assets
  [ContentType.MEDIA_LIBRARY]: ContentCategory.MEDIA,
  [ContentType.IMAGE_GALLERY]: ContentCategory.MEDIA,
  [ContentType.VIDEO_LIBRARY]: ContentCategory.MEDIA,
  [ContentType.FILE_STORAGE]: ContentCategory.MEDIA,
  
  // Knowledge management
  [ContentType.KNOWLEDGE_BASE]: ContentCategory.KNOWLEDGE,
  [ContentType.FAQ]: ContentCategory.KNOWLEDGE,
  [ContentType.DOCUMENTATION]: ContentCategory.KNOWLEDGE,
  [ContentType.TUTORIAL]: ContentCategory.KNOWLEDGE,
  [ContentType.GUIDE]: ContentCategory.KNOWLEDGE,
  
  // Business and operations
  [ContentType.CRM]: ContentCategory.BUSINESS,
  [ContentType.INVENTORY]: ContentCategory.BUSINESS,
  [ContentType.INVOICES]: ContentCategory.BUSINESS,
  [ContentType.CONTACTS]: ContentCategory.BUSINESS,
  
  // Personal productivity
  [ContentType.JOURNAL]: ContentCategory.PERSONAL,
  [ContentType.HABITS]: ContentCategory.PERSONAL,
  [ContentType.GOALS]: ContentCategory.PERSONAL,
  [ContentType.NOTES]: ContentCategory.PERSONAL,
  
  // Templates and examples
  [ContentType.TEMPLATE]: ContentCategory.TEMPLATES,
  [ContentType.EXAMPLE]: ContentCategory.TEMPLATES,
  [ContentType.STARTER]: ContentCategory.TEMPLATES,
  
  // System and configuration
  [ContentType.SETTINGS]: ContentCategory.SYSTEM,
  [ContentType.ARCHIVE]: ContentCategory.SYSTEM,
  [ContentType.TRASH]: ContentCategory.SYSTEM,
  [ContentType.BACKUP]: ContentCategory.SYSTEM
};

/**
 * Utility functions for working with content types
 */
export class ContentTypeUtils {
  /**
   * Get the icon component for a content type
   */
  static getIcon(contentType: ContentType): LucideIcon {
    return CONTENT_TYPE_ICONS[contentType] || FileText;
  }

  /**
   * Get the display label for a content type
   */
  static getLabel(contentType: ContentType): string {
    return CONTENT_TYPE_LABELS[contentType] || 'Unknown';
  }

  /**
   * Get the color theme for a content type
   */
  static getColor(contentType: ContentType): string {
    return CONTENT_TYPE_COLORS[contentType] || 'gray';
  }

  /**
   * Get the category for a content type
   */
  static getCategory(contentType: ContentType): ContentCategory {
    return CONTENT_TYPE_CATEGORIES[contentType] || ContentCategory.CORE;
  }

  /**
   * Get all content types in a specific category
   */
  static getTypesByCategory(category: ContentCategory): ContentType[] {
    return Object.entries(CONTENT_TYPE_CATEGORIES)
      .filter(([_, typeCategory]) => typeCategory === category)
      .map(([contentType]) => contentType as ContentType);
  }

  /**
   * Check if a content type is a database-related type
   */
  static isDatabaseType(contentType: ContentType): boolean {
    return this.getCategory(contentType) === ContentCategory.DATABASES ||
           contentType === ContentType.DATABASE;
  }

  /**
   * Check if a content type is a page-related type
   */
  static isPageType(contentType: ContentType): boolean {
    return this.getCategory(contentType) === ContentCategory.PAGES ||
           contentType === ContentType.PAGE;
  }

  /**
   * Get suggested content types for a given context
   */
  static getSuggestedTypes(context: 'workspace' | 'project' | 'personal' | 'team'): ContentType[] {
    switch (context) {
      case 'workspace':
        return [
          ContentType.PAGE,
          ContentType.DATABASE,
          ContentType.PROJECT,
          ContentType.DASHBOARD,
          ContentType.KNOWLEDGE_BASE
        ];
      case 'project':
        return [
          ContentType.PROJECT,
          ContentType.TASK_LIST,
          ContentType.KANBAN_BOARD,
          ContentType.ROADMAP,
          ContentType.MEETING_NOTES
        ];
      case 'personal':
        return [
          ContentType.NOTES,
          ContentType.JOURNAL,
          ContentType.GOALS,
          ContentType.HABITS,
          ContentType.NOTEBOOK
        ];
      case 'team':
        return [
          ContentType.TEAM_SPACE,
          ContentType.PROJECT,
          ContentType.DISCUSSION,
          ContentType.DASHBOARD,
          ContentType.WIKI
        ];
      default:
        return [ContentType.PAGE, ContentType.DATABASE];
    }
  }
}
