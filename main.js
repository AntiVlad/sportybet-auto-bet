const { chromium } = require('playwright');
const fs = require('fs');
const prompts = require('prompts');



(async () => {
  const response = await prompts([
    {
      type: 'text',
      name: 'username',
      message: 'Enter your phone number (70xxxxxxxx)',
      validate: (value) => value.trim() !== '' ? true : 'Phone number is required',
    },
    {
      type: 'password',
      name: 'pswd',
      message: 'Enter your password',
      validate: (value) => value.trim() !== '' ? true : 'Password is required',
    },
    {
      type: 'text',
      name: 'location',
      message: 'Enter your phone chrome install location (default: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe)',
    },
    {
      type: 'text',
      name: 'stake',
      message: 'Enter your stake',
    },
  ]);

  const { username, pswd, location, stake } = response;

  if (!username || !pswd) {
    console.log('You have to enter your details.');
    return;
  }

  const chromeExecutablePath = location || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await chromium.launch({ headless: false, executablePath: chromeExecutablePath });
  const context = await browser.newContext();
  const page = await context.newPage();

  const data = fs.readFileSync('betcodes.txt', 'utf8');
  const values = data.split(',').map((value) => value.trim());

  await page.goto('https://www.sportybet.com');
  await page.waitForSelector('input[name="phone"]');
  await page.type('input[name="phone"]', username);
  await page.type('input[name="psd"]', pswd);
  await page.click('#j_page_header > div.m-top-wrapper > div > div.m-logo-bar > div.m-login-bar > div.m-opt > div.m-psd-wrapper > div.m-psd > button');

  await page.waitForTimeout(3000);

//   await page.waitForSelector('#j_page_header > div.m-top-wrapper > div > div.m-logo-bar > div.m-login-bar > div.m-opt > div.m-psd-wrapper > div.m-psd > button');


  console.log('Logged in');

  main: for (let i = 0; i < values.length; i++) {
    try {
      await Promise.race([
        page.waitForSelector('#esDialog0 > div.es-dialog.m-dialog > div > div > div > div.m-pop-main > div.m-btn-wrapper.m-ok-wrap > button', { timeout: 10000 }),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
      const betCode = values[i];
      const betUrl = `https://www.sportybet.com/?shareCode=${betCode}&c=ng`;
      await page.goto(betUrl);
      await page.click('#j_betslip > div.m-betslips > div.m-list-nav > div > div > div:nth-child(2)'); //Change to multiple
    
    //   await page.click('#j_betslip > div.m-betslips > div.m-list-nav > div > div > div:nth-child(1)');
    //   await page.click('//*[@id="j_stake_0"]/span/input');
    //   await page.keyboard.down('Control');
    //   await page.keyboard.press('A');
    //   await page.keyboard.up('Control');
    //   await page.keyboard.press('Backspace');
    //   await page.type('//*[@id="j_stake_0"]/span/input', stake);
    
    const stakeBox = await page.$('input[placeholder="min. 10"]');
    if(stakeBox){
        await stakeBox.focus();
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace')
        await stakeBox.type(stake);
    }else{
        console.log("stakebox not found")
        await page.click('span[data-cms-key="remove_all"]');
        await page.waitForTimeout(1500);
        await page.click('a[data-ret="1"]');
        await page.waitForTimeout(1000);
        continue main;
        
    }




      await page.waitForTimeout(1000);
      await page.click('button[class="af-button af-button--primary"]');
      await page.waitForTimeout(1000);
      await page.click('button[class="af-button af-button--primary"]');
      const elements = await page.$$('button[class="af-button af-button--primary"]');
      const confirm = elements[1];
      await confirm.click(); //Confirm

      await page.click('button[data-action="close"]');
      console.log(`Staked ${betCode}`);
    } catch (error) {
      console.log(error)
      try{
        console.log(`Something went wrong with ${betCode}. Skipping...`);
        await page.click('span[data-cms-key="remove_all"]');
        await page.waitForTimeout(1500);
        await page.click('a[data-ret="1"]');
        await page.waitForTimeout(1000);
      }catch(e){
        continue
      }
      await page.reload();
      continue;
    }
  }
  console.log("Done")
  await browser.close();
})();
