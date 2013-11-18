var http = require('http');
var fs = require('fs');
var url = require('url');
var async = require('async');

/*
 * Throws a 404 page. If no error string is provided, a default is used.
 */
function redirect404(res, err_str){
    if(typeof(err_str) === 'undefined') err_str = '<h2>URL not found.</h2>';
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end(err_str);
}

function serve_img_by_name(urlobj, res){
    if(urlobj.pathname.split('/')[2] == null) {
        redirect404(res);
        return;
    }
    
    var imgname = urlobj.pathname.split('/')[2];
    fs.readFile('./img/' + imgname, function (err, contents) {
        if(err){
            redirect404(res);
            return;
        }
        res.writeHead(200, {'Content-Type': 'image/jpg'});
        res.end(contents, 'binary');
    });
    
}

/*
 * Upon receiving a /img url, will attempt to find the image at the index of the
 * ID given in the query string like so: /img?id=54
 */
function serve_img_url(urlobj, res){
    if(urlobj.pathname.split('/')[2] == null) {
        redirect404(res);
        return;
    }

    var imgnum = urlobj.pathname.split('/')[2];

    fs.readdir('./img', function (err, files) {
        if (err){ 
            redirect404(res);
            return;
        }
        image_in_question = files[imgnum];

        if(image_in_question == null){
            redirect404(res, '<h2>Image not found.</h2>');
            return;
        }

        var img = fs.readFileSync('./img/' + image_in_question);
        res.writeHead(200, {'Content-Type': 'image/jpg'});
        res.end(img, 'binary');
    });
}

/*
 * If a url's pathname is /static/something, will try to find that 
 * file and serve it, or else throw a 404.
 */
function serve_static_files(urlobj, res){
    fs.readFile('.' + urlobj.pathname, function (err, contents) {
        if(err){
            redirect404(res);
            return;
        }

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(contents);
    });
}

function timesort(dumpArray){

    var timestamp = dumpArray[1].slice(0,8);
    var daySort = [];
    var x = 0;

    for(var i = 0; i < dumpArray.length; i++){
        if(timestamp == dumpArray[i].slice(0,8)){
            x = x + 1;
        } else {
            daySort.push(x);
            timestamp = dumpArray[i].slice(0,8);
            x = 1;
        }
    }
    daySort.push(x);
    return daySort;
}

function timeGet(img){
    var  year = img.slice(0,4);
    var month = img.slice(4,6);
    var day = img.slice(6,8);
    var date = month + "/" + day + "/" + year;
    return date;
}

function get_today_array(day_splits, files, img_page){
    var acm = 0;
    for(var i = 0; i < day_splits.length; i++){
        var old_acm = acm;
        acm += day_splits[i];
        if(i == img_page) {
            return files.slice(old_acm, acm);
        }
    }
    return null;
}

function build_img_div(files, img_page){
    var day_splits = timesort(files);
    var today_array = get_today_array(day_splits, files, img_page);

    var html_str = "";
    
    if(today_array == null){
        return null;
    }

    html_str += "<div><p class='date'>you are currently viewing images from</p>\
                 <p class='real-date'>" + timeGet(today_array[0]) + "</p>.</div><br>";
    for(var i = 0; i < today_array.length; i++){
        html_str += "<img src='/imgbyname/" + today_array[i] + "' class='image'>\n"
    }
    
    return html_str;
}

function serve_img_grid(urlobj, res){
    var path = urlobj.pathname.split('/')[2];
    img_page = parseInt(path);
    
    fs.readdir('./img', function(err, files){
        if(err){
            redirect404(res);
            return;
        }
        html_str = build_img_div(files, img_page);
        if(html_str == null){    
            redirect404(res);
        }
        //results is an array of raw file strings.
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html_str);
    });
}

/*
 * Build the home page and send it to the client.
 */
function serve_home_page(urlobj, res){
    //Using a library of asynchronous utils to quickly
    //concatenate these files without using gross nested callbacks.
    async.map(['./static/html/base.html', './static/html/home_header.html', './static/html/home_footer.html'],
        fs.readFile, function(err, results) {
            if(err){
                redirect404(res);
                return;
            }
            //Read the images directory into an array of files,
            //then access the files by index.
            fs.readdir('./img', function(err2, files){
                if(err2){
                    redirect404(res);
                    return;
                }
                var html_str = results[0] + results[1];
                html_str += "<div class='img-div'>"
                html_str += build_img_div(files, 0);
                html_str += "</div>";
                html_str += results[2];
                
                //results is an array of raw file strings.
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(html_str);
            });
    });
}

/*
 * Splits the URL path and checks the section after the first
 * slash, dispatching to the appropriate handling function.
 */
function url_dispatch(urlobj, res){
    switch(urlobj.pathname.split('/')[1]) {
        case '':
            serve_home_page(urlobj, res);
            break;
    
        case 'img': 
            serve_img_url(urlobj, res);
            break;
            
        case 'imgbyname':
            serve_img_by_name(urlobj, res);
            break;

        case 'code':
            var text = fs.readFileSync('./server.js');    
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(text);
            break;
            
        case 'grid':
            serve_img_grid(urlobj, res);
            break;

        case 'static':
            serve_static_files(urlobj, res);
            break;

        case 'favicon.ico':
            var img = fs.readFileSync('./static/images/favicon.ico');
            res.writeHead(200, {'Content-Type': 'image/x-icon'});
            res.end(img,'binary');
            break;

        default:
            redirect404(res)
            break;
    }

}

http.createServer(function (req, res) {
    urlobj = url.parse(req.url);
    url_dispatch(urlobj, res);
}).listen(8080, '0.0.0.0');

console.log('Server running.');
