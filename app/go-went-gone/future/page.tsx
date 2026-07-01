'use client';
import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── FUTURE · CYAN · Sci-fi world ─────────────────────────────────────────────
// Server towers and buildings stand on the floor. UFO hovers above emitting beam.
// Tech panels hang from the ceiling. Jet holds SPACE to climb.

const C    = '#00D4FF';
const BODY = '#03060D';
const BG   = '#050508';

const SPEED         = 150;
const GRAVITY       = 0.48;
const THRUST_F      = -0.82;
const MAX_RISE      = -7;
const MAX_FALL      = 10;
const PL_X          = 120;
const PL_W          = 36;
const PL_H          = 26;
const FLOOR_FRAC    = 0.87;
const CLUSTER_SPACING = 540;

function ca(hex: string, a: number) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function drawBg(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, tick: number) {
  ctx.fillStyle=BG; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=ca(C,0.055); ctx.lineWidth=1;
  for(let y=0;y<h;y+=44){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const off=camX%88;
  for(let x=-off;x<w;x+=88){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  // scrolling circuit dashes
  ctx.strokeStyle=ca(C,0.08); ctx.setLineDash([8,16]);
  for(let y=66;y<h;y+=88){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.setLineDash([]);
  // top glow
  const g=ctx.createLinearGradient(0,0,0,60);
  g.addColorStop(0,ca(C,0.07)); g.addColorStop(1,'transparent');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,60);
}

function drawFloor(ctx: CanvasRenderingContext2D, w: number, fy: number) {
  ctx.fillStyle=BODY; ctx.fillRect(0,fy,w,999);
  // tech grid on ground
  ctx.fillStyle=ca(C,0.12);
  for(let x=0;x<w;x+=20) ctx.fillRect(x,fy,1,8);
  ctx.fillStyle=C; ctx.fillRect(0,fy,w,2);
}

// ── Server / Antenna tower ────────────────────────────────────────────────────
// Tall thin column with horizontal rack-unit dashes, blinking LED, foot base.
function drawServerTower(ctx: CanvasRenderingContext2D, cx: number, fy: number, h: number, tick: number) {
  const tw=12;
  ctx.fillStyle=BODY;
  ctx.fillRect(cx-tw/2, fy-h, tw, h);

  // Rack unit lines
  ctx.fillStyle=ca(C,0.3);
  for(let y=fy-h+8;y<fy;y+=13){
    ctx.fillRect(cx-tw/2+2, y, tw-4, 1);
    ctx.fillStyle=ca(C,0.15);
    for(let dx=cx-tw/2+3;dx<cx+tw/2-2;dx+=5) ctx.fillRect(dx,y+3,3,2);
    ctx.fillStyle=ca(C,0.3);
  }

  // Blinking status LED
  ctx.fillStyle=ca(C, Math.floor(tick/18)%2===0 ? 0.9 : 0.15);
  ctx.fillRect(cx+tw/2-5, fy-h+4, 3, 3);

  // Bold border
  ctx.fillStyle=C;
  ctx.fillRect(cx-tw/2, fy-h, 1, h);
  ctx.fillRect(cx+tw/2-1, fy-h, 1, h);
  ctx.fillRect(cx-tw/2-2, fy-h, tw+4, 3); // top cap/antenna

  // Foot base
  ctx.fillRect(cx-tw/2-5, fy-5, tw+10, 4);
}

// ── Building block ────────────────────────────────────────────────────────────
// Wide rectangular building with window grid on face.
function drawBuilding(ctx: CanvasRenderingContext2D, cx: number, fy: number, w: number, h: number) {
  ctx.fillStyle=BODY;
  ctx.fillRect(cx-w/2, fy-h, w, h);

  // Window grid
  ctx.fillStyle=ca(C,0.3);
  for(let y=fy-h+8;y<fy-5;y+=12){
    for(let x=cx-w/2+6;x<cx+w/2-6;x+=10) ctx.fillRect(x,y,6,6);
  }

  // Structural verticals
  ctx.fillStyle=ca(C,0.12);
  ctx.fillRect(cx-w/2+3, fy-h, 2, h);
  ctx.fillRect(cx+w/2-5, fy-h, 2, h);

  // Bold outline
  ctx.fillStyle=C;
  ctx.fillRect(cx-w/2, fy-h, w, 2);    // rooftop
  ctx.fillRect(cx-w/2, fy-h, 2, h);
  ctx.fillRect(cx+w/2-2, fy-h, 2, h);
  ctx.fillRect(cx-w/2, fy-2, w, 2);
  ctx.fillRect(cx-w/2-2, fy-h, w+4, 4); // rooftop ledge
}

// ── UFO hovering near ceiling ─────────────────────────────────────────────────
// Flat disc shape with dome, tractor beam lines projecting down.
function drawUFO(ctx: CanvasRenderingContext2D, cx: number, cy: number, beamH: number, tick: number) {
  // Tractor beam (below disc)
  const pulse=0.3+0.25*Math.sin(tick*0.12);
  const beamW=36;
  for(let b=0;b<5;b++){
    const bx=cx-beamW/2+(b/4)*beamW;
    ctx.fillStyle=ca(C,pulse-b*0.03);
    ctx.fillRect(bx-1, cy+14, 2, beamH);
  }
  ctx.fillStyle=ca(C,pulse*0.4);
  ctx.fillRect(cx-beamW/2, cy+14, beamW, beamH);

  // Disc shape: multi-row ellipse approximation
  const discRows=[{w:10,o:0},{w:16,o:-1},{w:26,o:-2},{w:32,o:-2},{w:36,o:-2},{w:32,o:-1},{w:22,o:0},{w:14,o:0}];
  discRows.forEach(({w:rw,o},i)=>{
    ctx.fillStyle=i<4 ? ca(C,0.25) : BODY;
    ctx.fillRect(cx-rw/2, cy+o+i*2, rw, 2);
  });
  ctx.fillStyle=C;
  ctx.fillRect(cx-18,cy, 36, 1); // top rim

  // Dome on top of disc
  const domeRows=[{w:8},{w:12},{w:14},{w:12},{w:8}];
  domeRows.forEach(({w:dw},i)=>{
    ctx.fillStyle=ca(C,0.25);
    ctx.fillRect(cx-dw/2, cy-i*2-2, dw, 2);
  });
  ctx.fillStyle=C;
  ctx.fillRect(cx-4, cy-8, 8, 1);

  // Blinking underside lights
  const bled=Math.floor(tick/12)%3;
  [-12,0,12].forEach((dx,i)=>{
    ctx.fillStyle=ca(C, i===bled ? 0.95 : 0.2);
    ctx.fillRect(cx+dx-2, cy+12, 4, 4);
  });
}

// ── Hanging tech panel ────────────────────────────────────────────────────────
// A monitor/screen hanging from ceiling by cable.
function drawTechPanel(ctx: CanvasRenderingContext2D, cx: number, h: number, tick: number) {
  const pw=30, ph=20;
  const py=h-ph;
  // Cable
  ctx.fillStyle=ca(C,0.4);
  ctx.fillRect(cx-1, 0, 2, py);
  // Panel body
  ctx.fillStyle=BODY;
  ctx.fillRect(cx-pw/2, py, pw, ph);
  // Screen content: scanlines + blinking data
  const son=Math.floor(tick/8)%2===0;
  ctx.fillStyle=ca(C,0.18);
  for(let sy=py+2;sy<py+ph-2;sy+=3) ctx.fillRect(cx-pw/2+2,sy,pw-4,1);
  ctx.fillStyle=ca(C,son?0.7:0.2);
  ctx.fillRect(cx-6,py+6,12,4);
  ctx.fillRect(cx-4,py+12,8,3);
  // Bold frame
  ctx.fillStyle=C;
  ctx.fillRect(cx-pw/2, py, pw, 2);
  ctx.fillRect(cx-pw/2, py+ph-2, pw, 2);
  ctx.fillRect(cx-pw/2, py, 2, ph);
  ctx.fillRect(cx+pw/2-2, py, 2, ph);
}

// ── Sweep laser hazard ────────────────────────────────────────────────────────
interface Laser { y:number; phase:'warn'|'active'|'done'; timer:number; }
function drawLaser(ctx: CanvasRenderingContext2D, lz: Laser, w: number, tick: number) {
  if(lz.phase==='warn'){
    const on=Math.floor(tick/5)%2===0;
    ctx.globalAlpha=on?0.9:0.2; ctx.fillStyle=C;
    ctx.fillRect(0,lz.y-7,16,14); ctx.fillRect(w-16,lz.y-7,16,14);
    ctx.fillStyle=ca(C,0.35);
    for(let x=20;x<w-20;x+=20) ctx.fillRect(x,lz.y-1,12,3);
    ctx.globalAlpha=1;
  } else if(lz.phase==='active'){
    const p=0.8+0.2*Math.sin(tick*0.15);
    ctx.globalAlpha=p; ctx.fillStyle=C; ctx.fillRect(0,lz.y-5,w,10);
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,lz.y-1,w,3);
    ctx.globalAlpha=1;
  }
}

// ── Jet ───────────────────────────────────────────────────────────────────────
function drawJet(ctx: CanvasRenderingContext2D, x: number, y: number, vy: number, tick: number) {
  const ang=Math.max(-0.45,Math.min(0.6,vy*0.055));
  ctx.save();
  ctx.translate(x+PL_W/2,y+PL_H/2); ctx.rotate(ang);
  ctx.fillStyle=BODY; ctx.fillRect(-16,-5,32,10);
  ctx.fillStyle=C;
  ctx.fillRect(16,-3,6,6); ctx.fillRect(22,-1,4,2);
  ctx.fillRect(-6,-12,18,4); ctx.fillRect(-6,8,18,4);
  ctx.fillRect(-16,-8,9,4); ctx.fillRect(-16,4,9,4);
  ctx.fillStyle=ca(C,0.4); ctx.fillRect(-10,-3,20,6);
  ctx.fillStyle=C;
  ctx.fillRect(-16,-5,2,10); ctx.fillRect(14,-5,2,10);
  const fl=6+(tick%4);
  ctx.fillStyle=ca(C,0.9); ctx.fillRect(-16-fl,-2,fl,4);
  ctx.fillStyle='#ffffff'; ctx.fillRect(-20,-1,4,2);
  ctx.restore();
}

// ── ⚡ Pickup ─────────────────────────────────────────────────────────────────
function drawPickup(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  const p=0.6+0.4*Math.sin(tick*0.13+x*0.04);
  const sw=14,sh=10;
  ctx.fillStyle=ca(C,0.1); ctx.fillRect(x-sw/2,y-sh/2,sw,sh);
  ctx.strokeStyle=ca(C,p); ctx.lineWidth=1; ctx.strokeRect(x-sw/2,y-sh/2,sw,sh);
  ctx.fillStyle=ca(C,p);
  ctx.fillRect(x-1,y-3,2,3); ctx.fillRect(x-2,y,2,3);
}

// ── Cluster ───────────────────────────────────────────────────────────────────
interface CObj { cx:number; kind:'tower'|'building'|'ufo'|'panel'; w:number; h:number; }
interface Cluster { wx:number; objs:CObj[]; clearMidY:number; }

function genCluster(wx:number,screenH:number): Cluster {
  const fy=screenH*FLOOR_FRAC;
  const clearH=150;
  const clearMidY=80+Math.random()*(fy-80-clearH-60);
  const clearBot=clearMidY+clearH;
  const objs:CObj[]=[];

  // Floor: towers or buildings
  const maxFH=fy-clearBot-10;
  if(maxFH>30){
    if(Math.random()>0.45){
      objs.push({cx:wx+Math.random()*30-15, kind:'tower', w:12, h:maxFH});
      if(Math.random()>0.4) objs.push({cx:wx+50+Math.random()*20, kind:'tower', w:12, h:maxFH*0.7});
    } else {
      objs.push({cx:wx+Math.random()*20-10, kind:'building', w:50+Math.random()*30, h:maxFH});
    }
  }

  // Ceiling: UFO or hanging panels
  const maxCH=clearMidY-10;
  if(maxCH>24){
    if(Math.random()>0.45)
      objs.push({cx:wx+Math.random()*40-20, kind:'ufo', w:36, h:maxCH});
    else
      objs.push({cx:wx+Math.random()*50-25, kind:'panel', w:30, h:maxCH});
    if(Math.random()>0.5)
      objs.push({cx:wx+55+Math.random()*20, kind:'panel', w:30, h:maxCH*0.7});
  }

  return {wx, objs, clearMidY:clearMidY+clearH/2};
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FuturePreview() {
  const cvs=useRef<HTMLCanvasElement>(null);
  const raf=useRef(0);
  const thrust=useRef(false);
  const state=useRef({ camX:0,py:200,vy:0,tick:0,
    clusters:[] as Cluster[], pickups:[] as {wx:number;y:number}[],
    laser:null as Laser|null });

  const startThrust=useCallback(()=>{thrust.current=true;},[]);
  const stopThrust =useCallback(()=>{thrust.current=false;},[]);

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

      s.tick++; s.camX+=SPEED*dt;
      if(thrust.current){ s.vy+=THRUST_F*dt*60; s.vy=Math.max(s.vy,MAX_RISE); }
      s.vy+=GRAVITY; s.vy=Math.min(s.vy,MAX_FALL);
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
        if(s.clusters.length%2===0){
          const ly=80+Math.random()*(fy-160);
          s.laser={y:ly,phase:'warn',timer:0};
        }
      }

      if(s.laser&&s.laser.phase!=='done'){
        s.laser.timer+=dt;
        if(s.laser.phase==='warn'&&s.laser.timer>2){s.laser.phase='active';s.laser.timer=0;}
        if(s.laser.phase==='active'&&s.laser.timer>1.5) s.laser.phase='done';
      }

      s.clusters=s.clusters.filter(c=>c.wx+100>s.camX-100);
      s.pickups=s.pickups.filter(p=>p.wx>s.camX-20);

      drawBg(ctx,W,H,s.camX,s.tick);
      drawFloor(ctx,W,fy);

      for(const cl of s.clusters){
        for(const ob of cl.objs){
          const sx=ob.cx-s.camX;
          if(sx>W+120||sx<-200) continue;
          if(ob.kind==='tower') drawServerTower(ctx,sx,fy,ob.h,s.tick);
          else if(ob.kind==='building') drawBuilding(ctx,sx,fy,ob.w,ob.h);
          else if(ob.kind==='ufo') drawUFO(ctx,sx,16,ob.h-16,s.tick);
          else drawTechPanel(ctx,sx,ob.h,s.tick);
        }
      }

      if(s.laser&&s.laser.phase!=='done') drawLaser(ctx,s.laser,W,s.tick);
      for(const pk of s.pickups) drawPickup(ctx,pk.wx-s.camX,pk.y,s.tick);
      drawJet(ctx,PL_X,s.py,s.vy,s.tick);

      ctx.fillStyle=ca(C,0.5); ctx.font='bold 10px monospace';
      ctx.fillText('FUTURE · HOLD SPACE = thrust up, release = fall',14,H-14);
      ctx.fillStyle=ca(C,0.25); ctx.font='8px monospace';
      ctx.fillText('[PREVIEW]',W-70,H-14);

      raf.current=requestAnimationFrame(loop);
    };
    raf.current=requestAnimationFrame(loop);
    const dn=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();startThrust();}};
    const up=(e:KeyboardEvent)=>{if(e.code==='Space') stopThrust();};
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
    return ()=>{cancelAnimationFrame(raf.current);
      window.removeEventListener('keydown',dn); window.removeEventListener('keyup',up);};
  },[startThrust,stopThrust]);

  return (
    <div style={{width:'100dvw',height:'100dvh',background:BG,position:'relative',overflow:'hidden'}}>
      <canvas ref={cvs} onPointerDown={startThrust} onPointerUp={stopThrust}
        style={{width:'100%',height:'100%',display:'block',cursor:'none'}}/>
      <Link href="/go-went-gone" style={{position:'absolute',top:10,left:10,
        color:C,fontFamily:'monospace',fontSize:'0.75rem',textDecoration:'none',
        background:ca(C,0.1),border:`1px solid ${ca(C,0.3)}`,padding:'4px 10px'}}>← BACK</Link>
      <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',
        color:C,fontFamily:'monospace',fontSize:'0.85rem',fontWeight:'bold',
        textShadow:`0 0 10px ${C}`}}>✈ FUTURE</div>
    </div>
  );
}
