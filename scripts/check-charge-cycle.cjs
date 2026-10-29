const path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3000/ruby-star/endless?god=1',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Close rules',exact:true}).click({timeout:1500}).catch(()=>{});
  await page.getByRole('button',{name:'No Mobs',exact:true,pressed:false}).click();
  await page.getByRole('button',{name:'No Boss',exact:true,pressed:false}).click();
  const canvas=page.locator('.rs-god-panel').locator('..').locator(':scope > canvas'),box=await canvas.boundingBox();
  async function bodyWidth(){return canvas.evaluate(el=>{
   const ctx=el.getContext('2d'),x=Math.floor(el.width/2)-30,y=Math.floor(el.height/2)-30,data=ctx.getImageData(x,y,60,60).data;let left=60,right=-1;
   for(let row=0;row<60;row++)for(let col=0;col<60;col++){const i=(row*60+col)*4;if(Math.abs(data[i]-216)<=8&&Math.abs(data[i+1]-216)<=8&&Math.abs(data[i+2]-112)<=8){left=Math.min(left,col);right=Math.max(right,col);}}
   return right>=left?right-left+1:0;
  });}
  const resting=await bodyWidth();assert.ok(resting>=30,'Resting player baseline was too small: '+resting);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.waitForTimeout(600);const first=await bodyWidth();
  await page.screenshot({path:path.join(process.argv[2]||'.','charge-first-cycle.png')});
  await page.waitForTimeout(1900);const repeated=[];
  for(let sample=0;sample<20;sample++){
   await page.waitForTimeout(80);const width=await bodyWidth();repeated.push(width);
   if(width>0&&width<25)await page.screenshot({path:path.join(process.argv[2]||'.','charge-repeated-cycle.png')});
  }
  await page.mouse.up();assert.ok(first>0&&first<30,'First charge did not shrink: '+first);
  const shrinking=repeated.filter(width=>width>0&&width<30);
  assert.ok(shrinking.length>=3&&new Set(shrinking).size>=2,'Repeated charge did not visibly progress: '+JSON.stringify(repeated));
  assert.deepEqual(errors,[]);console.log('Repeated charge visibly shrinks across multiple frames:',JSON.stringify(repeated));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
