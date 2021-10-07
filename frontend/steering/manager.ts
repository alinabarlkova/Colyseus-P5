import { s } from '../sketch';
import p5 from 'p5';
import { ISteering } from './steering';

export class SteeringManager {
    constructor(public object: ISteering, public steering = s.createVector(0, 0)) {}

    seek(targetPosition: p5.Vector, slowingRadius = 20) {
        this.applyForce(this.doSeek(targetPosition, slowingRadius));
    }

    flee(targetPosition: p5.Vector) {
        const seekVector = this.doSeek(targetPosition);
        this.applyForce(seekVector.mult(-1));
    }

    wander() {
        this.applyForce(this.doWander());
    }

    evade(target: ISteering) {
        this.doEvade(target);
    }

    pursuit(target: ISteering) {
        this.applyForce(this.doPursuit(target));
    }

    followLeader(target: ISteering, wingMen: ISteering[], slowingRadius = 20) {
        this.applyForce(this.doFollowLeader(target, wingMen, slowingRadius));
    }

    separate(others: ISteering[]) {
        this.applyForce(this.doSeparate(others));
    }

    applyForce(force: p5.Vector) {
        this.steering.add(force);
    }

    update() {
        const position = this.object.position;
        const velocity = this.object.velocity;

        this.steering.limit(this.object.maxSteeringForce);
        this.steering.div(this.object.mass);

        velocity.add(this.steering);
        velocity.limit(this.object.maxVelocity);

        position.add(velocity);

        this.steering.set(0, 0);
    }

    private doSeek(targetPosition: p5.Vector, slowingRadius = 0): p5.Vector {
        const desired = p5.Vector.sub(targetPosition, this.object.position);
        const distance = desired.mag();

        if (distance <= slowingRadius) {
            const speedFactor = distance / slowingRadius;
            desired.setMag(this.object.maxVelocity * speedFactor);
        } else {
            desired.setMag(this.object.maxVelocity);
        }

        return desired.sub(this.object.velocity);
    }

    private doWander(): p5.Vector {
        // Calculate the circle center
        const circleCenter = this.object.velocity.copy();
        circleCenter.setMag(this.object.wanderCircleDistance);

        // Calculate the displacement force
        const displacement = p5.Vector.fromAngle(
            s.radians(this.object.wanderAngle),
            this.object.wanderCircleRadius
        );

        // Change wanderAngle just a bit, so it
        // won't have the same value in the
        // next game frame.
        const angleChange = this.object.wanderAngleChange;
        this.object.wanderAngle += Math.random() * angleChange - angleChange * 0.5; // s.random(-angleChange / 2, angleChange / 2);

        // Finally calculate and return the wander force
        return p5.Vector.add(circleCenter, displacement);
    }

    private doEvade(target: ISteering) {
        const toTarget = p5.Vector.sub(target.position, this.object.position);
        const distance = toTarget.mag();

        const updatesNeeded = distance / this.object.maxVelocity;
        const targetVelocityAhead = p5.Vector.mult(target.velocity, updatesNeeded);
        const targetPositionAhead = p5.Vector.add(target.position, targetVelocityAhead);
        this.flee(targetPositionAhead);
    }

    private doPursuit(target: ISteering): p5.Vector {
        const toTarget = p5.Vector.sub(target.position, this.object.position);
        const distance = toTarget.mag();

        const updatesNeeded = distance / this.object.maxVelocity;
        const targetVelocityAhead = p5.Vector.mult(target.velocity, updatesNeeded);
        const targetPositionAhead = p5.Vector.add(target.position, targetVelocityAhead);
        return this.doSeek(targetPositionAhead);
    }

    private doSeparate(others: ISteering[]): p5.Vector {
        const force = s.createVector();

        let nbNeighbors = 0;

        others.forEach((o) => {
            if (this.object === o) {
                return;
            }

            const vectorToOther = p5.Vector.sub(o.position, this.object.position);
            const distanceToOther = vectorToOther.mag();

            if (distanceToOther > this.object.separationDistance) {
                return;
            }

            nbNeighbors++;

            force.add(vectorToOther);
        });

        if (nbNeighbors === 0) {
            return force;
        }

        force.setMag(-this.object.maxVelocity);
        force.sub(this.object.velocity);
        return force;
    }

    private doFollowLeader(target: ISteering, wingMen: ISteering[], slowingRadius = 0): p5.Vector {
        // Calculate the behind point
        const relativeBehind = target.velocity.copy().setMag(-this.object.leaderBehindDistance);
        const behind = p5.Vector.add(target.position, relativeBehind);

        // Creates a force to arrive at the behind point and separate with others
        const force = s.createVector();
        force.add(this.doSeek(behind, slowingRadius));
        force.add(this.doSeparate(wingMen));
        return force;
    }
}
