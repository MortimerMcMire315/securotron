$(document).ready(function() {
   $('.forward-back-buttons').hover(function(e) {
       e.preventDefault();
       $(this).css('cursor', 'pointer');
        
   }, function(e){
       e.preventDefault();
       $(this).css('cursor', 'default');
   });
});
