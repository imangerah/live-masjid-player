const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')
const url = require('url')
const join = require('path').join;

const fs = require('fs')
const openAboutWindow = require('about-window').default;

let win

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1000,
        height: 620,
        icon: __dirname + '/dusk.png'
    })

    var menu = Menu.buildFromTemplate([
        {
            label: 'Info',
            click: function () {
                openAboutWindow({
                    product_name: "Dusk Player",
                    copyright: "By Aveek Saha",
                    icon_path: join(__dirname, 'build/icon.png'),
                })
            }
        }
    ])
    Menu.setApplicationMenu(menu)

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'app/index.html'),
        protocol: 'file:',
        slashes: true
    }))


    // Open the DevTools.
    win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
        win = null
    })
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})