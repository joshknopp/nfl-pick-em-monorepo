import { SerializableGame } from './serializable-game';

export interface GameDto extends SerializableGame {
  id: string;
  kickoffTime: string; // ISO string for serialization
  winner?: string | null;
}
