import {Easing, interpolate, spring} from 'remotion';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
export const pop = (f: number, at: number, fps = 30) => spring({frame: f - at, fps, config: {damping: 12, stiffness: 160}});
