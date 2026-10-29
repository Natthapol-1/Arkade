const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,options]of [['desktop',{viewport:{width:1280,height:800}}],['mobile',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]]){
   const context=await browser.newContext(options),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:3000/ruby-star/endless?god=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
   await page.getByRole('button',{name:'No Mobs',pressed:false,exact:true}).click();await page.getByRole('button',{name:'No Boss',pressed:false,exact:true}).click();
   await page.evaluate(()=>{
    const canvas=document.querySelector('canvas');let fiber=canvas[Object.keys(canvas).find(key=>key.startsWith('__reactFiber'))];
    for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next){const s=hook.memoizedState?.current;if(s?.gamePhase&&s?.map){s.playerHP=10;return;}}throw Error('Game state missing');
   });
   await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('q');await page.keyboard.press('q');
   const dialog=page.getByRole('dialog',{name:'RUBY STAR',exact:true});await dialog.waitFor();
   assert.equal(await dialog.locator('.rs-end-stage strong').innerText(),'0');assert.equal(await dialog.locator('.rs-end-stats > div').count(),4);
   const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=options.viewport.width&&box.y+box.height<=options.viewport.height);
   const button=dialog.getByRole('button',{name:'PLAY AGAIN',exact:true});const target=await button.boundingBox();assert.ok(target.height>=42);
   assert.equal(await button.evaluate(el=>document.activeElement===el),true);
   await page.screenshot({path:path.join(process.argv[2]||'docs/ruby-star/visual-reference',`game-over-${name}.png`)});
   if(name==='mobile')await button.tap();else await page.keyboard.press('Enter');
   await dialog.waitFor({state:'detached'});assert.equal(await page.locator('.rs-stage').getAttribute('aria-label'),'Stage 0');
   assert.equal(await page.getByRole('button',{name:'No Mobs',pressed:true,exact:true}).count(),1);assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Game over: actual bomb loss, stage/stats, desktop/mobile layout, restart focus/tap, fresh run and debug-toggle persistence passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
