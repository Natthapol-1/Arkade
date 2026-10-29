const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');const {drawNeptuneUnit,drawNeptuneOverlay,drawSkyLaserImpact}=require('./neptune-art.ts');"+src.slice(src.indexOf('const BG_COLOR'),src.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawPlayer=drawPlayer;';
const renderer=new Module(path.resolve('app/ruby-star/jupiter-storm-preview.cjs'),module);renderer.filename=path.resolve('app/ruby-star/jupiter-storm-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const output=process.argv[2],frames=path.join(output,'jupiter-storm-frames');fs.mkdirSync(frames,{recursive:true});
const state=engine.createInitialState();state.specialSkill='storm_reaper';state.starEnergy=0;state.poweredTicks=0;
for(let frame=0;frame<32;frame++){
 const canvas=createCanvas(300,250),ctx=canvas.getContext('2d');ctx.fillStyle='#111923';ctx.fillRect(0,0,300,250);
 ctx.strokeStyle='#ffffff15';ctx.strokeRect(8,8,284,234);ctx.fillStyle=c.SPECIAL_SKILLS.storm_reaper.color;ctx.font='16px monospace';ctx.textAlign='center';ctx.fillText('JUPITER STORM',150,34);
 ctx.translate(150,145);ctx.scale(3,3);renderer.exports.drawPlayer(ctx,0,0,state,frame*10);
 fs.writeFileSync(path.join(frames,`frame-${String(frame).padStart(2,'0')}.png`),canvas.toBuffer('image/png'));
}
console.log('Rendered 32 frames of Jupiter storm motion.');
