import {Schema, type} from "@colyseus/schema";
export enum PlayerType {
    TEAM1,
    TEAM2
}

export class Player extends Schema {
    @type("string")
    _id: string;
    
    @type("string")
    _name: string;
    
    @type("boolean")
    _ready: boolean;
    
    @type("number")
    _type: PlayerType;
    // 1 running, 0 not started, -1: 

    constructor(id: string, name: string, ready: boolean, type: PlayerType) {
        super();
        this._id = id;
        this._name = name;
        this._ready = false;
        this._type = type;
    }

    public isTeam1(): boolean {
        return this._type === PlayerType.TEAM1;
    }
    public isTeam2(): boolean {
        return this._type === PlayerType.TEAM2;
    }
}