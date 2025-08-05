import { SerializableGame } from './serializable-game';

export interface PickDTO extends SerializableGame {
  pickWinner: string;
  user?: string;
}
