const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function at(x,y){const s=engine.createInitialState();s.noMobs=true;s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;return s;}

test('teleport opens on the pad and on all eight neighboring tiles',()=>{
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const s=at(10+dx,10+dy);if(s.map[10+dy][10+dx]===c.T_WALL)continue;
  assert.equal(engine.tryActivateTeleport(s),true,`offset ${dx},${dy}`);assert.equal(s.gamePhase,'teleporting');
 }
});

test('teleport does not open two tiles away from a pad',()=>{
 for(const [x,y] of [[12,10],[10,8],[8,12]]){
  const s=at(x,y);if(s.map[y][x]===c.T_WALL)continue;
  assert.equal(engine.tryActivateTeleport(s),false,`${x},${y}`);assert.equal(s.gamePhase,'playing');
 }
});
