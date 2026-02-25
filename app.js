const page = document.body.dataset.page;
const links = document.querySelectorAll('[data-page-link]');

links.forEach((link) => {
  if (link.dataset.pageLink === page) {
    link.classList.add('active');
  }
});
