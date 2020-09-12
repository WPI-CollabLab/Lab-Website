function postData(url, data, callback){
    let http = new XMLHttpRequest();
    http.open('POST', url, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
        if(http.readyState === 4 && http.status === 200) {
            callback(JSON.parse(http.responseText));
        }
    }
    http.send(data);
}

function getData(url, callback){
    let http = new XMLHttpRequest();
    http.open('GET', url, true);
    http.onreadystatechange = function() {
        if(http.readyState === 4 && http.status === 200) {
            callback(JSON.parse(http.responseText));
        } }
    http.send(null);
}

function isValidId(idNumber){
  return idNumber != null && idNumber.trim().length === 9 && !isNaN(idNumber);
}

function isValidUsername(username){
    const regex = /^[\d\w]{4,30}$/;
    return username != null && regex.test(username);
}

function isValidName(str) {
    const regex = /^[a-zA-Z'\-\s]*$/;
    return regex.test(str) && str.length < 31;
}

function isValidNickname(nickname){
  const regex = /^[\d\w ]{4,30}$/;
  return nickname != null && regex.test(nickname);
}

function addError(idName, error, leave) {
    let idSel = $('#'+idName);
    idSel.notify(error, {className: 'error', elementPosition: 'right middle', autoHideDelay: 2000});
    idSel.focus();
    $('#'+idName + 'Group').addClass('has-error');
    if(!leave){
        idSel.val('');
    }
}

function convertSwipe(idNumber){
  if(isValidId(idNumber)){
    return idNumber;
  }
  if(idNumber.length < 12){
    return '';
  }
  if(idNumber[0] === '%'){
      const id = idNumber.match(/[\d]{9}/);
      if(id.length > 0){
      return id[0];
    }
  }
  return '';
}
