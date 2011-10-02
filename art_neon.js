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
        blue : 0.1,
    }, defaultOptions),
    presets = {
        default: defaultOptions,
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


gui.add(options, 'preset').options('default', 'fine', 'intense', 'smooth', 'worms', 'x', 'y').onChange(function(name) {
    $.extend(options, presets[name]);
    gui.listenAll();
    _gaq.push(['_trackEvent', 'neonflames', 'preset', name]);
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
                _gaq.push(['_trackEvent', 'neonflames', 'color', color.background]);
            });
    $colors.append(el);
});
$('#colors li:eq(0)').addClass('active');

function clear(){
    _gaq.push(['_trackEvent', 'neonflames', 'clear']);
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
    _gaq.push(['_trackEvent', 'neonflames', 'download']);
    var w = window.open();
    w.document.write('<p style="font-family: sans-serif;">right click, save as</p><img src="' + canvas.toDataURL() + '">');
}

function share(){


    try {
        var img = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    } catch(e) {
        var img = canvas.toDataURL().split(',')[1];
    }
    var w = window.open();
    w.document.write('Uploading...');
    $.ajax({
        url: 'http://api.imgur.com/2/upload.json',
        type: 'POST',
        data: {
            type: 'base64',
            key: '48c16073663cb7d3befd1c2c064dfa0d',
            name: 'neon.jpg',
            title: 'test title',
            caption: 'test caption',
            image: img
        },
        dataType: 'json'
    }).success(function(data) {
        var url = data['upload']['links']['imgur_page'];
        _gaq.push(['_trackEvent', 'neonflames', 'share', url]);
        w.location.href = url;
    }).error(function() {
        alert('Could not reach api.imgur.com. Sorry :(');
        w.close();
        _gaq.push(['_trackEvent', 'neonflames', 'share', 'fail!']);
    });
}

function getNoise(x, y, channel) {
    //return fuzzy(0.4);
    return noise[(~~x+~~y*canvas.width)*4+channel]/127-1.0;
}

// base +/- range
function fuzzy(range, base){
    return (base||0) + (Math.random()-0.5)*range*2
}

timer.ontick = function(td){
    var w = canvas.width*1,
        h = canvas.height*1,
        r = options.red,
        g = options.green,
        b = options.blue,
        maxAge = options.maxAge,
        vx = options.initialXVelocity;
        vy = options.initialYVelocity,
        damping = options.damping,
        noisy = options.noise,
        fuzz = options.fuzz,
        intensity = options.intensity;
    if(input.mouse.down){
        for(var i = 0; i < options.spawn; i++){
            particles.push({
                vx: fuzzy(vx),
                vy: fuzzy(vy),
                x: input.mouse.x,
                y: input.mouse.y,
                age: 0
            });
        }
    }

    var alive = [];

    for(var i = 0; i < particles.length; i++){
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
}

clearData();
