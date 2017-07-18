(function() {
  'use strict';

  const signinBtn = document.getElementById('signupform');
  signinBtn.addEventListener('submit', (e) => {
    e.preventDefault();  // prevent default behavior for 'submit' action

    const username = document.getElementById('signup-userinput').value;
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value;
    const bodyData = { username, password, name };

    // options for request
    const fetchoption = {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
      body: JSON.stringify(bodyData),
    };

    // make the request
    fetch('/post/signup', fetchoption).then((res) => {
      if (res.ok) {
        return res.text();
      } else {
        throw 'Username already exists!';
      }
    }).then((data) => {
      // welcome the user and redirect
      alert('Hello, ' + name);
      window.location = '/';
    }).catch(err => {
      alert(err);
    });
  }, false);
}());