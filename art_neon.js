var particles = [],
    color = 'rgb(4, 1, 1)',
    composite = 'lighter',
    max_age = 70,
    initial_radius = 5,
    lineWidth = 1.0,
    r = 1.0,
    g = 0.1,
    b = 0.1,
    noiseCanvas = makeOctaveNoise(canvas.width, canvas.height, 8),
    noise = noiseCanvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data,
    imgdata, data, hdrdata,
    FloatArray = window.Float32Array || Array;

var colors = [
        {background: 'rgb(160, 10, 10)', value: [1, 0.10, 0.10]},
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
                r = color.value[0];
                g = color.value[1];
                b = color.value[2];
            });
    $colors.append(el);
});

function clear(){
    _gaq.push(['_trackEvent', 'neonflames', 'clear']);
    clearData();
}

function tonemap(n){
    return (1-Math.pow(2, -n*0.005))*255;
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
    _gaq.push(['_trackEvent', 'neonflames', 'share']);


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
        w.location.href = data['upload']['links']['imgur_page'];
    }).error(function() {
        alert('Could not reach api.imgur.com. Sorry :(');
        w.close();
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
        h = canvas.height*1;
    if(input.mouse.down){
        for(var i = 0; i < 10; i++){
            particles.push({
                vx: fuzzy(10.0),
                vy: fuzzy(10.0),
                x: input.mouse.x,
                y: input.mouse.y,
                age: 0
            });
        }
    }

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = composite;
    var alive = [];

    for(var i = 0; i < particles.length; i++){
        var p = particles[i];
        p.vx = p.vx*0.8 + getNoise(p.x, p.y, 0)*4+fuzzy(0.1);
        p.vy = p.vy*0.8 + getNoise(p.x, p.y, 1)*4+fuzzy(0.1);
        p.age ++;

       for(var j = 0; j < 10; j++){
            p.x += p.vx*0.1;
            p.y += p.vy*0.1;
            if(p.x < 0 || p.x >= w || p.y < 0 || p.y >= h)
                continue;
            var index = (~~p.x+~~p.y*canvas.width)*4;
            data[index] = tonemap(hdrdata[index] += r);
            data[index+1] = tonemap(hdrdata[index+1] += g);
            data[index+2] = tonemap(hdrdata[index+2] += b);
        }

        if(p.age < max_age){
            alive.push(p);
        }
    }

    ctx.putImageData(imgdata, 0, 0);

    particles = alive;
}

clearData();


$('#colors li').click(function() {
    $('#colors li').removeClass('active');
    $(this).addClass('active');
});
