var http = require('http');
var fs = require('fs');
var url = require('url');
var async = require('async');

/*
 * Serves a 404 page. If no error string is provided, a default is used.
 */
function redirect404(res, err_str){
    if(typeof(err_str) === 'undefined') err_str = '<h2>URL not found.</h2>';
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end(err_str);
}

/*
 * Given an image name, will find that image in the ./img folder and serve it,
 * or else serve a 404 page.
 */
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
 * Upon receiving a /img url, will attempt to find the image at the index
 * given in the URL like so: /img/54
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

        fs.readFile('./img/' + image_in_question, function(err, data) {
            if(err) {
                redirect404(res, '<h2>Image not found.</h2>');
                return;
            }
            res.writeHead(200, {'Content-Type': 'image/jpg'});
            res.end(data, 'binary');
        });
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

/*
 *since we wanted the website to group images by the day we wrote a function take an array of all the filenames
 *the filenames are comprised of the timestamp so we could isolate different pictures taken the same day
 *we iterated through the list while counting the number of pictures for one given day
 *when that day was over we added the number of pictures taken that day to the final array and resumed counting from 0
 */
function timesort(dumpArray){
    var current_day = dumpArray[0].slice(0,8);
    var daySort = [];
    var cur_day_array = [];

    for(var i = 0; i < dumpArray.length; i++){
        if(dumpArray[i].slice(0,8) != current_day){
            daySort.push(cur_day_array);
            current_day = dumpArray[i].slice(0,8);
            cur_day_array = [];
        }
        
        cur_day_array.push(dumpArray[i]);
    }
    daySort.push(cur_day_array);
    return daySort;
}

/*
 *this filename is generated with the timestamp of the photo so we wrote this function to determine the day from the filename
 *the first 4 characters are the year, the next two are the month, and the next two are the date
 *we found the hour, minute, and second when used for grouping purposes was largely insignificant
 */
function timeGet(img){
    var  year = img.slice(0,4);
    var month = img.slice(4,6);
    var day = img.slice(6,8);
    var date = month + "/" + day + "/" + year;
    return date;
}

/*
 *this function generates sub arrays from the larger array of all the filenames
 *it reads through the array and generates a sub array of the images from one day.
 */
function get_today_array(day_splits, img_page){
    return day_splits[img_page];
}

/*
 *  Dynamically generates an html div of images for the given page.
 */
function build_img_div(files, img_page){
    var day_splits = timesort(files);
    var today_array = get_today_array(day_splits, img_page);

    var html_str = "";
    
    if(today_array == null){
        return null;
    }

    html_str += "<nobr><div class='date-div'><p class='date-str'>you are currently viewing images from</p>\
                 <p class='real-date'>" + timeGet(today_array[0]) + "</p><p class='date-str'>\
                 .</p></div></nobr><br>";
    html_str += "<div class='img-grid'>";
    for(var i = 0; i < today_array.length; i++){
        html_str += "<img src='/imgbyname/" + today_array[i] + "' class='image'>\n"
    }
    html_str +=  "</div>";
    
    return html_str;
}

/*
 * Serve the url /grid/###, where ### is a number corresponding to the current image page number.
 * From this, we can later generate a <div> of images.
 */
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
            fs.readFile('./server.js', function(err, data) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end(data);
            });    
            break;
            
        case 'grid':
            serve_img_grid(urlobj, res);
            break;

        case 'static':
            serve_static_files(urlobj, res);
            break;

        case 'favicon.ico':
            fs.readFile('./static/images/favicon.ico', function(err, data) {
                res.writeHead(200, {'Content-Type': 'image/x-icon'});
                res.end(data,'binary');
            });
            break;

        default:
            redirect404(res)
            break;
    }

}

/*
 * Actually create the server.
 */
http.createServer(function (req, res) {
    urlobj = url.parse(req.url);
    url_dispatch(urlobj, res);
}).listen(8080, '0.0.0.0');

console.log('Server running.');
