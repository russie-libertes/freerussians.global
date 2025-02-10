map = null;

function init_and_populate_map(id, events)
{
    map = L.map(id);
    L.tileLayer(decodeURI(document.getElementById('link_tiles').href), {attribution: document.getElementById('map_copyright').outerHTML.replace('hidden', ''), maxZoom: 19 }).addTo(map);
    map.on('popupopen', e =>
    {
        e.popup._closeButton.removeAttribute("href");
        e.popup._closeButton.style.cursor = "pointer";
    });

    let mapmarkers = {map : map};
    const markers = [];
    for(const a of events)
    {
        if(a.dataset.mapmarkerkey in mapmarkers)
            continue;

        const latlon_num = (a.dataset.latlon || '').split(',').map(parseFloat);
        if(latlon_num.some(x => Number.isNaN(x)))
            continue;
        
        const marker = L.circleMarker(latlon_num, {radius: 5, stroke: false, className: a.parentElement.classList.contains('eventactive') ? 'markerupcoming' : 'markerpast'}).addTo(map);
        marker.bindPopup(format_event_popup(a).outerHTML);
        marker.on('click', marker_onclick);

        marker.mapmarkerkey = a.dataset.mapmarkerkey;
        mapmarkers[a.dataset.mapmarkerkey] = marker;
        markers.push(marker);
    }

    const quantiles = (arr, p) => arr.sort((a, b) => a - b) && [arr[Math.floor(p * arr.length)], arr[Math.floor((1 - p) * arr.length)]];
    
    const [latl, latr] = quantiles(markers.map(marker => marker.getLatLng().lat), 0.1);
    const [lonl, lonr] = quantiles(markers.map(marker => marker.getLatLng().lng), 0.1);
    
    const markers_within = markers.filter(marker => latl <= marker.getLatLng().lat && marker.getLatLng().lat <= latr && lonl <= marker.getLatLng().lng && marker.getLatLng().lng <= lonr);
    const markers_within_keys = markers_within.map(marker => marker.mapmarkerkey);
    
    if(markers_within.length > 0)
        map.fitBounds(L.latLngBounds( markers_within.map(marker => ([marker.getLatLng().lat, marker.getLatLng().lng])) ));
    else 
        map.setView([20, 0], 2);

    return [mapmarkers, markers_within_keys];
}

function format_event_popup(a)
{
    const elem = document.getElementById('popup').content.cloneNode(true);
    elem.querySelector('#place_name').innerText = [a.dataset.city, a.dataset.country].filter(s => s != '').join(', ');
    elem.querySelector('#place_date').innerText = [a.dataset.date, a.dataset.time].filter(s => s != '').join(', ');
    return elem.firstElementChild;
}

function marker_onclick(e)
{
    const marker = e.target;
    let _icon = document.querySelector('.markerhighlighted');
    if(_icon != null)
        L.DomUtil.removeClass(_icon, 'markerhighlighted');

    _icon = marker._icon || marker._path;
    if(_icon != null)
        L.DomUtil.addClass(_icon, 'markerhighlighted');
    
    marker.bringToFront(); // marker.setZIndexOffset(1000);
}

function navigate(e)
{
    return false;
}

