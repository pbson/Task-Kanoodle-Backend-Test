"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DLX = void 0;
class DLX {
    columnList_;
    headers;
    rows;
    constructor(rowInfo, numColumns) {
        this.createHeaders(numColumns);
        this.createRows(rowInfo, numColumns);
    }
    static solve(rowInfo, numColumns) {
        const dlx = new DLX(rowInfo, numColumns);
        return dlx.search(dlx.columnList_, [], null);
    }
    static solveAll(rowInfo, numColumns) {
        const solutions = [];
        const dlx = new DLX(rowInfo, numColumns);
        dlx.search(dlx.columnList_, [], solutions);
        return solutions;
    }
    createRows(rowInfo, numColumns) {
        rowInfo = rowInfo.filter((x) => x);
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
    createHeaders(numColumns) {
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
    search(columns, partialSolution, allSolutions) {
        if (this.isColumnListEmpty(columns)) {
            return partialSolution;
        }
        const column = this.selectColumn(columns);
        let x = column.root.down;
        while (x !== column.root) {
            partialSolution.push(x.row.info);
            for (const r of x.row.cells) {
                this.eliminateColumn(r.column);
            }
            const solution = this.search(columns, partialSolution, allSolutions);
            if (solution !== null) {
                if (allSolutions !== null) {
                    allSolutions.push([...solution]);
                }
                else {
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
    isColumnListEmpty(columnList) {
        return (columnList.right === columnList);
    }
    selectColumn(columnList) {
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
    eliminateColumn(column) {
        let r = column.root.down;
        while (r !== column.root) {
            this.eliminateRow(r.row, column);
            r = r.down;
        }
        column.left.right = column.right;
        column.right.left = column.left;
    }
    reinstateColumn(column) {
        let r = column.root.down;
        while (r !== column.root) {
            this.reinstateRow(r.row);
            r = r.down;
        }
        column.left.right = column;
        column.right.left = column;
    }
    eliminateRow(row, skipColumn) {
        for (const cell of row.cells) {
            if (cell.column !== skipColumn) {
                if (!cell.detached) {
                    cell.up.down = cell.down;
                    cell.down.up = cell.up;
                    if (cell.column.count > 0) {
                        cell.column.count -= 1;
                    }
                    else {
                        throw new Error('Assertion failed: cell.column.count must be greater than 0');
                    }
                    cell.detached = true;
                }
            }
        }
    }
    reinstateRow(row) {
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
exports.DLX = DLX;
class Cell {
    up;
    down;
    column;
    row;
    detached;
}
class Header {
    left;
    right;
    root;
    count;
    constructor() {
        this.root = new Cell();
        this.root.up = this.root;
        this.root.down = this.root;
        this.count = 0;
    }
}
class Row {
    cells;
    info;
    constructor(info) {
        this.cells = [];
        this.info = info;
    }
}
