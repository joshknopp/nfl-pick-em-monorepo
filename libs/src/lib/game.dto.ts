import { SerializableGame } from './serializable-game';

export interface GameDto extends SerializableGame {
  kickoffTime: string; // ISO string for serialization
  winner?: string | null;
}
