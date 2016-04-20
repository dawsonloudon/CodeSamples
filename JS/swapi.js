var swapi = {
    current: {
        people: {},
        planets: {},
        films: {},
        species: {},
        vehicles: {},
        starships: {}
    },
    dataTypes: {
        people: {
            birth_year: '',
            eye_color: '',
            films: [],
            gender: '',
            hair_color: '',
            height: '',
            homeworld: '',
            mass: '',
            name: '',
            skin_color: '',
            species: [],
            starships: [],
            url: '',
            vehicles: []
        },
        planets: {
            climate: '',
            diameter: '',
            films: [],
            gravity: '',
            name: '',
            orbital_period: '',
            population: '',
            residents: [],
            rotation_period: '',
            surface_water: '',
            terrain: '',
            url: ''
        },
        films: {
            characters: [],
            director: '',
            episode_id: '',
            opening_crawl: '',
            planets: [],
            producer: '',
            species: [],
            starships: [],
            title: '',
            url: '',
            vehicles: []
        },
        species: {
            average_height: '',
            average_lifespan: '',
            classification: '',
            designation: '',
            eye_colors: '',
            hair_colors: '',
            homeworld: '',
            language: '',
            name: '',
            people: [],
            films: [],
            skin_colors: '',
            url: ''
        },
        vehicles: {
            cargo_capacity: '',
            consumables: '',
            cost_in_credits: '',
            crew: '',
            length: '',
            manufacturer: '',
            max_atmosphering_speed: '',
            model: '',
            name: '',
            passengers: '',
            pilots: [],
            films: [],
            url: '',
            vehicle_class: ''
        },
        starships: {
            MGLT: '',
            cargo_capacity: '',
            consumables: '',
            cost_in_credits: '',
            crew: '',
            hyperdrive_rating: '',
            length: '',
            manufacturer: '',
            max_atmosphering_speed: '',
            model: '',
            name: '',
            passengers: '',
            films: [],
            pilots: [],
            starship_class: '',
            url: ''
        }
    },
    init: function() {
        swapi.ajaxGet(
            'http://swapi.co/api/',
            {},
            function(data) {
                cache.tempData = data;
                appdb.loadDataTypes();
            },
            function() {
                //didn't receive data
            }
        );
    },
    loadDataTypes: function(tx, results) {
        cache.dataTypes = [];
        cache.dataTypeUrls = [];
        cache.dataIndex = 0;
        cache.apiIndex = 1;
        var len = results.rows.length;
        for(var i=0; i< len; i++) {
            cache.dataTypeUrls.push(results.rows.item(i).url);
            cache.dataTypes.push(results.rows.item(i).type);
        }
        swapi.loadDataType();
    },
    loadDataType: function() {
        if(cache.dataIndex < cache.dataTypeUrls.length) {
            cache.tempData = [];
            swapi.ajaxGet(
                cache.dataTypeUrls[cache.dataIndex],
                {},
                swapi.processData
            );
        }
        else {
            dataStore.set('hasData', 'true');
            global.rootScope.$apply(function() {
                global.location.path('/home');
                global.loading.hide();
            });
        }

    },
    processData: function(data) {
        var newWidth = (cache.apiIndex * 2.5) + '%';
        $('#apiprogess').css({width: newWidth});
        cache.apiIndex++;
        cache.tempData = cache.tempData.concat(data.results);
        if(data.next) {
            swapi.ajaxGet(
                data.next,
                {},
                swapi.processData
            );
        }
        else {
            appdb.loadData();
        }
    },
    buildData: {
        dataTypes: function (tx, results) {

        }
    },
    ajaxGet: function(methodName, data, successCallback, errorCallback) {
        $.ajax({
            url: methodName,
            data: data,
            cache: false,
            type: 'GET',
            success: function(result, status, xhr) {
                if ($.isFunction(successCallback)) {
                    successCallback(result);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if ($.isFunction(errorCallback)) {
                    errorCallback();
                }
                else {
                    console.log('call failed');
                }
            }
        });
    }
};