var $ = require('jquery');

var translations = {
    en: {
        'Clear': 'Clear',
        'Share': 'Share',
        'Download': 'Download',
        'Tweak': 'Tweak',
        'More Experiments & Toys': 'More Experiments & Toys'
    },
    de: {
        'Clear': 'Zurücksetzen',
        'Share': 'Teilen',
        'Download': 'Speichern',
        'Tweak': 'Anpassen',
        'More Experiments & Toys': 'Weitere Experimente & Spielzeuge'
    },

};

var supportedLanguages = Object.keys(translations);
var preferredLanguages = (navigator.languages||[]).map(function(l){
    return l.split('-')[0];
});

function find(a, f){
    for(var i = 0; i < a.length; i++) {
        if(f(a[i])) return a[i];
    }
}
var language = find(preferredLanguages, function(l){
    return supportedLanguages.indexOf(l) >= 0;
}) || 'en';

function _(s){
    return translations[language][s];
}

module.exports = _;

$('.translate').each(function(){
    $(this).text(_($.trim($(this).text())));
});
