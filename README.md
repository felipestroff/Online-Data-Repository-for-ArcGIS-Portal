# Repositório de Dados | SISDIA

# Core

- https://getbootstrap.com
- https://vuejs.org
- https://developers.arcgis.com/javascript
- https://developers.arcgis.com/rest

- - - - -

# Libs

- https://github.com/Esri/terraformer-arcgis-parser
- https://github.com/bryik/geojson-to-kml
- https://github.com/Stuk/jszip
- https://github.com/mirajanata/GeoShape.JS

- - - - -

# Requeriments

- Local web server (xampp, wamp, etc)
- Git https://git-scm.com/downloads

- - - - -

# How to use

1. Install a web server and start apache service
2. Put app folder into web server folder `www` or `htdocs`
3. Goto `http://localhost/app-folder-name` in browser

- - - - -

# app.js

To change current params to our ArcGIS REST API, modify these in:

```
data: {
    portal: {}
    params: {}
}
```

See more: https://developers.arcgis.com/rest/users-groups-and-items/search.htm

- - - - -

# Todo

- Add support to download shapefile layers
- Add category and tags search
- Paginate elements (current limited by 20 items)