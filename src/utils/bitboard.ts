// Utility functions for chess bitboard operations

/**
 * Transposes a chess bitboard (converts ranks to files and vice versa).
 * This implementation uses the efficient "divide and conquer" approach
 * with bit manipulation operations.
 * 
 * @param bitboard - 64-bit number representing the chess board
 * @returns transposed bitboard
 */
export function transposeBitboard(bitboard: bigint): bigint {
    // Constants for masking and shifting
    const k1: bigint = 0x5500550055005500n;
    const k2: bigint = 0x3333000033330000n;
    const k4: bigint = 0x0f0f0f0f00000000n;
    
    // Step 1: Swap 1-bit blocks in 2x2 blocks
    let t = bitboard ^ ((bitboard << 8n) & k1);
    bitboard = t ^ ((t >> 8n) & k1);
    
    // Step 2: Swap 2-bit blocks in 4x4 blocks
    t = bitboard ^ ((bitboard << 16n) & k2);
    bitboard = t ^ ((t >> 16n) & k2);
    
    // Step 3: Swap 4-bit blocks in 8x8 blocks
    t = bitboard ^ ((bitboard << 32n) & k4);
    bitboard = t ^ ((t >> 32n) & k4);
    
    return bitboard;
}

/**
 * Helper function to print a bitboard in a human-readable format
 * @param bitboard - 64-bit number representing the chess board
 */
export function printBitboard(bitboard: bigint): void {
    for (let rank = 7; rank >= 0; rank--) {
        let row = '';
        for (let file = 0; file < 8; file++) {
            const square = rank * 8 + file;
            const bit = (bitboard >> BigInt(square)) & 1n;
            row += bit === 1n ? '1 ' : '0 ';
        }
        console.log(row);
    }
    console.log('');
}

// Example usage:
/*
const example = 0x8142241818244281n; // Some example pattern
console.log('Original:');
printBitboard(example);
console.log('Transposed:');
printBitboard(transposeBitboard(example));
*/

/**
 * Represents different chess piece types
 */
export enum PieceType {
    PAWN,
    KNIGHT,
    BISHOP,
    ROOK,
    QUEEN,
    KING
}

/**
 * Represents piece colors
 */
export enum Color {
    WHITE,
    BLACK
}

/**
 * Class to manage the chess board state using bitboards
 */
export class ChessBoard {
    private pieces: Map<PieceType, bigint>; // Bitboards for each piece type
    private colors: Map<Color, bigint>;     // Bitboards for each color
    
    constructor() {
        this.pieces = new Map();
        this.colors = new Map();
        
        // Initialize empty bitboards for each piece type
        Object.values(PieceType).forEach(piece => {
            if (typeof piece === 'number') {
                this.pieces.set(piece, 0n);
            }
        });
        
        // Initialize empty bitboards for each color
        this.colors.set(Color.WHITE, 0n);
        this.colors.set(Color.BLACK, 0n);
        
        // Set up initial chess position
        this.initializeStandardPosition();
    }
    
    /**
     * Sets up the standard chess starting position
     */
    private initializeStandardPosition(): void {
        // White pawns on rank 2
        this.setPieceBitboard(PieceType.PAWN, Color.WHITE, 0x000000000000FF00n);
        // Black pawns on rank 7
        this.setPieceBitboard(PieceType.PAWN, Color.BLACK, 0x00FF000000000000n);
        
        // White pieces on rank 1
        this.setPieceBitboard(PieceType.ROOK, Color.WHITE, 0x0000000000000081n);
        this.setPieceBitboard(PieceType.KNIGHT, Color.WHITE, 0x0000000000000042n);
        this.setPieceBitboard(PieceType.BISHOP, Color.WHITE, 0x0000000000000024n);
        this.setPieceBitboard(PieceType.QUEEN, Color.WHITE, 0x0000000000000008n);
        this.setPieceBitboard(PieceType.KING, Color.WHITE, 0x0000000000000010n);
        
        // Black pieces on rank 8
        this.setPieceBitboard(PieceType.ROOK, Color.BLACK, 0x8100000000000000n);
        this.setPieceBitboard(PieceType.KNIGHT, Color.BLACK, 0x4200000000000000n);
        this.setPieceBitboard(PieceType.BISHOP, Color.BLACK, 0x2400000000000000n);
        this.setPieceBitboard(PieceType.QUEEN, Color.BLACK, 0x0800000000000000n);
        this.setPieceBitboard(PieceType.KING, Color.BLACK, 0x1000000000000000n);
        
        // Update color bitboards
        this.updateColorBitboards();
    }
    
    /**
     * Updates the color bitboards based on piece positions
     */
    private updateColorBitboards(): void {
        let whitePieces = 0n;
        let blackPieces = 0n;
        
        Object.values(PieceType).forEach(piece => {
            if (typeof piece === 'number') {
                const pieceBitboard = this.pieces.get(piece) || 0n;
                const whiteMask = this.getColorMask(Color.WHITE, piece);
                const blackMask = this.getColorMask(Color.BLACK, piece);
                
                whitePieces |= pieceBitboard & whiteMask;
                blackPieces |= pieceBitboard & blackMask;
            }
        });
        
        this.colors.set(Color.WHITE, whitePieces);
        this.colors.set(Color.BLACK, blackPieces);
    }
    
    /**
     * Gets the mask for a specific color and piece type
     */
    private getColorMask(color: Color, piece: PieceType): bigint {
        // In a real implementation, this would return the appropriate mask
        // based on the current game state
        return color === Color.WHITE ? 0x000000000000FFFFn : 0xFFFF000000000000n;
    }
    
    /**
     * Sets a piece bitboard
     */
    public setPieceBitboard(piece: PieceType, color: Color, bitboard: bigint): void {
        this.pieces.set(piece, bitboard);
        this.updateColorBitboards();
    }
    
    /**
     * Gets the piece at a specific square
     * @param square - Square index (0-63)
     * @returns Object containing piece type and color, or null if empty
     */
    public getPieceAtSquare(square: number): { type: PieceType; color: Color } | null {
        const mask = 1n << BigInt(square);
        
        // Check each piece type
        for (const [piece, bitboard] of this.pieces.entries()) {
            if (bitboard & mask) {
                // Determine color
                const color = (this.colors.get(Color.WHITE) & mask) ? Color.WHITE : Color.BLACK;
                return { type: piece, color };
            }
        }
        
        return null;
    }
    
    /**
     * Makes a move on the board
     * @param fromSquare - Source square (0-63)
     * @param toSquare - Target square (0-63)
     */
    public makeMove(fromSquare: number, toSquare: number): void {
        const piece = this.getPieceAtSquare(fromSquare);
        if (!piece) return;
        
        const fromMask = 1n << BigInt(fromSquare);
        const toMask = 1n << BigInt(toSquare);
        const moveMask = fromMask | toMask;
        
        // Update piece bitboard
        let pieceBitboard = this.pieces.get(piece.type) || 0n;
        pieceBitboard ^= moveMask; // Clear source and set target
        this.pieces.set(piece.type, pieceBitboard);
        
        // Update color bitboards
        this.updateColorBitboards();
    }
    
    /**
     * Prints the current board state
     */
    public printBoard(): void {
        for (let rank = 7; rank >= 0; rank--) {
            let row = '';
            for (let file = 0; file < 8; file++) {
                const square = rank * 8 + file;
                const piece = this.getPieceAtSquare(square);
                if (piece) {
                    const symbol = this.getPieceSymbol(piece.type, piece.color);
                    row += symbol + ' ';
                } else {
                    row += '. ';
                }
            }
            console.log(rank + 1 + ' ' + row);
        }
        console.log('  a b c d e f g h');
        console.log('');
    }
    
    /**
     * Gets the Unicode symbol for a piece
     */
    private getPieceSymbol(piece: PieceType, color: Color): string {
        const symbols = {
            [Color.WHITE]: {
                [PieceType.PAWN]: '♙',
                [PieceType.KNIGHT]: '♘',
                [PieceType.BISHOP]: '♗',
                [PieceType.ROOK]: '♖',
                [PieceType.QUEEN]: '♕',
                [PieceType.KING]: '♔'
            },
            [Color.BLACK]: {
                [PieceType.PAWN]: '♟',
                [PieceType.KNIGHT]: '♞',
                [PieceType.BISHOP]: '♝',
                [PieceType.ROOK]: '♜',
                [PieceType.QUEEN]: '♛',
                [PieceType.KING]: '♚'
            }
        };
        return symbols[color][piece];
    }
}

// Example usage:
/*
const board = new ChessBoard();
board.printBoard(); // Prints initial position

// Make a move (e2-e4)
board.makeMove(12, 28);
board.printBoard();
*/ 