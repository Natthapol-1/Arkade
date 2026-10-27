const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,options]of [['desktop',{viewport:{width:1280,height:800}}],['mobile',{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]]){
   const context=await browser.newContext(options),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:3000/ruby-star?god=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Close rules',exact:true}).click();
   await page.evaluate(()=>{
    window.__eventState=()=>{const canvas=document.querySelector('canvas');let fiber=canvas[Object.keys(canvas).find(key=>key.startsWith('__reactFiber'))];
     for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next){const state=hook.memoizedState?.current;if(state?.gamePhase&&state?.map)return state;}throw Error('Missing game state');};
    const s=window.__eventState();s.noMobs=s.noBossSpawns=s.godMode=true;s.meteoriteTimer=100000;
   });
   assert.equal(await page.getByRole('button',{name:'Enter Ascension · Boss 10',exact:true}).count(),0);
   assert.equal(await page.locator('.rs-event-controls button').count(),3);
   const immortal=page.getByRole('button',{name:'Immortal',exact:true,pressed:true}),energy=page.getByRole('button',{name:'Full Energy',exact:true});
   const a=await immortal.boundingBox(),b=await energy.boundingBox();assert.ok(Math.abs(a.y-b.y)<2&&a.x+a.width<=b.x);
   for(const kind of ['blackhole','shootingStar','eclipse']){
    const label={blackhole:'BLACK HOLE',shootingStar:'SHOOTING STAR',eclipse:'ECLIPSE'}[kind];
    await page.getByRole('button',{name:'Create '+label,exact:true}).click();
    await page.waitForFunction(kind=>window.__eventState().ambientEvents.warning?.kind===kind,kind);
    assert.ok(await page.locator('.rs-event-banner').isVisible());assert.equal(await page.locator('.rs-event-banner span').count(),0);assert.ok(await page.getByRole('button',{name:'Create '+label,exact:true}).isDisabled());
    await page.screenshot({path:path.join(process.argv[2]||'docs/ruby-star/visual-reference',`event-${kind}-${name}-warning.png`)});
    // Pause via the real rules control and verify the warning countdown is frozen.
    await page.getByRole('button',{name:'RULES',exact:true}).click();const before=await page.evaluate(()=>window.__eventState().ambientEvents.warning.ticks);
    await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>window.__eventState().ambientEvents.warning.ticks),before);
    await page.getByRole('button',{name:'Close rules',exact:true}).click();
    await page.evaluate(()=>{window.__eventState().ambientEvents.warning.ticks=1;});
    await page.waitForFunction(kind=>window.__eventState().ambientEvents.active?.kind===kind,kind);
    await page.evaluate(()=>{
     const s=window.__eventState(),event=s.ambientEvents.active;let x=19,y=19;
     if(event.kind==='shootingStar'){
      const p=event.points[0];outer:for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(Math.abs(dx)+Math.abs(dy)>=3&&s.map[p.y+dy]?.[p.x+dx]===1){x=p.x+dx;y=p.y+dy;break outer;}
     }
     s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*48;s.playerY=(y+.5)*48;s.playerStepProgress=0;
     event.age=event.kind==='shootingStar'?60:90;event.ticks=event.maxTicks-event.age;
    });
    if(kind==='shootingStar'){
     await page.evaluate(()=>{window.__eventState().ambientEvents.active.age=12;});await page.waitForTimeout(40);
     await page.screenshot({path:path.join(process.argv[2]||'docs/ruby-star/visual-reference',`event-shootingStar-${name}-falling.png`)});
     await page.evaluate(()=>{window.__eventState().ambientEvents.active.age=40;});
    }
    await page.waitForTimeout(140);
    await page.screenshot({path:path.join(process.argv[2]||'docs/ruby-star/visual-reference',`event-${kind}-${name}-active.png`)});
    if(kind==='shootingStar'){
     await page.evaluate(()=>{const s=window.__eventState(),p=s.ambientEvents.active.points[0];s.playerTileX=s.playerTargetX=p.x;s.playerTileY=s.playerTargetY=p.y;s.playerX=(p.x+.5)*48;s.playerY=(p.y+.5)*48;s.playerHP=30;s.rubyHP=30;s.starEnergy=0;});
     await page.waitForFunction(()=>window.__eventState().ambientEvents.rewardTicks>0);
     assert.equal(await page.evaluate(()=>window.__eventState().starEnergy),100);
    }
    await page.getByRole('button',{name:'Reset game',exact:true}).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.__eventState().ambientEvents.active===null&&window.__eventState().ambientEvents.warning===null);
    await page.evaluate(()=>{const s=window.__eventState();s.meteoriteTimer=100000;});
   }
   // Teleport destinations follow the actual chamber layout and have no extra status caption.
   await page.evaluate(()=>{const s=window.__eventState();s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*48;s.playerChamber=0;s.playerStepProgress=0;document.activeElement?.blur();});
   await page.keyboard.press('x');await page.locator('.rs-teleport-grid').waitFor();
   const destinations=page.locator('.rs-teleport-grid button'),boxes=[];
   for(let i=0;i<4;i++)boxes.push(await destinations.nth(i).boundingBox());
   assert.equal(boxes[0].y,boxes[1].y);assert.equal(boxes[2].y,boxes[3].y);assert.ok(boxes[2].y>boxes[0].y);
   assert.equal(boxes[0].x,boxes[2].x);assert.equal(boxes[1].x,boxes[3].x);assert.equal(await page.getByText('YOU ARE HERE',{exact:true}).count(),0);
   await page.screenshot({path:path.join(process.argv[2]||'docs/ruby-star/visual-reference',`teleport-grid-${name}.png`)});
   await destinations.nth(1).click();
   assert.equal(await page.evaluate(()=>window.__eventState().playerChamber),1);
   // Trigger an actual meteor strike, then inspect early, middle and late impact frames.
   await page.evaluate(()=>{const s=window.__eventState();s.meteoriteWarning=1;s.meteoriteStrikeIn=1;});
   await page.waitForFunction(()=>!!window.__eventState().meteoriteImpact);
   for(const [label,ticks]of [['early',52],['middle',30],['late',8]]){
    await page.evaluate(ticks=>{window.__eventState().meteoriteImpact={chamber:1,ticks};},ticks);await page.waitForTimeout(30);
    await page.screenshot({path:path.join(process.argv[2]||'docs/ruby-star/visual-reference',`meteor-impact-${name}-${label}.png`)});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Events: all three God triggers, warnings, rules pause, active visuals, shard collection, reset, grouped Immortal/Energy, desktop/mobile and browser errors passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
