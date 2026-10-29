const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');const {drawEncounterEnemy,drawEncounterTelegraphs,drawEncounterEffects}=require('./encounter-art.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawGame=drawGame;exports.drawBattlefieldPad=drawBattlefieldPad;';
const renderer=new Module(path.resolve('app/ruby-star/battlefield-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/battlefield-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const output=process.argv[2]||'.',prefix=process.argv[3]||'battlefield';
const state=engine.createInitialState();state.noMobs=true;state.enemies=[];state.resources=[];
state.frostIceTiles=[[9,9],[11,9],[12,10],[11,12]].filter(([x,y])=>state.map[y][x]!==c.T_WALL);
for(const [name,width,height,x,y,mobile]of [['overview',1040,1040,25,25,true],['detail',1200,700,20,10,false],['pad',900,620,10,10,false]]){
 const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 state.playerTileX=state.playerTargetX=x;state.playerTileY=state.playerTargetY=y;state.playerX=(x+.5)*c.TILE_SIZE;state.playerY=(y+.5)*c.TILE_SIZE;
 const mapBefore=JSON.stringify(state.map),iceBefore=JSON.stringify(state.frostIceTiles);
 for(const tick of [12,40,88])renderer.exports.drawGame(ctx,state,width,height,tick,0,mobile);
 if(JSON.stringify(state.map)!==mapBefore||JSON.stringify(state.frostIceTiles)!==iceBefore)throw new Error('Rendering mutated battlefield state');
 fs.writeFileSync(path.join(output,prefix+'-'+name+'.png'),canvas.toBuffer('image/png'));
}

const pads=createCanvas(1200,420),pctx=pads.getContext('2d');pctx.fillStyle='#0b1424';pctx.fillRect(0,0,1200,420);
for(const [i,color]of c.CHAMBER_COLORS.entries()){
 pctx.fillStyle=color;pctx.font='bold 15px monospace';pctx.textAlign='center';pctx.fillText(c.CHAMBER_LABELS[i],i*300+150,30);
 pctx.save();pctx.translate(i*300+54,58);pctx.scale(4,4);renderer.exports.drawBattlefieldPad(pctx,0,0,color,40,i);pctx.restore();
 renderer.exports.drawBattlefieldPad(pctx,i*300+126,292,color,40,i);
 pctx.fillStyle='#9baec9';pctx.font='12px monospace';pctx.fillText('48px gameplay size',i*300+150,367);
}
fs.writeFileSync(path.join(output,'teleport-pad-design.png'),pads.toBuffer('image/png'));
