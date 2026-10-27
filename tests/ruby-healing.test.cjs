const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../app/ruby-star/engine.ts'),c=require('../app/ruby-star/constants.ts');
function carrying(){const s=engine.createInitialState();s.enemies=[];s.rubyTileX=s.playerTileX;s.rubyTileY=s.playerTileY;engine.toggleCarryRuby(s);s.playerHP=60;s.rubyHP=50;return s;}

test('carried Ruby heals together with the player and stays carried',()=>{
 const s=carrying();assert.equal(engine.canHealRuby(s),true);assert.equal(engine.healRuby(s),true);
 assert.equal(s.playerHP,63);assert.equal(s.rubyHP,55);assert.equal(s.playerCarryingRuby,true);assert.equal(s.rubyTileX,-1);
 assert.equal(engine.healRuby(s),false);assert.equal(s.rubyHP,55);
});
test('carried healing keeps enemy-clear, pause, max-HP rules',()=>{
 const s=carrying();engine.godSpawnBoss(s,'frost_warden');const enemy=s.enemies[0];enemy.tileX=s.playerTileX;enemy.tileY=s.playerTileY;
 assert.equal(engine.healRuby(s),false);s.enemies=[];s.gamePhase='teleporting';assert.equal(engine.healRuby(s),false);
 s.gamePhase='lost';assert.equal(engine.healRuby(s),false);s.gamePhase='playing';
 s.playerHP=c.PLAYER_MAX_HP;s.rubyHP=c.RUBY_MAX_HP;assert.equal(engine.canHealRuby(s),false);
 s.playerHP=99;assert.equal(engine.healRuby(s),true);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,c.RUBY_MAX_HP);
 s.rubyHealCooldown=0;s.playerHP=50;s.rubyHP=50;engine.healRuby(s);assert.equal(s.playerHP,53);assert.equal(s.rubyHP,55);
});
test('placed Ruby still requires the player to be nearby',()=>{
 const s=carrying();engine.toggleCarryRuby(s);s.rubyTileX=s.playerTileX+c.RUBY_HEAL_RANGE+1;
 assert.equal(engine.healRuby(s),false);s.rubyTileX=s.playerTileX;assert.equal(engine.healRuby(s),true);
});
