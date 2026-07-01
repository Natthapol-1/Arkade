'use client';
import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── PAST · RED · Rocky world ─────────────────────────────────────────────────
// Individual boulders on the ground, stalactites from ceiling, dead trees.
// Player is a pterodactyl flying between the rocks.

const C    = '#FF3366';
const BODY = '#0C0305';
const BG   = '#050508';

const SPEED   = 150;
const GRAVITY = 0.28;
const FLAP_F  = -13;
const FLAP_CD = 720;        // ms — slow, deliberate wing beats
const PL_X    = 120;
const PL_W    = 36;
const PL_H    = 26;
const FLOOR_FRAC = 0.87;    // floor line as fraction of canvas height
const CLUSTER_SPACING = 540;

function ca(hex: string, a: number) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Hatch helper (clip region, draw 45° lines inside) ────────────────────────
function hatch(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
  if (rh<=0||rw<=0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(rx,ry,rw,rh); ctx.clip();
  ctx.strokeStyle = ca(C,0.28); ctx.lineWidth = 1;
  for (let d=-(rh+rw); d<rw+rh; d+=9) {
    ctx.beginPath(); ctx.moveTo(rx+d, ry+rh); ctx.lineTo(rx+d+rh, ry); ctx.stroke();
  }
  ctx.restore();
}

// ── Boulder ───────────────────────────────────────────────────────────────────
// Rises from the floor. Wide at base, irregular irregular silhouette at top.
// Width profile (% of maxW per 2px row, bottom→top):
const BOULDER_P = [1,.98,.96,.96,.92,.9,.88,.84,.82,.78,.74,.7,.64,.58,.52,.44,.38,.3,.22,.14];

function drawBoulder(ctx: CanvasRenderingContext2D, cx: number, floorY: number, w: number, h: number) {
  const rows = Math.min(BOULDER_P.length, Math.ceil(h/2));
  // Dark body
  for (let i=0; i<rows; i++) {
    const pi = Math.round((i/(rows-1||1))*(BOULDER_P.length-1));
    const rw = w * BOULDER_P[pi];
    ctx.fillStyle = BODY;
    ctx.fillRect(cx-rw/2, floorY-h+i*2, rw, 2);
  }
  // Hatch texture
  hatch(ctx, cx-w/2, floorY-h, w, h);
  // Bold color silhouette edge (top few rows)
  ctx.fillStyle = C;
  for (let i=Math.max(0,rows-5); i<rows; i++) {
    const pi = Math.round((i/(rows-1||1))*(BOULDER_P.length-1));
    const rw = w * BOULDER_P[pi];
    ctx.fillRect(cx-rw/2, floorY-h+i*2, rw, 1);
  }
  // Bold base
  ctx.fillRect(cx-w/2, floorY-3, w, 2);
}

// ── Stalactite ────────────────────────────────────────────────────────────────
// Hangs from ceiling. Wide at top, narrow sharp point at bottom.
const STALAC_P = [1,.98,.92,.84,.74,.64,.54,.44,.34,.26,.18,.12,.07,.04,.02];

function drawStalactite(ctx: CanvasRenderingContext2D, cx: number, h: number, w: number) {
  const rows = Math.min(STALAC_P.length, Math.ceil(h/2));
  for (let i=0; i<rows; i++) {
    const pi = Math.round((i/(rows-1||1))*(STALAC_P.length-1));
    const rw = w * STALAC_P[pi];
    ctx.fillStyle = BODY;
    ctx.fillRect(cx-rw/2, i*2, rw, 2);
  }
  hatch(ctx, cx-w/2, 0, w, h);
  ctx.fillStyle = C;
  // Bright tip at bottom
  const tipW = w * STALAC_P[Math.min(rows-1, STALAC_P.length-1)];
  ctx.fillRect(cx-tipW/2, h-2, tipW, 2);
  // Bold top
  ctx.fillRect(cx-w/2, 0, w, 2);
}

// ── Dead tree stump ───────────────────────────────────────────────────────────
// Jagged broken trunk with a few broken branch stubs.
function drawDeadTree(ctx: CanvasRenderingContext2D, cx: number, floorY: number, h: number) {
  const tw = 10;
  ctx.fillStyle = BODY;
  ctx.fillRect(cx-tw/2, floorY-h, tw, h);
  hatch(ctx, cx-tw/2, floorY-h, tw, h);
  ctx.fillStyle = C;
  ctx.fillRect(cx-tw/2, floorY-h, tw, 2); // top jagged
  ctx.fillRect(cx-tw/2-1, floorY-h+2, 2, 2);
  ctx.fillRect(cx+tw/2-1, floorY-h+4, 2, 2);
  // Broken branches
  ctx.fillRect(cx+tw/2, floorY-h+12, 14, 2);  // right branch
  ctx.fillRect(cx+tw/2+12, floorY-h+10, 2, 2);
  ctx.fillRect(cx-tw/2-14, floorY-h+22, 14, 2); // left branch
  ctx.fillRect(cx-tw/2-16, floorY-h+18, 2, 4);
  ctx.fillRect(cx-tw/2, floorY-3, tw, 2); // base
}

// ── Ground floor line + texture ───────────────────────────────────────────────
function drawFloor(ctx: CanvasRenderingContext2D, w: number, floorY: number) {
  // Ground fill
  ctx.fillStyle = BODY;
  ctx.fillRect(0, floorY, w, 999);
  hatch(ctx, 0, floorY, w, 40);
  ctx.fillStyle = C;
  ctx.fillRect(0, floorY, w, 2);
  // Pebble dots
  ctx.fillStyle = ca(C, 0.3);
  for (let x=10; x<w; x+=28) ctx.fillRect(x, floorY+4, 4, 3);
}

// ── Background ────────────────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number) {
  ctx.fillStyle = BG; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = ca(C,0.05); ctx.lineWidth=1;
  for (let y=0; y<h; y+=44) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  const step=88, off=camX%step;
  for (let x=-off; x<w; x+=step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  // lava glow
  const g=ctx.createLinearGradient(0,h*0.75,0,h);
  g.addColorStop(0,'transparent'); g.addColorStop(1,ca(C,0.08));
  ctx.fillStyle=g; ctx.fillRect(0,h*0.75,w,h*0.25);
}

// ── Pterodactyl ───────────────────────────────────────────────────────────────
function drawPtero(ctx: CanvasRenderingContext2D, x: number, y: number, vy: number, tick: number) {
  const ang = Math.max(-0.45, Math.min(0.65, vy*0.055));
  ctx.save();
  ctx.translate(x+PL_W/2, y+PL_H/2);
  ctx.rotate(ang);
  const wo = Math.floor(tick/20)%2===0 ? -5 : 5; // slow lazy flap
  ctx.fillStyle=BODY;
  ctx.fillRect(-12,-6,24,12); ctx.fillRect(12,-8,10,8);
  ctx.fillStyle=C;
  ctx.fillRect(22,-3,10,3); ctx.fillRect(24,0,8,3); ctx.fillRect(16,-6,5,5);
  // huge wings
  ctx.fillRect(-30,-16+wo,20,5); ctx.fillRect(-34,-10+wo,8,5); ctx.fillRect(-34,-5+wo,6,5);
  ctx.fillRect(-30, 8-wo,20,5); ctx.fillRect(-34, 4-wo, 8,5); ctx.fillRect(-34,-1-wo,6,5);
  ctx.fillRect(-12,-9,4,18);
  ctx.fillRect(-12,-6,2,12); ctx.fillRect(10,-6,2,12);
  ctx.fillRect(-12,-6,22,2); ctx.fillRect(-12,4,22,2);
  ctx.restore();
}

// ── ⚡ Pickup ─────────────────────────────────────────────────────────────────
function drawPickup(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  const p=0.6+0.4*Math.sin(tick*0.13+x*0.04);
  const sz=12;
  ctx.fillStyle=ca(C,0.1); ctx.fillRect(x-sz/2,y-sz/2,sz,sz);
  ctx.strokeStyle=ca(C,p); ctx.lineWidth=1; ctx.strokeRect(x-sz/2,y-sz/2,sz,sz);
  ctx.fillStyle=ca(C,p);
  ctx.fillRect(x-1,y-4,2,4); ctx.fillRect(x-3,y,3,4);
}

// ── Falling meteor ────────────────────────────────────────────────────────────
interface Meteor { wx:number; y:number; targetY:number; phase:'warn'|'fall'|'done'; timer:number; }
const METEOR_R = [3,8,12,14,14,13,11,8,5,3]; // half-widths per 2px row

function drawMeteor(ctx: CanvasRenderingContext2D, m: Meteor, camX: number, tick: number) {
  const sx = m.wx - camX;
  if (m.phase==='warn') {
    const on = Math.floor(tick/6)%2===0;
    ctx.globalAlpha = on ? 0.85 : 0.15;
    ctx.fillStyle=C;
    ctx.fillRect(sx-18,m.targetY-1,36,2); ctx.fillRect(sx-1,m.targetY-18,2,36);
    ctx.fillRect(sx-6,0,12,8); ctx.fillRect(sx-10,6,20,5); ctx.fillRect(sx-4,11,8,4);
    ctx.globalAlpha=1;
  } else if (m.phase==='fall') {
    METEOR_R.forEach((hw,i)=>{ ctx.fillStyle=BODY; ctx.fillRect(sx-hw,m.y+i*2,hw*2,2); });
    hatch(ctx, sx-14, m.y, 28, 20);
    ctx.fillStyle=C; ctx.fillRect(sx-14,m.y,28,1); // top rim
    // trail
    ctx.fillStyle=ca(C,0.5); ctx.fillRect(sx-5,m.y-16,10,10);
    ctx.fillStyle=ca(C,0.3); ctx.fillRect(sx-3,m.y-28,6,10);
    ctx.fillStyle=ca(C,0.15); ctx.fillRect(sx-2,m.y-38,4,8);
  }
}

// ── Cluster generation ────────────────────────────────────────────────────────
interface CObj { cx:number; kind:'boulder'|'stalagtite'|'tree'; w:number; h:number; }
interface Cluster { wx:number; objs:CObj[]; clearMidY:number; }

function genCluster(wx:number, screenH:number): Cluster {
  const floorY = screenH*FLOOR_FRAC;
  const clearH = 150;
  const clearMidY = 80 + Math.random()*(floorY - 80 - clearH - 60);
  const clearBot  = clearMidY + clearH;

  const objs: CObj[] = [];

  // Floor boulders: max height = floorY - clearBot - 10
  const maxBH = floorY - clearBot - 10;
  if (maxBH > 30) {
    const bw = 80+Math.random()*50;
    objs.push({ cx: wx+Math.random()*40-20, kind:'boulder', w:bw, h:maxBH-Math.random()*20 });
    if (Math.random()>0.35) objs.push({ cx:wx+bw*0.6+Math.random()*30, kind:'boulder', w:bw*0.55, h:(maxBH-10)*0.65 });
  }

  // Dead trees mixed in
  if (Math.random()>0.5) {
    const th = (floorY-clearBot)*0.75;
    if (th>20) objs.push({ cx:wx-30-Math.random()*20, kind:'tree', w:10, h:th });
  }

  // Ceiling stalactites: max length = clearMidY - 10
  const maxSH = clearMidY - 10;
  if (maxSH>20) {
    const sw = 28+Math.random()*28;
    objs.push({ cx:wx+Math.random()*40-20, kind:'stalagtite', w:sw, h:maxSH-Math.random()*20 });
  }

  return { wx, objs, clearMidY: clearMidY+clearH/2 };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PastPreview() {
  const cvs = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const state = useRef({
    camX:0, py:200, vy:0, tick:0, lastFlap:0,
    clusters:[] as Cluster[],
    pickups:[] as {wx:number;y:number}[],
    meteor: null as Meteor|null,
  });

  const flap = useCallback(()=>{
    const s=state.current, now=performance.now();
    if (now-s.lastFlap>FLAP_CD){ s.vy=FLAP_F; s.lastFlap=now; }
  },[]);

  useEffect(()=>{
    const cv=cvs.current; if(!cv) return;
    const w=cv.clientWidth||800, h=cv.clientHeight||520;
    cv.width=w; cv.height=h;
    const s=state.current;
    s.py = h*0.4;
    s.clusters.push(genCluster(500, h));

    let last=performance.now();
    const loop=(ts:number)=>{
      const dt=Math.min(ts-last,60)/1000; last=ts;
      const cv2=cvs.current; const ctx=cv2?.getContext('2d');
      if(!cv2||!ctx){ raf.current=requestAnimationFrame(loop); return; }
      const W=cv2.clientWidth, H=cv2.clientHeight;
      if(cv2.width!==W||cv2.height!==H){ cv2.width=W; cv2.height=H; }
      const floorY=H*FLOOR_FRAC;

      s.tick++; s.camX+=SPEED*dt;
      s.vy+=GRAVITY; s.vy=Math.min(s.vy,9);
      s.py+=s.vy;
      if(s.py<8){s.py=8;s.vy=0;}
      if(s.py>floorY-PL_H-4){s.py=floorY-PL_H-4;s.vy=0;}

      // Spawn clusters ahead
      const last2=s.clusters[s.clusters.length-1];
      if(!last2||last2.wx<s.camX+W+80){
        const nx=s.camX+W+CLUSTER_SPACING;
        s.clusters.push(genCluster(nx,H));
        // pickups along the gap of previous cluster
        const mid=last2?.clearMidY ?? H*0.4;
        for(let i=0;i<9;i++){
          const t=i/8;
          const px=(last2?.wx??s.camX+200)+80+t*((nx-80)-(last2?.wx??s.camX+200)-80);
          s.pickups.push({wx:px, y:mid+Math.sin(t*Math.PI*2)*40});
        }
        // meteor every other cluster
        if(s.clusters.length%2===0){
          const mx=s.camX+W+CLUSTER_SPACING*0.5;
          const my=50+Math.random()*(floorY*0.5);
          s.meteor={wx:mx,y:0,targetY:my,phase:'warn',timer:0};
        }
      }

      // Update meteor
      if(s.meteor&&s.meteor.phase!=='done'){
        s.meteor.timer+=dt;
        if(s.meteor.phase==='warn'&&s.meteor.timer>2){s.meteor.phase='fall';s.meteor.timer=0;}
        if(s.meteor.phase==='fall'){
          s.meteor.y+=280*dt;
          if(s.meteor.y>floorY+30) s.meteor.phase='done';
        }
      }

      s.clusters=s.clusters.filter(c=>c.wx+100>s.camX-100);
      s.pickups=s.pickups.filter(p=>p.wx>s.camX-20);

      // ── Draw ──
      drawBg(ctx,W,H,s.camX);
      drawFloor(ctx,W,floorY);

      for(const cl of s.clusters){
        for(const ob of cl.objs){
          const sx=ob.cx-s.camX;
          if(sx>W+100||sx<-200) continue;
          if(ob.kind==='boulder') drawBoulder(ctx,sx,floorY,ob.w,ob.h);
          else if(ob.kind==='stalagtite') drawStalactite(ctx,sx,ob.h,ob.w);
          else drawDeadTree(ctx,sx,floorY,ob.h);
        }
      }

      if(s.meteor&&s.meteor.phase!=='done') drawMeteor(ctx,s.meteor,s.camX,s.tick);

      for(const pk of s.pickups) drawPickup(ctx,pk.wx-s.camX,pk.y,s.tick);
      drawPtero(ctx,PL_X,s.py,s.vy,s.tick);

      // HUD
      ctx.fillStyle=ca(C,0.5); ctx.font='bold 10px monospace';
      ctx.fillText('PAST · SPACE = big wing flap (slow, lazy)',14,H-14);
      ctx.fillStyle=ca(C,0.25); ctx.font='8px monospace';
      ctx.fillText('[PREVIEW — tap to continue to main game]',W-220,H-14);

      raf.current=requestAnimationFrame(loop);
    };
    raf.current=requestAnimationFrame(loop);
    const dn=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();flap();}};
    window.addEventListener('keydown',dn);
    return ()=>{cancelAnimationFrame(raf.current);window.removeEventListener('keydown',dn);};
  },[flap]);

  return (
    <div style={{width:'100dvw',height:'100dvh',background:BG,position:'relative',overflow:'hidden'}}>
      <canvas ref={cvs} onPointerDown={flap}
        style={{width:'100%',height:'100%',display:'block',cursor:'none'}}/>
      <Link href="/go-went-gone" style={{position:'absolute',top:10,left:10,
        color:C,fontFamily:'monospace',fontSize:'0.75rem',textDecoration:'none',
        background:ca(C,0.1),border:`1px solid ${ca(C,0.3)}`,padding:'4px 10px'}}>← BACK</Link>
      <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',
        color:C,fontFamily:'monospace',fontSize:'0.85rem',fontWeight:'bold',
        textShadow:`0 0 10px ${C}`}}>⬛ PAST</div>
    </div>
  );
}
