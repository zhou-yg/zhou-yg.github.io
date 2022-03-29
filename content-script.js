document.querySelectorAll('.inner-link').forEach(spanA => {
  spanA.onclick = function () {
    window.open(spanA.attributes.href.nodeValue, '_blank');
  }
})