const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,options]of [['desktop',{viewport:{width:1280,height:800}}],['mobile',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]]){
   const context=await browser.newContext(options),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:3000/ruby-star?god=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Close rules',exact:true}).click();
   await page.getByRole('button',{name:'No Mobs',exact:true,pressed:false}).click();await page.getByRole('button',{name:'No Boss',exact:true,pressed:false}).click();
   const hud=page.locator('.rs-hud'),stage=hud.locator('.rs-stage'),bomb=hud.locator('[data-bomb-state]');
   assert.equal(await stage.getAttribute('aria-label'),'Stage 0');assert.equal(await hud.locator('.rs-special-slot').count(),0);
   const bounds=await stage.boundingBox();assert.ok(Math.abs(bounds.x+bounds.width/2-options.viewport.width/2)<1);
   assert.ok(await stage.locator('strong').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>await hud.locator('.rs-time > span:last-child').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)));
   for(const state of ['ready','armed','cooldown']){
    if(state!=='ready'){await hud.getByText('TIME',{exact:true}).click();await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('q');}
    await page.waitForFunction(expected=>document.querySelector('[data-bomb-state]')?.dataset.bombState===expected,state);
    assert.ok((await bomb.getAttribute('aria-label')).toLowerCase().includes(state));
    const box=await bomb.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=options.viewport.width);
    await page.screenshot({path:path.join(process.argv[2]||'docs/ruby-star/visual-reference',`hud-${name}-${state}.png`)});
   }
   await page.getByRole('button',{name:'Stage +1',exact:true}).focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.rs-stage')?.textContent==='STAGE1');
   await page.getByRole('button',{name:'Reset game',exact:true}).focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.querySelector('.rs-stage')?.textContent==='STAGE0');
   assert.equal(await bomb.getAttribute('data-bomb-state'),'ready');
   assert.equal(await page.getByRole('button',{name:'No Mobs',exact:true,pressed:true}).count(),1);
   assert.equal(await page.getByRole('button',{name:'No Boss',exact:true,pressed:true}).count(),1);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('HUD: centered dominant Stage, zero-based progression, removed special slot, accessible ready/armed/cooldown bomb icons reset behavior and desktop/mobile layout passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
