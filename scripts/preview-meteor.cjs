const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),source=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');const {drawEncounterEnemy,drawEncounterTelegraphs,drawEncounterEffects}=require('./encounter-art.ts');"+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.draw={drawMeteor,drawGame};';
const renderer=new Module(path.resolve('app/ruby-star/meteor-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/meteor-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const draw=renderer.exports.draw,output=process.argv[2]||'.';
const canvas=createCanvas(960,500),ctx=canvas.getContext('2d');
ctx.fillStyle='#101923';ctx.fillRect(0,0,960,500);
for(const [i,progress]of [.1,.5,.9].entries()){
 ctx.save();ctx.beginPath();ctx.rect(i*320,0,320,500);ctx.clip();
 ctx.fillStyle='#c7d3df';ctx.font='16px monospace';ctx.textAlign='center';ctx.fillText(['APPROACH','DESCENT','FINAL APPROACH'][i],i*320+160,30);
 draw.drawMeteor(ctx,i*320+160,350,80+progress*170,progress,40);ctx.restore();
}
fs.writeFileSync(path.join(output,'meteor-style.png'),canvas.toBuffer('image/png'));
for(const [i,progress]of [.1,.5,.9].entries()){
 const state=engine.createInitialState();state.meteoriteWarning=0;state.meteoriteStrikeIn=Math.round(c.METEORITE_WARNING*(1-progress));
 const before=JSON.stringify(state),scene=createCanvas(1000,700);
 draw.drawGame(scene.getContext('2d'),state,1000,700,40);
 if(before!==JSON.stringify(state))throw new Error('Rendering mutated game state');
 fs.writeFileSync(path.join(output,`meteor-game-${i}.png`),scene.toBuffer('image/png'));
}
console.log('Meteor gallery and three warning stages rendered; state unchanged.');
