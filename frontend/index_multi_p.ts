import p5 from 'p5';
import { TeamBoard } from './teamBoard';
import { setSketch, s } from './sketch';
import {Board} from "../state/Board";
import {queryByRowAndColumn} from "../state/mutations";
import {Tetrolyso} from "../state/Tetrolyso";
import {Position} from "../state/Position";
import {Client, Room} from "colyseus.js";
import {GameState} from "../state/GameState";
import { PlayerType } from "../state/Player";
import {DOWN, LEFT, RIGHT} from "../messages/movement";
import {NOT_READY, READY} from "../messages/readystate";


document.addEventListener('DOMContentLoaded', async () => {
    const port = Number(process.env.PORT || 2567);
    const host = window.document.location.host.replace(/:.*/, '');
    const client = new Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + port : ''));
    const joinModal = <HTMLDivElement>document.querySelector("#join-modal");
    const createMode = <HTMLDivElement>document.querySelector("#create");
    const joinMode = <HTMLDivElement>document.querySelector("#join");

    const readyModal = <HTMLDivElement>document.querySelector("#ready-modal");
    const team1Button = <HTMLDivElement>document.querySelector("#team1");
    const team2Button = <HTMLDivElement>document.querySelector("#team2");
    const readyButton = <HTMLDivElement>document.querySelector("#ready");
    const notReadyButton = <HTMLDivElement>document.querySelector("#not-ready");
    // teamModal.style.display = "none"; readyModal.style.display = "block";
    // let room : Room<GameState> | undefined;
    // createMode.addEventListener("click", async () => { client.create<GameState>("tetrolyseus").then((roomState) => { room = roomState; }); });
    client.joinOrCreate<GameState>("tetrolyseus").then((room) => {
        const handleInput = (ev: KeyboardEvent) => {
            if (room && ev.code === "Space" || ev.code === "ArrowUp") {
                room.send("rotate", {});
            } else if (ev.code === "ArrowLeft") {
                room.send("move", LEFT);
            } else if (ev.code === "ArrowRight") {
                room.send("move", RIGHT);
            } else if (ev.code === "ArrowDown") {
                room.send("move", DOWN);
            }
        };

        room?.onStateChange((newState: GameState) => {
            console.log("State change");
            if (newState[0].running && newState[1].running) {
                if (!(typeof document.onkeydown === "function")) {
                    document.addEventListener('keydown', handleInput);
                }
                readyModal.style.display = "none";
                gameState = newState;
                // renderGame(newState);
            } else {
                document.removeEventListener('keydown', handleInput);
            }
        });

        team1Button.addEventListener("click", () => { room.send("team", PlayerType.TEAM1); });
        team2Button.addEventListener("click", () => { room.send("team", PlayerType.TEAM2); });
        readyButton.addEventListener("click", () => { room.send("ready", READY); });
        notReadyButton.addEventListener("click", () => { room.send("ready", NOT_READY); } );
    })

    // console.log(client);
    // const room: Room<GameState> = await client.joinOrCreate<GameState>("tetrolyseus");

    client.getAvailableRooms("tetrolyseus").then(rooms => {
        for (var i=0; i<rooms.length; i++) {
            console.log(rooms[i].roomId, rooms[i].clients);
        }
    });

    let gameState : GameState | undefined;
    
    let ip5 = new p5((sketch) => {
        setSketch(sketch);
    
        let teamBoard0: TeamBoard;
        let teamBoard1: TeamBoard;
        const sz = Math.min(window.innerWidth / 42, window.innerHeight / 25);
        sketch.setup = () => {
            s.createCanvas(window.innerWidth, window.innerHeight);
            s.frameRate(12);
            
            teamBoard0 = new TeamBoard(window.innerWidth / 2 - sz * 20.1, 0, sz);
            teamBoard1 = new TeamBoard(window.innerWidth / 2 + sz * 0.1, 0, sz);
        };
        sketch.windowResized = () => {
            s.resizeCanvas(window.innerWidth, window.innerHeight);
        }
    
        sketch.draw = () => {
            s.fill(300);
            s.textSize(32);
            s.textAlign(s.CENTER);
            s.text("Team 1", window.innerWidth / 2 - sz * 15, sz * 1, sz * 10, sz * 3);
            s.text("Team 2", window.innerWidth / 2 + sz * 5, sz * 1, sz * 10, sz * 3);
            if( gameState && gameState[0].running &&  gameState[1].running ){ // update
                // console.log(gameState.currentBlock, gameState.nextBlock);
                teamBoard0.update(gameState[0]);
                teamBoard1.update(gameState[1]);
            }
            else {
                teamBoard0.draw();
                teamBoard1.draw();
            }
        };
    });

});