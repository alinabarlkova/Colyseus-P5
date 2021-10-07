import p5 from 'p5';

export let s: p5.p5InstanceExtensions;

export function setSketch(sketch: p5.p5InstanceExtensions) {
    s = sketch;
}
