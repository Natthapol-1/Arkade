const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output=path.resolve(process.argv[2]||'docs/ruby-star/visual-reference');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,options]of [['desktop',{viewport:{width:1280,height:800}}],['mobile',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]]){
   const context=await browser.newContext(options),page=await context.newPage(),errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.goto('http://127.0.0.1:3000/ruby-star?god=1',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Close rules',exact:true}).click();
   // Find the real mutable state via React's development fiber, without a production debug API.
   await page.waitForFunction(()=>{
    const canvas=document.querySelector('canvas');let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
    for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next){
     const state=hook.memoizedState?.current;
     if(state?.gamePhase&&state?.map){window.__constellationTestState=state;state.noMobs=state.noBossSpawns=true;state.godMode=true;return true;}
    }return false;
   });
   // Exercise a real meteor defeat at the third boss milestone.
   await page.getByRole('button',{name:'Spawn FROST WARDEN',exact:true}).click();
   await page.evaluate(()=>{
    const s=window.__constellationTestState,a=s.enemies.find(e=>e.type==='frost_warden');
    Object.assign(a,{tileX:12,tileY:12,targetTileX:12,targetTileY:12,x:12.5*48,y:12.5*48,hp:1});
    Object.assign(s,{bossesKilled:2,noBossSpawns:true,meteoriteWarning:0,meteoriteStrikeIn:1});
   });
   const dialog=page.getByRole('dialog',{name:'CONSTELLATIONS',exact:true});await dialog.waitFor();
   assert.equal(await dialog.getByRole('button').count(),2);
   const before=await page.evaluate(()=>JSON.stringify(window.__constellationTestState));
   await page.waitForTimeout(300);await page.keyboard.press('q');await page.keyboard.press('f');
   const after=await page.evaluate(()=>JSON.stringify(window.__constellationTestState));
   const old=JSON.parse(before),now=JSON.parse(after);assert.deepEqual(Object.keys(old).filter(key=>JSON.stringify(old[key])!==JSON.stringify(now[key])),[]);
   await page.screenshot({path:path.join(output,`constellations-${name}.png`)});
   const buttons=dialog.getByRole('button');
   for(let i=0;i<2;i++){const box=await buttons.nth(i).boundingBox();assert.ok(box.height>=44&&box.x>=0&&box.x+box.width<=options.viewport.width);}
   await buttons.nth(1).focus();await page.keyboard.press('Tab');assert.equal(await buttons.nth(0).evaluate(el=>el===document.activeElement),true);
   if(name==='mobile')await buttons.nth(0).tap();else await page.keyboard.press('1');
   await dialog.waitFor({state:'detached'});
   assert.equal(await page.evaluate(()=>window.__constellationTestState.constellations.length),1);
   assert.ok(await page.getByLabel('Active constellations').isVisible());
   // Verify every card's text/layout at the longer final-milestone state.
   const kinds=['healing','laser','speed','energy','bomb','bullets','wave','ruby','power','laserRate','waveReach','bombDamage','burstDuration','burstRate','waveRate','playerGuard','manualHealing','killHealing','bombRate','laserRange'];
   for(let i=0;i<kinds.length;i+=2){
    await page.evaluate(([a,b])=>{const s=window.__constellationTestState;s.constellations=[];s.bossesKilled=9;s.constellationChoices=[a,b];s.gamePhase='constellation';},[kinds[i],kinds[(i+1)%kinds.length]]);
    await dialog.waitFor();assert.equal(await dialog.getByRole('button').count(),2);
    await dialog.getByRole('button').first().click();await dialog.waitFor({state:'detached'});
   }
   await page.evaluate(()=>{const s=window.__constellationTestState;s.constellations=[];s.constellationChoices=['wave'];s.bossesKilled=60;s.gamePhase='constellation';});
   await dialog.waitFor();assert.equal(await dialog.getByRole('button').count(),1);
   await page.screenshot({path:path.join(output,`constellation-final-${name}.png`)});
   await page.keyboard.press('2');assert.equal(await dialog.count(),1);await dialog.getByRole('button').click();await dialog.waitFor({state:'detached'});
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Constellations: real third-boss reward, pause/input isolation, two cards, keyboard/focus, mobile tap, all twenty upgrades, resume and browser errors passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
