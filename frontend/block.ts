import { Color } from "p5";
import { s } from "./sketch";

export class Block {
    public color: number;
    public position = s.createVector();
    public size: number;

    constructor(x: number, y: number, sz: number){
        this.position.set(x, y);
        this.size = sz;
        this.color = 40;
    }

    draw() {
        s.fill(this.color);
        s.rect(this.position.x, this.position.y, this.size, this.size);
    }
    update(color: number) {
        if( color === 0 )
            s.fill(40);
        // console.log(`#${color.toString(16)}`);
        else 
            s.fill(`#${color.toString(16)}`);
        s.rect(this.position.x, this.position.y, this.size, this.size);
    }
}