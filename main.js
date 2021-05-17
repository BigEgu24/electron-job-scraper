const { BrowserWindow, app, ipcMain, Notification } = require('electron');
const path = require('path');
const url = require('url');
const {Builder, By, Key, until, assert} = require('selenium-webdriver');
const { setTimeout } = require('timers');

let win = null;
let childWindow = null;

app.on('ready', function () {
  win = new BrowserWindow({
    frame: false,
    fullscreen: false,
    backgroundColor: "white",
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.maximize()

  win.loadURL('http://localhost:3000/');
  win.webContents.openDevTools();
});

ipcMain.on('child', async(event, role) => {
    const driver = new Builder()
    .usingServer('http://localhost:9515')
    .withCapabilities({
        'goog:chromeOptions': {
            // Here is the path to your Electron binary.
            binary: './release-builds/electron-job-scraper-darwin-x64/electron-job-scraper.app/Contents/MacOS/electron-job-scraper'
        }
    })
    .forBrowser('chrome') // note: use .forBrowser('electron') for selenium-webdriver <= 3.6.0
    .build()
    async function clear(drv, web_elt) {
      await drv.executeScript(elt => elt.select(), web_elt);
      await web_elt.sendKeys(Key.BACK_SPACE);
    }
    function sleep(milliseconds) {
      const date = Date.now();
      let currentDate = null;
      do {
        currentDate = Date.now();
      } while (currentDate - date < milliseconds);
    }
    const scrollDownPage = async() =>{
      await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)")
      sleep(10000);
      await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)")
      sleep(10000);
    }
    
    try {
      await driver.get("https://linkedin.com/jobs");
      await driver.findElement(By.name('keywords')).sendKeys(role, Key.RETURN);
      await driver.wait(until.elementLocated(By.name('location')));
      await clear(driver, driver.findElement({name: 'location'}));
      await driver.findElement(By.name('location')).sendKeys('United States', Key.RETURN)
      await scrollDownPage()
      // Scroll down to bottom.
      let jobs = []; 
      let roles = await driver.wait(until.elementsLocated(By.className('base-search-card__title')));
      let companies = await driver.wait(until.elementsLocated(By.className('job-search-card__subtitle')));
      let cities = await driver.wait(until.elementsLocated(By.className('job-search-card__location')));
      let links = await driver.wait(until.elementsLocated(By.className('base-card__full-link')));

      for(let e of roles) {
        var obj = {};
        obj["role"] = await e.getText();
        jobs.push(obj);
        // console.log(await e.getText())
      }
      for(const [index, value] of companies.entries()) {
        jobs[index]["company"] = await value.getText()
      }
      for(const [index, value] of companies.entries()) {
        jobs[index]["origin"] = "Linkedin"
      }
      for(const [index, value] of cities.entries()) {
        jobs[index]["city"] = await value.getText()
      }
      for(const [index, value] of links.entries()) {
        jobs[index]["link"] = await value.getAttribute("href")
      }
      
      // // Return json array to react.
      event.sender.send("child", jobs);
      driver.quit()
    } catch (error) {
      console.log(error)
      driver.quit()
    }

})
ipcMain.on('notify', (_, message) => {
  new Notification({title: 'Notifiation', body: message}).show();
})
