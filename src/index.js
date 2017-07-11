import '../index.html';  // required for hot-loading for changes in index.html

function component() {
  var element = document.createElement('div');
  element.innerHTML = 'Shit';
  return element;
}

document.body.appendChild(component());
