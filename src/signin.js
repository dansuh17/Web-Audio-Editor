(function signin() {
  const signinBtn = document.getElementById('signinform');
  signinBtn.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent default behavior for 'submit' action

    const username = document.getElementById('signin-userinput').value;
    const password = document.getElementById('signin-password').value;
    const bodyData = { username, password };

    // options for request
    const fetchoption = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // REQUIRED to use session information!!
      method: 'post',
      body: JSON.stringify(bodyData),
    };

    // make the request
    fetch('/post/signin', fetchoption).then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw res.statusMessage; // throw with a message
    }).then((data) => {
      // welcome the user and redirect
      alert(`Welcome, ${data.username}`);
      window.location = '/';
    }).catch((err) => {
      alert(err);
    });
  }, false);
}());
