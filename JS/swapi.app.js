var global = {
    db: null,
    rootScope: null,
    location: null,
    loading: null
};

var cache = {
    tempData: [],
    tempIndex: '',
    dataTypes: [],
    dataTypeUrls: [],
    current: {
        selectedUrl: null,
        dataType: '',
        dataItem: null
    },
    viewed: {}
};

var dataStore = {
    initialize: function() {
        global.store = window.localStorage;
    },
    set: function(key,value) {
        global.store.setItem(key,value);
    },
    get: function(key) {
        return global.store.getItem(key);
    },
    remove: function(key) {
        global.store.removeItem(key);
    },
    reset: function() {
        global.store.clear();
    }
};

var appdb = {
    initialize: function() {
        global.db = window.openDatabase('swapidb', '1.0', 'swapidb', 5000000);
        global.db.transaction(appdb.createDB, appdb.errorCB, appdb.successCB);
    },
    createDB: function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS swapiDataTypes (url unique, type)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS swapiData (url unique, name, type, UNIQUE (url, type) ON CONFLICT REPLACE)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS swapiMetaData (dataKey, dataValue, parentUrl, UNIQUE (parentUrl, dataKey) ON CONFLICT REPLACE)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS swapiLinkData (parentUrl, dataUrl, linkType, UNIQUE (parentUrl, dataUrl, linkType) ON CONFLICT IGNORE)');
    },
    loadDataTypes: function() {
        global.db.transaction(
            function(tx) {
                for(var item in cache.tempData) {
                    tx.executeSql('INSERT OR IGNORE INTO swapiDataTypes (url, type) VALUES (?, ?)',[cache.tempData[item], item]);
                }
            },
            appdb.errorCB,
            function() {
                appdb.getDataTypes();
            }
        );
    },
    getDataTypes: function() {
        global.db.transaction(
            function(tx) {
                tx.executeSql('SELECT * FROM swapiDataTypes', [], swapi.loadDataTypes, appdb.errorCB);
            },
            appdb.errorCB
        );
    },
    loadData: function() {
        global.db.transaction(
            function(tx) {
                for(var data in cache.tempData) {
                    if(cache.tempData[data].title) {
                        cache.tempData[data].name = cache.tempData[data].title;
                        delete cache.tempData[data].title;
                    }
                    tx.executeSql('INSERT OR REPLACE INTO swapiData (url, name, type) VALUES (?, ?, ?)',[cache.tempData[data].url, cache.tempData[data].name, cache.dataTypes[cache.dataIndex]]);
                }
            },
            appdb.errorCB,
            appdb.loadMetaData
        );
    },
    loadMetaData: function() {
        global.db.transaction(
            function(tx) {
                for(var data in cache.tempData) {
                    for(var meta in cache.tempData[data]) {
                        if(Array.isArray(cache.tempData[data][meta])) {
                            for(var id in cache.tempData[data][meta]) {
                                tx.executeSql('INSERT OR IGNORE INTO swapiLinkData (parentUrl, dataUrl, linkType) VALUES (?, ?, ?)', [cache.tempData[data].url, cache.tempData[data][meta][id], meta]);
                            }
                        }
                        else if(meta != 'url' && meta != 'name' && meta != 'title') {
                            tx.executeSql('INSERT OR REPLACE INTO swapiMetaData (dataKey, dataValue, parentUrl) VALUES (?, ?, ?)', [meta, cache.tempData[data][meta], cache.tempData[data].url]);
                        }
                    }
                }
            },
            appdb.errorCB,
            function() {
                cache.dataIndex++;
                swapi.loadDataType();
            }
        );
    },
    getData: {
        dataTypes: function(scope) {
            var tempDatas = [];
            global.db.transaction(
                function(tx) {
                    tx.executeSql(
                        'SELECT * FROM swapiDataTypes',
                        [],
                        function(tx, results) {
                            for(var i = 0, len = results.rows.length; i < len; i++) {
                                tempDatas.push({type: results.rows.item(i).type, url: results.rows.item(i).url});
                            }
                            scope.$apply(function() {
                                scope.dataTypes = tempDatas;
                            });
                        },
                        appdb.errorCB
                    );
                },
                appdb.errorCB
            );
        },
        byUrl: function(url,type) {
            if(cache.viewed[url]) {
                return cache.viewed[url];
            }
            else {
                cache.viewed[url] = {};
                for(var key in swapi.dataTypes[type]) {
                    if(Array.isArray(swapi.dataTypes[type][key])) {
                        cache.viewed[url][key] = [];
                    }
                    else {
                        cache.viewed[url][key] = '';
                    }
                }
            }
            var homeWorld = '';
            global.db.transaction(
                function(tx) {
                    tx.executeSql(
                        'SELECT * FROM swapiData WHERE url=?',
                        [url],
                        function(tx, results) {
                            if(results.rows.length == 0) {
                                return;
                            }
                            cache.viewed[url].name = results.rows.item(0).name;
                            cache.viewed[url].url = results.rows.item(0).url;
                        },
                        appdb.errorCB
                    );
                    tx.executeSql(
                        'SELECT * FROM swapiMetaData WHERE parentUrl=?',
                        [url],
                        function(tx, results) {
                            if(results.rows.length == 0) {
                                return;
                            }
                            var len = results.rows.length;
                            for(var i=0; i<len; i++) {
                                cache.viewed[url][results.rows.item(i).dataKey] = results.rows.item(i).dataValue;
                                if(results.rows.item(i).dataKey == 'homeworld') {
                                    homeWorld = results.rows.item(i).dataValue;
                                    tx.executeSql(
                                        'SELECT name, type, url FROM swapiData WHERE url=?',
                                        [homeWorld],
                                        function(tx, results) {
                                            cache.viewed[url].homeworld = [{name: results.rows.item(0).name, url: results.rows.item(0).url, type: results.rows.item(0).type}];
                                        },
                                        appdb.errorCB
                                    );
                                }
                            }
                        },
                        appdb.errorCB
                    );
                    tx.executeSql(
                        'SELECT name, url, linkType, type FROM swapiLinkData, swapiData WHERE swapiLinkData.dataUrl = swapiData.url AND swapiLinkData.parentUrl=?',
                        [url],
                        function(tx, results) {
                            if(results.rows.length == 0) {
                                return;
                            }
                            var len = results.rows.length;
                            for(var i=0; i<len; i++) {
                                cache.viewed[url][results.rows.item(i).linkType].push({name: results.rows.item(i).name, url: results.rows.item(i).url, type: results.rows.item(i).type});
                            }
                        },
                        appdb.errorCB
                    );
                },
                appdb.errorCB
            );
            return cache.viewed[url];
        },
        people: {
            asList: function() {
                var tempData = [];
                global.db.transaction(
                    function(tx) {
                        tx.executeSql(
                            'SELECT * FROM swapiData WHERE type = ?',
                            [cache.current.dataType],
                            function(tx, results) {
                                for(var i = 0, len = results.rows.length; i < len; i++) {
                                    if(results.rows.item(i).title) {
                                        results.rows.item(i).name = results.rows.item(i).title;
                                    }
                                    tempData.push({type: results.rows.item(i).type, url: results.rows.item(i).url, name: results.rows.item(i).name});
                                }
                            },
                            appdb.errorCB
                        );
                    },
                    appdb.errorCB
                );
                return tempData;
            }
        }
    },
    errorCB: function(tx, err) {
        console.log(err);
    },
    successCB: function(msg) {
        if(msg) {
            console.log(msg);
        }
    }
};

var app = angular.module('ionicApp', ['ionic']);

app.$inject = ['$rootScope', '$location', '$ionicLoading', '$ionicConfigProvider', '$timeout'];

app.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.backButton.text('');
    //$urlRouterProvider.otherwise('/home');

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'home.html',
            controller: 'homeCtrl'
        })
        .state('mainlist', {
            url: '/mainlist',
            templateUrl: 'mainlist.html',
            controller: 'mainlistCtrl'
        })
        .state('people', {
            url: '/people/:id',
            templateUrl: 'people.html',
            controller: 'dataCtrl'
        })
        .state('planets', {
            url: '/planets/:id',
            templateUrl: 'planets.html',
            controller: 'dataCtrl'
        })
        .state('films', {
            url: '/films/:id',
            templateUrl: 'films.html',
            controller: 'dataCtrl'
        })
        .state('species', {
            url: '/species/:id',
            templateUrl: 'species.html',
            controller: 'dataCtrl'
        })
        .state('vehicles', {
            url: '/vehicles/:id',
            templateUrl: 'vehicles.html',
            controller: 'dataCtrl'
        })
        .state('starships', {
            url: '/starships/:id',
            templateUrl: 'starships.html',
            controller: 'dataCtrl'
        });
});

app.run(function ($rootScope, $location, $ionicLoading) {
    dataStore.initialize();
    appdb.initialize();
    global.rootScope = $rootScope;
    global.location = $location;
    global.loading = $ionicLoading;

    if(dataStore.get('hasData') != null) {
        $location.path('/home');
    }
    else {
        $ionicLoading.show({
            template: '<div class="swapi-loading icon-loading"></div><br />Loading API Data...<br /><div style="width: 100%;border:1px solid #fff;height:15px;"><div style="width:0%;height:15px;background-color:#fff;" id="apiprogess"></div></div>',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });
        swapi.init();
    }
});

app.controller('homeCtrl', function ($scope, $location) {
    $scope.dataTypes = [];
    appdb.getData.dataTypes($scope);
    $scope.selectDataType = function(type) {
        cache.current.dataType = type;
        $location.path('/mainlist');
    };
});

app.controller('mainlistCtrl', function ($scope, $location) {
    $scope.listItems = [];
    var people = appdb.getData.people.asList();
    $scope.listItems = people;
    $scope.selectItem = function(url,type) {
        console.log(url+' - '+type);
        var temp = url.split('/');
        var id = temp[temp.length - 2];
        cache.current.selectedUrl = url;
        cache.current.dataType = type;
        $location.path('/'+type+'/'+id);
    };
});

app.controller('dataCtrl', function ($scope, $location) {
    $scope.items = [];
    var item = appdb.getData.byUrl(cache.current.selectedUrl,cache.current.dataType);
    $scope.items = item;

    $scope.toggleGroup = function (group) {
        if ($scope.isGroupShown(group)) {
            $scope.shownGroup = null;
        } else {
            $scope.shownGroup = group;
        }
    };

    $scope.isGroupShown = function (group) {
        return $scope.shownGroup === group;
    };

    $scope.selectItem = function(url,type) {
        console.log(url+' - '+type);
        var temp = url.split('/');
        var id = temp[temp.length - 2];
        cache.current.selectedUrl = url;
        cache.current.dataType = type;
        $location.path('/'+type+'/'+id);
    };
});