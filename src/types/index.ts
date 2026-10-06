export type TabType = 'home' | 'chat' | 'settings';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MapsPlaceItem {
  title: string;
  uri: string;
  address?: string;
  reviewSnippets?: string[];
}

export interface GroundingMetadata {
  mode?: 'search' | 'maps' | 'none';
  webSources?: GroundingSource[];
  mapsPlaces?: MapsPlaceItem[];
  searchQueries?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  hasAudio?: boolean;
  audioBase64?: string;
  imageThumbnail?: string;
  toolCall?: {
    name: string;
    params: Record<string, any>;
  };
  groundingMetadata?: GroundingMetadata;
}

export type LiveVoiceName = 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon';
export type GroundingFilterMode = 'auto' | 'search' | 'maps' | 'chat';

export interface AppSettings {
  customApiKey: string;
  useCustomApiKey: boolean;
  youtubeApiKey: string;
  useCustomYoutubeApiKey: boolean;
  liveModel: string;
  chatModel: string;
  voice: LiveVoiceName;
  systemInstruction: string;
  enableLiveCaptions: boolean;
  enableBackgroundMode: boolean;
  enableWakeLock: boolean;
  accessibilityServiceEnabled: boolean;
  floatingOverlayEnabled: boolean;
  locationPermissionEnabled: boolean;
  notificationsPermissionEnabled: boolean;
  contactsPermissionEnabled: boolean;
  cameraPermissionEnabled: boolean;
  phoneStatePermissionEnabled: boolean;
  batteryOptimizationIgnored: boolean;
  speechRate: number;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  bengaliDialect: 'standard' | 'colloquial';
  defaultGroundingMode: GroundingFilterMode;
}

export interface LiveCaption {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  isInterim?: boolean;
  timestamp: number;
}

export interface PermissionStatusState {
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  screenShare: 'supported' | 'unsupported';
  audioPlayback: 'active' | 'suspended';
  wakeLock: 'supported' | 'unsupported';
  accessibilityService: 'granted' | 'denied';
  floatingOverlay: 'granted' | 'denied';
  location: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'prompt' | 'unknown';
  contacts: 'granted' | 'denied';
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  phoneState: 'granted' | 'denied';
  batteryOptimization: 'ignored' | 'restricted';
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  category: string;
  timeAgo: string;
  readText: string;
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  description: string;
}

export type DeviceActionType =
  | 'scroll_down'
  | 'scroll_up'
  | 'go_home'
  | 'go_back'
  | 'type_text'
  | 'launch_app'
  | 'toggle_flashlight'
  | 'volume_up'
  | 'volume_down';
