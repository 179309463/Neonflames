var $ = require('jquery');

var downloadUrl,
    supportsDownload = document.createElement('a').download !== undefined;

function downloadCanvas(canvas, type, quality, name){
    if(canvas.toBlob) {
        canvas.toBlob(function(blob){
                if(downloadUrl) URL.revokeObjectURL(downloadUrl);

                if(navigator.msSaveBlob){
                    navigator.msSaveBlob(blob, name);
                    resolve();
                }
                else {
                    downloadUrl = URL.createObjectURL(blob);
                    if(supportsDownload){
                        download(downloadUrl, name);
                    }
                    else {
                        window.open(downloadUrl);
                    }
                }

            }, type, quality);
    }
    else {
        var url = canvas.toDataURL(type, quality);
        download(url, name);
    }
}
module.exports = downloadCanvas;

function download(url, name){
    var a = $('<a>').attr({download: name||'photo.jpg', href: url, target: '_blank'}).text('download');
    $('body').append(a);
    // firefox seems to need these timeouts
    window.setTimeout(function() {
        a[0].click();
        window.setTimeout(function() {
            a.remove();
        }, 100);
    }, 100);
}
