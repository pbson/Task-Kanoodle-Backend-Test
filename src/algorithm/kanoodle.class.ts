import { DLX } from './dlx.class';
import { InitialPiece } from './kanoodle.interface';
import { Rotation } from '@/algorithm/kanoodle.enum';

class Kanoodle {
  static formatGrid(solution: SearchRow[], gridWidth: number, gridHeight: number): string {
    const grid: string[][] = new Array(gridHeight).fill([]).map(() => new Array(gridWidth).fill(' '));

    for (const row of solution) {
      const h: number = row.piece.getHeight(row.rotation);
      const w: number = row.piece.getWidth(row.rotation);

      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          if (row.piece.isTileAt(c, r, row.rotation, row.flipped)) {
            grid[row.row + r][row.col + c] = row.piece.symbol;
          }
        }
      }
    }

    const res: string[] = ['\n'];
    for (let r = 0; r < gridHeight; r++) {
      res.push(grid[r].join(''));
      res.push('\n');
    }

    return res.join('');
  }

  static findSolution(pieceDescriptions: any, gridWidth: number, gridHeight: number, initalPieces: InitialPiece[] = []): string {
    console.log('findSolution');
    const pieces: Piece[] = this.createPieces(pieceDescriptions, gridWidth, gridHeight);
    console.log('pieces');
    const rows: SearchRow[] = this.createSearchRows(pieces, gridWidth, gridHeight, initalPieces);
    console.log('rows');
    const solution: SearchRow[] | null = DLX.solve(rows, gridWidth * gridHeight + pieces.length);
    console.log(solution);
    if (solution !== null) {
      const formatGrid = this.formatGrid(solution, gridWidth, gridHeight);
      return formatGrid;
    }
    return 'No solution found';
  }

  static findAllSolutions(pieceDescriptions, gridWidth, gridHeight, initalPieces: InitialPiece[] = []) {
    const pieces = this.createPieces(pieceDescriptions, gridWidth, gridHeight);
    const rows = this.createSearchRows(pieces, gridWidth, gridHeight, initalPieces);
    const solutions = DLX.solveAll(rows, gridWidth * gridHeight + pieces.length);
    return solutions;
  }

  private static createPieces(pieceDescriptions: any, gridWidth: number, gridHeight: number): Piece[] {
    const pieces: Piece[] = [];
    for (let i = 0; i < pieceDescriptions.length; i++) {
      pieces[i] = new Piece(pieceDescriptions[i], i, gridWidth, gridHeight);
    }
    return pieces;
  }

  static createSearchRows(pieces, gridWidth, gridHeight, initalPieces = []) {
    const flipStates = [false, true];
    const rows = [];
    const pieceSignatures = new Set();

    for (const initialPiece of initalPieces) {
      const { symbol, rotation, flipState, col, row } = initialPiece;
      const initialPieceObj = pieces.find(piece => piece.symbol === symbol);

      if (initialPieceObj) {
        const signature = initialPieceObj.getSignature(rotation, flipState);
        if (!pieceSignatures.has(signature)) {
          pieceSignatures.add(signature);
          const searchRow = new SearchRow(initialPieceObj, rotation, col, row, flipState);
          rows.push(searchRow);
        }
      }
    }

    const piecesWithoutInitialPieces = pieces.filter(piece => !initalPieces.find(initialPiece => initialPiece.symbol === piece.symbol));

    for (const piece of piecesWithoutInitialPieces) {
      for (const rotation in Rotation) {
        if (isNaN(Number(rotation))) {
          for (const flip of flipStates) {
            const signature = piece.getSignature(rotation, flip);
            if (!pieceSignatures.has(signature)) {
              pieceSignatures.add(signature);
              //the maxCol and maxRow where u can place the piece
              const maxCol = gridWidth - piece.getWidth(rotation);
              const maxRow = gridHeight - piece.getHeight(rotation);
              //create a search row for every possible position
              for (let row = 0; row <= maxRow; row++) {
                for (let col = 0; col <= maxCol; col++) {
                  //for each position (flip, and rotation) create a search row aka an a specific configuration of placing a puzzle piece on the grid
                  const searchRow = new SearchRow(piece, rotation, col, row, flip);
                  rows.push(searchRow);
                }
              }
            }
          }
        }
      }
    }
    return rows;
  }
}

class Tile {
  constructor(col, row) {
    this.col = col;
    this.row = row;
  }

  col: number;
  row: number;
}

class Piece {
  public readonly index: number;
  public readonly symbol: string;
  public readonly gridWidth: number;
  public readonly gridHeight: number;
  public readonly color: string;
  private readonly dimensions: Tile;
  private readonly bitfield: bigint;
  private readonly tiles: Tile[];

  constructor(piece: { symbol: string; tiles: Tile[]; dimensions: Tile; color: string }, index: number, gridWidth: number, gridHeight: number) {
    this.index = index;
    this.symbol = piece.symbol;
    this.color = piece.color;
    this.tiles = piece.tiles;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.dimensions = piece.dimensions;
    this.bitfield = this.buildBitfield(piece.tiles);
  }

  private buildBitfield(tiles: Tile[]): bigint {
    let bits = BigInt(0);
    for (const t of tiles) {
      bits |= BigInt(1) << BigInt(t.row * 8 + t.col);
    }
    return bits;
  }

  public getWidth(r?: Rotation): number {
    if (!r) return this.dimensions.col;
    if (r === Rotation.ROTATION_0 || r === Rotation.ROTATION_180) {
      return this.dimensions.col;
    }
    return this.dimensions.row;
  }

  public getHeight(r?: Rotation): number {
    if (!r) return this.dimensions.row;
    if (r === Rotation.ROTATION_0 || r === Rotation.ROTATION_180) {
      return this.dimensions.row;
    }
    return this.dimensions.col;
  }

  public isTileAt(col: number, row: number, rotation: Rotation, flipped: boolean): boolean {
    let localCol = col;
    let localRow = row;
    switch (rotation) {
      case Rotation.ROTATION_0:
        if (flipped) {
          localCol = this.getWidth() - 1 - col;
        }
        break;
      case Rotation.ROTATION_90:
        localCol = row;
        localRow = this.getHeight() - 1 - col;
        if (flipped) {
          localRow = this.getHeight() - 1 - localRow;
        }
        break;
      case Rotation.ROTATION_180:
        if (!flipped) {
          localCol = this.getWidth() - 1 - localCol;
        }
        localRow = this.getHeight() - 1 - localRow;
        break;
      case Rotation.ROTATION_270:
        localCol = this.getWidth() - 1 - row;
        localRow = col;
        if (flipped) {
          localRow = this.getHeight() - 1 - localRow;
        }
        break;
    }
    if (localCol >= 0 && localRow >= 0 && localCol < this.getWidth() && localRow < this.getHeight()) {
      if (BigInt(0) !== (this.bitfield & (BigInt(1) << BigInt(localRow * 8 + localCol)))) {
        return true;
      }
    }
    return false;
  }

  public getSignature(rotation: Rotation, flipped: boolean): bigint {
    let signature = BigInt(0);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.isTileAt(c, r, rotation, flipped)) {
          signature |= BigInt(1) << BigInt(r * 8 + c);
        }
      }
    }
    return signature;
  }
}

class SearchRow {
  constructor(piece, rotation, col, row, flipped) {
    this.piece = piece;
    this.rotation = rotation;
    this.col = col;
    this.row = row;
    this.flipped = flipped;
  }

  public piece: Piece;
  public rotation: Rotation;
  public col: number;
  public row: number;
  public flipped: boolean;

  isTileAt(c, r) {
    return this.piece.isTileAt(c - this.col, r - this.row, this.rotation, this.flipped);
  }
  isColumnOccupied(col) {
    if (col >= this.piece.gridWidth * this.piece.gridHeight) {
      return this.piece.index == col - this.piece.gridWidth * this.piece.gridHeight;
    }
    return this.isTileAt(col % this.piece.gridWidth, Math.floor(col / this.piece.gridWidth));
  }
}

export { Kanoodle, Piece, Rotation, SearchRow, Tile };
