new Vue({
    el: '#app',
    data: {
        message: '',
        loading: false,
        portal: {
            url: 'https://sisdia.df.gov.br/portal'
        },
        params: {
            query: '(SISDIA)',
            //sortField: 'modified',
            sortOrder: 'desc',
            num: 10,
            start: 1
        },
        source: null,
        items: [],
        searchInput: ''
    },
    created() {
        console.log('Vue created !');

        this.start();
    },
    mounted: function () {
        console.log('Vue mounted !');

        this.scroll();
    },
    beforeUpdate() {
        console.log('Vue updating...');
    },
    updated() {
        console.log('Vue updated !');
    },
    watch: {
        source: function (data) {
            let app = this;

            app.params = data.queryParams;
        },
        items: function (data) {
            let app = this;

            app.loading = false;

            if (data.length) {
                if (app.searchInput) {
                    app.message = `Resultado da pesquisa por "${app.searchInput}".`;
                }
                else {
                    app.message = 'Listando dados e informações disponíveis.';
                }
            }
            else {
                app.message = 'Nenhum resultado encontrado.'
            }
        }
    },
    methods: {
        start: function () {
            console.log('Starting...');

            let app = this;

            app.loading = true;

            require(['esri/portal/Portal'], function(Portal) {
                const portal = new Portal({
                    authMode: 'anonymous',
                    url: app.portal.url
                });

                portal.load().then(function() {
                    console.log('ArcGIS Portal:', portal);

                    app.portal = portal;
        
                    portal.queryItems(app.params).then(app.createGallery);
                })
                .catch(app.handleException);
            });
        },
        search: function (e) {
            e.preventDefault();

            let app = this;

            app.loading = true;
            app.params.start = 1;
            app.items = [];

            if (app.searchInput) {
                app.params.query = '(SISDIA) ' + app.searchInput;
                app.message = `Procurando por "${app.searchInput}".`;
            }
            else {
                app.params.query = '(SISDIA)';
                app.message = 'Carregando';
            }

            app.portal.queryItems(app.params).then(app.createGallery);
        },
        createGallery: function (data) {
            console.log('ArcGIS Portal gallery:', data);

            let app = this;

            app.source = data;
            app.source.results.forEach(function (item) {
                app.items.push(item);
            });

            app.loading = false;
        },
        loadMore: function () {
            let app = this;

            console.log(`Adding ${app.params.num} more data results`);

            app.loading = true;
            app.params.start = app.source.queryParams.start + app.params.num;
            app.portal.queryItems(app.params).then(app.createGallery);
        },
        scroll: function () {
            const app = this;

            window.onscroll = () => {
                let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight === document.documentElement.offsetHeight;

                if (app.params.start <= app.source.total && bottomOfWindow) {
                    app.loadMore();
                }
            };
        },
        download: async function (url, title, format) {
            console.log('Layer url', url);
            console.log('Download format', format);

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
        },
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

                const latitude = feature.geometry.centroid.latitude,
                    longitude = feature.geometry.centroid.latitude;

                // Append coordinates attrs in cols
                sheetContent += latitude + ',';
                sheetContent += longitude + ',';
                
                // New col
                Object.values(feature.attributes).forEach(function (attr) {
                    sheetContent += attr + ',';
                });
            });

            const blob = new Blob([sheetContent], { type: 'text/csv;charset=utf-8;' });

            app.createFileLink(blob, layerName, '.csv');
        },
        layer2GeoJSON: function (data, layerName) {
            const app = this,
            featureCollection = {
                type: 'FeatureCollection',
                features: data.features.map(f => Terraformer.ArcGIS.parse(f))
            },
            blob = new Blob([JSON.stringify(featureCollection)], { type: 'application/geo+json;charset=utf-8;' });

            app.createFileLink(blob, layerName, '.geojson');
        },
        layer2Shapefile: function (data, layerName) {
            const app = this,
            featureCollection = {
                type: 'FeatureCollection',
                features: data.features.map(f => Terraformer.ArcGIS.parse(f))
            };
            
            GeoShape.transformAndDownload(featureCollection, layerName + '.zip');

            app.loading = false;
        },
        layer2KML: function (data, layerName) {
            const app = this,
            featureCollection = {
                type: 'FeatureCollection',
                features: data.features.map(f => Terraformer.ArcGIS.parse(f))
            },
            // Uses custom lib: tokml.js
            kml = tokml(featureCollection, {
                documentName: layerName,
                documentDescription: 'Repositório de Dados | SISDIA'
            }),
            blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });

            app.createFileLink(blob, layerName, '.kml');

        },
        createFileLink: function (blob, filename, ext) {
            let app = this;

            // IE 10+
            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(blob, filename);
            }
            // Browsers that support HTML5 download attribute
            else {
                const url = URL.createObjectURL(blob),
                link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', filename + ext);
                link.style.visibility = 'hidden';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                app.loading = false;
                app.message = 'Listando dados e informações disponíveis.';
            }
        },
        queryLayer: function (layerUrl) {
            let app = this;

            return new Promise(function(resolve, reject) {
                require(['esri/tasks/QueryTask', 'esri/tasks/support/Query'], function(QueryTask, Query) {
                    const queryTask = new QueryTask({
                        url: layerUrl + '/0'
                    });
                
                    const query = new Query();
                    query.returnGeometry = true;
                    query.returnCentroid = true;
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
        handleException: function (e) {
            console.error(e);
            this.loading = false;
            this.message = 'Ocorreu um erro.';
        }
    }
});