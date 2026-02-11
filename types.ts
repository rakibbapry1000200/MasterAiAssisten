
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface CreatorInfo {
  name: string;
  image: string;
  facebook: string;
  whatsapp: string;
  email: string;
  youtube: string;
}

export enum SessionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}
