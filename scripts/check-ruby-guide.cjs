const assert=require('node:assert/strict'),path=require('path');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const output=process.argv[2]||'.',browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,options]of [['desktop',{viewport:{width:1440,height:960}}],['mobile',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]]){
   const context=await browser.newContext(options),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto('http://127.0.0.1:3000/ruby-star',{waitUntil:'networkidle',timeout:45000});assert.equal(response.status(),200);
   const guide=page.locator('.rs-guide'),modal=page.locator('.modal-content');
   assert.equal(await guide.getByRole('heading',{name:'HOW TO PLAY',exact:true}).count(),1);
   await page.screenshot({path:path.join(output,`ruby-main-guide-${name}.png`)});
   assert.equal(await guide.getByRole('heading',{name:'FIERY KING',exact:true}).count(),0);
   const time=page.locator('.rs-hud').getByText('TIME',{exact:true}).locator('..'),before=await time.innerText();
   await page.waitForTimeout(1100);assert.equal(await time.innerText(),before,'Game advanced while rules were open');
   assert.equal(await modal.evaluate(el=>el.scrollWidth>el.clientWidth),false,'Modal overflows horizontally');
   await page.screenshot({path:path.join(output,`ruby-rules-${name}.png`)});
   await guide.getByRole('button',{name:'ALIENS & BOSSES',exact:true}).click();
   assert.equal(await guide.locator('article').count(),21);
   assert.equal(await guide.getByText('Energy Leech',{exact:true}).count(),1);
   assert.equal(await guide.locator('.rs-guide-skill').count(),8);
   for(const skill of ['SOLAR FLARE','LUNAR ECHO','JUPITER STORM','SINGULARITY','SATURN GUARD','SIRIUS SURGE',"NEPTUNE'S TIDE","GAIA'S ROOTS"]){assert.equal(await guide.getByText('Celestial skill: '+skill,{exact:true}).count(),1);}
   await guide.getByRole('heading',{name:'BOSSES',exact:true}).scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(output,`ruby-boss-guide-${name}.png`)});
   assert.equal(await page.locator('.modal-body').evaluate(el=>el.scrollHeight>el.clientHeight),true);
   await guide.getByRole('button',{name:'MAIN RULES',exact:true}).last().click();
   assert.equal(await guide.getByRole('heading',{name:'CONTROLS',exact:true}).isVisible(),true);
   assert.equal(await page.locator('.modal-body').evaluate(el=>el.scrollTop),0);
   await guide.getByRole('button',{name:'ALIENS & BOSSES',exact:true}).click();
   await page.getByRole('button',{name:'Close rules',exact:true}).click();assert.equal(await modal.count(),0);
   await page.getByRole('button',{name:'RULES',exact:true}).click();
   assert.equal(await guide.getByRole('heading',{name:'HOW TO PLAY',exact:true}).isVisible(),true);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Desktop/mobile guide navigation, 13 aliens including Energy Leech, 8 boss skills, scrolling, pause, reopen reset and browser errors: passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
