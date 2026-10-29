const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const e=require('../app/ruby-star/engine.ts'),art=require('../app/ruby-star/encounter-art.ts');
const output=process.argv[2]||'docs/ruby-star/visual-reference';fs.mkdirSync(output,{recursive:true});
function enemy(kind,index=0){const s=e.createInitialState();e.godSpawnBoss(s,kind);const body=s.enemies[index];body.visualSpawnTicks=0;body.flashTicks=body.shootTicks=body.healFlashTicks=0;body.attackTimer=100;return body;}
const shield=enemy('aegis_sentinel'),exposed=structuredClone(shield),pylon=enemy('aegis_sentinel',1),dawn=enemy('astral_twins'),dusk=enemy('astral_twins',1),fallen=structuredClone(dusk);
exposed.aegis.shielded=false;exposed.aegis.constructsLeft=0;exposed.aegis.openAmount=1;
pylon.hp=pylon.maxHp*.5;fallen.twin.downedTicks=360;
const models=[['AEGIS / SHIELDED',shield],['AEGIS / EXPOSED',exposed],['SEAL PYLON / DAMAGED',pylon],['DAWN / MELEE',dawn],['DUSK / RANGED',dusk],['FALLEN / REVIVING',fallen]];
const before=JSON.stringify(models),canvas=createCanvas(1260,840),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
ctx.fillStyle='#090f19';ctx.fillRect(0,0,1260,840);ctx.fillStyle='#dceaf5';ctx.font='bold 22px monospace';ctx.fillText('RUBY STAR / IMPLEMENTED BOSS MODELS',24,40);
for(const [i,[label,body]]of models.entries()){
 const x=20+(i%3)*414,y=65+Math.floor(i/3)*380;ctx.fillStyle='#101c2a';ctx.fillRect(x,y,394,360);ctx.strokeStyle='#293a4b';ctx.strokeRect(x+.5,y+.5,393,359);
 ctx.fillStyle='#c5d8e8';ctx.font='bold 15px monospace';ctx.textAlign='left';ctx.fillText(label,x+18,y+26);
 ctx.save();ctx.translate(x+196,y+202);ctx.scale(2.5,2.5);art.drawEncounterEnemy(ctx,body,0,0,80);ctx.restore();
 art.drawEncounterEnemy(ctx,body,x+335,y+305,80);ctx.font='11px monospace';ctx.fillStyle='#91a4b8';ctx.textAlign='left';ctx.fillText('GAME SIZE',x+20,y+334);
}
assert.equal(JSON.stringify(models),before,'renderer mutated model state');fs.writeFileSync(path.join(output,'linked-boss-models.png'),canvas.toBuffer('image/png'));
const rows=['SHIELD REFLECTION','CORE OPENING','DAWN BLADE STRIKE','DUSK CHARGE / SHOT','TWIN REVIVAL','PYLON ASSEMBLY / DAMAGE','PYLON OVERLOAD','REBUILT / FRACTURED SHIELD'];
const sheet=createCanvas(1280,rows.length*180+44),sc=sheet.getContext('2d');sc.fillStyle='#090f19';sc.fillRect(0,0,sheet.width,sheet.height);
for(let row=0;row<rows.length;row++){
 sc.fillStyle='#d5e4ef';sc.font='bold 13px monospace';sc.textAlign='left';sc.fillText(rows[row],12,row*180+22);
 for(let i=0;i<8;i++){
  const body=structuredClone(row<2||row===7?shield:row===2?dawn:row===3||row===4?dusk:pylon);
  if(row===0)body.aegis.reflectTicks=Math.max(0,10-i*2);
  if(row===1){body.aegis.shielded=false;body.aegis.constructsLeft=0;body.aegis.openAmount=i/7;}
  if(row===2){body.windupTicks=i<3?12-i*5:0;body.shootTicks=i<3?0:Math.max(0,22-(i-3)*5);body.twin.strikeAngle=0;}
  if(row===3){body.windupTicks=i<6?36-i*6:0;body.shootTicks=i>=6?14-(i-6)*7:0;}
  if(row===4){body.twin.downedTicks=i<6?720-i*140:0;body.twin.reviveTicks=i>=6?48-(i-6)*24:0;}
  if(row===5){body.visualSpawnTicks=i<4?30-i*10:0;body.hp=body.maxHp*(i<4?1:1-(i-3)*.2);}
  if(row===7){body.aegis.brokenOnce=true;body.aegis.reflectTicks=i<4?8-i*2:0;}
  if(row===6){body.visualSpawnTicks=0;body.pylon.overloadTicks=180-i*24;}
  sc.save();sc.translate(i*160+80,row*180+116);sc.scale(1.35,1.35);art.drawEncounterEnemy(sc,body,0,0,i*6+40);sc.restore();
 }
}
fs.writeFileSync(path.join(output,'linked-boss-animation-states.png'),sheet.toBuffer('image/png'));
console.log('Rendered live models at enlarged/game scale and 64 animation states; renderer leaves state unchanged.');

const fxCanvas=createCanvas(1280,880),fc=fxCanvas.getContext('2d');fc.fillStyle='#090f19';fc.fillRect(0,0,1280,880);
for(const [row,kind]of ['sentinel-hit','melee','shot','pylon-overload'].entries())for(let i=0;i<5;i++){
 const x=i*256,y=row*220;fc.fillStyle='#101c2a';fc.fillRect(x+4,y+4,248,212);fc.save();fc.beginPath();fc.rect(x+4,y+4,248,212);fc.clip();
 fc.fillStyle='#cadbe8';fc.font='13px monospace';fc.textAlign='left';fc.fillText(kind.toUpperCase()+' / '+(i+1),x+16,y+27);
 const s=e.createInitialState(),p=.05+i*.18;
 const fx={kind,x:kind==='pylon-overload'?504:0,y:kind==='pylon-overload'?504:0,toX:kind==='pylon-overload'?504:90,toY:kind==='pylon-overload'?504:10,ticks:Math.round((1-p)*100),maxTicks:100,ownerId:0,color:kind==='pylon-overload'?'#ffce8a':kind==='melee'?'#f08062':'#83cfff'};s.encounterEffects=[fx];
 if(kind==='pylon-overload'){fc.translate(x+22,y+35);fc.scale(.21,.17);art.drawEncounterEffects(fc,s,48,48);}
 else{fc.translate(x+65,y+130);art.drawEncounterEffects(fc,s,0,0);}
 fc.restore();
}
fs.writeFileSync(path.join(output,'linked-boss-attack-effects.png'),fxCanvas.toBuffer('image/png'));

const sharing=createCanvas(1280,340),hc=sharing.getContext('2d');hc.fillStyle='#090f19';hc.fillRect(0,0,1280,340);
for(let i=0;i<4;i++){
 const left=i*320,p=[.05,.32,.57,.87][i],s=e.createInitialState(),a=structuredClone(dawn),b=structuredClone(dusk);
 a.x=0;a.y=0;b.x=336;b.y=0;a.twin.transferGiveTicks=60*(1-p);b.twin.transferGetTicks=60*(1-p);s.enemies=[a,b];
 s.encounterEffects=[{kind:'transfer',x:0,y:0,toX:336,toY:0,ticks:60*(1-p),maxTicks:60,ownerId:a.id,targetId:b.id,color:'#f08062'}];
 hc.fillStyle='#101c2a';hc.fillRect(left+5,5,310,330);hc.fillStyle='#d3e6ee';hc.font='bold 14px monospace';hc.textAlign='left';hc.fillText(['GATHER','RELEASE','TRANSFER','ABSORB'][i],left+18,30);
 hc.save();hc.beginPath();hc.rect(left+5,45,310,270);hc.clip();hc.translate(left+46,190);hc.scale(.65,.65);
 art.drawEncounterEnemy(hc,a,0,0,60);art.drawEncounterEnemy(hc,b,336,0,60);art.drawEncounterEffects(hc,s,0,0);hc.restore();
}
fs.writeFileSync(path.join(output,'twin-health-sharing.png'),sharing.toBuffer('image/png'));
