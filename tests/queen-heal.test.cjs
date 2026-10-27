const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function encounter(kills){const s=engine.createInitialState();s.godMode=true;s.noMobs=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;s.bossesKilled=kills;engine.godSpawnBoss(s,'splitter_queen');const queen=s.enemies[0];queen.hp=1;queen.phaseTimer=1;queen.attackTimer=10000;return{s,queen};}
test('Queen teleport healing grows early and stays capped at eight at later levels',()=>{
 for(const [kills,heal]of [[0,4],[1,5],[2,6],[3,7],[4,8],[5,8],[20,8],[100,8]]){
  const {s,queen}=encounter(kills);engine.tick(s);assert.equal(queen.hp,1+heal);assert.equal(queen.phaseTimer,c.QUEEN_PHASE_INTERVAL);
 }
});
test('Queen healing cannot exceed max HP and waits while teleport menu is open',()=>{
 const {s,queen}=encounter(20);queen.hp=queen.maxHp-2;s.gamePhase='teleporting';engine.tick(s);assert.equal(queen.hp,queen.maxHp-2);
 s.gamePhase='playing';engine.tick(s);assert.equal(queen.hp,queen.maxHp);
});
