(() => {
  function addDemoLink() {
    const ports = document.querySelector('.cover-ports');
    if (!ports || ports.parentElement?.querySelector('.cover-demo-link')) return;
    const link = document.createElement('a');
    link.className = 'cover-demo-link';
    link.href = './demo/';
    link.innerHTML = '进入展会 VR Demo <span>Exhibition demo ↗</span>';
    ports.after(link);
  }
  new MutationObserver(addDemoLink).observe(document.getElementById('root'), { childList: true, subtree: true });
  addDemoLink();
})();
