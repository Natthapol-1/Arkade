const fs=require('fs'),Module=require('module'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const c=require('../app/ruby-star/constants.ts'),engine=require('../app/ruby-star/engine.ts'),src=fs.readFileSync('app/ruby-star/page.tsx','utf8');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');"+src.slice(src.indexOf('const BG_COLOR'),src.indexOf('function BossSpawnButton('))+';exports.drawEnemy=drawEnemy;exports.drawThornGround=drawThornGround;';const m=new Module(require('path').resolve('app/ruby-star/preview.cjs'),module);m.filename=require('path').resolve('app/ruby-star/preview.cjs');m.paths=module.paths;m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

const types=['fiery_king','splitter_queen','devourer','frost_warden','blind_prayer','sea_chanter','thorn_weaver'];
const canvas=createCanvas(1400,780),ctx=canvas.getContext('2d');ctx.fillStyle='#111923';ctx.fillRect(0,0,1400,780);
for(let row=0;row<3;row++)for(let i=0;i<types.length;i++){
 const type=types[i],state=engine.createInitialState();engine.godSpawnBoss(state,type);const e=state.enemies[0];e.attackTimer=200;e.windupTicks=type==='frost_warden'?200:0;
 if(type==='devourer')e.chargeDirX=row===2?20:0;
 if(row===1){e.attackTimer=2;if(type==='splitter_queen')e.windupTicks=2;if(type==='frost_warden')e.windupTicks=2;if(e.prayer)e.prayer.escapeWindupTicks=2;if(e.thorn)e.thorn.windupTicks=2;if(e.sea)e.sea.songWindupTicks=2;}
 if(row===2)e.shootTicks=type==='splitter_queen'||type==='frost_warden'?20:type==='devourer'?16:type==='sea_chanter'?24:14;
 ctx.save();ctx.translate(i*200+100,row*260+150);m.exports.drawEnemy(ctx,e,0,0,40);ctx.restore();ctx.fillStyle='#d4e1e9';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(type,i*200+100,row*260+22);ctx.fillText(['IDLE','WINDUP','RELEASE / MAX GROWTH'][row],i*200+100,row*260+42);
}
fs.writeFileSync(process.argv[2] || 'boss-animation-check.png',canvas.toBuffer('image/png'));
