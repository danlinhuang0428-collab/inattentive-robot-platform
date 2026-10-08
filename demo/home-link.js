(() => {
  function addDemoLink() {
    const ports = document.querySelector('.cover-ports');
    if (!ports || ports.parentElement?.querySelector('.cover-demo-link')) return;
    const link = document.createElement('a');
    link.className = 'cover-demo-link';
    link.href = './demo/';
    link.textContent = 'Enter VR Demo';
    ports.after(link);
  }
  new MutationObserver(addDemoLink).observe(document.getElementById('root'), { childList: true, subtree: true });
  addDemoLink();
})();
