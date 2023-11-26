let contentScrollPosition = 0;
let loginMessage = "";
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    
    // Récupérer l'utilisateur connecté
    var loggedUser = API.retrieveLoggedUser();

    var userSectionHtml = '';

    // Construire la section de l'utilisateur si loggedUser n'est pas null
    if (loggedUser) {
        userSectionHtml = `
            <i title="Modifier votre profil">
                <div class="UserAvatarSmall" userid="${loggedUser.Id}" id="editProfilCmd"
                     style="background-image:url('${loggedUser.Avatar}')"
                     title="${loggedUser.Name}">
                </div>
            </i>`;
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
                <!-- Articles de menu -->
            </div>
        </div>`;
        
    $("#header").html(headerHtml);
}

function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("À propos...", "about");

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

function renderCreateProfil() {
    noTimeout(); // ne pas limiter le temps d’inactivité
    eraseContent(); // effacer le conteneur #content
    UpdateHeader("Inscription", "createProfil"); // mettre à jour l’entête et menu
    $("#newPhotoCmd").hide(); // camouffler l’icone de commande d’ajout de photo
    $("#content").append(`
    …html du formulaire…
    `);
    $('#loginCmd').on('click', renderLoginForm); // call back sur clic
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', renderLoginForm); // call back sur clic
     // ajouter le mécanisme de vérification de doublon de courriel
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
     // call back la soumission du formulaire
    $('#createProfilForm').on("submit", function (event) {
    let profil = getFormData($('#createProfilForm'));
    delete profil.matchedPassword;
    delete profil.matchedEmail;
    event.preventDefault();// empêcher le fureteur de soumettre une requête de soumission
    showWaitingGif(); // afficher GIF d’attente
    createProfil(profil); // commander la création au service API
    });
}

function renderLoginForm() {
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
                    value='${Email}'>
                <span style='color:red'>${EmailError}</span>
                
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

    $('#loginForm').on("submit", function (event) {
        let profil = getFormData($('#loginForm'));
        event.preventDefault(); // empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        // API.login(profil.email, profil.password);
    });
}