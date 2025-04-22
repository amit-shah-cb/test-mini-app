/**
 * Match-3 board implementation using bit manipulation
 * Each cell uses 2 bits to represent 4 colors
 * Board is 8x8 = 64 cells = 128 bits total
 */

// Color encoding (2 bits per color)
enum Color {
    EMPTY = 0b00,
    RED = 0b01,
    BLUE = 0b10,
    GREEN = 0b11
}

export class Match3Board {
    // Two 64-bit numbers to represent the board (2 bits per cell)
    private lowBits: bigint;   // Lower bit of each 2-bit cell
    private highBits: bigint;  // Higher bit of each 2-bit cell
    
    constructor() {
        this.lowBits = 0n;
        this.highBits = 0n;
    }

    /**
     * Gets color at specific position
     * @param row - Row index (0-7)
     * @param col - Column index (0-7)
     */
    getColor(row: number, col: number): Color {
        const pos = row * 8 + col;
        const mask = 1n << BigInt(pos);
        const low = Number((this.lowBits & mask) !== 0n);
        const high = Number((this.highBits & mask) !== 0n);
        return (high << 1) | low;
    }

    /**
     * Sets color at specific position
     * @param row - Row index (0-7)
     * @param col - Column index (0-7)
     * @param color - Color to set
     */
    setColor(row: number, col: number, color: Color): void {
        const pos = row * 8 + col;
        const mask = 1n << BigInt(pos);
        
        // Set low bit
        if (color & 0b01) {
            this.lowBits |= mask;
        } else {
            this.lowBits &= ~mask;
        }
        
        // Set high bit
        if (color & 0b10) {
            this.highBits |= mask;
        } else {
            this.highBits &= ~mask;
        }
    }

    /**
     * Applies gravity to the entire board in parallel with proper stacking
     * This version ensures pieces stack on top of each other
     */
    applyGravity(): void {
        // Create column masks (1 in every 8th bit)
        const columnMasks: bigint[] = [];
        for (let col = 0; col < 8; col++) {
            let mask = 0n;
            for (let row = 0; row < 8; row++) {
                mask |= 1n << BigInt(row * 8 + col);
            }
            columnMasks.push(mask);
        }

        // Process all columns in parallel until no more movement
        let moved: boolean;
        do {
            moved = false;
            
            // For each row from bottom-up (except top row)
            for (let row = 0; row < 7; row++) {
                // Create masks for current row
                const currentRowMask = (0xFFn << BigInt(row * 8));
                const aboveRowMask = (0xFFn << BigInt((row + 1) * 8));
                
                // Find occupied cells (any piece)
                const occupiedCells = this.lowBits | this.highBits;
                
                // Find empty cells in current row that have no piece below them
                const emptyCells = ~occupiedCells & currentRowMask;
                
                if (emptyCells !== 0n) {
                    // For each column with empty cells
                    for (let col = 0; col < 8; col++) {
                        const columnMask = columnMasks[col];
                        const emptyInColumn = emptyCells & columnMask;
                        
                        if (emptyInColumn !== 0n) {
                            // Check if this empty cell has no piece below it
                            const belowMask = columnMask & ((1n << BigInt(row * 8 + col)) - 1n);
                            const hasPieceBelow = (occupiedCells & belowMask) !== 0n;
                            
                            // Only move pieces down if there's space below
                            if (!hasPieceBelow || row === 0) {
                                // Find pieces above the empty cell in this column
                                const aboveMask = columnMask & aboveRowMask;
                                const piecesAbove = occupiedCells & aboveMask;
                                
                                if (piecesAbove !== 0n) {
                                    // Find the lowest piece above the empty cell
                                    const lowestPieceAbove = piecesAbove & (-piecesAbove); // Get lowest set bit
                                    
                                    // Move only the lowest piece down
                                    const lowBitMove = this.lowBits & lowestPieceAbove;
                                    const highBitMove = this.highBits & lowestPieceAbove;
                                    
                                    // Clear the piece from its current position
                                    this.lowBits &= ~lowestPieceAbove;
                                    this.highBits &= ~lowestPieceAbove;
                                    
                                    // Move piece down by 8 positions (one row)
                                    this.lowBits |= lowBitMove >> 8n;
                                    this.highBits |= highBitMove >> 8n;
                                    
                                    moved = true;
                                }
                            }
                        }
                    }
                }
            }
        } while (moved);
    }

    /**
     * Prints the board for debugging
     */
    printBoard(): void {
        const symbols = {
            [Color.EMPTY]: '.',
            [Color.RED]: 'R',
            [Color.BLUE]: 'B',
            [Color.GREEN]: 'G'
        };

        for (let row = 7; row >= 0; row--) {
            let line = '';
            for (let col = 0; col < 8; col++) {
                const color = this.getColor(row, col);
                line += symbols[color] + ' ';
            }
            console.log(line);
        }
        console.log('');
    }

    /**
     * Creates a test pattern for stacking demonstration
     */
    createStackingTestPattern(): void {
        // Create floating pieces that should stack
        this.setColor(7, 3, Color.RED);    // Top piece
        this.setColor(5, 3, Color.BLUE);   // Middle piece
        this.setColor(3, 3, Color.GREEN);  // Will stack on bottom
        
        // Create some ground pieces
        this.setColor(0, 3, Color.RED);    // Bottom piece
        
        // Create a different column stack
        this.setColor(6, 1, Color.BLUE);
        this.setColor(4, 1, Color.GREEN);
        this.setColor(2, 1, Color.RED);
    }
}

// Example usage:
/*
const board = new Match3Board();
board.createTestPattern();
console.log("Before gravity:");
board.printBoard();

board.applyGravity();
console.log("After gravity:");
board.printBoard();
*/ 