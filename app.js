new Vue({
    el: '#app',
    data: {
        message: '',
        loading: false,
        portal: {
            url: 'https://sisdia.df.gov.br/portal'
        },
        params: {
            query: '',
            sortField: '',
            sortOrder: '',
            num: 10,
            start: 1
        },
        searchInput: '',
        searchTag: '',
        bottomOfPage: false,
        source: null,
        items: [],
        tags: [],
        sortList: [
            {
                value: 'asc',
                name: 'ordem alfabética',
                field: 'title',
                icon: {
                    class: 'bi bi-sort-alpha-down',
                    paths: [
                        {
                            fill_rule: 'evenodd',
                            d: 'M10.082 5.629L9.664 7H8.598l1.789-5.332h1.234L13.402 7h-1.12l-.419-1.371h-1.781zm1.57-.785L11 2.687h-.047l-.652 2.157h1.351z'
                        },
                        {
                            fill_rule: '',
                            d: 'M12.96 14H9.028v-.691l2.579-3.72v-.054H9.098v-.867h3.785v.691l-2.567 3.72v.054h2.645V14zM4.5 2.5a.5.5 0 0 0-1 0v9.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L4.5 12.293V2.5z'
                        }
                    ]
                }
            },
            {
                value: 'desc',
                field: 'title',
                name: 'ordem alfabética',
                icon: {
                    class: 'bi bi-sort-alpha-down-alt',
                    paths: [
                        {
                            fill_rule: '',
                            d: 'M12.96 7H9.028v-.691l2.579-3.72v-.054H9.098v-.867h3.785v.691l-2.567 3.72v.054h2.645V7z'
                        },
                        {
                            fill_rule: 'evenodd',
                            d: 'M10.082 12.629L9.664 14H8.598l1.789-5.332h1.234L13.402 14h-1.12l-.419-1.371h-1.781zm1.57-.785L11 9.688h-.047l-.652 2.156h1.351z'
                        },
                        {
                            fill_rule: '',
                            d: 'M4.5 2.5a.5.5 0 0 0-1 0v9.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L4.5 12.293V2.5z'
                        }
                    ]
                }
            },
            {
                value: 'desc',
                field: 'modified',
                name: 'data de modificação',
                icon: {
                    class: 'bi bi-sort-down',
                    paths: [
                        {
                            fill_rule: '',
                            d: 'M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z'
                        },
                    ]
                }
            },
            {
                value: 'asc',
                field: 'modified',
                name: 'data de modificação',
                icon: {
                    class: 'bi bi-sort-up',
                    paths: [
                        {
                            fill_rule: '',
                            d: 'M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z'
                        },
                    ]
                }
            },
        ]
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

            if (data.length) {
                if (app.searchInput || app.searchTag) {
                    app.message = `Resultado da pesquisa por "${app.searchInput ? app.searchInput : app.searchTag}".`;
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

                portal.load().then(async function() {
                    console.log('ArcGIS Portal:', portal);

                    app.portal = portal;
                    app.params.query = `orgid:${app.portal.id} ((type:"Feature Service"))`;
        
                    await portal.queryItems(app.params).then(app.createGallery);

                    app.params.num = app.source.total;

                    await portal.queryItems(app.params).then(app.createTags);

                    app.params.num = 10;
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

            if (app.searchInput || app.searchTag) {
                app.params.query = `${app.searchInput} ${app.searchTag ? `tags:(${app.searchTag}* OR ${app.searchTag})` : ''} orgid:${app.portal.id} ((type:"Feature Service"))`;
                app.message = `Procurando por "${app.searchInput}".`;
            }
            else {
                app.params.query = `${app.searchTag ? `tags:(${app.searchTag}* OR ${app.searchTag})` : ''} orgid:${app.portal.id} ((type:"Feature Service"))`;
                app.message = 'Carregando';
            }

            app.portal.queryItems(app.params).then(app.createGallery);
        },
        searchByTag(e) {
            let app = this;
            app.loading = true;
            app.params.start = 1;
            app.items = [];

            const tag = e.target.value;

            if (tag) {
                app.params.query = `${app.searchInput} tags:(${tag}* OR ${tag}) orgid:${app.portal.id} ((type:"Feature Service"))`;
                app.message = `Procurando por "${tag}".`;
            }
            else {
                app.params.query = `${app.searchInput} orgid:${app.portal.id} ((type:"Feature Service"))`;
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
        createTags: function (data) {
            console.log('ArcGIS Portal tags:', data);

            let app = this,
                tags = [];

            data.results.forEach(function (item) {
                item.tags.forEach(function (tag) {
                    tags.push(tag);
                });
            });

            app.tags = [...new Set(tags)];
        },
        sortBy: function (e) {
            const sort = e.target.dataset.sort
                field = e.target.dataset.field;

            this.loading = true;

            // Reset sorting
            if (e.target.classList.contains('active')) {
                sortingBy.innerHTML = '';
                this.params.sortField = '';
                this.params.sortOrder = '';
            }
            else {
                sortingBy.innerHTML = e.target.innerHTML;
                this.params.sortField = field;
                this.params.sortOrder = sort;
            }
            
            this.params.start = 1;
            this.items = [];
            this.portal.queryItems(this.params).then(this.createGallery);
        },
        loadMore: function () {
            let app = this;

            console.log(`Adding ${app.params.num} more data results`);

            app.loading = true;
            app.params.start = app.source.queryParams.start + app.params.num;
            app.portal.queryItems(app.params).then(app.createGallery);
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
        scroll: function () {
            const app = this;

            window.onscroll = () => {
                let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight === document.documentElement.offsetHeight;

                if (app.params.start <= app.source.total && bottomOfWindow) {
                    app.loadMore();
                }

                // Back to top (in pixels)
                if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                    app.bottomOfPage = true;
                }
                else {
                    app.bottomOfPage = false;
                }
            };
        },
        back2Top: function () {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
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