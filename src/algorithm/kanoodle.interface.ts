import { Rotation } from './kanoodle.enum';

export interface InitialPiece {
  symbol: string;
  rotation: Rotation;
  flipState: boolean;
  col: number;
  row: number;
}

export interface RowSupplier {
  isColumnOccupied(col: number): boolean;
}
