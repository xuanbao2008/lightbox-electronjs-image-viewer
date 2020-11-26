import {
    app, BrowserWindow, Menu, dialog
}
from 'electron';
import windowStateKeeper from './vendor/electron_boilerplate/window_state';
import env from './env';
import fs from 'fs';

var mainWindow;

// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 1000,
    height: 600
});

var ready = false;
var images;
var defaults = {

    mode: 'lg-slide',

    // Ex : 'ease'
    cssEasing: 'ease',

    //'for jquery animation'
    easing: 'linear',
    speed: 600,
    height: '100%',
    width: '100%',
    addClass: '',
    startClass: 'lg-start-zoom',
    backdropDuration: 0,
    hideBarsDelay: 6000,

    useLeft: false,

    closable: false,
    loop: true,
    escKey: false,
    keyPress: true,
    controls: true,
    slideEndAnimatoin: true,
    hideControlOnEnd: false,
    mousewheel: true,

    // .lg-item || '.lg-sub-html'
    appendSubHtmlTo: '.lg-sub-html',

    /**
     * @desc number of preload slides
     * will exicute only after the current slide is fully loaded.
     *
     * @ex you clicked on 4th image and if preload = 1 then 3rd slide and 5th
     * slide will be loaded in the background after the 4th slide is fully loaded..
     * if preload is 2 then 2nd 3rd 5th 6th slides will be preloaded.. ... ...
     *
     */
    preload: 1,
    showAfterLoad: true,
    selector: '',
    selectWithin: '',
    nextHtml: '',
    prevHtml: '',

    // 0, 1
    index: false,

    iframeMaxWidth: '100%',

    download: false,
    counter: true,
    appendCounterTo: '.lg-toolbar',

    swipeThreshold: 50,
    enableSwipe: true,
    enableDrag: true,

    dynamic: true,
    dynamicEl: [],
    galleryId: 1,
    scale: 1,
    zoom: true,
    enableZoomAfter: 300,
    autoplay: false,
    pause: 5000,
    progressBar: true,
    fourceAutoplay: false,
    autoplayControls: true,
    appendAutoplayControlsTo: '.lg-toolbar',
    pager: false,
    thumbnail: true,

    animateThumb: true,
    currentPagerPosition: 'middle',

    thumbWidth: 100,
    thumbContHeight: 100,
    thumbMargin: 5,

    exThumbImage: false,
    showThumbByDefault: true,
    toogleThumb: true,
    pullCaptionUp: true,

    enableThumbDrag: true,
    enableThumbSwipe: true,
    swipeThreshold: 50,

    loadYoutubeThumbnail: true,
    youtubeThumbSize: 1,

    loadVimeoThumbnail: true,
    vimeoThumbSize: 'thumbnail_small',

    loadDailymotionThumbnail: true
};

// Update lightgallery conifg files
var updateConfig = function(key, val) {
    fs.readFile(app.getPath('userData') + '/lg-config.json', function(err, data) {
        if (err) throw err;
        defaults = JSON.parse(data);
        defaults[key] = val;
        fs.writeFile(app.getPath('userData') + '/lg-config.json', JSON.stringify(defaults), function(err) {
            if (err) throw err;
            mainWindow.webContents.send('refresh');
        });
    });
};

var setDevMenu = function() {
    var devMenu = Menu.buildFromTemplate([{
        label: 'Window',
        submenu: [{
            label: 'Toggle Full Screen',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
            click(item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                }
            }
        }, {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        }, {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click: function() {
                app.quit();
            }
        }]
    }, {
        label: 'File',
        submenu: [{
            label: 'Open',
            click: function() {
                dialog.showOpenDialog({
                    properties: ['openFile', 'multiSelections'],
                    filters: [{
                        name: 'Images',
                        extensions: ['jpg', 'png', 'gif', 'webp']
                    }]
                }, function(files) {
                    mainWindow.webContents.send('openedFiles', files);
                });
            }
        }, {
            label: 'Open directory',
            click: function() {
                dialog.showOpenDialog({
                    properties: ['openDirectory'],
                    filters: [{
                        name: 'Images',
                        extensions: ['jpg', 'png', 'gif', 'webp']
                    }]
                }, function(directory) {
                    mainWindow.webContents.send('openDirectory', directory);
                });
            }
        }]
    }, {
        label: 'Thumbnail',
        submenu: [{
            label: 'thumbnail',
            type: 'checkbox',
            checked: defaults.thumbnail,
            click: function(menuItem) {
                updateConfig('thumbnail', menuItem.checked);
            }
        }, {
            label: 'animateThumb',
            type: 'checkbox',
            checked: defaults.animateThumb,
            click: function(menuItem) {
                updateConfig('animateThumb', menuItem.checked);
            }
        }, {
            label: 'Current Pager Position',
            submenu: [{
                label: 'left',
                type: 'radio',
                checked: defaults.currentPagerPosition == 'left',
                click: function() {
                    updateConfig('currentPagerPosition', 'left');
                }
            }, {
                label: 'middle',
                type: 'radio',
                checked: defaults.currentPagerPosition == 'middle',
                click: function() {
                    updateConfig('currentPagerPosition', 'middle');
                }
            }, {
                label: 'right',
                type: 'radio',
                checked: defaults.currentPagerPosition == 'right',
                click: function() {
                    updateConfig('currentPagerPosition', 'right');
                }
            }]
        }, {
            label: 'toogleThumb',
            type: 'checkbox',
            checked: defaults.toogleThumb,
            click: function(menuItem) {
                updateConfig('toogleThumb', menuItem.checked);
            }
        }, {
            label: 'enableThumbDrag',
            type: 'checkbox',
            checked: defaults.enableThumbDrag,
            click: function(menuItem) {
                updateConfig('enableThumbDrag', menuItem.checked);
            }
        }, {
            label: 'Thumb width',
            submenu: [{
                label: '25 px',
                type: 'radio',
                checked: defaults.thumbWidth == 25,
                click: function() {
                    updateConfig('thumbWidth', 25);
                }
            }, {
                label: '50 px',
                type: 'radio',
                checked: defaults.thumbWidth == 50,
                click: function() {
                    updateConfig('thumbWidth', 50);
                }
            }, {
                label: '75 px',
                type: 'radio',
                checked: defaults.thumbWidth == 75,
                click: function() {
                    updateConfig('thumbWidth', 75);
                }
            }, {
                label: '100 px',
                type: 'radio',
                checked: defaults.thumbWidth == 100,
                click: function() {
                    updateConfig('thumbWidth', 100);
                }
            }, {
                label: '125 px',
                type: 'radio',
                checked: defaults.thumbWidth == 125,
                click: function() {
                    updateConfig('thumbWidth', 125);
                }
            }, {
                label: '150 px',
                type: 'radio',
                checked: defaults.thumbWidth == 150,
                click: function() {
                    updateConfig('thumbWidth', 150);
                }
            }, {
                label: '175 px',
                type: 'radio',
                checked: defaults.thumbWidth == 175,
                click: function() {
                    updateConfig('thumbWidth', 175);
                }
            }, {
                label: '200 px',
                type: 'radio',
                checked: defaults.thumbWidth == 200,
                click: function() {
                    updateConfig('thumbWidth', 200);
                }
            }, {
                label: '225 px',
                type: 'radio',
                checked: defaults.thumbWidth == 225,
                click: function() {
                    updateConfig('thumbWidth', 225);
                }
            }, {
                label: '250 px',
                type: 'radio',
                checked: defaults.thumbWidth == 250,
                click: function() {
                    updateConfig('thumbWidth', 250);
                }
            }, {
                label: '275 px',
                type: 'radio',
                checked: defaults.thumbWidth == 275,
                click: function() {
                    updateConfig('thumbWidth', 275);
                }
            }, {
                label: '300 px',
                type: 'radio',
                checked: defaults.thumbWidth == 300,
                click: function() {
                    updateConfig('thumbWidth', 300);
                }
            }]
        }, {
            label: 'Thumb container height',
            submenu: [{
                label: '25 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 25,
                click: function() {
                    updateConfig('thumbContHeight', 25);
                }
            }, {
                label: '50 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 50,
                click: function() {
                    updateConfig('thumbContHeight', 50);
                }
            }, {
                label: '75 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 75,
                click: function() {
                    updateConfig('thumbContHeight', 75);
                }
            }, {
                label: '100 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 100,
                click: function() {
                    updateConfig('thumbContHeight', 100);
                }
            }, {
                label: '125 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 125,
                click: function() {
                    updateConfig('thumbContHeight', 125);
                }
            }, {
                label: '150 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 150,
                click: function() {
                    updateConfig('thumbContHeight', 150);
                }
            }, {
                label: '175 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 175,
                click: function() {
                    updateConfig('thumbContHeight', 175);
                }
            }, {
                label: '200 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 200,
                click: function() {
                    updateConfig('thumbContHeight', 200);
                }
            }, {
                label: '225 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 225,
                click: function() {
                    updateConfig('thumbContHeight', 225);
                }
            }, {
                label: '250 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 250,
                click: function() {
                    updateConfig('thumbContHeight', 250);
                }
            }, {
                label: '275 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 275,
                click: function() {
                    updateConfig('thumbContHeight', 275);
                }
            }, {
                label: '300 px',
                type: 'radio',
                checked: defaults.thumbContHeight == 300,
                click: function() {
                    updateConfig('thumbContHeight', 300);
                }
            }]
        }, {
            label: 'Thumb Margin',
            submenu: [{
                label: '2 px',
                type: 'radio',
                checked: defaults.thumbMargin == 2,
                click: function() {
                    updateConfig('thumbMargin', 2);
                }
            }, {
                label: '3 px',
                type: 'radio',
                checked: defaults.thumbMargin == 3,
                click: function() {
                    updateConfig('thumbMargin', 3);
                }
            }, {
                label: '5 px',
                type: 'radio',
                checked: defaults.thumbMargin == 5,
                click: function() {
                    updateConfig('thumbMargin', 5);
                }
            }, {
                label: '8 px',
                type: 'radio',
                checked: defaults.thumbMargin == 8,
                click: function() {
                    updateConfig('thumbMargin', 8);
                }
            }, {
                label: '10 px',
                type: 'radio',
                checked: defaults.thumbMargin == 10,
                click: function() {
                    updateConfig('thumbMargin', 10);
                }
            }, {
                label: '12 px',
                type: 'radio',
                checked: defaults.thumbMargin == 12,
                click: function() {
                    updateConfig('thumbMargin', 12);
                }
            }, {
                label: '15 px',
                type: 'radio',
                checked: defaults.thumbMargin == 15,
                click: function() {
                    updateConfig('thumbMargin', 15);
                }
            }, {
                label: '20 px',
                type: 'radio',
                checked: defaults.thumbMargin == 20,
                click: function() {
                    updateConfig('thumbMargin', 20);
                }
            }, {
                label: '25 px',
                type: 'radio',
                checked: defaults.thumbMargin == 25,
                click: function() {
                    updateConfig('thumbMargin', 25);
                }
            }, {
                label: '30 px',
                type: 'radio',
                checked: defaults.thumbMargin == 30,
                click: function() {
                    updateConfig('thumbMargin', 30);
                }
            }, {
                label: '50 px',
                type: 'radio',
                checked: defaults.thumbMargin == 50,
                click: function() {
                    updateConfig('thumbMargin', 50);
                }
            }, {
                label: '100 px',
                type: 'radio',
                checked: defaults.thumbMargin == 100,
                click: function() {
                    updateConfig('thumbMargin', 100);
                }
            }]
        }]
    }, {
        label: 'Help',
        submenu: [{
            label: 'Developement',
            submenu: [{
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function() {
                    BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
                }
            }, {
                label: 'Toggle DevTools',
                accelerator: 'Alt+CmdOrCtrl+I',
                click: function() {
                    BrowserWindow.getFocusedWindow().toggleDevTools();
                }
            }]
        }]
    }]);
    Menu.setApplicationMenu(devMenu);
};

app.on('ready', function() {

    ready = true;
    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height
    });

    if (mainWindowState.isMaximized) {
        mainWindow.maximize();
    }

    if (env.name === 'test') {
        mainWindow.loadURL('file://' + __dirname + '/spec.html');
    } else {
        mainWindow.loadURL('file://' + __dirname + '/app.html');
    }

    fs.readFile(app.getPath('userData') + '/lg-config.json', function(err, data) {
        if (err) {
            fs.writeFile(app.getPath('userData') + '/lg-config.json', JSON.stringify(defaults), function(err) {
                if (err) throw err;
            });
        } else {
            defaults = JSON.parse(data);
        }

        setDevMenu();

        //mainWindow.openDevTools();
    });

    mainWindow.on('close', function() {
        mainWindowState.saveState(mainWindow);
    });

    mainWindow.webContents.on('dom-ready', function() {
        if (env.name !== 'production') {
            if (!images) {
                mainWindow.webContents.send('opened', app.getAppPath());
            };
        } else {
            if (images) {
                mainWindow.webContents.send('opened', images);
            };
        }
    });
});

app.on('window-all-closed', function() {
    app.quit();
});

app.on('activate', () => {
    if (!mainWindow) {
        mainWindow = createMainWindow();
    }
});

app.on('open-file', (event, path) => {
    event.preventDefault();

    //win.send('opened', path)
    if (ready) {
        win.webContents.send('opened', path);
        return;
    };

    images = path;
    console.log(path);
});
app.on('open-url', (event, path) => {
    event.preventDefault();

    //win.send('opened', path)
    if (ready) {
        win.webContents.send('opened', path);
        return;
    };

    images = arg;
});
