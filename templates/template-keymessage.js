$('.goTo-METHODNAME').on('click', function(e) {
        e.preventDefault();

        if (!$(this).hasClass('active') || ($(this).hasClass('active') && $(this).hasClass('allow'))) {
            if (isPublished) {
                com.veeva.clm.gotoSlide('FILENAME.zip', '');
            } else {
                document.location.href = 'FILENAME.html';
            }
        }
    });
