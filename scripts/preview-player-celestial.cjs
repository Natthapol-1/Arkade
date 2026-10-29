const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');

const renderCode='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');const {drawEncounterEnemy,drawEncounterTelegraphs,drawEncounterEffects}=require('./encounter-art.ts');"+src.slice(src.indexOf('const BG_COLOR'),src.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawPlayer=drawPlayer;exports.drawGame=drawGame;';
const renderer=new Module(require('path').resolve('app/ruby-star/preview-celestial.cjs'),module);renderer.filename=require('path').resolve('app/ruby-star/preview-celestial.cjs');renderer.paths=module.paths;renderer._compile(ts.transpileModule(renderCode,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const canvas=createCanvas(900,1000),ctx=canvas.getContext('2d');ctx.fillStyle='#111923';ctx.fillRect(0,0,900,1000);
const kinds=[null,'fiery_king','splitter_queen','storm_reaper','devourer','frost_warden','blind_prayer','sea_chanter','thorn_weaver','aegis_sentinel','astral_twins'];
for(const [i,kind]of kinds.entries()){
 const state=engine.createInitialState();state.specialSkill=kind;state.playerCarryingRuby=false;state.starEnergy=0;state.poweredTicks=0;state.speedActiveTicks=0;state.playerDirX=0;state.playerDirY=1;
 const x=i%3*300,y=Math.floor(i/3)*250;ctx.strokeStyle='#ffffff15';ctx.strokeRect(x+8,y+8,284,234);
 ctx.save();ctx.translate(x+150,y+145);ctx.scale(3,3);renderer.exports.drawPlayer(ctx,0,0,state,40);ctx.restore();
 ctx.fillStyle=kind==='devourer'?'#bcbcc8':kind?c.SPECIAL_SKILLS[kind].color:'#dddd90';ctx.font='16px monospace';ctx.textAlign='center';ctx.fillText(kind?c.SPECIAL_SKILLS[kind].name:'BASE SUIT',x+150,y+34);
}
fs.writeFileSync(process.argv[2] || 'player-celestial-suits.png',canvas.toBuffer('image/png'));
const statesCanvas=createCanvas(1200,720),statesCtx=statesCanvas.getContext('2d');statesCtx.fillStyle='#111923';statesCtx.fillRect(0,0,1200,720);
const cases=[['UP',{playerDirX:0,playerDirY:-1}],['DOWN',{playerDirX:0,playerDirY:1}],['LEFT',{playerDirX:-1,playerDirY:0}],['RIGHT',{playerDirX:1,playerDirY:0}],['CARRY RUBY',{playerCarryingRuby:true}],['SPEED',{speedActiveTicks:100,speedFlashTicks:20}],['FULL ENERGY',{starEnergy:c.STAR_ENERGY_MAX}],['POWERED',{poweredTicks:100}],['FIRING',{laserCooldown:c.LASER_COOLDOWN}],['CHARGING',{},900],['LUNAR DECOY',{specialSkill:'splitter_queen'},0,.8],['SATURN + CARRY',{specialSkill:'frost_warden',playerCarryingRuby:true}]];
for(const [i,[label,props,charging=0,alpha=1]]of cases.entries()){
 const x=i%4*300,y=Math.floor(i/4)*240,state=engine.createInitialState();Object.assign(state,props);
 statesCtx.strokeStyle='#ffffff15';statesCtx.strokeRect(x+8,y+8,284,224);statesCtx.fillStyle='#b8c8d9';statesCtx.font='14px monospace';statesCtx.textAlign='center';statesCtx.fillText(label,x+150,y+32);
 statesCtx.save();statesCtx.translate(x+150,y+145);statesCtx.scale(2,2);statesCtx.globalAlpha=alpha;renderer.exports.drawPlayer(statesCtx,0,0,state,40,charging);statesCtx.restore();
}
const statesOutput=require('path').join(require('path').dirname(process.argv[2]||'player-celestial-suits.png'),'player-model-states.png');fs.writeFileSync(statesOutput,statesCanvas.toBuffer('image/png'));
