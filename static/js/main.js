$(function(){
  var imageID     = $('.image-id');
  var imageElem   = $('.image-elem');
  var getImageBtn = $('.get-random-image');

  getImageBtn.on('click', function(e){
    e.preventDefault();
    $.ajax({
      method: "GET",
      url: "http://localhost:3000/getRandomImage",
      dataType: "JSON",
      success: function(data){
        console.log(data);
        imageID.text(data.id);
        imageElem.attr('src', data.imgURL);
      }
    });
  });

});
