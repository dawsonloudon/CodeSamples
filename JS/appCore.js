/* CORE APPLICATION FUNCTIONS */
var app = {
    tpl: {},
    slider: new PageSlider($('#container')),
    devicePause: function() {
        if(cache.printer.address) {
            app.store.set('printer_name', cache.printer.name);
            app.store.set('printer_address', cache.printer.address);
            zPrinter.closeConnection();
        }
    },
    deviceResume: function() {
        var temp = app.store.get('printer_address');
        if(temp) {
            cache.printer.name = app.store.get('printer_name');
            cache.printer.address = app.store.get('printer_address');
            printer.connectPrinter();
        }
    },
    updateAvailable: function(buttonIndex) {
        if(buttonIndex == 2) {
            window.open(app.store.get('appDownload'),'_system');
        }
    },
    initialConnection: function() {
        var networkState = navigator.connection.type;

        var states = {};
        states[Connection.UNKNOWN]  = false;
        states[Connection.ETHERNET] = true;
        states[Connection.WIFI]     = true;
        states[Connection.CELL_2G]  = true;
        states[Connection.CELL_3G]  = true;
        states[Connection.CELL_4G]  = true;
        states[Connection.CELL]     = true;
        states[Connection.NONE]     = false;
        global.connectionStatus = states[networkState];
        app.connectionStatus(global.connectionStatus);
        if(global.connectionStatus) {
            app.checkUserStatus();
        }
        else{
            app.slider.slidePageFrom(new views.login(app.tpl.login).render().el,'right');
            api.user = null;
            cache.schools = [];
            cache.students = [];
            cache.tracCodes = [];
            cache.schoolActions = [];
            cache.eventCategories = [];
            app.store.remove('user');
            app.store.remove('authString');
            app.hideSplashScreen();
        }
    },
    online: function() {
        global.connectionStatus = true;
        app.connectionStatus(global.connectionStatus);
        if(!global.loadingApp){
            if(global.lostConnection) {
                app.slider.slidePageFrom(new views.tracStudents(app.tpl.tracStudents).render().el,'right');
                global.lostConnection = false;
                app.db.getOfflineTracs();
            }
        }
    },
    offline: function() {
        global.connectionStatus = false;
        app.connectionStatus(global.connectionStatus);
        if(!global.loadingApp){
            global.lostConnection = true;
            app.slider.slidePageFrom(new views.offlineTracStudents(app.tpl.offlineTracStudents).render().el,'right');
        }
    },
    checkUserStatus: function() {
        var user = app.store.get('user');
        var token = app.store.get('authString');
        cache.printer.name = app.store.get('printer_name');
        cache.printer.address = app.store.get('printer_address');
        if(user){
            app.slider.slidePageFrom(new views.loading(app.tpl.loading,'Authenticating...').render().el,'right');
            app.hideSplashScreen();
            api.user = JSON.parse(user);
            if(cache.printer.address){
                printer.connectPrinter();
            }
            api.setupAjaxDefaults(token);
            api.setTracPerms(api.user.PosNegTracCodePermission);
            api.authComplete();
        }
        else{
            app.slider.slidePageFrom(new views.login(app.tpl.login).render().el,'right');
            app.hideSplashScreen();
        }
    },
    hideSplashScreen: function() {
        setTimeout(function() {
            navigator.splashscreen.hide();
        },1000);
    },
    connectionStatus: function(connected) {
        if(connected) {
            cache.connection = 'on';
        }
        else{
            cache.connection = 'off';
        }
    },
    backClick: function() {
        if($('.backbtn').length > 0) {
            $('.backbtn').trigger('click');
        }
        return false;
    }
};