new Vue({
    el: '#app',
    data: {
        portal: {
            url: ''
        },
        message: '',
        params: {
            query: '',
            sortField: '',
            sortOrder: '',
            num: 10,
            start: 1
        },
        source: null,
        searchInput: '',
        searchTag: '',
        items: [],
        tags: [],
        downloadList: [],
        sortList: [],
        bottomOfPage: false,
        loading: false,
        options: {
            enableSearch: false,
            enableTags: false,
            enableThumbnails: false,
            enableDescription: false,
            enableBackTop: false
        }
    },
    created() {
        console.log('Vue created !');
        this.getConfig();
    },
    mounted() {
        console.log('Vue mounted !');
        this.scroll();
    },
    // When props changes
    watch: {
        source: function (data) {
            this.params = data.queryParams;
        },
        items: function (data) {
            let app = this;

            // Append message text
            // If has results
            if (data.length) {
                // Search input and tags
                if (app.searchInput && app.searchTag) {
                    app.message = `Resultado da pesquisa por "${app.searchInput}" + "${app.searchTag}":`;
                }
                // Search input only
                else if (app.searchInput) {
                    app.message = `Resultado da pesquisa por "${app.searchInput}":`;
                }
                // Tags only
                else if (app.searchTag) {
                    app.message = `Resultado da pesquisa por "${app.searchTag}":`;
                }
                // None of these
                else {
                    app.message = 'Listando dados e informações disponíveis:';
                }
            }
            // No results
            else {
                app.message = 'Nenhum resultado encontrado.'
            }
        }
    },
    methods: {
        // Request config.json file
        getConfig: function () {
            console.log('Reading config file...');

            let app = this;
            app.loading = true;

            fetch('./config.json')
            .then(function(response) {
                return response.json();
            })
            .then(function(json) {
                console.log('Config json', json);

                app.portal.url = json.portalUrl;
            
                // Sorting
                json.sorts.forEach(function (item) {
                    if (item.enabled) {
                        app.sortList.push(item);
                    }
                });

                // Download buttons
                json.downloads.forEach(function (item) {
                    if (item.enabled) {
                        app.downloadList.push(item);
                    }
                });

                // Options
                app.options.enableSearch = json.options.enableSearch;
                app.options.enableTags = json.options.enableTags;
                app.options.enableThumbnails = json.options.enableThumbnails;
                app.options.enableDescription = json.options.enableDescription;
                app.options.enableBackTop = json.options.enableBackTop;

                // Start app
                app.start();
            })
            .catch(app.handleException);
        },
        // Start app
        start: function () {
            console.log('Starting app...');

            let app = this;

            require(['esri/portal/Portal'], function(Portal) {
                const portal = new Portal({
                    authMode: 'anonymous',
                    url: app.portal.url
                });

                portal.load().then(async function() {
                    console.log('ArcGIS Portal:', portal);

                    app.portal = portal;
                    app.params.query = `orgid:${app.portal.id} ((type:"Feature Service"))`;
        
                    // Query items
                    await app.portal.queryItems(app.params).then(app.createGallery);

                    // Query tags
                    app.params.num = 100; // limited to 100
                    await app.portal.queryItems(app.params).then(app.createTags);
                })
                .catch(app.handleException);
            });
        },
        reset: async function () {
            console.log('Reseting app...');

            let app = this;
            app.loading = true;
            app.params.query = `orgid:${app.portal.id} ((type:"Feature Service"))`;
            app.params.sortField = '';
            app.params.sortOrder = '';
            app.params.num = 10;
            app.params.start = 1;
            app.items = [];
            app.tags = [];
            app.searchInput = '';
            app.searchTag = '';

            // Query items
            await app.portal.queryItems(app.params).then(app.createGallery);

            // Query tags
            app.params.num = 100; // limited to 100
            await app.portal.queryItems(app.params).then(app.createTags);
        },
        // Create item gallery from portal request
        createGallery: function (data) {
            console.log('ArcGIS Portal gallery:', data);

            let app = this;

            data.results.forEach(function (item) {
                app.items.push(item);
            });

            // Remove array duplicates by prop
            app.items = [...new Map(app.items.map(item => [item.id, item])).values()];
            app.source = data;
            app.loading = false;
        },
        // Create tags from portal request
        createTags: function (data) {
            console.log('ArcGIS Portal tags:', data);

            let app = this,
                tags = [];

            app.loading = true;

            data.results.forEach(function (item) {
                item.tags.forEach(function (tag) {
                    // Remove spaces in start and end of string (trim)
                    // Transform string to lower case
                    tags.push(tag.trim().toLowerCase());
                });
            });

            // Remove array duplicates
            tags = [...new Set(tags)];
            // Sort array ASC
            tags.sort(function (a, b) {
                return a.localeCompare(b);
            });

            app.tags = tags;
            app.loading = false;
        },
        // Search items by text input
        search: async function (e) {
            e.preventDefault();

            let app = this;
            app.loading = true;
            app.params.start = 1;
            app.params.num = 10;
            app.items = [];

            if (app.searchInput || app.searchTag) {
                app.params.query = `${app.searchInput} ${app.searchTag ? `tags:(${app.searchTag})` : ''} orgid:${app.portal.id} ((type:"Feature Service"))`;
                app.message = `Procurando por "${app.searchInput}"...`;
            }
            else {
                app.params.query = `${app.searchTag ? `tags:(${app.searchTag})` : ''} orgid:${app.portal.id} ((type:"Feature Service"))`;
                app.message = 'Carregando...';
            }

            app.portal.queryItems(app.params).then(app.createGallery);
        },
        // Search items by tags on select or input
        searchByTag: function (e) {
            e.preventDefault();
            
            let app = this;
            app.loading = true;
            app.params.start = 1;
            app.params.num = 10;
            app.items = [];

            const tag = e.target.value;

            if (tag) {
                app.params.query = `${app.searchInput} tags:(${tag}) orgid:${app.portal.id} ((type:"Feature Service"))`;
                app.message = `Procurando por "${tag}"...`;
            }
            else {
                app.params.query = `${app.searchInput} orgid:${app.portal.id} ((type:"Feature Service"))`;
                app.message = 'Carregando...';
            }

            app.portal.queryItems(app.params).then(app.createGallery);
        },
        // Sort items by attr and order
        sortBy: function (e) {
            let app = this;

            const sort = e.target.dataset.sort
                field = e.target.dataset.field;

            app.loading = true;

            // Reset sorting
            if (e.target.classList.contains('active')) {
                sortingBy.innerHTML = '';
                app.params.sortField = '';
                app.params.sortOrder = '';
            }
            else {
                sortingBy.innerHTML = e.target.innerHTML;
                app.params.sortField = field;
                app.params.sortOrder = sort;
            }
            
            app.params.start = 1;
            app.params.num = 10;
            app.items = [];
            app.portal.queryItems(app.params).then(app.createGallery);
        },
        // Infinite scroll
        loadMore: function () {
            let app = this;
            app.params.num = 10;

            console.log(`Adding ${app.params.num} more data results`);

            app.loading = true;
            app.params.start = app.source.queryParams.start + app.params.num;
            app.portal.queryItems(app.params).then(app.createGallery);
        },
        // Convert and download layer data
        download: async function (url, title, format) {
            console.log('Layer url', url);
            console.log('Download format: ' + format);

            let app = this;

            app.loading = true;
            app.message = 'Processando download...';

            const response = await app.queryLayer(url);
            console.log('Layer query results', response);

            if (response.features.length) {
                if (format === 'csv') {
                    app.layer2CSV(response, title);
                }
                else if (format === 'geojson') {
                    app.layer2GeoJSON(response, title);
                }
                else if (format === 'shp') {
                    app.layer2Shapefile(response, title);
                }
                else if (format === 'kml') {
                    app.layer2KML(response, title);
                }
            }
            else {
                app.loading = false;
                app.message = 'Falha no download.';
            }
        },
        // Async query item layer data
        queryLayer: function (layerUrl) {
            let app = this;

            return new Promise(function(resolve, reject) {
                require(['esri/tasks/QueryTask', 'esri/tasks/support/Query'], function(QueryTask, Query) {
                    const layerIndex = parseInt(layerUrl.split('/').pop());

                    const queryTask = new QueryTask({
                        // Check if layer index is not a number
                        url: isNaN(layerIndex) ? layerUrl + '/0' : layerUrl
                    });
                
                    const query = new Query();
                    query.returnGeometry = true;
                    //query.returnCentroid = true; // ! Download bug
                    query.outFields = ['*'];
                    query.where = '1=1';
                    query.outSpatialReference = {'wkid' : 4326};
                
                    queryTask.execute(query).then(function(results) {
                        resolve(results);
                    })
                    .catch(app.handleException);
                });
            });
        },
        // Convert layer features to CSV file (with coordinates)
        layer2CSV: function (data, layerName) {
            let app = this,
                sheetContent = '';

            // Append coordinates fields
            sheetContent += 'latitude' + ',';
            sheetContent += 'longitude' + ',';

            // Header
            data.fields.forEach(function (field) {
                sheetContent += field.alias + ',';
            });

            // Content
            data.features.forEach(function (feature) {
                // New row
                sheetContent += '\r\n';

                const latitude = feature.geometry.extent.center.latitude,
                    longitude = feature.geometry.extent.center.longitude;

                // Append coordinates attrs in cols
                sheetContent += latitude + ',';
                sheetContent += longitude + ',';
                
                // New col
                Object.values(feature.attributes).forEach(function (attr) {
                    sheetContent += attr + ',';
                });
            });

            const blob = new Blob([sheetContent], { type: 'text/csv;charset=utf-8;' }),
            fileName = layerName.replace(/ /g, '_')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            app.createFileLink(blob, fileName, '.csv');
        },
        // Convert layer features to JSON then convert to GeoJSON file
        layer2GeoJSON: async function (data, layerName) {
            const app = this,
            featureCollection = await app.convertFeatures2Json(data.features),
            blob = new Blob([JSON.stringify(featureCollection)], { type: 'application/geo+json;charset=utf-8;' }),
            fileName = layerName.replace(/ /g, '_')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            app.createFileLink(blob, fileName, '.geojson');
        },
        // Convert layer features to JSON then convert to kml file
        layer2KML: async function (data, layerName) {
            const app = this,
            featureCollection = await app.convertFeatures2Json(data.features),
            fileName = layerName.replace(/ /g, '_')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // Uses custom lib: tokml.js
            kml = tokml(featureCollection, {
                documentName: layerName,
                documentDescription: 'Repositório de Dados | SISDIA'
            }),
            blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });

            app.createFileLink(blob, fileName, '.kml');

        },
        // Convert layer features to JSON then convert to Shapefile zip
        layer2Shapefile: async function (data, layerName) {
            const app = this,
            featureCollection = await app.convertFeatures2Json(data.features, true),
            fileName = layerName.replace(/ /g, '_')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            GeoShape.transformAndDownload(featureCollection, fileName);

            app.loading = false;
        },
        convertFeatures2Json: function (features, crs) {
            return new Promise(function(resolve, reject) {
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: features.map(f => Terraformer.ArcGIS.parse(f))
                };

                if (crs) {
                    featureCollection.crs = {
                        type: 'name',
                        properties: {
                            name: 'GEOGCS["GCS_SIRGAS_2000",DATUM["D_SIRGAS_2000",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433],AUTHORITY["EPSG",4674]]',
                        }
                    };
                }

                resolve(featureCollection);
            });
        },
        // Create link for download converted layer data
        createFileLink: function (blob, filename, ext) {
            let app = this;

            // IE 10+
            if (window.navigator && window.navigator.msSaveBlob) {
                window.navigator.msSaveBlob(blob, filename);
            }
            // Browsers that support HTML5 download attribute
            else {
                var a = document.createElement("a");
                a.style = 'display: none';
                document.body.appendChild(a);
                //Create a DOMString representing the blob
                //and point the link element towards it
                var url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = filename + ext;
                a.target = '_self';
                //programatically click the link to trigger the download
                a.click();
                //release the reference to the file by revoking the Object URL
                window.URL.revokeObjectURL(url);

                app.loading = false;
                app.message = 'Listando dados e informações disponíveis:';
            }
        },
        // Scroll action
        scroll: function () {
            const app = this;
            itemsList.addEventListener('scroll', app.infiniteScroll);
        },
        // Infinite scroll
        infiniteScroll: function () {
            const app = this;

            if (app.params.start <= app.source.total &&
                itemsList.scrollTop + itemsList.clientHeight >= itemsList.scrollHeight) {
                app.loadMore();
            }

            // Back to top (in pixels)
            if (itemsList.scrollTop > 20) {
                app.bottomOfPage = true;
            }
            else {
                app.bottomOfPage = false;
            }
        },
        // Back to top button action
        back2Top: function () {
            itemsList.scrollTop = 0;
        },
        // Toggle item description
        expand: function (e) {
            const app = this,
                originalText = e.target.dataset.original,
                expanded = e.target.dataset.expanded;

            if (expanded == 'false') {
                e.target.innerText = originalText;
                e.target.dataset.expanded = true;
                e.target.title = 'Clique para recolher';
            }
            else {
                e.target.innerText = app.limitString(originalText, 300);
                e.target.dataset.expanded = false;
                e.target.title = 'Clique para expandir';
            }
        },
        // Remove HTML tags from string
        stripHtml: function (html) {
            let tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        },
        // Limit string for description
        limitString: function (str, length, ending) {
            if (length == null) {
                length = 100;
            }
            if (ending == null) {
                ending = '...';
            }
            if (str.length > length) {
                return str.substring(0, length - ending.length) + ending;
            } 
            else {
                return str;
            }
        },
        // Error handling
        handleException: function (e) {
            console.error(e);
            this.loading = false;
            this.message = 'Ocorreu um erro!';
        }
    }
});