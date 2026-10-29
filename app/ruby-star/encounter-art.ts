import { TILE_SIZE, AEGIS_RESHIELD_WARNING_TICKS, TWIN_RANGED_WINDUP, TWIN_REVIVE_TICKS, CHAMBER_BOUNDS, chamberOfTile, PYLON_OVERLOAD_WINDUP, TWIN_TRANSFER_FX_TICKS } from './constants';
import type { Enemy, GameState } from './engine';

// Code-native sprites adapted directly from the approved prototype sheet.
function spritePainter(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
const C = {gold:'#c5a35d',bronze:'#493a29',cyan:'#78dedf',pale:'#e3ffff',coral:'#f08062',red:'#552d3a',blue:'#83cfff',navy:'#203c62'};
const impact=e.shootTicks>0?Math.sin((1-Math.min(1,e.shootTicks/14))*Math.PI):0;
const charge=e.twin?.index===1&&e.windupTicks>0?1-e.windupTicks/TWIN_RANGED_WINDUP:0;
const bladeCharge=e.twin?.index===0&&e.windupTicks>0?1-e.windupTicks/12:0;
const overload=e.pylon?.overloadTicks??0;
const heat=overload?1-overload/PYLON_OVERLOAD_WINDUP:0;
const revival=1-(e.twin?.downedTicks??TWIN_REVIVE_TICKS)/TWIN_REVIVE_TICKS;
const reassemblyGap=(e.twin?.reviveTicks??0)>0&&!e.twin?.downedTicks?Math.round(Math.pow((e.twin?.reviveTicks??0)/48,2)*12):0;
function rect(x: number,y: number,w: number,h: number,color: string,glow=0){
  ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=glow;
  if(!reassemblyGap){ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));ctx.shadowBlur=0;return;}
  const xs=x<0&&x+w>0?[[x,-x],[0,x+w]]:[[x,w]];
  const ys=y<0&&y+h>0?[[y,-y],[0,y+h]]:[[y,h]];
  for(const [px,pw]of xs)for(const [py,ph]of ys){
    const ox=reassemblyGap?Math.sign(px+pw/2)*reassemblyGap:0,oy=reassemblyGap?Math.sign(py+ph/2)*reassemblyGap:0;
    ctx.fillRect(Math.round(px+ox),Math.round(py+oy),Math.round(pw),Math.round(ph));
  }
  ctx.shadowBlur=0;
}
function line(x: number,y: number,w: number,h: number,color: string,width=1,glow=0){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.strokeRect(x,y,w,h);ctx.shadowBlur=0;}
function spark(x: number,y: number,color: string){rect(x-3,y-1,7,2,color);rect(x-1,y-3,2,7,color);}
function starHalf(x: number,y: number,color: string,right=false){
  rect(x+(right?0:-5),y-2,5,4,color);rect(x+(right?0:-2),y-5,2,10,color);
  rect(x+(right?2:-4),y-3,2,6,color);
}
function aegis(exposed=false){
  rect(-27,-27,54,54,'#263a3b');
  rect(-22,-22,44,44,C.bronze);
  // Four heavy corner plates: same body, different opening state.
  const opening=Math.round((e.aegis?.openAmount ?? (exposed?1:0))*6);
  for(const sx of [-1,1])for(const sy of [-1,1]){
    ctx.save();ctx.scale(sx,sy);ctx.translate(opening-Math.round(impact*2),opening-Math.round(impact*2));
    rect(3,3,25,25,C.gold,3);rect(7,7,17,17,'#80643a');
    rect(3,3,25,4,'#ead39a');rect(3,7,4,21,'#b68f4e');
    rect(17,17,7,7,'#3a3429');rect(19,19,3,3,'#e1c582');
    ctx.restore();
  }
  // Dark square aperture, pale reactor and paired construct indicators.
  rect(-13,-13,26,26,'#152f37');line(-13,-13,26,26,exposed?C.pale:C.cyan,2,exposed?5:2);
  if(exposed){
    const core=8+Math.round(Math.sin(tick*.09)*.7+impact*2);
    rect(-core,-core,core*2,core*2,C.cyan,10);rect(-5,-5,10,10,C.pale,3);
    for(const d of [-1,1]){rect(d<0?-22:15,-2,7,4,C.cyan);rect(-2,d<0?-22:15,4,7,C.cyan);}
    for(const [x,y]of [[-39,-13],[36,19],[15,-37],[-18,37]])rect(x,y,3,5,'#8fc3ba',2);
    // Shield returning: corner brackets close in on the shell size and blink faster near the end.
    const reshield=e.aegis?.reshieldTicks??0;
    if(reshield>0){
      const progress=1-reshield/AEGIS_RESHIELD_WARNING_TICKS,half=Math.round(39+(1-progress)*24);
      const blink=Math.floor(tick/(progress>.66?3:6))%2===0;
      ctx.globalAlpha=blink?.95:.45;
      for(const sx of [-1,1])for(const sy of [-1,1]){
        ctx.save();ctx.scale(sx,sy);
        rect(half-14,half-1,16,3,C.pale,5);rect(half-1,half-14,3,16,C.pale,5);
        ctx.restore();
      }
      ctx.globalAlpha=.08+progress*.12;rect(-half,-half,half*2,half*2,C.cyan);
      ctx.globalAlpha=1;
    }
  }else{
    rect(-8,-4,16,8,C.cyan,5);rect(-5,-2,10,4,'#d8ffff');
  }
  rect(-8,16,6,4,(e.aegis?.constructsLeft??2)<1?'#34383a':C.cyan,exposed?0:4);
  rect(2,16,6,4,(e.aegis?.constructsLeft??2)<2?'#34383a':C.cyan,exposed?0:4);
  if(!exposed){
    ctx.globalAlpha=.075;rect(-39,-39,78,78,C.cyan);ctx.globalAlpha=1;
    const cracked=(e.aegis?.constructsLeft??2)<2;
    if(e.aegis?.brokenOnce||cracked){
      const rim=(e.aegis!.reflectTicks??0)>0?C.pale:C.cyan;
      // One pylon down: stepped fractures run in from two corners, loose shards drift and the shell flickers.
      if(cracked){
        if(Math.floor(tick/5)%9===0)ctx.globalAlpha=.55;
        rect(-38,-30,7,2,rim,3);rect(-33,-28,2,7,rim,3);rect(-33,-22,8,2,rim,3);rect(-27,-21,2,6,rim,3);rect(-27,-16,5,2,rim,3);
        rect(32,24,6,2,rim,3);rect(30,18,2,7,rim,3);rect(23,17,8,2,rim,3);rect(23,11,2,7,rim,3);
        const drift=Math.round(Math.sin(tick*.06)*2);
        rect(-46+drift,-47,5,3,rim,2);rect(-49,-41-drift,3,4,'#9ef1ef');rect(43,40+drift,4,3,rim,2);
      }
      rect(-39,-40,26,2,rim,5);rect(-7,-40,45,2,rim,5);
      rect(-40,-38,2,45,rim,5);rect(-40,13,2,25,rim,5);
      rect(38,-38,2,22,rim,5);rect(38,-9,2,47,rim,5);
      rect(-38,38,43,2,rim,5);rect(12,38,26,2,rim,5);
      rect(-14,-38,5,2,rim);rect(-10,-36,4,2,rim);rect(35,-17,4,3,rim);
      rect(33,-14,3,5,rim);rect(6,35,7,2,rim);rect(-37,7,3,6,rim);
    }else line(-39,-39,78,78,(e.aegis?.reflectTicks??0)>0?C.pale:C.cyan,2,7+(e.aegis?.reflectTicks??0));
    const orbit=Math.floor(tick*.6)%62;rect(-31+orbit,-40,8,2,C.pale,2);rect(23-orbit,38,8,2,C.pale,2);
    for(const [x,y]of [[-40,-40],[34,-40],[-40,34],[34,34]])if(!((e.aegis?.constructsLeft??2)<2&&x<0&&y<0))rect(x,y,6,6,'#ceffff',3);
    ctx.globalAlpha=1;
    rect(-22,-44,12,2,C.cyan);rect(16,42,10,2,C.cyan);
  }
}
function construct(broken=false){
  if(overload)ctx.translate(Math.round(Math.sin(tick*(.3+heat*.7))*(1+heat*2)),0);
  if(broken){rect(-16,14,32,7,'#504a38');rect(-11,8,10,7,'#776344');rect(4,11,9,4,'#8d7851');return;}
  rect(-16,18,32,7,'#856b42');rect(-12,14,24,5,C.gold);
  rect(-13,-26,26,42,C.gold,3);rect(-9,-22,18,34,C.bronze);
  rect(-16,-29-Math.round(heat*4),32,7,'#ddc48a');rect(-9,-28-Math.round(heat*4),18,2,'#f6dfaa');
  rect(-7,-16,14,20,'#25494c');line(-7,-16,14,20,overload?'#ffce8a':C.cyan,2,overload?9:4);
  rect(-3,-12,6,12,overload?'#fff2d5':'#d5ffff',5+Math.abs(Math.sin(tick*(overload ? .24 : .07)))*(overload?10:3));
  if(overload){
    const d=22+Math.round(Math.sin(tick*.18)*3);line(-d,-d,d*2,d*2,'#ffce8a',2,5+heat*6);
    rect(-4,-13,8,15,'#fff5df',8+heat*10);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4, phase=(tick*(.02+heat*.015)+i*.13)%1, distance=14+(1-phase)*(22+heat*12);
      rect(Math.cos(a)*distance-2,Math.sin(a)*distance-6,3,phase>.6?7:4,i%2?'#ffe4b6':'#e2ffff',3);
    }
  }rect(-7,7,4,3,C.cyan);rect(3,7,4,3,C.cyan);
  rect(-17,-6,3,13,C.gold);rect(14,-6,3,13,C.gold);
  spark(-23,-21,'#72b5b6');rect(21,7,3,3,C.cyan,2);
  if(e.hp<e.maxHp*.75){rect(-8,-8,3,8,'#142936');rect(-5,-2,3,8,'#142936');}
  if(e.hp<=e.maxHp*.5){rect(6,2,4,9,'#132a33');rect(3,9,5,3,'#132a33');spark(18,-7,C.cyan);}
  if(e.hp<=e.maxHp*.25){rect(-9,10,7,3,'#182b32');rect(1,-22,3,8,'#182b32');}
}
function dawn(){
  // The hit lands in a full contact pose, followed by an asymmetric blade recovery.
  // Broad contact-fighter silhouette with two short, blunt stellar blades.
  const age=e.shootTicks>0?22-e.shootTicks:22;
  const attackPulse=e.shootTicks>0?(age<3?1:Math.pow(Math.max(0,(22-age)/19),2)):0;
  const dx=Math.cos(e.twin?.strikeAngle??0),dy=Math.sin(e.twin?.strikeAngle??0);
  ctx.save();ctx.translate(Math.round(dx*(attackPulse*9-bladeCharge*4)),Math.round(dy*(attackPulse*9-bladeCharge*4)));
  for(const s of [-1,1]){ctx.save();ctx.scale(s,1);
    ctx.translate(Math.round(attackPulse*dx*s*(s===(dx<0?-1:1)?17:10)+bladeCharge*5),Math.round(attackPulse*dy*15-bladeCharge*10+(s<0?1:-1)*Math.sin(Math.min(1,age/8)*Math.PI)*7));
    if(attackPulse>0){ctx.globalAlpha=.25*attackPulse;rect(21,-17,12,31,C.coral,6);ctx.globalAlpha=1;}
    rect(25,-12,9,26,C.coral,4);rect(27,-9,5,20,'#64394f');
    rect(33,-22,4,34,'#ffd0a6',3);rect(25,-8,3,4,'#ffe6cd');rect(25,6,3,4,'#ffe6cd');
    if(attackPulse||bladeCharge){rect(33,-22,4,26,'#fff3d4',6+attackPulse*8);rect(27,-16,3,17,'#ffb17d',3);}
    rect(22,-1,3,2,'#ce8b94');ctx.restore();}
  // Matching binary-star shell and aperture; Dawn carries blade pods instead of focusing blocks.
  rect(-21,-23,42,46,C.coral,5);rect(-17,-19,34,38,'#3d2c45');
  rect(-17,-19,34,4,'#7d4357');rect(-17,14,34,5,'#61394e');
  rect(-10,-8,20,10,'#a26069');rect(-7,-5,14,4,'#ffe5c5',5);
  starHalf(0,10,(e.twin?.partnerDownTicks??0)>0?'#ffffff':'#ffe5c5',false);
  starHalf(2,10,'#614054',true);
  rect(-3,-30,6,7,C.coral);rect(-1,-35,2,5,'#ffe3c4',3);
  rect(-30,23,3,4,'#df9b8d');spark(30,-28,'#bf7f83');
  if(attackPulse>.4)rect(-9,-6,18,5,'#fff4df',8);
  ctx.restore();
}
function dusk(downed=false){
  if(downed){
    const melee=e.twin?.index===0,color=melee?'#b4766d':'#719bb9',dark=melee?'#292032':'#162a40';
    const collapse=1-Math.max(0,Math.min(1,(e.twin?.fallTicks??0)/24));
    const gather=Math.max(0,(revival-.7)/.3),spread=Math.round(collapse*8*(1-gather*.6));
    ctx.save();ctx.translate(0,Math.round(collapse*5));
    ctx.globalAlpha=.62;rect(-24,22,48,4,'#101722');
    rect(-20,-14,40,35,color);rect(-16,-10,32,27,dark);
    rect(-20,-14,14,4,melee?'#d29a8b':'#97c6df');rect(7,-14,13,4,color);
    rect(-4,-14,4,11,'#0c1421');rect(-1,-5,4,10,'#0c1421');rect(2,2,4,13,'#0c1421');
    for(const side of [-1,1]){
      ctx.save();ctx.translate(side*spread,Math.round(collapse*3));
      rect(side<0?-29:23,0,6,17,color);rect(side<0?-28:24,3,3,10,dark);
      if(melee)rect(side<0?-32:29,-3,3,24,'#d2a18b');
      ctx.restore();
    }
    rect(-9,-5,5,3,melee?'#915c62':'#476d8f');rect(4,-5,5,3,melee?'#82535c':'#416582');
    rect(-15-spread,23,8,3,color);rect(13+spread,18,5,5,color);rect(5+spread,-19,6,3,color);
    ctx.globalAlpha=.55+.45*Math.abs(Math.sin(tick*.08));
    starHalf(0,9,melee?'#ffcfb0':'#bce9ff',!melee);
    if(gather>0){
      const d=42-gather*24;ctx.globalAlpha=.35+gather*.55;
      for(let i=0;i<8;i++){const a=i*Math.PI/4;rect(Math.cos(a)*d,Math.sin(a)*d,3,i%2?5:3,melee?'#ffc7a5':'#bce9ff',4);}
      rect(-5,-5,10,3,melee?'#ffd2b3':'#c9f0ff',gather*8);
    }
    ctx.restore();return;
  }
  // Slim shooter body and detached, rectangular focusing blocks.
  rect(-19,-23,38,46,C.blue,5);rect(-15,-19,30,38,C.navy);
  rect(-15,-19,30,4,'#41679a');rect(-15,14,30,5,'#315581');
  for(const s of [-1,1]){ctx.save();ctx.scale(s,1);ctx.translate(-Math.round(charge*5)+Math.round(impact*10),Math.round(Math.sin(tick*.05)));
    rect(26,-12,8,24,C.blue,4);rect(28,-9,4,18,'#35587d');
    if(charge||impact){rect(26,-12,3,24,'#dbf7ff',4+charge*7+impact*5);rect(31,-7,3,14,'#a4dfff',5);}
    rect(24,-8,3,4,'#dcf7ff');rect(24,5,3,4,'#dcf7ff');
    rect(21,-1,3,2,'#a2d5ed');ctx.restore();}
  rect(-10,-8,20,10,'#497ba9');rect(-7-Math.round(charge*2),-5,14+Math.round(charge*4),4,'#e5faff',5+charge*8);
  if(charge>0){
    const d=15-Math.round(charge*5);line(-d,-d,d*2,d*2,'#83cfff',2,charge*5);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,phase=(tick*.045+i*.125)%1,r=18+(1-phase)*24;
      rect(Math.cos(a)*r-1,Math.sin(a)*r-1,i%2?3:7,i%2?7:3,i%2?'#d9f5ff':'#83cfff',charge*4);
    }
  }
  if(impact>.1){
    rect(-7,-8,14,10,'#f4ffff',12*impact);
    for(let i=0;i<4;i++){const a=i*Math.PI/2,d=14+impact*13;rect(Math.cos(a)*d-2,Math.sin(a)*d-2,i%2?4:9,i%2?9:4,'#c9edff',6);}
  }
  rect(-3,-30,6,7,C.blue);rect(-1,-35,2,5,'#d8f8ff',3);
  starHalf(0,10,'#335070',false);starHalf(2,10,(e.twin?.partnerDownTicks??0)>0?'#ffffff':'#d8f5ff',true);
  rect(-30,23,3,4,'#91bfda');spark(30,-28,'#79a9ce');
}

return {aegis,construct,dawn,dusk};
}

export function drawEncounterEnemy(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number, showHealth = true): boolean {
  if (e.type !== 'aegis_sentinel' && e.type !== 'aegis_construct' && e.type !== 'astral_twins') return false;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
  const downed = (e.twin?.downedTicks ?? 0) > 0;
  const ranged = e.twin?.index === 1;
  const color = e.type === 'aegis_construct' ? '#78dedf' : e.type === 'aegis_sentinel' ? '#c5a35d' : ranged ? '#83cfff' : '#f08062';
  const spawn = Math.max(0, Math.min(1, (e.visualSpawnTicks ?? 0) / 30));
  const bob = e.type === 'aegis_construct' || downed ? 0 : Math.round(Math.sin(tick * .045 + e.id) * 1.2);
  ctx.save(); ctx.translate(0, bob);
  const giving=(e.twin?.transferGiveTicks??0)/TWIN_TRANSFER_FX_TICKS;
  ctx.globalAlpha = (1-spawn*.7)*(1-.3*Math.sin(giving*Math.PI));
  const scale = e.type === 'aegis_sentinel' ? .93 : e.type === 'astral_twins' ? .9 : 1;
  ctx.scale(scale, scale * (1 - spawn * .65));
  const art = spritePainter(ctx, e, tick);
  if (e.type === 'aegis_sentinel') art.aegis(e.aegis ? !e.aegis.shielded : false);
  else if (e.type === 'aegis_construct') art.construct();
  else if (downed) art.dusk(true);
  else if (ranged) art.dusk();
  else art.dawn();
  if (e.flashTicks > 0 && !downed) {
    ctx.globalAlpha = Math.min(.65, e.flashTicks / 16); ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -6, 12, 12);
  }
  if ((e.twin?.reviveTicks ?? 0) > 0) {
    const progress=1-e.twin!.reviveTicks!/48,pulse=Math.sin(progress*Math.PI),radius=44-progress*24;
    ctx.globalAlpha=(1-progress)*.8;ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=7;ctx.lineWidth=2;
    ctx.strokeRect(-radius/2,-radius/2,radius,radius);
    ctx.fillStyle='#e8ffff';ctx.globalAlpha=pulse*.85;const core=4+Math.round(pulse*8);ctx.fillRect(-core/2,-core/2,core,core);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,d=12+(1-progress)*36;ctx.fillRect(Math.round(Math.cos(a)*d),Math.round(Math.sin(a)*d),3,i%2?6:3);}
  }
  if ((e.twin?.partnerDownTicks ?? 0) > 0 && !downed) {
    // Berserk survivor: a hot pulsing square aura with four flaring corner spikes.
    const pulse = .5 + .5 * Math.sin(tick * .3), half = 30 + Math.round(pulse * 4), hot = ranged ? '#b9e4ff' : '#ffb39a';
    ctx.globalAlpha = .5 + pulse * .4; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.lineWidth = 3;
    ctx.strokeRect(-half, -half, half * 2, half * 2); ctx.shadowBlur = 0;
    ctx.fillStyle = hot; const spike = 5 + Math.round(pulse * 5);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      ctx.fillRect(sx * half - (sx < 0 ? spike : 0), sy * half - 1, spike, 3);
      ctx.fillRect(sx * half - 1, sy * half - (sy < 0 ? spike : 0), 3, spike);
    }
    ctx.globalAlpha = .12 + pulse * .1; ctx.fillStyle = color; ctx.fillRect(-half, -half, half * 2, half * 2);
  }
  const haste = e.twin?.hasteTicks ?? 0;
  if (haste > 0 && !downed && (haste > 60 || Math.floor(tick / 4) % 2 === 0)) {
    // Revival haste: short speed streaks race along both flanks.
    for (let i = 0; i < 3; i++) {
      const run = (tick * 2 + i * 11) % 30, y = -14 + i * 14;
      ctx.globalAlpha = .75 * (1 - run / 30); ctx.fillStyle = i === 1 ? '#ffffff' : color;
      ctx.fillRect(-38 - run, y, 12, 2); ctx.fillRect(26 + run, y, 12, 2);
    }
  }
  if (e.healFlashTicks > 0 && !downed) {
    ctx.globalAlpha = e.healFlashTicks / 30; ctx.fillStyle = '#e6f7ff';
    const half = e.twin?.index === 1 ? 2 : -5; ctx.fillRect(half, 8, 4, 6);
  }
  if ((e.twin?.transferGetTicks ?? 0) > 0 && !downed) {
    const progress=1-e.twin!.transferGetTicks!/TWIN_TRANSFER_FX_TICKS;
    if(progress>.65){
      const pulse=Math.sin((progress-.65)/.35*Math.PI),radius=23+Math.round(pulse*9);
      ctx.globalAlpha=pulse*.9;ctx.strokeStyle='#c9ffe2';ctx.shadowColor='#afffd8';ctx.shadowBlur=7;ctx.lineWidth=2;
      ctx.strokeRect(-radius,-radius,radius*2,radius*2);ctx.fillStyle='#e4fff0';ctx.fillRect(-3,5,6,10);
      ctx.fillRect(-5,8,10,4);
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  if (!showHealth) { ctx.restore(); return true; }
  const barY = e.type === 'aegis_sentinel' ? -49 : e.type === 'aegis_construct' ? -40 : -43;
  const width = e.type === 'aegis_construct' ? 32 : 52;
  ctx.fillStyle = '#0a101b'; ctx.fillRect(-width / 2 - 1, barY - 1, width + 2, 7);
  ctx.strokeStyle = color + '88'; ctx.lineWidth = 1; ctx.strokeRect(-width / 2 - .5, barY - .5, width + 1, 6);
  if (downed) {
    // The fallen twin's empty HP bar becomes its revival timer: a dim fill that drains to nothing.
    const remaining = Math.floor(width * e.twin!.downedTicks / TWIN_REVIVE_TICKS);
    ctx.globalAlpha = .45; ctx.fillStyle = color; ctx.fillRect(-width / 2, barY, remaining, 5);
    ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; if (remaining > 0) ctx.fillRect(-width / 2 + remaining - 2, barY, 2, 5);
  } else {
    ctx.fillStyle = color; ctx.fillRect(-width / 2, barY, Math.floor(width * Math.max(0, e.hp / Math.max(1, e.maxHp))), 5);
  }
  if ((e.aegis?.reshieldTicks ?? 0) > 0) {
    // A cyan strip above the HP bar fills as the shield returns.
    const filled = Math.floor(width * (1 - e.aegis!.reshieldTicks! / AEGIS_RESHIELD_WARNING_TICKS));
    ctx.fillStyle = '#0a101b'; ctx.fillRect(-width / 2 - 1, barY - 6, width + 2, 5);
    ctx.fillStyle = '#78dedf'; ctx.fillRect(-width / 2, barY - 5, filled, 3);
    if (Math.floor(tick / 6) % 2 === 0) { ctx.fillStyle = '#e3ffff'; ctx.fillRect(-width / 2 + filled - 2, barY - 5, 2, 3); }
  }
  ctx.restore(); return true;
}

export function drawEncounterTelegraphs(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number) {
  ctx.save();
  for (const e of state.enemies) {
    if (e.pylon?.overloadTicks) {
      const chamber = chamberOfTile(e.tileX, e.tileY);
      if (chamber >= 0) {
        const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber];
        const progress = 1 - e.pylon.overloadTicks / PYLON_OVERLOAD_WINDUP;
        const pulse = Math.abs(Math.sin(state.gameTick * .2));
        const x = c1 * TILE_SIZE - camX, y = r1 * TILE_SIZE - camY, w = (c2 - c1 + 1) * TILE_SIZE, h = (r2 - r1 + 1) * TILE_SIZE;
        ctx.globalAlpha = .025 + pulse * (.035 + progress * .04); ctx.fillStyle = '#ffbd75'; ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = .35 + pulse * .45; ctx.strokeStyle = '#ffce8a'; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

      }
    }
    if (!e.twin || e.twin.index !== 1 || e.twin.downedTicks || e.windupTicks <= 0 || e.twin.shotAimX === undefined || e.twin.shotAimY === undefined) continue;
    const x = Math.round((e.twin.shotTargetX ?? (e.twin.shotAimX + .5) * TILE_SIZE) - camX);
    const y = Math.round((e.twin.shotTargetY ?? (e.twin.shotAimY + .5) * TILE_SIZE) - camY);
    const progress = 1 - e.windupTicks / TWIN_RANGED_WINDUP;
    const sx=e.x-camX,sy=e.y-camY,steps=Math.min(70,Math.ceil(Math.hypot(x-sx,y-sy)/14));
    ctx.globalAlpha=.12+progress*.3;ctx.fillStyle='#83cfff';
    for(let i=1;i<steps;i++){const t=i/steps;ctx.fillRect(Math.round(sx+(x-sx)*t),Math.round(sy+(y-sy)*t),2,2);}
    ctx.globalAlpha=.4+progress*.5;ctx.fillStyle='#d9f4ff';
    const d=20-Math.round(progress*5);
    for(const [dx,dy]of [[-1,-1],[1,-1],[-1,1],[1,1]]){
      ctx.fillRect(x+dx*d-(dx>0?8:0),y+dy*d,9,2);
      ctx.fillRect(x+dx*d,y+dy*d-(dy>0?8:0),2,9);
    }
  }
  ctx.restore();
}

export function drawEncounterEffects(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number) {
  ctx.save();
  for (const fx of state.encounterEffects ?? []) {
    const donor=fx.kind==='transfer'?state.enemies.find(e=>e.id===fx.ownerId):undefined;
    const receiver=fx.kind==='transfer'?state.enemies.find(e=>e.id===fx.targetId):undefined;
    const x = (donor?.x??fx.x) - camX, y = (donor?.y??fx.y) - camY, tx = (receiver?.x??fx.toX) - camX, ty = (receiver?.y??fx.toY) - camY;
    const p = 1 - fx.ticks / fx.maxTicks, fade = 1 - p;
    ctx.shadowColor = fx.color; ctx.shadowBlur = 5; ctx.fillStyle = fx.color; ctx.globalAlpha = fade;
    const block = (bx: number, by: number, w = 4, h = w) => ctx.fillRect(Math.round(bx), Math.round(by), w, h);
    if (fx.kind === 'pylon-overload') {
      const chamber = chamberOfTile(Math.floor(fx.x / TILE_SIZE), Math.floor(fx.y / TILE_SIZE));
      if (chamber >= 0) {
        const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber];
        const left = c1 * TILE_SIZE - camX, top = r1 * TILE_SIZE - camY, w = (c2 - c1 + 1) * TILE_SIZE, h = (r2 - r1 + 1) * TILE_SIZE;
        ctx.save(); ctx.beginPath(); ctx.rect(left + 2, top + 2, w - 4, h - 4); ctx.clip();
        ctx.globalAlpha = Math.pow(fade, 4) * .5; ctx.fillStyle = '#fff4db'; ctx.fillRect(left, top, w, h);
        const reach = Math.max(Math.abs(x - left), Math.abs(x - left - w), Math.abs(y - top), Math.abs(y - top - h));
        for (let layer = 0; layer < 4; layer++) {
          const phase = Math.max(0, Math.min(1, p * 2.2 - layer * .13));
          if (!phase) continue;
          const radius = Math.round(phase * reach / 4) * 4;
          ctx.globalAlpha = fade * (1 - layer * .15); ctx.strokeStyle = layer % 2 ? '#fff3d5' : '#ffbe72';
          ctx.shadowColor = '#ffb76c'; ctx.shadowBlur = layer ? 8 : 18; ctx.lineWidth = layer ? 3 : 9;
          ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        ctx.shadowBlur = 6; ctx.globalAlpha = fade;
        for (let i = 0; i < 24; i++) {
          const a = i * Math.PI / 12, distance = 20 + p * (100 + i % 4 * 22);
          ctx.fillStyle = i % 3 ? '#ffce8a' : '#f3ffff';
          block(x + Math.cos(a) * distance, y + Math.sin(a) * distance, i % 2 ? 5 : 11, i % 2 ? 11 : 5);
        }
        const core = Math.round((1 - Math.min(1, p * 3)) * 38);
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = fade; block(x - core / 2, y - core / 2, core, core);
        ctx.shadowBlur = 0; ctx.fillStyle = '#ffb76b'; ctx.globalAlpha = fade * .12;
        for (let i = 0; i < 8; i++) ctx.fillRect(left, top + ((i * 137 + p * 150) % h), w, 3);
        ctx.restore();
      }
      continue;
    }
    if (fx.kind === 'construct-break') {
      ctx.shadowBlur = 0; ctx.globalAlpha = Math.min(1, fx.ticks / 45);
      ctx.fillStyle = '#504a38'; block(x - 16, y + 14, 32, 7); ctx.fillStyle = '#776344'; block(x - 11, y + 8, 10, 7); block(x + 4, y + 11, 9, 4);
      const age = fx.maxTicks - fx.ticks;
      if (age < 28) {
        ctx.globalAlpha = 1 - age / 28; ctx.fillStyle = '#c5a35d';
        for (let i = 0; i < 6; i++) block(x + Math.cos(i * 1.7) * age * .8, y - 10 + Math.sin(i * 1.7) * age * .8, 4, 6);
        ctx.fillStyle = '#d5ffff'; block(x - 2, y - 15 - age, 4, 10);
      }
      continue;
    }
    if (fx.kind === 'melee') {
      const angle = Math.atan2(ty - y, tx - x), radius = Math.max(52, Math.min(82, Math.hypot(tx - x, ty - y)+24));
      const sweep=Math.min(1,p*3.5);
      for (let echo = 0; echo < 3; echo++) for (let i = 0; i < 16; i++) {
        const a = angle - .15 + sweep * 1.65 - i * .075, r = radius - echo * 9;
        ctx.globalAlpha = fade * (1 - i / 18) * (echo ? .5 : 1);
        ctx.fillStyle = i < 3 ? '#fff0d7' : '#f08062';
        block(Math.round((x + Math.cos(a) * r) / 3) * 3, Math.round((y + Math.sin(a) * r) / 3) * 3, i<3?7:5, i<3?11:7);
      }
      if(p>.12&&p<.65){
        for(let i=0;i<10;i++){
          const a=angle+.55-Math.min(1,(p-.12)*3)*1.4+i*.07;
          ctx.globalAlpha=fade*(1-i/12)*.6;ctx.fillStyle=i<2?'#fff5de':'#ffb184';
          block(x+Math.cos(a)*(radius-6),y+Math.sin(a)*(radius-6),4,7);
        }
      }
      if (p < .8) {
        ctx.globalAlpha = fade; ctx.fillStyle = '#ffe6b9'; block(tx - 12, ty - 2, 24, 4); block(tx - 2, ty - 12, 4, 24);
        for(let i=0;i<24;i++){
          const a=angle+i*2.4,d=8+p*(24+i%5*8);ctx.fillStyle=i%3?'#ffb17d':'#fff3d4';
          block(tx+Math.cos(a)*d,ty+Math.sin(a)*d,i%2?3:6,i%2?8:4);
        }
      }
      continue;
    }
    if (fx.kind === 'sentinel-hit') {
      const travel = Math.min(1, p * 2), bx = x + (tx - x) * travel, by = y + (ty - y) * travel;
      ctx.globalAlpha = fade * .4; ctx.fillStyle = '#78dedf'; block(bx - 14, by - 14, 28, 28);
      ctx.globalAlpha = fade; ctx.fillStyle = '#c5a35d'; block(bx - 10, by - 10, 20, 20);
      ctx.fillStyle = '#e4ffff'; block(bx - 6, by - 6, 12, 12);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, d = 13 + p * 25; block(bx + Math.cos(a) * d - 2, by + Math.sin(a) * d - 2, 5, 5); }
      if (travel === 1) { ctx.strokeStyle = '#d5ffff'; ctx.lineWidth = 3; const size = 12 + p * 38; ctx.strokeRect(tx - size / 2, ty - size / 2, size, size); }
      continue;
    }
    if (fx.kind === 'transfer') {
      const dx=tx-x,dy=ty-y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length;
      const mx=(x+tx)/2+nx*24,my=(y+ty)/2+ny*24;
      const point=(t:number)=>t<.5?{x:x+(mx-x)*t*2,y:y+(my-y)*t*2}:{x:mx+(tx-mx)*(t-.5)*2,y:my+(ty-my)*(t-.5)*2};
      const travel=Math.max(0,Math.min(1,(p-.15)/.62));
      const envelope=Math.sin(p*Math.PI),steps=Math.min(90,Math.ceil(length/6));
      for(const side of [-1,1])for(let i=0;i<=steps;i++){
        const t=i/steps,v=point(t),wave=Math.sin(t*Math.PI*6-p*Math.PI*5)*10*side;
        ctx.globalAlpha=envelope*(.18+.35*Math.max(0,Math.cos(t*25-p*15)));
        ctx.fillStyle=side>0?'#b7ffda':fx.color;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=i%5===0?4:0;
        block(v.x+nx*wave-2,v.y+ny*wave-2,i%4===0?5:3,i%4===0?5:3);
      }
      for(let i=16;i>=0;i--){
        const t=Math.max(0,travel-i*.022),v=point(t);ctx.globalAlpha=(1-i/18)*.85*(p>.82?fade*5:1);
        ctx.fillStyle=i<4?'#e4fff1':fx.color;ctx.shadowBlur=i<4?7:2;block(v.x-3,v.y-3,i<4?6:4,i<4?6:4);
      }
      const star=point(travel);ctx.globalAlpha=Math.min(1,fade*5);ctx.shadowColor='#c6ffe4';ctx.shadowBlur=15;
      ctx.fillStyle=fx.color;block(star.x-13,star.y-4,13,8);block(star.x-5,star.y-13,5,26);block(star.x-9,star.y-9,9,18);
      ctx.fillStyle='#e5fff0';block(star.x,star.y-4,13,8);block(star.x,star.y-13,5,26);block(star.x,star.y-9,9,18);
      for(let i=0;i<4;i++){const a=i*Math.PI/2+p*2,d=19+Math.sin(p*12)*3;block(star.x+Math.cos(a)*d,star.y+Math.sin(a)*d,3,5);}
      if(p<.4){
        ctx.globalAlpha=(1-p/.4)*.8;ctx.strokeStyle=fx.color;ctx.lineWidth=2;const d=18+p*36;ctx.strokeRect(x-d,y-d,d*2,d*2);
        for(let i=0;i<12;i++){const a=i*Math.PI/6,r=40-p*65;block(x+Math.cos(a)*r,y+Math.sin(a)*r,4,6);}
      }
      if(p>.68){
        const burst=(p-.68)/.32,r=9+burst*24;ctx.globalAlpha=Math.sin(burst*Math.PI)*.9;ctx.fillStyle='#cbffe3';
        for(let i=0;i<20;i++){const a=i*2.4,d=r*(.6+i%3*.3);block(tx+Math.cos(a)*d,ty+Math.sin(a)*d,3,i%2?8:4);}
        block(tx-4,ty-12,8,24);block(tx-12,ty-4,24,8);
        ctx.strokeStyle='#c8ffe4';ctx.lineWidth=3;ctx.strokeRect(tx-r,ty-r,r*2,r*2);
      }
      continue;
    }
    if (fx.kind === 'reflect') {
      const dx = tx - x, dy = ty - y, length = Math.max(1, Math.hypot(dx, dy));
      const count = Math.max(1, Math.min(96, Math.ceil(length / 4)));
      const head = Math.min(1, p * 1.8), tail = Math.max(0, head - .35);
      const lanes = 1;
      for (let lane = 0; lane < lanes; lane++) {
        const offset = (lane - (lanes - 1) / 2) * 7;
        for (let i = Math.floor(tail * count); i <= head * count; i++) {
          const t = i / count; block(x + dx * t - dy / length * offset, y + dy * t + dx / length * offset, 4, 4);
        }
      }
      if (p > .45) {
        ctx.fillStyle = '#efffff'; const r = 3 + p * 10;
        block(tx - r, ty - 1, Math.round(r * 2), 3); block(tx - 1, ty - r, 3, Math.round(r * 2));
      }
      continue;
    }
    if (fx.kind === 'shot') {
      const dx=tx-x,dy=ty-y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length;
      ctx.save(); ctx.lineCap = 'square'; ctx.beginPath(); ctx.moveTo(Math.round(x), Math.round(y)); ctx.lineTo(Math.round(tx), Math.round(ty));
      ctx.globalAlpha = fade * .4; ctx.strokeStyle = '#83cfff'; ctx.lineWidth = 20; ctx.shadowBlur = 6; ctx.stroke();
      ctx.globalAlpha = fade * .95; ctx.strokeStyle = '#e9faff'; ctx.lineWidth = 7; ctx.shadowBlur = 0; ctx.stroke();
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(x+nx*side*7,y+ny*side*7);ctx.lineTo(tx+nx*side*4,ty+ny*side*4);
        ctx.globalAlpha=fade*.4;ctx.strokeStyle='#83cfff';ctx.lineWidth=2;ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = fade * .8;
      for(let i=0;i<4;i++){
        const t=(p*2+i*.25)%1,bx=x+dx*t,by=y+dy*t;
        for(const side of [-1,1])block(bx+nx*side*9-2,by+ny*side*9-2,5,5);
      }
      for(let i=0;i<28;i++){
        const t=(i/28+p*.45)%1,bx=x+dx*t,by=y+dy*t,spread=(8+p*25)*Math.sin(i*2.4);
        ctx.globalAlpha=fade*(.3+i%3*.2);ctx.fillStyle=i%3?'#83cfff':'#e9ffff';
        block(bx+nx*spread,by+ny*spread,i%2?3:6,i%2?7:3);
      }
      const radius = 9 + p * 38;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) block(tx + dx * radius, ty + dy * radius, dx ? 8 : 3, dy ? 8 : 3);
      ctx.fillStyle = '#f0ffff'; block(tx - 5, ty - 5, 10, 10);
      ctx.strokeStyle='#c8f0ff';ctx.lineWidth=2;
      ctx.strokeRect(Math.round(tx-radius*.65),Math.round(ty-radius*.65),Math.round(radius*1.3),Math.round(radius*1.3));
      continue;
    }
    const inward = fx.kind === 'revive' || fx.kind === 'shield-form';
    const radius = inward ? 50 - p * 40 : 30 + p * (fx.kind === 'sentinel-death' ? 40 : 22);
    for (let i = 0; i < 4; i++) {
      const dx = i % 2 ? 1 : -1, dy = i < 2 ? -1 : 1;
      const size = fx.kind === 'sentinel-death' ? 10 : 5;
      block(x + dx * radius - size / 2, y + dy * radius - size / 2, size, size);
      block(x + dx * (radius + 7), y + dy * (radius - 7), 3, 3);
    }
    if (inward) {
      ctx.strokeStyle = fx.color; ctx.lineWidth = 2; ctx.globalAlpha = fade * .6;
      ctx.strokeRect(Math.round(x - radius), Math.round(y - radius), Math.round(radius * 2), Math.round(radius * 2));
    }
  }
  ctx.restore();
}
