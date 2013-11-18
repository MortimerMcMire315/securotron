var current_page = 0;

$(document).ready(function() {
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
                alert('No more images.');
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
                alert('No more images.');
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
