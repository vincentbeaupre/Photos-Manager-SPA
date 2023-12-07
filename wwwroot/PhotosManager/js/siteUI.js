let contentScrollPosition = 0;
let loginMessage = "";
let email = "";
let emailError = "";
let passwordError = "";
let verifyMessage = "";
let verifyError = "";
let timeoutDelay = 200;

Init_UI();

function Init_UI() {
    renderLoginForm();
    initTimeout(timeoutDelay, renderExpiredSession);
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
async function getUsers(userId) {
    
    let users = await API.GetAccounts();

    if (API.error) {
        renderError("Un problème est survenu...");
    }
    else {
        users = users.data.filter(user => user.Id !== userId);
        return users;
    }
}
async function login(credentials) {

    email = credentials.Email;

    await API.login(credentials.Email, credentials.Password);

    let loggedUser = API.retrieveLoggedUser();

    //vérifie le statut de l'objet API pour déterminer le succès de login
    if (API.error) {
        switch (API.currentStatus) {
            case 482:
                passwordError = "Mot de passe incorrect";
                emailError = "";
                renderLoginForm();
                break;
            case 481:
                passwordError = "";
                emailError = "Courriel introuvable";
                renderLoginForm();
                break;
            default:
                renderError("Le serveur ne répond pas");
        }
    }
    else {

        if (loggedUser.IsBlocked) {
            logout();
            loginMessage = "Vous avez été bloqué par l'administrateur";
        }
        else if (loggedUser.VerifyCode != "verified") {
            renderVerify();
        }
        else {
            renderPhotos();
        }

    }
}
async function logout() {
    await API.logout();
    email = "";
    emailError = "";
    passwordError = "";
    renderLoginForm();
}
async function createProfile(profile) {
    
    await API.register(profile);

    if (API.error) {
        renderError("Un problème est survenu lors de la création de votre profil.");
    }
    else {
        loginMessage = "Votre compte a été créé avec succès. Veuillez prendre vos courriels pour récupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion.";
        renderLoginForm();
    }
}
async function deleteProfile() {
    
    let loggedUser = API.retrieveLoggedUser();

    await API.unsubscribeAccount(loggedUser.Id);

    if (API.error) {
        renderError("Un problème est survenu lors de la suppression de votre profil.");
    }
    else {
        logout();
        loginMessage = "Votre compte a été supprimé avec succès.";
    }
}
async function modifyProfile(profile) {
    
    await API.modifyUserProfil(profile);

    if (API.error) {
        renderError("Un problème est survenu lors de la modification de votre profil.");
    }
    else {
        let loggedUser = API.retrieveLoggedUser();

        if (loggedUser.VerifyCode !== "verified") {
            verifyMessage = "Votre adresse courriel a été mise à jour avec succès. "
            renderVerify();
        }
        else {
            renderPhotos();
        }
    }
}
async function manageAdmin(userId) {
    await API.manageAdmin(userId);

    if (API.error) {
        renderError("Une erreur est survenue...")
    }
    else {
        renderManageUsers();
    }

}
async function manageBlock(userId) {
    await API.manageBlock(userId);

    if (API.error) {
        renderError("Une erreur est survenue...")
    }
    else {
        renderManageUsers();
    }

}
// à modifier après avoir géré les photos...
async function deleteUser(userId) {
    await API.unsubscribeAccount(userId);

    if (API.error) {
        renderError(API.error)
    }
    else {
        renderManageUsers();
    }

}
async function verify(verifyCode) {

    let loggedUser = API.retrieveLoggedUser();

    await API.verifyEmail(loggedUser.Id, verifyCode)

    if (API.error) {
        switch (API.currentStatus) {
            case 480:
                verifyError = "Le code de vérification ne correspond pas";
                renderVerify();
                break;
            default:
                renderError("Le serveur ne répond pas");
        } 
    }
    else {
        renderPhotos();
    }

}
/// Views rendering
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function UpdateHeader(title, activeMenuId) {

    let loggedUser = API.retrieveLoggedUser();
    var userSectionHtml = '';
    var menuItemsHtml = '';

    // Construire la section de l'utilisateur si loggedUser n'est pas null
    if (loggedUser) {

        // Photo de l'utilisateur (editProfil)
        userSectionHtml = `
            <i title="Modifier votre profil">
                <div class="UserAvatarSmall" userid="${loggedUser.Id}" id="editProfileCmd"
                     style="background-image:url('${loggedUser.Avatar}')"
                     title="${loggedUser.Name}">
                </div>
            </i>`;

        // Manage Users item (admin only)
        if (loggedUser.VerifyCode === "verified" && loggedUser.Authorizations.readAccess === 2) {
            menuItemsHtml += `
                <span class="dropdown-item" id="manageUsersCmd">
                    <i class="menuIcon fas fa-user-cog mx-2"></i>
                    Gestion des usagers
                </span>
                <div class="dropdown-divider"></div>`;
        }

        menuItemsHtml += `
        <span class="dropdown-item" id="logoutCmd">
            <i class="menuIcon fa fa-sign-out mx-2"></i>
            Déconnexion
        </span>`;

        if (loggedUser.VerifyCode === "verified") {
            // Menu Items for all users if verified(admin or not)
            menuItemsHtml += `
            <span class="dropdown-item" id="editProfilMenuCmd">
                <i class="menuIcon fa fa-user-edit mx-2"></i>
                Modifier votre profil
            </span>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="listPhotosMenuCmd">
                <i class="menuIcon fa fa-image mx-2"></i>
                Liste des photos
            </span>`;

            if(activeMenuId === "listPhotos") {
                menuItemsHtml += `
                <div class="dropdown-divider"></div>
                <span class="dropdown-item" id="sortByDateCmd">
                    <i class="menuIcon fa fa-check mx-2"></i>
                    <i class="menuIcon fa fa-calendar mx-2"></i>
                    Photos par date de création
                </span>
                <span class="dropdown-item" id="sortByOwnersCmd">
                    <i class="menuIcon fa fa-fw mx-2"></i>
                    <i class="menuIcon fa fa-users mx-2"></i>
                    Photos par créateur
                </span>
                <span class="dropdown-item" id="sortByLikesCmd">
                    <i class="menuIcon fa fa-fw mx-2"></i>
                    <i class="menuIcon fa fa-user mx-2"></i>
                    Photos les plus aiméés
                </span>
                <span class="dropdown-item" id="ownerOnlyCmd">
                    <i class="menuIcon fa fa-fw mx-2"></i>
                    <i class="menuIcon fa fa-user mx-2"></i>
                    Mes photos
                </span>`;
            }
        }


    }
    else {
        // Login command
        menuItemsHtml = `
        <span class="dropdown-item" id="loginCmd">
            <i class="menuIcon fa fa-sign-in mx-2"></i>
            Connexion
        </span>`;
    }

    if (!loggedUser || loggedUser.VerifyCode === "verified") {
        menuItemsHtml += `
        <div class="dropdown-divider"></div>
        <span class="dropdown-item" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i>
            À propos...
        </span>`;
    }

    var headerHtml = `
        <span title="Liste des photos" id="listPhotosCmd">
            <img src="images/PhotoCloudLogo.png" class="appLogo">
        </span>
        <span class="viewTitle">${title}
            <div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
        </span>
        <div class="headerMenusContainer">
            <span>&nbsp;</span> <!--filler-->
            ${userSectionHtml}
            <div class="dropdown ms-auto dropdownLayout">
                <div data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="cmdIcon fa fa-ellipsis-vertical"></i>
                </div>
                <div class="dropdown-menu noselect">
                ${menuItemsHtml}

                </div>
            </div>
        </div>`;

    $("#header").html(headerHtml);

    $("#aboutCmd").click(function () {
        renderAbout();
    });

    if (loggedUser) {
        $("#logoutCmd").click(function () {
            logout();
        });

        if (loggedUser.VerifyCode === "verified") {
            $("#editProfileCmd").click(function () {
                renderModifyProfile();
            });
            $("#manageUsersCmd").click(function () {
                renderManageUsers();
            });
            $("#editProfilMenuCmd").click(function () {
                renderModifyProfile();
            });
            $("#listPhotosMenuCmd").click(function () {
                renderPhotos()
            });
        }

    } else {
        $("#loginCmd").click(function () {
            renderLoginForm();
        });
    }
}
function renderAbout() {

    let loggedUser = API.retrieveLoggedUser();

    if (loggedUser) {
        timeout();
    }
    else {
        noTimeout();
    }

    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("À propos...", "about");
    $("#newPhotoCmd").hide();

    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de photos</h2>
                <hr>
                <p>
                    Petite application de gestion de photos multiusagers à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateProfil() {
    noTimeout();
    eraseContent();
    UpdateHeader("Inscription", "createProfil");
    $("#newPhotoCmd").hide();

    $("#content").append(`
        <form class="form" id="createProfilForm">
            <fieldset>
                <legend>Adresse ce courriel</legend>
                <input type="email"
                       class="form-control Email"
                       name="Email"
                       id="Email"
                       placeholder="Courriel"
                       required
                       RequireMessage='Veuillez entrer votre courriel'
                       InvalidMessage='Courriel invalide'
                       CustomErrorMessage="Ce courriel est déjà utilisé"/>
                <input class="form-control MatchedInput"
                       type="text"
                       matchedInputId="Email"
                       name="matchedEmail"
                       id="matchedEmail"
                       placeholder="Vérification"
                       required
                       RequireMessage='Veuillez entrez de nouveau votre courriel'
                       InvalidMessage="Les courriels ne correspondent pas" />
            </fieldset>
            <fieldset>
                <legend>Mot de passe</legend>
                <input type="password"
                       class="form-control"
                       name="Password"
                       id="Password"
                       placeholder="Mot de passe"
                       required
                       RequireMessage='Veuillez entrer un mot de passe'
                       InvalidMessage='Mot de passe trop court'/>
                <input class="form-control MatchedInput"
                       type="password"
                       matchedInputId="Password"
                       name="matchedPassword"
                       id="matchedPassword"
                       placeholder="Vérification"
                       required
                       InvalidMessage="Ne correspond pas au mot de passe" />
            </fieldset>
            <fieldset>
                <legend>Nom</legend>
                <input type="text"
                       class="form-control Alpha"
                       name="Name"
                       id="Name"
                       placeholder="Nom"
                       required
                       RequireMessage='Veuillez entrer votre nom'
                       InvalidMessage='Nom invalide'/>
            </fieldset>
            <fieldset>
                <legend>Avatar</legend>
                <div class='imageUploader'
                     newImage='true'
                     controlId='Avatar'
                     imageSrc='images/no-avatar.png'
                     waitingImage="images/Loading_icon.gif">
                </div>
            </fieldset>
            <input type='submit' name='submit' id='saveUserCmd' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
    `);

    $('#loginCmd').on('click', renderLoginForm); // call back sur clic
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', renderLoginForm); // call back sur clic

    // ajouter le mécanisme de vérification de doublon de courriel
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');

    // call back la soumission du formulaire
    $('#createProfilForm').on("submit", function (event) {
        let profile = getFormData($('#createProfilForm'));
        delete profile.matchedPassword;
        delete profile.matchedEmail;
        event.preventDefault(); // empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        createProfile(profile); // commander la création au service API
    });
}
function renderDeleteProfile() {
    timeout();
    eraseContent();
    UpdateHeader("Retrait de compte ", "deleteProfile");
    $("#newPhotoCmd").hide();

    $("#content").append(`
        <div class="content" style="text-align:center">
            <h2>Voulez-vous vraiment supprimer votre compte?</h2>
            <div class="cancel">
                <button class="form-control btn-danger" id="deleteCmd">Supprimer mon compte</button>
                <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
            </div>
        </div>
    `);

    $('#deleteCmd').on('click', deleteProfile);
    $('#abortCmd').on('click', renderPhotos);
}
function renderDeleteUser(user) {
    timeout();
    eraseContent();
    UpdateHeader("Retrait de compte ", "deleteProfile");
    $("#newPhotoCmd").hide();

    $("#content").append(`
        <div class="content" style="text-align: center;">
            <h2>Voulez-vous vraiment supprimer cet usager et toutes ses photos?</h2>
            <div class="UserLayout" style="margin: 0 auto;">
                <div class="UserAvatar" style="background-image: url('${user.Avatar}');"></div>
                <div class="UserInfo">
                    <div class="UserName">${user.Name}</div>
                    <div class="UserEmail">${user.Email}</div>
                </div>
            </div>
            <div class="cancel">
                <button class="form-control btn-danger" id="deleteUserCmd">Supprimer ce compte</button>
                <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
            </div>
        </div>
    `);

    $('#deleteUserCmd').on('click', function() {
        deleteUser(user.Id);
    });
    $('#abortCmd').on('click', renderManageUsers);
}
function renderExpiredSession() {
    loginMessage = "Votre session est expirée";
    logout();
}
function renderLoginForm() {

    let loggedUser = API.retrieveLoggedUser();
    
    if (loggedUser) {
        logout();
    }

    noTimeout();
    eraseContent();
    UpdateHeader("Connexion", "login");
    $("#newPhotoCmd").hide();

    $("#content").append(`
        <div class="content" style="text-align:center">
            <h3>${loginMessage}</h3>
            <form class="form" id="loginForm">
                <input type='email' 
                    name='Email' 
                    class="form-control" 
                    required 
                    RequireMessage='Veuillez entrer votre courriel'
                    InvalidMessage='Courriel invalide' 
                    placeholder="Courriel" 
                    value='${email}'>
                <span style='color:red'>${emailError}</span>
                
                <input type='password' 
                    name='Password' 
                    placeholder='Mot de passe' 
                    class="form-control" 
                    required
                    RequireMessage='Veuillez entrer votre mot de passe'>
                <span style='color:red'>${passwordError}</span>
                
                <input type='submit' 
                    name='submit' 
                    value="Entrer" 
                    class="form-control btn-primary">
            </form>

            <div class="form">
                <hr>
                <button class="form-control btn-info" id="createProfilCmd">Nouveau compte</button>
            </div>
        </div>
    `);

    initFormValidation();
    loginMessage = "";

    $('#loginForm').on("submit", function (event) {
        let credentials = getFormData($('#loginForm'));
        event.preventDefault(); // empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        login(credentials);
    });

    $('#createProfilCmd').on("click", function () {
        renderCreateProfil();
    });
}
async function renderManageUsers() {
    timeout();
    eraseContent();
    UpdateHeader("Gestion des usagers", "manageUsers");
    $("#newPhotoCmd").hide();

    let loggedUser = API.retrieveLoggedUser();
    let users = await getUsers(loggedUser.Id);

    let content = "";

    users.forEach(user => {
        let modifyAccessIcon = user.Authorizations.readAccess === 2 ? "fas fa-user-cog" : "fas fa-user-alt";
        let blockUserIcon = user.Authorizations.readAccess === -1 ? "fa fa-ban redCmd " : "fa-regular fa-circle greenCmd";

        content += `
        <div class="UserContainer">
            <div class="UserLayout">
                <div class="UserAvatar" style="background-image: url('${user.Avatar}');"></div>
                <div class="UserInfo">
                    <div class="UserName">${user.Name}</div>
                    <div class="UserEmail">${user.Email}</div>
                </div>
            </div>
            <div class="UserCommandPanel">
            <div class="cmdIcon dodgerblueCmd ${modifyAccessIcon}" id="manageAdminCmd-${user.Id}"></div>
            <div class="cmdIcon ${blockUserIcon}" id="manageBlockCmd-${user.Id}"></div>
            <div class="cmdIcon fas fa-user-slash goldenrodCmd" id="deleteUserCmd-${user.Id}"></div>
            </div>
        </div>
        `;
    });
    
    $("#content").append(content);

    users.forEach(user => {
        $(`#manageAdminCmd-${user.Id}`).click(() => manageAdmin(user.Id));
        $(`#manageBlockCmd-${user.Id}`).click(() => manageBlock(user.Id));
        $(`#deleteUserCmd-${user.Id}`).click(() => renderDeleteUser(user));
    });

}
function renderModifyProfile() {

    let loggedUser = API.retrieveLoggedUser();

    timeout();
    eraseContent();
    UpdateHeader("Mon profil", "modifyProfile");
    $("#newPhotoCmd").hide();

    $("#content").append(`
        <form class="form" id="editProfileForm">
            <input type="hidden" name="Id" id="Id" value="${loggedUser.Id}">
            <fieldset>
                <legend>Adresse ce courriel</legend>
                <input type="email"
                    class="form-control Email"
                    name="Email"
                    id="Email"
                    placeholder="Courriel"
                    required
                    RequireMessage='Veuillez entrer votre courriel'
                    InvalidMessage='Courriel invalide'
                    CustomErrorMessage="Ce courriel est déjà utilisé"
                    value="${loggedUser.Email}" >
                <input class="form-control MatchedInput"
                    type="text"
                    matchedInputId="Email"
                    name="matchedEmail"
                    id="matchedEmail"
                    placeholder="Vérification"
                    required
                    RequireMessage='Veuillez entrez de nouveau votre courriel'
                    InvalidMessage="Les courriels ne correspondent pas"
                    value="${loggedUser.Email}" >
            </fieldset>
            <fieldset>
                <legend>Mot de passe</legend>
                <input type="password"
                    class="form-control"
                    name="Password"
                    id="Password"
                    placeholder="Mot de passe"
                    InvalidMessage='Mot de passe trop court' >
                <input class="form-control MatchedInput"
                    type="password"
                    matchedInputId="Password"
                    name="matchedPassword"
                    id="matchedPassword"
                    placeholder="Vérification"
                    InvalidMessage="Ne correspond pas au mot de passe" >
            </fieldset>
            <fieldset>
                <legend>Nom</legend>
                <input type="text"
                    class="form-control Alpha"
                    name="Name"
                    id="Name"
                    placeholder="Nom"
                    required
                    RequireMessage='Veuillez entrer votre nom'
                    InvalidMessage='Nom invalide'
                    value="${loggedUser.Name}" >
            </fieldset>
            <fieldset>
                <legend>Avatar</legend>
                <div class='imageUploader'
                    newImage='false'
                    controlId='Avatar'
                    imageSrc='${loggedUser.Avatar}'
                    waitingImage="images/Loading_icon.gif">
                </div>
            </fieldset>
            <input type='submit'
                name='submit'
                id='saveUserCmd'
                value="Enregistrer"
                class="form-control btn-primary">
            </form>
            <div class="cancel">
                <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
            </div>
            <div class="cancel"> <hr>
                <button class="form-control btn-warning" id="deleteCmd">Effacer le compte</button>
            </div>
        `);
    initImageUploaders();
    initFormValidation();

    $('#abortCmd').on('click', renderPhotos);
    $('#deleteCmd').on('click', renderDeleteProfile);

    // ajouter le mécanisme de vérification de doublon de courriel
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');

    // call back la soumission du formulaire
    $('#editProfileForm').on("submit", function (event) {
        let profile = getFormData($('#editProfileForm'));
        delete profile.matchedPassword;
        delete profile.matchedEmail;
        event.preventDefault();
        showWaitingGif();
        modifyProfile(profile); // commander la modification au service API
    });
}
// Pipeline vers renderPhotos
function renderPhotos() {
    timeout();
    eraseContent();
    UpdateHeader("Liste des Photos", "listPhotos")

    let loggedUser = API.retrieveLoggedUser();

    if (loggedUser) {
        renderPhotosList();
    }
    else {
        renderLoginForm();
    }
}
function renderPhotosList() {
    timeout();
    eraseContent();
    UpdateHeader("Liste des photos", "listPhotos");

    $("#content").append(`
        <h2>Liste des photos (à venir)</h2>
    `);
}
function renderVerify() {
    timeout();
    eraseContent();
    UpdateHeader("Vérification", "verify");
    $("#newPhotoCmd").hide();

    $("#content").append(`
        <div class="content" style="text-align:center">
            <p><strong>${verifyMessage}</strong></p>
            <p>Veuillez entrer le code de vérification que vous avez reçu par courriel</p>
            <form class="form" id="verifyForm">
                <input type='text' 
                    name='VerifyCode' 
                    class="form-control" 
                    required 
                    RequireMessage='Veuillez entrer votre code de confirmation'
                    InvalidMessage='Code invalide' 
                    placeholder="Code de vérification de courriel" 
                    value=''>
                <span style='color:red'>${verifyError}</span>
                
                <input type='submit' 
                    name='submit' 
                    value="Vérifier" 
                    class="form-control btn-primary">
            </form>
        </div>
    `);
    
    initFormValidation();

    verifyMessage = "";

    $('#verifyForm').on("submit", function (event) {
        let data = getFormData($('#verifyForm'));
        event.preventDefault();
        showWaitingGif(); // afficher GIF d’attente
        verify(data.VerifyCode);
    });
}