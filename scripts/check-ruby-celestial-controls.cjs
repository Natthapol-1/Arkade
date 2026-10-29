const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,options]of [['desktop',{viewport:{width:1280,height:800}}],['mobile',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]]){
   const page=await browser.newPage(options),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:3000/ruby-star/endless?god=1',{waitUntil:'networkidle',timeout:60000});
   await page.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
   await page.waitForFunction(()=>{
    const canvas=document.querySelector('canvas:not([aria-hidden])');let f=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
    for(;f;f=f.return)for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.current?.gamePhase){window.__skills=h.memoizedState.current;return true;}return false;
   });
   await page.evaluate(()=>Object.assign(window.__skills,{noMobs:true,noBossSpawns:true,godMode:true,meteoriteTimer:100000}));
   const immortal=page.getByRole('button',{name:'Immortal',exact:true}),invincible=page.getByRole('button',{name:'Invincible',exact:true});
   await immortal.click();assert.deepEqual(await page.evaluate(()=>[window.__skills.immortal,window.__skills.godMode]),[true,false]);
   await invincible.click();assert.deepEqual(await page.evaluate(()=>[window.__skills.immortal,window.__skills.godMode]),[false,true]);
   for(const [left,right]of [[immortal,invincible],[page.getByRole('button',{name:'Full HP',exact:true}),page.getByRole('button',{name:'Full Energy',exact:true})]]){
    const a=await left.boundingBox(),b=await right.boundingBox();assert.ok(Math.abs(a.y-b.y)<2&&a.x+a.width<=b.x);
   }
   const bosses=page.getByRole('group',{name:'Summon bosses',exact:true});assert.equal(await bosses.getByRole('button').count(),10);
   assert.ok(await bosses.evaluate(el=>el.nextElementSibling.textContent==='CELESTIAL SKILLS'));
   await page.getByRole('button',{name:'Constellations',exact:true}).click();
   const editor=page.getByRole('dialog',{name:'CONSTELLATIONS',exact:true});await editor.waitFor();
   assert.equal(await editor.locator('[data-constellation]').count(),20);
   const pausedTick=await page.evaluate(()=>window.__skills.gameTick);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__skills.gameTick),pausedTick);
   const laser=editor.locator('[data-constellation="laser"]');await laser.click();assert.equal(await laser.getAttribute('aria-pressed'),'true');await laser.click();assert.equal(await laser.getAttribute('aria-pressed'),'false');
   for(const kind of ['healing','wave','energy','ruby'])await editor.locator('[data-constellation="'+kind+'"]').click();
   await editor.getByRole('button',{name:'DONE',exact:true}).scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join('docs/ruby-star/visual-reference',`god-constellations-${name}.png`)});
   await editor.getByRole('button',{name:'DONE',exact:true}).click();await editor.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>window.__skills.gamePhase),'playing');
   await page.getByRole('button',{name:'Constellations',exact:true}).click();await editor.waitFor();assert.equal(await editor.locator('[data-constellation="wave"]').getAttribute('aria-pressed'),'true');
   await page.keyboard.press('Escape');await editor.waitFor({state:'detached'});
   const group=page.getByRole('group',{name:'Grant celestial skills',exact:true});
   assert.equal(await group.getByRole('button').count(),10);assert.equal(await page.getByRole('slider').count(),0);
   assert.equal(await page.getByLabel('Grant test special',{exact:true}).count(),0);
   for(const [kind,label]of [['devourer','SINGULARITY'],['thorn_weaver',"GAIA'S ROOTS"],['splitter_queen','LUNAR ECHO'],['fiery_king','SOLAR FLARE'],['storm_reaper','JUPITER STORM'],['frost_warden','SATURN GUARD'],['sea_chanter',"NEPTUNE'S TIDE"],['blind_prayer','SIRIUS SURGE'],['aegis_sentinel','VENUS VEIL'],['astral_twins','BINARY STAR']]){
    const button=group.getByRole('button',{name:'Grant '+label,exact:true});await button.click();
    assert.equal(await page.evaluate(()=>window.__skills.specialSkill),kind);assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.equal(await page.evaluate(()=>window.__skills.gamePhase),'playing');
    const box=await button.boundingBox();assert.ok(box.width>=40&&box.height>=40);
   }
   await group.getByRole('button',{name:'Grant SINGULARITY',exact:true}).click();
   await page.screenshot({path:path.join('docs/ruby-star/visual-reference',`god-celestial-controls-${name}.png`)});
   await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('f');
   await page.waitForFunction(()=>window.__skills.singularity);assert.equal(await page.evaluate(()=>window.__skills.singularity.maxTicks),1080);
   assert.equal(await group.getByRole('button',{pressed:true}).count(),0);assert.deepEqual(errors,[]);await page.close();
  }
  console.log('Celestial controls: protection modes, paired restore buttons, grouped bosses and all ten grants, selected state, all-Constellation toggles, fixed Singularity field, desktop/mobile layout and browser errors passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
