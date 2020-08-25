function loadTab(index) {
    hideAll();
    switch (index) {
        case 0:
            show('self');
            break;
        case 1:
            show('lm');
            break;
        case 2:
            show('exec');
            updateVisits();
            setInterval(updateVisits, 3000);
            break;
        case 3:
            show('admin');
            break;
        case 4:
            show('grant');
            break;
    }
}

function hideAll() {
    $('#self').addClass('hidden');
    $('#selfTab').removeClass('active');
    $('#lm').addClass('hidden');
    $('#lmTab').removeClass('active');
    $('#exec').addClass('hidden');
    $('#execTab').removeClass('active');
    $('#admin').addClass('hidden');
    $('#adminTab').removeClass('active');
    $('#grant').addClass('hidden');
    $('#grantTab').removeClass('active');
}

function show(tab) {
    $('#' + tab).removeClass('hidden');
    $('#' + tab + 'Tab').addClass('active')
}

function changeUsername() {
    const username = $('#newUsername').val();
    if (!isValidUsername(username)) {
        addError('newUsername', 'Invalid username, must be alphanumeric, spaces between 4 and 30 characters!');
        return false;
    }
    const data = {'username': username};
    postData('/manage/changeUsername', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                success('newUsername', 'Username changed successfully!');
                break;
            case 1:
                addError('newUsername', "Username is already taken!");
                break;
        }
    });
}

function changeNickname() {
    const nickname = $('#nickname').val();
    if (!isValidNickname(nickname)) {
        addError('nickname', 'Invalid nickname, must be alphanumeric, spaces between 4 and 30 characters!');
        return false;
    }
    const data = {'nickname': nickname};
    postData('/manage/changeNickname', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                success('nickname', 'Nickname changed successfully!');
                break;
            case 1:
                addError('nickname', "Couldn't change nickname!");
                break;
        }
    });
}

function closeLab() {
    postData('/manage/closeLab', '', function (statusCode) {
        switch (statusCode) {
            case 0:
                success('Lab close successfully!');
                break;
        }
    })
}

function sendPassphrase() {
    let passphrase = $('#passphrase').val();
    let data = {'passphrase': passphrase};
    postData('/manage/getPermission', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                success('passphrase', 'Passphrase granted successfully, refresh page to view!');
                setTimeout(function () {
                    window.location.reload();
                }, 2000);
                break;
            case 1:
                addError('passphrase', 'Invalid passphrase!');
                break;
        }
    });
}

function changeName() {
    let name = $('#newName').val();
    let data = {'name': name};
    if (!isValidName(name)) {
        addError('newName', 'Invalid name, must only be letters and spaces.');
        return false;
    }
    postData('/manage/changeName', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                success('newName', 'Name changed successfully');
                $('#newName').val('');
                break;
            case 1:
                addError('newName', 'Failed for some reason, site may be down');
                break;
        }
    });
}

function changePassword() {
    let newPassword = $('#newPassword');
    let oldPassword = $('#oldPassword');
    let confirmPassword = $('#confirmPassword');
    let oldPass = oldPassword.val();
    let newPass = newPassword.val();
    let conPass = confirmPassword.val();
    let error = false;
    if (oldPass.trim() === '') {
        addError('oldPassword', 'You need to fill out your current password');
        error = true;
    }
    if (newPass.trim() === '') {
        addError('newPassword', 'You need to fill out a new password');
        error = true;
    }
    if (newPass !== conPass) {
        addError('confirmPassword', 'Your passwords do not match!');
        newPassword.val('');
        confirmPassword.val('');
        error = true;
    }
    if (!error) {
        let data = {'password': oldPass, 'newPassword': newPass};
        postData('/manage/changePassword', JSON.stringify(data), function (statusCode) {
            switch (statusCode) {
                case 0:
                    success('confirmPassword', 'Your password has been updated successfully!');
                    newPassword.val('');
                    $('#confirmPassword').val('');
                    break;
                case 1:
                    addError('oldPassword', 'Your old password was incorrect');
                    break;
            }
            oldPassword.val('');
        });
    }
}

function deleteAccount() {
    let password = $('#password').val();
    let data = {'password': password};
    if (password.trim() === '') {
        addError('password', 'You need to fill out this before you can delete your account.');
        return;
    }
    postData('/manage/deleteSelf', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                alert('Your account is now deleted!');
                location.reload();
                break;
            case 1:
                addError('password', 'Your password is incorrect');
                $('#password').val('');
                break;
        }
    });
}

function deleteUser() {
    let userID = $('#toDelete').val().trim();
    if (userID === '') {
        addError('toDelete', 'You need to enter another user\'s identifier.');
        return;
    }
    let data = {'userID': userID};
    postData('/manage/deleteAccount', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                success('toDelete', 'User granted lab monitor successfully!');
                $('#toDelete').val('');
                break;
            case 1:
                addError('toDelete', 'User doesn\'t exist in the system.');
                break;
        }
    });
}

function grantLabMonitor() {
    let userID = $('#grantLMID').val().trim();
    if (userID === '') {
        addError('grantLMID', 'You need to enter another user\'s identifier.');
        return;
    }
    const data = {'userID': userID, 'grant': 'labMonitor'};
    postData('/manage/grant', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                success('grantLMID', 'User granted lab monitor successfully!');
                $('#grantLMID').val('');
                break;
            case 1:
                addError('grantLMID', 'User doesn\'t exist in the system.');
                break;
        }
    });
}

//List user swipe history
function updateVisits() {
    getData('/lab/visits', function (response) {
        console.log("Response:", response);
        console.log("Response.visits:", response.visits.inTime);
        for (let visit in response.visits) {
            console.log("Visit.inTime:", visit);
        }
        // let newList = '';
        // for (let index of Object.keys(response.members)) {
        //     newList += `<li class="list-group-item">${response.members[index]}</li>`;
        // }
        // document.getElementById('who').innerHTML = newList;
    });
}

function grantExec() {
    const userID = $('#grantExecID').val().trim();
    if (userID === '') {
        addError('grantExecID', 'You need to enter another user\'s identifier.');
        return;
    }
    const data = {'userID': userID, 'grant': 'exec'};
    postData('/manage/grant', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                success('grantExecID', 'User granted exec successfully!');
                $('#grantExec').val('');
                break;
            case 1:
                addError('grantExecID', 'User doesn\'t exist in the system.');
                break;
        }
    });
}

function resetPassword() {
    const userID = $("#resetPasswordID").val().trim();
    if (userID === '') {
        addError('resetPasswordID', 'You need to enter another user\'s identifier.');
        return;
    }
    let data = {'userID': userID};
    postData('/manage/resetPassword', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                success('resetPasswordID', 'User\'s password has been reset successfully!');
                $('#resetPasswordID').val('');
                break;
            case 1:
                addError('resetPasswordID', 'User doesn\'t exist in the system.');
                break;
        }
    });
}

function resetDatabase() {
    let dumpPassword = $('#dumpPassword');
    let confirmDumpPassword = $('#confirmDumpPassword');
    let password = dumpPassword.val().trim();
    let confirmPassword = confirmDumpPassword.val().trim();
    if (password === '') {
        addError('dumpPassword', 'You need to enter a password');
        return false;
    }
    if (confirmPassword !== password) {
        addError('dumpPassword', 'Your passwords do not match');
        confirmDumpPassword.val('');
        dumpPassword.focus();
        return false;
    }
    if (confirm('This action will destroy the *entire* database, users, logs, EVERYTHING. Are you sure you want to do this?')) {
        let data = {'password': password};
        postData('/manage/resetDatabase', JSON.stringify(data), function (statusCode) {
            switch (statusCode) {
                case 0:
                    alert('Everything has been deleted, default admin account is created. Page will now refresh.');
                    window.location.reload();
                    break;
                case 1:
                    addError('dumpPassword', 'Your passwords were incorrect!');
                    confirmDumpPassword.val('');
                    dumpPassword.focus();
                    break;
            }
        });
    } else {
        dumpPassword.val('');
        confirmDumpPassword.val('');
    }


}

function logout() {
    postData('/users/logout', '', function () {
        window.location.replace('/manage');
    });
}

function success(id, message) {
    if (message) {
        $('#' + id).notify(message, {className: 'success', elementPosition: 'right middle', autoHideDelay: 3000});
    } else {
        $.notify(id, {className: 'success', autoHideDelay: 3000});
    }
}

function toStatus() {
    window.location.replace('/');
}
