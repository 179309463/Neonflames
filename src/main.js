var $ = require('jquery');
var DAT = require('./DAT.GUI.min');
var downloadCanvas = require('./download-canvas');
var clock = require('./clock');
var makeOctaveNoise = require('./noise').makeOctaveNoise;
var InputHandler = require('./input').Handler;
var _ = require('./i18n');

$(function(){
    var canvas = document.getElementById('c'),
        ctx = canvas.getContext('2d'),
        input = new InputHandler(canvas),
        timer = new clock.Clock();

    var pixelRatio = Math.min(2.0, window.devicePixelRatio || 1.0);
    canvas.height = window.innerHeight * pixelRatio;
    canvas.width = window.innerWidth * pixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    document.body.style.margin = 0;
    document.body.style.overflow = 'hidden';

    timer.start();

    window.timer = timer;
    window.input = input;
    window.ctx = ctx;
    window.canvas = canvas;

    var particles = [],
        color = 'rgb(4, 1, 1)',
        composite = 'lighter',
        gui = new DAT.GUI(),
        defaultOptions = {
            maxAge : 70,
            exposure: 1.0,
            damping: 0.8,
            noise: 1.0,
            fuzz: 1.0,
            intensity: 1.0,
            initialXVelocity: 10,
            initialYVelocity: 10,
            spawn: 10
        },
        options = $.extend({
            preset: 'default',
            red : 1.0,
            green : 0.1,
            blue : 0.1
        }, defaultOptions),
        presets = {
            'default': defaultOptions,
            fine: $.extend({}, defaultOptions, {
                damping: 0.3,
                intensity: 0.75,
                noise: 2,
                fuzz: 2,
                initialXVelocity: 15,
                initialYVelocity: 15
            }),
            intense: $.extend({}, defaultOptions, {
                intensity: 3,
                maxAge: 100
            }),
            smooth: $.extend({}, defaultOptions, {
                intensity: 0.2,
                spawn: 100
            }),
            undamped: $.extend({}, defaultOptions, {
                noise: 10,
                fuzz: 0.1,
                damping: 0
            }),
            'pure noise': $.extend({}, defaultOptions, {
                noise: 10,
                fuzz: 0.0,
                damping: 0,
                initialXVelocity: 0,
                initialYVelocity: 0
            }),
            x: $.extend({}, defaultOptions, {
                initialXVelocity: 100,
                initialYVelocity: 1
            }),
            y: $.extend({}, defaultOptions, {
                initialYVelocity: 100,
                initialXVelocity: 1
            }),
            worms: $.extend({}, defaultOptions, {
                intensity: 10,
                spawn: 1,
                fuzz: 5,
                noise: 0.5,
                maxAge: 100
            })
        },
        noiseCanvas = makeOctaveNoise(canvas.width, canvas.height, 8),
        noise = noiseCanvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data,
        imgdata, data, hdrdata,
        FloatArray = window.Float32Array || Array;


    gui.add(options, 'preset').options('default', 'fine', 'intense', 'smooth', 'worms', 'x', 'y', 'undamped', 'pure noise').onChange(function(name) {
        $.extend(options, presets[name]);
        gui.listenAll();
        ga('send', 'event', 'neonflames', 'preset', name);
    });
    gui.add(options, 'red', -2, 2, 0.01).listen();
    gui.add(options, 'green', -2, 2, 0.01).listen();
    gui.add(options, 'blue', -2, 2, 0.01).listen();
    gui.add(options, 'intensity', 0, 5, 0.01);
    gui.add(options, 'spawn', 1, 100, 1);
    gui.add(options, 'maxAge', 1, 500, 1);
    gui.add(options, 'exposure', 0, 5, 0.01);
    gui.add(options, 'noise', 0, 10, 0.01);
    gui.add(options, 'fuzz', 0, 10, 0.01);
    gui.add(options, 'damping', 0, 1.2, 0.01);
    gui.add(options, 'initialXVelocity', 0, 100, 0.01);
    gui.add(options, 'initialYVelocity', 0, 100, 0.01);
    gui.close();

    var colors = [
            {background: 'rgb(160, 10, 10)', value: [options.red, options.green, options.blue]},
            {background: 'rgb(200, 150, 50)', value: [1, 0.5, 0.1]},

            {background: 'rgb(20, 150, 20)', value: [0.3, 1, 0.3]},
            {background: 'rgb(25, 100, 75)', value: [0.25, 1, 0.75]},

            {background: 'rgb(10, 10, 80)', value: [0.2, 0.2, 1]},
            {background: 'rgb(75, 25, 100)', value: [0.75, 0.25, 1]},

            {background: '#000', value: [-1, -1, -1]},
            {background: '#fff', value: [1, 1, 1]}
        ],
        $colors = $('#colors');

    $.each(colors, function(_, color){
        var el = $('<li>')
                .css('background-color', color.background)
                .click(function() {
                    options.red = color.value[0];
                    options.green = color.value[1];
                    options.blue = color.value[2];
                    $('#colors li').removeClass('active');
                    $(this).addClass('active');
                    ga('send', 'event', 'neonflames', 'color', color.background);
                });
        $colors.append(el);
    });
    $('#colors li:eq(0)').addClass('active');

    function clear(){
        ga('send', 'event', 'neonflames', 'clear');
        clearData();
    }

    function tonemap(n){
        return (1-Math.pow(2, -n*0.005*options.exposure))*255;
    }

    function clearData(){
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        imgdata = ctx.getImageData(0, 0, canvas.width, canvas.height);
        data = imgdata.data;
        hdrdata = new FloatArray(data.length);
        for(var i = 0; i < hdrdata.length; i++) {
            hdrdata[i] = 0;
        }
    }

    function download(){
        ga('send', 'event', 'neonflames', 'download');
        downloadCanvas(canvas, 'png', 100, 'neonflames.png');
    }

    function share(){

        var img;
        try {
            img = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        } catch(e) {
            img = canvas.toDataURL().split(',')[1];
        }
        var w = window.open();
        w.document.write('Uploading to imgur.com...');
        $.ajax({
            url: 'https://api.imgur.com/3/upload.json',
            type: 'POST',
            headers: {
                Authorization: 'Client-ID cc01e3195c1adc2'
            },
            data: {
                type: 'base64',
                name: 'neon.jpg',
                title: 'Nebula',
                description: 'Made using http://29a.ch/sandbox/2011/neonflames/',
                image: img
            },
            dataType: 'json'
        }).done(function(data) {
            var url = 'http://imgur.com/' + data.data.id + '?tags';
            ga('send', 'event', 'neonflames', 'share', url);
            w.location.href = url;
        }).fail(function() {
            alert('Could not reach api.imgur.com. Sorry :(');
            ga('send', 'event', 'neonflames', 'share', 'fail');
            w.close();
        });
    }

    function getNoise(x, y, channel) {
        //return fuzzy(0.4);
        return noise[(~~x+~~y*canvas.width)*4+channel]/127-1.0;
    }

    // base +/- range
    function fuzzy(range, base){
        return (base||0) + (Math.random()-0.5)*range*2;
    }

    timer.ontick = function(td){
        var w = canvas.width*1,
            h = canvas.height*1,
            r = options.red,
            g = options.green,
            b = options.blue,
            maxAge = options.maxAge,
            vx = options.initialXVelocity,
            vy = options.initialYVelocity,
            damping = options.damping,
            noisy = options.noise,
            fuzz = options.fuzz,
            intensity = options.intensity,
            i;

        if(input.mouse.down){
            for(i = 0; i < options.spawn; i++){
                particles.push({
                    vx: fuzzy(vx),
                    vy: fuzzy(vy),
                    x: input.mouse.x * pixelRatio,
                    y: input.mouse.y * pixelRatio,
                    age: 0
                });
            }
        }

        var alive = [];

        for(i = 0; i < particles.length; i++){
            var p = particles[i];
            p.vx = p.vx*damping + getNoise(p.x, p.y, 0)*4*noisy+fuzzy(0.1)*fuzz;
            p.vy = p.vy*damping + getNoise(p.x, p.y, 1)*4*noisy+fuzzy(0.1)*fuzz;
            p.age ++;

           for(var j = 0; j < 10; j++){
                p.x += p.vx*0.1;
                p.y += p.vy*0.1;
                if(p.x < 0 || p.x >= w || p.y < 0 || p.y >= h)
                    continue;
                var index = (~~p.x+~~p.y*canvas.width)*4;
                data[index] = tonemap(hdrdata[index] += r*intensity);
                data[index+1] = tonemap(hdrdata[index+1] += g*intensity);
                data[index+2] = tonemap(hdrdata[index+2] += b*intensity);
            }

            if(p.age < maxAge){
                alive.push(p);
            }
        }

        ctx.putImageData(imgdata, 0, 0);

        particles = alive;
    };

    function tweak(){
        gui.toggle();
    }

    clearData();

    $('.toggle-actions').click(function(){
        gui.close();
        $('.actions').toggleClass('actions-show');
    });

    window.neonflames = {
        share: share,
        tweak: tweak,
        clear: clear,
        download: download,
    };

    document.addEventListener('touchmove', function(e){
        console.log('move', e);
    });
});
