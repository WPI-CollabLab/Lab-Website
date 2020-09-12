let labStatus = null;
getStatus();
let isKicking = (typeof kicking === 'undefined' ) ? false : kicking;
setInterval(getStatus, 5000);

$('#kickModal').on('hidden.bs.modal', function () {
    $('#idNumber').val('');
    getStatus();
});

function login() {
    window.location.replace('/manage');
}

function getStatus() {
    getData('/lab/status', function (response) {
        updatePage(response);
    });
}

function updatePage(newStatus) {
    const isOpen = $('#isOpen');
    if (newStatus.open) {
        document.getElementById('isOpen').innerHTML = 'OPEN';
        isOpen.removeClass('text-danger');
        isOpen.addClass('text-success');
    } else {
        document.getElementById('isOpen').innerHTML = 'CLOSED';
        isOpen.removeClass('text-success');
        isOpen.addClass('text-danger');
    }
    let newList = '';
        for (let index in newStatus.members) {
          if (isKicking) {
            newList += `<button class="list-group-item" onClick="kick('${index}')">${newStatus.members[index]}</button>`;
          } else {
            newList += `<li class="list-group-item">${newStatus.members[index]}</li>`;
          }
    }
    labStatus = newStatus;
    document.getElementById('who').innerHTML = newList;
}

function kick(username) {
    $("#kickName").html(labStatus.members[username]);
    $("#kickModal").modal();
    $('#idNumber').val(username);
}

function kickUser() {
    let idNumber = $('#idNumber').val();
    let data = {'idNumber': idNumber};
    postData('/lab/kick', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                $.notify("Kick Successful!", {'className': 'success'});
                $('#kickModal').modal('hide');
                break;
        }
    });
}
