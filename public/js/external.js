let labStatus = null;
getStatus();
let kicking = kicking || false;
setInterval(getStatus, 5000);

$('#kickModal').on('hidden.bs.modal', function () {
    $('#idNumber').val('');
    getStatus();
});


function getStatus() {
    getData('/lab/status', function (response) {
        updatePage(response);
    });
}

function updatePage(newStatus) {
    const isopen = $('#isOpen');
    if (newStatus.open) {
        document.getElementById('isOpen').innerHTML = 'OPEN';
        isopen.removeClass('text-danger');
        isopen.addClass('text-success');
    } else {
        document.getElementById('isOpen').innerHTML = 'CLOSED';
        isopen.removeClass('text-success');
        isopen.addClass('text-danger');
    }
    let newList = '';
        for (let index in newStatus.members) {
          if (kicking) {
            newList += "<button class=\"list-group-item\" onClick=\"kick('" + index + "')\">" + newStatus.members[index] + "</button>";
          } else {
            newList += "<li class=\"list-group-item\">" + newStatus.members[index] + '</li>';

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
        console.log(statusCode);
        switch (statusCode) {
            case 0:
                $.notify("Kick Successful!", {'className': 'success'});
                $('#kickModal').modal('hide');
                break;
        }
    });
}
