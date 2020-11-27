let sidebarIsVisible = false;
let narbarMobileIsVisible = false;

const toggleSidebar = (show = true) => {
  $('#sidebarNav').toggleClass('sticky', show);
  $('#stickyNavbarOverlay').toggleClass('active', show);
  $('#hamburger').toggleClass('is-active');
  sidebarIsVisible = show;
};

const toggleMobileNavBar = (show = true) => {
  $('#navBarMobile').toggleClass('show', show);
  narbarMobileIsVisible = show;
};

$(document).on("click",".nav-item", function () {
  $('.navigation_mobile').find('div.dropdown-panel').removeClass('show');
  $(this).find('div.dropdown-panel').addClass('show');
});

$().ready(() => {
  $('#hamburger').click(() => {
    toggleSidebar(!sidebarIsVisible);
  });

  $('#navBarTitle').click(() => {
    toggleMobileNavBar(!narbarMobileIsVisible);
  });

  $('#stickyNavbarOverlay').click(() => {
    if (sidebarIsVisible) {
      toggleSidebar(false);
    }
  });
});
