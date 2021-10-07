import {Client, Delayed, Room} from "colyseus";
import {GameState} from "../state/GameState";
import {Position} from "../state/Position";
import {
    collidesWithBoard,
    isBottomOutOfBounds,
    isLeftOutOfBounds,
    isRightOutOfBounds,
    isRowCompleted,
    isRowEmpty, keepTetrolysoInsideBounds
} from "./validation";
import {addEmptyRowToBoard, deleteRowsFromBoard, freezeCurrentTetrolyso} from "../state/mutations";
import {getRandomBlock} from "../state/Tetrolyso";
import {computeScoreForClearedLines} from "./scoring";
import {Movement} from "../messages/movement";
import {Player, PlayerType} from "../state/Player";
import {ReadyState} from "../messages/readystate";
import { Board } from "../state/Board";

export class TetrolyseusRoom extends Room<GameState[]> {
    private DEFAULT_ROWS = 20;
    private DEFAULT_COLS = 10;
    private DEFAULT_LEVEL = 0;

    private playerMap: Map<string, Player>;
    // let keys = Array.from( myMap.keys() );
    private gameLoop0!: Delayed;
    private gameLoop1!: Delayed;
    private levelLoop!: Delayed;

    constructor() {
        super();
        this.playerMap = new Map<string, Player>();
    }
    

    private loopFunction0 = () => {
        const nextPosition = this.dropTetrolyso(0)
        this.moveOrFreezeTetrolyso(nextPosition, 0);

        const completedLines = this.detectCompletedLines(0);
        this.updateClearedLines(completedLines, 0);
        this.updateTotalPoints(completedLines, 0);
        this.updateBoard(completedLines, 0);
        this.checkNextLevel(0);
    }
    private loopFunction1 = () => {
        const nextPosition = this.dropTetrolyso(1)
        this.moveOrFreezeTetrolyso(nextPosition, 1);

        const completedLines = this.detectCompletedLines(1);
        this.updateClearedLines(completedLines, 1);
        this.updateTotalPoints(completedLines, 1);
        this.updateBoard(completedLines, 1);
        this.checkNextLevel(1);
    }

    private dropTetrolyso(no: number) {
        return new Position(
            this.state[no].currentPosition.row + 1,
            this.state[no].currentPosition.col
        );
    }

    private detectCompletedLines(no: number) {
        let completedLines = [];
        for (let boardRow = this.state[no].board.rows - 1; boardRow >= 0; --boardRow) {
            if (isRowEmpty(this.state[no].board, boardRow)) {
                break;
            }

            if (isRowCompleted(this.state[no].board, boardRow)) {
                completedLines.push(boardRow);
            }
        }
        return completedLines;
    }

    private updateBoard(completedLines: number[], no: number) {
        for (let rowIdx = 0; rowIdx < completedLines.length; ++rowIdx) {
            deleteRowsFromBoard(this.state[no].board, completedLines[rowIdx] + rowIdx);
            addEmptyRowToBoard(this.state[no].board);
        }
    }

    private dropNewTetrolyso(no: number) {
        this.state[no].currentPosition = new Position(
            0,
            Math.floor((this.state[no].board.cols / 2) - (this.state[no].nextBlock.cols / 2))
        );
        this.state[no].currentBlock = this.state[no].nextBlock.clone();
        this.state[no].nextBlock = getRandomBlock();
        // get next turn
        let i = 0;
        for(i = 0; i < this.state[no].players.length; ++i ){
            if(this.state[no].players[i]._id == this.state[no].turn)
                break;
        }
        this.state[no].turn = this.state[no].players[(i + 1) % this.state[no].players.length]._id;
    }

    private checkGameOver(no: number) {
        if (collidesWithBoard(this.state[no].board, this.state[no].currentBlock, this.state[no].currentPosition)) {
            this.gameLoop0.clear();
            this.gameLoop1.clear();
            this.state[no].running = false;
        }
    }

    private moveOrFreezeTetrolyso(nextPosition: Position, no: number) {
        if (
            !isBottomOutOfBounds(this.state[no].board, this.state[no].currentBlock, nextPosition) &&
            !collidesWithBoard(this.state[no].board, this.state[no].currentBlock, nextPosition)
        ) {
            this.state[no].currentPosition = nextPosition;
        } else {
            freezeCurrentTetrolyso(this.state[no].board, this.state[no].currentBlock, this.state[no].currentPosition);
            this.dropNewTetrolyso(no);
            this.checkGameOver(no);
        }
    }

    private determineNextLevel(no: number): number {
        return Math.floor(this.state[no].clearedLines / 10);
    }

    private checkNextLevel(no: number) {
        const nextLevel = this.determineNextLevel(no);
        if (nextLevel > this.state[no].level) {
            this.state[no].level = nextLevel;
            this.restartGameLoop();
        }
    }

    private startGameLoop() {
        const loopInterval0 = 1000 / (this.state[0].level + 1);
        this.gameLoop0 = this.clock.setInterval(this.loopFunction0, loopInterval0);
        const loopInterval1 = 1000 / (this.state[1].level + 1);
        this.gameLoop1 = this.clock.setInterval(this.loopFunction1, loopInterval1);
        this.levelLoop = this.clock.setInterval(this.levelFunction, 600*1000);
    }

    private levelFunction = () => {
        if(this.state[0].totalPoints === this.state[1].totalPoints){
            this.state[0].running = true;
            this.state[1].running = true;
            this.state[0].result = 4;
            this.state[0].result = 4;
        }
        else{
            console.log("only one win")
            let no = Math.max(this.state[0].totalPoints, this.state[1].totalPoints);
            this.state[0].running = this.state[0].totalPoints === no? true: false;
            this.state[1].running = this.state[1].totalPoints === no? true: false;
        }
    }

    private stopGameLoop() {
        this.gameLoop0.clear();
        this.gameLoop1.clear();
        this.levelLoop.clear();
    }

    private restartGameLoop() {
        this.stopGameLoop();
        this.startGameLoop();
    }

    private levelRestart = () => {
        for( let no = 0; no < 2; no++){
            this.state[no].running = true;
            this.state[no].level = 0;
            this.state[no].clearedLines = 0;
            this.state[no].currentPosition = new Position(
                0,
                Math.floor((this.state[no].board.cols / 2) - (this.state[no].nextBlock.cols / 2))
            );
            this.state[no].totalPoints = 0;
            this.state[no].result = 3;
            this.state[no].board.values = new Array<number>(this.state[no].board.rows * this.state[no].board.cols).fill(0);
        }
        this.restartGameLoop();
    }

    private updateTotalPoints(completedLines: any[], no: number) {
        this.state[no].totalPoints += computeScoreForClearedLines(completedLines.length, this.state[no].level);
    }

    private updateClearedLines(completedLines: any[], no: number) {
        this.state[no].clearedLines += completedLines.length;
    }

    private roomHasTeam1(): boolean {
        let countTeam1 = 0;
        for (const player of this.playerMap.values()) {
            if (player.isTeam1())
                ++countTeam1;
            if(countTeam1 > 1)
                return true;
        }
        return false;
    }

    private roomHasTeam2(): boolean {
        let countTeam2  = 0;
        for (const player of this.playerMap.values()) {
            if (player.isTeam2())
                ++countTeam2;
            if(countTeam2 > 1)
                return true;
        }
        return false;
    }

    private allPlayersReady(): boolean {
        for (const player of this.playerMap.values()) {
            if (!player._ready) {
                return false;
            }
        }
        return true;
    }

    onCreate(options: any) {
        this.setState([new GameState(this.DEFAULT_ROWS, this.DEFAULT_COLS, this.DEFAULT_LEVEL), 
            new GameState(this.DEFAULT_ROWS, this.DEFAULT_COLS, this.DEFAULT_LEVEL)]);

        this.onMessage("rotate", (client, _) => {
            // if (this.playerMap.has(client.id) && this.playerMap.get(client.id).isTeam2()) {
            if (this.playerMap.has(client.id)) {
                const no = this.playerMap.get(client.id).isTeam1()? 0: 1;
                const rotatedBlock = this.state[no].currentBlock.rotate();
                const rotatedPosition = keepTetrolysoInsideBounds(this.state[no].board, rotatedBlock, this.state[no].currentPosition);
                if (this.state[no].turn === client.id && !collidesWithBoard(this.state[no].board, rotatedBlock, rotatedPosition)) {
                    this.state[no].currentBlock = rotatedBlock;
                    this.state[no].currentPosition = rotatedPosition;
                }
            }
        });
        
        this.onMessage("move", (client, message: Movement) => {
            // if (this.playerMap.has(client.id) && this.playerMap.get(client.id).isTeam1()) {
            if (this.playerMap.has(client.id)) {
                const no = this.playerMap.get(client.id).isTeam1()? 0: 1;

                const nextPosition = new Position(
                    this.state[no].currentPosition.row + message.row,
                    this.state[no].currentPosition.col + message.col
                );
                // console.log(client.id, "no", no, nextPosition.row, nextPosition.col);
                if (
                    this.state[no].turn === client.id &&
                    !isLeftOutOfBounds(this.state[no].board, this.state[no].currentBlock, nextPosition) &&
                    !isRightOutOfBounds(this.state[no].board, this.state[no].currentBlock, nextPosition) &&
                    !isBottomOutOfBounds(this.state[no].board, this.state[no].currentBlock, nextPosition) &&
                    !collidesWithBoard(this.state[no].board, this.state[no].currentBlock, nextPosition)
                ) {
                    this.state[no].currentPosition = nextPosition;
                }
            }
        });

        this.onMessage("ready", (client, message: ReadyState) => {
            if (this.playerMap.has(client.id)) {
                this.playerMap.get(client.id)._ready = message.isReady;
            }

            if(this.state[0].running && this.state[1].running){
                console.log("add new palyer");
                this.state[this.playerMap.get(client.id)._type].players.push(this.playerMap.get(client.id));
            }
            
            if (this.roomHasTeam1() && this.roomHasTeam2() && this.allPlayersReady() && !(this.state[0].running && this.state[1].running)) {
                console.log("Start game");
                
                for (const [key, value] of this.playerMap.entries()) {
                    this.state[value._type].players.push(value);
                }
                this.state[0].turn = this.state[0].players[0]._id;
                this.state[1].turn = this.state[1].players[0]._id;
                this.state[0].running = true;
                this.state[1].running = true;
                this.state[0].result = 3;
                this.state[1].result = 3;
                this.startGameLoop();
            }
            console.log("----------------- client ready ----------------\n", this.state[0].running, this.state[1].running);
        });

        this.onMessage("team", (client, type: PlayerType) => {
            console.log("Team", client.id);
            if (this.playerMap.has(client.id)) {
                this.playerMap.get(client.id)._type = type;
            }
        });

        this.onMessage("end", (client, _) => {
            console.log("End", this.state[0].running, this.state[1].running);
            // draw
            this.levelLoop.clear();
            this.stopGameLoop();
            if(this.state[0].running === this.state[1].running){
                this.state[0].running = false;
                this.state[1].running = false;
                this.state[0].result = 1;
                this.state[1].result = 1;
            }
            else {
                this.state[0].result = this.state[0].running?2 : 0;
                this.state[1].result = this.state[1].running?2 : 0;
                this.state[0].running = false;
                this.state[1].running = false;
                // console.log("**************************************************************", this.state[0].result, this.state[1].result);
            }

            this.clock.setTimeout(() => {
                // console.log("++++++++++++++++++++++ set timeout ++++++++++++++");
                this.levelRestart();
            }, 30 * 1000)
        });
    }

    onJoin(client: Client, options: any) {
        const playerType = Math.random() >= 0.5 ? PlayerType.TEAM1 : PlayerType.TEAM2;
        this.playerMap.set(client.id, new Player(client.id, options.name, false, playerType));
        console.log("==================== client join =================\n", this.playerMap);
    }

    onLeave(client: Client, consented: boolean) {
        // require remove
        const p = this.playerMap.get(client.id);
        const ps = this.state[p._type].players;
        const no = this.playerMap.get(client.id).isTeam1()? 0: 1;
        this.state[no].players = ps.filter(function(e){
            return e !== p;
        })
        this.playerMap.delete(client.id);
    }

    onDispose() {
    }
}
