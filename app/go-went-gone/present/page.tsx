'use client';
import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── PRESENT · GREEN · Natural world ──────────────────────────────────────────
// Palm trees and bushes grow from the ground. Vines and branches hang from above.
// Player is a bird weaving between actual trees and foliage.

const C    = '#00FF88';
const BODY = '#030C05';
const BG   = '#050508';

const SPEED   = 150;
const GRAVITY = 0.52;
const FLAP_F  = -9;
const FLAP_CD = 110;
const PL_X    = 120;
const PL_W    = 36;
const PL_H    = 26;
const FLOOR_FRAC    = 0.87;
const CLUSTER_SPACING = 540;

function ca(hex: string, a: number) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Ground + canopy ───────────────────────────────────────────────────────────
function drawGround(ctx: CanvasRenderingContext2D, w: number, fy: number) {
  ctx.fillStyle = BODY; ctx.fillRect(0,fy,w,999);
  // grass texture: small upward ticks
  ctx.fillStyle = ca(C,0.35);
  for (let x=6; x<w; x+=10) {
    const h2 = 4+Math.floor(Math.random()*3);
    ctx.fillRect(x, fy-h2, 1, h2);
    ctx.fillRect(x+3, fy-h2+2, 1, h2-2);
  }
  ctx.fillStyle = C; ctx.fillRect(0,fy,w,2);
}

function drawBg(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number) {
  ctx.fillStyle = BG; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = ca(C,0.05); ctx.lineWidth=1;
  for (let y=0;y<h;y+=44){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const off=camX%88;
  for (let x=-off;x<w;x+=88){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  // soft canopy glow
  const g=ctx.createLinearGradient(0,0,0,60);
  g.addColorStop(0,ca(C,0.06)); g.addColorStop(1,'transparent');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,60);
}

// ── Palm tree ─────────────────────────────────────────────────────────────────
// Tall slender trunk, fronds spreading out at the top.
function drawPalmTree(ctx: CanvasRenderingContext2D, cx: number, fy: number, h: number) {
  const tw=7;
  // Trunk: slight natural lean using staggered rects
  for (let y=0; y<h-20; y+=4) {
    const lean = Math.sin(y/h*Math.PI)*3;
    ctx.fillStyle = BODY;
    ctx.fillRect(cx+lean-tw/2, fy-h+y, tw, 4);
    // bark lines
    ctx.fillStyle = ca(C,0.18);
    ctx.fillRect(cx+lean, fy-h+y+1, 2, 2);
  }
  // Trunk border
  ctx.fillStyle = ca(C,0.4);
  ctx.fillRect(cx-tw/2, fy-h, 1, h-20);
  ctx.fillRect(cx+tw/2-1, fy-h, 1, h-20);
  ctx.fillRect(cx-tw/2, fy-3, tw, 2);

  // Fronds at crown
  const crown = {x:cx, y:fy-h};
  ctx.fillStyle = C;
  // Each frond: a series of leaves along a direction
  const fronds = [
    {dx:-1,dy:-0.5,len:6}, {dx:-0.7,dy:-1,len:5},  // upper left
    {dx: 1,dy:-0.5,len:6}, {dx: 0.7,dy:-1,len:5},  // upper right
    {dx:-1,dy: 0.3,len:4}, {dx: 1,dy: 0.3,len:4},  // drooping sides
    {dx: 0,dy:-1,  len:5},                           // top
  ];
  fronds.forEach(({dx,dy,len})=>{
    for(let i=0;i<len;i++){
      const lx=crown.x+dx*i*6;
      const ly=crown.y+dy*i*4;
      const lw=Math.max(2, 8-i);
      ctx.fillRect(lx-lw/2, ly, lw, 3);
      // leaf veins
      ctx.fillStyle = ca(BODY,0.5);
      ctx.fillRect(lx-1, ly+1, 2, 1);
      ctx.fillStyle = C;
    }
  });
}

// ── Bush / shrub cluster ──────────────────────────────────────────────────────
// A natural mound of green bushes, organic bumpy top edge.
const BUSH_P = [1,1,.96,.92,.88,.82,.76,.68,.6,.52,.44,.36,.26,.18,.10];

function drawBush(ctx: CanvasRenderingContext2D, cx: number, fy: number, w: number, h: number) {
  const rows=Math.min(BUSH_P.length, Math.ceil(h/2));
  for(let i=0;i<rows;i++){
    const pi=Math.round((i/(rows-1||1))*(BUSH_P.length-1));
    const rw=w*BUSH_P[pi];
    ctx.fillStyle=BODY;
    ctx.fillRect(cx-rw/2, fy-h+i*2, rw, 2);
  }
  // Leaf dot texture
  ctx.fillStyle=ca(C,0.18);
  for(let y=fy-h+4;y<fy;y+=8){
    for(let x=cx-w/2+4;x<cx+w/2-4;x+=8) ctx.fillRect(x,y,3,3);
  }
  // Bumpy top edge
  ctx.fillStyle=C;
  const bumpW=10;
  for(let bx=cx-w/2; bx<cx+w/2; bx+=bumpW){
    const bh=6+Math.floor(Math.sin(bx*0.4)*4);
    ctx.fillRect(bx, fy-h-bh, bumpW-2, bh+2);
  }
  // Small flowers on top
  ctx.fillStyle=ca(C,0.8);
  for(let bx=cx-w/2+8; bx<cx+w/2-8; bx+=22){
    const topY=fy-h-8;
    ctx.fillRect(bx, topY-4, 3,3);   // center
    ctx.fillRect(bx-3,topY-2,2,2); ctx.fillRect(bx+4,topY-2,2,2);
    ctx.fillRect(bx+1,topY-7,2,2); ctx.fillRect(bx+1,topY+1,2,2);
  }
}

// ── Hanging vine ──────────────────────────────────────────────────────────────
// Drapes from the ceiling. Thin strand with leaf clusters along it.
function drawVine(ctx: CanvasRenderingContext2D, cx: number, h: number) {
  ctx.fillStyle=C;
  // Main strand
  ctx.fillRect(cx-1, 0, 2, h);
  // Leaf clusters every 18px along strand
  for(let y=12; y<h-6; y+=18){
    const side = (y/18)%2===0 ? 1 : -1;
    // Leaf: 3 small rects fanning out
    ctx.fillRect(cx+side*2, y, side*12, 3);
    ctx.fillRect(cx+side*4, y-3, side*7, 3);
    ctx.fillRect(cx+side*6, y+3, side*5, 3);
  }
  // Droop knot at bottom
  ctx.fillStyle=ca(BODY,0.5);
  ctx.fillRect(cx-3, h-6, 6, 6);
  ctx.fillStyle=C;
  ctx.fillRect(cx-2, h-5, 4, 4);
}

// ── Hanging branch ────────────────────────────────────────────────────────────
// A thick branch angling down from ceiling with leaf clusters.
function drawBranch(ctx: CanvasRenderingContext2D, cx: number, h: number, lean: number) {
  // Branch body: angled thick line
  for(let y=0;y<h;y+=2){
    const bx=cx+lean*(y/h)*20;
    ctx.fillStyle=BODY;
    ctx.fillRect(bx-4, y, 8, 2);
    ctx.fillStyle=ca(C,0.3);
    ctx.fillRect(bx-3, y, 2, 1);
  }
  // Bold top (attached to ceiling)
  ctx.fillStyle=C;
  ctx.fillRect(cx-5, 0, 10, 3);
  // Leaves dripping off branch
  for(let y=10;y<h;y+=14){
    const bx=cx+lean*(y/h)*20;
    ctx.fillStyle=C;
    ctx.fillRect(bx-3,y, 3,4); ctx.fillRect(bx-8,y+2,4,3); // left leaf pair
    ctx.fillRect(bx+2,y, 3,4); ctx.fillRect(bx+5,y+2,4,3); // right leaf pair
  }
}

// ── Bird ──────────────────────────────────────────────────────────────────────
function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, vy: number, tick: number) {
  const ang=Math.max(-0.45,Math.min(0.65,vy*0.055));
  ctx.save();
  ctx.translate(x+PL_W/2,y+PL_H/2); ctx.rotate(ang);
  const wo=Math.floor(Math.sin(tick*0.22)*4);
  ctx.fillStyle=BODY; ctx.fillRect(-10,-7,20,14);
  ctx.fillStyle=C;
  ctx.fillRect(-18,-4+wo,10,4); ctx.fillRect(-14,-8+wo,6,4);
  ctx.fillRect(10,-2,9,4); ctx.fillRect(5,-5,5,5);
  ctx.fillStyle=BODY; ctx.fillRect(7,-4,2,2);
  ctx.fillStyle=C;
  ctx.fillRect(-10,-7,20,2); ctx.fillRect(-10,5,20,2);
  ctx.fillRect(-10,-7,2,14); ctx.fillRect(8,-7,2,14);
  ctx.fillRect(-14,-1,4,6);
  ctx.restore();
}

// ── Leaf pickup ───────────────────────────────────────────────────────────────
function drawPickup(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  const p=0.65+0.35*Math.sin(tick*0.13+x*0.04);
  ctx.globalAlpha=p; ctx.fillStyle=C;
  const lens=[3,5,7,8,8,7,5,3,2];
  lens.forEach((w2,i)=>ctx.fillRect(x-w2/2, y-lens.length+i*2, w2, 2));
  ctx.fillRect(x-1,y-lens.length-4,2,4);
  ctx.globalAlpha=1;
}

// ── Cluster ───────────────────────────────────────────────────────────────────
interface CObj { cx:number; kind:'palm'|'bush'|'vine'|'branch'; w:number; h:number; lean?:number; }
interface Cluster { wx:number; objs:CObj[]; clearMidY:number; }

function genCluster(wx:number, screenH:number): Cluster {
  const fy=screenH*FLOOR_FRAC;
  const clearH=150;
  const clearMidY=80+Math.random()*(fy-80-clearH-60);
  const clearBot=clearMidY+clearH;
  const objs:CObj[]=[];

  // Floor trees & bushes
  const maxFH=fy-clearBot-10;
  if(maxFH>30){
    // Main element: palm or bush
    if(Math.random()>0.45){
      objs.push({cx:wx+Math.random()*40-20, kind:'palm', w:14, h:maxFH});
    } else {
      objs.push({cx:wx+Math.random()*20-10, kind:'bush', w:80+Math.random()*40, h:maxFH});
    }
    // Extra bush to fill
    if(Math.random()>0.4)
      objs.push({cx:wx+55+Math.random()*30, kind:'bush', w:50+Math.random()*30, h:(maxFH)*0.6});
  }

  // Ceiling vines & branches
  const maxCH=clearMidY-10;
  if(maxCH>20){
    if(Math.random()>0.4)
      objs.push({cx:wx+Math.random()*50-25, kind:'vine', w:6, h:maxCH});
    if(Math.random()>0.5)
      objs.push({cx:wx+40+Math.random()*30, kind:'branch', w:8, h:maxCH*0.8, lean:Math.random()>0.5?1:-1});
  }

  return {wx, objs, clearMidY:clearMidY+clearH/2};
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PresentPreview() {
  const cvs=useRef<HTMLCanvasElement>(null);
  const raf=useRef(0);
  const state=useRef({ camX:0,py:200,vy:0,tick:0,lastFlap:0,
    clusters:[] as Cluster[], pickups:[] as {wx:number;y:number}[] });

  const flap=useCallback(()=>{
    const s=state.current, now=performance.now();
    if(now-s.lastFlap>FLAP_CD){s.vy=FLAP_F;s.lastFlap=now;}
  },[]);

  useEffect(()=>{
    const cv=cvs.current; if(!cv) return;
    cv.width=cv.clientWidth||800; cv.height=cv.clientHeight||520;
    const s=state.current;
    s.py=cv.height*0.4;
    s.clusters.push(genCluster(500,cv.height));
    let last=performance.now();

    const loop=(ts:number)=>{
      const dt=Math.min(ts-last,60)/1000; last=ts;
      const cv2=cvs.current; const ctx=cv2?.getContext('2d');
      if(!cv2||!ctx){raf.current=requestAnimationFrame(loop);return;}
      const W=cv2.clientWidth,H=cv2.clientHeight;
      if(cv2.width!==W||cv2.height!==H){cv2.width=W;cv2.height=H;}
      const fy=H*FLOOR_FRAC;

      s.tick++;s.camX+=SPEED*dt;
      s.vy+=GRAVITY;s.vy=Math.min(s.vy,12);
      s.py+=s.vy;
      if(s.py<8){s.py=8;s.vy=0;}
      if(s.py>fy-PL_H-4){s.py=fy-PL_H-4;s.vy=0;}

      const last2=s.clusters[s.clusters.length-1];
      if(!last2||last2.wx<s.camX+W+80){
        const nx=s.camX+W+CLUSTER_SPACING;
        s.clusters.push(genCluster(nx,H));
        const mid=last2?.clearMidY??H*0.4;
        for(let i=0;i<9;i++){
          const t=i/8;
          const px=(last2?.wx??s.camX+200)+80+t*((nx-80)-(last2?.wx??s.camX+200)-80);
          s.pickups.push({wx:px,y:mid+Math.sin(t*Math.PI*2)*40});
        }
      }

      s.clusters=s.clusters.filter(c=>c.wx+100>s.camX-100);
      s.pickups=s.pickups.filter(p=>p.wx>s.camX-20);

      drawBg(ctx,W,H,s.camX);
      drawGround(ctx,W,fy);

      for(const cl of s.clusters){
        for(const ob of cl.objs){
          const sx=ob.cx-s.camX;
          if(sx>W+120||sx<-200) continue;
          if(ob.kind==='palm') drawPalmTree(ctx,sx,fy,ob.h);
          else if(ob.kind==='bush') drawBush(ctx,sx,fy,ob.w,ob.h);
          else if(ob.kind==='vine') drawVine(ctx,sx,ob.h);
          else drawBranch(ctx,sx,ob.h,ob.lean??1);
        }
      }

      for(const pk of s.pickups) drawPickup(ctx,pk.wx-s.camX,pk.y,s.tick);
      drawBird(ctx,PL_X,s.py,s.vy,s.tick);

      ctx.fillStyle=ca(C,0.5); ctx.font='bold 10px monospace';
      ctx.fillText('PRESENT · SPACE = flap  (classic bird)',14,H-14);
      ctx.fillStyle=ca(C,0.25); ctx.font='8px monospace';
      ctx.fillText('[PREVIEW]',W-70,H-14);

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
        textShadow:`0 0 10px ${C}`}}>🌿 PRESENT</div>
    </div>
  );
}
