const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,viewport] of [['desktop',{width:1280,height:800}],['mobile',{width:844,height:390}]]){
   const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:3000/ruby-star/endless?god=1',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
   await page.evaluate(()=>{
    const canvas=document.querySelector('canvas');let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
    for(;fiber;fiber=fiber.return)for(let h=fiber.memoizedState;h;h=h.next)if(h.memoizedState?.current?.gamePhase){window.__state=h.memoizedState.current;break;}
    Object.assign(window.__state,{noMobs:true,noBossSpawns:true,godMode:true,meteoriteTimer:100000});
   });
   await page.getByRole('button',{name:'Spawn BLIND PRAYER',exact:true}).click();
   const warning=page.locator('.rs-prayer-warning');await warning.waitFor();
   assert.match(await warning.innerText(),/MOVEMENT REVERSED/);
   await page.evaluate(()=>{const s=window.__state;s.ascensionBannerTicks=360;s.ambientEvents.active={kind:'eclipse',ticks:360,maxTicks:360,age:60,points:[{x:25,y:25}],pullTimer:0};});
   await page.waitForTimeout(100);
   const a=await warning.boundingBox(),b=await page.locator('.rs-event-banner').boundingBox();assert.ok(a.y+a.height<=b.y);
   await page.screenshot({path:path.join('docs/ruby-star/visual-reference',`prayer-warning-${name}.png`)});
   await page.evaluate(()=>window.__state.bossSpawnTicks=1);await warning.waitFor({state:'detached'});
   assert.ok(await page.locator('[data-status="reversed"]').isVisible());assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Prayer warning visible alone and during Eclipse/Ascension, desktop and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
