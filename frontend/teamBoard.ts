import p5 from 'p5'
import { s } from './sketch';
import { Block } from './block'
import { Board } from '../state/Board';
import { queryByRowAndColumn } from '../state/mutations';
import { GameState } from '../state/GameState';

export class TeamBoard {
    private position = s.createVector();
    private sz: number;
    private blocks: Block[][];
    private rows: number;
    private cols: number;
    
    constructor(x: number, y: number, sz: number = 30, r: number = 20, c: number = 10){
        this.position.set(x, y);
        this.sz = sz;
        this.rows = r;
        this.cols = c;

        this.blocks = [];
        for( let i = 0; i < c; i++){
            this.blocks[i] =  [];
            for (let j = 0; j < r; j++){
                this.blocks[i][j] = new Block(this.position.x + (i + 5) * this.sz, this.position.y+ (j + 3) * this.sz, this.sz);
            }
        }
    }

    draw() {
        // draw player and scores rect
        s.fill(50);
        s.rect(this.position.x, this.position.y + 3 *  this.sz , this.sz * 5, this.sz*this.rows);
        s.rect(this.position.x + this.sz * 15, this.position.y + 3 *  this.sz, this.sz*5, this.sz*this.rows);
        // show players

        // show score, line, level and preview
        s.fill(200);
        s.textSize(this.sz);
        s.textAlign(s.CENTER);
        s.text("Score", this.position.x + this.sz * 15, this.position.y + 4 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text("0", this.position.x + this.sz * 15, this.position.y + 5 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text("Lines", this.position.x + this.sz * 15, this.position.y + 7 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text("0", this.position.x + this.sz * 15, this.position.y + 8 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text("Level", this.position.x + this.sz * 15, this.position.y + 10 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text("0", this.position.x + this.sz * 15, this.position.y + 11 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text("Preview", this.position.x + this.sz * 15, this.position.y + 13 *  this.sz, this.sz*5, this.sz*this.rows)
        // draw game area
        for (let i = 0; i < this.cols; i++){
            for (let j = 0; j < this.rows; j++){
                this.blocks[i][j].draw();
            }
        }
    }
    
    update(gameState: GameState){
        // board: Board, currentBlock: Tetrolyso, currentPosition: Position, preview: Tetrolyso
        // draw player and scores rect
        s.fill(50);
        s.rect(this.position.x, this.position.y + 3 *  this.sz , this.sz * 5, this.sz*this.rows);
        s.rect(this.position.x + this.sz * 15, this.position.y + 3 *  this.sz, this.sz*5, this.sz*this.rows);
        // show players
        s.textSize(this.sz);
        s.textAlign(s.CENTER);
        // console.log(gameState.players)
        for (let i = 0; i < gameState.players.length; i ++) {
            if(gameState.turn === gameState.players[i]._id)
                s.fill(300);
            else 
                s.fill(150);
            s.text(gameState.players[i]._name, this.position.x, this.position.y + (4 + i*1.2) *  this.sz, this.sz*5, this.sz*this.rows)    
        }
        
        // show score, line, level and preview
        s.fill(200);
        s.text("Score", this.position.x + this.sz * 15, this.position.y + 4 *  this.sz, this.sz*5, this.sz*this.rows);
        s.text(gameState.totalPoints, this.position.x + this.sz * 15, this.position.y + 5 *  this.sz, this.sz*5, this.sz*this.rows);
        s.text("Lines", this.position.x + this.sz * 15, this.position.y + 7 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text(gameState.clearedLines, this.position.x + this.sz * 15, this.position.y + 8 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text("Level", this.position.x + this.sz * 15, this.position.y + 10 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text(gameState.level, this.position.x + this.sz * 15, this.position.y + 11 *  this.sz, this.sz*5, this.sz*this.rows)
        s.text("Preview", this.position.x + this.sz * 15, this.position.y + 13 *  this.sz, this.sz*5, this.sz*this.rows)

        // draw board
        const boardPosition = queryByRowAndColumn(gameState.board);
        for (let i = 0; i < this.cols; i++){
            for (let j = 0; j < this.rows; j++){
                this.blocks[i][j].update(boardPosition(j, i));
            }
        }
        // draw current block on board
        const blockPosition = queryByRowAndColumn(gameState.currentBlock);
        for (let i = gameState.currentPosition.row; i < gameState.currentPosition.row + gameState.currentBlock.rows; ++i) {
            for (let j = gameState.currentPosition.col; j < gameState.currentPosition.col + gameState.currentBlock.cols; ++j) {
                if (blockPosition(i - gameState.currentPosition.row, j - gameState.currentPosition.col) !== 0) {
                    // console.log("current",i, j, currentBlock.color));
                    this.blocks[j][i].update(gameState.currentBlock.color);
                }
            }
        }
        // preview blocks show
        const previewPosition = queryByRowAndColumn(gameState.nextBlock);
        s.fill(`#${gameState.nextBlock.color.toString(16)}`);
        for(let i = 0; i < gameState.nextBlock.rows; i++){
            for (let j = 0; j < gameState.nextBlock.cols; j++){
                if(previewPosition(i, j) !== 0)
                s.rect(this.position.x + this.sz * (15.5 + j), this.position.y + this.sz *(14.5 + i), this.sz, this.sz)
            }
        }
    }
}