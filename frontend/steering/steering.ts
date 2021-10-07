import p5 from 'p5';
import { s } from '../sketch';
import { SteeringManager } from './manager';

export abstract class ISteering {
    constructor(
        public position = s.createVector(),
        public velocity = s.createVector(),
        public mass = 1,
        public maxVelocity = 3,
        public maxSteeringForce = 0.5,
        public wanderCircleDistance = 1,
        public wanderCircleRadius = 1,
        public wanderAngle = 0,
        public wanderAngleChange = 15,
        public leaderBehindDistance = 50,
        public separationDistance = leaderBehindDistance
    ) {}
}

export class Steering extends ISteering {
    steeringManager!: SteeringManager;

    constructor() {
        super();
        this.steeringManager = new SteeringManager(this);
    }

    seek(targetPosition: p5.Vector, slowingRadius = 20) {
        this.steeringManager.seek(targetPosition, slowingRadius);
    }

    flee(targetPosition: p5.Vector) {
        this.steeringManager.flee(targetPosition);
    }

    wander() {
        this.steeringManager.wander();
    }

    evade(target: ISteering) {
        this.steeringManager.evade(target);
    }

    pursuit(target: ISteering) {
        this.steeringManager.pursuit(target);
    }

    followLeader(target: ISteering, wingMen: ISteering[], slowingRadius = 20) {
        this.steeringManager.followLeader(target, wingMen, slowingRadius);
    }

    applyForce(force: p5.Vector) {
        this.steeringManager.applyForce(force);
    }

    update() {
        this.steeringManager.update();
    }
}
