const { BrowserWindow, app, ipcMain, Notification } = require('electron');
const path = require('path');
const url = require('url');
const {Builder, By, Key, until, assert} = require('selenium-webdriver');

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
    try {
      await driver.get("https://linkedin.com/jobs");
      await driver.findElement(By.name('keywords')).sendKeys(role, Key.RETURN);

      let element = await driver.wait(until.elementLocated(By.className('jobs-search__results-list')));
      let jobs = []; 
      let roles = await driver.wait(until.elementsLocated(By.className('result-card__title')));
      let companies = await driver.wait(until.elementsLocated(By.className('result-card__subtitle-link')));
      let cities = await driver.wait(until.elementsLocated(By.className('job-result-card__location')));
      let links = await driver.wait(until.elementsLocated(By.className('result-card__full-card-link')));

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
        jobs[index]["link"] = await value.getText()
      }
      
      // Return json to react.
      event.sender.send("child", jobs);
      //driver.quit()
    } catch (error) {
      console.log(error)
      driver.quit()
    }

})
ipcMain.on('notify', (_, message) => {
  new Notification({title: 'Notifiation', body: message}).show();
})
