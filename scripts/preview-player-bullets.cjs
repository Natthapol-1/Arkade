const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
const {createCanvas}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const source=fs.readFileSync('app/ruby-star/RubyStarGame.tsx','utf8');
const helper=source.slice(source.indexOf('function drawPlayerBullet('),source.indexOf('function drawRewardSpark('));
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const constants=require('../app/ruby-star/constants.ts');
const renderer=new Module(path.resolve('app/ruby-star/bullet-preview.cjs'),module);
renderer.filename=path.resolve('app/ruby-star/bullet-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule('const {TILE_SIZE,BULLET_SPEED}=require("./constants.ts");'+helper+';exports.draw=drawPlayerBullet;', {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const canvas=createCanvas(960,640),ctx=canvas.getContext('2d');
ctx.fillStyle='#101923';ctx.fillRect(0,0,960,640);
for(let row=0;row<2;row++)for(let col=0;col<3;col++){
  const x=col*320,y=row*320;
  ctx.strokeStyle='#26303c';ctx.strokeRect(x+8,y+8,304,304);
  ctx.fillStyle=row?'#edbc52':'#65c7e0';ctx.font='15px monospace';ctx.textAlign='center';ctx.fillText((row?'POWERED':'NORMAL')+' · '+['HORIZONTAL','DIAGONAL','VERTICAL'][col],x+160,y+34);
  ctx.fillStyle='#8494a7';ctx.font='11px monospace';ctx.fillText('2× detail',x+160,y+293);
  const [dx,dy]=[[1,0],[1,1],[0,1]][col];
  ctx.save();ctx.translate(x+160,y+160);ctx.scale(2,2);
  renderer.exports.draw(ctx,dx*18,dy*18,dx,dy,Boolean(row),10);
  ctx.restore();
}
fs.writeFileSync(process.argv[2]||'player-bullets.png',canvas.toBuffer('image/png'));
