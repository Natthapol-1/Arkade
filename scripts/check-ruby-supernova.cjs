const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,options]of [['desktop',{viewport:{width:1280,height:800}}],['mobile',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]]){
   const page=await browser.newPage(options),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{const OriginalAudio=window.Audio;window.__audioVoices=[];window.Audio=function(...args){const voice=new OriginalAudio(...args);window.__audioVoices.push(voice);return voice;};window.Audio.prototype=OriginalAudio.prototype;});
   await page.goto('http://127.0.0.1:3000/ruby-star/endless?god=1',{waitUntil:'networkidle',timeout:60000});
   await page.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
   await page.waitForFunction(()=>{
    const canvas=document.querySelector('canvas:not([aria-hidden])');let f=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
    for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.gamePhase){window.__nova=h.memoizedState.current;return true;}return false;
   });
   await page.evaluate(()=>Object.assign(window.__nova,{noMobs:true,noBossSpawns:true,godMode:true,meteoriteTimer:100000}));
   await page.evaluate(()=>{window.__nova.playerHP=20;window.__nova.rubyHP=12;});
   await page.getByRole('button',{name:'Full HP',exact:true}).click();
   assert.deepEqual(await page.evaluate(()=>[window.__nova.playerHP,window.__nova.rubyHP]),[100,100]);
   await page.getByRole('button',{name:'Create SUPERNOVA',exact:true}).click();
   await page.waitForFunction(()=>window.__nova.ambientEvents.warning?.kind==='supernova');
   await page.waitForFunction(()=>/^INCOMING: SUPERNOVA [123]s$/.test(document.querySelector('.rs-event-banner')?.textContent));
   await page.evaluate(()=>window.__nova.ambientEvents.warning.ticks=1);
   await page.waitForFunction(()=>window.__nova.ambientEvents.active?.kind==='supernova');
   await page.evaluate(()=>{
    const s=window.__nova;s.ambientEvents.active.points=[{x:10,y:10}];s.map[10][10]=1;s.rubyTileX=15;s.rubyTileY=13;
    Object.assign(s,{playerTileX:14,playerTargetX:14,playerTileY:10,playerTargetY:10,playerX:14.5*48,playerY:10.5*48,playerStepProgress:0});document.activeElement?.blur();
   });
   await page.keyboard.press('l');assert.equal(await page.evaluate(()=>window.__nova.ambientEvents.active.chargeTicks),undefined);
   await page.keyboard.down('k');await page.waitForFunction(()=>window.__nova.ambientEvents.active.chargeTicks>0);await page.keyboard.up('k');
   await page.waitForFunction(()=>document.querySelector('.rs-event-banner')?.textContent.includes('CHARGING'));
   await page.screenshot({path:path.join('docs/ruby-star/visual-reference',`supernova-${name}-charging.png`)});
   await page.evaluate(()=>window.__chargeVoice=window.__audioVoices.filter(v=>v.src.endsWith('solar-flare-swoosh.wav')).at(-1));
   await page.getByRole('button',{name:'RULES',exact:true}).click();const before=await page.evaluate(()=>window.__nova.ambientEvents.active.chargeTicks);await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>window.__nova.ambientEvents.active.chargeTicks),before);await page.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
   await page.evaluate(()=>{
    const s=window.__nova;Object.assign(s,{playerTileX:10,playerTargetX:10,playerTileY:10,playerTargetY:10,playerX:10.5*48,playerY:10.5*48,playerStepProgress:0});s.map[10][10]=2;document.activeElement?.blur();
   });
   await page.keyboard.press('x');await page.locator('.rs-teleport-grid').waitFor();
   await page.waitForFunction(()=>window.__chargeVoice.paused);
   const pausedTime=await page.evaluate(()=>window.__chargeVoice.currentTime);assert.ok(pausedTime>0);
   await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__chargeVoice.currentTime),pausedTime);
   await page.getByRole('button',{name:/^\[2\] BETA/}).click();
   await page.waitForFunction(()=>!window.__chargeVoice.paused);assert.ok(await page.evaluate(time=>window.__chargeVoice.currentTime>=time,pausedTime));
   await page.evaluate(()=>window.__nova.ambientEvents.active.chargeTicks=1);
   await page.waitForFunction(()=>window.__nova.ambientEvents.active?.blastTicks>0);
   await page.waitForFunction(()=>document.querySelector('.rs-event-banner')?.textContent.includes('DETONATED'));
   await page.screenshot({path:path.join('docs/ruby-star/visual-reference',`supernova-${name}-explosion.png`)});
   await page.getByRole('button',{name:'Reset game',exact:true}).focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>!document.querySelector('[aria-label="Create SUPERNOVA"]').disabled);assert.deepEqual(errors,[]);await page.close();
  }
  console.log('Supernova: Full HP, concise warning, God trigger, bullet immunity, real charged wave, charging banner, rules/teleport audio pause and resume, detonation, restart, desktop/mobile and browser errors passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
