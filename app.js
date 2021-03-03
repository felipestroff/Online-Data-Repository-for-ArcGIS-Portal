new Vue({
    el: '#app',
    data: {
        message: 'Carregando',
        loading: false,
        portal: {
            url: 'https://sisdia.df.gov.br/portal'
        },
        params: {
            query: 'orgid:0123456789ABCDEF -type:"Code Attachment" -type:"Featured Items" -type:"Symbol Set" -type:"Color Set" -type:"Windows Viewer Add In" -type:"Windows Viewer Configuration" -type:"Map Area" -typekeywords:"MapAreaPackage" -owner:"esri_apps" -owner:"esri" -type:"Layer" -type: "Map Document" -type:"Map Package" -type:"Basemap Package" -type:"Mobile Basemap Package" -type:"Mobile Map Package" -type:"ArcPad Package" -type:"Project Package" -type:"Project Template" -type:"Desktop Style" -type:"Pro Map" -type:"Layout" -type:"Explorer Map" -type:"Globe Document" -type:"Scene Document" -type:"Published Map" -type:"Map Template" -type:"Windows Mobile Package" -type:"Layer Package" -type:"Explorer Layer" -type:"Geoprocessing Package" -type:"Desktop Application Template" -type:"Code Sample" -type:"Geoprocessing Package" -type:"Geoprocessing Sample" -type:"Locator Package" -type:"Workflow Manager Package" -type:"Windows Mobile Package" -type:"Explorer Add In" -type:"Desktop Add In" -type:"File Geodatabase" -type:"Feature Collection Template" -type:"Map Area" -typekeywords:"MapAreaPackage"',
            //sortField: 'modified',
            sortOrder: 'desc',
            num: 20,
            start: -1
        } ,
        source: null,
        searchInput: ''
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
                .catch(function (e) {
                    console.error(e);
                    app.loading = false;
                });
            });
        },
        search: function (event) {
            event.preventDefault();

            let app = this;

            app.loading = true;
            app.params.start = -1;

            if (app.searchInput) {
                app.params.query = `${app.searchInput} orgid:0123456789ABCDEF -type:"Code Attachment" -type:"Featured Items" -type:"Symbol Set" -type:"Color Set" -type:"Windows Viewer Add In" -type:"Windows Viewer Configuration" -type:"Map Area" -typekeywords:"MapAreaPackage" -owner:"esri_apps" -owner:"esri" -type:"Layer" -type: "Map Document" -type:"Map Package" -type:"Basemap Package" -type:"Mobile Basemap Package" -type:"Mobile Map Package" -type:"ArcPad Package" -type:"Project Package" -type:"Project Template" -type:"Desktop Style" -type:"Pro Map" -type:"Layout" -type:"Explorer Map" -type:"Globe Document" -type:"Scene Document" -type:"Published Map" -type:"Map Template" -type:"Windows Mobile Package" -type:"Layer Package" -type:"Explorer Layer" -type:"Geoprocessing Package" -type:"Desktop Application Template" -type:"Code Sample" -type:"Geoprocessing Package" -type:"Geoprocessing Sample" -type:"Locator Package" -type:"Workflow Manager Package" -type:"Windows Mobile Package" -type:"Explorer Add In" -type:"Desktop Add In" -type:"File Geodatabase" -type:"Feature Collection Template" -type:"Map Area" -typekeywords:"MapAreaPackage"`;
                app.message = `Procurando por "${app.searchInput}".`;
            }
            else {
                app.params.query = `orgid:0123456789ABCDEF -type:"Code Attachment" -type:"Featured Items" -type:"Symbol Set" -type:"Color Set" -type:"Windows Viewer Add In" -type:"Windows Viewer Configuration" -type:"Map Area" -typekeywords:"MapAreaPackage" -owner:"esri_apps" -owner:"esri" -type:"Layer" -type: "Map Document" -type:"Map Package" -type:"Basemap Package" -type:"Mobile Basemap Package" -type:"Mobile Map Package" -type:"ArcPad Package" -type:"Project Package" -type:"Project Template" -type:"Desktop Style" -type:"Pro Map" -type:"Layout" -type:"Explorer Map" -type:"Globe Document" -type:"Scene Document" -type:"Published Map" -type:"Map Template" -type:"Windows Mobile Package" -type:"Layer Package" -type:"Explorer Layer" -type:"Geoprocessing Package" -type:"Desktop Application Template" -type:"Code Sample" -type:"Geoprocessing Package" -type:"Geoprocessing Sample" -type:"Locator Package" -type:"Workflow Manager Package" -type:"Windows Mobile Package" -type:"Explorer Add In" -type:"Desktop Add In" -type:"File Geodatabase" -type:"Feature Collection Template" -type:"Map Area" -typekeywords:"MapAreaPackage"`;
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
        }
    }
});