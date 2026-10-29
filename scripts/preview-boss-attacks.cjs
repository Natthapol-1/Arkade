const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');const {drawEncounterEnemy,drawEncounterTelegraphs,drawEncounterEffects}=require('./encounter-art.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.draw={drawBossBeam,drawStormReaperStrike,drawPrayerCircle,drawSeaSongEffects,drawThornGround,drawGame,drawPlayerWave,drawBombBlast,drawSaturnShield,drawBattlefieldIce};';
const renderer=new Module(path.resolve('app/ruby-star/boss-attack-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/boss-attack-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const draw=renderer.exports.draw,output=process.argv[2]||'.';
const types=['fiery_king','splitter_queen','storm_reaper','devourer','frost_warden','blind_prayer','sea_chanter','thorn_weaver'];
for(const [stage,remaining]of [.9,.55,.15].entries()){
 const canvas=createCanvas(1600,760),ctx=canvas.getContext('2d');ctx.fillStyle='#111923';ctx.fillRect(0,0,1600,760);
 for(const [i,type]of types.entries()){
  const x=i%4*400,y=Math.floor(i/4)*380;ctx.strokeStyle='#26303c';ctx.strokeRect(x+8,y+8,384,364);ctx.fillStyle=c.ENEMY_CONFIGS[type].color;ctx.font='15px monospace';ctx.textAlign='center';ctx.fillText(c.BOSS_NAMES[type],x+200,y+34);
  ctx.save();ctx.beginPath();ctx.rect(x+10,y+48,380,320);ctx.clip();ctx.translate(x,y);
  const state=engine.createInitialState();engine.godSpawnBoss(state,type);const boss=state.enemies[0];
  if(['fiery_king','splitter_queen','devourer','frost_warden'].includes(type))draw.drawBossBeam(ctx,{fiery_king:'king',splitter_queen:'queen',devourer:'devourer',frost_warden:'warden'}[type],60,235,330,145,remaining,40);
  else if(type==='storm_reaper')draw.drawStormReaperStrike(ctx,200,200,-.3,remaining);
  else if(type==='blind_prayer')draw.drawPrayerCircle(ctx,200,200,95,40,remaining);
  else if(type==='sea_chanter'){
   state.seaSongWaves=[{x:220,y:200,dx:1,dy:0,rangeLeft:100,aimX:350,aimY:200,hitPlayer:false,ownerId:boss.id}];draw.drawSeaSongEffects(ctx,state,0,0,40);
  }else{
   const center=10*c.TILE_SIZE;for(let ty=8;ty<12;ty++)for(let tx=8;tx<12;tx++)state.map[ty][tx]=c.T_FLOOR;
   state.thornPatches=[{x:center,y:center,ticks:stage===2?35:c.THORN_LIFETIME-60,ownerId:boss.id}];draw.drawThornGround(ctx,state,center-200,center-200,40);
  }
  ctx.restore();
 }
 fs.writeFileSync(path.join(output,'boss-attacks-'+stage+'.png'),canvas.toBuffer('image/png'));
}
// Real-size integration: every boss at warning, release and fade, without changing map state.
const scene=createCanvas(1000,700);
for(const type of types)for(let stage=0;stage<3;stage++){
 const state=engine.createInitialState();engine.godSpawnBoss(state,type);state.noMobs=true;state.screenShakeTicks=0;
 const boss=state.enemies[0];boss.tileX=boss.targetTileX=13;boss.tileY=boss.targetTileY=10;boss.x=13.5*c.TILE_SIZE;boss.y=10.5*c.TILE_SIZE;
 const px=state.playerX,py=state.playerY;
 const colors={fiery_king:'#cc0022',splitter_queen:'#cc33ff',devourer:'#6b2fa8',frost_warden:'#aaeeff'};
 if(colors[type])state.laserBeams=[{fromX:boss.x,fromY:boss.y,endX:px,endY:py,dirX:0,dirY:0,ticks:[20,10,1][stage],color:colors[type]}];
 if(type==='fiery_king'){boss.king.arenaWindupTicks=stage===0?30:0;state.kingArenaPulseTicks=stage===1?15:stage===2?2:0;}
 if(type==='storm_reaper')state.slashEffects=[{x:px,y:py,angle:.2,ticks:[13,7,1][stage],maxTicks:14}];
 if(type==='blind_prayer'){boss.prayer.escapeWindupTicks=stage===0?30:0;boss.prayer.rubyCastTicks=40;boss.prayer.rubyDestination=1;state.prayerWaves=[{x:boss.x,y:boss.y,radius:c.ENEMY_CONFIGS.blind_prayer.attackRange*c.TILE_SIZE,ticks:[28,15,1][stage]}];}
 if(type==='sea_chanter'){
  boss.sea.songWindupTicks=stage===0?12:0;boss.sea.songAimX=px;boss.sea.songAimY=py;
  if(stage===1)state.seaSongWaves=[{x:(boss.x+px)/2,y:py,dx:-1,dy:0,rangeLeft:100,aimX:px,aimY:py,hitPlayer:false,ownerId:boss.id}];
  if(stage===2)state.seaSongBursts=[{x:px,y:py,ticks:12,ownerId:boss.id}];
 }
 if(type==='thorn_weaver'){
  const aim=c.getThornFieldBounds(px,py);boss.thorn.aimX=aim.x;boss.thorn.aimY=aim.y;boss.thorn.windupTicks=stage===0?25:0;
  if(stage>0)state.thornPatches=[{x:aim.x,y:aim.y,ticks:stage===1?c.THORN_LIFETIME-5:30,ownerId:boss.id}];
 }
 const before=JSON.stringify(state.map);draw.drawGame(scene.getContext('2d'),state,1000,700,40);
 if(before!==JSON.stringify(state.map))throw new Error('Boss renderer changed map');
 if(type==='thorn_weaver'&&stage===0)fs.writeFileSync(path.join(output,'weaver-warning-game.png'),scene.toBuffer('image/png'));
}
const impact=createCanvas(1000,360),ctx=impact.getContext('2d');ctx.fillStyle='#111923';ctx.fillRect(0,0,1000,360);
for(let i=0;i<2;i++){ctx.strokeStyle='#26303c';ctx.strokeRect(i*500+8,8,484,344);ctx.fillStyle='#c9d9e6';ctx.font='15px monospace';ctx.textAlign='center';ctx.fillText(i?'BOMB DETONATION':'CHARGED WAVE',i*500+250,34);}
draw.drawPlayerWave(ctx,250,195,100,false,23);draw.drawBombBlast(ctx,750,195,100,20);
fs.writeFileSync(path.join(output,'charge-bomb-impact.png'),impact.toBuffer('image/png'));
process.stdout.write('Rendered all eight bosses at three stages; map state unchanged.\n');
