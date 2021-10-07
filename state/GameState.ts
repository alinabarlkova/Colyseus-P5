import {Schema, type} from "@colyseus/schema";
import {getRandomBlock, Tetrolyso} from "./Tetrolyso";
import {Position} from "./Position";
import {Board} from "./Board";
import { Player } from "./Player";

export class GameState extends Schema {
    @type(Board)
    board: Board;

    @type(Tetrolyso)
    currentBlock: Tetrolyso;

    @type(Position)
    currentPosition: Position;

    @type(Tetrolyso)
    nextBlock: Tetrolyso;

    @type("number")
    clearedLines: number;

    @type("number")
    level: number;

    @type("number")
    totalPoints: number;

    @type("boolean")
    running: boolean;

    @type("string")
    turn: string

    @type("number")
    result: number

    @type(Player)
    players: Array<Player>;

    constructor(rows: number = 20, cols: number = 10, initialLevel = 0) {
        super();
        this.board = new Board(rows, cols);
        this.currentBlock = getRandomBlock();
        this.currentPosition = new Position(
            0,
            Math.floor((this.board.cols / 2) - (this.currentBlock.cols / 2))
        );
        this.nextBlock = getRandomBlock();
        this.level = initialLevel;
        this.clearedLines = 0;
        this.totalPoints = 0;
        this.running = false;//0 not start 1 running
        this.result = 3;//0 lose, 1 draw, 2 winning, 3 doing
        this.players = new Array<Player>();
    }
}