import React, {useEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
const useWH = () => { const {width, height} = useVideoConfig(); return {W: width, H: height}; };
// @ts-ignore
import {mulberry, spring as lspring, seg, eo, vnoise, back} from './vendor/lemo-lib.js';

// ---- GLSL noise: copied from hyperframes packages/shader-transitions/src/shaders/common.ts (NQ), Apache-2.0, HeyGen ----
const NQ = "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
  "float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);" +
  "return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}" +
  "float fbm(vec2 p){float v=0.,a=.5;mat2 R=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*vnoise(p);p=R*p*2.02;a*=.5;}return v;}";
const VERT = "attribute vec2 a_pos; varying vec2 v_uv; void main(){v_uv=a_pos*0.5+0.5; gl_Position=vec4(a_pos,0,1);}";
// background: domain-warped fbm in brand pastels (own shader using hyperframes noise)
const BG_FRAG = "precision mediump float; varying vec2 v_uv; uniform float u_t; uniform vec3 u_tint;" + NQ +
  "void main(){vec2 p=v_uv*vec2(1.78,1.)*1.6; vec2 q=vec2(fbm(p+u_t*.05),fbm(p+vec2(5.2,1.3)-u_t*.04));" +
  "float n=fbm(p+2.2*q+u_t*.03);" +
  "vec3 base=mix(vec3(.957,.945,.918),vec3(.91,.933,.969),v_uv.x);" +
  "vec3 warm=vec3(1.,.85,.66), cool=vec3(.79,.85,1.), mint=vec3(.78,.94,.87);" +
  "vec3 c=mix(base,warm,smoothstep(.45,.85,n)*.55*(1.-v_uv.x));" +
  "c=mix(c,cool,smoothstep(.5,.9,q.x)*.5*v_uv.x); c=mix(c,mint,smoothstep(.55,.95,q.y)*.35*(1.-v_uv.y));" +
  "c=mix(c,u_tint,.10*smoothstep(.3,.9,n));" +
  "gl_FragColor=vec4(c,1.);}";
// light-leak overlay: alpha-only port of hyperframes "light-leak" transition (Apache-2.0) for DOM scenes
const LEAK_FRAG = "precision mediump float; varying vec2 v_uv; uniform float u_p; uniform vec3 u_tint;" +
  "void main(){vec2 uv=vec2(v_uv.x,1.-v_uv.y); vec2 lp=vec2(1.3,-.2); float dist=length(uv-lp);" +
  "float pk=sin(u_p*3.14159); float leak=clamp(exp(-dist*1.8)*pk*4.,0.,1.);" +
  "vec3 warm=mix(u_tint,vec3(1.,.93,.8),dist*.7); float flare=exp(-abs(uv.y-(-.2+uv.x*.3))*15.)*leak*.3;" +
  "float a=clamp(leak*.85+flare,0.,.92); gl_FragColor=vec4(warm*a,a);}";

const useGL = (frag: string, draw: (gl: WebGLRenderingContext, prog: WebGLProgram) => void, dep: number) => {
  const ref = useRef<HTMLCanvasElement>(null); const st = useRef<any>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) { st.current = null; return; } let s = st.current; if (s && s.cv !== cv) s = null;
    if (!s) {
      const gl = cv.getContext('webgl', {premultipliedAlpha: true, preserveDrawingBuffer: true, alpha: true})!;
      const sh = (t: number, src: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, src); gl.compileShader(o); return o; };
      const prog = gl.createProgram()!; gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(prog); gl.useProgram(prog);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a_pos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      s = st.current = {gl, prog, cv};
    }
    s.gl.viewport(0, 0, cv.width, cv.height); s.gl.clearColor(0,0,0,0); s.gl.clear(s.gl.COLOR_BUFFER_BIT);
    draw(s.gl, s.prog); s.gl.drawArrays(s.gl.TRIANGLE_STRIP, 0, 4);
  }, [dep]);
  return ref;
};

const DARK_FRAG = "precision mediump float; varying vec2 v_uv; uniform float u_t; uniform vec3 u_tint;" + NQ +
  "void main(){vec2 p=v_uv*vec2(.56,1.)*1.8; float n=fbm(p+vec2(u_t*.04,-u_t*.03)); float m=fbm(p*2.+n*1.5-u_t*.05);" +
  "vec3 base=vec3(.055,.07,.125); vec3 c=base+u_tint*.10*smoothstep(.35,.9,m)+vec3(.02,.03,.06)*n;" +
  "float v=length((v_uv-.5)*vec2(1.2,1.)); c*=1.-.55*smoothstep(.35,.95,v);" +
  "float g=fract(sin(dot(v_uv*vec2(1920.,1080.)+u_t*61.,vec2(12.9898,78.233)))*43758.5453); c+=(g-.5)*.025;" +
  "gl_FragColor=vec4(c,1.);}";
export const DarkBg = ({tint}: {tint: [number, number, number]}) => { const fr = useCurrentFrame(); const {W, H} = useWH();
  const ref = useGL(DARK_FRAG, (gl, p) => { gl.uniform1f(gl.getUniformLocation(p, 'u_t'), fr / 30); gl.uniform3fv(gl.getUniformLocation(p, 'u_tint'), tint); }, fr);
  return <canvas ref={ref} width={W/2} height={H/2} style={{position:'absolute', inset:0, width:W, height:H}}/>; };

export const ShaderBg = ({tint}: {tint: [number, number, number]}) => { const fr = useCurrentFrame(); const {W, H} = useWH();
  const ref = useGL(BG_FRAG, (gl, p) => { gl.uniform1f(gl.getUniformLocation(p, 'u_t'), fr / 30); gl.uniform3fv(gl.getUniformLocation(p, 'u_tint'), tint); }, fr);
  return <canvas ref={ref} width={W/2} height={H/2} style={{position:'absolute', inset:0, width:W, height:H}}/>; };

export const LightLeak = ({at, dur = 16, tint}: {at: number; dur?: number; tint: [number, number, number]}) => { const fr = useCurrentFrame(); const {W, H} = useWH();
  const p = (fr - at) / dur; const on = p > 0 && p < 1;
  const ref = useGL(LEAK_FRAG, (gl, pr) => { gl.uniform1f(gl.getUniformLocation(pr, 'u_p'), on ? p : 0); gl.uniform3fv(gl.getUniformLocation(pr, 'u_tint'), tint); }, fr);
  if (fr < at - 1 || fr > at + dur + 1) return null;
  return <canvas ref={ref} width={960} height={540} style={{position:'absolute', inset:0, width:1920, height:1080, mixBlendMode:'screen', pointerEvents:'none'}}/>; };

// Confetti / spark burst using lemo-opuscar deterministic RNG + spring
export const Burst = ({x, y, at, colors, n = 14, r = 90, seed = 1}: {x: number; y: number; at: number; colors: string[]; n?: number; r?: number; seed?: number}) => {
  const fr = useCurrentFrame(); const t = (fr - at) / 30; if (t < 0 || t > 0.9) return null;
  const rnd = mulberry(seed * 9973 + at);
  return <>{Array.from({length: n}).map((_, i) => { const a = rnd() * Math.PI * 2, d = r * (0.6 + rnd() * 0.6), s = 6 + rnd() * 8;
    const k = eo(seg(t, 0, 0.55)); const fade = 1 - seg(t, 0.4, 0.9);
    return <div key={i} style={{position:'absolute', left: x + Math.cos(a) * d * k - s/2, top: y + Math.sin(a) * d * k + t*t*60 - s/2, width:s, height: i % 3 ? s : s*0.4, borderRadius: i % 2 ? '50%' : 2, background: colors[i % colors.length], opacity: fade, transform:`rotate(${a*57 + t*400}deg)`}}/>; })}</>;
};

// Ring pulse (shockwave) on emphasis
export const Pulse = ({x, y, at, color, size = 140}: {x: number; y: number; at: number; color: string; size?: number}) => {
  const fr = useCurrentFrame(); const t = (fr - at) / 18; if (t < 0 || t > 1) return null;
  const k = eo(t); return <div style={{position:'absolute', left: x - size*k/2, top: y - size*k/2, width: size*k, height: size*k, borderRadius:'50%', border:`${4*(1-t)+1}px solid ${color}`, opacity: 1 - t}}/>; };

// Self-drawing check mark (stroke-dashoffset)
export const DrawCheck = ({p, size = 28, color = '#fff'}: {p: number; size?: number; color?: string}) =>
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 33l12 12 24-26" strokeDasharray={60} strokeDashoffset={60 * (1 - Math.max(0, Math.min(1, p)))}/></svg>;

export const lemo = {lspring, seg, eo, vnoise, back};
