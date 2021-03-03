new Vue({
    el: '#app',
    data: {
        message: 'Carregando',
        loading: false,
        portal: {
            url: 'https://sisdia.df.gov.br/portal'
        },
        params: {
            query: '(SISDIA)',
            //sortField: 'modified',
            sortOrder: 'desc',
            num: 20,
            start: -1
        } ,
        source: null,
        searchInput: '',
        description: ''
    },
    created() {
        console.log('Vue created !');
    },
    mounted: function () {
        console.log('Vue mounted !');

        this.start();
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

            console.log(data);

            app.params = data.nextQueryParams;

            if (data.total) {
                app.message = 'Listando dados e informações disponíveis.';
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
        search: function (event) {
            event.preventDefault();

            let app = this;

            app.loading = true;
            app.params.start = -1;

            if (app.searchInput) {
                app.params.query = '(SISDIA)' + app.searchInput;
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
            app.loading = false;
        },
        download: async function (url, title, format) {
            console.log('Layer url', url);
            console.log('Download format', format);

            let app = this;

            app.loading = true;
            app.message = 'Processando download';

            const returnGeometry = format !== 'csv' ? true : false;
            const response = await app.queryLayer(url, true);
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

            data.fields.forEach(function (field) {
                sheetContent += field.alias + ',';
            });

            data.features.forEach(function (feature) {
                sheetContent += '\r\n';
                
                Object.values(feature.attributes).forEach(function (attr) {
                    sheetContent += attr + ',';
                });
            });

            sheetContent = `data:text/csv;charset=utf-8,%EF%BB%BF ${encodeURIComponent(JSON.stringify(sheetContent))}`;

            app.createFileLink(layerName, sheetContent, '.csv');
        },
        layer2GeoJSON: function (data, layerName) {
            let app = this;
            
            const featureCollection = {
                type: 'FeatureCollection',
                features: data.features.map(f => Terraformer.ArcGIS.parse(f))
            },
            geojsonContent = `data:application/geo+json;charset=utf-8,%EF%BB%BF ${encodeURIComponent(JSON.stringify(featureCollection))}`;

            app.createFileLink(layerName, geojsonContent, '.geojson');
        },
        layer2Shapefile: function (data, layerName) {

        },
        layer2KML: function (data, layerName) {
            let app = this;

            const featureCollection = {
                type: 'FeatureCollection',
                features: data.features.map(f => Terraformer.ArcGIS.parse(f))
            },
            geojsonContent = `data:application/geo+json;charset=utf-8,%EF%BB%BF ${encodeURIComponent(JSON.stringify(featureCollection))}`,
            kml = tokml(geojsonContent);

            app.createFileLink(layerName, kml, '.kml');
        },
        createFileLink: function (name, content, ext) {
            let app = this,
            element = document.createElement('a');
            element.setAttribute('href', content);
            element.setAttribute('download', name + ext);
            element.setAttribute('target', '_self');
            element.style.display = 'none';

            document.body.appendChild(element);
          
            element.click();
          
            document.body.removeChild(element);

            app.loading = false;
            app.message = 'Listando dados e informações disponíveis.';
        },
        queryLayer: function (layerUrl, geom) {
            let app = this;

            return new Promise(function(resolve, reject) {
                require(['esri/tasks/QueryTask', 'esri/tasks/support/Query'], function(QueryTask, Query) {
                    const queryTask = new QueryTask({
                        url: layerUrl + '/0'
                    });
                
                    const query = new Query();
                    query.returnGeometry = geom;
                    query.outFields = ['*'];
                    query.where = '1=1';
                
                    queryTask.execute(query).then(function(results) {
                        resolve(results);
                    })
                    .catch(app.handleException);
                });
            });
        },
        expand: function (e) {
            let app = this,
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