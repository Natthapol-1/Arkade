const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000/ruby-star?god=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Close rules',exact:true}).click();
  await page.evaluate(()=>{
   window.__keyboardState=()=>{const canvas=document.querySelector('canvas');let fiber=canvas[Object.keys(canvas).find(key=>key.startsWith('__reactFiber'))];for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next){const s=hook.memoizedState?.current;if(s?.gamePhase&&s?.map)return s;}throw Error('Missing state');};
   const s=window.__keyboardState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=100000;s.ambientEvents.timer=100000;s.starEnergy=0;
  });
  await page.keyboard.press('k');assert.ok(await page.evaluate(()=>window.__keyboardState().laserCooldown>0));assert.equal(await page.evaluate(()=>window.__keyboardState().waveEffects.length),0);
  await page.evaluate(()=>{const s=window.__keyboardState();s.waveCooldown=s.laserCooldown=0;});
  await page.keyboard.down('k');await page.waitForFunction(()=>window.__keyboardState().waveEffects.length>0);await page.keyboard.up('k');
  assert.ok(await page.evaluate(()=>window.__keyboardState().waveCooldown>0));
  await page.evaluate(()=>{
   const s=window.__keyboardState();s.bulletCooldown=0;window.__bulletShots=0;
   s.laserBullets.push=function(...bullets){window.__bulletShots+=bullets.length;return Array.prototype.push.apply(this,bullets);};
  });
  await page.keyboard.down('l');await page.waitForTimeout(650);await page.keyboard.up('l');
  assert.ok(await page.evaluate(()=>window.__bulletShots)>=3);
  const stopped=await page.evaluate(()=>window.__bulletShots);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__bulletShots),stopped);
  // Releasing the mouse does not cancel an independently held keyboard bullet stream.
  await page.keyboard.down('l');const canvas=page.locator('.rs-hud').locator('..').locator('canvas').first();
  await page.mouse.move(620,460);await page.mouse.down({button:'right'});await page.mouse.up({button:'right'});
  const mixed=await page.evaluate(()=>window.__bulletShots);await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>window.__bulletShots)>mixed);await page.keyboard.up('l');
  // Focus loss clears keyboard holds even if the keyup never reaches the window.
  await page.keyboard.down('l');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const blurred=await page.evaluate(()=>window.__bulletShots);
  await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__bulletShots),blurred);await page.keyboard.up('l');
  // Pausing through real rules cancels a held key and prevents firing on resume.
  await page.keyboard.down('l');await page.getByRole('button',{name:'RULES',exact:true}).click();const paused=await page.evaluate(()=>window.__bulletShots);
  await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__bulletShots),paused);
  await page.getByRole('button',{name:'Close rules',exact:true}).click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__bulletShots),paused);await page.keyboard.up('l');
  assert.deepEqual(errors,[]);console.log('K laser/hold wave, L held bullets/release, mixed mouse input, blur/rules cancellation and browser errors passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
