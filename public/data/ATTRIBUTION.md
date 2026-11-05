# Geographic data

`land.geojson` is Natural Earth 1:110m land geometry, obtained from
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
on 31 October 2026. Natural Earth data are public domain:
https://www.naturalearthdata.com/about/terms-of-use/

This coarse geometry supplies the offline map. It is not a field boundary.
`sri-lanka-blue-marble.jpg` is a static NASA GIBS Blue Marble Shaded Relief /
Bathymetry regional backdrop. Its actual WMS request and geographic bounds are
in `blue-marble-receipt.json`; relevant capabilities are archived in
`backend/fixtures/gibs_selected_capabilities.xml`. It is geographic visual
context with no acquisition date asserted, and does not feed the crop model.
Esri satellite tiles and NASA GIBS imagery are remote services with attribution
in the map; they are not bundled or used as scientific model inputs.

The local Cuneo aerial basemap (`cuneo-ortho.webp`) is a cropped WebP mosaic of the Ortofoto 2010 ICE Piemonte service, © Arpa Piemonte, [CC BY 2.5 Italia](https://creativecommons.org/licenses/by/2.5/it/). [Source and reuse information](https://webgis.arpa.piemonte.it/ags/rest/services/topografia_dati_di_base/Ortofoto_2010_ICE_Piemonte/MapServer/info/iteminfo). Parcel outlines and crop records are demonstration data.
