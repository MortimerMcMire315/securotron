var current_page = 0;

$(document).ready(function() {
    $('.no-more-images').hover(function(e) {
        e.preventDefault();
        $(this).css('cursor', 'default');
    });
    
    $('.forward-back-buttons').hover(function(e) {
        e.preventDefault();
        $(this).css('cursor', 'pointer');
    }, function(e){
        e.preventDefault();
        $(this).css('cursor', 'default');
    });

    $('#back').click(function(e) {
        $.ajax({
            url: '/grid/' + (current_page - 1).toString(),
            data: {},
            type: 'post',
            error: function() {
                $('.no-more-images').fadeTo(450, 0.98, function () {
                    $(this).fadeTo(200,0.98);
                    $(this).fadeTo(800, 0);
                });
            },
            success: function() {
                $('.img-div').fadeOut(400, function() {
                    current_page -= 1;
                    $(this).load('/grid/' + current_page.toString());
                    $(this).fadeIn();
                });
            }
        });
    });

    $('#forward').click(function(e) {
        $.ajax({
            url: '/grid/' + (current_page + 1).toString(),
            data: {},
            type: 'post',
            error: function() {
                $('.no-more-images').fadeTo(450, 0.98, function () {
                    $(this).fadeTo(200,0.98);
                    $(this).fadeTo(800, 0);
                });
            },
            success: function(){
                $('.img-div').fadeOut(400, function() {
                    current_page += 1;
                    $(this).load('/grid/' + current_page.toString());
                    $(this).fadeIn();
                });
            }
        });
    });

});
