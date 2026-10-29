const path=require('path');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const output=process.argv[2]||'.',browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const desktop=await browser.newContext({viewport:{width:1440,height:960}}),page=await desktop.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto('http://127.0.0.1:3000/ruby-star/endless?god=1',{waitUntil:'networkidle',timeout:45000});
  await page.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
  const hud=page.locator('.rs-hud');
  if(!/STAGE\s+0/.test(await hud.innerText())||/\+\d/.test(await hud.innerText()))throw new Error('Stage or simplified HUD is incorrect');
  const panel=await page.locator('.rs-god-panel').boundingBox(),canvas=await page.locator('.rs-god-panel').locator('..').locator(':scope > canvas').boundingBox();
  if(!panel||!canvas||Math.abs(panel.x-canvas.x-8)>1||Math.abs(panel.y-canvas.y-8)>1)throw new Error('God panel is not at the upper left');
  await page.getByRole('button',{name:'No Mobs',exact:true,pressed:false}).click();
  await page.locator('.rs-hud').getByText('TIME',{exact:true}).click();
  await page.keyboard.press('e');await page.keyboard.press('Space');
  if(await page.getByText('TELEPORT — SELECT CHAMBER',{exact:true}).count())throw new Error('Space opened teleport instead of healing');
  await page.keyboard.press('x');
  await page.getByRole('button',{name:/^\[2\] BETA/}).click();
  await page.locator('[data-status="ruby-placed"]').waitFor();
  await page.screenshot({path:path.join(output,'ruby-teleport-feedback.png')});
  await page.keyboard.press('e');
  if(await page.locator('[data-status="ruby-placed"]').count())throw new Error('Ruby placement feedback stayed after pickup');
  await page.getByRole('button',{name:'Grant SOLAR FLARE',exact:true}).click();
  await page.getByRole('button',{name:/Spawn.*Fiery King/i}).click();
  await page.waitForTimeout(800);
  await page.screenshot({path:path.join(output,'ruby-desktop-final.png')});
  // Exercise actual React controls for all eight replacement bosses and a ready special.
  for(const name of ['Shadow Queen','Storm Reaper','Soul Devourer','Frost Warden','Blind Prayer','Sea Chanter','Thorn Weaver']){
   await page.getByRole('button',{name:new RegExp('Spawn.*'+name,'i')}).click();await page.waitForTimeout(120);
   if(name==='Blind Prayer'){
    await page.locator('[data-status="reversed"]').waitFor();
    await page.screenshot({path:path.join(output,'ruby-reversed-feedback.png')});
   }
  }
  if(await page.locator('[data-status="reversed"]').count())throw new Error('Reversed feedback survived boss replacement');
  await page.getByRole('button',{name:"Grant NEPTUNE'S TIDE",exact:true}).click();
  await page.locator('.rs-hud').getByText('TIME',{exact:true}).click();await page.keyboard.press('f');
  for(let i=0;i<10;i++){
   await page.getByRole('button',{name:'Stage +1',exact:true}).focus();await page.keyboard.press('Enter');
   const choices=page.getByRole('dialog',{name:'CONSTELLATIONS',exact:true});
   if((i+1)%3===0)await choices.waitFor();
   if(await choices.count()){await choices.getByRole('button').first().click();}
  }
  if(!/STAGE\s+10/.test(await hud.innerText()))throw new Error('Stage does not follow boss progression');
  await page.getByRole('button',{name:'RULES',exact:true}).click();
  await page.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
  const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1}),phone=await mobile.newPage();
  phone.on('pageerror',error=>errors.push(error.message));
  await phone.goto('http://127.0.0.1:3000/ruby-star/endless',{waitUntil:'networkidle',timeout:45000});
  await phone.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
  if(!await phone.getByRole('button',{name:'LASER',exact:true}).isVisible())throw new Error('Mobile laser control is hidden');
  await phone.getByRole('button',{name:'HEAL',exact:true}).tap();
  if(await phone.getByText('TELEPORT — SELECT CHAMBER',{exact:true}).count())throw new Error('Mobile heal opened teleport');
  await phone.getByRole('button',{name:'TP',exact:true}).tap();
  await phone.getByText('TELEPORT — SELECT CHAMBER',{exact:true}).waitFor();
  await phone.getByRole('button',{name:'ESC / X — STAY',exact:true}).tap();
  await phone.screenshot({path:path.join(output,'ruby-mobile-final.png')});
  const ended=await desktop.newPage();ended.on('pageerror',error=>errors.push(error.message));
  await ended.goto('http://127.0.0.1:3000/ruby-star/endless?god=1',{waitUntil:'networkidle'});
  await ended.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
  await ended.getByRole('button',{name:'No Mobs',exact:true,pressed:false}).click();
  await ended.locator('.rs-hud').getByText('TIME',{exact:true}).click();
  await ended.keyboard.press('q');await ended.keyboard.press('q');
  const hpBefore=parseFloat(await ended.locator('.rs-hud .battery-fill').first().evaluate(el=>el.style.width));
  await ended.keyboard.press('Space');
  const hpAfter=parseFloat(await ended.locator('.rs-hud .battery-fill').first().evaluate(el=>el.style.width));
  if(hpAfter<=hpBefore||await ended.getByText('TELEPORT — SELECT CHAMBER',{exact:true}).count())throw new Error('Space did not heal on the teleport pad');
  for(let i=0;i<4;i++){
   await ended.getByRole('button',{name:'Grant SIRIUS SURGE',exact:true}).click();
   await ended.locator('.rs-special-slot').click();await ended.keyboard.press('q');await ended.keyboard.press('q');
  }
  await ended.locator('.rs-end-panel h2').waitFor();
  if(await ended.locator('.rs-end-panel h2').innerText()!=='RUBY STAR')throw new Error('Game-over title is incorrect');
  const endText=await ended.locator('.game-over-overlay').innerText();
  if(!/STAGE\s+0/.test(endText)||endText.includes('BOSSES DEFEATED'))throw new Error('Game-over stage is incorrect');
  await ended.screenshot({path:path.join(output,'ruby-game-over-stage.png')});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('HTTP',response.status(),'; desktop boss controls, special activation, rules, mobile controls, and browser errors: passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
