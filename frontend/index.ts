import p5 from 'p5';
import { TeamBoard } from './teamBoard';
import { setSketch, s } from './sketch';
import {Client, Room} from "colyseus.js";
import {GameState} from "../state/GameState";
import { PlayerType } from "../state/Player";
import {DOWN, LEFT, RIGHT} from "../messages/movement";
import {NOT_READY, READY} from "../messages/readystate";


document.addEventListener('DOMContentLoaded', async () => {
    var gameState : GameState | undefined;
    const port = Number(process.env.PORT || 2567);
    const host = window.document.location.host.replace(/:.*/, '');
    const client = new Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + port : ''));
    const connectModal = <HTMLDivElement>document.querySelector("#connect-modal");
    const createMode = <HTMLDivElement>document.querySelector("#create");
    const joinMode = <HTMLDivElement>document.querySelector("#join");
    const name = <HTMLInputElement>document.querySelector("#name");

    const readyModal = <HTMLDivElement>document.querySelector("#ready-modal");
    const readyButton = <HTMLDivElement>document.querySelector("#ready");
    const notReadyButton = <HTMLDivElement>document.querySelector("#not-ready");
    const teamModal = <HTMLDivElement>document.querySelector("#team-modal");
    const team1Button = <HTMLDivElement>document.querySelector("#team1");
    const team2Button = <HTMLDivElement>document.querySelector("#team2");

    const resultDiv = <HTMLDivElement>document.querySelector("#result-modal");
    
    const btn_right = <HTMLButtonElement>document.querySelector("#button-right");
    const btn_left = <HTMLButtonElement>document.querySelector("#button-left");
    const btn_up = <HTMLButtonElement>document.querySelector("#button-up");
    const btn_down = <HTMLButtonElement>document.querySelector("#button-down");

    // teamModal.style.display = "none"; readyModal.style.display = "block";
    // let room : Room<GameState> | undefined;
    // createMode.addEventListener("click", async () => { client.create<GameState>("tetrolyseus").then((roomState) => { room = roomState; }); });
    const roomFunction = (room: Room<GameState>) => {
        connectModal.style.display = "none";
        teamModal.style.display = "block";
        console.log("name", name.value)

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
        room.onStateChange((newState: GameState) => {
            // console.log("State change", newState[0].running, newState[1].running);
            gameState = newState;
            if( !newState[0].running && !newState[1].running && newState[0].result === 3){
            } // both are not running
            else {
                if (!(typeof document.onkeydown === "function")) {
                    document.addEventListener('keydown', handleInput);
                }
                // draw case
                if (newState[0].running && newState[1].running && newState[0].result === 4){
                    document.removeEventListener('keydown', handleInput);
                    room.send("end");
                }
                // one die
                else if ( newState[0].running !== newState[1].running && newState[0].result === 3){
                    document.removeEventListener('keydown', handleInput);
                    room.send("end")
                }
                // continue
                else {
                    if (newState[0].result === 3 && newState[1].running === 3){
                        // resultDiv.style.display = 'none';
                    }
                }
            }
        });
        btn_right.addEventListener("click", () => room.send("move", RIGHT));
        btn_left.addEventListener("click", () => room.send("move", LEFT));
        btn_up.addEventListener("click", () => room.send("rotate", {}));
        btn_down.addEventListener("click", () => room.send("move", DOWN));
        
        team1Button.addEventListener("click", () => { room.send("team", PlayerType.TEAM1); teamModal.style.display = "none"; readyModal.style.display="block"; });
        team2Button.addEventListener("click", () => { room.send("team", PlayerType.TEAM2); teamModal.style.display = "none"; readyModal.style.display="block"; });
        readyButton.addEventListener("click", () => { room.send("ready", READY); readyModal.style.display = "none";});
        notReadyButton.addEventListener("click", () => { room.send("ready", NOT_READY); readyModal.style.display = "none"; teamModal.style.display="block"; } );
    };

    createMode.addEventListener("click", () => {
        if(!name || name.value === ""){
            console.log("empty input");
            alert("Please input your name");
            return;
        }
        client.create<GameState>("tetrolyseus", {name : name.value}).then(
            roomFunction
        )
    })
    joinMode.addEventListener("click", () => {
        if(!name || name.value === ""){
            console.log("empty input");
            alert("Please input your name");
            return;
        }

        client.getAvailableRooms("tetrolyseus").then((rooms) => {
            const roomsDiv = <HTMLDivElement>document.querySelector("#rooms");
            roomsDiv.innerHTML = "";
            for(let i = 0; i < rooms.length; i++){
                const p = <HTMLElement>document.createElement("p");
                p.textContent = rooms[i].roomId + " (" + rooms[i].clients + ")";
                roomsDiv.appendChild(p);
                p.addEventListener("click", () => {
                    client.joinById<GameState>(rooms[i].roomId, {name : name.value}).then(roomFunction);
                })
            }
        });
        // client.join<GameState>("tetrolyseus", {name: name.value}).then( roomFunction )
    })

    let ip5 = new p5((sketch) => {
        setSketch(sketch);
    
        let teamBoard0: TeamBoard;
        let teamBoard1: TeamBoard;
        const sz = Math.min(window.innerWidth / 42, window.innerHeight / 25);
        sketch.setup = () => {
            s.createCanvas(window.innerWidth, window.innerHeight);
            s.frameRate(24);
            
            teamBoard0 = new TeamBoard(window.innerWidth / 2 - sz * 20.1, 0, sz);
            teamBoard1 = new TeamBoard(window.innerWidth / 2 + sz * 0.1, 0, sz);
        };
        sketch.windowResized = () => {
            s.resizeCanvas(window.innerWidth, window.innerHeight);
        }
    
        sketch.draw = () => {
            s.fill(200);
            s.textSize(1.8 * sz);
            s.textAlign(s.CENTER);
            s.text("Team 1", window.innerWidth / 2 - sz * 15, sz * 1, sz * 10, sz * 3);
            s.text("Team 2", window.innerWidth / 2 + sz * 5, sz * 1, sz * 10, sz * 3);

            // both are 0: not running 
            if( !gameState || (!gameState[0].running && gameState[1].running && gameState[0].result === 3 )){
                gameState && console.log(gameState[0].running, gameState[1].running, gameState[0].result, gameState[1].result)
                teamBoard0.draw();
                teamBoard1.draw();
            }
            // running stage
            else if( gameState[0].running && gameState[1].running && gameState[0].result !== 1){ // update
                console.log("update")
                resultDiv.style.display = 'none';
                // console.log(gameState.currentBlock, gameState.nextBlock);
                teamBoard0.update(gameState[0]);
                teamBoard1.update(gameState[1]);
            }
            else {
                console.log("show result", gameState[0].result, gameState[1].result);
                if ( gameState[0].result === 3 || gameState[1].result === 3)
                    resultDiv.style.display = 'none';
                else {
                    // const res = ["Lose", "Draw", "Winning"];
                    resultDiv.innerHTML = '';
                    resultDiv.style.display = "block";

                    const resultTitle = <HTMLElement>document.createElement("p");
                    resultTitle.textContent = "Result of Game";
                    resultTitle.setAttribute("class", "title");
                    resultDiv.append(resultTitle);
                    const team1_result = <HTMLElement>document.createElement("p");
                    team1_result.textContent = "Team 1 total score: " + gameState[0].totalPoints;// + " " + res[gameState[0].result];
                    resultDiv.append(team1_result);
                    const team2_result = <HTMLElement>document.createElement("p");
                    team2_result.textContent = "Team 2 total score: " + gameState[1].totalPoints;// + " " + res[gameState[1].result];
                    resultDiv.append(team2_result);
                }
            }
        };
    });
});