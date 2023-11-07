import { RowSupplier } from './kanoodle.interface';
import { toObject } from '@/utils/convertBigInt';

export class DLX {
  private columnList_: Header;
  private headers: Header[];
  private rows: Row[];

  constructor(rowInfo: RowSupplier[], numColumns: number) {
    this.createHeaders(numColumns);
    this.createRows(rowInfo, numColumns);
  }

  public static solve<T extends RowSupplier>(rowInfo: T[], numColumns: number): any {
    const dlx = new DLX(rowInfo, numColumns);
    return dlx.search(dlx.columnList_, [], null);
  }

  public static solveAll<T extends RowSupplier>(rowInfo: T[], numColumns: number): T[][] {
    const solutions: T[][] = [];
    const dlx = new DLX(rowInfo, numColumns);
    dlx.search(dlx.columnList_, [], solutions);
    return solutions;
  }

  private createRows(rowInfo: any, numColumns: number): void {
    rowInfo = rowInfo.filter(x => x);
    this.rows = [];
    for (const info of rowInfo) {
      const row = new Row(info);
      for (let c = 0; c < numColumns; c++) {
        if (info.isColumnOccupied(c)) {
          const cell = new Cell();
          cell.row = row;
          cell.column = this.headers[c];
          cell.up = cell.column.root.up;
          cell.down = cell.column.root;
          cell.column.root.up.down = cell;
          cell.column.root.up = cell;
          cell.column.count += 1;
          cell.detached = false;
          row.cells.push(cell);
        }
      }
      this.rows.push(row);
    }
  }

  private createHeaders(numColumns: number): void {
    this.columnList_ = new Header();
    this.columnList_.right = this.columnList_;
    this.columnList_.left = this.columnList_;
    this.headers = [];
    for (let i = 0; i < numColumns; i++) {
      const h = new Header();
      h.right = this.columnList_;
      h.left = this.columnList_.left;
      this.columnList_.left.right = h;
      this.columnList_.left = h;
      this.headers.push(h);
    }
  }

  count = 0;
  private search(columns: Header, partialSolution: RowSupplier[], allSolutions: RowSupplier[][]): RowSupplier[] {
    if (this.isColumnListEmpty(columns)) {
      return partialSolution;
    }
    const column = this.selectColumn(columns);
    let x = column.root.down;
    while (x !== column.root) {
      partialSolution.push(toObject(x.row.info));
      for (const r of x.row.cells) {
        this.eliminateColumn(r.column);
      }
      const solution = this.search(columns, partialSolution, allSolutions);
      if (solution !== null) {
        if (allSolutions !== null) {
          allSolutions.push([...solution]);
        } else {
          return solution;
        }
      }
      for (const r of x.row.cells) {
        this.reinstateColumn(r.column);
      }
      partialSolution.pop();
      x = x.down;
    }
    return null;
  }

  private isColumnListEmpty(columnList: Header): boolean {
    return columnList.right === columnList;
  }

  private selectColumn(columnList: Header): Header {
    if (this.isColumnListEmpty(columnList)) {
      return null;
    }
    let min = columnList.right;
    let col = min.right;
    while (col !== columnList) {
      if (col.count < min.count) {
        min = col;
      }
      col = col.right;
    }
    return min;
  }

  private eliminateColumn(column: Header): void {
    let r = column.root.down;
    while (r !== column.root) {
      this.eliminateRow(r.row, column);
      r = r.down;
    }
    column.left.right = column.right;
    column.right.left = column.left;
  }

  private reinstateColumn(column: Header): void {
    let r = column.root.down;
    while (r !== column.root) {
      this.reinstateRow(r.row);
      r = r.down;
    }
    column.left.right = column;
    column.right.left = column;
  }

  private eliminateRow(row: Row, skipColumn: Header): void {
    for (const cell of row.cells) {
      if (cell.column !== skipColumn) {
        if (!cell.detached) {
          cell.up.down = cell.down;
          cell.down.up = cell.up;
          if (cell.column.count > 0) {
            cell.column.count -= 1;
          } else {
            throw new Error('Assertion failed: cell.column.count must be greater than 0');
          }
          cell.detached = true;
        }
      }
    }
  }

  private reinstateRow(row: Row): void {
    for (const cell of row.cells) {
      if (cell.detached) {
        cell.up.down = cell;
        cell.down.up = cell;
        cell.column.count += 1;
        cell.detached = false;
      }
    }
  }
}

class Cell {
  public up: Cell;
  public down: Cell;
  public column: Header;
  public row: Row;
  public detached: boolean;
}

class Header {
  public left: Header;
  public right: Header;
  public root: Cell;
  public count: number;

  constructor() {
    this.root = new Cell();
    this.root.up = this.root;
    this.root.down = this.root;
    this.count = 0;
  }
}

class Row {
  public cells: Cell[];
  public info: RowSupplier;

  constructor(info: RowSupplier) {
    this.cells = [];
    this.info = info;
  }
}
