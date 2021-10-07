import p5 from 'p5';
import { s } from './sketch';
import { Steering } from './steering/steering';

export class Vehicle extends Steering {
    constructor(x: number, y: number, public leader = false, public radius = 5) {
        super();
        this.position.set(x, y);
        this.radius = this.leader ? this.radius * 3 : this.radius;
    }

    update() {
        this.checkBoundaries();
        super.update();
    }

    draw() {
        s.fill(this.leader ? 'green' : 'white');
        s.ellipse(this.position.x, this.position.y, this.radius, this.radius);
    }

    checkBoundaries() {
        const margin = 25;
        let desired!: p5.Vector;

        if (this.position.x < margin) {
            desired = s.createVector(1, 0);
        } else if (this.position.x > s.width - margin) {
            desired = s.createVector(-1, 0);
        }

        if (this.position.y < margin) {
            desired = s.createVector(0, 1);
        } else if (this.position.y > s.height - margin) {
            desired = s.createVector(0, -1);
        }

        if (desired) {
            desired.setMag(this.maxVelocity);
            const steer = p5.Vector.sub(desired, this.velocity);
            this.applyForce(steer);
            this.wanderAngle = s.degrees(desired.heading());
        }
    }
}
