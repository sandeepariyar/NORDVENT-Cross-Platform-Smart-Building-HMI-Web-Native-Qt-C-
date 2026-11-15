const {chromium}=require('playwright-core');
const fs=require('node:fs');
(async()=>{fs.mkdirSync('docs/assets/screens',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:800,height:480},deviceScaleFactor:1});
try{
  const url='http://127.0.0.1:8765/web/';
  const response=await page.goto(url,{waitUntil:'domcontentloaded'});
  if(!response?.ok())throw Error('Could not load original NORDVENT v17 HTML');
  await page.waitForTimeout(900);
  await page.screenshot({path:'docs/assets/screens/v17_reference_home.png'});
  for(const [name,tab] of [['rooms','rooms'],['climate','climate'],['energy','energy']]){
    const link=page.locator('[data-page="'+tab+'"]').first();
    if(await link.count())await link.click({timeout:5000});
    await page.waitForTimeout(420);
    await page.screenshot({path:'docs/assets/screens/v17_reference_'+name+'.png'});
  }
  const home=page.locator('[data-page="home"]').first();
  if(await home.count())await home.click({timeout:5000});
  const bedroom=page.locator('[data-room="bedroom"]').first();
  if(await bedroom.count())await bedroom.click({timeout:5000});
  await page.waitForTimeout(420);
  await page.screenshot({path:'docs/assets/screens/v17_reference_focus_bedroom.png'});
  console.log('Original v17 captured: home, rooms, climate, energy, focused bedroom');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
